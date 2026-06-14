import {
  addCardsToBottom,
  canBeat,
  canCommittedMidfielderBeat,
  createGoalkeeperDeck,
  createPlayerDecks,
  createSeededRandom,
  drawTopCard,
  getRankValue,
  shuffleDeck,
  type Card,
  type Deck,
  type GoalkeeperCard,
  type RandomGenerator
} from '../cards';
import type { PlayerControllerType } from '../ai';
import { createDefaultSquad } from '../data/defaultSquads';
import { loadSquad } from '../services/squadStorage';
import type { GameEvent, ScorerSnapshot } from './GameEvent';
import type { GameState } from './GameState';
import { createGoalkeeperKitPair, createMatchTeamSetup, type MatchTeamSetups } from './MatchTeamSetup';
import type { Player } from './Player';
import { getOptionalFieldPlayerForCard } from './squadResolver';
import {
  createEmptyField,
  MIDFIELDER_POSITION_IDS,
  RESTORE_ORDER,
  TARGET_LINE_POSITIONS,
  type FieldPositionId,
  type MidfielderPositionId,
  type PlayerField
} from './PlayerField';
import {
  getCardsInCurrentTargetLine,
  getCurrentTargetLine,
  restoreField
} from './fieldRules';

export interface StartNewGameOptions {
  seed?: string;
  player1Name?: string;
  player2Name?: string;
  player1FlagCode?: string;
  player2FlagCode?: string;
  player1ControllerType?: PlayerControllerType;
  player2ControllerType?: PlayerControllerType;
}

type FinishAttackReason = 'MISS' | 'GOAL' | 'NO_MORE_ATTACK_CARDS';
type FinishGameReason = 'CANNOT_RESTORE_FIELD' | 'NO_ATTACK_CARD' | 'NO_FIRST_PLAYER_CARD';

export class GameEngine {
  private state: GameState;
  private random: RandomGenerator;

  public constructor(initialState?: GameState) {
    this.state = initialState ?? createInitialState();
    this.random = Math.random;
  }

  public startNewGame(options: StartNewGameOptions = {}): GameState {
    this.random = options.seed === undefined ? Math.random : createSeededRandom(hashSeed(options.seed));
    const setupRandom =
      options.seed === undefined ? Math.random : createSeededRandom(hashSeed(`${options.seed}:match-setup`));
    const playerOneTeamId = options.player1FlagCode ?? 'fr';
    const playerTwoTeamId = options.player2FlagCode ?? 'es';

    const [playerOneDeck, playerTwoDeck] = createPlayerDecks();
    const [playerOneGoalkeeperKitId, playerTwoGoalkeeperKitId] = createGoalkeeperKitPair(setupRandom);
    const players: [Player, Player] = [
      createPlayer(
        'PLAYER_1',
        options.player1Name ?? 'Player 1',
        playerOneTeamId,
        'RED',
        shuffleDeck(playerOneDeck, this.random),
        createGoalkeeperDeck(
          options.seed === undefined ? Math.random : createSeededRandom(hashSeed(`${options.seed}:PLAYER_1:gk-deck`))
        )
      ),
      createPlayer(
        'PLAYER_2',
        options.player2Name ?? 'Player 2',
        playerTwoTeamId,
        'BLACK',
        shuffleDeck(playerTwoDeck, this.random),
        createGoalkeeperDeck(
          options.seed === undefined ? Math.random : createSeededRandom(hashSeed(`${options.seed}:PLAYER_2:gk-deck`))
        )
      )
    ];
    const matchSetups: MatchTeamSetups = {
      [players[0].id]: createMatchTeamSetup({
        teamId: playerOneTeamId,
        squad: loadSquad(playerOneTeamId),
        goalkeeperKitId: playerOneGoalkeeperKitId,
        controllerType: options.player1ControllerType
      }),
      [players[1].id]: createMatchTeamSetup({
        teamId: playerTwoTeamId,
        squad: loadSquad(playerTwoTeamId),
        goalkeeperKitId: playerTwoGoalkeeperKitId,
        controllerType: options.player2ControllerType
      })
    };

    this.state = createInitialState(players, matchSetups);
    this.appendLog({ type: 'GAME_STARTED' });
    this.setupInitialFields();
    this.determineFirstPlayer();

    if (this.state.phase !== 'GAME_OVER') {
      this.state.phase = 'ENDING_TURN';
    }

    return this.state;
  }

  public getState(): Readonly<GameState> {
    return this.state;
  }

  public getLegalTargets(): string[] {
    return [...this.state.legalTargetPositionIds];
  }

  public getCommittableMidfielderPositionIds(): MidfielderPositionId[] {
    this.refreshCommittableMidfielderPositionIds();

    return [...(this.state.committableMidfielderPositionIds ?? [])];
  }

  public canCommitMidfielder(positionId: string): positionId is MidfielderPositionId {
    return isMidfielderPositionId(positionId) && this.getCommittableMidfielderPositionIds().includes(positionId);
  }

  public canUseMidfieldGap(positionId: string): positionId is MidfielderPositionId {
    return isMidfielderPositionId(positionId) && this.getLegalMidfieldGapPositionIds().includes(positionId);
  }

  public startNextTurn(): GameState {
    if (this.state.phase === 'NOT_STARTED') {
      throw new Error('Cannot start next turn before starting a game.');
    }

    if (this.state.phase === 'WAITING_FOR_TARGET') {
      throw new Error('Cannot start next turn while waiting for target selection.');
    }

    if (this.state.phase === 'GAME_OVER') {
      return this.state;
    }

    this.state.turnNumber += 1;
    this.state.attackCard = null;
    this.clearAttackCardSource();
    this.state.attackBank = [];
    this.state.legalTargetPositionIds = [];
    this.state.committedMidfielderPositionIds = [];
    this.state.legalMidfieldGapPositionIds = [];

    if (!this.restoreActivePlayerField()) {
      return this.state;
    }

    this.state.phase = 'WAITING_FOR_ATTACK_CARD';
    this.refreshCommittableMidfielderPositionIds();
    return this.state;
  }

  public drawAttackCard(): GameState {
    if (this.state.phase !== 'WAITING_FOR_ATTACK_CARD') {
      throw new Error('Cannot draw an attack card because the game is not waiting for deck selection.');
    }

    if (!this.drawNextAttackCard()) {
      return this.state;
    }

    this.resolveAttackCard();
    return this.state;
  }

  public commitMidfielder(positionId: string): GameState {
    if (this.state.phase !== 'WAITING_FOR_ATTACK_CARD') {
      throw new Error('Cannot commit a midfielder because the game is not waiting for an attack source.');
    }

    if (!isMidfielderPositionId(positionId)) {
      throw new Error(`Cannot commit "${positionId}" because it is not a midfield position.`);
    }

    if (!this.canCommitMidfielder(positionId)) {
      return this.state;
    }

    const activePlayer = this.getActivePlayer();
    const committedCard = activePlayer.field[positionId];

    if (committedCard === null) {
      throw new Error(`Cannot commit midfielder "${positionId}" because the own slot is empty.`);
    }

    activePlayer.field[positionId] = null;
    this.state.attackCard = committedCard;
    this.state.currentAttackCardSource = 'MIDFIELDER';
    this.state.currentAttackingMidfielderPositionId = positionId;
    this.state.committedMidfielderPositionIds = appendUniqueMidfielderPosition(
      this.state.committedMidfielderPositionIds ?? [],
      positionId
    );
    this.state.committableMidfielderPositionIds = [];
    this.state.legalMidfieldGapPositionIds = [];
    this.appendLog({
      type: 'MIDFIELDER_COMMITTED',
      playerId: activePlayer.id,
      turnNumber: this.state.turnNumber,
      positionId,
      card: committedCard
    });

    return this.resolveCommittedMidfielderDuel(positionId);
  }

  public useMidfieldGap(positionId: string): GameState {
    if (this.state.phase !== 'WAITING_FOR_TARGET') {
      throw new Error('Cannot use a midfield gap because the game is not waiting for target selection.');
    }

    if (!isMidfielderPositionId(positionId)) {
      throw new Error(`Cannot use "${positionId}" because it is not a midfield position.`);
    }

    if (!this.canUseMidfieldGap(positionId)) {
      throw new Error(`Cannot use midfield gap "${positionId}" in the current attack state.`);
    }

    const attackCard = this.state.attackCard;

    if (attackCard === null) {
      throw new Error('Cannot use a midfield gap because there is no active attack card.');
    }

    const activePlayer = this.getActivePlayer();
    this.state.attackBank.push(attackCard);
    this.state.attackCard = null;
    this.clearAttackCardSource();
    this.state.legalTargetPositionIds = [];
    this.state.counterattackMidfieldGap = this.state.counterattackMidfieldGap
      ? { ...this.state.counterattackMidfieldGap, used: true }
      : null;
    this.state.legalMidfieldGapPositionIds = [];
    this.appendLog({
      type: 'MIDFIELD_GAP_USED',
      playerId: activePlayer.id,
      turnNumber: this.state.turnNumber,
      positionId,
      attackerCard: attackCard
    });

    if (!this.hasAvailableNextAttackSource()) {
      this.finishAttack('NO_MORE_ATTACK_CARDS');
      return this.state;
    }

    this.state.phase = 'WAITING_FOR_ATTACK_CARD';
    this.refreshCommittableMidfielderPositionIds();
    return this.state;
  }

  public selectTarget(positionId: string): GameState {
    if (this.state.phase !== 'WAITING_FOR_TARGET') {
      throw new Error('Cannot select a target because the game is not waiting for target selection.');
    }

    if (!isFieldPositionId(positionId)) {
      throw new Error(`Cannot select target "${positionId}" because the position does not exist.`);
    }

    const activePlayer = this.getActivePlayer();
    const opponent = this.getOpponentPlayer();
    const targetCard = opponent.field[positionId];

    if (targetCard === null) {
      throw new Error(`Cannot select target "${positionId}" because the position is empty.`);
    }

    const currentLine = getCurrentTargetLine(opponent.field);

    if (currentLine === null || !TARGET_LINE_POSITIONS[currentLine].includes(positionId)) {
      throw new Error(`Cannot select target "${positionId}" because it is not in the current target line.`);
    }

    const attackCard = this.state.attackCard;

    if (attackCard === null) {
      throw new Error('Cannot select a target because there is no active attack card.');
    }

    if (this.state.counterattackMidfieldGap != null && currentLine !== 'MIDFIELD') {
      this.closeCounterattackMidfieldGap();
    }

    if (positionId === 'goalkeeper') {
      return this.resolveGoalkeeperShot(activePlayer, opponent, attackCard, targetCard as GoalkeeperCard);
    }

    const outfieldTargetCard = targetCard as Card;

    if (!canBeatFieldTarget(attackCard, outfieldTargetCard, positionId)) {
      return this.resolveFailedFieldDuel(activePlayer, attackCard, outfieldTargetCard, positionId);
    }

    opponent.field[positionId] = null;
    this.state.attackBank.push(attackCard, outfieldTargetCard);
    this.state.attackCard = null;
    this.clearAttackCardSource();
    this.state.legalTargetPositionIds = [];
    this.state.legalMidfieldGapPositionIds = [];
    this.appendLog({
      type: 'CARD_DEFEATED',
      playerId: activePlayer.id,
      turnNumber: this.state.turnNumber,
      positionId,
      attackerCard: attackCard,
      defenderCard: outfieldTargetCard
    });

    if (!this.hasAvailableNextAttackSource()) {
      this.finishAttack('NO_MORE_ATTACK_CARDS');
      return this.state;
    }

    this.state.phase = 'WAITING_FOR_ATTACK_CARD';
    this.refreshCommittableMidfielderPositionIds();
    return this.state;
  }

  private resolveCommittedMidfielderDuel(positionId: MidfielderPositionId): GameState {
    const activePlayer = this.getActivePlayer();
    const opponent = this.getOpponentPlayer();
    const attackCard = this.state.attackCard;
    const targetCard = opponent.field[positionId];

    if (attackCard === null) {
      throw new Error('Cannot resolve committed midfielder duel without an attack card.');
    }

    if (targetCard === null) {
      throw new Error(`Cannot resolve committed midfielder duel because "${positionId}" is empty.`);
    }

    if (!canCommittedMidfielderBeat(attackCard, targetCard)) {
      return this.resolveFailedFieldDuel(activePlayer, attackCard, targetCard, positionId);
    }

    opponent.field[positionId] = null;
    this.state.attackBank.push(attackCard, targetCard);
    this.state.attackCard = null;
    this.clearAttackCardSource();
    this.state.legalTargetPositionIds = [];
    this.state.legalMidfieldGapPositionIds = [];
    this.appendLog({
      type: 'CARD_DEFEATED',
      playerId: activePlayer.id,
      turnNumber: this.state.turnNumber,
      positionId,
      attackerCard: attackCard,
      defenderCard: targetCard
    });

    if (!this.hasAvailableNextAttackSource()) {
      this.finishAttack('NO_MORE_ATTACK_CARDS');
      return this.state;
    }

    this.state.phase = 'WAITING_FOR_ATTACK_CARD';
    this.refreshCommittableMidfielderPositionIds();
    return this.state;
  }

  private refreshCommittableMidfielderPositionIds(): void {
    this.state.committableMidfielderPositionIds =
      this.state.phase === 'WAITING_FOR_ATTACK_CARD' ? this.computeCommittableMidfielderPositionIds() : [];
  }

  private computeCommittableMidfielderPositionIds(): MidfielderPositionId[] {
    if (this.state.attackCard !== null || this.state.activePlayerId === null) {
      return [];
    }

    const activePlayer = this.getActivePlayer();
    const opponent = this.getOpponentPlayer();

    if (getCurrentTargetLine(opponent.field) !== 'MIDFIELD') {
      return [];
    }

    const committedPositionIds = this.state.committedMidfielderPositionIds ?? [];

    return MIDFIELDER_POSITION_IDS.filter(
      (positionId) => {
        const attackerCard = activePlayer.field[positionId];
        const defenderCard = opponent.field[positionId];

        return (
          attackerCard !== null &&
          defenderCard !== null &&
          !committedPositionIds.includes(positionId) &&
          canCommittedMidfielderBeat(attackerCard, defenderCard)
        );
      }
    );
  }

  private getLegalMidfieldGapPositionIds(): MidfielderPositionId[] {
    const gap = this.state.counterattackMidfieldGap;

    if (
      gap == null ||
      gap.used ||
      !['DRAWING_ATTACK_CARD', 'WAITING_FOR_TARGET'].includes(this.state.phase) ||
      this.state.currentAttackCardSource !== 'DECK' ||
      this.state.attackCard === null ||
      this.state.activePlayerId === null
    ) {
      return [];
    }

    const opponent = this.getOpponentPlayer();

    if (opponent.id !== gap.defendingPlayerId) {
      return [];
    }

    return gap.positionIds.filter((positionId) => opponent.field[positionId] === null);
  }

  private hasAvailableNextAttackSource(): boolean {
    const activePlayer = this.getActivePlayer();

    return activePlayer.deck.cards.length > 0 || this.computeCommittableMidfielderPositionIds().length > 0;
  }

  private clearAttackCardSource(): void {
    this.state.currentAttackCardSource = null;
    this.state.currentAttackingMidfielderPositionId = null;
  }

  private closeCounterattackMidfieldGap(): void {
    this.state.counterattackMidfieldGap = null;
    this.state.legalMidfieldGapPositionIds = [];
  }

  private restoreCommittedMidfielderSlotsAfterGoal(
    player: Player,
    positionIds: readonly MidfielderPositionId[]
  ): void {
    for (const positionId of positionIds) {
      if (player.field[positionId] !== null) {
        continue;
      }

      const card = drawTopCard(player.deck);

      if (card === null) {
        return;
      }

      card.color = player.teamColor;
      player.field[positionId] = card;
      this.appendLog({
        type: 'FIELD_CARD_RESTORED',
        playerId: player.id,
        turnNumber: this.state.turnNumber,
        positionId,
        card,
        cardKind: 'outfield',
        cardRank: card.rank
      });
    }
  }

  private setupInitialFields(): void {
    for (const player of this.state.players) {
      const result = restoreField(player);

      if (!result.ok) {
        this.finishGame('NO_FIRST_PLAYER_CARD');
        return;
      }

      for (const entry of result.restoredPositions) {
        this.appendLog({
          type: 'FIELD_CARD_RESTORED',
          playerId: player.id,
          turnNumber: this.state.turnNumber,
          positionId: entry.positionId,
          card: entry.card,
          cardKind: entry.cardKind,
          cardRank: entry.cardRank
        });
      }

      this.appendLog({ type: 'FIELD_RESTORED', playerId: player.id });
    }
  }

  private determineFirstPlayer(): void {
    if (this.state.phase === 'GAME_OVER') {
      return;
    }

    this.state.phase = 'DETERMINING_FIRST_PLAYER';

    while (true) {
      const playerOne = this.state.players[0];
      const playerTwo = this.state.players[1];
      const playerOneCard = drawTopCard(playerOne.deck);
      const playerTwoCard = drawTopCard(playerTwo.deck);

      if (playerOneCard === null || playerTwoCard === null) {
        if (playerOneCard !== null) {
          addCardsToBottom(playerOne.deck, [playerOneCard]);
        }

        if (playerTwoCard !== null) {
          addCardsToBottom(playerTwo.deck, [playerTwoCard]);
        }

        this.finishGame('NO_FIRST_PLAYER_CARD');
        return;
      }

      addCardsToBottom(playerOne.deck, [playerOneCard]);
      addCardsToBottom(playerTwo.deck, [playerTwoCard]);

      const playerOneValue = getRankValue(playerOneCard.rank);
      const playerTwoValue = getRankValue(playerTwoCard.rank);

      if (playerOneValue === playerTwoValue) {
        continue;
      }

      const firstPlayer = playerOneValue > playerTwoValue ? playerOne : playerTwo;
      this.state.activePlayerId = firstPlayer.id;
      this.appendLog({ type: 'FIRST_PLAYER_SELECTED', playerId: firstPlayer.id });
      return;
    }
  }

  private restoreActivePlayerField(): boolean {
    const activePlayer = this.getActivePlayer();
    this.state.phase = 'RESTORING_FIELD';

    const result = restoreField(activePlayer);

    if (!result.ok) {
      this.finishGame('CANNOT_RESTORE_FIELD');
      return false;
    }

    for (const entry of result.restoredPositions) {
      this.appendLog({
        type: 'FIELD_CARD_RESTORED',
        playerId: activePlayer.id,
        turnNumber: this.state.turnNumber,
        positionId: entry.positionId,
        card: entry.card,
        cardKind: entry.cardKind,
        cardRank: entry.cardRank
      });
    }

    this.appendLog({ type: 'FIELD_RESTORED', playerId: activePlayer.id });
    return true;
  }

  private drawNextAttackCard(): boolean {
    const activePlayer = this.getActivePlayer();
    this.state.phase = 'DRAWING_ATTACK_CARD';

    const attackCard = drawTopCard(activePlayer.deck);

    if (attackCard === null) {
      this.finishGame('NO_ATTACK_CARD');
      return false;
    }

    this.state.attackCard = attackCard;
    this.state.currentAttackCardSource = 'DECK';
    this.state.currentAttackingMidfielderPositionId = null;
    this.state.committableMidfielderPositionIds = [];
    this.appendLog({ type: 'ATTACK_CARD_DRAWN', playerId: activePlayer.id, card: attackCard });
    return true;
  }

  private resolveAttackCard(): void {
    const attackCard = this.state.attackCard;

    if (attackCard === null) {
      return;
    }

    const legalTargets = getCardsInCurrentTargetLine(this.getOpponentPlayer().field).map((entry) => entry.positionId);
    const legalGapPositionIds = this.getLegalMidfieldGapPositionIds();

    this.state.legalTargetPositionIds = legalTargets;
    this.state.legalMidfieldGapPositionIds = legalGapPositionIds;

    if (legalTargets.length === 0 && legalGapPositionIds.length === 0) {
      this.state.attackBank.push(attackCard);
      this.state.attackCard = null;
      this.clearAttackCardSource();
      this.appendLog({ type: 'ATTACK_MISSED', card: attackCard });
      this.finishAttack('MISS');
      return;
    }

    this.state.phase = 'WAITING_FOR_TARGET';
    this.appendLog({ type: 'TARGETS_AVAILABLE', positionIds: [...legalTargets, ...legalGapPositionIds] });
  }

  private resolveGoalkeeperShot(
    activePlayer: Player,
    opponent: Player,
    attackCard: Card,
    goalkeeperCard: GoalkeeperCard
  ): GameState {
    this.appendLog({
      type: 'SHOT_ON_GOAL',
      playerId: activePlayer.id,
      attackerCard: attackCard,
      goalkeeperCard
    });

    if (isGoalpostHit(attackCard, goalkeeperCard)) {
      this.state.attackBank.push(attackCard);
      this.state.attackCard = null;
      this.clearAttackCardSource();
      this.state.legalTargetPositionIds = [];
      this.state.legalMidfieldGapPositionIds = [];
      this.appendLog({ type: 'GOALPOST_HIT', playerId: activePlayer.id, attackerCard: attackCard, goalkeeperCard });

      if (!this.hasAvailableNextAttackSource()) {
        this.finishAttack('NO_MORE_ATTACK_CARDS');
        return this.state;
      }

      this.state.phase = 'WAITING_FOR_ATTACK_CARD';
      this.refreshCommittableMidfielderPositionIds();
      return this.state;
    }

    if (!canBeatFieldTarget(attackCard, goalkeeperCard, 'goalkeeper')) {
      this.state.attackBank.push(attackCard);
      this.state.attackCard = null;
      this.clearAttackCardSource();
      this.state.legalTargetPositionIds = [];
      this.state.legalMidfieldGapPositionIds = [];
      this.appendLog({ type: 'GOALKEEPER_SAVE', playerId: activePlayer.id, attackerCard: attackCard, goalkeeperCard });
      this.finishAttack('MISS');
      return this.state;
    }

    opponent.field.goalkeeper = null;
    this.state.attackBank.push(attackCard);
    this.state.attackCard = null;
    this.clearAttackCardSource();
    this.state.legalTargetPositionIds = [];
    this.state.legalMidfieldGapPositionIds = [];
    this.appendLog({
      type: 'CARD_DEFEATED',
      playerId: activePlayer.id,
      turnNumber: this.state.turnNumber,
      positionId: 'goalkeeper',
      attackerCard: attackCard,
      defenderCard: goalkeeperCard
    });
    this.scoreGoal(activePlayer, attackCard);
    recycleGoalkeeperCard(opponent, goalkeeperCard);
    this.appendLog({
      type: 'GOALKEEPER_CARD_RECYCLED',
      playerId: opponent.id,
      turnNumber: this.state.turnNumber,
      goalkeeperRank: goalkeeperCard.rank
    });
    clearField(opponent.field);
    this.finishAttack('GOAL');
    return this.state;
  }

  private resolveFailedFieldDuel(
    activePlayer: Player,
    attackCard: Card,
    defenderCard: Card,
    positionId: FieldPositionId
  ): GameState {
    this.state.attackBank.push(attackCard);
    this.state.attackCard = null;
    this.clearAttackCardSource();
    this.state.legalTargetPositionIds = [];
    this.state.legalMidfieldGapPositionIds = [];
    this.appendLog({
      type: 'ATTACK_MISSED',
      card: attackCard,
      playerId: activePlayer.id,
      turnNumber: this.state.turnNumber,
      positionId,
      attackerCard: attackCard,
      defenderCard
    });
    this.finishAttack('MISS');
    return this.state;
  }

  private finishAttack(reason: FinishAttackReason): void {
    const activePlayer = this.getActivePlayer();
    const committedMidfielderPositionIds = [...(this.state.committedMidfielderPositionIds ?? [])];
    this.closeCounterattackMidfieldGap();
    assignCardsToPlayer(this.state.attackBank, activePlayer);
    addCardsToBottom(activePlayer.deck, this.state.attackBank);
    this.state.attackBank = [];
    this.state.attackCard = null;
    this.clearAttackCardSource();
    this.state.legalTargetPositionIds = [];
    this.state.legalMidfieldGapPositionIds = [];

    if (reason === 'GOAL') {
      this.restoreCommittedMidfielderSlotsAfterGoal(activePlayer, committedMidfielderPositionIds);
    } else if (committedMidfielderPositionIds.length > 0) {
      this.state.counterattackMidfieldGap = {
        defendingPlayerId: activePlayer.id,
        positionIds: committedMidfielderPositionIds,
        used: false,
        turnNumber: this.state.turnNumber + 1
      };
    }

    this.state.committedMidfielderPositionIds = [];
    this.state.committableMidfielderPositionIds = [];
    this.state.phase = 'ENDING_TURN';
    this.appendLog({ type: 'TURN_ENDED', playerId: activePlayer.id });
    this.switchActivePlayer();
  }

  private scoreGoal(activePlayer: Player, scoringCard: Card): void {
    activePlayer.goals += 1;
    this.appendLog({
      type: 'GOAL_SCORED',
      playerId: activePlayer.id,
      turnNumber: this.state.turnNumber,
      attackerCard: scoringCard,
      scorer: createScorerSnapshot(this.state, activePlayer, scoringCard)
    });
  }

  private switchActivePlayer(): void {
    const activePlayer = this.getActivePlayer();
    this.state.activePlayerId = this.state.players.find((player) => player.id !== activePlayer.id)?.id ?? null;
  }

  private finishGame(_reason: FinishGameReason): void {
    const [playerOne, playerTwo] = this.state.players;

    this.state.phase = 'GAME_OVER';
    this.state.attackCard = null;
    this.clearAttackCardSource();
    this.state.attackBank = [];
    this.state.legalTargetPositionIds = [];
    this.state.committableMidfielderPositionIds = [];
    this.state.committedMidfielderPositionIds = [];
    this.state.legalMidfieldGapPositionIds = [];
    this.state.counterattackMidfieldGap = null;

    if (playerOne.goals > playerTwo.goals) {
      this.state.winnerId = playerOne.id;
      this.state.isDraw = false;
    } else if (playerTwo.goals > playerOne.goals) {
      this.state.winnerId = playerTwo.id;
      this.state.isDraw = false;
    } else {
      this.state.winnerId = null;
      this.state.isDraw = true;
    }

    this.appendLog({ type: 'GAME_OVER', winnerId: this.state.winnerId });
  }

  private appendLog(entry: GameEvent): void {
    this.state.log.push(entry);
  }

  private getActivePlayer(): Player {
    const activePlayer = this.state.players.find((player) => player.id === this.state.activePlayerId);

    if (activePlayer === undefined) {
      throw new Error('Active player is not selected.');
    }

    return activePlayer;
  }

  private getOpponentPlayer(): Player {
    const activePlayer = this.getActivePlayer();
    const opponent = this.state.players.find((player) => player.id !== activePlayer.id);

    if (opponent === undefined) {
      throw new Error('Opponent player is not available.');
    }

    return opponent;
  }
}

function createInitialState(players: [Player, Player] = [
  createPlayer('PLAYER_1', 'Player 1', 'fr', 'RED', { cards: [] }),
  createPlayer('PLAYER_2', 'Player 2', 'es', 'BLACK', { cards: [] })
], matchSetups: MatchTeamSetups = createDefaultMatchSetups(players)): GameState {
  return {
    players,
    matchSetups,
    activePlayerId: null,
    phase: 'NOT_STARTED',
    attackCard: null,
    currentAttackCardSource: null,
    currentAttackingMidfielderPositionId: null,
    attackBank: [],
    legalTargetPositionIds: [],
    committableMidfielderPositionIds: [],
    committedMidfielderPositionIds: [],
    legalMidfieldGapPositionIds: [],
    counterattackMidfieldGap: null,
    winnerId: null,
    isDraw: false,
    turnNumber: 0,
    log: []
  };
}

function createDefaultMatchSetups(players: [Player, Player]): MatchTeamSetups {
  return {
    [players[0].id]: createMatchTeamSetup({
      teamId: players[0].flagCode,
      squad: createDefaultSquad(players[0].flagCode),
      goalkeeperKitId: 'gk1'
    }),
    [players[1].id]: createMatchTeamSetup({
      teamId: players[1].flagCode,
      squad: createDefaultSquad(players[1].flagCode),
      goalkeeperKitId: 'gk2'
    })
  };
}

function createPlayer(
  id: string,
  name: string,
  flagCode: string,
  teamColor: Player['teamColor'],
  deck: Deck,
  goalkeeperDeck = createGoalkeeperDeck(createSeededRandom(hashSeed(`${id}:${flagCode}:goalkeeper-deck`)))
): Player {
  return {
    id,
    name,
    flagCode,
    teamColor,
    goals: 0,
    deck,
    goalkeeperDeck,
    field: createEmptyField()
  };
}

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function isFieldPositionId(positionId: string): positionId is FieldPositionId {
  return RESTORE_ORDER.includes(positionId as FieldPositionId);
}

function isMidfielderPositionId(positionId: string): positionId is MidfielderPositionId {
  return MIDFIELDER_POSITION_IDS.includes(positionId as MidfielderPositionId);
}

function appendUniqueMidfielderPosition(
  positionIds: readonly MidfielderPositionId[],
  positionId: MidfielderPositionId
): MidfielderPositionId[] {
  return positionIds.includes(positionId) ? [...positionIds] : [...positionIds, positionId];
}

function canBeatFieldTarget(attacker: Card, defender: Card | GoalkeeperCard, positionId: FieldPositionId): boolean {
  if (positionId === 'goalkeeper') {
    if (attacker.rank === defender.rank) {
      return false;
    }

    if (isStrictGoalkeeperRank(defender.rank)) {
      return getRankValue(attacker.rank) > getRankValue(defender.rank);
    }
  }

  return canBeat(attacker, defender as Card);
}

function isGoalpostHit(attacker: Card, goalkeeper: GoalkeeperCard): boolean {
  return attacker.rank === goalkeeper.rank;
}

function assignCardsToPlayer(cards: readonly Card[], player: Player): void {
  for (const card of cards) {
    card.color = player.teamColor;
  }
}

function recycleGoalkeeperCard(player: Player, card: GoalkeeperCard): void {
  player.goalkeeperDeck.returnToBottom(card);
}

function createScorerSnapshot(state: Readonly<GameState>, player: Player, card: Card): ScorerSnapshot {
  const setup = state.matchSetups[player.id];
  const scorer = getOptionalFieldPlayerForCard(setup, card);

  return {
    playerName: scorer?.name,
    shirtNumber: scorer?.shirtNumber,
    rank: card.rank,
    teamId: setup?.flagCode ?? player.flagCode
  };
}

function isStrictGoalkeeperRank(rank: Card['rank'] | GoalkeeperCard['rank']): boolean {
  return ['3', '4', '5', '6', '7', '8', '9', '10'].includes(rank);
}

function clearField(field: PlayerField): void {
  for (const positionId of RESTORE_ORDER) {
    field[positionId] = null;
  }
}

import {
  addCardsToBottom,
  canBeat,
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
import { createDefaultSquad } from '../data/defaultSquads';
import { loadSquad } from '../services/squadStorage';
import type { GameEvent, ScorerSnapshot } from './GameEvent';
import type { GameState } from './GameState';
import { createMatchTeamSetup, pickGoalkeeperKitId, type MatchTeamSetups } from './MatchTeamSetup';
import type { Player } from './Player';
import { getFieldPlayerForCard } from './squadResolver';
import {
  createEmptyField,
  RESTORE_ORDER,
  TARGET_LINE_POSITIONS,
  type FieldPositionId,
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
        goalkeeperKitId: pickGoalkeeperKitId(setupRandom)
      }),
      [players[1].id]: createMatchTeamSetup({
        teamId: playerTwoTeamId,
        squad: loadSquad(playerTwoTeamId),
        goalkeeperKitId: pickGoalkeeperKitId(setupRandom)
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
    this.state.attackBank = [];
    this.state.legalTargetPositionIds = [];

    if (!this.restoreActivePlayerField()) {
      return this.state;
    }

    this.state.phase = 'WAITING_FOR_ATTACK_CARD';
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
    this.state.legalTargetPositionIds = [];
    this.appendLog({
      type: 'CARD_DEFEATED',
      playerId: activePlayer.id,
      turnNumber: this.state.turnNumber,
      positionId,
      attackerCard: attackCard,
      defenderCard: outfieldTargetCard
    });

    if (activePlayer.deck.cards.length === 0) {
      this.finishAttack('NO_MORE_ATTACK_CARDS');
      return this.state;
    }

    this.state.phase = 'WAITING_FOR_ATTACK_CARD';
    return this.state;
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
    this.appendLog({ type: 'ATTACK_CARD_DRAWN', playerId: activePlayer.id, card: attackCard });
    return true;
  }

  private resolveAttackCard(): void {
    const attackCard = this.state.attackCard;

    if (attackCard === null) {
      return;
    }

    const legalTargets = getCardsInCurrentTargetLine(this.getOpponentPlayer().field).map((entry) => entry.positionId);

    this.state.legalTargetPositionIds = legalTargets;

    if (legalTargets.length === 0) {
      this.state.attackBank.push(attackCard);
      this.state.attackCard = null;
      this.appendLog({ type: 'ATTACK_MISSED', card: attackCard });
      this.finishAttack('MISS');
      return;
    }

    this.state.phase = 'WAITING_FOR_TARGET';
    this.appendLog({ type: 'TARGETS_AVAILABLE', positionIds: [...legalTargets] });
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
      this.state.legalTargetPositionIds = [];
      this.appendLog({ type: 'GOALPOST_HIT', playerId: activePlayer.id, attackerCard: attackCard, goalkeeperCard });

      if (activePlayer.deck.cards.length === 0) {
        this.finishAttack('NO_MORE_ATTACK_CARDS');
        return this.state;
      }

      this.state.phase = 'WAITING_FOR_ATTACK_CARD';
      return this.state;
    }

    if (!canBeatFieldTarget(attackCard, goalkeeperCard, 'goalkeeper')) {
      this.state.attackBank.push(attackCard);
      this.state.attackCard = null;
      this.state.legalTargetPositionIds = [];
      this.appendLog({ type: 'GOALKEEPER_SAVE', playerId: activePlayer.id, attackerCard: attackCard, goalkeeperCard });
      this.finishAttack('MISS');
      return this.state;
    }

    opponent.field.goalkeeper = null;
    this.state.attackBank.push(attackCard);
    this.state.attackCard = null;
    this.state.legalTargetPositionIds = [];
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
    this.state.legalTargetPositionIds = [];
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

  private finishAttack(_reason: FinishAttackReason): void {
    const activePlayer = this.getActivePlayer();
    assignCardsToPlayer(this.state.attackBank, activePlayer);
    addCardsToBottom(activePlayer.deck, this.state.attackBank);
    this.state.attackBank = [];
    this.state.attackCard = null;
    this.state.legalTargetPositionIds = [];
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
    this.state.attackBank = [];
    this.state.legalTargetPositionIds = [];

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
    attackBank: [],
    legalTargetPositionIds: [],
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
      goalkeeperKitId: 'gk-1'
    }),
    [players[1].id]: createMatchTeamSetup({
      teamId: players[1].flagCode,
      squad: createDefaultSquad(players[1].flagCode),
      goalkeeperKitId: 'gk-2'
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

function canBeatFieldTarget(attacker: Card, defender: Card | GoalkeeperCard, positionId: FieldPositionId): boolean {
  if (positionId === 'goalkeeper' && isStrictGoalkeeperRank(defender.rank)) {
    return getRankValue(attacker.rank) > getRankValue(defender.rank);
  }

  return canBeat(attacker, defender as Card);
}

function isGoalpostHit(attacker: Card, goalkeeper: GoalkeeperCard): boolean {
  return isStrictGoalkeeperRank(goalkeeper.rank) && attacker.rank === goalkeeper.rank;
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
  const scorer = getFieldPlayerForCard(setup, card);

  return {
    playerName: scorer.name,
    shirtNumber: scorer.shirtNumber,
    rank: card.rank,
    teamId: setup.flagCode
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

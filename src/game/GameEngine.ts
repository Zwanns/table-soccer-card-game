import {
  addCardsToBottom,
  canBeat,
  createPlayerDecks,
  createSeededRandom,
  drawTopCard,
  getRankValue,
  shuffleDeck,
  type Card,
  type Deck,
  type RandomGenerator
} from '../cards';
import type { GameEvent } from './GameEvent';
import type { GameState } from './GameState';
import type { Player } from './Player';
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

    const [playerOneDeck, playerTwoDeck] = createPlayerDecks();
    const players: [Player, Player] = [
      createPlayer('PLAYER_1', options.player1Name ?? 'Player 1', shuffleDeck(playerOneDeck, this.random)),
      createPlayer('PLAYER_2', options.player2Name ?? 'Player 2', shuffleDeck(playerTwoDeck, this.random))
    ];

    this.state = createInitialState(players);
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

    if (!canBeat(attackCard, targetCard)) {
      throw new Error(`Cannot select target "${positionId}" because the attack card cannot beat it.`);
    }

    opponent.field[positionId] = null;
    this.state.attackBank.push(attackCard, targetCard);
    this.state.attackCard = null;
    this.state.legalTargetPositionIds = [];
    this.appendLog({ type: 'CARD_DEFEATED', attackerCard: attackCard, defenderCard: targetCard });

    if (positionId === 'goalkeeper') {
      this.scoreGoal();
      clearField(opponent.field);
      this.finishAttack('GOAL');
      return this.state;
    }

    if (activePlayer.deck.cards.length === 0) {
      this.finishAttack('NO_MORE_ATTACK_CARDS');
      return this.state;
    }

    this.drawNextAttackCard();
    this.resolveAttackCard();
    return this.state;
  }

  private setupInitialFields(): void {
    for (const player of this.state.players) {
      for (const positionId of RESTORE_ORDER) {
        const card = drawTopCard(player.deck);

        if (card === null) {
          this.finishGame('NO_FIRST_PLAYER_CARD');
          return;
        }

        player.field[positionId] = card;
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

    const legalTargets = getCardsInCurrentTargetLine(this.getOpponentPlayer().field)
      .filter((entry) => canBeat(attackCard, entry.card))
      .map((entry) => entry.positionId);

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

  private finishAttack(_reason: FinishAttackReason): void {
    const activePlayer = this.getActivePlayer();
    addCardsToBottom(activePlayer.deck, this.state.attackBank);
    this.state.attackBank = [];
    this.state.attackCard = null;
    this.state.legalTargetPositionIds = [];
    this.state.phase = 'ENDING_TURN';
    this.appendLog({ type: 'TURN_ENDED', playerId: activePlayer.id });
    this.switchActivePlayer();
  }

  private scoreGoal(): void {
    const activePlayer = this.getActivePlayer();
    activePlayer.goals += 1;
    this.appendLog({ type: 'GOAL_SCORED', playerId: activePlayer.id });
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
  createPlayer('PLAYER_1', 'Player 1', { cards: [] }),
  createPlayer('PLAYER_2', 'Player 2', { cards: [] })
]): GameState {
  return {
    players,
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

function createPlayer(id: string, name: string, deck: Deck): Player {
  return {
    id,
    name,
    goals: 0,
    deck,
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

function clearField(field: PlayerField): void {
  for (const positionId of RESTORE_ORDER) {
    field[positionId] = null;
  }
}

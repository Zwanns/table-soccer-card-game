import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  chooseAiAction,
  createAiDecisionRandom,
  type AiAction,
  type SeededRandomLike
} from '../ai';
import { GoalkeeperDeck, type Card, type CardRank, type Deck, type GoalkeeperCard, type GoalkeeperRank } from '../cards';
import {
  createEmptyField,
  createMatchTeamSetup,
  type FieldPositionId,
  type GamePhase,
  type GameState,
  type Player,
  type PlayerField
} from '../game';
import { createDefaultSquad } from '../data/defaultSquads';

function card(rank: CardRank, id: string = rank): Card {
  return {
    id: `AI_${id}`,
    rank,
    color: rank === 'JOKER' ? 'JOKER' : 'RED',
    suit: rank === 'JOKER' ? null : 'HEARTS'
  };
}

function goalkeeperCard(rank: GoalkeeperRank): GoalkeeperCard {
  return {
    id: `AI_GK_${rank}`,
    kind: 'goalkeeper',
    rank
  };
}

function deck(ranks: CardRank[]): Deck {
  return {
    cards: ranks.map((rank, index) => card(rank, `${rank}_${index}`))
  };
}

function player(id: Player['id'], deckRanks: CardRank[] = ['2', '3', '4']): Player {
  return {
    id,
    name: id,
    flagCode: id === 'PLAYER_1' ? 'fr' : 'es',
    teamColor: id === 'PLAYER_1' ? 'RED' : 'BLACK',
    goals: 0,
    deck: deck(deckRanks),
    goalkeeperDeck: new GoalkeeperDeck([goalkeeperCard('6')]),
    field: createEmptyField()
  };
}

function state(phase: GamePhase = 'WAITING_FOR_ATTACK_CARD'): GameState {
  const players: [Player, Player] = [player('PLAYER_1'), player('PLAYER_2')];

  return {
    players,
    matchSetups: {
      PLAYER_1: createMatchTeamSetup({
        teamId: 'fr',
        squad: createDefaultSquad('fr'),
        goalkeeperKitId: 'gk1'
      }),
      PLAYER_2: createMatchTeamSetup({
        teamId: 'es',
        squad: createDefaultSquad('es'),
        goalkeeperKitId: 'gk2'
      })
    },
    activePlayerId: 'PLAYER_1',
    phase,
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
    turnNumber: 1,
    log: []
  };
}

function setPositions(field: PlayerField, entries: Partial<Record<FieldPositionId, CardRank | GoalkeeperRank>>): void {
  for (const [positionId, rank] of Object.entries(entries) as Array<[FieldPositionId, CardRank | GoalkeeperRank]>) {
    if (positionId === 'goalkeeper') {
      field.goalkeeper = goalkeeperCard(rank as GoalkeeperRank);
      continue;
    }

    field[positionId] = card(rank as CardRank, `${positionId}_${rank}`);
  }
}

function fixedRandom(value: number): SeededRandomLike {
  return () => value;
}

function stateSnapshot(gameState: GameState): unknown {
  return {
    activePlayerId: gameState.activePlayerId,
    phase: gameState.phase,
    attackCard: gameState.attackCard,
    currentAttackCardSource: gameState.currentAttackCardSource,
    legalTargetPositionIds: gameState.legalTargetPositionIds,
    legalMidfieldGapPositionIds: gameState.legalMidfieldGapPositionIds,
    committableMidfielderPositionIds: gameState.committableMidfielderPositionIds,
    playerDecks: gameState.players.map((candidate) => candidate.deck.cards.map((deckCard) => deckCard.id)),
    playerFields: gameState.players.map((candidate) =>
      Object.fromEntries(Object.entries(candidate.field).map(([positionId, fieldCard]) => [positionId, fieldCard?.id]))
    )
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AI decision model', () => {
  it('returns null outside AI action phases and for inactive players', () => {
    expect(chooseAiAction(state('ENDING_TURN'), 'PLAYER_1', fixedRandom(0))).toBeNull();
    expect(chooseAiAction(state('WAITING_FOR_ATTACK_CARD'), 'PLAYER_2', fixedRandom(0))).toBeNull();
  });

  it('does not mutate the game state or consume deck cards', () => {
    const gameState = state('WAITING_FOR_TARGET');
    gameState.attackCard = card('A', 'ATTACK');
    setPositions(gameState.players[1].field, {
      'midfielder-1': '6',
      'midfielder-2': 'K'
    });
    gameState.legalTargetPositionIds = ['midfielder-1', 'midfielder-2'];
    const before = stateSnapshot(gameState);

    expect(chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0))).toEqual({
      type: 'SELECT_TARGET',
      positionId: 'midfielder-2'
    });
    expect(stateSnapshot(gameState)).toEqual(before);
  });

  it('does not use Math.random for decisions', () => {
    const mathRandom = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used by AI decisions.');
    });
    const gameState = state('WAITING_FOR_TARGET');
    gameState.attackCard = card('A', 'ATTACK');
    setPositions(gameState.players[1].field, {
      'midfielder-1': '6',
      'midfielder-2': '6'
    });
    gameState.legalTargetPositionIds = ['midfielder-1', 'midfielder-2'];

    expect(() => chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0))).not.toThrow();
    expect(mathRandom).not.toHaveBeenCalled();
  });

  it('does not inspect closed deck order when choosing to draw', () => {
    const firstState = state('WAITING_FOR_ATTACK_CARD');
    const secondState = state('WAITING_FOR_ATTACK_CARD');
    firstState.players[0].deck = deck(['2', 'A', 'K']);
    secondState.players[0].deck = deck(['K', 'A', '2']);
    setPositions(firstState.players[1].field, { 'defender-1': '6' });
    setPositions(secondState.players[1].field, { 'defender-1': '6' });

    expect(chooseAiAction(firstState, 'PLAYER_1', fixedRandom(0))).toEqual({ type: 'DRAW_FROM_DECK' });
    expect(chooseAiAction(secondState, 'PLAYER_1', fixedRandom(0))).toEqual({ type: 'DRAW_FROM_DECK' });
  });

  it('draws from deck when the current target line is defense or goalkeeper', () => {
    const defenseState = state('WAITING_FOR_ATTACK_CARD');
    setPositions(defenseState.players[1].field, { 'defender-1': '6' });

    const goalkeeperState = state('WAITING_FOR_ATTACK_CARD');
    setPositions(goalkeeperState.players[1].field, { goalkeeper: '6' });

    expect(chooseAiAction(defenseState, 'PLAYER_1', fixedRandom(0))).toEqual({ type: 'DRAW_FROM_DECK' });
    expect(chooseAiAction(goalkeeperState, 'PLAYER_1', fixedRandom(0))).toEqual({ type: 'DRAW_FROM_DECK' });
  });

  it('can commit a legal midfielder that beats the opposite midfield card', () => {
    const gameState = state('WAITING_FOR_ATTACK_CARD');
    setPositions(gameState.players[0].field, { 'midfielder-1': 'A' });
    setPositions(gameState.players[1].field, { 'midfielder-1': '6' });
    gameState.committableMidfielderPositionIds = ['midfielder-1'];

    expect(chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0))).toEqual({
      type: 'COMMIT_MIDFIELDER',
      positionId: 'midfielder-1'
    });
  });

  it('does not commit a midfielder against an empty or already used slot', () => {
    const gameState = state('WAITING_FOR_ATTACK_CARD');
    setPositions(gameState.players[0].field, {
      'midfielder-1': 'A',
      'midfielder-2': 'A'
    });
    setPositions(gameState.players[1].field, {
      'midfielder-1': '6'
    });
    gameState.committableMidfielderPositionIds = ['midfielder-1'];
    gameState.committedMidfielderPositionIds = ['midfielder-2'];

    expect(chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0))).toEqual({
      type: 'COMMIT_MIDFIELDER',
      positionId: 'midfielder-1'
    });
  });

  it('draws from deck when no legal midfielder can beat its opposite card', () => {
    const gameState = state('WAITING_FOR_ATTACK_CARD');
    setPositions(gameState.players[0].field, { 'midfielder-1': '3' });
    setPositions(gameState.players[1].field, { 'midfielder-1': 'A' });
    gameState.committableMidfielderPositionIds = ['midfielder-1'];

    expect(chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0))).toEqual({ type: 'DRAW_FROM_DECK' });
  });

  it('prefers the minimal sufficient successful midfielder and uses score-adjusted probability', () => {
    const gameState = state('WAITING_FOR_ATTACK_CARD');
    gameState.players[0].goals = 0;
    gameState.players[1].goals = 1;
    setPositions(gameState.players[0].field, {
      'midfielder-1': 'A',
      'midfielder-2': '8'
    });
    setPositions(gameState.players[1].field, {
      'midfielder-1': '6',
      'midfielder-2': '7'
    });
    gameState.committableMidfielderPositionIds = ['midfielder-1', 'midfielder-2'];

    expect(chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0.79))).toEqual({
      type: 'COMMIT_MIDFIELDER',
      positionId: 'midfielder-2'
    });
    expect(chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0.8))).toEqual({ type: 'DRAW_FROM_DECK' });
  });

  it('uses a midfield gap from deck source before regular targets', () => {
    const gameState = state('WAITING_FOR_TARGET');
    gameState.attackCard = card('8', 'ATTACK');
    gameState.currentAttackCardSource = 'DECK';
    gameState.legalMidfieldGapPositionIds = ['midfielder-1', 'midfielder-2'];
    gameState.legalTargetPositionIds = ['defender-1'];
    setPositions(gameState.players[1].field, { 'defender-1': '3' });

    expect(chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0.9))).toEqual({
      type: 'SELECT_MIDFIELD_GAP',
      positionId: 'midfielder-2'
    });
  });

  it('does not use a midfield gap for a midfielder attack source', () => {
    const gameState = state('WAITING_FOR_TARGET');
    gameState.attackCard = card('8', 'ATTACK');
    gameState.currentAttackCardSource = 'MIDFIELDER';
    gameState.legalMidfieldGapPositionIds = ['midfielder-1'];
    gameState.legalTargetPositionIds = ['defender-1'];
    setPositions(gameState.players[1].field, { 'defender-1': '3' });

    expect(chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0))).toEqual({
      type: 'SELECT_TARGET',
      positionId: 'defender-1'
    });
  });

  it('chooses the strongest beatable regular target', () => {
    const gameState = state('WAITING_FOR_TARGET');
    gameState.attackCard = card('A', 'ATTACK');
    setPositions(gameState.players[1].field, {
      'midfielder-1': '6',
      'midfielder-2': 'K',
      'midfielder-3': '9'
    });
    gameState.legalTargetPositionIds = ['midfielder-1', 'midfielder-2', 'midfielder-3'];

    expect(chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0))).toEqual({
      type: 'SELECT_TARGET',
      positionId: 'midfielder-2'
    });
  });

  it('chooses the weakest legal regular target when no target can be beaten', () => {
    const gameState = state('WAITING_FOR_TARGET');
    gameState.attackCard = card('3', 'ATTACK');
    setPositions(gameState.players[1].field, {
      'midfielder-1': '10',
      'midfielder-2': 'K',
      'midfielder-3': 'J'
    });
    gameState.legalTargetPositionIds = ['midfielder-1', 'midfielder-2', 'midfielder-3'];

    expect(chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0))).toEqual({
      type: 'SELECT_TARGET',
      positionId: 'midfielder-1'
    });
  });

  it('selects the legal goalkeeper target without adding separate GK outcome logic', () => {
    const gameState = state('WAITING_FOR_TARGET');
    gameState.attackCard = card('6', 'ATTACK');
    setPositions(gameState.players[1].field, { goalkeeper: '6' });
    gameState.legalTargetPositionIds = ['goalkeeper'];

    expect(chooseAiAction(gameState, 'PLAYER_1', fixedRandom(0))).toEqual({
      type: 'SELECT_TARGET',
      positionId: 'goalkeeper'
    });
  });

  it('returns only legal target and gap positions', () => {
    const targetState = state('WAITING_FOR_TARGET');
    targetState.attackCard = card('A', 'ATTACK');
    setPositions(targetState.players[1].field, {
      'midfielder-1': '6',
      'midfielder-2': 'K'
    });
    targetState.legalTargetPositionIds = ['midfielder-1'];
    const targetAction = chooseAiAction(targetState, 'PLAYER_1', fixedRandom(0));

    const gapState = state('WAITING_FOR_TARGET');
    gapState.attackCard = card('A', 'ATTACK');
    gapState.currentAttackCardSource = 'DECK';
    gapState.legalMidfieldGapPositionIds = ['midfielder-2'];
    gapState.legalTargetPositionIds = ['midfielder-1'];
    const gapAction = chooseAiAction(gapState, 'PLAYER_1', fixedRandom(0));

    expect(targetAction).toEqual({ type: 'SELECT_TARGET', positionId: 'midfielder-1' });
    expect(gapAction).toEqual({ type: 'SELECT_MIDFIELD_GAP', positionId: 'midfielder-2' });
  });

  it('returns deterministic decisions for the same AI seed stream', () => {
    const gameState = createEqualTargetChoiceState();
    const firstAction = chooseAiAction(gameState, 'PLAYER_1', createAiDecisionRandom('same-seed', 'PLAYER_1'));
    const secondAction = chooseAiAction(gameState, 'PLAYER_1', createAiDecisionRandom('same-seed', 'PLAYER_1'));

    expect(secondAction).toEqual(firstAction);
  });

  it('can vary equal decisions across different AI seed streams', () => {
    const gameState = createEqualTargetChoiceState();
    const choices = new Set<string>();

    for (const seed of ['seed-a', 'seed-b', 'seed-c', 'seed-d', 'seed-e', 'seed-f']) {
      const action = chooseAiAction(gameState, 'PLAYER_1', createAiDecisionRandom(seed, 'PLAYER_1'));

      choices.add(actionKey(action));
    }

    expect(choices.size).toBeGreaterThan(1);
  });
});

function createEqualTargetChoiceState(): GameState {
  const gameState = state('WAITING_FOR_TARGET');
  gameState.attackCard = card('A', 'ATTACK');
  setPositions(gameState.players[1].field, {
    'midfielder-1': '6',
    'midfielder-2': '6',
    'midfielder-3': '6'
  });
  gameState.legalTargetPositionIds = ['midfielder-1', 'midfielder-2', 'midfielder-3'];

  return gameState;
}

function actionKey(action: AiAction | null): string {
  return action === null ? 'null' : `${action.type}:${'positionId' in action ? action.positionId : ''}`;
}

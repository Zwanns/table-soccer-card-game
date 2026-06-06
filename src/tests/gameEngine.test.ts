import { describe, expect, it } from 'vitest';
import type { Card, CardRank, Deck } from '../cards';
import {
  createEmptyField,
  GameEngine,
  type FieldPositionId,
  type GameState,
  type Player,
  type PlayerField
} from '../game';

function card(rank: CardRank, id: string = rank): Card {
  return {
    id: `ENGINE_${id}`,
    rank,
    color: rank === 'JOKER' ? 'JOKER' : 'RED',
    suit: rank === 'JOKER' ? null : 'HEARTS'
  };
}

function deck(ranks: CardRank[]): Deck {
  return {
    cards: ranks.map((rank, index) => card(rank, `${rank}_${index}`))
  };
}

function player(id: string, ranks: CardRank[]): Player {
  return {
    id,
    name: id,
    teamColor: id === 'PLAYER_1' ? 'RED' : 'BLACK',
    goals: 0,
    deck: deck(ranks),
    field: createEmptyField()
  };
}

function state(playerOneDeck: CardRank[], playerTwoDeck: CardRank[]): GameState {
  const players: [Player, Player] = [player('PLAYER_1', playerOneDeck), player('PLAYER_2', playerTwoDeck)];

  return {
    players,
    activePlayerId: 'PLAYER_1',
    phase: 'ENDING_TURN',
    attackCard: null,
    attackBank: [],
    legalTargetPositionIds: [],
    winnerId: null,
    isDraw: false,
    turnNumber: 0,
    log: []
  };
}

function fillField(field: PlayerField): void {
  field.goalkeeper = card('2', 'FIELD_GK');
  field['defender-1'] = card('3', 'FIELD_D1');
  field['defender-2'] = card('4', 'FIELD_D2');
  field['midfielder-1'] = card('5', 'FIELD_M1');
  field['midfielder-2'] = card('6', 'FIELD_M2');
  field['midfielder-3'] = card('7', 'FIELD_M3');
}

function setPositions(field: PlayerField, entries: Partial<Record<FieldPositionId, CardRank>>): void {
  for (const [positionId, rank] of Object.entries(entries) as Array<[FieldPositionId, CardRank]>) {
    field[positionId] = card(rank, `${positionId}_${rank}`);
  }
}

function createReadyEngine(playerOneDeck: CardRank[], playerTwoDeck: CardRank[] = []): GameEngine {
  const gameState = state(playerOneDeck, playerTwoDeck);
  fillField(gameState.players[0].field);

  return new GameEngine(gameState);
}

describe('game engine attacks', () => {
  it('scenario 1: successful hit exposes the current opponent midfield line without beat hints', () => {
    const engine = createReadyEngine(['7']);
    setPositions(engine.getState().players[1].field, {
      'midfielder-1': '6',
      'midfielder-2': 'J',
      'midfielder-3': 'Q'
    });

    expect(engine.startNextTurn().phase).toBe('WAITING_FOR_ATTACK_CARD');
    const result = engine.drawAttackCard();

    expect(result.phase).toBe('WAITING_FOR_TARGET');
    expect(engine.getLegalTargets()).toEqual(['midfielder-1', 'midfielder-2', 'midfielder-3']);

    const afterSelection = engine.selectTarget('midfielder-1');

    expect(afterSelection.log.some((event) => event.type === 'CARD_DEFEATED')).toBe(true);
    expect(afterSelection.log.some((event) => event.type === 'SHOT_ON_GOAL')).toBe(false);
  });

  it('scenario 2: special hit 6 beats A during an attack without revealing that hint in targets', () => {
    const engine = createReadyEngine(['6']);
    setPositions(engine.getState().players[1].field, {
      'midfielder-1': 'A',
      'midfielder-2': 'Q',
      'midfielder-3': 'J'
    });

    engine.startNextTurn();
    engine.drawAttackCard();

    expect(engine.getLegalTargets()).toEqual(['midfielder-1', 'midfielder-2', 'midfielder-3']);
    expect(engine.selectTarget('midfielder-1').log.some((event) => event.type === 'CARD_DEFEATED')).toBe(true);
  });

  it('scenario 3: OUT manually ends the attack, returns the attack card, and switches turn', () => {
    const engine = createReadyEngine(['3']);
    setPositions(engine.getState().players[1].field, {
      'midfielder-1': '10',
      'midfielder-2': 'J',
      'midfielder-3': 'Q'
    });

    expect(engine.startNextTurn().phase).toBe('WAITING_FOR_ATTACK_CARD');
    const waitingState = engine.drawAttackCard();

    expect(waitingState.phase).toBe('WAITING_FOR_TARGET');
    expect(waitingState.activePlayerId).toBe('PLAYER_1');
    expect(waitingState.attackCard?.rank).toBe('3');

    const result = engine.declareOut();
    const attacker = result.players[0];

    expect(result.phase).toBe('ENDING_TURN');
    expect(result.activePlayerId).toBe('PLAYER_2');
    expect(attacker.deck.cards.map((deckCard) => deckCard.rank)).toEqual(['3']);
    expect(result.log.at(-2)).toEqual({ type: 'ATTACK_MISSED', card: card('3', '3_0') });
  });

  it('scenario 4: target line moves from midfield to defense to goalkeeper', () => {
    const engine = createReadyEngine(['A', 'A', 'A']);
    setPositions(engine.getState().players[1].field, {
      goalkeeper: 'Q',
      'defender-1': 'K',
      'midfielder-1': '6'
    });

    engine.startNextTurn();
    engine.drawAttackCard();
    expect(engine.getLegalTargets()).toEqual(['midfielder-1']);

    engine.selectTarget('midfielder-1');
    engine.drawAttackCard();
    expect(engine.getLegalTargets()).toEqual(['defender-1']);

    engine.selectTarget('defender-1');
    engine.drawAttackCard();
    expect(engine.getLegalTargets()).toEqual(['goalkeeper']);
  });

  it('scenario 5: beating the goalkeeper scores a goal and ends the turn', () => {
    const engine = createReadyEngine(['A']);
    setPositions(engine.getState().players[1].field, {
      goalkeeper: '6'
    });

    engine.startNextTurn();
    engine.drawAttackCard();
    const result = engine.selectTarget('goalkeeper');

    expect(result.players[0].goals).toBe(1);
    expect(result.log.some((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toBe(true);
    expect(result.phase).toBe('ENDING_TURN');
    expect(result.activePlayerId).toBe('PLAYER_2');
    expect(Object.values(result.players[1].field)).toEqual([null, null, null, null, null, null]);
    expect(result.players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['A', '6']);
  });

  it('counts a shot on goal when the goalkeeper card is selected', () => {
    const engine = createReadyEngine(['A']);
    setPositions(engine.getState().players[1].field, {
      goalkeeper: '6'
    });

    engine.startNextTurn();
    const waitingForShot = engine.drawAttackCard();

    expect(waitingForShot.phase).toBe('WAITING_FOR_TARGET');
    expect(waitingForShot.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toHaveLength(0);

    const result = engine.selectTarget('goalkeeper');

    expect(result.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toHaveLength(1);
  });

  it('forbids OUT during a goalkeeper shot', () => {
    const engine = createReadyEngine(['A']);
    setPositions(engine.getState().players[1].field, {
      goalkeeper: '6'
    });

    engine.startNextTurn();
    engine.drawAttackCard();

    expect(() => engine.declareOut()).toThrow('Cannot declare OUT during a goalkeeper shot.');
  });

  it('treats equal 3-10 goalkeeper ranks as a goalpost hit after selecting the goalkeeper', () => {
    const engine = createReadyEngine(['6', 'A']);
    setPositions(engine.getState().players[1].field, {
      goalkeeper: '6'
    });

    engine.startNextTurn();
    const waitingForShot = engine.drawAttackCard();

    expect(waitingForShot.phase).toBe('WAITING_FOR_TARGET');
    expect(waitingForShot.attackCard?.rank).toBe('6');

    const afterPost = engine.selectTarget('goalkeeper');

    expect(afterPost.phase).toBe('WAITING_FOR_ATTACK_CARD');
    expect(afterPost.attackCard).toBeNull();
    expect(afterPost.players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['A']);
    expect(afterPost.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toHaveLength(1);
    expect(afterPost.log.at(-1)?.type).toBe('GOALPOST_HIT');

    const nextShot = engine.drawAttackCard();

    expect(nextShot.phase).toBe('WAITING_FOR_TARGET');
    expect(nextShot.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toHaveLength(1);
  });

  it('ends the attack with a goalkeeper save when the selected shot cannot beat the goalkeeper', () => {
    const engine = createReadyEngine(['5']);
    setPositions(engine.getState().players[1].field, {
      goalkeeper: '6'
    });

    engine.startNextTurn();
    engine.drawAttackCard();
    const result = engine.selectTarget('goalkeeper');

    expect(result.phase).toBe('ENDING_TURN');
    expect(result.activePlayerId).toBe('PLAYER_2');
    expect(result.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === 'PLAYER_1')).toHaveLength(1);
    expect(result.log.some((event) => event.type === 'GOALKEEPER_SAVE')).toBe(true);
  });

  it('scenario 6: not enough cards to restore the field ends the game', () => {
    const gameState = state(['2', '3', '4'], []);
    gameState.players[0].field.goalkeeper = card('A');
    gameState.players[0].field['defender-1'] = card('K');
    const engine = new GameEngine(gameState);

    const result = engine.startNextTurn();

    expect(result.phase).toBe('GAME_OVER');
    expect(result.isDraw).toBe(true);
    expect(result.log.at(-1)).toEqual({ type: 'GAME_OVER', winnerId: null });
  });

  it('logs every card restored from the deck to the field', () => {
    const engine = createReadyEngine(['9']);
    engine.getState().players[0].field['defender-1'] = null;

    const result = engine.startNextTurn();

    expect(result.players[0].field['defender-1']?.rank).toBe('9');
    expect(result.log).toContainEqual({
      type: 'FIELD_CARD_RESTORED',
      playerId: 'PLAYER_1',
      positionId: 'defender-1',
      card: card('9', '9_0')
    });
  });

  it('scenario 7: using the last attack card ends the attack but not the game', () => {
    const engine = createReadyEngine(['A']);
    setPositions(engine.getState().players[1].field, {
      'midfielder-1': '6'
    });

    engine.startNextTurn();
    engine.drawAttackCard();
    const result = engine.selectTarget('midfielder-1');

    expect(result.phase).toBe('ENDING_TURN');
    expect(result.activePlayerId).toBe('PLAYER_2');
    expect(result.players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['A', '6']);
    expect(result.winnerId).toBeNull();
    expect(result.isDraw).toBe(false);
  });

  it('recolors defeated opponent cards to the attacking player color when ownership changes', () => {
    const engine = createReadyEngine(['A']);
    engine.getState().players[1].field['midfielder-1'] = {
      ...card('6', 'BLACK_TARGET'),
      color: 'BLACK',
      suit: 'SPADES'
    };

    engine.startNextTurn();
    engine.drawAttackCard();
    const result = engine.selectTarget('midfielder-1');

    expect(result.players[0].deck.cards.map((deckCard) => deckCard.color)).toEqual(['RED', 'RED']);
    expect(result.players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['A', '6']);
  });

  it('scenario 8: first player selection uses base rank values without special hits', () => {
    const gameState = state(['6'], ['A']);
    const engine = new GameEngine(gameState);

    (engine as unknown as { determineFirstPlayer: () => void }).determineFirstPlayer();

    expect(engine.getState().activePlayerId).toBe('PLAYER_2');
    expect(engine.getState().players[0].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['6']);
    expect(engine.getState().players[1].deck.cards.map((deckCard) => deckCard.rank)).toEqual(['A']);
    expect(engine.getState().log.at(-1)).toEqual({
      type: 'FIRST_PLAYER_SELECTED',
      playerId: 'PLAYER_2'
    });
  });
});

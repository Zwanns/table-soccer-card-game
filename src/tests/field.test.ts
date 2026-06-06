import { describe, expect, it } from 'vitest';
import type { Card, CardRank, Deck } from '../cards';
import {
  createEmptyField,
  getCardsInCurrentTargetLine,
  getCurrentTargetLine,
  getEmptyPositionsInRestoreOrder,
  restoreField,
  type FieldPositionId,
  type Player
} from '../game';

function card(rank: CardRank, id: string = rank): Card {
  return {
    id: `TEST_${id}`,
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

function playerWithDeck(ranks: CardRank[]): Player {
  return {
    id: 'PLAYER_1',
    deck: deck(ranks),
    field: createEmptyField()
  };
}

describe('player field restoration', () => {
  it('requires 6 cards for an empty field', () => {
    expect(getEmptyPositionsInRestoreOrder(createEmptyField())).toEqual([
      'goalkeeper',
      'defender-1',
      'defender-2',
      'midfielder-1',
      'midfielder-2',
      'midfielder-3'
    ]);
  });

  it('does not require cards for a full field', () => {
    const player = playerWithDeck([]);
    player.field.goalkeeper = card('A');
    player.field['defender-1'] = card('K');
    player.field['defender-2'] = card('Q');
    player.field['midfielder-1'] = card('J');
    player.field['midfielder-2'] = card('10');
    player.field['midfielder-3'] = card('9');

    expect(getEmptyPositionsInRestoreOrder(player.field)).toEqual([]);
    expect(restoreField(player)).toEqual({
      ok: true,
      restoredPositions: []
    });
    expect(player.deck.cards).toEqual([]);
  });

  it('restores an empty field in goalkeeper, defenders, midfielders order', () => {
    const player = playerWithDeck(['2', '3', '4', '5', '6', '7', '8']);
    const result = restoreField(player);

    expect(result.ok).toBe(true);
    expect(result.ok && result.restoredPositions.map((entry) => entry.positionId)).toEqual([
      'goalkeeper',
      'defender-1',
      'defender-2',
      'midfielder-1',
      'midfielder-2',
      'midfielder-3'
    ]);
    expect(player.field.goalkeeper?.rank).toBe('2');
    expect(player.field['defender-1']?.rank).toBe('3');
    expect(player.field['defender-2']?.rank).toBe('4');
    expect(player.field['midfielder-1']?.rank).toBe('5');
    expect(player.field['midfielder-2']?.rank).toBe('6');
    expect(player.field['midfielder-3']?.rank).toBe('7');
    expect(player.deck.cards.map((deckCard) => deckCard.rank)).toEqual(['8']);
  });

  it('fills only empty positions', () => {
    const player = playerWithDeck(['2', '3', '4']);
    const existingCards: Partial<Record<FieldPositionId, Card>> = {
      'defender-1': card('A'),
      'midfielder-1': card('K'),
      'midfielder-3': card('Q')
    };
    player.field['defender-1'] = existingCards['defender-1'] ?? null;
    player.field['midfielder-1'] = existingCards['midfielder-1'] ?? null;
    player.field['midfielder-3'] = existingCards['midfielder-3'] ?? null;

    const result = restoreField(player);

    expect(result.ok).toBe(true);
    expect(result.ok && result.restoredPositions.map((entry) => entry.positionId)).toEqual([
      'goalkeeper',
      'defender-2',
      'midfielder-2'
    ]);
    expect(player.field.goalkeeper?.rank).toBe('2');
    expect(player.field['defender-1']).toEqual(existingCards['defender-1']);
    expect(player.field['defender-2']?.rank).toBe('3');
    expect(player.field['midfielder-1']).toEqual(existingCards['midfielder-1']);
    expect(player.field['midfielder-2']?.rank).toBe('4');
    expect(player.field['midfielder-3']).toEqual(existingCards['midfielder-3']);
    expect(player.deck.cards).toEqual([]);
  });

  it('does not change the field or deck when there are not enough cards', () => {
    const player = playerWithDeck(['2', '3', '4', '5', '6']);
    const originalField = { ...player.field };
    const originalDeckCards = [...player.deck.cards];

    expect(restoreField(player)).toEqual({
      ok: false,
      reason: 'NOT_ENOUGH_CARDS',
      requiredCards: 6,
      availableCards: 5
    });
    expect(player.field).toEqual(originalField);
    expect(player.deck.cards).toEqual(originalDeckCards);
  });
});

describe('target line selection', () => {
  it('targets midfield before defense and goalkeeper', () => {
    const field = createEmptyField();
    field.goalkeeper = card('A');
    field['defender-1'] = card('K');
    field['midfielder-2'] = card('Q');

    expect(getCurrentTargetLine(field)).toBe('MIDFIELD');
    expect(getCardsInCurrentTargetLine(field)).toEqual([
      {
        positionId: 'midfielder-2',
        card: field['midfielder-2']
      }
    ]);
  });

  it('targets defense after all midfielders are empty', () => {
    const field = createEmptyField();
    field.goalkeeper = card('A');
    field['defender-2'] = card('K');

    expect(getCurrentTargetLine(field)).toBe('DEFENSE');
    expect(getCardsInCurrentTargetLine(field)).toEqual([
      {
        positionId: 'defender-2',
        card: field['defender-2']
      }
    ]);
  });

  it('targets goalkeeper after midfield and defense are empty', () => {
    const field = createEmptyField();
    field.goalkeeper = card('A');

    expect(getCurrentTargetLine(field)).toBe('GOALKEEPER');
    expect(getCardsInCurrentTargetLine(field)).toEqual([
      {
        positionId: 'goalkeeper',
        card: field.goalkeeper
      }
    ]);
  });

  it('returns no target line when the field is empty', () => {
    const field = createEmptyField();

    expect(getCurrentTargetLine(field)).toBeNull();
    expect(getCardsInCurrentTargetLine(field)).toEqual([]);
  });
});

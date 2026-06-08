import { describe, expect, it } from 'vitest';
import { GoalkeeperDeck, type Card, type CardRank, type Deck, type GoalkeeperRank } from '../cards';
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

function goalkeeperCard(rank: GoalkeeperRank): { kind: 'goalkeeper'; rank: GoalkeeperRank } {
  return {
    kind: 'goalkeeper',
    rank
  };
}

function goalkeeperDeck(ranks: GoalkeeperRank[] = ['3']): GoalkeeperDeck {
  return new GoalkeeperDeck(ranks.map((rank) => goalkeeperCard(rank)));
}

function playerWithDeck(ranks: CardRank[], goalkeeperRanks: GoalkeeperRank[] = ['3']): Player {
  return {
    id: 'PLAYER_1',
    name: 'Player 1',
    flagCode: 'fr',
    teamColor: 'RED',
    goals: 0,
    deck: deck(ranks),
    goalkeeperDeck: goalkeeperDeck(goalkeeperRanks),
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
    player.field.goalkeeper = goalkeeperCard('A');
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
    const player = playerWithDeck(['2', '3', '4', '5', '6', '7', '8'], ['9']);
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
    expect(result.ok && result.restoredPositions.map((entry) => entry.cardKind)).toEqual([
      'goalkeeper',
      'outfield',
      'outfield',
      'outfield',
      'outfield',
      'outfield'
    ]);
    expect(result.ok && result.restoredPositions.map((entry) => entry.cardRank)).toEqual(['9', '2', '3', '4', '5', '6']);
    expect(player.field.goalkeeper?.rank).toBe('9');
    expect(player.field['defender-1']?.rank).toBe('2');
    expect(player.field['defender-2']?.rank).toBe('3');
    expect(player.field['midfielder-1']?.rank).toBe('4');
    expect(player.field['midfielder-2']?.rank).toBe('5');
    expect(player.field['midfielder-3']?.rank).toBe('6');
    expect(player.deck.cards.map((deckCard) => deckCard.rank)).toEqual(['7', '8']);
    expect(player.goalkeeperDeck.toArray().map((deckCard) => deckCard.rank)).toEqual([]);
  });

  it('restores goalkeeper from the goalkeeper deck and lets joker stay in the outfield', () => {
    const player = playerWithDeck(['JOKER', '5', '6', '7', '8', '9'], ['Q']);
    const result = restoreField(player);

    expect(result.ok).toBe(true);
    expect(player.field.goalkeeper?.rank).toBe('Q');
    expect(player.field['defender-1']?.rank).toBe('JOKER');
    expect(player.field['defender-1']?.color).toBe('RED');
  });

  it('fills only empty positions', () => {
    const player = playerWithDeck(['2', '3', '4'], ['K']);
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
    expect(player.field.goalkeeper?.rank).toBe('K');
    expect(player.field['defender-1']).toEqual(existingCards['defender-1']);
    expect(player.field['defender-2']?.rank).toBe('2');
    expect(player.field['midfielder-1']).toEqual(existingCards['midfielder-1']);
    expect(player.field['midfielder-2']?.rank).toBe('3');
    expect(player.field['midfielder-3']).toEqual(existingCards['midfielder-3']);
    expect(player.deck.cards.map((deckCard) => deckCard.rank)).toEqual(['4']);
    expect(player.goalkeeperDeck.getSize()).toBe(0);
  });

  it('does not change the field or deck when there are not enough cards', () => {
    const player = playerWithDeck(['2', '3', '4']);
    const originalField = { ...player.field };
    const originalDeckCards = [...player.deck.cards];

    expect(restoreField(player)).toEqual({
      ok: false,
      reason: 'NOT_ENOUGH_CARDS',
      requiredCards: 5,
      availableCards: 3
    });
    expect(player.field).toEqual(originalField);
    expect(player.deck.cards).toEqual(originalDeckCards);
  });

  it('does not change the field or main deck when the goalkeeper deck is empty', () => {
    const player = playerWithDeck(['2', '3', '4', '5', '6'], []);
    const originalField = { ...player.field };
    const originalDeckCards = [...player.deck.cards];

    expect(restoreField(player)).toEqual({
      ok: false,
      reason: 'NOT_ENOUGH_CARDS',
      requiredCards: 1,
      availableCards: 0
    });
    expect(player.field).toEqual(originalField);
    expect(player.deck.cards).toEqual(originalDeckCards);
  });
});

describe('target line selection', () => {
  it('targets midfield before defense and goalkeeper', () => {
    const field = createEmptyField();
    field.goalkeeper = goalkeeperCard('A');
    field['defender-1'] = card('K');
    field['midfielder-2'] = card('Q');

    expect(getCurrentTargetLine(field)).toBe('MIDFIELD');
    expect(getCardsInCurrentTargetLine(field)).toEqual([
      {
        positionId: 'midfielder-2',
        card: field['midfielder-2'],
        cardKind: 'outfield',
        cardRank: 'Q'
      }
    ]);
  });

  it('targets defense after all midfielders are empty', () => {
    const field = createEmptyField();
    field.goalkeeper = goalkeeperCard('A');
    field['defender-2'] = card('K');

    expect(getCurrentTargetLine(field)).toBe('DEFENSE');
    expect(getCardsInCurrentTargetLine(field)).toEqual([
      {
        positionId: 'defender-2',
        card: field['defender-2'],
        cardKind: 'outfield',
        cardRank: 'K'
      }
    ]);
  });

  it('targets goalkeeper after midfield and defense are empty', () => {
    const field = createEmptyField();
    field.goalkeeper = goalkeeperCard('A');

    expect(getCurrentTargetLine(field)).toBe('GOALKEEPER');
    expect(getCardsInCurrentTargetLine(field)).toEqual([
      {
        positionId: 'goalkeeper',
        card: field.goalkeeper,
        cardKind: 'goalkeeper',
        cardRank: 'A'
      }
    ]);
  });

  it('returns no target line when the field is empty', () => {
    const field = createEmptyField();

    expect(getCurrentTargetLine(field)).toBeNull();
    expect(getCardsInCurrentTargetLine(field)).toEqual([]);
  });
});

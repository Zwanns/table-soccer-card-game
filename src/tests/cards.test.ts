import { describe, expect, it } from 'vitest';
import {
  addCardsToBottom,
  canBeat,
  canCommittedMidfielderBeat,
  createPlayerDecks,
  createSeededRandom,
  drawTopCard,
  getRankValue,
  shuffleDeck,
  type Card,
  type CardRank,
  type Deck
} from '../cards';

function card(rank: CardRank): Card {
  return {
    id: `TEST_${rank}`,
    rank,
    color: rank === 'JOKER' ? 'JOKER' : 'RED',
    suit: rank === 'JOKER' ? null : 'HEARTS'
  };
}

describe('card rules', () => {
  it('uses the required base rank values', () => {
    expect(getRankValue('2')).toBe(2);
    expect(getRankValue('A')).toBe(14);
    expect(getRankValue('JOKER')).toBe(15);
  });

  it.each([
    ['A', 'K', true],
    ['K', 'A', false],
    ['10', '10', true],
    ['JOKER', 'JOKER', true],
    ['JOKER', '2', true],
    ['5', 'A', false]
  ] satisfies Array<[CardRank, CardRank, boolean]>)(
    'checks regular hit %s against %s',
    (attackerRank, defenderRank, expected) => {
      expect(canBeat(card(attackerRank), card(defenderRank))).toBe(expected);
    }
  );

  it.each([
    ['2', 'JOKER'],
    ['6', 'A'],
    ['7', 'K'],
    ['8', 'Q'],
    ['9', 'J']
  ] satisfies Array<[CardRank, CardRank]>)(
    'supports special hit %s against %s',
    (attackerRank, defenderRank) => {
      expect(canBeat(card(attackerRank), card(defenderRank))).toBe(true);
    }
  );

  it.each([
    ['5', '5', false],
    ['A', 'A', false],
    ['6', '5', true],
    ['5', '6', false],
    ['2', 'JOKER', true],
    ['6', 'A', true],
    ['7', 'K', true],
    ['8', 'Q', true],
    ['9', 'J', true]
  ] satisfies Array<[CardRank, CardRank, boolean]>)(
    'checks committed midfielder hit %s against %s',
    (attackerRank, defenderRank, expected) => {
      expect(canCommittedMidfielderBeat(card(attackerRank), card(defenderRank))).toBe(expected);
    }
  );
});

describe('player decks', () => {
  it('creates two decks with 27 cards each and one joker per deck', () => {
    const [playerOneDeck, playerTwoDeck] = createPlayerDecks();

    expect(playerOneDeck.cards).toHaveLength(27);
    expect(playerTwoDeck.cards).toHaveLength(27);
    expect(playerOneDeck.cards.filter((deckCard) => deckCard.rank === 'JOKER')).toHaveLength(1);
    expect(playerTwoDeck.cards.filter((deckCard) => deckCard.rank === 'JOKER')).toHaveLength(1);
  });

  it('splits cards by player color', () => {
    const [playerOneDeck, playerTwoDeck] = createPlayerDecks();

    expect(playerOneDeck.cards.filter((deckCard) => deckCard.color === 'RED')).toHaveLength(27);
    expect(playerOneDeck.cards.filter((deckCard) => deckCard.color === 'BLACK')).toHaveLength(0);
    expect(playerTwoDeck.cards.filter((deckCard) => deckCard.color === 'BLACK')).toHaveLength(27);
    expect(playerTwoDeck.cards.filter((deckCard) => deckCard.color === 'RED')).toHaveLength(0);
  });

  it('creates unique ids across both decks', () => {
    const decks = createPlayerDecks();
    const ids = decks.flatMap((deckItem) => deckItem.cards.map((deckCard) => deckCard.id));

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('deck operations', () => {
  it('drawTopCard removes and returns the top card', () => {
    const deck: Deck = { cards: [card('A'), card('K')] };

    expect(drawTopCard(deck)).toEqual(card('A'));
    expect(deck.cards).toEqual([card('K')]);
  });

  it('drawTopCard returns null for an empty deck', () => {
    expect(drawTopCard({ cards: [] })).toBeNull();
  });

  it('addCardsToBottom preserves card order', () => {
    const deck: Deck = { cards: [card('2')] };
    const cardsToAdd = [card('3'), card('4'), card('5')];

    addCardsToBottom(deck, cardsToAdd);

    expect(deck.cards.map((deckCard) => deckCard.rank)).toEqual(['2', '3', '4', '5']);
  });

  it('shuffleDeck uses the injected random generator and leaves the original deck unchanged', () => {
    const deck: Deck = { cards: [card('2'), card('3'), card('4'), card('5'), card('6')] };
    const shuffledOnce = shuffleDeck(deck, createSeededRandom(123));
    const shuffledTwice = shuffleDeck(deck, createSeededRandom(123));

    expect(shuffledOnce.cards.map((deckCard) => deckCard.rank)).toEqual(
      shuffledTwice.cards.map((deckCard) => deckCard.rank)
    );
    expect(shuffledOnce.cards.map((deckCard) => deckCard.rank)).not.toEqual(
      deck.cards.map((deckCard) => deckCard.rank)
    );
    expect(deck.cards.map((deckCard) => deckCard.rank)).toEqual(['2', '3', '4', '5', '6']);
  });
});

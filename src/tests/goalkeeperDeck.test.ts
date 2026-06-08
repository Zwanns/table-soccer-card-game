import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  createGoalkeeperCards,
  createGoalkeeperDeck,
  createSeededRandom,
  GOALKEEPER_RANKS,
  GoalkeeperDeck,
  type Card,
  type GoalkeeperCard,
  type GoalkeeperRank
} from '../cards';

describe('goalkeeper cards', () => {
  it('uses a goalkeeper-specific card shape and compatible card ranks', () => {
    expectTypeOf<GoalkeeperRank>().toEqualTypeOf<Exclude<Card['rank'], '2' | 'JOKER'>>();
    expectTypeOf<GoalkeeperCard>().not.toEqualTypeOf<Card>();
    expect(createGoalkeeperCards()[0]).toMatchObject({
      kind: 'goalkeeper',
      rank: expect.any(String)
    });
  });

  it('contains exactly the expected goalkeeper ranks', () => {
    expect(GOALKEEPER_RANKS).toEqual([
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
      'A'
    ]);
    expect(GOALKEEPER_RANKS).toHaveLength(12);
    expect(GOALKEEPER_RANKS).not.toContain('2');
    expect(GOALKEEPER_RANKS).not.toContain('JOKER');
  });

  it('creates one card for each goalkeeper rank', () => {
    const cards = createGoalkeeperCards();

    expect(cards).toHaveLength(12);
    expect(cards.map((card) => card.rank)).toEqual(GOALKEEPER_RANKS);
    expect(cards.every((card) => card.kind === 'goalkeeper')).toBe(true);
  });
});

describe('goalkeeper deck', () => {
  it('draws from the top and reports size', () => {
    const deck = new GoalkeeperDeck(createGoalkeeperCards());
    const top = deck.peekTop();
    const drawn = deck.drawTop();

    expect(top).toEqual({ kind: 'goalkeeper', rank: '3' });
    expect(drawn).toEqual(top);
    expect(deck.getSize()).toBe(11);
    expect(deck.peekTop()).toEqual({ kind: 'goalkeeper', rank: '4' });
  });

  it('returns cards to the bottom', () => {
    const deck = new GoalkeeperDeck(createGoalkeeperCards());
    const drawn = deck.drawTop();

    deck.returnToBottom(drawn);

    expect(deck.getSize()).toBe(12);
    expect(deck.toArray().at(-1)).toEqual(drawn);
  });

  it('cycles through cards when drawn cards are returned to the bottom', () => {
    const deck = new GoalkeeperDeck(createGoalkeeperCards());
    const ranks: GoalkeeperRank[] = [];

    for (let index = 0; index < GOALKEEPER_RANKS.length + 2; index += 1) {
      const card = deck.drawTop();
      ranks.push(card.rank);
      deck.returnToBottom(card);
    }

    expect(ranks).toEqual([...GOALKEEPER_RANKS, '3', '4']);
  });

  it('uses seeded random for stable shuffle order', () => {
    const firstDeck = createGoalkeeperDeck(createSeededRandom(42));
    const secondDeck = createGoalkeeperDeck(createSeededRandom(42));
    const thirdDeck = createGoalkeeperDeck(createSeededRandom(43));

    expect(firstDeck.toArray().map((card) => card.rank)).toEqual(secondDeck.toArray().map((card) => card.rank));
    expect(firstDeck.toArray().map((card) => card.rank)).not.toEqual(thirdDeck.toArray().map((card) => card.rank));
  });

  it('protects stored cards from outside mutation', () => {
    const cards = createGoalkeeperCards();
    const deck = new GoalkeeperDeck(cards);
    cards[0].rank = 'A';
    const peeked = deck.peekTop();

    if (peeked !== undefined) {
      peeked.rank = 'K';
    }

    expect(deck.peekTop()).toEqual({ kind: 'goalkeeper', rank: '3' });
  });

  it('throws when drawing from an empty goalkeeper deck', () => {
    const deck = new GoalkeeperDeck([]);

    expect(deck.peekTop()).toBeUndefined();
    expect(deck.getSize()).toBe(0);
    expect(() => deck.drawTop()).toThrow('Cannot draw from an empty goalkeeper deck.');
  });
});

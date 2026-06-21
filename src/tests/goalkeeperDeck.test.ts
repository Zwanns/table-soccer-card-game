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

function goalkeeperCard(rank: GoalkeeperRank): GoalkeeperCard {
  return {
    id: `GK_${rank}`,
    kind: 'goalkeeper',
    rank
  };
}

describe('goalkeeper cards', () => {
  it('uses a goalkeeper-specific card shape and compatible card ranks', () => {
    expectTypeOf<GoalkeeperRank>().toEqualTypeOf<Exclude<Card['rank'], '2' | 'JOKER'>>();
    expectTypeOf<GoalkeeperCard>().not.toEqualTypeOf<Card>();
    expect(createGoalkeeperCards()[0]).toMatchObject({
      id: expect.any(String),
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
    expect(cards.map((card) => card.id)).toEqual(GOALKEEPER_RANKS.map((rank) => `GK_${rank}`));
    expect(cards.every((card) => card.kind === 'goalkeeper')).toBe(true);
  });
});

describe('goalkeeper deck', () => {
  it('draws from the top and reports size', () => {
    const deck = new GoalkeeperDeck(createGoalkeeperCards());
    const top = deck.peekTop();
    const drawn = deck.drawTop();

    expect(top).toEqual({ id: 'GK_3', kind: 'goalkeeper', rank: '3' });
    expect(drawn).toEqual(top);
    expect(deck.getSize()).toBe(11);
    expect(deck.peekTop()).toEqual({ id: 'GK_4', kind: 'goalkeeper', rank: '4' });
  });

  it('returns cards to the bottom', () => {
    const deck = new GoalkeeperDeck(createGoalkeeperCards());
    const drawn = deck.drawTop();

    expect(drawn).toBeDefined();
    deck.returnToBottom(drawn!);

    expect(deck.getSize()).toBe(12);
    expect(deck.getCards().at(-1)).toEqual(drawn);
  });

  it('draws a random card while excluding the requested goalkeeper rank', () => {
    const deck = new GoalkeeperDeck([goalkeeperCard('3'), goalkeeperCard('4'), goalkeeperCard('5')]);
    const drawn = deck.drawRandomExcludingRank('3', () => 0);

    expect(drawn).toEqual(goalkeeperCard('4'));
    expect(drawn?.rank).not.toBe('3');
    expect(deck.getCards()).toEqual([goalkeeperCard('3'), goalkeeperCard('5')]);
  });

  it('uses the provided random function to choose among available non-excluded ranks', () => {
    const randomCalls: number[] = [];
    const deck = new GoalkeeperDeck([
      goalkeeperCard('3'),
      goalkeeperCard('4'),
      goalkeeperCard('5'),
      goalkeeperCard('A')
    ]);
    const drawn = deck.drawRandomExcludingRank('3', () => {
      randomCalls.push(0.75);
      return 0.75;
    });

    expect(randomCalls).toEqual([0.75]);
    expect(drawn).toEqual(goalkeeperCard('A'));
    expect(deck.getCards()).toEqual([goalkeeperCard('3'), goalkeeperCard('4'), goalkeeperCard('5')]);
  });

  it('returns undefined without calling random when no different goalkeeper rank is available', () => {
    const deck = new GoalkeeperDeck([goalkeeperCard('6')]);
    const drawn = deck.drawRandomExcludingRank('6', () => {
      throw new Error('Random should not be called when there are no candidate cards.');
    });

    expect(drawn).toBeUndefined();
    expect(deck.getCards()).toEqual([goalkeeperCard('6')]);
  });

  it('is deterministic for a fixed random value and preserves the order of non-drawn cards', () => {
    const firstDeck = new GoalkeeperDeck([goalkeeperCard('4'), goalkeeperCard('5'), goalkeeperCard('6')]);
    const secondDeck = new GoalkeeperDeck([goalkeeperCard('4'), goalkeeperCard('5'), goalkeeperCard('6')]);

    expect(firstDeck.drawRandomExcludingRank('4', () => 0.49)).toEqual(goalkeeperCard('5'));
    expect(secondDeck.drawRandomExcludingRank('4', () => 0.49)).toEqual(goalkeeperCard('5'));
    expect(firstDeck.getCards()).toEqual([goalkeeperCard('4'), goalkeeperCard('6')]);
    expect(secondDeck.getCards()).toEqual([goalkeeperCard('4'), goalkeeperCard('6')]);
  });

  it('cycles through cards when drawn cards are returned to the bottom', () => {
    const deck = new GoalkeeperDeck(createGoalkeeperCards());
    const ranks: GoalkeeperRank[] = [];

    for (let index = 0; index < GOALKEEPER_RANKS.length + 2; index += 1) {
      const card = deck.drawTop();
      expect(card).toBeDefined();
      if (card === undefined) {
        throw new Error('Expected goalkeeper card while cycling the deck.');
      }
      ranks.push(card.rank);
      deck.returnToBottom(card!);
    }

    expect(ranks).toEqual([...GOALKEEPER_RANKS, '3', '4']);
  });

  it('uses seeded random for stable shuffle order', () => {
    const firstDeck = createGoalkeeperDeck(createSeededRandom(42));
    const secondDeck = createGoalkeeperDeck(createSeededRandom(42));
    const thirdDeck = createGoalkeeperDeck(createSeededRandom(43));

    expect(firstDeck.getCards().map((card) => card.rank)).toEqual(secondDeck.getCards().map((card) => card.rank));
    expect(firstDeck.getCards().map((card) => card.rank)).not.toEqual(thirdDeck.getCards().map((card) => card.rank));
  });

  it('protects stored cards from outside mutation', () => {
    const cards = createGoalkeeperCards();
    const deck = new GoalkeeperDeck(cards);
    cards[0].rank = 'A';
    const peeked = deck.peekTop();

    if (peeked !== undefined) {
      peeked.rank = 'K';
    }

    expect(deck.peekTop()).toEqual({ id: 'GK_3', kind: 'goalkeeper', rank: '3' });
  });

  it('returns undefined when drawing from an empty goalkeeper deck', () => {
    const deck = new GoalkeeperDeck([]);

    expect(deck.peekTop()).toBeUndefined();
    expect(deck.getSize()).toBe(0);
    expect(deck.drawTop()).toBeUndefined();
  });
});

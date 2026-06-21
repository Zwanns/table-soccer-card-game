import type { GoalkeeperCard, GoalkeeperCardRank } from './GoalkeeperCard';
import type { RandomGenerator } from './seededRandom';

export class GoalkeeperDeck {
  private readonly cards: GoalkeeperCard[];

  public constructor(cards: readonly GoalkeeperCard[]) {
    this.cards = cards.map((card) => ({ ...card }));
  }

  public drawTop(): GoalkeeperCard | undefined {
    const card = this.cards.shift();

    return card === undefined ? undefined : { ...card };
  }

  public drawRandomExcludingRank(
    excludedRank: GoalkeeperCardRank,
    random: RandomGenerator
  ): GoalkeeperCard | undefined {
    const candidateIndexes = this.cards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => card.rank !== excludedRank)
      .map(({ index }) => index);

    if (candidateIndexes.length === 0) {
      return undefined;
    }

    const candidateIndex = Math.min(Math.floor(random() * candidateIndexes.length), candidateIndexes.length - 1);
    const cardIndex = candidateIndexes[candidateIndex]!;
    const [card] = this.cards.splice(cardIndex, 1);

    return card === undefined ? undefined : { ...card };
  }

  public returnToBottom(card: GoalkeeperCard): void {
    this.cards.push({ ...card });
  }

  public peekTop(): GoalkeeperCard | undefined {
    const card = this.cards[0];

    return card === undefined ? undefined : { ...card };
  }

  public getSize(): number {
    return this.cards.length;
  }

  public getCards(): readonly GoalkeeperCard[] {
    return this.cards.map((card) => ({ ...card }));
  }

  public toArray(): GoalkeeperCard[] {
    return [...this.getCards()];
  }
}

import type { GoalkeeperCard } from './GoalkeeperCard';

export class GoalkeeperDeck {
  private readonly cards: GoalkeeperCard[];

  public constructor(cards: readonly GoalkeeperCard[]) {
    this.cards = cards.map((card) => ({ ...card }));
  }

  public drawTop(): GoalkeeperCard | undefined {
    const card = this.cards.shift();

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

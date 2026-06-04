import type { Card } from './Card';

export interface Deck {
  cards: Card[];
}

export function shuffleDeck(deck: Deck, random: () => number): Deck {
  const cards = [...deck.cards];

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }

  return { cards };
}

export function drawTopCard(deck: Deck): Card | null {
  return deck.cards.shift() ?? null;
}

export function addCardsToBottom(deck: Deck, cards: Card[]): void {
  deck.cards.push(...cards);
}

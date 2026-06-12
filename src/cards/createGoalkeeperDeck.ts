import type { RandomGenerator } from './seededRandom';
import { GoalkeeperDeck } from './GoalkeeperDeck';
import { GOALKEEPER_RANKS, type GoalkeeperCard } from './GoalkeeperCard';

export function createGoalkeeperDeck(random: RandomGenerator): GoalkeeperDeck {
  return new GoalkeeperDeck(shuffleGoalkeeperCards(createGoalkeeperCards(), random));
}

export function createGoalkeeperCards(): GoalkeeperCard[] {
  return GOALKEEPER_RANKS.map((rank) => ({
    id: `GK_${rank}`,
    kind: 'goalkeeper',
    rank
  }));
}

function shuffleGoalkeeperCards(cards: readonly GoalkeeperCard[], random: RandomGenerator): GoalkeeperCard[] {
  const shuffledCards = cards.map((card) => ({ ...card }));

  for (let index = shuffledCards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffledCards[index], shuffledCards[swapIndex]] = [shuffledCards[swapIndex], shuffledCards[index]];
  }

  return shuffledCards;
}

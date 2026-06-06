import {
  BLACK_SUITS,
  RED_SUITS,
  STANDARD_RANKS,
  type Card,
  type CardColor,
  type CardSuit
} from './Card';
import type { Deck } from './Deck';

export function createPlayerDecks(): [Deck, Deck] {
  return [
    { cards: [...createStandardCards('RED', RED_SUITS), createJoker('PLAYER_1', 'RED')] },
    { cards: [...createStandardCards('BLACK', BLACK_SUITS), createJoker('PLAYER_2', 'BLACK')] }
  ];
}

function createStandardCards(color: Exclude<CardColor, 'JOKER'>, suits: readonly CardSuit[]): Card[] {
  return suits.flatMap((suit) =>
    STANDARD_RANKS.map((rank) => ({
      id: `${rank}_${suit}`,
      rank,
      color,
      suit
    }))
  );
}

function createJoker(ownerId: 'PLAYER_1' | 'PLAYER_2', color: Exclude<CardColor, 'JOKER'>): Card {
  return {
    id: `JOKER_${ownerId}`,
    rank: 'JOKER',
    color,
    suit: null
  };
}

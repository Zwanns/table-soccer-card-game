export type CardRank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A'
  | 'JOKER';

export type CardColor = 'RED' | 'BLACK' | 'JOKER';

export type CardSuit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES' | null;

export interface Card {
  id: string;
  rank: CardRank;
  color: CardColor;
  suit: CardSuit;
}

export const STANDARD_RANKS: readonly Exclude<CardRank, 'JOKER'>[] = [
  '2',
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
];

export const RED_SUITS: readonly CardSuit[] = ['HEARTS', 'DIAMONDS'];
export const BLACK_SUITS: readonly CardSuit[] = ['CLUBS', 'SPADES'];

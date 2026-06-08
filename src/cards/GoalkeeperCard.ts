import type { CardRank } from './Card';

export type GoalkeeperRank = Exclude<CardRank, '2' | 'JOKER'>;

export type GoalkeeperCard = {
  kind: 'goalkeeper';
  rank: GoalkeeperRank;
};

export const GOALKEEPER_RANKS: readonly GoalkeeperRank[] = [
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

import type { CardRank } from './Card';

export type GoalkeeperCardRank = Exclude<CardRank, '2' | 'JOKER'>;
export type GoalkeeperRank = GoalkeeperCardRank;

export type GoalkeeperCard = {
  id: string;
  rank: GoalkeeperCardRank;
  kind: 'goalkeeper';
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

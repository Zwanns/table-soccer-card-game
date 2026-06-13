import type { Card, CardRank } from './Card';

type RankedCard = Pick<Card, 'rank'>;

const RANK_VALUES: Record<CardRank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
  JOKER: 15
};

const SPECIAL_BEATS: ReadonlySet<string> = new Set(['2:JOKER', '6:A', '7:K', '8:Q', '9:J']);

export function getRankValue(rank: CardRank): number {
  return RANK_VALUES[rank];
}

export function isSpecialBeat(attacker: RankedCard, defender: RankedCard): boolean {
  return SPECIAL_BEATS.has(`${attacker.rank}:${defender.rank}`);
}

export function canBeat(attacker: RankedCard, defender: RankedCard): boolean {
  if (isSpecialBeat(attacker, defender)) {
    return true;
  }

  return getRankValue(attacker.rank) >= getRankValue(defender.rank);
}

export function canCommittedMidfielderBeat(attacker: RankedCard, defender: RankedCard): boolean {
  if (isSpecialBeat(attacker, defender)) {
    return true;
  }

  return getRankValue(attacker.rank) > getRankValue(defender.rank);
}

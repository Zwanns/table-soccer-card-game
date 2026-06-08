import type { TournamentFormatId, TournamentGroupId, TournamentStage } from './tournamentTypes';

export type KnockoutRoundFormat = {
  stage: Exclude<TournamentStage, 'group' | 'complete'>;
  matchCount: number;
};

export type TournamentFormat = {
  id: TournamentFormatId;
  name: string;
  teamCount: number;
  groupCount: number;
  groupSize: 4;
  advancingPerGroup: 2;
  groupIds: TournamentGroupId[];
  knockoutRounds: KnockoutRoundFormat[];
};

const GROUP_IDS: readonly TournamentGroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const TOURNAMENT_FORMATS: Record<TournamentFormatId, TournamentFormat> = {
  'cup-m': {
    id: 'cup-m',
    name: 'Cup M',
    teamCount: 8,
    groupCount: 2,
    groupSize: 4,
    advancingPerGroup: 2,
    groupIds: [...GROUP_IDS.slice(0, 2)],
    knockoutRounds: [
      { stage: 'semi-final', matchCount: 2 },
      { stage: 'final', matchCount: 1 }
    ]
  },
  'cup-l': {
    id: 'cup-l',
    name: 'Cup L',
    teamCount: 16,
    groupCount: 4,
    groupSize: 4,
    advancingPerGroup: 2,
    groupIds: [...GROUP_IDS.slice(0, 4)],
    knockoutRounds: [
      { stage: 'quarter-final', matchCount: 4 },
      { stage: 'semi-final', matchCount: 2 },
      { stage: 'final', matchCount: 1 }
    ]
  },
  'cup-xl': {
    id: 'cup-xl',
    name: 'Cup XL',
    teamCount: 32,
    groupCount: 8,
    groupSize: 4,
    advancingPerGroup: 2,
    groupIds: [...GROUP_IDS],
    knockoutRounds: [
      { stage: 'round-of-16', matchCount: 8 },
      { stage: 'quarter-final', matchCount: 4 },
      { stage: 'semi-final', matchCount: 2 },
      { stage: 'final', matchCount: 1 }
    ]
  }
};

export function getTournamentFormat(formatId: TournamentFormatId): TournamentFormat {
  return TOURNAMENT_FORMATS[formatId];
}

export function getTournamentMatchCount(formatId: TournamentFormatId): number {
  const format = getTournamentFormat(formatId);
  const groupMatches = format.groupCount * 6;
  const knockoutMatches = format.knockoutRounds.reduce((total, round) => total + round.matchCount, 0);

  return groupMatches + knockoutMatches;
}

import type { TournamentFormat } from './TournamentFormat';
import type { TournamentGroup, TournamentMatch } from './tournamentTypes';

const GROUP_PAIRINGS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [2, 3],
  [0, 2],
  [3, 1],
  [0, 3],
  [1, 2]
];

export function createTournamentMatches(format: TournamentFormat, groups: readonly TournamentGroup[]): TournamentMatch[] {
  const matches: TournamentMatch[] = [];

  for (const group of groups) {
    GROUP_PAIRINGS.forEach(([homeIndex, awayIndex], pairingIndex) => {
      matches.push({
        id: `group-${group.id}-${pairingIndex + 1}`,
        stage: 'group',
        roundIndex: Math.floor(pairingIndex / 2),
        orderIndex: matches.length,
        groupId: group.id,
        homeTeamId: group.teamIds[homeIndex],
        awayTeamId: group.teamIds[awayIndex],
        status: 'available'
      });
    });
  }

  format.knockoutRounds.forEach((round, roundIndex) => {
    for (let matchIndex = 0; matchIndex < round.matchCount; matchIndex += 1) {
      matches.push({
        id: `${round.stage}-${matchIndex + 1}`,
        stage: round.stage,
        roundIndex,
        orderIndex: matches.length,
        status: 'locked'
      });
    }
  });

  return matches;
}

export function getCompletedGroupMatches(matches: readonly TournamentMatch[], groupId: string): TournamentMatch[] {
  return matches.filter((match) => match.groupId === groupId && match.status === 'completed' && match.result !== undefined);
}

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

  for (let roundIndex = 0; roundIndex < GROUP_PAIRINGS.length / 2; roundIndex += 1) {
    for (const group of groups) {
      GROUP_PAIRINGS.slice(roundIndex * 2, roundIndex * 2 + 2).forEach(([homeIndex, awayIndex], roundPairingIndex) => {
        const pairingIndex = roundIndex * 2 + roundPairingIndex;

        matches.push({
          id: `group-${group.id}-${pairingIndex + 1}`,
          stage: 'group',
          roundIndex,
          orderIndex: matches.length,
          groupId: group.id,
          homeTeamId: group.teamIds[homeIndex],
          awayTeamId: group.teamIds[awayIndex],
          status: 'available'
        });
      });
    }
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

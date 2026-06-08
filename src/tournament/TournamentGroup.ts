import type { TournamentFormat } from './TournamentFormat';
import type { TournamentGroup, TournamentTeamId } from './tournamentTypes';

export function createTournamentGroups(format: TournamentFormat, teamIds: readonly TournamentTeamId[]): TournamentGroup[] {
  return format.groupIds.map((groupId, index) => ({
    id: groupId,
    teamIds: teamIds.slice(index * format.groupSize, index * format.groupSize + format.groupSize)
  }));
}

import { getTournamentFormat } from './TournamentFormat';
import { createTournamentGroups } from './TournamentGroup';
import { createTournamentMatches } from './TournamentMatch';
import { shuffleValues } from './tournamentRandom';
import type { TournamentFormatId, TournamentState, TournamentTeamId } from './tournamentTypes';

export type CreateTournamentStateOptions = {
  formatId: TournamentFormatId;
  teamIds: readonly TournamentTeamId[];
  seed?: string;
};

export function createTournamentState(options: CreateTournamentStateOptions): TournamentState {
  const format = getTournamentFormat(options.formatId);
  const teamIds = [...options.teamIds];
  const seed = options.seed ?? `${options.formatId}:default`;

  assertExactTeamCount(options.formatId, teamIds);
  assertUniqueTeams(teamIds);

  const groups = createTournamentGroups(format, teamIds);
  const drawOrder = createDrawOrder(teamIds, seed);

  return {
    id: `${options.formatId}:${seed}`,
    formatId: options.formatId,
    seed,
    stage: 'group',
    teamIds,
    groups,
    matches: createTournamentMatches(format, groups),
    drawOrder
  };
}

export function assertExactTeamCount(formatId: TournamentFormatId, teamIds: readonly TournamentTeamId[]): void {
  const format = getTournamentFormat(formatId);

  if (teamIds.length !== format.teamCount) {
    throw new Error(`${format.name} requires exactly ${format.teamCount} teams.`);
  }
}

export function assertUniqueTeams(teamIds: readonly TournamentTeamId[]): void {
  if (new Set(teamIds).size !== teamIds.length) {
    throw new Error('Tournament teams must be unique.');
  }
}

function createDrawOrder(teamIds: readonly TournamentTeamId[], seed: string): Record<TournamentTeamId, number> {
  return Object.fromEntries(shuffleValues(teamIds, `${seed}:draw-order`).map((teamId, index) => [teamId, index]));
}

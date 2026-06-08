import { NATIONAL_TEAMS } from '../data/nationalTeams';
import { getTournamentFormat } from './TournamentFormat';
import { refreshTournamentProgress } from './TournamentBracket';
import { createTournamentState } from './TournamentState';
import { shuffleValues, takeRandomUnique } from './tournamentRandom';
import type {
  TournamentFormatId,
  TournamentMatchResult,
  TournamentState,
  TournamentTeamId
} from './tournamentTypes';

export type SubmitTournamentMatchResultInput = {
  homeGoals: number;
  awayGoals: number;
  homeShots?: number;
  awayShots?: number;
};

export class TournamentEngine {
  public static create(formatId: TournamentFormatId, teamIds: readonly TournamentTeamId[], seed?: string): TournamentState {
    return createTournamentState({ formatId, teamIds, seed });
  }

  public static submitMatchResult(
    tournament: TournamentState,
    matchId: string,
    input: SubmitTournamentMatchResultInput
  ): TournamentState {
    return submitTournamentMatchResult(tournament, matchId, input);
  }

  public static fillRandom(formatId: TournamentFormatId, seed: string): TournamentTeamId[] {
    return fillTournamentTeamsRandom(formatId, seed);
  }

  public static fillEmptySlots(
    formatId: TournamentFormatId,
    slots: readonly (TournamentTeamId | null)[],
    seed: string
  ): TournamentTeamId[] {
    return fillEmptyTournamentSlots(formatId, slots, seed);
  }

  public static shuffleTeams(teamIds: readonly TournamentTeamId[], seed: string): TournamentTeamId[] {
    return shuffleTournamentTeams(teamIds, seed);
  }
}

export function fillTournamentTeamsRandom(
  formatId: TournamentFormatId,
  seed: string,
  availableTeamIds: readonly TournamentTeamId[] = NATIONAL_TEAMS.map((team) => team.flagCode)
): TournamentTeamId[] {
  const format = getTournamentFormat(formatId);

  return takeRandomUnique(availableTeamIds, format.teamCount, `${seed}:fill-random`);
}

export function fillEmptyTournamentSlots(
  formatId: TournamentFormatId,
  slots: readonly (TournamentTeamId | null)[],
  seed: string,
  availableTeamIds: readonly TournamentTeamId[] = NATIONAL_TEAMS.map((team) => team.flagCode)
): TournamentTeamId[] {
  const format = getTournamentFormat(formatId);

  if (slots.length !== format.teamCount) {
    throw new Error(`${format.name} requires exactly ${format.teamCount} slots.`);
  }

  const selectedTeamIds = slots.flatMap((teamId) => (teamId === null ? [] : [teamId]));

  if (new Set(selectedTeamIds).size !== selectedTeamIds.length) {
    throw new Error('Tournament teams must be unique.');
  }

  const selectedSet = new Set(selectedTeamIds);
  const candidates = availableTeamIds.filter((teamId) => !selectedSet.has(teamId));
  const missingCount = slots.filter((teamId) => teamId === null).length;
  const randomTeams = takeRandomUnique(candidates, missingCount, `${seed}:fill-empty`);
  let randomIndex = 0;

  return slots.map((teamId) => {
    if (teamId !== null) {
      return teamId;
    }

    const filledTeamId = randomTeams[randomIndex];
    randomIndex += 1;

    return filledTeamId;
  });
}

export function shuffleTournamentTeams(teamIds: readonly TournamentTeamId[], seed: string): TournamentTeamId[] {
  if (new Set(teamIds).size !== teamIds.length) {
    throw new Error('Tournament teams must be unique.');
  }

  return shuffleValues(teamIds, `${seed}:shuffle-groups`);
}

export function submitTournamentMatchResult(
  tournament: TournamentState,
  matchId: string,
  input: SubmitTournamentMatchResultInput
): TournamentState {
  const match = tournament.matches.find((candidate) => candidate.id === matchId);

  if (match === undefined) {
    throw new Error(`Tournament match "${matchId}" does not exist.`);
  }

  if (match.status === 'completed') {
    throw new Error('Completed match cannot be submitted twice.');
  }

  if (match.status === 'locked' || match.homeTeamId === undefined || match.awayTeamId === undefined) {
    throw new Error('Cannot submit a result for a locked tournament match.');
  }

  const result = createTournamentMatchResult(match.id, match.homeTeamId, match.awayTeamId, input);

  validateMatchResultForStage(match.stage, result);

  return refreshTournamentProgress({
    ...tournament,
    matches: tournament.matches.map((candidate) =>
      candidate.id === matchId
        ? {
            ...candidate,
            status: 'completed',
            result
          }
        : candidate
    )
  });
}

export function submitTournamentMatchResultObject(
  tournament: TournamentState,
  result: TournamentMatchResult
): TournamentState {
  const match = tournament.matches.find((candidate) => candidate.id === result.matchId);

  if (match === undefined) {
    throw new Error(`Tournament match "${result.matchId}" does not exist.`);
  }

  if (match.status === 'completed') {
    throw new Error('Completed match cannot be submitted twice.');
  }

  if (match.status === 'locked' || match.homeTeamId === undefined || match.awayTeamId === undefined) {
    throw new Error('Cannot submit a result for a locked tournament match.');
  }

  if (match.homeTeamId !== result.homeTeamId || match.awayTeamId !== result.awayTeamId) {
    throw new Error('Tournament match result teams do not match the fixture.');
  }

  validateMatchResultForStage(match.stage, result);

  return refreshTournamentProgress({
    ...tournament,
    matches: tournament.matches.map((candidate) =>
      candidate.id === result.matchId
        ? {
            ...candidate,
            status: 'completed',
            result
          }
        : candidate
    )
  });
}

export function createTournamentMatchResult(
  matchId: string,
  homeTeamId: TournamentTeamId,
  awayTeamId: TournamentTeamId,
  input: SubmitTournamentMatchResultInput
): TournamentMatchResult {
  const winnerTeamId =
    input.homeGoals > input.awayGoals ? homeTeamId : input.awayGoals > input.homeGoals ? awayTeamId : undefined;

  return {
    matchId,
    homeTeamId,
    awayTeamId,
    homeGoals: input.homeGoals,
    awayGoals: input.awayGoals,
    winnerTeamId,
    teamStats: {
      home: {
        teamId: homeTeamId,
        goals: input.homeGoals,
        shots: input.homeShots ?? input.homeGoals,
        goalpostHits: 0,
        goalkeeperSaves: 0
      },
      away: {
        teamId: awayTeamId,
        goals: input.awayGoals,
        shots: input.awayShots ?? input.awayGoals,
        goalpostHits: 0,
        goalkeeperSaves: 0
      }
    },
    playerStats: []
  };
}

function validateMatchResultForStage(stage: string, result: TournamentMatchResult): void {
  if (stage !== 'group' && result.winnerTeamId === undefined) {
    throw new Error('Ничья в плей-офф требует серию пенальти. Серия пенальти будет добавлена на Этапе 5.');
  }
}

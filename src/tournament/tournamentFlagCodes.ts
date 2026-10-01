import { normalizeFlagCode, normalizeFlagCodeKeys } from '../data/flagCodes';
import type { TournamentMatchResult, TournamentState } from './tournamentTypes';

// Normalize semantic team identities only. Match IDs, seeds, player IDs and names are opaque.
export function normalizeTournamentMatchResult(result: TournamentMatchResult): TournamentMatchResult {
  const penalty = result.penaltyShootout;
  return {
    ...result,
    homeTeamId: normalizeFlagCode(result.homeTeamId),
    awayTeamId: normalizeFlagCode(result.awayTeamId),
    ...(result.winnerTeamId === undefined ? {} : { winnerTeamId: normalizeFlagCode(result.winnerTeamId) }),
    ...(result.teamStats === undefined ? {} : {
      teamStats: {
        home: { ...result.teamStats.home, teamId: normalizeFlagCode(result.teamStats.home.teamId) },
        away: { ...result.teamStats.away, teamId: normalizeFlagCode(result.teamStats.away.teamId) }
      }
    }),
    ...(result.playerStats === undefined ? {} : {
      playerStats: result.playerStats.map((stats) => ({ ...stats, teamId: normalizeFlagCode(stats.teamId) }))
    }),
    ...(penalty === undefined ? {} : {
      penaltyShootout: {
        ...penalty,
        winnerTeamId: normalizeFlagCode(penalty.winnerTeamId),
        kicks: penalty.kicks.map((kick) => ({ ...kick, shooterTeamId: normalizeFlagCode(kick.shooterTeamId) })),
        ...(penalty.attempts === undefined ? {} : {
          attempts: penalty.attempts.map((attempt) => ({ ...attempt, teamId: normalizeFlagCode(attempt.teamId) }))
        })
      }
    })
  };
}

export function normalizeTournamentFlagCodes(tournament: TournamentState): TournamentState {
  return {
    ...tournament,
    teamIds: tournament.teamIds.map(normalizeFlagCode),
    ...(tournament.participants === undefined ? {} : {
      participants: tournament.participants.map((participant) => ({
        ...participant, flagCode: normalizeFlagCode(participant.flagCode)
      }))
    }),
    groups: tournament.groups.map((group) => ({ ...group, teamIds: group.teamIds.map(normalizeFlagCode) })),
    matches: tournament.matches.map((match) => ({
      ...match,
      ...(match.homeTeamId === undefined ? {} : { homeTeamId: normalizeFlagCode(match.homeTeamId) }),
      ...(match.awayTeamId === undefined ? {} : { awayTeamId: normalizeFlagCode(match.awayTeamId) }),
      ...(match.result === undefined ? {} : { result: normalizeTournamentMatchResult(match.result) })
    })),
    drawOrder: normalizeFlagCodeKeys(tournament.drawOrder)
  };
}

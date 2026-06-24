import type { NationalTeamSquad } from '../data/squadTypes';
import { loadSquad } from '../services/squadStorage';
import type { PenaltyAttemptSummary, PenaltyKickResult, TournamentPenaltyResult, TournamentTeamId } from '../tournament';
import { getPlayerSurname } from './cardPlayerProfile';

export type PenaltySquadResolver = (teamId: TournamentTeamId) => NationalTeamSquad | undefined;

export function createPenaltyAttemptSummaries(
  kicks: readonly PenaltyKickResult[],
  resolveSquad: PenaltySquadResolver = resolveStoredSquad
): PenaltyAttemptSummary[] {
  const teamRounds = new Map<TournamentTeamId, number>();

  return kicks.map((kick) => {
    const roundIndex = (teamRounds.get(kick.shooterTeamId) ?? 0) + 1;
    teamRounds.set(kick.shooterTeamId, roundIndex);

    return {
      teamId: kick.shooterTeamId,
      shooterRank: kick.attackerRank,
      shooterLabel: resolvePenaltyShooterLabel(kick.shooterTeamId, kick.attackerRank, resolveSquad),
      success: kick.outcome === 'goal',
      outcome: kick.outcome,
      roundIndex
    };
  });
}

export function getPenaltyAttemptSummaries(
  penaltyResult: Pick<TournamentPenaltyResult, 'attempts' | 'kicks'>,
  resolveSquad: PenaltySquadResolver = resolveStoredSquad
): PenaltyAttemptSummary[] {
  return penaltyResult.attempts?.map((attempt) => ({ ...attempt })) ?? createPenaltyAttemptSummaries(penaltyResult.kicks, resolveSquad);
}

export function getPenaltyAttemptsForTeam(
  attempts: readonly PenaltyAttemptSummary[],
  teamId: TournamentTeamId
): PenaltyAttemptSummary[] {
  return attempts.filter((attempt) => attempt.teamId === teamId);
}

export function formatPenaltyAttempt(attempt: Pick<PenaltyAttemptSummary, 'shooterLabel' | 'success'>): string {
  return `${attempt.shooterLabel} ${attempt.success ? '✓' : '✗'}`;
}

export function resolvePenaltyShooterLabel(
  teamId: TournamentTeamId,
  rank: PenaltyKickResult['attackerRank'],
  resolveSquad: PenaltySquadResolver = resolveStoredSquad
): string {
  try {
    const playerName = resolveSquad(teamId)?.fieldPlayers[rank]?.name;

    if (playerName !== undefined && playerName.trim() !== '') {
      return getPlayerSurname(playerName);
    }
  } catch {
    // A missing custom squad must not break penalty results.
  }

  return `Player ${rank}`;
}

function resolveStoredSquad(teamId: TournamentTeamId): NationalTeamSquad | undefined {
  try {
    return loadSquad(teamId);
  } catch {
    return undefined;
  }
}

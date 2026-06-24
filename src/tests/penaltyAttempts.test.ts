import { describe, expect, it } from 'vitest';
import { createDefaultSquad } from '../data/defaultSquads';
import type { PenaltyKickResult } from '../tournament';
import {
  createPenaltyAttemptSummaries,
  formatPenaltyAttempt,
  getPenaltyAttemptSummaries,
  getPenaltyAttemptsForTeam,
  resolvePenaltyShooterLabel
} from '../ui/penaltyAttempts';

const kicks: PenaltyKickResult[] = [
  { shooterTeamId: 'fr', attackerRank: 'A', goalkeeperRank: '6', outcome: 'goal' },
  { shooterTeamId: 'es', attackerRank: 'K', goalkeeperRank: '8', outcome: 'save' },
  { shooterTeamId: 'fr', attackerRank: 'Q', goalkeeperRank: 'Q', outcome: 'post' }
];

describe('penalty attempt display data', () => {
  it('resolves shooter surnames, outcomes and per-team round indexes', () => {
    const france = createDefaultSquad('fr');
    const spain = createDefaultSquad('es');
    france.fieldPlayers.A.name = 'Marco Rossi';
    spain.fieldPlayers.K.name = 'Roberto Baggio';
    const attempts = createPenaltyAttemptSummaries(kicks, (teamId) => (teamId === 'fr' ? france : spain));

    expect(attempts).toEqual([
      expect.objectContaining({ teamId: 'fr', shooterRank: 'A', shooterLabel: 'Rossi', success: true, roundIndex: 1 }),
      expect.objectContaining({ teamId: 'es', shooterRank: 'K', shooterLabel: 'Baggio', success: false, roundIndex: 1 }),
      expect.objectContaining({ teamId: 'fr', shooterRank: 'Q', success: false, outcome: 'post', roundIndex: 2 })
    ]);
    expect(formatPenaltyAttempt(attempts[0]!)).toBe('Rossi ✓');
    expect(formatPenaltyAttempt(attempts[1]!)).toBe('Baggio ✗');
    expect(getPenaltyAttemptsForTeam(attempts, 'fr')).toHaveLength(2);
  });

  it('uses a stable rank fallback when a squad or player cannot be resolved', () => {
    expect(resolvePenaltyShooterLabel('missing-team', 'A', () => undefined)).toBe('Player A');
    expect(() => createPenaltyAttemptSummaries(kicks, () => undefined)).not.toThrow();
  });

  it('prefers persisted attempt summaries in post-match result data', () => {
    const storedAttempts = createPenaltyAttemptSummaries(kicks, () => undefined);
    storedAttempts[0]!.shooterLabel = 'Saved scorer';

    expect(getPenaltyAttemptSummaries({ kicks, attempts: storedAttempts })[0]?.shooterLabel).toBe('Saved scorer');
  });
});

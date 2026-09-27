import type { MatchLaunchContext, TournamentState } from '../tournament';

export function getMatchHeaderContext(
  mode: 'quick' | 'tutorial',
  context: MatchLaunchContext,
  tournament?: TournamentState
): string {
  if (mode === 'tutorial') return 'TUTORIAL';
  if (context.mode !== 'tournament') return 'QUICK MATCH';
  if (tournament?.id !== context.tournamentId) return 'TOURNAMENT';
  const match = tournament.matches.find((candidate) => candidate.id === context.tournamentMatchId);
  if (!match) return 'TOURNAMENT';
  const stage = match.stage === 'group'
    ? (match.groupId ? `GROUP ${match.groupId}` : undefined)
    : { 'round-of-16': 'ROUND OF 16', 'quarter-final': 'QUARTER-FINAL', 'semi-final': 'SEMI-FINAL', final: 'FINAL', complete: undefined }[match.stage];
  if (!stage) return 'TOURNAMENT';
  return `${tournament.formatId.replace('-', ' ').toUpperCase()} /\n${stage}`;
}

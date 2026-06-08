export type MatchLaunchContext =
  | {
      mode: 'quick-match';
    }
  | {
      mode: 'tournament';
      tournamentId: string;
      tournamentMatchId: string;
    };

export const QUICK_MATCH_CONTEXT: MatchLaunchContext = {
  mode: 'quick-match'
};

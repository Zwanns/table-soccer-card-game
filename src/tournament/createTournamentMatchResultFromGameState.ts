import { getMatchStats, type GameState } from '../game';
import { createTournamentMatchPlayerStatsFromGameState } from './TournamentPlayerStats';
import type { TournamentMatchResult, TournamentTeamId } from './tournamentTypes';

export function createTournamentMatchResultFromGameState(
  tournamentMatchId: string,
  gameState: Readonly<GameState>,
  homeTeamId: TournamentTeamId,
  awayTeamId: TournamentTeamId
): TournamentMatchResult {
  const [homePlayer, awayPlayer] = gameState.players;
  const [homeStats, awayStats] = getMatchStats(gameState);
  const winnerTeamId =
    homePlayer.goals > awayPlayer.goals ? homeTeamId : awayPlayer.goals > homePlayer.goals ? awayTeamId : undefined;

  return {
    matchId: tournamentMatchId,
    homeTeamId,
    awayTeamId,
    homeGoals: homePlayer.goals,
    awayGoals: awayPlayer.goals,
    winnerTeamId,
    teamStats: {
      home: {
        teamId: homeTeamId,
        goals: homePlayer.goals,
        shots: homeStats.shots,
        goalpostHits: homeStats.goalpostHits,
        goalkeeperSaves: homeStats.goalkeeperSaves
      },
      away: {
        teamId: awayTeamId,
        goals: awayPlayer.goals,
        shots: awayStats.shots,
        goalpostHits: awayStats.goalpostHits,
        goalkeeperSaves: awayStats.goalkeeperSaves
      }
    },
    playerStats: createTournamentMatchPlayerStatsFromGameState(gameState, homeTeamId, awayTeamId)
  };
}

import type {
  TournamentMatch,
  TournamentMatchPlayerStats,
  TournamentMatchTeamStat,
  TournamentPlayerStats,
  TournamentState,
  TournamentTeamId,
  TournamentTeamStats
} from './tournamentTypes';

export type TournamentTeamStatsRankingKey =
  | 'goalsFor'
  | 'shots'
  | 'goalkeeperSaves'
  | 'wins';

export type TournamentPlayerStatsRankingKey = 'goals' | 'assists' | 'goalkeeperSaves';

export function getTournamentTeamStats(
  tournament: Pick<TournamentState, 'teamIds' | 'matches'>
): TournamentTeamStats[] {
  const stats = new Map(tournament.teamIds.map((teamId) => [teamId, createEmptyTournamentTeamStats(teamId)]));

  for (const match of tournament.matches) {
    if (match.status !== 'completed' || match.result === undefined) {
      continue;
    }

    applyTeamMatchStats(stats, match, 'home');
    applyTeamMatchStats(stats, match, 'away');
  }

  return [...stats.values()].sort(compareTournamentTeamStats);
}

export function getTournamentTeamStatsRanking(
  stats: readonly TournamentTeamStats[],
  key: TournamentTeamStatsRankingKey,
  limit = 5
): TournamentTeamStats[] {
  return [...stats].sort((first, second) => compareStatsByKey(first, second, key)).slice(0, limit);
}

export function getTournamentPlayerStats(tournament: Pick<TournamentState, 'matches'>): TournamentPlayerStats[] {
  const stats = new Map<string, TournamentPlayerStats>();

  for (const match of tournament.matches) {
    if (match.status !== 'completed' || match.result === undefined) {
      continue;
    }

    for (const playerStats of match.result.playerStats) {
      applyPlayerMatchStats(stats, playerStats);
    }
  }

  return [...stats.values()].sort(compareTournamentPlayerStats);
}

export function getTournamentPlayerStatsRanking(
  stats: readonly TournamentPlayerStats[],
  key: TournamentPlayerStatsRankingKey,
  limit = 5
): TournamentPlayerStats[] {
  return [...stats].sort((first, second) => comparePlayerStatsByKey(first, second, key)).slice(0, limit);
}

export function createEmptyTournamentTeamStats(teamId: TournamentTeamId): TournamentTeamStats {
  return {
    teamId,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    shots: 0,
    goalkeeperSaves: 0,
    penaltyShootoutWins: 0,
    penaltyShootoutLosses: 0,
    penaltyGoals: 0,
    penaltyGoalkeeperSaves: 0
  };
}

function applyTeamMatchStats(
  stats: Map<TournamentTeamId, TournamentTeamStats>,
  match: TournamentMatch,
  side: 'home' | 'away'
): void {
  const result = match.result;

  if (result === undefined) {
    return;
  }

  const teamId = side === 'home' ? result.homeTeamId : result.awayTeamId;
  const opponentTeamId = side === 'home' ? result.awayTeamId : result.homeTeamId;
  const goalsFor = side === 'home' ? result.homeGoals : result.awayGoals;
  const goalsAgainst = side === 'home' ? result.awayGoals : result.homeGoals;
  const teamMatchStats = side === 'home' ? result.teamStats.home : result.teamStats.away;
  const teamStats = getOrCreateStats(stats, teamId);

  applyOrdinaryMatchStats(teamStats, teamMatchStats, goalsFor, goalsAgainst);

  if (result.penaltyShootout !== undefined) {
    const penaltyGoals = side === 'home' ? result.penaltyShootout.homeGoals : result.penaltyShootout.awayGoals;
    const penaltySaves = result.penaltyShootout.kicks.filter(
      (kick) => kick.shooterTeamId === opponentTeamId && kick.outcome === 'save'
    ).length;

    teamStats.penaltyGoals += penaltyGoals;
    teamStats.penaltyGoalkeeperSaves += penaltySaves;

    if (result.penaltyShootout.winnerTeamId === teamId) {
      teamStats.penaltyShootoutWins += 1;
    } else {
      teamStats.penaltyShootoutLosses += 1;
    }
  }
}

function applyOrdinaryMatchStats(
  stats: TournamentTeamStats,
  matchStats: TournamentMatchTeamStat,
  goalsFor: number,
  goalsAgainst: number
): void {
  stats.played += 1;
  stats.goalsFor += goalsFor;
  stats.goalsAgainst += goalsAgainst;
  stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
  stats.shots += matchStats.shots;
  stats.goalkeeperSaves += matchStats.goalkeeperSaves;

  if (goalsFor > goalsAgainst) {
    stats.wins += 1;
  } else if (goalsFor < goalsAgainst) {
    stats.losses += 1;
  } else {
    stats.draws += 1;
  }
}

function getOrCreateStats(
  stats: Map<TournamentTeamId, TournamentTeamStats>,
  teamId: TournamentTeamId
): TournamentTeamStats {
  const existingStats = stats.get(teamId);

  if (existingStats !== undefined) {
    return existingStats;
  }

  const createdStats = createEmptyTournamentTeamStats(teamId);
  stats.set(teamId, createdStats);
  return createdStats;
}

function applyPlayerMatchStats(
  stats: Map<string, TournamentPlayerStats>,
  matchStats: TournamentMatchPlayerStats
): void {
  const playerStats = getOrCreatePlayerStats(stats, matchStats);

  playerStats.goals += matchStats.goals;
  playerStats.assists += matchStats.assists;
  playerStats.goalkeeperSaves += matchStats.goalkeeperSaves;
  playerStats.penaltyGoals += matchStats.penaltyGoals;
  playerStats.penaltyGoalkeeperSaves += matchStats.penaltyGoalkeeperSaves;
}

function getOrCreatePlayerStats(
  stats: Map<string, TournamentPlayerStats>,
  matchStats: TournamentMatchPlayerStats
): TournamentPlayerStats {
  const key = createPlayerStatsKey(matchStats.teamId, matchStats.playerId);
  const existingStats = stats.get(key);

  if (existingStats !== undefined) {
    return existingStats;
  }

  const createdStats: TournamentPlayerStats = {
    teamId: matchStats.teamId,
    playerId: matchStats.playerId,
    playerName: matchStats.playerName,
    shirtNumber: matchStats.shirtNumber,
    goals: 0,
    assists: 0,
    goalkeeperSaves: 0,
    penaltyGoals: 0,
    penaltyGoalkeeperSaves: 0
  };

  stats.set(key, createdStats);
  return createdStats;
}

function createPlayerStatsKey(teamId: TournamentTeamId, playerId: string): string {
  return `${teamId}:${playerId}`;
}

function compareStatsByKey(
  first: TournamentTeamStats,
  second: TournamentTeamStats,
  key: TournamentTeamStatsRankingKey
): number {
  return second[key] - first[key] || compareTournamentTeamStats(first, second);
}

function compareTournamentTeamStats(first: TournamentTeamStats, second: TournamentTeamStats): number {
  return (
    second.wins - first.wins ||
    second.goalDifference - first.goalDifference ||
    second.goalsFor - first.goalsFor ||
    second.shots - first.shots ||
    first.teamId.localeCompare(second.teamId)
  );
}

function comparePlayerStatsByKey(
  first: TournamentPlayerStats,
  second: TournamentPlayerStats,
  key: TournamentPlayerStatsRankingKey
): number {
  return second[key] - first[key] || compareTournamentPlayerStats(first, second);
}

function compareTournamentPlayerStats(first: TournamentPlayerStats, second: TournamentPlayerStats): number {
  return (
    second.goals - first.goals ||
    second.assists - first.assists ||
    second.goalkeeperSaves - first.goalkeeperSaves ||
    first.teamId.localeCompare(second.teamId) ||
    first.playerId.localeCompare(second.playerId)
  );
}

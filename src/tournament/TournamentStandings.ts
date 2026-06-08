import type {
  TournamentGroup,
  TournamentGroupStanding,
  TournamentMatch,
  TournamentMatchResult,
  TournamentTeamId
} from './tournamentTypes';

type MiniStanding = {
  teamId: TournamentTeamId;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

export function getTournamentGroupStandings(
  group: TournamentGroup,
  matches: readonly TournamentMatch[],
  drawOrder: Readonly<Record<TournamentTeamId, number>> = {}
): TournamentGroupStanding[] {
  const standings = new Map(group.teamIds.map((teamId) => [teamId, createEmptyStanding(teamId)]));

  for (const match of matches) {
    if (match.groupId !== group.id || match.result === undefined) {
      continue;
    }

    applyResult(standings, match.result);
  }

  return sortGroupStandings([...standings.values()], matches, drawOrder);
}

export function sortGroupStandings(
  standings: readonly TournamentGroupStanding[],
  matches: readonly TournamentMatch[],
  drawOrder: Readonly<Record<TournamentTeamId, number>> = {}
): TournamentGroupStanding[] {
  const buckets = new Map<number, TournamentGroupStanding[]>();

  for (const standing of standings) {
    const bucket = buckets.get(standing.points) ?? [];
    bucket.push(standing);
    buckets.set(standing.points, bucket);
  }

  return [...buckets.entries()]
    .sort(([firstPoints], [secondPoints]) => secondPoints - firstPoints)
    .flatMap(([, tiedStandings]) => rankTiedStandings(tiedStandings, matches, drawOrder));
}

function rankTiedStandings(
  tiedStandings: readonly TournamentGroupStanding[],
  matches: readonly TournamentMatch[],
  drawOrder: Readonly<Record<TournamentTeamId, number>>
): TournamentGroupStanding[] {
  if (tiedStandings.length === 1) {
    return [...tiedStandings];
  }

  if (tiedStandings.length === 2) {
    const [first, second] = tiedStandings;
    const headToHead = findHeadToHeadResult(matches, first.teamId, second.teamId);

    if (headToHead !== null && headToHead.homeGoals !== headToHead.awayGoals) {
      const winnerTeamId =
        headToHead.homeGoals > headToHead.awayGoals ? headToHead.homeTeamId : headToHead.awayTeamId;

      return winnerTeamId === first.teamId ? [first, second] : [second, first];
    }
  }

  if (tiedStandings.length > 2) {
    const miniStandings = createMiniStandings(
      tiedStandings.map((standing) => standing.teamId),
      matches
    );

    return [...tiedStandings].sort(
      (first, second) =>
        compareMiniStanding(miniStandings.get(first.teamId), miniStandings.get(second.teamId)) ||
        compareOverallStanding(first, second, drawOrder)
    );
  }

  return [...tiedStandings].sort((first, second) => compareOverallStanding(first, second, drawOrder));
}

function createEmptyStanding(teamId: TournamentTeamId): TournamentGroupStanding {
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
    points: 0
  };
}

function applyResult(standings: Map<TournamentTeamId, TournamentGroupStanding>, result: TournamentMatchResult): void {
  const home = standings.get(result.homeTeamId);
  const away = standings.get(result.awayTeamId);

  if (home === undefined || away === undefined) {
    return;
  }

  applyTeamResult(home, result.homeGoals, result.awayGoals, result.teamStats.home.shots);
  applyTeamResult(away, result.awayGoals, result.homeGoals, result.teamStats.away.shots);
}

function applyTeamResult(standing: TournamentGroupStanding, goalsFor: number, goalsAgainst: number, shots: number): void {
  standing.played += 1;
  standing.goalsFor += goalsFor;
  standing.goalsAgainst += goalsAgainst;
  standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
  standing.shots += shots;

  if (goalsFor > goalsAgainst) {
    standing.wins += 1;
    standing.points += 3;
  } else if (goalsFor < goalsAgainst) {
    standing.losses += 1;
  } else {
    standing.draws += 1;
    standing.points += 1;
  }
}

function findHeadToHeadResult(
  matches: readonly TournamentMatch[],
  firstTeamId: TournamentTeamId,
  secondTeamId: TournamentTeamId
): TournamentMatchResult | null {
  for (const match of matches) {
    const result = match.result;

    if (result === undefined) {
      continue;
    }

    const samePair =
      (result.homeTeamId === firstTeamId && result.awayTeamId === secondTeamId) ||
      (result.homeTeamId === secondTeamId && result.awayTeamId === firstTeamId);

    if (samePair) {
      return result;
    }
  }

  return null;
}

function createMiniStandings(
  teamIds: readonly TournamentTeamId[],
  matches: readonly TournamentMatch[]
): Map<TournamentTeamId, MiniStanding> {
  const teamSet = new Set(teamIds);
  const miniStandings = new Map(teamIds.map((teamId) => [teamId, createEmptyMiniStanding(teamId)]));

  for (const match of matches) {
    const result = match.result;

    if (result === undefined || !teamSet.has(result.homeTeamId) || !teamSet.has(result.awayTeamId)) {
      continue;
    }

    applyMiniResult(miniStandings, result);
  }

  return miniStandings;
}

function createEmptyMiniStanding(teamId: TournamentTeamId): MiniStanding {
  return {
    teamId,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0
  };
}

function applyMiniResult(standings: Map<TournamentTeamId, MiniStanding>, result: TournamentMatchResult): void {
  const home = standings.get(result.homeTeamId);
  const away = standings.get(result.awayTeamId);

  if (home === undefined || away === undefined) {
    return;
  }

  applyMiniTeamResult(home, result.homeGoals, result.awayGoals);
  applyMiniTeamResult(away, result.awayGoals, result.homeGoals);
}

function applyMiniTeamResult(standing: MiniStanding, goalsFor: number, goalsAgainst: number): void {
  standing.goalsFor += goalsFor;
  standing.goalsAgainst += goalsAgainst;
  standing.goalDifference = standing.goalsFor - standing.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    standing.points += 3;
  } else if (goalsFor === goalsAgainst) {
    standing.points += 1;
  }
}

function compareMiniStanding(first: MiniStanding | undefined, second: MiniStanding | undefined): number {
  if (first === undefined || second === undefined) {
    return 0;
  }

  return (
    second.points - first.points ||
    second.goalDifference - first.goalDifference ||
    second.goalsFor - first.goalsFor
  );
}

function compareOverallStanding(
  first: TournamentGroupStanding,
  second: TournamentGroupStanding,
  drawOrder: Readonly<Record<TournamentTeamId, number>>
): number {
  return (
    second.goalDifference - first.goalDifference ||
    second.goalsFor - first.goalsFor ||
    second.shots - first.shots ||
    getDrawOrder(first.teamId, drawOrder) - getDrawOrder(second.teamId, drawOrder) ||
    first.teamId.localeCompare(second.teamId)
  );
}

function getDrawOrder(teamId: TournamentTeamId, drawOrder: Readonly<Record<TournamentTeamId, number>>): number {
  return drawOrder[teamId] ?? Number.MAX_SAFE_INTEGER;
}

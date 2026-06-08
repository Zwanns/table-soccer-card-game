import { describe, expect, it } from 'vitest';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import {
  createTournamentState,
  fillEmptyTournamentSlots,
  fillTournamentTeamsRandom,
  getTournamentGroupStandings,
  getTournamentMatchCount,
  shuffleTournamentTeams,
  submitTournamentMatchResult,
  type TournamentFormatId,
  type TournamentMatch,
  type TournamentState,
  type TournamentTeamId
} from '../tournament';

const FORMAT_CASES: Array<[TournamentFormatId, number, number, number]> = [
  ['cup-m', 8, 2, 15],
  ['cup-l', 16, 4, 31],
  ['cup-xl', 32, 8, 63]
];

describe('tournament creation', () => {
  it.each(FORMAT_CASES)('creates %s with %i teams and %i future matches', (formatId, teamCount, groupCount, matchCount) => {
    const tournament = createTournamentState({
      formatId,
      teamIds: teamIds(teamCount),
      seed: 'creation-test'
    });

    expect(tournament.teamIds).toHaveLength(teamCount);
    expect(tournament.groups).toHaveLength(groupCount);
    expect(tournament.matches).toHaveLength(matchCount);
    expect(getTournamentMatchCount(formatId)).toBe(matchCount);
  });

  it.each(FORMAT_CASES)('creates groups of four teams for %s', (formatId, teamCount) => {
    const tournament = createTournamentState({
      formatId,
      teamIds: teamIds(teamCount),
      seed: 'group-size-test'
    });

    for (const group of tournament.groups) {
      expect(group.teamIds).toHaveLength(4);
    }
  });

  it('schedules every pair in a group exactly once', () => {
    const tournament = createTournamentState({
      formatId: 'cup-m',
      teamIds: teamIds(8),
      seed: 'fixture-test'
    });

    for (const group of tournament.groups) {
      const groupMatches = tournament.matches.filter((match) => match.groupId === group.id);
      const pairKeys = groupMatches.map((match) => pairKey(requireTeam(match.homeTeamId), requireTeam(match.awayTeamId)));

      expect(groupMatches).toHaveLength(6);
      expect(new Set(pairKeys).size).toBe(6);
    }
  });

  it('rejects duplicated tournament teams', () => {
    const teams = teamIds(8);

    expect(() =>
      createTournamentState({
        formatId: 'cup-m',
        teamIds: [teams[0], teams[0], ...teams.slice(2)],
        seed: 'duplicate-test'
      })
    ).toThrow('unique');
  });
});

describe('tournament team filling', () => {
  it('fills a format with random unique teams', () => {
    const teams = fillTournamentTeamsRandom('cup-l', 'fill-random-test');

    expect(teams).toHaveLength(16);
    expect(new Set(teams).size).toBe(16);
  });

  it('fills only empty slots while preserving manually selected teams', () => {
    const manualTeams = teamIds(3);
    const slots: Array<TournamentTeamId | null> = [manualTeams[0], null, manualTeams[1], null, manualTeams[2], null, null, null];
    const filled = fillEmptyTournamentSlots('cup-m', slots, 'fill-empty-test');

    expect(filled).toHaveLength(8);
    expect(filled[0]).toBe(manualTeams[0]);
    expect(filled[2]).toBe(manualTeams[1]);
    expect(filled[4]).toBe(manualTeams[2]);
    expect(new Set(filled).size).toBe(8);
  });

  it('shuffles groups deterministically without changing the participant list', () => {
    const teams = teamIds(8);
    const shuffledOnce = shuffleTournamentTeams(teams, 'shuffle-test');
    const shuffledTwice = shuffleTournamentTeams(teams, 'shuffle-test');

    expect(shuffledOnce).toEqual(shuffledTwice);
    expect([...shuffledOnce].sort()).toEqual([...teams].sort());
  });
});

describe('group standings', () => {
  it('counts points, goals and shots correctly', () => {
    let tournament = createTournamentState({
      formatId: 'cup-m',
      teamIds: teamIds(8),
      seed: 'points-test'
    });
    const [a, b, c] = tournament.groups[0].teamIds;

    tournament = completeMatch(tournament, a, b, 2, 1, 5, 3);
    tournament = completeMatch(tournament, a, c, 0, 0, 2, 4);

    const standings = getTournamentGroupStandings(tournament.groups[0], tournament.matches, tournament.drawOrder);
    const teamAStanding = standings.find((standing) => standing.teamId === a);
    const teamBStanding = standings.find((standing) => standing.teamId === b);
    const teamCStanding = standings.find((standing) => standing.teamId === c);

    expect(teamAStanding).toMatchObject({
      played: 2,
      wins: 1,
      draws: 1,
      goalsFor: 2,
      goalsAgainst: 1,
      goalDifference: 1,
      shots: 7,
      points: 4
    });
    expect(teamBStanding).toMatchObject({ played: 1, losses: 1, points: 0 });
    expect(teamCStanding).toMatchObject({ played: 1, draws: 1, points: 1 });
  });

  it('uses a two-team head-to-head result before overall goal difference', () => {
    let tournament = createTournamentState({
      formatId: 'cup-m',
      teamIds: teamIds(8),
      seed: 'head-to-head-test'
    });
    const [a, b, c, d] = tournament.groups[0].teamIds;

    tournament = completeMatch(tournament, a, b, 1, 0);
    tournament = completeMatch(tournament, c, d, 0, 1);
    tournament = completeMatch(tournament, a, c, 0, 5);
    tournament = completeMatch(tournament, d, b, 0, 4);
    tournament = completeMatch(tournament, a, d, 1, 0);
    tournament = completeMatch(tournament, b, c, 4, 0);

    const standings = getTournamentGroupStandings(tournament.groups[0], tournament.matches, tournament.drawOrder);

    expect(standings.map((standing) => standing.teamId).slice(0, 2)).toEqual([a, b]);
    expect(standings.find((standing) => standing.teamId === b)?.goalDifference).toBeGreaterThan(
      standings.find((standing) => standing.teamId === a)?.goalDifference ?? 0
    );
  });

  it('uses a mini-table for three teams with equal points', () => {
    let tournament = createTournamentState({
      formatId: 'cup-m',
      teamIds: teamIds(8),
      seed: 'mini-table-test'
    });
    const [a, b, c, d] = tournament.groups[0].teamIds;

    tournament = completeMatch(tournament, a, b, 3, 0);
    tournament = completeMatch(tournament, c, d, 1, 0);
    tournament = completeMatch(tournament, a, c, 0, 1);
    tournament = completeMatch(tournament, d, b, 0, 1);
    tournament = completeMatch(tournament, a, d, 1, 0);
    tournament = completeMatch(tournament, b, c, 2, 0);

    const standings = getTournamentGroupStandings(tournament.groups[0], tournament.matches, tournament.drawOrder);

    expect(standings.map((standing) => standing.teamId).slice(0, 3)).toEqual([a, b, c]);
  });

  it('uses a deterministic seeded draw when all criteria are equal', () => {
    const firstTournament = completeGroupWithDraws(
      createTournamentState({
        formatId: 'cup-m',
        teamIds: teamIds(8),
        seed: 'draw-seed-test'
      })
    );
    const secondTournament = completeGroupWithDraws(
      createTournamentState({
        formatId: 'cup-m',
        teamIds: teamIds(8),
        seed: 'draw-seed-test'
      })
    );

    const firstOrder = getTournamentGroupStandings(
      firstTournament.groups[0],
      firstTournament.matches,
      firstTournament.drawOrder
    ).map((standing) => standing.teamId);
    const secondOrder = getTournamentGroupStandings(
      secondTournament.groups[0],
      secondTournament.matches,
      secondTournament.drawOrder
    ).map((standing) => standing.teamId);

    expect(firstOrder).toEqual(secondOrder);
    expect(firstOrder).toEqual(
      [...firstTournament.groups[0].teamIds].sort(
        (first, second) => firstTournament.drawOrder[first] - firstTournament.drawOrder[second]
      )
    );
  });

  it('does not allow submitting one tournament match twice', () => {
    let tournament = createTournamentState({
      formatId: 'cup-m',
      teamIds: teamIds(8),
      seed: 'double-submit-test'
    });
    const [a, b] = tournament.groups[0].teamIds;

    tournament = completeMatch(tournament, a, b, 1, 0);

    expect(() => completeMatch(tournament, a, b, 2, 0)).toThrow('twice');
  });
});

describe('knockout bracket', () => {
  it('forms the correct Cup M semi-finals after the group stage', () => {
    const tournament = completeGroupStage(
      createTournamentState({
        formatId: 'cup-m',
        teamIds: teamIds(8),
        seed: 'cup-m-bracket'
      })
    );
    const [a1, a2] = tournament.groups[0].teamIds;
    const [b1, b2] = tournament.groups[1].teamIds;

    expect(tournament.matches.find((match) => match.id === 'semi-final-1')).toMatchObject({
      homeTeamId: a1,
      awayTeamId: b2,
      status: 'available'
    });
    expect(tournament.matches.find((match) => match.id === 'semi-final-2')).toMatchObject({
      homeTeamId: b1,
      awayTeamId: a2,
      status: 'available'
    });
  });

  it('forms the correct Cup L quarter-finals after the group stage', () => {
    const tournament = completeGroupStage(
      createTournamentState({
        formatId: 'cup-l',
        teamIds: teamIds(16),
        seed: 'cup-l-bracket'
      })
    );

    expect(tournament.matches.find((match) => match.id === 'quarter-final-1')).toMatchObject({
      homeTeamId: tournament.groups[0].teamIds[0],
      awayTeamId: tournament.groups[2].teamIds[1],
      status: 'available'
    });
    expect(tournament.matches.find((match) => match.id === 'quarter-final-2')).toMatchObject({
      homeTeamId: tournament.groups[1].teamIds[0],
      awayTeamId: tournament.groups[3].teamIds[1],
      status: 'available'
    });
    expect(tournament.matches.find((match) => match.id === 'quarter-final-3')).toMatchObject({
      homeTeamId: tournament.groups[2].teamIds[0],
      awayTeamId: tournament.groups[0].teamIds[1],
      status: 'available'
    });
    expect(tournament.matches.find((match) => match.id === 'quarter-final-4')).toMatchObject({
      homeTeamId: tournament.groups[3].teamIds[0],
      awayTeamId: tournament.groups[1].teamIds[1],
      status: 'available'
    });
  });

  it('forms the correct Cup XL round of 16 after the group stage', () => {
    const tournament = completeGroupStage(
      createTournamentState({
        formatId: 'cup-xl',
        teamIds: teamIds(32),
        seed: 'cup-xl-bracket'
      })
    );

    expect(tournament.matches.find((match) => match.id === 'round-of-16-1')).toMatchObject({
      homeTeamId: tournament.groups[0].teamIds[0],
      awayTeamId: tournament.groups[2].teamIds[1],
      status: 'available'
    });
    expect(tournament.matches.find((match) => match.id === 'round-of-16-8')).toMatchObject({
      homeTeamId: tournament.groups[7].teamIds[0],
      awayTeamId: tournament.groups[5].teamIds[1],
      status: 'available'
    });
  });

  it('passes winners forward and keeps the next round locked until the current round is complete', () => {
    let tournament = completeGroupStage(
      createTournamentState({
        formatId: 'cup-m',
        teamIds: teamIds(8),
        seed: 'cup-m-advance'
      })
    );
    const sfOne = requireMatch(tournament, 'semi-final-1');
    const sfTwo = requireMatch(tournament, 'semi-final-2');

    tournament = submitTournamentMatchResult(tournament, sfOne.id, {
      homeGoals: 2,
      awayGoals: 0
    });

    expect(tournament.matches.find((match) => match.id === 'final-1')).toMatchObject({
      homeTeamId: sfOne.homeTeamId,
      status: 'locked'
    });

    tournament = submitTournamentMatchResult(tournament, sfTwo.id, {
      homeGoals: 0,
      awayGoals: 1
    });

    expect(tournament.matches.find((match) => match.id === 'final-1')).toMatchObject({
      homeTeamId: sfOne.homeTeamId,
      awayTeamId: sfTwo.awayTeamId,
      status: 'available'
    });
  });

  it('does not advance the loser and completes the tournament after the final', () => {
    let tournament = completeGroupStage(
      createTournamentState({
        formatId: 'cup-m',
        teamIds: teamIds(8),
        seed: 'cup-m-complete'
      })
    );

    tournament = submitTournamentMatchResult(tournament, 'semi-final-1', {
      homeGoals: 1,
      awayGoals: 0
    });
    tournament = submitTournamentMatchResult(tournament, 'semi-final-2', {
      homeGoals: 2,
      awayGoals: 0
    });

    const final = requireMatch(tournament, 'final-1');
    tournament = submitTournamentMatchResult(tournament, 'final-1', {
      homeGoals: 0,
      awayGoals: 3
    });

    expect(tournament.stage).toBe('complete');
    expect(tournament.matches.find((match) => match.id === 'final-1')?.result?.winnerTeamId).toBe(final.awayTeamId);
    expect(tournament.matches.find((match) => match.id === 'final-1')?.result?.winnerTeamId).not.toBe(final.homeTeamId);
  });

  it('rejects a playoff draw until penalty shootouts are implemented', () => {
    const tournament = completeGroupStage(
      createTournamentState({
        formatId: 'cup-m',
        teamIds: teamIds(8),
        seed: 'cup-m-draw-rejected'
      })
    );

    expect(() =>
      submitTournamentMatchResult(tournament, 'semi-final-1', {
        homeGoals: 1,
        awayGoals: 1
      })
    ).toThrow('пенальти');
  });
});

function teamIds(count: number): TournamentTeamId[] {
  return NATIONAL_TEAMS.slice(0, count).map((team) => team.flagCode);
}

function completeGroupWithDraws(tournament: TournamentState): TournamentState {
  return tournament.matches
    .filter((match) => match.groupId === tournament.groups[0].id)
    .reduce(
      (currentTournament, match) =>
        completeMatch(currentTournament, requireTeam(match.homeTeamId), requireTeam(match.awayTeamId), 0, 0),
      tournament
    );
}

function completeMatch(
  tournament: TournamentState,
  firstTeamId: TournamentTeamId,
  secondTeamId: TournamentTeamId,
  firstGoals: number,
  secondGoals: number,
  firstShots: number = firstGoals,
  secondShots: number = secondGoals
): TournamentState {
  const match = findGroupMatch(tournament, firstTeamId, secondTeamId);
  const homeIsFirst = match.homeTeamId === firstTeamId;

  return submitTournamentMatchResult(tournament, match.id, {
    homeGoals: homeIsFirst ? firstGoals : secondGoals,
    awayGoals: homeIsFirst ? secondGoals : firstGoals,
    homeShots: homeIsFirst ? firstShots : secondShots,
    awayShots: homeIsFirst ? secondShots : firstShots
  });
}

function completeGroupStage(tournament: TournamentState): TournamentState {
  return tournament.groups.reduce((currentTournament, group) => {
    const [first, second, third, fourth] = group.teamIds;
    let nextTournament = currentTournament;

    nextTournament = completeMatch(nextTournament, first, second, 3, 0);
    nextTournament = completeMatch(nextTournament, third, fourth, 2, 0);
    nextTournament = completeMatch(nextTournament, first, third, 2, 0);
    nextTournament = completeMatch(nextTournament, fourth, second, 0, 2);
    nextTournament = completeMatch(nextTournament, first, fourth, 1, 0);
    nextTournament = completeMatch(nextTournament, second, third, 1, 0);

    return nextTournament;
  }, tournament);
}

function requireMatch(tournament: TournamentState, matchId: string): TournamentMatch {
  const match = tournament.matches.find((candidate) => candidate.id === matchId);

  if (match === undefined) {
    throw new Error(`Expected tournament match "${matchId}".`);
  }

  return match;
}

function findGroupMatch(
  tournament: TournamentState,
  firstTeamId: TournamentTeamId,
  secondTeamId: TournamentTeamId
): TournamentMatch {
  const match = tournament.matches.find(
    (candidate) =>
      candidate.stage === 'group' &&
      candidate.homeTeamId !== undefined &&
      candidate.awayTeamId !== undefined &&
      pairKey(candidate.homeTeamId, candidate.awayTeamId) === pairKey(firstTeamId, secondTeamId)
  );

  if (match === undefined) {
    throw new Error(`Missing group match for ${firstTeamId} and ${secondTeamId}.`);
  }

  return match;
}

function pairKey(firstTeamId: TournamentTeamId, secondTeamId: TournamentTeamId): string {
  return [firstTeamId, secondTeamId].sort().join(':');
}

function requireTeam(teamId: TournamentTeamId | undefined): TournamentTeamId {
  if (teamId === undefined) {
    throw new Error('Expected a tournament team id.');
  }

  return teamId;
}

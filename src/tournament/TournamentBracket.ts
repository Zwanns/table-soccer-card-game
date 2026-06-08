import { getTournamentFormat } from './TournamentFormat';
import { getTournamentGroupStandings } from './TournamentStandings';
import type {
  TournamentFormatId,
  TournamentGroupId,
  TournamentMatch,
  TournamentStage,
  TournamentState,
  TournamentTeamId
} from './tournamentTypes';

type TeamSlot = 'homeTeamId' | 'awayTeamId';

type GroupSeed = {
  groupId: TournamentGroupId;
  place: 0 | 1;
};

type FirstRoundPairing = {
  matchId: string;
  home: GroupSeed;
  away: GroupSeed;
};

type Advancement = {
  fromMatchId: string;
  toMatchId: string;
  slot: TeamSlot;
};

const FIRST_ROUND_PAIRINGS: Record<TournamentFormatId, readonly FirstRoundPairing[]> = {
  'cup-m': [
    { matchId: 'semi-final-1', home: { groupId: 'A', place: 0 }, away: { groupId: 'B', place: 1 } },
    { matchId: 'semi-final-2', home: { groupId: 'B', place: 0 }, away: { groupId: 'A', place: 1 } }
  ],
  'cup-l': [
    { matchId: 'quarter-final-1', home: { groupId: 'A', place: 0 }, away: { groupId: 'C', place: 1 } },
    { matchId: 'quarter-final-2', home: { groupId: 'B', place: 0 }, away: { groupId: 'D', place: 1 } },
    { matchId: 'quarter-final-3', home: { groupId: 'C', place: 0 }, away: { groupId: 'A', place: 1 } },
    { matchId: 'quarter-final-4', home: { groupId: 'D', place: 0 }, away: { groupId: 'B', place: 1 } }
  ],
  'cup-xl': [
    { matchId: 'round-of-16-1', home: { groupId: 'A', place: 0 }, away: { groupId: 'C', place: 1 } },
    { matchId: 'round-of-16-2', home: { groupId: 'B', place: 0 }, away: { groupId: 'D', place: 1 } },
    { matchId: 'round-of-16-3', home: { groupId: 'C', place: 0 }, away: { groupId: 'A', place: 1 } },
    { matchId: 'round-of-16-4', home: { groupId: 'D', place: 0 }, away: { groupId: 'B', place: 1 } },
    { matchId: 'round-of-16-5', home: { groupId: 'E', place: 0 }, away: { groupId: 'G', place: 1 } },
    { matchId: 'round-of-16-6', home: { groupId: 'F', place: 0 }, away: { groupId: 'H', place: 1 } },
    { matchId: 'round-of-16-7', home: { groupId: 'G', place: 0 }, away: { groupId: 'E', place: 1 } },
    { matchId: 'round-of-16-8', home: { groupId: 'H', place: 0 }, away: { groupId: 'F', place: 1 } }
  ]
};

const ADVANCEMENTS: Record<TournamentFormatId, readonly Advancement[]> = {
  'cup-m': [
    { fromMatchId: 'semi-final-1', toMatchId: 'final-1', slot: 'homeTeamId' },
    { fromMatchId: 'semi-final-2', toMatchId: 'final-1', slot: 'awayTeamId' }
  ],
  'cup-l': [
    { fromMatchId: 'quarter-final-1', toMatchId: 'semi-final-1', slot: 'homeTeamId' },
    { fromMatchId: 'quarter-final-2', toMatchId: 'semi-final-1', slot: 'awayTeamId' },
    { fromMatchId: 'quarter-final-3', toMatchId: 'semi-final-2', slot: 'homeTeamId' },
    { fromMatchId: 'quarter-final-4', toMatchId: 'semi-final-2', slot: 'awayTeamId' },
    { fromMatchId: 'semi-final-1', toMatchId: 'final-1', slot: 'homeTeamId' },
    { fromMatchId: 'semi-final-2', toMatchId: 'final-1', slot: 'awayTeamId' }
  ],
  'cup-xl': [
    { fromMatchId: 'round-of-16-1', toMatchId: 'quarter-final-1', slot: 'homeTeamId' },
    { fromMatchId: 'round-of-16-2', toMatchId: 'quarter-final-1', slot: 'awayTeamId' },
    { fromMatchId: 'round-of-16-3', toMatchId: 'quarter-final-2', slot: 'homeTeamId' },
    { fromMatchId: 'round-of-16-4', toMatchId: 'quarter-final-2', slot: 'awayTeamId' },
    { fromMatchId: 'round-of-16-5', toMatchId: 'quarter-final-3', slot: 'homeTeamId' },
    { fromMatchId: 'round-of-16-6', toMatchId: 'quarter-final-3', slot: 'awayTeamId' },
    { fromMatchId: 'round-of-16-7', toMatchId: 'quarter-final-4', slot: 'homeTeamId' },
    { fromMatchId: 'round-of-16-8', toMatchId: 'quarter-final-4', slot: 'awayTeamId' },
    { fromMatchId: 'quarter-final-1', toMatchId: 'semi-final-1', slot: 'homeTeamId' },
    { fromMatchId: 'quarter-final-3', toMatchId: 'semi-final-1', slot: 'awayTeamId' },
    { fromMatchId: 'quarter-final-2', toMatchId: 'semi-final-2', slot: 'homeTeamId' },
    { fromMatchId: 'quarter-final-4', toMatchId: 'semi-final-2', slot: 'awayTeamId' },
    { fromMatchId: 'semi-final-1', toMatchId: 'final-1', slot: 'homeTeamId' },
    { fromMatchId: 'semi-final-2', toMatchId: 'final-1', slot: 'awayTeamId' }
  ]
};

export function refreshTournamentProgress(tournament: TournamentState): TournamentState {
  const seededTournament = areAllGroupMatchesCompleted(tournament)
    ? seedFirstKnockoutRound(tournament)
    : tournament;
  const advancedTournament = advanceKnockoutWinners(seededTournament);
  const matches = updateKnockoutAvailability(advancedTournament);
  const stage = resolveTournamentStage({
    ...advancedTournament,
    matches
  });

  return {
    ...advancedTournament,
    matches,
    stage
  };
}

export function areAllGroupMatchesCompleted(tournament: TournamentState): boolean {
  return tournament.matches
    .filter((match) => match.stage === 'group')
    .every((match) => match.status === 'completed' && match.result !== undefined);
}

export function getFirstKnockoutStage(formatId: TournamentFormatId): Exclude<TournamentStage, 'group' | 'complete'> {
  return getTournamentFormat(formatId).knockoutRounds[0].stage;
}

function seedFirstKnockoutRound(tournament: TournamentState): TournamentState {
  const firstRoundMatches = FIRST_ROUND_PAIRINGS[tournament.formatId];

  if (firstRoundMatches.every((pairing) => getMatch(tournament.matches, pairing.matchId)?.homeTeamId !== undefined)) {
    return tournament;
  }

  const qualifiers = getGroupQualifiers(tournament);

  return {
    ...tournament,
    matches: tournament.matches.map((match) => {
      const pairing = firstRoundMatches.find((candidate) => candidate.matchId === match.id);

      if (pairing === undefined) {
        return match;
      }

      return {
        ...match,
        homeTeamId: getSeededTeamId(qualifiers, pairing.home),
        awayTeamId: getSeededTeamId(qualifiers, pairing.away)
      };
    })
  };
}

function advanceKnockoutWinners(tournament: TournamentState): TournamentState {
  let matches = tournament.matches;

  for (const advancement of ADVANCEMENTS[tournament.formatId]) {
    const fromMatch = getMatch(matches, advancement.fromMatchId);
    const winnerTeamId = fromMatch?.result?.winnerTeamId;

    if (winnerTeamId === undefined) {
      continue;
    }

    matches = matches.map((match) =>
      match.id === advancement.toMatchId
        ? {
            ...match,
            [advancement.slot]: winnerTeamId
          }
        : match
    );
  }

  return {
    ...tournament,
    matches
  };
}

function updateKnockoutAvailability(tournament: TournamentState): TournamentMatch[] {
  const format = getTournamentFormat(tournament.formatId);

  return tournament.matches.map((match) => {
    if (match.stage === 'group' || match.status === 'completed') {
      return match;
    }

    if (match.homeTeamId === undefined || match.awayTeamId === undefined) {
      return {
        ...match,
        status: 'locked'
      };
    }

    const roundIndex = format.knockoutRounds.findIndex((round) => round.stage === match.stage);
    const previousComplete =
      roundIndex === 0
        ? areAllGroupMatchesCompleted(tournament)
        : tournament.matches
            .filter((candidate) => candidate.stage === format.knockoutRounds[roundIndex - 1].stage)
            .every((candidate) => candidate.status === 'completed' && candidate.result?.winnerTeamId !== undefined);

    return {
      ...match,
      status: previousComplete ? 'available' : 'locked'
    };
  });
}

function resolveTournamentStage(tournament: TournamentState): TournamentStage {
  const finalMatch = getMatch(tournament.matches, 'final-1');

  if (finalMatch?.status === 'completed' && finalMatch.result?.winnerTeamId !== undefined) {
    return 'complete';
  }

  if (!areAllGroupMatchesCompleted(tournament)) {
    return 'group';
  }

  const format = getTournamentFormat(tournament.formatId);

  for (const round of format.knockoutRounds) {
    const roundMatches = tournament.matches.filter((match) => match.stage === round.stage);
    const hasAvailableMatch = roundMatches.some((match) => match.status === 'available');
    const hasIncompleteMatch = roundMatches.some((match) => match.status !== 'completed');

    if (hasAvailableMatch || hasIncompleteMatch) {
      return round.stage;
    }
  }

  return 'complete';
}

function getGroupQualifiers(tournament: TournamentState): Map<string, TournamentTeamId[]> {
  return new Map(
    tournament.groups.map((group) => [
      group.id,
      getTournamentGroupStandings(group, tournament.matches, tournament.drawOrder)
        .slice(0, 2)
        .map((standing) => standing.teamId)
    ])
  );
}

function getSeededTeamId(qualifiers: ReadonlyMap<string, readonly TournamentTeamId[]>, seed: GroupSeed): TournamentTeamId {
  const teamId = qualifiers.get(seed.groupId)?.[seed.place];

  if (teamId === undefined) {
    throw new Error(`Cannot seed knockout team ${seed.groupId}${seed.place + 1}.`);
  }

  return teamId;
}

function getMatch(matches: readonly TournamentMatch[], matchId: string): TournamentMatch | undefined {
  return matches.find((match) => match.id === matchId);
}

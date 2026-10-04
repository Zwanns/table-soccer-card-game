import { getTournamentKnockoutAdvancements, type KnockoutAdvancement } from '../tournament/TournamentBracket';
import { getTournamentFormat, type KnockoutRoundFormat } from '../tournament/TournamentFormat';
import type { TournamentFormatId, TournamentMatch } from '../tournament/tournamentTypes';

export type BracketSide = 'left' | 'right';

export type KnockoutRenderRound = {
  stage: KnockoutRoundFormat['stage'];
  matches: readonly TournamentMatch[];
};

export type KnockoutRenderBranch = {
  side: BracketSide;
  rounds: readonly KnockoutRenderRound[];
  semiFinalMatch: TournamentMatch;
};

export type KnockoutRenderEdge = KnockoutAdvancement & {
  side: BracketSide;
  hasCompletedWinner: boolean;
  isWinnerSeeded: boolean;
};

// Branch membership and ordering depend only on graph ancestry, never on results.
export function resolveKnockoutBracketModel(formatId: TournamentFormatId, matches: readonly TournamentMatch[]) {
  const advancements = getTournamentKnockoutAdvancements(formatId);
  const matchesById = new Map(matches.map((match) => [match.id, match]));
  const requireMatch = (id: string): TournamentMatch => {
    const match = matchesById.get(id);
    if (match === undefined) {
      throw new Error(`Missing knockout match "${id}".`);
    }
    return match;
  };
  const parents = (id: string): TournamentMatch[] => advancements
    .filter((edge) => edge.toMatchId === id)
    .map((edge) => requireMatch(edge.fromMatchId))
    .sort(compareBracketMatches);
  const finalMatch = requireMatch('final-1');
  const semiFinals = parents(finalMatch.id);
  if (semiFinals.length !== 2) {
    throw new Error('A knockout bracket must have two final parents.');
  }
  const stages = getTournamentFormat(formatId).knockoutRounds.filter((round) => round.stage !== 'final');
  const branches = semiFinals.map((semiFinalMatch, index): KnockoutRenderBranch => {
    const ancestors: TournamentMatch[] = [];
    const visit = (match: TournamentMatch): void => {
      parents(match.id).forEach(visit);
      ancestors.push(match);
    };
    visit(semiFinalMatch);
    return {
      side: index === 0 ? 'left' : 'right',
      semiFinalMatch,
      rounds: stages.map(({ stage }) => ({ stage, matches: ancestors.filter((match) => match.stage === stage) }))
    };
  });
  const [left, right] = branches;
  const sideByMatchId = new Map(branches.flatMap((branch) => branch.rounds.flatMap((round) =>
    round.matches.map((match) => [match.id, branch.side] as const))));
  const edges: KnockoutRenderEdge[] = advancements.map((edge) => {
    const source = requireMatch(edge.fromMatchId);
    const target = requireMatch(edge.toMatchId);
    const side = sideByMatchId.get(source.id);
    if (side === undefined || (target.id !== finalMatch.id && sideByMatchId.get(target.id) !== side)) {
      throw new Error(`Knockout edge "${source.id}" crosses branches.`);
    }
    const hasCompletedWinner = source.status === 'completed' && source.result?.winnerTeamId !== undefined;
    return {
      ...edge,
      side,
      hasCompletedWinner,
      isWinnerSeeded: hasCompletedWinner && target[edge.slot] === source.result?.winnerTeamId
    };
  });
  return { left, right, finalMatch, edges };
}

function compareBracketMatches(first: TournamentMatch, second: TournamentMatch): number {
  return first.roundIndex - second.roundIndex || first.orderIndex - second.orderIndex || first.id.localeCompare(second.id);
}

import type { Card, CardRank } from '../cards';
import type { FieldSquadMember, GoalkeeperSquadMember } from '../data/squadTypes';
import type { MatchTeamSetup } from './MatchTeamSetup';

export function getFieldPlayerForCard(setup: MatchTeamSetup, card: Card): FieldSquadMember {
  return resolveSquadPlayerByCardRank(setup, card.rank);
}

export function getOptionalFieldPlayerForCard(setup: MatchTeamSetup | undefined, card: Card): FieldSquadMember | null {
  return setup === undefined ? null : resolveOptionalSquadPlayerByCardRank(setup, card.rank);
}

export function getStartingGoalkeeper(setup: MatchTeamSetup): GoalkeeperSquadMember {
  return resolveActiveGoalkeeper(setup);
}

export function resolveSquadPlayerByCardRank(setup: MatchTeamSetup, rank: CardRank): FieldSquadMember {
  return setup.squad.fieldPlayers[rank];
}

export function resolveOptionalSquadPlayerByCardRank(setup: MatchTeamSetup, rank: CardRank): FieldSquadMember | null {
  return (setup.squad.fieldPlayers as Partial<Record<CardRank, FieldSquadMember>>)[rank] ?? null;
}

export function resolveActiveGoalkeeper(setup: MatchTeamSetup): GoalkeeperSquadMember {
  return setup.squad.goalkeeper;
}

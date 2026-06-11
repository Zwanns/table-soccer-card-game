import type { Card, CardRank } from '../cards';
import type { FieldSquadMember, GoalkeeperSquadMember } from '../data/squadTypes';
import type { MatchTeamSetup } from './MatchTeamSetup';

export function getFieldPlayerForCard(setup: MatchTeamSetup, card: Card): FieldSquadMember {
  return resolveSquadPlayerByCardRank(setup, card.rank);
}

export function getStartingGoalkeeper(setup: MatchTeamSetup): GoalkeeperSquadMember {
  return resolveActiveGoalkeeper(setup);
}

export function resolveSquadPlayerByCardRank(setup: MatchTeamSetup, rank: CardRank): FieldSquadMember {
  return setup.squad.fieldPlayers[rank];
}

export function resolveActiveGoalkeeper(setup: MatchTeamSetup): GoalkeeperSquadMember {
  return setup.squad.goalkeeper;
}

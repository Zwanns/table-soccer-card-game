import type { Card } from '../cards';
import type { FieldSquadMember, GoalkeeperSquadMember } from '../data/squadTypes';
import type { MatchTeamSetup } from './MatchTeamSetup';

export function getFieldPlayerForCard(setup: MatchTeamSetup, card: Card): FieldSquadMember {
  return setup.squad.fieldPlayers[card.rank];
}

export function getStartingGoalkeeper(setup: MatchTeamSetup): GoalkeeperSquadMember {
  return (
    setup.squad.goalkeepers.find((goalkeeper) => goalkeeper.id === setup.startingGoalkeeperId) ??
    setup.squad.goalkeepers[0]
  );
}

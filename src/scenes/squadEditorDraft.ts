import type { CardRank } from '../cards';
import type { NationalTeamSquad, SquadValidationResult } from '../data/squadTypes';
import { validateSquad } from '../data/squadValidation';

export type SquadEditorFieldValue = {
  rank: CardRank;
  name: string;
  shirtNumber: string;
};

export type SquadEditorGoalkeeperValue = {
  id: string;
  name: string;
  shirtNumber: string;
  isStarting: boolean;
};

export type SquadEditorValues = {
  teamId: string;
  fieldPlayers: readonly SquadEditorFieldValue[];
  goalkeepers: readonly [SquadEditorGoalkeeperValue, SquadEditorGoalkeeperValue];
};

export function createDraftSquadFromValues(values: SquadEditorValues): NationalTeamSquad {
  return {
    flagCode: values.teamId,
    teamId: values.teamId,
    fieldPlayers: Object.fromEntries(
      values.fieldPlayers.map((player) => [
        player.rank,
        {
          rank: player.rank,
          name: player.name.trim(),
          shirtNumber: parseShirtNumber(player.shirtNumber)
        }
      ])
    ) as NationalTeamSquad['fieldPlayers'],
    goalkeepers: [
      {
        id: values.goalkeepers[0].id,
        name: values.goalkeepers[0].name.trim(),
        shirtNumber: parseShirtNumber(values.goalkeepers[0].shirtNumber)
      },
      {
        id: values.goalkeepers[1].id,
        name: values.goalkeepers[1].name.trim(),
        shirtNumber: parseShirtNumber(values.goalkeepers[1].shirtNumber)
      }
    ],
    defaultStartingGoalkeeperId:
      values.goalkeepers.find((goalkeeper) => goalkeeper.isStarting)?.id ?? ''
  };
}

export function validateSquadEditorValues(values: SquadEditorValues): SquadValidationResult {
  return validateSquad(createDraftSquadFromValues(values));
}

function parseShirtNumber(value: string): number {
  const trimmedValue = value.trim();

  return trimmedValue === '' ? Number.NaN : Number(trimmedValue);
}

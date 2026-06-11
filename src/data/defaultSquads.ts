import { STANDARD_RANKS, type CardRank } from '../cards';
import { NATIONAL_TEAMS } from './nationalTeams';
import type { FieldSquadMember, NationalTeamSquad } from './squadTypes';

export const FIELD_SQUAD_RANKS: readonly CardRank[] = [...STANDARD_RANKS, 'JOKER'];

const DEFAULT_FIELD_SHIRT_NUMBERS: Record<CardRank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 14,
  K: 15,
  A: 17,
  JOKER: 99
};

export function createDefaultSquad(flagCode: string): NationalTeamSquad {
  return {
    flagCode,
    teamId: flagCode,
    fieldPlayers: createDefaultFieldPlayers(),
    goalkeepers: [
      {
        id: `${flagCode}-gk-1`,
        name: 'Вратарь 1',
        shirtNumber: 1
      },
      {
        id: `${flagCode}-gk-2`,
        name: 'Вратарь 2',
        shirtNumber: 12
      }
    ],
    defaultStartingGoalkeeperId: `${flagCode}-gk-1`
  };
}

export const DEFAULT_SQUADS: readonly NationalTeamSquad[] = NATIONAL_TEAMS.map((team) =>
  createDefaultSquad(team.flagCode)
);

function createDefaultFieldPlayers(): Record<CardRank, FieldSquadMember> {
  return Object.fromEntries(
    FIELD_SQUAD_RANKS.map((rank) => [
      rank,
      {
        rank,
        name: `Игрок ${rank}`,
        shirtNumber: DEFAULT_FIELD_SHIRT_NUMBERS[rank]
      }
    ])
  ) as Record<CardRank, FieldSquadMember>;
}

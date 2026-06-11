import type { RandomGenerator } from '../cards';
import { DEFAULT_FIELD_KIT, GOALKEEPER_KIT_IDS, type FieldKitVariant, type GoalkeeperKitId } from '../data/teamKits';
import type { NationalTeamSquad } from '../data/squadTypes';

export type MatchTeamSetup = {
  teamId: string;
  squad: NationalTeamSquad;
  fieldKit: FieldKitVariant;
  startingGoalkeeperId: string;
  goalkeeperKitId: GoalkeeperKitId;
};

export type MatchTeamSetups = Record<string, MatchTeamSetup>;

export type CreateMatchTeamSetupOptions = {
  teamId: string;
  squad: NationalTeamSquad;
  fieldKit?: FieldKitVariant;
  goalkeeperKitId: GoalkeeperKitId;
};

export function createMatchTeamSetup(options: CreateMatchTeamSetupOptions): MatchTeamSetup {
  return {
    teamId: options.teamId,
    squad: cloneNationalTeamSquad(options.squad),
    fieldKit: options.fieldKit ?? DEFAULT_FIELD_KIT,
    startingGoalkeeperId: options.squad.defaultStartingGoalkeeperId,
    goalkeeperKitId: options.goalkeeperKitId
  };
}

export function pickGoalkeeperKitId(random: RandomGenerator): GoalkeeperKitId {
  return GOALKEEPER_KIT_IDS[Math.floor(random() * GOALKEEPER_KIT_IDS.length)] ?? GOALKEEPER_KIT_IDS[0];
}

export function cloneNationalTeamSquad(squad: NationalTeamSquad): NationalTeamSquad {
  return {
    flagCode: squad.flagCode,
    teamId: squad.flagCode,
    fieldPlayers: Object.fromEntries(
      Object.entries(squad.fieldPlayers).map(([rank, player]) => [rank, { ...player }])
    ) as NationalTeamSquad['fieldPlayers'],
    goalkeepers: [{ ...squad.goalkeepers[0] }, { ...squad.goalkeepers[1] }],
    defaultStartingGoalkeeperId: squad.defaultStartingGoalkeeperId
  };
}

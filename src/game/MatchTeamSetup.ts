import type { RandomGenerator } from '../cards';
import { GOALKEEPER_KIT_IDS, type GoalkeeperKitId } from '../data/teamKits';
import type { NationalTeamSquad } from '../data/squadTypes';

export type MatchTeamSetup = {
  flagCode: string;
  squad: NationalTeamSquad;
  goalkeeperKitId: GoalkeeperKitId;
  /**
   * Temporary compatibility alias for existing match rendering code.
   */
  teamId?: string;
};

export type MatchTeamSetups = Record<string, MatchTeamSetup>;

export type CreateMatchTeamSetupOptions = {
  teamId: string;
  squad: NationalTeamSquad;
  goalkeeperKitId: GoalkeeperKitId;
};

export function createMatchTeamSetup(options: CreateMatchTeamSetupOptions): MatchTeamSetup {
  return {
    flagCode: options.teamId,
    squad: cloneNationalTeamSquad(options.squad),
    goalkeeperKitId: options.goalkeeperKitId,
    teamId: options.teamId
  };
}

export function pickGoalkeeperKitId(random: RandomGenerator): GoalkeeperKitId {
  return GOALKEEPER_KIT_IDS[Math.floor(random() * GOALKEEPER_KIT_IDS.length)] ?? GOALKEEPER_KIT_IDS[0];
}

export function cloneNationalTeamSquad(squad: NationalTeamSquad): NationalTeamSquad {
  return {
    flagCode: squad.flagCode,
    fieldPlayers: Object.fromEntries(
      Object.entries(squad.fieldPlayers).map(([rank, player]) => [rank, { ...player }])
    ) as NationalTeamSquad['fieldPlayers'],
    goalkeeper: { ...squad.goalkeeper }
  };
}

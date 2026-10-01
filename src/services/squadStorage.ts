import { REAL_SQUADS, requireRealSquad } from '../data/realSquads';
import type { NationalTeamSquad } from '../data/squadTypes';
import { normalizeFlagCode } from '../data/flagCodes';

export function loadSquad(flagCode: string): NationalTeamSquad {
  return cloneNationalTeamSquad(requireRealSquad(normalizeFlagCode(flagCode)));
}

export function loadAllSquads(): NationalTeamSquad[] {
  return REAL_SQUADS.map((squad) => cloneNationalTeamSquad(squad));
}

function cloneNationalTeamSquad(squad: NationalTeamSquad): NationalTeamSquad {
  return {
    flagCode: squad.flagCode,
    fieldPlayers: Object.fromEntries(
      Object.entries(squad.fieldPlayers).map(([rank, player]) => [rank, { ...player }])
    ) as NationalTeamSquad['fieldPlayers'],
    goalkeeper: { ...squad.goalkeeper }
  };
}

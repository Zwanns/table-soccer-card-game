import { STANDARD_RANKS, type CardRank } from '../cards';
import { REAL_SQUADS, requireRealSquad } from './realSquads';
import type { NationalTeamSquad } from './squadTypes';

export const FIELD_SQUAD_RANKS: readonly CardRank[] = [...STANDARD_RANKS, 'JOKER'];

export const DEFAULT_SQUADS: readonly NationalTeamSquad[] = REAL_SQUADS;

export function createDefaultSquad(flagCode: string): NationalTeamSquad {
  return cloneNationalTeamSquad(requireRealSquad(flagCode));
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

import { DEFAULT_SQUADS, createDefaultSquad } from '../data/defaultSquads';
import type { NationalTeamSquad } from '../data/squadTypes';

// Temporary read-only adapter for existing runtime imports. Squad editing and persistence were removed intentionally.
export function loadSquad(flagCode: string): NationalTeamSquad {
  const squad = DEFAULT_SQUADS.find((candidate) => candidate.flagCode === flagCode) ?? createDefaultSquad(flagCode);

  return cloneNationalTeamSquad(squad);
}

export function loadAllSquads(): NationalTeamSquad[] {
  return DEFAULT_SQUADS.map((squad) => cloneNationalTeamSquad(squad));
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

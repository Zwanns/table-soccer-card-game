import { DEFAULT_SQUADS, createDefaultSquad, FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import type { NationalTeamSquad } from '../data/squadTypes';
import { validateSquad } from '../data/squadValidation';

export const SQUAD_STORAGE_KEY = 'total-soccer-mundial:squads:v1';

type SavedSquadMap = Record<string, NationalTeamSquad>;

type SavedSquadState = {
  squads: SavedSquadMap;
};

export function loadSquad(teamId: string): NationalTeamSquad {
  const savedSquad = readSavedSquads()[teamId];

  if (savedSquad !== undefined && isValidSquad(savedSquad)) {
    return cloneSquad(savedSquad);
  }

  return getDefaultSquadCopy(teamId);
}

export function saveSquad(squad: NationalTeamSquad): void {
  if (!isValidSquad(squad)) {
    return;
  }

  const storage = getStorage();

  if (storage === null) {
    return;
  }

  const savedSquads = readSavedSquads();
  savedSquads[squad.teamId] = cloneSquad(squad);
  writeSavedSquads(storage, savedSquads);
}

export function resetSquad(teamId: string): NationalTeamSquad {
  const storage = getStorage();

  if (storage !== null) {
    const savedSquads = readSavedSquads();
    delete savedSquads[teamId];
    writeSavedSquads(storage, savedSquads);
  }

  return getDefaultSquadCopy(teamId);
}

export function loadAllSquads(): NationalTeamSquad[] {
  return DEFAULT_SQUADS.map((squad) => loadSquad(squad.teamId));
}

function readSavedSquads(): SavedSquadMap {
  const storage = getStorage();

  if (storage === null) {
    return {};
  }

  let rawValue: string | null;

  try {
    rawValue = storage.getItem(SQUAD_STORAGE_KEY);
  } catch {
    return {};
  }

  if (rawValue === null) {
    return {};
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (!isRecord(parsedValue) || !isRecord(parsedValue.squads)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedValue.squads).flatMap(([teamId, squad]) => {
        if (!isSquadLike(squad)) {
          return [];
        }

        return [[teamId, squad]];
      })
    );
  } catch {
    return {};
  }
}

function writeSavedSquads(storage: Storage, squads: SavedSquadMap): void {
  const state: SavedSquadState = {
    squads
  };

  try {
    storage.setItem(SQUAD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable or quota-limited; loading will safely fall back to defaults.
  }
}

function getDefaultSquadCopy(teamId: string): NationalTeamSquad {
  return cloneSquad(DEFAULT_SQUADS.find((squad) => squad.teamId === teamId) ?? createDefaultSquad(teamId));
}

function isValidSquad(squad: NationalTeamSquad): boolean {
  return validateSquad(squad).ok;
}

function cloneSquad(squad: NationalTeamSquad): NationalTeamSquad {
  return {
    teamId: squad.teamId,
    fieldPlayers: Object.fromEntries(
      Object.entries(squad.fieldPlayers).map(([rank, player]) => [rank, { ...player }])
    ) as NationalTeamSquad['fieldPlayers'],
    goalkeepers: [{ ...squad.goalkeepers[0] }, { ...squad.goalkeepers[1] }],
    defaultStartingGoalkeeperId: squad.defaultStartingGoalkeeperId
  };
}

function isSquadLike(value: unknown): value is NationalTeamSquad {
  if (!isRecord(value) || typeof value.teamId !== 'string' || !isRecord(value.fieldPlayers)) {
    return false;
  }

  for (const rank of FIELD_SQUAD_RANKS) {
    const player = value.fieldPlayers[rank];

    if (
      !isRecord(player) ||
      typeof player.rank !== 'string' ||
      typeof player.name !== 'string' ||
      typeof player.shirtNumber !== 'number'
    ) {
      return false;
    }
  }

  if (!Array.isArray(value.goalkeepers) || value.goalkeepers.length !== 2) {
    return false;
  }

  for (const goalkeeper of value.goalkeepers) {
    if (
      !isRecord(goalkeeper) ||
      typeof goalkeeper.id !== 'string' ||
      typeof goalkeeper.name !== 'string' ||
      typeof goalkeeper.shirtNumber !== 'number'
    ) {
      return false;
    }
  }

  return typeof value.defaultStartingGoalkeeperId === 'string' && isValidSquad(value as NationalTeamSquad);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

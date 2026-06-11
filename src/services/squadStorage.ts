import { DEFAULT_SQUADS, createDefaultSquad, FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import type { NationalTeamSquad } from '../data/squadTypes';
import { validateSquad } from '../data/squadValidation';

export const SQUAD_STORAGE_KEY = 'total-soccer-mundial:squads:v1';

type SavedSquadMap = Record<string, NationalTeamSquad>;

type SavedSquadState = {
  squads: SavedSquadMap;
};

export function loadSquad(flagCode: string): NationalTeamSquad {
  const savedSquad = readSavedSquads()[flagCode];

  if (savedSquad !== undefined && isValidSquad(savedSquad)) {
    return cloneSquad(savedSquad);
  }

  return getDefaultSquadCopy(flagCode);
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
  savedSquads[squad.flagCode] = cloneSquad(squad);
  writeSavedSquads(storage, savedSquads);
}

export function resetSquad(flagCode: string): NationalTeamSquad {
  const storage = getStorage();

  if (storage !== null) {
    const savedSquads = readSavedSquads();
    delete savedSquads[flagCode];
    writeSavedSquads(storage, savedSquads);
  }

  return getDefaultSquadCopy(flagCode);
}

export function loadAllSquads(): NationalTeamSquad[] {
  return DEFAULT_SQUADS.map((squad) => loadSquad(squad.flagCode));
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
      Object.values(parsedValue.squads).flatMap((squad) => {
        const normalizedSquad = normalizeStoredSquad(squad);

        if (normalizedSquad === null) {
          return [];
        }

        return [[normalizedSquad.flagCode, normalizedSquad]];
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

function getDefaultSquadCopy(flagCode: string): NationalTeamSquad {
  return cloneSquad(DEFAULT_SQUADS.find((squad) => squad.flagCode === flagCode) ?? createDefaultSquad(flagCode));
}

function isValidSquad(squad: NationalTeamSquad): boolean {
  return validateSquad(squad).ok;
}

function cloneSquad(squad: NationalTeamSquad): NationalTeamSquad {
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

function normalizeStoredSquad(value: unknown): NationalTeamSquad | null {
  if (!isRecord(value) || !isRecord(value.fieldPlayers)) {
    return null;
  }

  const flagCode = typeof value.flagCode === 'string' ? value.flagCode : value.teamId;

  if (typeof flagCode !== 'string') {
    return null;
  }

  for (const rank of FIELD_SQUAD_RANKS) {
    const player = value.fieldPlayers[rank];

    if (
      !isRecord(player) ||
      typeof player.rank !== 'string' ||
      typeof player.name !== 'string' ||
      typeof player.shirtNumber !== 'number'
    ) {
      return null;
    }
  }

  if (!Array.isArray(value.goalkeepers) || value.goalkeepers.length !== 2) {
    return null;
  }

  for (const goalkeeper of value.goalkeepers) {
    if (
      !isRecord(goalkeeper) ||
      typeof goalkeeper.id !== 'string' ||
      typeof goalkeeper.name !== 'string' ||
      typeof goalkeeper.shirtNumber !== 'number'
    ) {
      return null;
    }
  }

  if (typeof value.defaultStartingGoalkeeperId !== 'string') {
    return null;
  }

  const squad: NationalTeamSquad = {
    flagCode,
    teamId: flagCode,
    fieldPlayers: value.fieldPlayers as NationalTeamSquad['fieldPlayers'],
    goalkeepers: value.goalkeepers as NationalTeamSquad['goalkeepers'],
    defaultStartingGoalkeeperId: value.defaultStartingGoalkeeperId
  };

  return isValidSquad(squad) ? squad : null;
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

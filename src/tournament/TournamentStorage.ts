import type { TournamentStage, TournamentState } from './tournamentTypes';

export const TOURNAMENT_STORAGE_KEY = 'total-soccer-mundial:tournament';
export const TOURNAMENT_STORAGE_SCHEMA_VERSION = 1;

export type StoredTournament = {
  schemaVersion: number;
  tournament: TournamentState;
  savedAt: string;
};

type TournamentStorageLike = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

const SUPPORTED_TOURNAMENT_STAGES: readonly TournamentStage[] = [
  'group',
  'round-of-16',
  'quarter-final',
  'semi-final',
  'final',
  'complete'
];

export function saveTournament(tournament: TournamentState, storage = getTournamentStorage()): boolean {
  if (storage === null || !isTournamentStateLike(tournament)) {
    return false;
  }

  const storedTournament: StoredTournament = {
    schemaVersion: TOURNAMENT_STORAGE_SCHEMA_VERSION,
    tournament,
    savedAt: new Date().toISOString()
  };

  try {
    storage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(storedTournament));
    return true;
  } catch {
    return false;
  }
}

export function loadStoredTournament(storage = getTournamentStorage()): StoredTournament | null {
  if (storage === null) {
    return null;
  }

  try {
    const rawValue = storage.getItem(TOURNAMENT_STORAGE_KEY);

    if (rawValue === null) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!isStoredTournament(parsedValue)) {
      return null;
    }

    return cloneStoredTournament(parsedValue);
  } catch {
    return null;
  }
}

export function loadActiveTournament(storage = getTournamentStorage()): TournamentState | null {
  const storedTournament = loadStoredTournament(storage);

  if (storedTournament === null || storedTournament.tournament.stage === 'complete') {
    return null;
  }

  return storedTournament.tournament;
}

export function hasActiveTournamentSave(storage = getTournamentStorage()): boolean {
  return loadActiveTournament(storage) !== null;
}

export function deleteStoredTournament(storage = getTournamentStorage()): boolean {
  if (storage === null) {
    return false;
  }

  try {
    storage.removeItem(TOURNAMENT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function getTournamentStorage(): TournamentStorageLike | null {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

function isStoredTournament(value: unknown): value is StoredTournament {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.schemaVersion === TOURNAMENT_STORAGE_SCHEMA_VERSION &&
    typeof value.savedAt === 'string' &&
    isTournamentStateLike(value.tournament)
  );
}

function isTournamentStateLike(value: unknown): value is TournamentState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.formatId === 'string' &&
    typeof value.seed === 'string' &&
    typeof value.stage === 'string' &&
    SUPPORTED_TOURNAMENT_STAGES.includes(value.stage as TournamentStage) &&
    Array.isArray(value.teamIds) &&
    (value.participants === undefined || Array.isArray(value.participants)) &&
    Array.isArray(value.groups) &&
    Array.isArray(value.matches) &&
    isRecord(value.drawOrder)
  );
}

function cloneStoredTournament(storedTournament: StoredTournament): StoredTournament {
  return JSON.parse(JSON.stringify(storedTournament)) as StoredTournament;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

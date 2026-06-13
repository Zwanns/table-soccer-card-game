import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createTournamentState,
  deleteStoredTournament,
  getTournamentTeamControllerType,
  hasActiveTournamentSave,
  loadActiveTournament,
  loadStoredTournament,
  saveTournament,
  TOURNAMENT_STORAGE_KEY,
  TOURNAMENT_STORAGE_SCHEMA_VERSION
} from '../tournament';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  public get length(): number {
    return this.values.size;
  }

  public clear(): void {
    this.values.clear();
  }

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const originalLocalStorage = globalThis.localStorage;

describe('tournament localStorage', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage
    });
  });

  it('saves and loads a valid unfinished tournament', () => {
    const tournament = createTournamentState({
      formatId: 'cup-m',
      seed: 'storage-save',
      teamIds: ['fr', 'es', 'br', 'ar', 'de', 'it', 'pt', 'nl']
    });

    expect(saveTournament(tournament)).toBe(true);

    const storedTournament = loadStoredTournament();

    expect(storedTournament).toMatchObject({
      schemaVersion: TOURNAMENT_STORAGE_SCHEMA_VERSION,
      tournament: {
        id: tournament.id,
        stage: 'group'
      }
    });
    expect(storedTournament?.savedAt).toEqual(expect.any(String));
    expect(loadActiveTournament()?.id).toBe(tournament.id);
    expect(hasActiveTournamentSave()).toBe(true);
  });

  it('returns deep copies from loaded tournament saves', () => {
    const tournament = createTournamentState({
      formatId: 'cup-m',
      seed: 'storage-copy',
      teamIds: ['fr', 'es', 'br', 'ar', 'de', 'it', 'pt', 'nl']
    });

    saveTournament(tournament);

    const loadedTournament = loadActiveTournament();

    if (loadedTournament === null) {
      throw new Error('Expected a saved tournament.');
    }

    loadedTournament.stage = 'complete';

    expect(loadActiveTournament()?.stage).toBe('group');
  });

  it('loads legacy tournament saves without participant controller data as HUMAN', () => {
    const tournament = createTournamentState({
      formatId: 'cup-m',
      seed: 'storage-legacy-participants',
      teamIds: ['fr', 'es', 'br', 'ar', 'de', 'it', 'pt', 'nl']
    });
    const legacyTournament = JSON.parse(JSON.stringify(tournament)) as Record<string, unknown>;
    delete legacyTournament.participants;

    localStorage.setItem(
      TOURNAMENT_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: TOURNAMENT_STORAGE_SCHEMA_VERSION,
        tournament: legacyTournament,
        savedAt: new Date().toISOString()
      })
    );

    const loadedTournament = loadActiveTournament();

    expect(loadedTournament?.id).toBe(tournament.id);
    expect(getTournamentTeamControllerType(loadedTournament!, 'fr')).toBe('HUMAN');
  });

  it('does not expose completed tournaments as active saves', () => {
    const tournament = createTournamentState({
      formatId: 'cup-m',
      seed: 'storage-complete',
      teamIds: ['fr', 'es', 'br', 'ar', 'de', 'it', 'pt', 'nl']
    });

    saveTournament({
      ...tournament,
      stage: 'complete'
    });

    expect(loadStoredTournament()?.tournament.stage).toBe('complete');
    expect(loadActiveTournament()).toBeNull();
    expect(hasActiveTournamentSave()).toBe(false);
  });

  it('ignores corrupted JSON and unsupported schema versions', () => {
    localStorage.setItem(TOURNAMENT_STORAGE_KEY, '{not-json');

    expect(loadStoredTournament()).toBeNull();
    expect(loadActiveTournament()).toBeNull();

    localStorage.setItem(
      TOURNAMENT_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: TOURNAMENT_STORAGE_SCHEMA_VERSION + 1,
        tournament: {},
        savedAt: new Date().toISOString()
      })
    );

    expect(loadStoredTournament()).toBeNull();
    expect(hasActiveTournamentSave()).toBe(false);
  });

  it('deletes the saved tournament', () => {
    const tournament = createTournamentState({
      formatId: 'cup-m',
      seed: 'storage-delete',
      teamIds: ['fr', 'es', 'br', 'ar', 'de', 'it', 'pt', 'nl']
    });

    saveTournament(tournament);

    expect(deleteStoredTournament()).toBe(true);
    expect(localStorage.getItem(TOURNAMENT_STORAGE_KEY)).toBeNull();
    expect(loadActiveTournament()).toBeNull();
  });

  it('does not throw when localStorage is unavailable', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: undefined
    });

    const tournament = createTournamentState({
      formatId: 'cup-m',
      seed: 'storage-unavailable',
      teamIds: ['fr', 'es', 'br', 'ar', 'de', 'it', 'pt', 'nl']
    });

    expect(saveTournament(tournament)).toBe(false);
    expect(loadStoredTournament()).toBeNull();
    expect(deleteStoredTournament()).toBe(false);
  });
});

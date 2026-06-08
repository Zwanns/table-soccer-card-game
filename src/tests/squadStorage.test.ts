import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDefaultSquad, DEFAULT_SQUADS } from '../data/defaultSquads';
import {
  loadAllSquads,
  loadSquad,
  resetSquad,
  saveSquad,
  SQUAD_STORAGE_KEY
} from '../services/squadStorage';

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

describe('squad localStorage', () => {
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

  it('loads a default squad when localStorage is empty', () => {
    expect(loadSquad('pl')).toEqual(createDefaultSquad('pl'));
  });

  it('saves and reloads a custom squad', () => {
    const squad = createDefaultSquad('pl');
    squad.fieldPlayers['9'].name = 'Lewandowski';
    squad.fieldPlayers['9'].shirtNumber = 19;

    saveSquad(squad);

    expect(loadSquad('pl').fieldPlayers['9']).toMatchObject({
      name: 'Lewandowski',
      shirtNumber: 19
    });
  });

  it('keeps saved data isolated from later mutations of the source object', () => {
    const squad = createDefaultSquad('pl');
    squad.fieldPlayers['9'].name = 'Saved striker';

    saveSquad(squad);
    squad.fieldPlayers['9'].name = 'Mutated after save';

    expect(loadSquad('pl').fieldPlayers['9'].name).toBe('Saved striker');
  });

  it('resets a squad to defaults and removes the saved version', () => {
    const squad = createDefaultSquad('pl');
    squad.fieldPlayers['9'].name = 'Custom striker';
    saveSquad(squad);

    expect(resetSquad('pl')).toEqual(createDefaultSquad('pl'));
    expect(loadSquad('pl')).toEqual(createDefaultSquad('pl'));
  });

  it('falls back to defaults when stored JSON is corrupted', () => {
    localStorage.setItem(SQUAD_STORAGE_KEY, '{not-json');

    expect(loadSquad('pl')).toEqual(createDefaultSquad('pl'));
    expect(loadAllSquads()).toHaveLength(DEFAULT_SQUADS.length);
  });

  it('falls back to defaults when the stored structure is damaged', () => {
    localStorage.setItem(
      SQUAD_STORAGE_KEY,
      JSON.stringify({
        squads: {
          pl: {
            teamId: 'pl',
            fieldPlayers: {},
            goalkeepers: []
          }
        }
      })
    );

    expect(loadSquad('pl')).toEqual(createDefaultSquad('pl'));
  });

  it('does not save an invalid squad', () => {
    const squad = createDefaultSquad('pl');
    squad.fieldPlayers['9'].name = '';

    saveSquad(squad);

    expect(localStorage.getItem(SQUAD_STORAGE_KEY)).toBeNull();
    expect(loadSquad('pl')).toEqual(createDefaultSquad('pl'));
  });

  it('does not overwrite an existing valid saved squad with an invalid one', () => {
    const validSquad = createDefaultSquad('pl');
    validSquad.fieldPlayers['9'].name = 'Valid striker';
    saveSquad(validSquad);

    const invalidSquad = createDefaultSquad('pl');
    invalidSquad.fieldPlayers['9'].shirtNumber = invalidSquad.goalkeepers[0].shirtNumber;
    saveSquad(invalidSquad);

    expect(loadSquad('pl').fieldPlayers['9'].name).toBe('Valid striker');
  });

  it('returns deep copies from loadSquad and loadAllSquads', () => {
    const firstLoad = loadSquad('pl');
    firstLoad.fieldPlayers['9'].name = 'Mutated load';

    expect(loadSquad('pl').fieldPlayers['9'].name).toBe('Игрок 9');

    const allSquads = loadAllSquads();
    allSquads[0].fieldPlayers['9'].name = 'Mutated all squads';

    expect(loadAllSquads()[0].fieldPlayers['9'].name).toBe('Игрок 9');
  });

  it('does not allow default squads to be mutated through loaded values', () => {
    const loadedSquad = loadSquad('pl');
    loadedSquad.fieldPlayers['9'].name = 'Changed default?';

    const defaultPolandSquad = DEFAULT_SQUADS.find((squad) => squad.teamId === 'pl');

    expect(defaultPolandSquad?.fieldPlayers['9'].name).toBe('Игрок 9');
  });

  it('loads defaults when localStorage is unavailable', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: undefined
    });

    expect(loadSquad('pl')).toEqual(createDefaultSquad('pl'));
    expect(() => saveSquad(createDefaultSquad('pl'))).not.toThrow();
  });
});

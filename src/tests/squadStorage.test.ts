import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSquad, DEFAULT_SQUADS } from '../data/defaultSquads';
import { loadAllSquads, loadSquad } from '../services/squadStorage';

const originalLocalStorage = globalThis.localStorage;

describe('read-only squad adapter', () => {
  beforeEach(() => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(() => null),
      length: 0
    } satisfies Storage;

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage
    });
  });

  it('loads default static squads without reading localStorage', () => {
    expect(loadSquad('pl')).toEqual(createDefaultSquad('pl'));
    expect(globalThis.localStorage.getItem).not.toHaveBeenCalled();
  });

  it('ignores saved localStorage data and never writes it', () => {
    const storage = globalThis.localStorage;

    expect(loadSquad('pl')).toEqual(createDefaultSquad('pl'));
    expect(loadAllSquads()).toHaveLength(DEFAULT_SQUADS.length);
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('returns deep copies from loadSquad and loadAllSquads', () => {
    const firstLoad = loadSquad('pl');
    firstLoad.fieldPlayers['9'].name = 'Mutated load';
    firstLoad.goalkeeper.name = 'Mutated keeper';

    expect(loadSquad('pl').fieldPlayers['9'].name).toBe('Игрок 9');
    expect(loadSquad('pl').goalkeeper.name).toBe('Вратарь');

    const allSquads = loadAllSquads();
    allSquads[0].fieldPlayers['9'].name = 'Mutated all squads';

    expect(loadAllSquads()[0].fieldPlayers['9'].name).toBe('Игрок 9');
  });

  it('does not export the removed localStorage editing API', async () => {
    const module = await import('../services/squadStorage');
    const exports = module as Record<string, unknown>;

    expect(exports.saveSquad).toBeUndefined();
    expect(exports.resetSquad).toBeUndefined();
    expect(exports.SQUAD_STORAGE_KEY).toBeUndefined();
  });

  it('does not contain localStorage persistence code', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'services', 'squadStorage.ts'), 'utf8');

    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('total-soccer-mundial:squads:v1');
    expect(source).not.toContain('setItem');
    expect(source).not.toContain('getItem');
  });
});

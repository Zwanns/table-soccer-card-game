import { afterEach, describe, expect, it } from 'vitest';
import {
  GAME_LANGUAGE_STORAGE_KEY,
  getLanguageCode,
  getPreferredLanguage,
  setPreferredLanguage
} from '../i18n/languageStore';

const originalLocalStorage = globalThis.localStorage;

class MemoryStorage {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('shared language store', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage
    });
  });

  it('uses English by default and exposes UI language codes', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: undefined
    });

    expect(getPreferredLanguage()).toBe('en');
    expect(getLanguageCode('en')).toBe('EN');
    expect(getLanguageCode('pl')).toBe('PL');
    expect(getLanguageCode('uk')).toBe('UA');
  });

  it('persists the selected language for Rules and Tutorial', () => {
    const storage = new MemoryStorage();

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage
    });

    setPreferredLanguage('uk');

    expect(storage.getItem(GAME_LANGUAGE_STORAGE_KEY)).toBe('uk');
    expect(getPreferredLanguage()).toBe('uk');
  });
});

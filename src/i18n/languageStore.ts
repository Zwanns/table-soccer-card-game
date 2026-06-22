export type GameLanguage = 'en' | 'pl' | 'uk';

export const GAME_LANGUAGES: readonly GameLanguage[] = ['en', 'pl', 'uk'];
export const GAME_LANGUAGE_STORAGE_KEY = 'total-soccer-language';
export const DEFAULT_GAME_LANGUAGE: GameLanguage = 'en';

export function getPreferredLanguage(): GameLanguage {
  const storedLanguage = readStoredLanguage();

  return storedLanguage ?? DEFAULT_GAME_LANGUAGE;
}

export function setPreferredLanguage(language: GameLanguage): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(GAME_LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore unavailable storage; language still updates in scene state.
  }
}

export function getLanguageCode(language: GameLanguage): string {
  switch (language) {
    case 'en':
      return 'EN';
    case 'pl':
      return 'PL';
    case 'uk':
      return 'UA';
  }
}

function readStoredLanguage(): GameLanguage | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const value = localStorage.getItem(GAME_LANGUAGE_STORAGE_KEY);

    return isGameLanguage(value) ? value : null;
  } catch {
    return null;
  }
}

function isGameLanguage(value: string | null): value is GameLanguage {
  return GAME_LANGUAGES.includes(value as GameLanguage);
}

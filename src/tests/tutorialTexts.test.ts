import { describe, expect, it } from 'vitest';
import { GAME_LANGUAGES } from '../i18n/languageStore';
import { TUTORIAL_MATCH_V2_STEPS } from '../tutorial/tutorialScenario';
import { getTutorialText, TUTORIAL_TEXTS } from '../tutorial/tutorialTexts';

describe('tutorial localization texts', () => {
  it('keeps EN, PL, and UA dictionaries with the same tutorial keys', () => {
    const englishKeys = Object.keys(TUTORIAL_TEXTS.en).sort();

    for (const language of GAME_LANGUAGES) {
      expect(Object.keys(TUTORIAL_TEXTS[language]).sort()).toEqual(englishKeys);
    }
  });

  it('gives every tutorial step localized title and message keys', () => {
    const keys = new Set(Object.keys(TUTORIAL_TEXTS.en));

    for (const step of TUTORIAL_MATCH_V2_STEPS) {
      expect(keys.has(step.messageKey)).toBe(true);

      if (step.titleKey !== undefined) {
        expect(keys.has(step.titleKey)).toBe(true);
      }

      if (step.blockedMessageKey !== undefined) {
        expect(keys.has(step.blockedMessageKey)).toBe(true);
      }
    }
  });

  it('localizes tutorial overlay and guard strings', () => {
    expect(getTutorialText('en', 'tutorial.welcome.title')).toBe('Tutorial Match');
    expect(getTutorialText('pl', 'tutorial.welcome.title')).toBe('Mecz treningowy');
    expect(getTutorialText('uk', 'tutorial.welcome.title')).toBe('Навчальний матч');
    expect(getTutorialText('pl', 'tutorial.guard.useDeck')).toBe('Użyj podświetlonej talii.');
    expect(getTutorialText('uk', 'tutorial.button.continue')).toBe('Далі');
  });

  it('does not leave obsolete direct text fields in tutorial steps', () => {
    for (const step of TUTORIAL_MATCH_V2_STEPS) {
      const legacyStep = step as typeof step & { title?: string; message?: string; blockedMessage?: string };

      expect(legacyStep.title).toBeUndefined();
      expect(legacyStep.message).toBeUndefined();
      expect(legacyStep.blockedMessage).toBeUndefined();
    }
  });
});

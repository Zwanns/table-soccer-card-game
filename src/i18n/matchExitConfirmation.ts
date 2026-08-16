import type { GameLanguage } from './languageStore';

export interface MatchExitConfirmationContent {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
}

export type MatchExitConfirmationContext = 'match' | 'tutorial';

const MATCH_EXIT_CONFIRMATION_CONTENT: Record<
  GameLanguage,
  Record<MatchExitConfirmationContext, MatchExitConfirmationContent>
> = {
  en: {
    match: {
      title: 'Exit to menu?',
      body: 'Current match progress will not be saved. Do you want to leave?',
      confirmLabel: 'Menu',
      cancelLabel: 'Stay'
    },
    tutorial: {
      title: 'Exit Tutorial?',
      body: 'Your tutorial progress will be lost.',
      confirmLabel: 'Exit',
      cancelLabel: 'Cancel'
    }
  },
  pl: {
    match: {
      title: 'Wyjść do menu?',
      body: 'Postęp bieżącego meczu nie zostanie zapisany. Czy chcesz wyjść?',
      confirmLabel: 'Menu',
      cancelLabel: 'Zostań'
    },
    tutorial: {
      title: 'Wyjść z samouczka?',
      body: 'Postęp samouczka zostanie utracony.',
      confirmLabel: 'Wyjdź',
      cancelLabel: 'Anuluj'
    }
  },
  uk: {
    match: {
      title: 'Вийти до меню?',
      body: 'Прогрес поточного матчу не буде збережено. Бажаєте вийти?',
      confirmLabel: 'Меню',
      cancelLabel: 'Залишитися'
    },
    tutorial: {
      title: 'Вийти з навчання?',
      body: 'Прогрес навчання буде втрачено.',
      confirmLabel: 'Вийти',
      cancelLabel: 'Скасувати'
    }
  }
};

export function getMatchExitConfirmationContent(
  language: GameLanguage,
  context: MatchExitConfirmationContext
): MatchExitConfirmationContent {
  return MATCH_EXIT_CONFIRMATION_CONTENT[language][context];
}

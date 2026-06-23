import { describe, expect, it } from 'vitest';
import {
  formatTutorialOverlayMessage,
  getTutorialOverlayLayout,
  isMobileTutorialLayout
} from '../ui/tutorialOverlayLayout';
import { getTutorialText } from '../tutorial/tutorialTexts';

describe('tutorial overlay responsive layout', () => {
  it('keeps the original desktop layout at 1600 x 720', () => {
    const layout = getTutorialOverlayLayout(1600, 720, false, {
      hasContinueButton: false,
      title: 'A title that would wrap on a narrow mobile panel',
      message: 'A long message must not affect the desktop layout.'
    });

    expect(layout.mobile).toBe(false);
    expect(layout).toMatchObject({
      panelWidth: 840,
      panelHeight: 230,
      panelX: 800,
      panelY: 579,
      titleFontSize: 24,
      messageFontSize: 18,
      messageLineSpacing: 6,
      buttonWidth: 190,
      buttonHeight: 42
    });
  });

  it('selects mobile layout for phone geometry and touch landscape canvases', () => {
    expect(isMobileTutorialLayout(844, 390, false)).toBe(true);
    expect(isMobileTutorialLayout(1600, 720, true)).toBe(true);
    expect(isMobileTutorialLayout(1600, 720, false)).toBe(false);
  });

  it('uses a wider top panel with wrapping derived from its width', () => {
    const desktop = getTutorialOverlayLayout(1600, 720, false);
    const mobile = getTutorialOverlayLayout(1600, 720, true);

    expect(mobile.mobile).toBe(true);
    expect(mobile.panelHeight).toBe(190);
    expect(mobile.panelWidth).toBe(1600);
    expect(mobile.panelWidth / 1600).toBeGreaterThan(desktop.panelWidth / 1600);
    expect(mobile.panelY - mobile.panelHeight / 2).toBe(0);
    expect(mobile.messageWordWrapWidth).toBe(mobile.panelWidth - mobile.panelPaddingX * 2);
    expect(mobile.titleWordWrapWidth).toBeLessThan(mobile.messageWordWrapWidth);
  });

  it('provides finger-sized language targets and a larger Continue button', () => {
    const desktop = getTutorialOverlayLayout(1600, 720, false);
    const mobile = getTutorialOverlayLayout(1600, 720, true);

    expect(mobile.languageHitWidth).toBeGreaterThanOrEqual(44);
    expect(mobile.languageHitHeight).toBeGreaterThanOrEqual(32);
    expect(mobile.buttonWidth).toBeGreaterThan(desktop.buttonWidth);
    expect(mobile.buttonHeight).toBeGreaterThan(desktop.buttonHeight);
    expect(mobile.buttonHeight).toBe(44);
  });

  it('keeps the Continue button inside the compact phone panel', () => {
    const mobile = getTutorialOverlayLayout(844, 390, false, {
      hasContinueButton: true,
      title: 'Навчальний матч',
      message: 'Будуй свою атаку, проходячи карти суперника лінія за лінією.'
    });
    const buttonTop = mobile.buttonY - mobile.buttonHeight / 2;
    const buttonBottom = mobile.buttonY + mobile.buttonHeight / 2;

    expect(mobile.panelHeight).toBeGreaterThanOrEqual(180);
    expect(mobile.panelHeight).toBeLessThanOrEqual(220);
    expect(mobile.panelWidth).toBe(844);
    expect(buttonTop).toBeGreaterThan(-mobile.panelHeight / 2);
    expect(buttonBottom).toBeLessThan(mobile.panelHeight / 2);
    expect(mobile.buttonWidth).toBe(Math.min(Math.round(mobile.panelWidth * 0.32), 280));
  });

  it('places the language switch at the right side of the mobile header', () => {
    const mobile = getTutorialOverlayLayout(1600, 720, true, {
      hasContinueButton: false,
      title: 'Tutorial Match',
      message: 'Draw a card from the deck.'
    });
    const selectorWidth = mobile.languageHitWidth + mobile.languageItemSpacing * 2;
    const selectorTop = mobile.languageSelectorY - mobile.languageHitHeight / 2;
    const selectorBottom = mobile.languageSelectorY + mobile.languageHitHeight / 2;

    expect(mobile.languageSelectorX).toBeGreaterThan(0);
    expect(mobile.languageSelectorX + selectorWidth / 2).toBe(
      mobile.panelWidth / 2 - mobile.panelPaddingX
    );
    expect(mobile.languageSelectorY).toBeLessThan(-mobile.panelHeight / 2 + mobile.messageTop);
    expect(mobile.languageSelectorX - selectorWidth / 2).toBeGreaterThanOrEqual(-mobile.panelWidth / 2);
    expect(selectorTop).toBeGreaterThanOrEqual(-mobile.panelHeight / 2);
    expect(selectorBottom).toBeLessThanOrEqual(mobile.panelHeight / 2);
  });

  it('uses a compact height for a short mobile action step without Continue', () => {
    const compact = getTutorialOverlayLayout(844, 390, false, {
      hasContinueButton: false,
      title: 'Навчальний матч',
      message: 'Візьми карту з колоди.'
    });
    const withContinue = getTutorialOverlayLayout(844, 390, false, {
      hasContinueButton: true,
      title: 'Навчальний матч',
      message: 'Візьми карту з колоди.'
    });

    expect(compact.panelHeight).toBe(110);
    expect(compact.panelHeight).toBeLessThan(withContinue.panelHeight);
    expect(withContinue.panelHeight).toBeGreaterThanOrEqual(180);
  });

  it('grows a long Ukrainian action step without reserving the fixed button height', () => {
    const shortStep = getTutorialOverlayLayout(844, 390, false, {
      hasContinueButton: false,
      title: 'Навчальний матч',
      message: 'Візьми карту з колоди.'
    });
    const longStep = getTutorialOverlayLayout(844, 390, false, {
      hasContinueButton: false,
      title: 'Навчальний матч',
      message:
        'Вибери свого правого півзахисника. ВАЖЛИВО: карта твого півзахисника має бути вищою за карту півзахисника суперника, або підпадати під спеціальне правило.'
    });

    expect(longStep.panelHeight).toBeGreaterThan(shortStep.panelHeight);
    expect(longStep.panelHeight).toBeGreaterThanOrEqual(110);
    expect(longStep.panelHeight).toBeLessThanOrEqual(180);
    expect(longStep.panelHeight).not.toBe(190);
  });

  it('recalculates mobile height from localized text when the language changes', () => {
    const english = getTutorialOverlayLayout(1600, 720, true, {
      hasContinueButton: true,
      title: getTutorialText('en', 'tutorial.basicRule.title'),
      message: getTutorialText('en', 'tutorial.basicRule.message')
    });
    const polish = getTutorialOverlayLayout(1600, 720, true, {
      hasContinueButton: true,
      title: getTutorialText('pl', 'tutorial.basicRule.title'),
      message: getTutorialText('pl', 'tutorial.basicRule.message')
    });

    expect(english.panelHeight).toBe(180);
    expect(polish.panelHeight).toBe(198);
  });

  it('uses the full mobile message width and compacts explicit line breaks', () => {
    const mobile = getTutorialOverlayLayout(915, 412, false);

    expect(mobile.messageWordWrapWidth).toBe(mobile.panelWidth - mobile.panelPaddingX * 2);
    expect(formatTutorialOverlayMessage('Первая строка\nВторая строка', true)).toBe(
      'Первая строка Вторая строка'
    );
    expect(formatTutorialOverlayMessage('First line\nSecond line', false)).toBe('First line\nSecond line');
  });

  it('keeps the mobile panel in the same top position for every tutorial step', () => {
    const forcedMobile = getTutorialOverlayLayout(1600, 720, true);
    const phoneGeometry = getTutorialOverlayLayout(844, 390, false);

    expect(forcedMobile.panelY - forcedMobile.panelHeight / 2).toBe(0);
    expect(phoneGeometry.panelY - phoneGeometry.panelHeight / 2).toBe(0);
  });
});

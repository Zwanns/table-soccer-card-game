import { describe, expect, it } from 'vitest';
import {
  formatTutorialOverlayMessage,
  getTutorialOverlayLayout,
  isMobileTutorialLayout,
  resolveTutorialPanelY
} from '../ui/tutorialOverlayLayout';

describe('tutorial overlay responsive layout', () => {
  it('keeps the original desktop layout at 1600 x 720', () => {
    const layout = getTutorialOverlayLayout(1600, 720, false);

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

  it('uses a wider bottom sheet with wrapping derived from its width', () => {
    const desktop = getTutorialOverlayLayout(1600, 720, false);
    const mobile = getTutorialOverlayLayout(1600, 720, true);

    expect(mobile.mobile).toBe(true);
    expect(mobile.panelHeight).toBe(190);
    expect(mobile.panelWidth).toBe(Math.round(1600 * 0.94));
    expect(mobile.panelWidth / 1600).toBeGreaterThan(desktop.panelWidth / 1600);
    expect(mobile.panelY + mobile.panelHeight / 2).toBe(720 - 16);
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
    const mobile = getTutorialOverlayLayout(844, 390, false);
    const buttonTop = mobile.buttonY - mobile.buttonHeight / 2;
    const buttonBottom = mobile.buttonY + mobile.buttonHeight / 2;

    expect(mobile.panelHeight).toBeLessThan(280);
    expect(mobile.panelWidth).toBe(Math.round(844 * 0.94));
    expect(buttonTop).toBeGreaterThan(-mobile.panelHeight / 2);
    expect(buttonBottom).toBeLessThan(mobile.panelHeight / 2);
    expect(mobile.buttonWidth).toBe(Math.min(Math.round(mobile.panelWidth * 0.42), 260));
  });

  it('places the language switch at the right side of the mobile header', () => {
    const mobile = getTutorialOverlayLayout(1600, 720, true);
    const selectorWidth = mobile.languageHitWidth + mobile.languageItemSpacing * 2;

    expect(mobile.languageSelectorX).toBeGreaterThan(0);
    expect(mobile.languageSelectorX + selectorWidth / 2).toBe(
      mobile.panelWidth / 2 - mobile.panelPaddingX
    );
    expect(mobile.languageSelectorY).toBeLessThan(-mobile.panelHeight / 2 + mobile.messageTop);
  });

  it('uses the full mobile message width and compacts explicit line breaks', () => {
    const mobile = getTutorialOverlayLayout(915, 412, false);

    expect(mobile.messageWordWrapWidth).toBe(mobile.panelWidth - mobile.panelPaddingX * 2);
    expect(formatTutorialOverlayMessage('Первая строка\nВторая строка', true)).toBe(
      'Первая строка Вторая строка'
    );
    expect(formatTutorialOverlayMessage('First line\nSecond line', false)).toBe('First line\nSecond line');
  });

  it('moves the mobile panel away from highlighted controls near the bottom', () => {
    const mobile = getTutorialOverlayLayout(1600, 720, true);
    const panelY = resolveTutorialPanelY(mobile, [{ x: 115, y: 560, width: 160, height: 220 }]);

    expect(panelY - mobile.panelHeight / 2).toBe(104);
    expect(resolveTutorialPanelY(mobile, [{ x: 800, y: 360, width: 100, height: 100 }])).toBe(mobile.panelY);
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getMainMenuButtonLayout,
  MOBILE_MAIN_MENU_BUTTON_FONT_SIZE,
  MOBILE_MAIN_MENU_BUTTON_HEIGHT
} from '../ui/mainMenuLayout';

const CURRENT_MAIN_MENU_LAYOUT = {
  buttonFontSize: '24px',
  buttonHeight: 62,
  buttonsGap: 66,
  buttonsStartY: 286,
  buttonWidth: 640,
  centerX: 800
} as const;

describe('Main Menu layout', () => {
  it('preserves the current desktop button contract', () => {
    const buttons = getMainMenuButtonLayout(CURRENT_MAIN_MENU_LAYOUT, false);

    expect(buttons.map(({ action }) => action)).toEqual(['gameModes', 'teams', 'rules', 'about']);
    expect(buttons.map(({ label }) => label)).toEqual(['Game modes', 'Teams', 'Rules', 'About']);
    expect(buttons.map(({ x }) => x)).toEqual([800, 800, 800, 800]);
    expect(buttons.map(({ y }) => y)).toEqual([286, 352, 418, 484]);
    expect(buttons.every(({ height }) => height === CURRENT_MAIN_MENU_LAYOUT.buttonHeight)).toBe(true);
    expect(buttons.every(({ fontSize }) => fontSize === CURRENT_MAIN_MENU_LAYOUT.buttonFontSize)).toBe(true);
    expect(buttons.every(({ width }) => width === CURRENT_MAIN_MENU_LAYOUT.buttonWidth)).toBe(true);
  });

  it('creates exactly three normal-case mobile buttons without Teams', () => {
    const buttons = getMainMenuButtonLayout(CURRENT_MAIN_MENU_LAYOUT, true);

    expect(buttons.map(({ action }) => action)).toEqual(['gameModes', 'rules', 'about']);
    expect(buttons.map(({ label }) => label)).toEqual(['Game modes', 'Rules', 'About']);
    expect(buttons).toHaveLength(3);
    expect(buttons.every(({ height }) => height === MOBILE_MAIN_MENU_BUTTON_HEIGHT)).toBe(true);
    expect(buttons.every(({ fontSize }) => fontSize === MOBILE_MAIN_MENU_BUTTON_FONT_SIZE)).toBe(true);
    expect(buttons.every(({ width }) => width === CURRENT_MAIN_MENU_LAYOUT.buttonWidth)).toBe(true);
  });

  it('creates a centered vertical mobile stack with the existing visual gap', () => {
    const desktopButtons = getMainMenuButtonLayout(CURRENT_MAIN_MENU_LAYOUT, false);
    const mobileButtons = getMainMenuButtonLayout(CURRENT_MAIN_MENU_LAYOUT, true);
    const desktopCenterY = (desktopButtons[0].y + desktopButtons.at(-1)!.y) / 2;
    const mobileCenterY = (mobileButtons[0].y + mobileButtons.at(-1)!.y) / 2;
    const currentVisualGap = CURRENT_MAIN_MENU_LAYOUT.buttonsGap - CURRENT_MAIN_MENU_LAYOUT.buttonHeight;

    expect(mobileButtons.map(({ x }) => x)).toEqual([800, 800, 800]);
    expect(mobileButtons.map(({ y }) => y)).toEqual([297, 385, 473]);
    expect(mobileButtons[1].y - mobileButtons[0].y).toBe(88);
    expect(mobileButtons[2].y - mobileButtons[1].y).toBe(88);
    expect(mobileButtons[1].y - mobileButtons[0].y - mobileButtons[0].height).toBe(currentVisualGap);
    expect(mobileButtons[2].y - mobileButtons[1].y - mobileButtons[1].height).toBe(currentVisualGap);
    expect(mobileCenterY).toBe(desktopCenterY);
  });

  it('keeps the existing Main Menu navigation callbacks', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');
    const callbacks = source.slice(source.indexOf('const callbacks:'), source.indexOf('const buttons = layout.map'));

    expect(callbacks).toContain('gameModes: () => this.openGameModes()');
    expect(callbacks).toContain("teams: () => this.scene.start('SquadSelectScene')");
    expect(callbacks).toContain('rules: () => this.openRulesModal()');
    expect(callbacks).toContain('about: () => this.openAboutModal()');
  });
});

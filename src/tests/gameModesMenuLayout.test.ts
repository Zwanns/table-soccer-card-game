import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getGameModesMenuLayout, MOBILE_GAME_MODES_BACK } from '../ui/gameModesMenuLayout';
import { MOBILE_MAIN_MENU_BUTTON_FONT_SIZE, MOBILE_MAIN_MENU_BUTTON_HEIGHT } from '../ui/mainMenuLayout';
import { createTeamScreenLayout, rectCenter } from '../ui/teamScreenLayout';

const CURRENT_GAME_MODES_LAYOUT = {
  buttonFontSize: '24px',
  buttonHeight: 62,
  buttonsGap: 66,
  buttonsStartY: 286,
  buttonWidth: 640,
  centerX: 800,
  titleFontSize: '24px',
  titleY: 240
} as const;

describe('Game Modes menu layout', () => {
  it('preserves the current desktop title and five-button contract', () => {
    const layout = getGameModesMenuLayout(CURRENT_GAME_MODES_LAYOUT, false);
    const buttons = [...layout.mainButtons, layout.backButton];

    expect(layout.title).toEqual({ fontSize: '24px', label: 'Game modes', x: 800, y: 240 });
    expect(buttons.map(({ action }) => action)).toEqual([
      'quickMatch',
      'tournament',
      'penaltyShootout',
      'tutorialMatch',
      'back'
    ]);
    expect(buttons.map(({ label }) => label)).toEqual([
      'Quick match',
      'Tournament',
      'Penalty shootout',
      'Tutorial Match',
      'Back'
    ]);
    expect(buttons.map(({ y }) => y)).toEqual([286, 352, 418, 484, 550]);
    expect(buttons.every(({ x }) => x === 800)).toBe(true);
    expect(buttons.every(({ width }) => width === 640)).toBe(true);
    expect(buttons.every(({ height }) => height === 62)).toBe(true);
    expect(buttons.every(({ fontSize }) => fontSize === '24px')).toBe(true);
  });

  it('keeps the optional desktop Dev Lab slot and Back position unchanged', () => {
    const layout = getGameModesMenuLayout(CURRENT_GAME_MODES_LAYOUT, false, true);

    expect(layout.devLabButton).toMatchObject({ action: 'devLab', label: 'Dev Lab', x: 800, y: 550 });
    expect(layout.backButton).toMatchObject({ action: 'back', label: 'Back', x: 800, y: 616 });
  });

  it('creates four centered mobile mode buttons with the Main Menu size contract', () => {
    const layout = getGameModesMenuLayout({ ...CURRENT_GAME_MODES_LAYOUT, buttonWidth: 720 }, true);
    const buttons = layout.mainButtons;

    expect(buttons).toHaveLength(4);
    expect(buttons.map(({ action }) => action)).toEqual([
      'quickMatch',
      'tournament',
      'penaltyShootout',
      'tutorialMatch'
    ]);
    expect(buttons.map(({ y }) => y)).toEqual([297, 385, 473, 561]);
    expect(buttons.every(({ x }) => x === 800)).toBe(true);
    expect(buttons.every(({ width }) => width === 720)).toBe(true);
    expect(buttons.every(({ height }) => height === MOBILE_MAIN_MENU_BUTTON_HEIGHT)).toBe(true);
    expect(buttons.every(({ fontSize }) => fontSize === MOBILE_MAIN_MENU_BUTTON_FONT_SIZE)).toBe(true);
    expect(buttons.every(({ height, fontSize, labelOffsetY }) => height === 84 && fontSize === '32px' && labelOffsetY === 0)).toBe(true);
    expect(buttons.map(({ label }) => label)).toEqual([
      'Quick match', 'Tournament', 'Penalty shootout', 'Tutorial Match'
    ]);
    expect(buttons.slice(1).every((button, index) => button.y - buttons[index].y === 88)).toBe(true);
    expect(buttons.slice(1).every((button, index) => button.y - buttons[index].y - button.height === 4)).toBe(true);
  });

  it('matches the mobile Team selection Menu width and center while retaining Back styling', () => {
    const layout = getGameModesMenuLayout(CURRENT_GAME_MODES_LAYOUT, true, true);
    const menuRect = createTeamScreenLayout({ mobileWide: true }).menuButtonRect;
    const menuCenter = rectCenter(menuRect);

    expect(layout.devLabButton).toBeNull();
    expect(layout.mainButtons).not.toContain(layout.backButton);
    expect(layout.backButton).toEqual({ action: 'back', ...MOBILE_GAME_MODES_BACK });
    expect(layout.backButton).toEqual({
      action: 'back',
      fontSize: '30px',
      height: 70,
      label: '← BACK',
      labelOffsetY: -2,
      width: 240,
      x: 158,
      y: 666
    });
    expect(layout.backButton.width).toBe(menuRect.width);
    expect(layout.backButton.x).toBe(menuCenter.x);
    expect(layout.backButton.y).toBe(menuCenter.y);
    expect(layout.backButton.x - layout.backButton.width / 2).toBe(menuRect.x);
    expect(layout.backButton.x - layout.backButton.width / 2).toBeGreaterThanOrEqual(0);
    expect(layout.backButton.x + layout.backButton.width / 2).toBeLessThanOrEqual(SCENE_WIDTH);
    expect(layout.backButton.y + layout.backButton.height / 2).toBeLessThanOrEqual(SCENE_HEIGHT);
  });

  it('keeps the title and navigation callbacks unchanged', () => {
    const mobileLayout = getGameModesMenuLayout(CURRENT_GAME_MODES_LAYOUT, true);
    const source = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');
    const buttonSource = readFileSync(join(process.cwd(), 'src', 'ui', 'Button.ts'), 'utf8');
    const block = source.slice(source.indexOf('private createGameModeButtons'), source.indexOf('private createTournamentButtons'));

    expect(mobileLayout.title).toEqual({ fontSize: '24px', label: 'Game modes', x: 800, y: 240 });
    expect(block).toContain("() => this.scene.start('TeamSelectScene', { mode: 'match' })");
    expect(block).toContain('() => this.openTournamentMenu()');
    expect(block).toContain("() => this.scene.start('TeamSelectScene', { mode: 'penalty' })");
    expect(block).toContain("this.scene.start('GameScene', {");
    expect(block).toContain('...TUTORIAL_MATCH_V2_TEAMS');
    expect(block).toContain("matchMode: 'tutorial'");
    expect(block).toContain("() => this.scene.start('MenuScene')");
    expect(block).toContain('labelOffsetY: layout.backButton.labelOffsetY');
    expect(buttonSource).toContain('labelOffsetY?: number');
    expect(buttonSource).toContain('.text(0, options.labelOffsetY ?? 0, text');
  });
});

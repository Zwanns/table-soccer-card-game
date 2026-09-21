import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getMenuInfoLayout } from '../ui/menuInfoLayout';
import { createTeamScreenLayout, rectBottom, rectRight } from '../ui/teamScreenLayout';
import { createTournamentSetupLayout } from '../ui/tournamentSetupLayout';

describe('mobile menu polish', () => {
  it('preserves desktop modal geometry and typography', () => {
    expect(getMenuInfoLayout(false)).toEqual({
      viewport: { x: -390, y: -150, width: 780, height: 360 },
      paragraphFontSize: '20px', bodyFontSize: '16px', headingFontSize: '19px',
      rulesTitleFontSize: '22px', languageFontSize: '18px', languageStartX: -62, languageStep: 54
    });
  });

  it('enlarges both modal viewports inside the panel, leaving room for the scrollbar', () => {
    const mobile = getMenuInfoLayout(true);
    const desktop = getMenuInfoLayout(false);
    expect(mobile.viewport.width).toBeGreaterThan(desktop.viewport.width);
    expect(mobile.viewport.height).toBeGreaterThan(desktop.viewport.height);
    expect(mobile.viewport.x + mobile.viewport.width / 2).toBe(0);
    expect(mobile.viewport.x + mobile.viewport.width + 19).toBeLessThan(480);
    expect(300 - rectBottom(mobile.viewport)).toBe(16);
    for (const key of ['paragraphFontSize', 'bodyFontSize', 'headingFontSize', 'languageFontSize'] as const) {
      expect(parseInt(mobile[key])).toBeGreaterThan(parseInt(desktop[key]));
    }
    expect(336 + mobile.languageStartX + 2 * mobile.languageStep + 30).toBeLessThan(480);
  });

  it('enlarges selected previews without touching the country list or controls', () => {
    const mobile = createTeamScreenLayout({ mobileWide: true });
    expect(mobile.team1CoverFanRect.width).toBeGreaterThan(142);
    expect(mobile.team1KitPreviewRect.width).toBeGreaterThan(70);
    expect(mobile.team1KitPreviewRect.height).toBeGreaterThan(90);
    expect(mobile.teamButtonWidth).toBe(180);
    expect(mobile.teamGridStartY).toBe(210);
    for (const [fan, kit, panel, toggle] of [
      [mobile.team1CoverFanRect, mobile.team1KitPreviewRect, mobile.team1SelectedCardRect, mobile.team1ControllerToggleRect],
      [mobile.team2CoverFanRect, mobile.team2KitPreviewRect, mobile.team2SelectedCardRect, mobile.team2ControllerToggleRect]
    ]) {
      expect(rectBottom(fan)).toBeLessThan(mobile.teamGridStartY);
      expect(rectBottom(kit)).toBeLessThan(mobile.teamGridStartY);
      expect(rectRight(fan) + 18).toBeLessThan(toggle.x);
      expect(toggle.height).toBe(panel.height);
    }
    expect(rectRight(mobile.team1SelectedCardRect)).toBeLessThan(mobile.team1KitPreviewRect.x);
    expect(rectRight(mobile.team2KitPreviewRect)).toBeLessThan(mobile.team2SelectedCardRect.x);
  });

  it('keeps at least six complete tournament team rows and preserves footer geometry', () => {
    const mobile = createTournamentSetupLayout(true);
    expect(Math.floor(mobile.teams.viewportHeight / (mobile.teams.buttonHeight + mobile.teams.gapY))).toBeGreaterThanOrEqual(6);
    expect(mobile.teams.buttonHeight).toBeGreaterThan(56);
    expect(mobile.teams.flagWidth).toBeGreaterThan(36);
    expect(parseInt(mobile.format.fontSize)).toBeGreaterThan(21);
    expect(mobile.bottomButtons.map(({ x, y, width, height }) => ({ x, y, width, height }))).toEqual(
      [227, 800, 1373].map(x => ({ x, y: 674, width: 390, height: 68 }))
    );
    expect(mobile.bottomButtons.every(b => parseInt(b.fontSize) > 20)).toBe(true);
    const desktop = createTournamentSetupLayout(false);
    expect(desktop.format.fontSize).toBe('20px');
    expect(desktop.teams.buttonHeight).toBe(42);
    expect(desktop.bottomButtons.every(b => b.fontSize === '18px')).toBe(true);
  });

  it('documents GK restrictions, extra shots and counted steps in every language', () => {
    const source = readFileSync('src/scenes/MenuScene.ts', 'utf8').split('export const RULES_CONTENT')[1];
    for (const [language, nextLanguage, phrases] of [
      ['en', 'pl', ['cannot be 2 or JOKER', 'rebound / extra shot', '200 steps', 'attempt to play a deck card', 'successfully committing a midfielder']],
      ['pl', 'uk', ['rangi 2 ani JOKER', 'dobitkę / kolejny strzał', '200 krokach', 'próba zagrania karty', 'udane podłączenie pomocnika']],
      ['uk', null, ['ранг 2 або JOKER', 'відскок / додатковий удар', '200 кроків', 'спроба зіграти карту', 'успішне підключення півзахисника']]
    ] as const) {
      const content = source.split(`  ${language}: {`)[1].split(nextLanguage ? `  ${nextLanguage}: {` : 'export class')[0];
      for (const phrase of phrases) expect(content).toContain(phrase);
    }
  });
});

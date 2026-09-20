import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatGoalScorerSideLabel, formatGoalScorerMatchLabel } from '../game/matchStats';

function readTeamStatsViewSource(): string {
  return readFileSync(join(process.cwd(), 'src', 'ui', 'TeamStatsView.ts'), 'utf8');
}

describe('TeamStatsView scorer list', () => {
  it('shows a monochrome text ball and step without author details, preserving order and legacy fallback', () => {
    const scorer = { playerName: 'Example Player', shirtNumber: 15, rank: 'Q' as const,
      teamId: 'fr', turnNumber: 7, matchStepNumber: 54 };
    expect([
      scorer,
      { ...scorer, shirtNumber: undefined, matchStepNumber: 12 },
      { ...scorer, matchStepNumber: undefined }
    ].map(formatGoalScorerSideLabel)).toEqual(['\u26BD\uFE0E (54)', '\u26BD\uFE0E (12)', '\u26BD\uFE0E (7)']);
    expect(formatGoalScorerMatchLabel(scorer)).toBe('#15 Example Player (54)');
    const source = readTeamStatsViewSource();
    const rows = source.slice(source.indexOf('const scorers ='), source.indexOf('scorersContent.add(scorers)'));
    expect(rows).toContain("color: '#ffffff'");
    expect(source).toContain("options.align === 'left' ? 0 : 1");
    expect(rows).toContain('align: textAlign');
  });
  it('renders a visible empty state and scorer entries', () => {
    const source = readTeamStatsViewSource();

    expect(source).toContain("options.scorers.length === 0 ? '-' : options.scorers.join('\\n')");
    expect(source).not.toContain('No goals yet');
  });

  it('builds the scorer viewport mask in scene coordinates', () => {
    const source = readTeamStatsViewSource();

    expect(source).toContain('scene.make.graphics()');
    expect(source).toContain('fillRect(maskSceneX + maskLeft, maskSceneY + maskTop, viewportWidth, viewportHeight)');
    expect(source).toContain('this.add([title, scorersContent, scrollZone, scrollbarTrack, scrollbarThumb])');
  });

  it('retains side-panel geometry with 22px rows and no panel background', () => {
    const source = readTeamStatsViewSource();
    const styleSource = readFileSync(join(process.cwd(), 'src', 'ui', 'matchSidePanelStyle.ts'), 'utf8');

    expect(source).not.toContain('createMatchSidePanelBackground');
    expect(source).not.toContain('const background');
    expect(source).not.toContain('setStrokeStyle');
    expect(source).toContain('export const TEAM_STATS_VIEW_WIDTH = MATCH_SIDE_PANEL_WIDTH');
    expect(source).toContain('export const TEAM_STATS_VIEW_HEIGHT = MATCH_SIDE_PANEL_HEIGHT');
    expect(source).toContain('fontFamily: MATCH_SIDE_PANEL_TEXT_STYLE.titleFontFamily');
    expect(source).toContain('fontSize: MATCH_SIDE_PANEL_TEXT_STYLE.titleFontSize');
    expect(source).toContain('fontFamily: MATCH_SIDE_PANEL_TEXT_STYLE.itemFontFamily');
    expect(source).toContain("fontSize: '22px'");
    expect(styleSource).toContain("titleFontFamily: 'Arial, sans-serif'");
    expect(styleSource).toContain("titleFontSize: '20px'");
    expect(styleSource).toContain("itemFontFamily: 'Arial, sans-serif'");
    expect(styleSource).toContain("itemFontSize: '19px'");
  });

  it('renders scorer text at snapped coordinates with high-resolution text canvases', () => {
    const source = readTeamStatsViewSource();

    expect(source).toContain("import { px, SHARP_TEXT_RESOLUTION } from './textRendering'");
    expect(source).toContain('super(scene, px(x), px(y))');
    expect(source).toContain('const maskSceneX = px(x)');
    expect(source).toContain('const maskSceneY = px(y)');
    expect(source).toContain('const textX = px(');
    expect(source.match(/resolution: SHARP_TEXT_RESOLUTION/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source).not.toContain('.setScale(');
  });
});

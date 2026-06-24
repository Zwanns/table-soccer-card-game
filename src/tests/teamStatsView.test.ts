import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readTeamStatsViewSource(): string {
  return readFileSync(join(process.cwd(), 'src', 'ui', 'TeamStatsView.ts'), 'utf8');
}

describe('TeamStatsView scorer list', () => {
  it('renders a visible empty state and scorer entries', () => {
    const source = readTeamStatsViewSource();

    expect(source).toContain("options.scorers.length === 0 ? '-' : options.scorers.join('\\n')");
    expect(source).not.toContain('No goals yet');
  });

  it('builds the scorer viewport mask in scene coordinates', () => {
    const source = readTeamStatsViewSource();

    expect(source).toContain('scene.make.graphics()');
    expect(source).toContain('fillRect(maskSceneX + maskLeft, maskSceneY + maskTop, viewportWidth, viewportHeight)');
    expect(source).toContain('this.add([background, title, scorersContent, scrollZone, scrollbarTrack, scrollbarThumb])');
  });

  it('uses the shared match side-panel frame and enlarged text style', () => {
    const source = readTeamStatsViewSource();
    const styleSource = readFileSync(join(process.cwd(), 'src', 'ui', 'matchSidePanelStyle.ts'), 'utf8');

    expect(source).toContain('createMatchSidePanelBackground');
    expect(source).toContain('export const TEAM_STATS_VIEW_WIDTH = MATCH_SIDE_PANEL_WIDTH');
    expect(source).toContain('export const TEAM_STATS_VIEW_HEIGHT = MATCH_SIDE_PANEL_HEIGHT');
    expect(source).toContain('fontFamily: MATCH_SIDE_PANEL_TEXT_STYLE.titleFontFamily');
    expect(source).toContain('fontSize: MATCH_SIDE_PANEL_TEXT_STYLE.titleFontSize');
    expect(source).toContain('fontFamily: MATCH_SIDE_PANEL_TEXT_STYLE.itemFontFamily');
    expect(source).toContain('fontSize: MATCH_SIDE_PANEL_TEXT_STYLE.itemFontSize');
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

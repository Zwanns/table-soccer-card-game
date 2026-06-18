import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function normalizeSourceLineEndings(source: string): string {
  return source.replace(/\r\n/g, '\n');
}

function readResultSceneSource(): string {
  return normalizeSourceLineEndings(readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8'));
}

describe('result scene score line layout', () => {
  it('uses post-match background images based on the result winner', () => {
    const source = readResultSceneSource();

    expect(source).toContain('MENU_ASSETS.resultDrawBackground');
    expect(source).toContain('MENU_ASSETS.resultWinBackground');
    expect(source).toContain('private createResultBackground');
    expect(source).toContain('playerOneGoals === playerTwoGoals ? MENU_ASSETS.resultDrawBackground : MENU_ASSETS.resultWinBackground');
    expect(source).toContain('background.setDisplaySize(SCENE_WIDTH, SCENE_HEIGHT)');
    expect(source).toContain('if (playerOneGoals > playerTwoGoals)');
    expect(source).toContain('background.setFlipX(true)');
  });

  it('keeps both team codes the same distance from the centered score inside the statistics panel', () => {
    const source = readResultSceneSource();

    expect(source).toContain('const teamNameInnerGap = 112');
    expect(source).toContain('const playerOneNameX = -teamNameInnerGap');
    expect(source).toContain('const playerTwoNameX = teamNameInnerGap');
    expect(source).toContain('getTeamScoreboardCode(playerOneFlagCode)');
    expect(source).toContain('getTeamScoreboardCode(playerTwoFlagCode)');
    expect(source).toContain("align: 'left'");
    expect(source).toContain('.setOrigin(1, 0.5)');
    expect(source).toContain('.setOrigin(0, 0.5)');
  });

  it('places final-score flags next to the rendered team codes', () => {
    const source = readResultSceneSource();

    expect(source).toContain('const flagGap = 14');
    expect(source).toContain('const flagWidth = 76');
    expect(source).toContain('const flagHeight = 50');
    expect(source).toContain("fontSize: '54px'");
    expect(source).toContain("fontSize: '38px'");
    expect(source).toContain('playerOneText.x - playerOneText.width - flagGap - flagWidth / 2');
    expect(source).toContain('playerTwoText.x + playerTwoText.width + flagGap + flagWidth / 2');
  });

  it('renders the final score inside the raised result statistics panel', () => {
    const source = readResultSceneSource();

    expect(source).not.toContain('this.createScoreLine(\n      centerX,\n      92,');
    expect(source).toContain('this.createMatchStatsPanel(centerX, 360, this.state)');
    expect(source).toContain('const height = 500');
    expect(source).toContain('const finalScore = this.createScoreLine(');
    expect(source).toContain('panel.add([background, finalScore, title, playerOneHeader, playerTwoHeader])');
    expect(source).toContain('const viewportHeight = 128');
  });

  it('uses the shared scoreboard style for the final statistics card', () => {
    const source = readResultSceneSource();

    expect(source).toContain("} from '../ui/scoreboardStyle'");
    expect(source).toContain('this.add.rectangle(0, 0, width, height, SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA)');
    expect(source).toContain('background.setStrokeStyle(2, SCOREBOARD_BORDER_COLOR, SCOREBOARD_BORDER_ALPHA)');
    expect(source).toContain('fontFamily: SCOREBOARD_FONT_FAMILY');
    expect(source).toContain("color: '#ffffff'");
    expect(source).not.toContain('const background = this.add.rectangle(0, 0, width, height, 0x0b2118, 0.88)');
    expect(source).not.toContain('this.add.rectangle(0, 0, width, height, 0x000000, 0.76)');
    expect(source).not.toContain('background.setStrokeStyle(2, 0x5f9572, 0.95)');
    expect(source).not.toContain("fontFamily: 'Arial, sans-serif',\n        fontSize: '22px'");
    expect(source).not.toContain("color: '#a9c7b3'");
  });

  it('uses shared team abbreviations on the result screen instead of full team names', () => {
    const source = readResultSceneSource();

    expect(source).toContain("import { getFlagAssetKey, getTeamScoreboardCode } from '../data/nationalTeams'");
    expect(source).toContain('getTeamScoreboardCode(playerOne.flagCode)');
    expect(source).toContain('getTeamScoreboardCode(playerTwo.flagCode)');
    expect(source).not.toContain('playerOne?.name ??');
    expect(source).not.toContain('playerTwo?.name ??');
    expect(source).not.toContain('playerOne.name');
    expect(source).not.toContain('playerTwo.name');
  });

  it('keeps Play again and Menu actions available', () => {
    const source = readResultSceneSource();

    expect(source).toContain("new Button(this, centerX - 130, 650, 'Play again', () => this.scene.start('TeamSelectScene'))");
    expect(source).toContain("new Button(this, centerX + 130, 650, 'Menu', () => this.scene.start('MenuScene'))");
    expect(source).toContain("new Button(this, centerX + 150, 650, 'Menu', () => this.scene.start('MenuScene'), { width: 230 })");
  });

  it('left-aligns final match goal scorers inside both scorer columns', () => {
    const source = readResultSceneSource();

    expect(source).toContain('const scorerColumnWidth = 280');
    expect(source).toContain('const playerOneScorerX = viewportLeft');
    expect(source).toContain('const playerTwoScorerX = panelWidth / 2 - 56 - scorerColumnWidth');
    expect(source).toContain("align: 'left'");
    expect(source).toContain('.setOrigin(0, 0.5)');
    expect(source).toContain('this.createScorersList(playerOneScorerX, y, row.playerOneText, scorerColumnWidth)');
    expect(source).toContain('this.createScorersList(playerTwoScorerX, y, row.playerTwoText, scorerColumnWidth)');
    expect(source).not.toContain("this.createScorersList(285, y, row.playerTwoText, 'right')");
    expect(source).not.toContain("align: side");
    expect(source).not.toContain("setOrigin(side === 'left' ? 0 : 1, 0.5)");
  });
});

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
    expect(source).toContain('const playerOneBadge = this.createControllerBadge(');
    expect(source).toContain('const playerTwoBadge = this.createControllerBadge(');
    expect(source).toContain('const playerOneFlagX = playerOneBadge.x - playerOneBadge.width / 2 - flagGap - flagWidth / 2');
    expect(source).toContain('const playerTwoFlagX = playerTwoBadge.x + playerTwoBadge.width / 2 + flagGap + flagWidth / 2');
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

  it('uses shared team abbreviations on the result scoreboard instead of full team names', () => {
    const source = readResultSceneSource();

    expect(source).toContain("import { getFlagAssetKey, getTeamScoreboardCode } from '../data/nationalTeams'");
    expect(source).toContain('getTeamScoreboardCode(playerOne.flagCode)');
    expect(source).toContain('getTeamScoreboardCode(playerTwo.flagCode)');
    expect(source).toContain('getTeamScoreboardCode(playerOneFlagCode)');
    expect(source).toContain('getTeamScoreboardCode(playerTwoFlagCode)');
    expect(source).not.toContain('playerOne?.name ??');
    expect(source).not.toContain('playerTwo?.name ??');
  });

  it('creates three quick-match actions aligned to the scoreboard panel width', () => {
    const source = readResultSceneSource();

    expect(source).toContain('const RESULT_SCOREBOARD_WIDTH = 840');
    expect(source).toContain('const RESULT_ACTION_BUTTON_GAP = 24');
    expect(source).toContain('const RESULT_ACTION_BUTTON_WIDTH = (RESULT_SCOREBOARD_WIDTH - RESULT_ACTION_BUTTON_GAP * 2) / 3');
    expect(source).toContain('const RESULT_ACTION_BUTTON_HEIGHT = 62');
    expect(source).toContain('const firstButtonX = centerX - RESULT_SCOREBOARD_WIDTH / 2 + RESULT_ACTION_BUTTON_WIDTH / 2');
    expect(source).toContain("new Button(this, firstButtonX, RESULT_ACTION_BUTTON_Y, 'Play Again', () => this.startReplayMatch(), buttonOptions)");
    expect(source).toContain("new Button(this, secondButtonX, RESULT_ACTION_BUTTON_Y, 'New Match', () => this.scene.start('TeamSelectScene'), buttonOptions)");
    expect(source).toContain("new Button(this, thirdButtonX, RESULT_ACTION_BUTTON_Y, 'Menu', () => this.scene.start('MenuScene'), buttonOptions)");
    expect(source).not.toContain("'Play again', () => this.scene.start('TeamSelectScene')");
    expect(source).toContain("new Button(this, centerX + 150, 650, 'Menu', () => this.scene.start('MenuScene'), { width: 230 })");
  });

  it('replays the same teams and controller types with a fresh GameScene', () => {
    const source = readResultSceneSource();

    expect(source).toContain('private startReplayMatch(): void');
    expect(source).toContain("this.scene.start('GameScene', {");
    expect(source).toContain('player1Name: playerOne.name');
    expect(source).toContain('player2Name: playerTwo.name');
    expect(source).toContain('player1FlagCode: playerOne.flagCode');
    expect(source).toContain('player2FlagCode: playerTwo.flagCode');
    expect(source).toContain("player1ControllerType: this.state.matchSetups[playerOne.id]?.controllerType ?? 'HUMAN'");
    expect(source).toContain("player2ControllerType: this.state.matchSetups[playerTwo.id]?.controllerType ?? 'HUMAN'");
    expect(source).toContain('launchContext: this.launchContext');
  });

  it('shows controller type badges next to both result scoreboard team codes', () => {
    const source = readResultSceneSource();

    expect(source).toContain('private createControllerBadge');
    expect(source).toContain("const label = controllerType === 'AI' ? 'AI' : 'P'");
    expect(source).toContain('const width = controllerType === \'AI\' ? 40 : 32');
    expect(source).toContain('background.setStrokeStyle(2, SCOREBOARD_BORDER_COLOR, SCOREBOARD_BORDER_ALPHA)');
    expect(source).toContain('scoreLine.add([playerOneFlag, playerOneBadge, playerOneText, score, playerTwoText, playerTwoBadge, playerTwoFlag])');
    expect(source).toContain("state.matchSetups[playerOne.id]?.controllerType ?? 'HUMAN'");
    expect(source).toContain("state.matchSetups[playerTwo.id]?.controllerType ?? 'HUMAN'");
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

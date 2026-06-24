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
    expect(source).toContain('const playerOneNameX = px(-teamNameInnerGap)');
    expect(source).toContain('const playerTwoNameX = px(teamNameInnerGap)');
    expect(source).toContain('getTeamScoreboardCode(playerOneFlagCode)');
    expect(source).toContain('getTeamScoreboardCode(playerTwoFlagCode)');
    expect(source).toContain("align: 'left'");
    expect(source).toContain('.setOrigin(1, 0.5)');
    expect(source).toContain('.setOrigin(0, 0.5)');
  });

  it('places final-score flags next to the rendered team codes', () => {
    const source = readResultSceneSource();

    expect(source).toContain('const flagGap = 14');
    expect(source).toContain('const badgeFlagGap = 10');
    expect(source).toContain('const flagWidth = 76');
    expect(source).toContain('const flagHeight = 50');
    expect(source).toContain("fontSize: '54px'");
    expect(source).toContain("fontSize: '38px'");
    expect(source).toContain('const playerOneBadge = this.createControllerBadge(');
    expect(source).toContain('const playerTwoBadge = this.createControllerBadge(');
    expect(source).toContain('const playerOneFlagX = px(playerOneText.x - playerOneText.width - flagGap - flagWidth / 2)');
    expect(source).toContain('const playerTwoFlagX = px(playerTwoText.x + playerTwoText.width + flagGap + flagWidth / 2)');
    expect(source).toContain('playerOneBadge.setPosition(px(playerOneFlag.x - flagWidth / 2 - badgeFlagGap - playerOneBadge.width / 2), 0)');
    expect(source).toContain('playerTwoBadge.setPosition(px(playerTwoFlag.x + flagWidth / 2 + badgeFlagGap + playerTwoBadge.width / 2), 0)');
  });

  it('renders the final score inside the raised result statistics panel', () => {
    const source = readResultSceneSource();

    expect(source).not.toContain('this.createScoreLine(\n      centerX,\n      92,');
    expect(source).toContain('this.createMatchStatsPanel(centerX, 360, this.state, this.getPostMatchPenaltyAttempts())');
    expect(source).toContain('const height = 500');
    expect(source).toContain('const finalScore = this.createScoreLine(');
    expect(source).toContain('panel.add([background, finalScore, title])');
    expect(source).toContain('const viewportHeight = 156');
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
    expect(source).toContain('getTeamScoreboardCode(playerOneFlagCode)');
    expect(source).toContain('getTeamScoreboardCode(playerTwoFlagCode)');
    expect(source).not.toContain('playerOne?.name ??');
    expect(source).not.toContain('playerTwo?.name ??');
  });

  it('does not render duplicate team-code labels inside the stats rows', () => {
    const source = readResultSceneSource();

    expect(source).not.toContain('const playerOneHeader =');
    expect(source).not.toContain('const playerTwoHeader =');
    expect(source).not.toContain('private createTeamName');
    expect(source).not.toContain('getTeamScoreboardCode(playerOne.flagCode)');
    expect(source).not.toContain('getTeamScoreboardCode(playerTwo.flagCode)');
  });

  it('keeps stats labels and gives the goal scorers list more vertical space', () => {
    const source = readResultSceneSource();

    expect(source).toContain("['Goals', String(playerOneStats.goals), String(playerTwoStats.goals)]");
    expect(source).toContain("['Shots', String(playerOneStats.shots), String(playerTwoStats.shots)]");
    expect(source).toContain("['Possession', formatPercent(playerOneStats.possession), formatPercent(playerTwoStats.possession)]");
    expect(source).toContain('const statsStartY = -56');
    expect(source).toContain('const statsRowGap = 34');
    expect(source).toContain('const rowY = statsStartY + index * statsRowGap');
    expect(source).toContain("panel.add(this.createStatsLabel(54, 'Goalscorers'))");
    expect(source).toContain('const viewportTop = 92');
    expect(source).toContain('const viewportHeight = 156');
    expect(source).toContain('const maxScroll = Math.max(0, contentHeight - viewportHeight)');
  });

  it('renders result text with snapped coordinates and high-resolution text canvases', () => {
    const source = readResultSceneSource();

    expect(source).toContain("import { px, SHARP_TEXT_RESOLUTION } from '../ui/textRendering'");
    expect(source.match(/resolution: SHARP_TEXT_RESOLUTION/g)?.length).toBeGreaterThanOrEqual(7);
    expect(source).not.toContain('.setScale(');
  });

  it('creates three quick-match actions aligned to the scoreboard panel width', () => {
    const source = readResultSceneSource();
    const actionsSource = normalizeSourceLineEndings(
      readFileSync(join(process.cwd(), 'src', 'ui', 'resultActionButtons.ts'), 'utf8')
    );

    expect(source).toContain('const RESULT_SCOREBOARD_WIDTH = 840');
    expect(source).toContain('createResultActionButtons(this, centerX, [');
    expect(source).toContain("{ label: 'Play Again', onClick: () => this.startReplayMatch() }");
    expect(source).toContain("{ label: 'New Match', onClick: () => this.scene.start('TeamSelectScene') }");
    expect(source).toContain("{ label: 'Menu', onClick: () => this.scene.start('MenuScene') }");
    expect(actionsSource).toContain('export const RESULT_ACTION_PANEL_WIDTH = 840');
    expect(actionsSource).toContain('export const RESULT_ACTION_BUTTON_GAP = 24');
    expect(actionsSource).toContain(
      'export const RESULT_ACTION_BUTTON_WIDTH = (RESULT_ACTION_PANEL_WIDTH - RESULT_ACTION_BUTTON_GAP * 2) / 3'
    );
    expect(actionsSource).toContain('export const RESULT_ACTION_BUTTON_HEIGHT = 68');
    expect(actionsSource).toContain("export const RESULT_ACTION_BUTTON_FONT_SIZE = '26px'");
    expect(actionsSource).toContain('const totalWidth = options.totalWidth ?? RESULT_ACTION_PANEL_WIDTH');
    expect(actionsSource).toContain('const buttonWidth = (totalWidth - RESULT_ACTION_BUTTON_GAP * 2) / 3');
    expect(actionsSource).toContain(
      'const firstButtonX = centerX - totalWidth / 2 + buttonWidth / 2'
    );
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
    expect(source).toContain('scoreLine.add([playerOneBadge, playerOneFlag, playerOneText, score, playerTwoText, playerTwoFlag, playerTwoBadge])');
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

  it('keeps post-match penalty attempts in a separate block below goalscorers', () => {
    const source = readResultSceneSource();

    expect(source).toContain('private getPostMatchPenaltyAttempts(): PenaltyAttemptSummary[]');
    expect(source).toContain('getPenaltyAttemptSummaries(penaltyShootout)');
    expect(source).toContain('const penaltyRows = createPenaltyTimeline(');
    expect(source).toContain(".text(0, penaltyTitleY, 'Penalties'");
    expect(source).toContain('formatPenaltyAttempt(playerOneAttempts[index])');
    expect(source).toContain('const penaltySectionHeight = penaltyRows.length === 0 ? 0');
    expect(source).toContain('if (penaltyRows.length > 0)');
  });
});

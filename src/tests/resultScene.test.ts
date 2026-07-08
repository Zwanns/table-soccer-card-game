import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function normalizeSourceLineEndings(source: string): string {
  return source.replace(/\r\n/g, '\n');
}

function readSource(path: string): string {
  return normalizeSourceLineEndings(readFileSync(join(process.cwd(), path), 'utf8'));
}

function readResultSceneSource(): string {
  return readSource('src/scenes/ResultScene.ts');
}

function readTypographyFontSize(source: string, constName: string, key: string): number {
  const blockMatch = source.match(new RegExp(`const ${constName} = \\{([\\s\\S]*?)\\} as const`));
  expect(blockMatch).not.toBeNull();

  const valueMatch = blockMatch![1].match(new RegExp(`${key}: '(\\d+)px'`));
  expect(valueMatch).not.toBeNull();

  return Number(valueMatch![1]);
}

function readLayoutNumber(source: string, constName: string, key: string): number {
  const blockMatch = source.match(new RegExp(`const ${constName} = \\{([\\s\\S]*?)\\} as const`));
  expect(blockMatch).not.toBeNull();

  const valueMatch = blockMatch![1].match(new RegExp(`${key}: (\\d+)`));
  expect(valueMatch).not.toBeNull();

  return Number(valueMatch![1]);
}

describe('result scene mobile statistics card', () => {
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

  it('can suppress the final whistle when the match-finished modal already played it', () => {
    const source = readResultSceneSource();

    expect(source).toContain('suppressFinalWhistle?: boolean');
    expect(source).toContain('private suppressFinalWhistle = false');
    expect(source).toContain('this.suppressFinalWhistle = data.suppressFinalWhistle === true;');
    expect(source).toContain("if (this.state?.phase === 'GAME_OVER' && !this.suppressFinalWhistle)");
    expect(source).toContain("playSoundSafe(this, 'sound-whistle-finish', { volume: 0.68 });");
  });

  it('starts confetti only for explicit tournament final result celebrations', () => {
    const source = readResultSceneSource();
    const createBlock = source.slice(
      source.indexOf('public create(): void'),
      source.indexOf('private createActions(')
    );
    const confettiBlock = source.slice(
      source.indexOf('private createTournamentFinalConfetti(): void'),
      source.indexOf('private needsPenaltyShootout(): boolean')
    );

    expect(source).toContain("import {\n  CONFETTI_EFFECT_MODE,\n  CONFETTI_REPEAT_INTERVAL_MS,\n  DEFAULT_CONFETTI_COLORS,\n  FULL_SCENE_CONFETTI_VIEWPORT,\n  createConfettiEffect,\n  normalizeConfettiColors,\n  type ConfettiEffectHandle\n} from '../ui/confettiEffect'");
    expect(source).toContain('isTournamentFinal?: boolean');
    expect(source).toContain("resultCelebration?: 'tournament-final'");
    expect(source).toContain('private isTournamentFinal = false');
    expect(source).toContain("this.isTournamentFinal = data.isTournamentFinal === true;");
    expect(source).toContain('this.resultCelebration = data.resultCelebration ?? null;');
    expect(createBlock.indexOf('this.createResultBackground')).toBeLessThan(
      createBlock.indexOf('this.createTournamentFinalConfetti();')
    );
    expect(createBlock.indexOf('this.createTournamentFinalConfetti();')).toBeLessThan(
      createBlock.indexOf('this.createMatchStatsPanel')
    );
    expect(confettiBlock).toContain('if (!this.shouldStartTournamentFinalConfetti())');
    expect(confettiBlock).toContain('this.confettiEffect = createConfettiEffect(this, {');
    expect(confettiBlock).toContain('colors: resolveResultConfettiColors(this.state)');
    expect(confettiBlock).toContain('depth: RESULT_CONFETTI_DEPTH');
    expect(confettiBlock).toContain('mode: CONFETTI_EFFECT_MODE');
    expect(confettiBlock).toContain('repeatIntervalMs: CONFETTI_REPEAT_INTERVAL_MS');
    expect(confettiBlock).toContain('viewport: FULL_SCENE_CONFETTI_VIEWPORT');
    expect(confettiBlock).toContain("return this.launchContext.mode === 'tournament' &&");
    expect(confettiBlock).toContain("(this.isTournamentFinal || this.resultCelebration === 'tournament-final')");
  });

  it('creates final celebration confetti as repeating side cannons instead of falling-only confetti', () => {
    const source = readResultSceneSource();
    const helperSource = readSource('src/ui/confettiEffect.ts');
    const confettiBlock = source.slice(
      source.indexOf('private createTournamentFinalConfetti(): void'),
      source.indexOf('private shouldStartTournamentFinalConfetti(): boolean')
    );

    expect(helperSource).toContain('export const FULL_SCENE_CONFETTI_VIEWPORT = {');
    expect(helperSource).toContain('width: SCENE_WIDTH');
    expect(helperSource).toContain('height: SCENE_HEIGHT');
    expect(helperSource).toContain("export const CONFETTI_EFFECT_MODE = 'side-cannons';");
    expect(helperSource).toContain('export const CONFETTI_REPEAT_INTERVAL_MS = 2000;');
    expect(helperSource).toContain('export const DESKTOP_CONFETTI_PIECES_PER_SIDE = 52;');
    expect(helperSource).toContain('export const MOBILE_CONFETTI_PIECES_PER_SIDE = 28;');
    expect(helperSource).toContain('export function createSideCannonBurstPieceConfigs');
    expect(helperSource).toContain("...createCannonSidePieceConfigs('left'");
    expect(helperSource).toContain("...createCannonSidePieceConfigs('right'");
    expect(helperSource).toContain('repeatTimer = scene.time.addEvent({');
    expect(helperSource).toContain('createBurst();');
    expect(helperSource).not.toContain('createConfettiPieceConfigs');
    expect(confettiBlock).toContain('viewport: FULL_SCENE_CONFETTI_VIEWPORT');
    expect(confettiBlock).toContain('mode: CONFETTI_EFFECT_MODE');
    expect(confettiBlock).toContain('repeatIntervalMs: CONFETTI_REPEAT_INTERVAL_MS');
    expect(confettiBlock).not.toContain('RESULT_SCOREBOARD_WIDTH');
    expect(confettiBlock).not.toContain('RESULT_SCOREBOARD_HEIGHT');
    expect(confettiBlock).not.toContain('RESULT_SCOREBOARD_CENTER_Y');
  });

  it('layers final confetti behind the result card and keeps it non-interactive', () => {
    const source = readResultSceneSource();
    const helperSource = readSource('src/ui/confettiEffect.ts');

    expect(source).toContain('const RESULT_BACKGROUND_DEPTH = 0');
    expect(source).toContain('const RESULT_CONFETTI_DEPTH = 1');
    expect(source).toContain('const RESULT_CONTENT_DEPTH = 2');
    expect(source).toContain('.setDepth(RESULT_BACKGROUND_DEPTH)');
    expect(source).toContain('.setDepth(RESULT_CONTENT_DEPTH)');
    expect(source).toContain('const panel = this.add.container(panelX, panelY).setDepth(RESULT_CONTENT_DEPTH)');
    expect(source).toContain(').forEach((button) => button.setDepth(RESULT_CONTENT_DEPTH));');
    expect(helperSource).toContain('const container = scene.add.container(0, 0);');
    expect(helperSource).toContain('container.setDepth(options.depth)');
    expect(helperSource).toContain('scene.add.rectangle(');
    expect(helperSource).not.toContain('setInteractive');
  });

  it('cleans final confetti when ResultScene shuts down or is destroyed', () => {
    const source = readResultSceneSource();
    const confettiBlock = source.slice(
      source.indexOf('private createTournamentFinalConfetti(): void'),
      source.indexOf('private needsPenaltyShootout(): boolean')
    );
    const helperSource = readSource('src/ui/confettiEffect.ts');

    expect(source).toContain('private confettiEffect: ConfettiEffectHandle | null = null');
    expect(confettiBlock).toContain('this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyConfettiEffect, this);');
    expect(confettiBlock).toContain('this.events.once(Phaser.Scenes.Events.DESTROY, this.destroyConfettiEffect, this);');
    expect(confettiBlock).toContain('this.confettiEffect?.destroy();');
    expect(confettiBlock).toContain('this.confettiEffect = null;');
    expect(helperSource).toContain('export interface ConfettiEffectHandle');
    expect(helperSource).toContain('scene.events.once(SCENE_SHUTDOWN_EVENT, destroy);');
    expect(helperSource).toContain('scene.events.once(SCENE_DESTROY_EVENT, destroy);');
    expect(helperSource).toContain('repeatTimer.remove(false);');
    expect(helperSource).toContain('for (const piece of activePieces)');
    expect(helperSource).toContain('container.destroy(true);');
  });

  it('resolves final confetti colors from the winner team kit with a neutral fallback', () => {
    const source = readResultSceneSource();
    const colorBlock = source.slice(
      source.indexOf('export function resolveResultConfettiColors'),
      source.length
    );

    expect(source).toContain("import { getTeamKitStyle } from '../data/teamKits'");
    expect(colorBlock).toContain('const winner = state?.players.find((player) => player.id === state.winnerId);');
    expect(colorBlock).toContain('getTeamKitStyle(winner.flagCode)');
    expect(colorBlock).toContain('return [...DEFAULT_CONFETTI_COLORS];');
    expect(colorBlock).toContain('kitStyle.primaryColor');
    expect(colorBlock).toContain('kitStyle.secondaryColor');
    expect(colorBlock).toContain('kitStyle.accentColor');
    expect(colorBlock).toContain('normalizeConfettiColors([');
  });

  it('keeps ResultScene final confetti on winner team colors while TournamentCompleteScene uses its own palette', () => {
    const completeSource = readSource('src/scenes/TournamentCompleteScene.ts');
    const resultSource = readResultSceneSource();

    expect(resultSource).toContain('colors: resolveResultConfettiColors(this.state)');
    expect(resultSource).toContain('getTeamKitStyle(winner.flagCode)');
    expect(completeSource).toContain('TOURNAMENT_COMPLETE_CONFETTI_COLORS');
    expect(completeSource).toContain('colors: TOURNAMENT_COMPLETE_CONFETTI_COLORS');
    expect(completeSource).not.toContain('isTournamentFinal');
  });

  it('uses the same match state and tournament context when final-whistle sound is suppressed', () => {
    const source = readResultSceneSource();
    const createBlock = source.slice(
      source.indexOf('public create(): void'),
      source.indexOf('private createActions(')
    );
    const returnBlock = source.slice(
      source.indexOf('private returnToTournament(): void'),
      source.indexOf('private startPenaltyShootout(')
    );

    expect(createBlock).toContain("if (this.state?.phase === 'GAME_OVER' && !this.suppressFinalWhistle)");
    expect(createBlock).toContain('this.createMatchStatsPanel(centerX, RESULT_SCOREBOARD_CENTER_Y, this.state, this.getPostMatchPenaltyAttempts())');
    expect(returnBlock).toContain('const launchContext = this.launchContext;');
    expect(returnBlock).toContain('createTournamentMatchResultFromGameState(match.id, this.state, match.homeTeamId, match.awayTeamId)');
    expect(returnBlock).toContain('submitTournamentMatchResultObject(tournament, result)');
    expect(returnBlock).not.toContain('suppressFinalWhistle');
  });

  it('renders result text with snapped coordinates and high-resolution text canvases', () => {
    const source = readResultSceneSource();

    expect(source).toContain("import { px, SHARP_TEXT_RESOLUTION } from '../ui/textRendering'");
    expect(source.match(/resolution: SHARP_TEXT_RESOLUTION/g)?.length).toBeGreaterThanOrEqual(9);
    expect(source).not.toContain('.setScale(');
  });

  it('uses the tournament mobile match-card team pattern for result teams', () => {
    const source = readResultSceneSource();

    expect(source).toContain("import { TEAM_CARD_STYLE } from '../ui/teamCardStyle'");
    expect(source).toContain('const RESULT_TEAM_CODE_FONT_SIZE = \'38px\'');
    expect(source).toContain('const RESULT_TEAM_FLAG_WIDTH = 70');
    expect(source).toContain('const RESULT_TEAM_FLAG_HEIGHT = 52');
    expect(source).toContain('const RESULT_TEAM_CODE_OFFSET_X = 52');
    expect(source).toContain('const RESULT_MOBILE_AI_BADGE_WIDTH = 34');
    expect(source).toContain('const RESULT_MOBILE_AI_BADGE_HEIGHT = 16');
    expect(source).toContain('const RESULT_MOBILE_AI_BADGE_RADIUS = 4');
    expect(source).toContain('const RESULT_MOBILE_AI_TEAM_CODE_OFFSET_Y = -10');
    expect(source).toContain('const RESULT_MOBILE_AI_BADGE_TOP_Y = 12');
    expect(source).toContain('private createResultTeamCodeBlock');
    expect(source).toContain('const isAi = controllerType === \'AI\'');
    expect(source).toContain('const teamCodeY = isAi ? RESULT_MOBILE_AI_TEAM_CODE_OFFSET_Y : 0');
    expect(source).toContain('getTeamScoreboardCode(flagCode)');
    expect(source).toContain('getFlagAssetKey(flagCode)');
    expect(source).toContain('this.addResultAiBadge(block, teamCodeX, RESULT_MOBILE_AI_BADGE_TOP_Y)');
    expect(source).toContain(".fillStyle(0xf0c95a, 1)");
    expect(source).toContain("color: '#1f2a2e'");
    expect(source).not.toContain('private createControllerBadge');
    expect(source).not.toContain("const label = controllerType === 'AI' ? 'AI' : 'P'");
  });

  it('keeps the match score font unchanged while result-card text follows tournament typography', () => {
    const source = readResultSceneSource();

    expect(source).toContain('const RESULT_STATS_FONT_FAMILY = \'Arial, sans-serif\'');
    expect(source).toContain('fontFamily: SCOREBOARD_FONT_FAMILY');
    expect(source).toContain("fontSize: '58px'");
    expect(source).toContain('fontFamily: RESULT_STATS_FONT_FAMILY');
    expect(source).toContain('fontSize: RESULT_TEAM_CODE_FONT_SIZE');
    expect(source).toContain("valueFontSize: '24px'");
    expect(source).toContain("labelFontSize: '20px'");
    expect(source).toContain("fontSize: '17px'");
  });

  it('enlarges only mobile post-match statistic typography inside the existing stats card', () => {
    const source = readResultSceneSource();
    const desktopLabel = readTypographyFontSize(source, 'RESULT_DESKTOP_STATS_TYPOGRAPHY', 'labelFontSize');
    const desktopValue = readTypographyFontSize(source, 'RESULT_DESKTOP_STATS_TYPOGRAPHY', 'valueFontSize');
    const desktopSection = readTypographyFontSize(source, 'RESULT_DESKTOP_STATS_TYPOGRAPHY', 'sectionTitleFontSize');
    const mobileLabel = readTypographyFontSize(source, 'RESULT_MOBILE_STATS_TYPOGRAPHY', 'labelFontSize');
    const mobileValue = readTypographyFontSize(source, 'RESULT_MOBILE_STATS_TYPOGRAPHY', 'valueFontSize');
    const mobileSection = readTypographyFontSize(source, 'RESULT_MOBILE_STATS_TYPOGRAPHY', 'sectionTitleFontSize');

    expect(source).toContain("import { isMobileLandscapeLayout } from '../ui/mobileLayout'");
    expect(source).toContain(
      'return isMobileLandscapeLayout() ? RESULT_MOBILE_STATS_TYPOGRAPHY : RESULT_DESKTOP_STATS_TYPOGRAPHY;'
    );
    expect(source).toContain('const typography = getResultStatsTypography();');
    expect(source).toContain('fontSize: typography.sectionTitleFontSize');
    expect(source).toContain('fontSize,');
    expect(source).toContain('content.add(this.createStatsValue(-285, rowY, playerOneValue, typography.valueFontSize))');
    expect(source).toContain('content.add(this.createStatsLabel(rowY, label, typography.labelFontSize))');
    expect(source).toContain("content.add(this.createStatsLabel(scorersTitleY, 'Goalscorers', typography.sectionTitleFontSize))");
    expect(source).toContain('const viewportHeight = 392');
    expect(source).toContain('const statsRowGap = layout.statsRowGap');

    expect(desktopLabel).toBe(20);
    expect(desktopValue).toBe(24);
    expect(desktopSection).toBe(20);
    expect(mobileLabel).toBe(26);
    expect(mobileValue).toBe(30);
    expect(mobileSection).toBe(26);
    expect(mobileLabel / desktopLabel).toBeGreaterThanOrEqual(1.2);
    expect(mobileLabel / desktopLabel).toBeLessThanOrEqual(1.35);
    expect(mobileValue / desktopValue).toBeGreaterThanOrEqual(1.2);
    expect(mobileValue / desktopValue).toBeLessThanOrEqual(1.35);
    expect(mobileSection / desktopSection).toBeGreaterThanOrEqual(1.2);
    expect(mobileSection / desktopSection).toBeLessThanOrEqual(1.35);
  });

  it('keeps the desktop gap under Match statistics unchanged before the stats rows', () => {
    const source = readResultSceneSource();
    const desktopStatsStartY = readLayoutNumber(source, 'RESULT_DESKTOP_STATS_LAYOUT', 'statsStartY');
    const desktopStatsRowGap = readLayoutNumber(source, 'RESULT_DESKTOP_STATS_LAYOUT', 'statsRowGap');

    expect(source).toContain(".text(0, px(-height / 2 + 122), 'Match statistics'");
    expect(source).toContain('const viewportTop = -132');
    expect(source).toContain('const statsStartY = layout.statsStartY');
    expect(source).toContain('const statsRowGap = layout.statsRowGap');
    expect(source).toContain('const rowY = statsStartY + index * statsRowGap');
    expect(desktopStatsStartY).toBe(8);
    expect(desktopStatsRowGap).toBe(32);
  });

  it('adds mobile-only breathing room below Match statistics without reducing mobile font sizes', () => {
    const source = readResultSceneSource();
    const desktopStatsStartY = readLayoutNumber(source, 'RESULT_DESKTOP_STATS_LAYOUT', 'statsStartY');
    const mobileStatsStartY = readLayoutNumber(source, 'RESULT_MOBILE_STATS_LAYOUT', 'statsStartY');
    const mobileStatsRowGap = readLayoutNumber(source, 'RESULT_MOBILE_STATS_LAYOUT', 'statsRowGap');
    const mobileLabel = readTypographyFontSize(source, 'RESULT_MOBILE_STATS_TYPOGRAPHY', 'labelFontSize');
    const mobileValue = readTypographyFontSize(source, 'RESULT_MOBILE_STATS_TYPOGRAPHY', 'valueFontSize');
    const mobileSection = readTypographyFontSize(source, 'RESULT_MOBILE_STATS_TYPOGRAPHY', 'sectionTitleFontSize');

    expect(source).toContain("-height / 2 + 72,\n      playerOne.flagCode");
    expect(source).toContain(".text(0, px(-height / 2 + 122), 'Match statistics'");
    expect(source).toContain('function getResultStatsLayout(): ResultStatsLayout');
    expect(source).toContain('return isMobileLandscapeLayout() ? RESULT_MOBILE_STATS_LAYOUT : RESULT_DESKTOP_STATS_LAYOUT;');
    expect(source).toContain('const layout = getResultStatsLayout();');
    expect(mobileStatsStartY - desktopStatsStartY).toBe(12);
    expect(mobileStatsStartY).toBe(20);
    expect(mobileStatsRowGap).toBe(32);
    expect(mobileLabel).toBe(26);
    expect(mobileValue).toBe(30);
    expect(mobileSection).toBe(26);
    expect(source).not.toContain(".text(0, px(-height / 2 + 112), 'Match statistics'");
    expect(source).not.toContain('const statsStartY = 18');
  });

  it('puts all statistics and scorer content inside one touch-scrollable card content area', () => {
    const source = readResultSceneSource();

    expect(source).toContain('private addStatsScrollContent');
    expect(source).toContain('const content = this.add.container(0, viewportTop)');
    expect(source).toContain('content.add(this.createStatsValue(-285, rowY, playerOneValue, typography.valueFontSize))');
    expect(source).toContain("content.add(this.createStatsLabel(scorersTitleY, 'Goalscorers', typography.sectionTitleFontSize))");
    expect(source).toContain('content.add(this.createScorersList(playerOneScorerX, rowY, row.playerOneText, scorerColumnWidth))');
    expect(source).toContain('content.setMask(mask)');
    expect(source).toContain('const maxScroll = Math.max(0, contentHeight - viewportHeight)');
    expect(source).toContain('createDragScrollArea({');
    expect(source).toContain('dragScroll.bindDragTarget(scrollZone)');
    expect(source).toContain('TOUCH_SCROLL_WHEEL_FACTOR');
    expect(source).not.toContain('private addScorerTimeline');
    expect(source).not.toContain('const timelineContent = this.add.container(0, viewportTop)');
  });

  it('uses the updated bottom result button set and keeps it attached to the card width', () => {
    const source = readResultSceneSource();
    const actionsSource = readSource('src/ui/resultActionButtons.ts');

    expect(source).toContain('const RESULT_SCOREBOARD_WIDTH = 840');
    expect(source).toContain('const RESULT_SCREEN_VERTICAL_MARGIN = SCENE_HEIGHT - (RESULT_ACTION_BUTTON_Y + RESULT_ACTION_BUTTON_HEIGHT / 2)');
    expect(source).toContain('const RESULT_SCOREBOARD_TOP_Y = RESULT_SCREEN_VERTICAL_MARGIN');
    expect(source).toContain('const RESULT_SCOREBOARD_HEIGHT = RESULT_ACTION_BUTTON_Y - RESULT_ACTION_BUTTON_HEIGHT / 2 - RESULT_SCOREBOARD_TOP_Y');
    expect(source).toContain('const RESULT_SCOREBOARD_CENTER_Y = RESULT_SCOREBOARD_TOP_Y + RESULT_SCOREBOARD_HEIGHT / 2');
    expect(source).toContain("createResultActionButtons(this, centerX, [\n        { label: 'Play Again', onClick: () => this.startReplayMatch() },\n        { label: 'Continue', onClick: () => this.returnToTournament() }\n      ], { attachedToPanel: true })");
    expect(source).toContain("{ label: 'Play Again', onClick: () => this.startReplayMatch() }");
    expect(source).toContain("{ label: 'Continue', onClick: () => this.returnToTournament() }");
    expect(source).toContain("{ label: 'New Match', onClick: () => this.scene.start('TeamSelectScene', { mode: 'match' }) }");
    expect(source.match(/attachedToPanel: true/g)).toHaveLength(2);
    expect(source).not.toContain("'Back to tournament'");
    expect(source).not.toContain("'Menu'");
    expect(source).not.toContain('MenuScene');

    expect(actionsSource).toContain('export const RESULT_ACTION_PANEL_WIDTH = 840');
    expect(actionsSource).toContain('export const RESULT_ACTION_BUTTON_GAP = 0');
    expect(actionsSource).toContain('export const RESULT_ACTION_BUTTON_WIDTH = RESULT_ACTION_PANEL_WIDTH / 2');
    expect(actionsSource).toContain('export const RESULT_ACTION_BUTTON_HEIGHT = 68');
    expect(actionsSource).toContain("export const RESULT_ACTION_BUTTON_FONT_SIZE = '24px'");
    expect(actionsSource).toContain('export const RESULT_ACTION_BUTTON_Y = 644');
    expect(actionsSource).toContain('export const RESULT_ACTION_BUTTON_RADIUS = 8');
    expect(actionsSource).toContain('const buttonWidth = (totalWidth - RESULT_ACTION_BUTTON_GAP * Math.max(0, actions.length - 1)) / actions.length');
    expect(actionsSource).toContain('borderRadius: getResultActionButtonRadius(index, actions.length, options.attachedToPanel === true)');
  });

  it('positions the result card and footer as one vertically balanced block', () => {
    const source = readResultSceneSource();

    expect(source).toContain("import {\n  RESULT_ACTION_BUTTON_HEIGHT,\n  RESULT_ACTION_BUTTON_Y,\n  createResultActionButtons\n} from '../ui/resultActionButtons'");
    expect(source).toContain('const RESULT_SCREEN_VERTICAL_MARGIN = SCENE_HEIGHT - (RESULT_ACTION_BUTTON_Y + RESULT_ACTION_BUTTON_HEIGHT / 2)');
    expect(source).toContain('const RESULT_SCOREBOARD_TOP_Y = RESULT_SCREEN_VERTICAL_MARGIN');
    expect(source).toContain('const RESULT_SCOREBOARD_HEIGHT = RESULT_ACTION_BUTTON_Y - RESULT_ACTION_BUTTON_HEIGHT / 2 - RESULT_SCOREBOARD_TOP_Y');
    expect(source).toContain('const RESULT_SCOREBOARD_CENTER_Y = RESULT_SCOREBOARD_TOP_Y + RESULT_SCOREBOARD_HEIGHT / 2');
    expect(source).toContain('this.createMatchStatsPanel(centerX, RESULT_SCOREBOARD_CENTER_Y, this.state, this.getPostMatchPenaltyAttempts())');
    expect(source).toContain('const viewportHeight = 392');
    expect(source).toContain('-height / 2 + 72');
  });

  it('orders tournament result actions as Play Again on the left and Continue on the right', () => {
    const source = readResultSceneSource();
    const tournamentActionsStart = source.indexOf("{ label: 'Play Again', onClick: () => this.startReplayMatch() },\n        { label: 'Continue'");
    const tournamentActions = source.slice(
      tournamentActionsStart,
      source.indexOf("], { attachedToPanel: true }).forEach", tournamentActionsStart)
    );

    expect(tournamentActions.indexOf("{ label: 'Play Again', onClick: () => this.startReplayMatch() }")).toBeLessThan(
      tournamentActions.indexOf("{ label: 'Continue', onClick: () => this.returnToTournament() }")
    );
    expect(tournamentActions).not.toContain("'Menu'");
  });

  it('uses flat top corners and only rounded outer bottom corners for attached result buttons', () => {
    const actionsSource = readSource('src/ui/resultActionButtons.ts');
    const buttonSource = readSource('src/ui/Button.ts');

    expect(actionsSource).toContain('attachedToPanel?: boolean');
    expect(actionsSource).toContain('function getResultActionButtonRadius(index: number, actionCount: number, attachedToPanel: boolean): number | ButtonCornerRadius');
    expect(actionsSource).toContain('if (!attachedToPanel) {\n    return RESULT_ACTION_BUTTON_RADIUS;\n  }');
    expect(actionsSource).toContain('const isFirst = index === 0');
    expect(actionsSource).toContain('const isLast = index === actionCount - 1');
    expect(actionsSource).toContain('topLeft: 0');
    expect(actionsSource).toContain('topRight: 0');
    expect(actionsSource).toContain('bottomRight: isLast ? RESULT_ACTION_BUTTON_RADIUS : 0');
    expect(actionsSource).toContain('bottomLeft: isFirst ? RESULT_ACTION_BUTTON_RADIUS : 0');
    expect(actionsSource).not.toContain('bottomRight: isFirst ? RESULT_ACTION_BUTTON_RADIUS : 0');
    expect(actionsSource).not.toContain('bottomLeft: isLast ? RESULT_ACTION_BUTTON_RADIUS : 0');
    expect(buttonSource).toContain('export interface ButtonCornerRadius');
    expect(buttonSource).toContain('borderRadius?: number | ButtonCornerRadius');
    expect(buttonSource).toContain('fillButtonRoundedRect');
    expect(buttonSource).toContain('strokeButtonRoundedRect');
  });

  it('shows the central game version in the bottom-right corner', () => {
    const source = readResultSceneSource();

    expect(source).toContain("import { GAME_TITLE, GAME_VERSION, MENU_ASSETS, SCENE_HEIGHT, SCENE_WIDTH } from '../config'");
    expect(source).toContain('private createVersionLabel(): void');
    expect(source).toContain('this.createVersionLabel()');
    expect(source).toContain('SCENE_WIDTH - RESULT_VERSION_MARGIN');
    expect(source).toContain('SCENE_HEIGHT - RESULT_VERSION_MARGIN');
    expect(source).toContain('`${GAME_TITLE} | v${GAME_VERSION}`');
    expect(source).toContain('.setOrigin(1, 1)');
  });

  it('preserves tournament continuation and replay behavior without changing match logic', () => {
    const source = readResultSceneSource();

    expect(source).toContain('private returnToTournament(): void');
    expect(source).toContain('createTournamentMatchResultFromGameState(match.id, this.state, match.homeTeamId, match.awayTeamId)');
    expect(source).toContain('this.startPenaltyShootout(tournament, result)');
    expect(source).toContain('submitTournamentMatchResultObject(tournament, result)');
    expect(source).toContain('saveTournament(updatedTournament)');
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

  it('keeps post-match penalty attempts in the unified scroll content below goalscorers', () => {
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

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function normalizeSourceLineEndings(source: string): string {
  return source.replace(/\r\n/g, '\n');
}

function readSource(relativePath: string): string {
  return normalizeSourceLineEndings(readFileSync(join(process.cwd(), relativePath), 'utf8'));
}

describe('GameScene visual layout contracts', () => {
  it('uses a bounce chain for the active deck ball instead of yoyo levitation', () => {
    const source = readSource('src/ui/DeckView.ts');

    expect(source).toContain('export const DECK_MARKER_BOUNCE_HEIGHT = 20');
    expect(source).toContain('const DECK_MARKER_DECK_OVERLAP_RATIO = 1 / 3');
    expect(source).toContain('const DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO = 1 / 2 - DECK_MARKER_DECK_OVERLAP_RATIO');
    expect(source).toContain("const markerSide = options.countSide ?? 'right'");
    expect(source).toContain("const deckEdgeX = markerSide === 'right' ? DECK_WIDTH * DECK_STACK_SCALE / 2 : -DECK_WIDTH * DECK_STACK_SCALE / 2");
    expect(source).toContain('const deckBottomY = DECK_HEIGHT * DECK_STACK_SCALE / 2');
    expect(source).toContain('deckEdgeX + DECK_MARKER_SIZE * DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO');
    expect(source).toContain('deckEdgeX - DECK_MARKER_SIZE * DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO');
    expect(source).toContain('const markerBaseY = deckBottomY - DECK_MARKER_SIZE / 2');
    expect(source).toContain("const marker = scene.add.image(markerX, markerBaseY, 'turn-ball')");
    expect(source).toContain('scene.tweens.chain');
    expect(source).toContain("ease: 'Quad.easeOut'");
    expect(source).toContain("ease: 'Quad.easeIn'");
    expect(source).toContain('scaleX: baseScaleX * 1.08');
    expect(source).toContain('scaleY: baseScaleY * 0.92');
    expect(source).toContain('bounceTween.stop()');
    expect(source).toContain('Phaser.Scenes.Events.SHUTDOWN');
    expect(source).not.toContain("ease: 'Sine.easeInOut'");
    expect(source).not.toContain('repeat: -1');
  });

  it('positions the active deck ball beside the active deck with one-third horizontal overlap', () => {
    const deckSource = readSource('src/ui/DeckView.ts');
    const gameSceneSource = readSource('src/scenes/GameScene.ts');

    expect(gameSceneSource).toContain("state.players[0],\n        'right',");
    expect(gameSceneSource).toContain("state.players[1],\n        'left',");

    const deckStackScaleMatch = deckSource.match(/const DECK_STACK_SCALE = ([\d.]+);/);
    const markerSizeMatch = deckSource.match(/const DECK_MARKER_SIZE = (\d+);/);
    const bounceHeightMatch = deckSource.match(/export const DECK_MARKER_BOUNCE_HEIGHT = (\d+);/);

    expect(deckSource).toContain('const DECK_WIDTH = CARD_WIDTH');
    expect(deckStackScaleMatch).not.toBeNull();
    expect(markerSizeMatch).not.toBeNull();
    expect(bounceHeightMatch).not.toBeNull();

    const deckStackScale = Number(deckStackScaleMatch![1]);
    const markerSize = Number(markerSizeMatch![1]);
    const bounceHeight = Number(bounceHeightMatch![1]);
    const markerOverlap = markerSize * (1 / 3);
    const markerOutsideCenterOffset = markerSize * (1 / 2 - 1 / 3);

    expect(deckStackScale).toBe(1.12);
    expect(markerSize).toBe(34);
    expect(bounceHeight).toBe(20);
    expect(markerOverlap).toBeCloseTo(11.33, 2);
    expect(markerOutsideCenterOffset).toBeCloseTo(5.67, 2);
    expect(deckSource).toContain("markerSide === 'right'");
    expect(deckSource).toContain('deckEdgeX + DECK_MARKER_SIZE * DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO');
    expect(deckSource).toContain('deckEdgeX - DECK_MARKER_SIZE * DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO');
    expect(deckSource).toContain('const markerBaseY = deckBottomY - DECK_MARKER_SIZE / 2');
    expect(deckSource).not.toContain("scene.add.image(0, -DECK_HEIGHT * DECK_STACK_SCALE / 2 - 30, 'turn-ball')");
  });

  it('shows the deck count below a slightly enlarged deck stack', () => {
    const source = readSource('src/ui/DeckView.ts');

    expect(source).toContain('const DECK_STACK_SCALE = 1.12');
    expect(source).toContain('const DECK_COUNT_OFFSET_Y = DECK_HEIGHT * DECK_STACK_SCALE / 2 + 32');
    expect(source).toContain('const deckStack = scene.add.container(0, 0)');
    expect(source).toContain('deckStack.add([back, frontBackground, cover, frontBorder])');
    expect(source).toContain('.text(0, DECK_COUNT_OFFSET_Y, `${count}`');
    expect(source).toContain('deckStack.setScale(DECK_STACK_SCALE)');
    expect(source).toContain('this.add([deckStack, countText])');
    expect(source).toContain('DECK_WIDTH * DECK_STACK_SCALE + 24');
    expect(source).not.toContain("options.countSide === 'left' ? -84 : 84");
  });

  it('replaces the left match actions with one tall Pause button', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('const FIELD_LEFT = (SCENE_WIDTH - FIELD_WIDTH) / 2');
    expect(source).toContain('const FIELD_RIGHT = FIELD_LEFT + FIELD_WIDTH');
    expect(source).toContain('const SCOREBOARD_LEFT = SCENE_WIDTH / 2 - SCORE_VIEW_WIDTH / 2');
    expect(source).toContain('const SCOREBOARD_RIGHT = SCENE_WIDTH / 2 + SCORE_VIEW_WIDTH / 2');
    expect(source).toContain("const MATCH_ACTION_BUTTON_FONT_SIZE = '28px'");
    expect(source).toContain('const MATCH_ACTION_BUTTON_HEIGHT = 38');
    expect(source).toContain('const SIDE_ACTION_BUTTON_HORIZONTAL_GAP = 14');
    expect(source).toContain('const LEFT_ACTION_BUTTONS_LEFT = FIELD_LEFT');
    expect(source).toContain('const LEFT_ACTION_BUTTONS_RIGHT = SCOREBOARD_LEFT - SIDE_ACTION_BUTTON_HORIZONTAL_GAP');
    expect(source).toContain('const SIDE_ACTION_BUTTON_WIDTH = Math.min(LEFT_ACTION_BUTTONS_WIDTH, RIGHT_ACTION_BUTTONS_WIDTH)');
    expect(source).toContain('const LEFT_ACTION_BUTTON_X = LEFT_ACTION_BUTTONS_LEFT + SIDE_ACTION_BUTTON_WIDTH / 2');
    expect(source).toContain('const MATCH_ACTION_BUTTON_TOP = SCOREBOARD_CENTER_Y - SCORE_VIEW_HEIGHT / 2 + 3');
    expect(source).toContain('const MATCH_ACTION_BUTTON_STACK_HEIGHT = MATCH_ACTION_BUTTON_HEIGHT * 2 + MATCH_ACTION_BUTTON_GAP');
    expect(source).toContain('const MATCH_ACTION_BUTTON_CENTER_Y = MATCH_ACTION_BUTTON_TOP + MATCH_ACTION_BUTTON_STACK_HEIGHT / 2');
    expect(source).toContain("'Pause', () => this.openPauseModal(state)");
    expect(source).toContain('height: MATCH_ACTION_BUTTON_STACK_HEIGHT');
    expect(source).toContain('fontSize: MATCH_ACTION_BUTTON_FONT_SIZE');
    expect(source).toContain('width: SIDE_ACTION_BUTTON_WIDTH');
    expect(source).not.toContain("'Menu', () => this.openExitConfirmModal()");
    expect(source).not.toContain("'Result',\n        () => this.openResult(state)");
    expect(source).not.toContain("new Button(this, 120, 34, 'Menu'");
    expect(source).not.toContain("new Button(this, 120, 90, 'Result'");
  });

  it('keeps one tall Rules button on the right side of the match UI', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('const RIGHT_ACTION_BUTTONS_LEFT = SCOREBOARD_RIGHT + SIDE_ACTION_BUTTON_HORIZONTAL_GAP');
    expect(source).toContain('const RIGHT_ACTION_BUTTONS_RIGHT = FIELD_RIGHT');
    expect(source).toContain('const RIGHT_ACTION_BUTTON_X = RIGHT_ACTION_BUTTONS_RIGHT - SIDE_ACTION_BUTTON_WIDTH / 2');
    expect(source).toContain("'Rules', () => this.openMatchInfoModal('rules')");
    expect(source.match(/width: SIDE_ACTION_BUTTON_WIDTH/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source.match(/height: MATCH_ACTION_BUTTON_STACK_HEIGHT/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source.match(/fontSize: MATCH_ACTION_BUTTON_FONT_SIZE/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source).not.toContain("() => this.openMatchInfoModal('about')");
    expect(source).not.toContain("this.scene.start('MenuScene', { mode: 'rules' })");
    expect(source).not.toContain("this.scene.start('MenuScene', { mode: 'about' })");
  });

  it('opens a Pause overlay with Continue, Menu, Result and About actions', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('private pauseModal: Phaser.GameObjects.Container | null = null');
    expect(source).toContain('private openPauseModal(state: Readonly<GameState>): void');
    expect(source).toContain('const modal = this.add.container(0, 0).setDepth(1000)');
    expect(source).toContain('const overlay = this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72)');
    expect(source).toContain('overlay.setInteractive()');
    expect(source).toContain('const PAUSE_MODAL = {');
    expect(source).toContain('width: 460');
    expect(source).toContain('height: 500');
    expect(source).toContain('PAUSE_MODAL.width,\n      PAUSE_MODAL.height,\n      INFO_MODAL_BACKGROUND_COLOR,\n      INFO_MODAL_BACKGROUND_ALPHA');
    expect(source).toContain("text(0, -160, 'Pause'");
    expect(source).toContain('const PAUSE_BUTTON = {');
    expect(source).toContain('width: 300');
    expect(source).toContain('height: 64');
    expect(source).toContain("fontSize: '26px'");
    expect(source).toContain('gap: 20');
    expect(source).toContain('const buttonStep = PAUSE_BUTTON.height + PAUSE_BUTTON.gap');
    expect(source).toContain("this.createPauseButton(0, firstButtonY, 'Continue', () => this.closePauseModal())");
    expect(source).toContain("this.createPauseButton(0, firstButtonY + buttonStep, 'Menu', () => {");
    expect(source).toContain('this.openExitConfirmModal()');
    expect(source).toContain("this.createPauseButton(0, firstButtonY + buttonStep * 2, 'Result', () => {");
    expect(source).toContain('this.openResult(state)');
    expect(source).toContain("this.createPauseButton(0, firstButtonY + buttonStep * 3, 'About', () => {");
    expect(source).toContain("this.openMatchInfoModal('about')");
    expect(source).toContain('private closePauseModal(): void');
    expect(source).toContain('this.pauseModal === null');
  });

  it('keeps enlarged pause buttons inside a roomier panel', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const modalMatch = source.match(/const PAUSE_MODAL = {\n  width: (\d+),\n  height: (\d+)\n} as const;/);
    const buttonMatch = source.match(
      /const PAUSE_BUTTON = {\n  width: (\d+),\n  height: (\d+),\n  fontSize: '(\d+)px',\n  gap: (\d+)\n} as const;/
    );
    const firstButtonYMatch = source.match(/const firstButtonY = (-?\d+);/);

    expect(modalMatch).not.toBeNull();
    expect(buttonMatch).not.toBeNull();
    expect(firstButtonYMatch).not.toBeNull();

    const [, modalWidthText, modalHeightText] = modalMatch!;
    const [, buttonWidthText, buttonHeightText, fontSizeText, gapText] = buttonMatch!;
    const [, firstButtonYText] = firstButtonYMatch!;
    const modalWidth = Number(modalWidthText);
    const modalHeight = Number(modalHeightText);
    const buttonWidth = Number(buttonWidthText);
    const buttonHeight = Number(buttonHeightText);
    const fontSize = Number(fontSizeText);
    const gap = Number(gapText);
    const firstButtonY = Number(firstButtonYText);
    const buttonStep = buttonHeight + gap;
    const sidePadding = (modalWidth - buttonWidth) / 2;
    const buttonsBottom = firstButtonY + buttonStep * 3 + buttonHeight / 2;
    const bottomPadding = modalHeight / 2 - buttonsBottom;

    expect(buttonWidth).toBe(300);
    expect(buttonHeight).toBe(64);
    expect(fontSize).toBe(26);
    expect(gap).toBe(20);
    expect(sidePadding).toBeGreaterThanOrEqual(70);
    expect(bottomPadding).toBeGreaterThanOrEqual(40);
    expect(modalHeight).toBeGreaterThan(buttonHeight * 4 + gap * 3);
  });

  it('keeps pause action hit areas tied to the visible Button size', () => {
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const buttonSource = readSource('src/ui/Button.ts');

    expect(gameSceneSource).toContain('return new Button(this, x, y, label, onClick, {');
    expect(gameSceneSource).toContain('fontSize: PAUSE_BUTTON.fontSize');
    expect(gameSceneSource).toContain('height: PAUSE_BUTTON.height');
    expect(gameSceneSource).toContain('width: PAUSE_BUTTON.width');
    expect(buttonSource).toContain('const width = options.width ?? 220');
    expect(buttonSource).toContain('const height = options.height ?? 54');
    expect(buttonSource).toContain('const background = scene.add.rectangle(0, 0, width, height');
    expect(buttonSource).toContain('this.setSize(width, height)');
    expect(buttonSource).toContain('this.setInteractive({ useHandCursor: true })');
    expect(buttonSource).not.toContain('hitArea');
  });

  it('keeps match info overlays localized, scrollable and non-resetting', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const menuSource = readSource('src/scenes/MenuScene.ts');

    expect(menuSource).toContain('export const ABOUT_LANGUAGES');
    expect(menuSource).toContain('export const ABOUT_CONTENT');
    expect(menuSource).toContain('export const RULES_CONTENT');
    expect(source).toContain("import { ABOUT_CONTENT, ABOUT_LANGUAGES, RULES_CONTENT, type AboutLanguage, type InfoModalKind } from './MenuScene'");
    expect(source).toContain('private infoModal: Phaser.GameObjects.Container | null = null');
    expect(source).toContain('private activeInfoModal: InfoModalKind | null = null');
    expect(source).toContain("private infoLanguage: AboutLanguage = 'en'");
    expect(source).toContain('const overlay = this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72)');
    expect(source).toContain('overlay.setInteractive()');
    expect(source).toContain('const INFO_BACK_BUTTON = {');
    expect(source).toContain("return new Button(this, 0, INFO_BACK_BUTTON.y, 'Back', () => this.closeMatchInfoModal()");
    expect(source).toContain('height: 360');
    expect(source).not.toContain("'Close'");
    expect(source).not.toContain("text(0, -1, '<'");
    expect(source).toContain('this.createMatchAboutViewport(aboutContent) : this.createMatchRulesViewport(rulesContent)');
    expect(source).toContain("scrollZone.on('wheel'");
    expect(source).toContain('this.infoModal === null');
    expect(source).toContain('this.pauseModal === null');
    expect(source).toContain("this.aiTurnController?.requestTurnCheck('STATE_RENDERED')");
    expect(source).not.toContain("openMatchInfoModal('rules') => this.scene.start");
    expect(source).not.toContain("openMatchInfoModal('about') => this.scene.start");
  });

  it('draws a striped grass pitch under the field markings', () => {
    const source = readSource('src/ui/FieldView.ts');

    expect(source).toContain('export const FIELD_VIEW_WIDTH = 1120');
    expect(source).toContain('export const FIELD_VIEW_HEIGHT = 600');
    expect(source).toContain('export const FIELD_GRASS_STRIPE_COUNT = 14');
    expect(source).toContain('export const FIELD_GRASS_BASE_COLOR = 0x157a43');
    expect(source).toContain('export const FIELD_GRASS_LIGHT_STRIPE_COLOR = 0x19864a');
    expect(source).toContain('export const FIELD_GRASS_DARK_STRIPE_COLOR = 0x126d3c');
    expect(source).toContain('this.add([this.createStripedPitch(scene), this.createPitchMarkings(scene), centerLine, centerCircle])');
    expect(source).toContain('for (let stripeIndex = 0; stripeIndex < FIELD_GRASS_STRIPE_COUNT; stripeIndex += 1)');
    expect(source).toContain('pitch.fillRect(pitchLeft + stripeIndex * stripeWidth, pitchTop, stripeWidth, FIELD_VIEW_HEIGHT)');
    expect(source).toContain('pitch.strokeRect(pitchLeft, pitchTop, FIELD_VIEW_WIDTH, FIELD_VIEW_HEIGHT)');
    expect(source).not.toContain('scene.add.rectangle(0, 0, 1120, 600');
  });

  it('aligns transparent taller Goals panels with the field top', () => {
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const statsSource = readSource('src/ui/TeamStatsView.ts');

    expect(gameSceneSource).toContain('const TEAM_STATS_CENTER_Y = FIELD_TOP + TEAM_STATS_VIEW_HEIGHT / 2');
    expect(gameSceneSource).toContain('new TeamStatsView(this, 120, TEAM_STATS_CENTER_Y');
    expect(gameSceneSource).toContain('new TeamStatsView(this, 1485, TEAM_STATS_CENTER_Y');
    expect(statsSource).toContain('export const TEAM_STATS_VIEW_HEIGHT = 288');
    expect(statsSource).toContain('const viewportHeight = height - 56');
    expect(statsSource).toContain('this.add([title, scorersContent, scrollZone, scrollbarTrack, scrollbarThumb])');
    expect(statsSource).not.toContain('scene.add.rectangle(0, 0, width, height');
    expect(statsSource).not.toContain('0x143f2d');
  });

  it('matches the top scoreboard width to the advantage indicator width', () => {
    const scoreSource = readSource('src/ui/ScoreView.ts');
    const scoreboardStyleSource = readSource('src/ui/scoreboardStyle.ts');
    const advantageSource = readSource('src/ui/AdvantageView.ts');

    expect(advantageSource).toContain('export const ADVANTAGE_VIEW_WIDTH = 520');
    expect(scoreSource).toContain("import { ADVANTAGE_VIEW_WIDTH } from './AdvantageView'");
    expect(scoreSource).toContain("} from './scoreboardStyle'");
    expect(scoreSource).toContain('export const SCORE_VIEW_WIDTH = ADVANTAGE_VIEW_WIDTH');
    expect(scoreboardStyleSource).toContain('export const SCOREBOARD_BACKGROUND_COLOR = 0x08120f');
    expect(scoreboardStyleSource).toContain('export const SCOREBOARD_BACKGROUND_ALPHA = 0.92');
    expect(scoreboardStyleSource).toContain('export const SCOREBOARD_BORDER_COLOR = 0xf0c95a');
    expect(scoreboardStyleSource).toContain('export const SCOREBOARD_BORDER_ALPHA = 0.95');
    expect(scoreboardStyleSource).toContain("export const SCOREBOARD_FONT_FAMILY = 'DS-Digital, Arial, sans-serif'");
    expect(scoreSource).toContain('export const SCORE_VIEW_BACKGROUND_COLOR = SCOREBOARD_BACKGROUND_COLOR');
    expect(scoreSource).toContain('export const SCORE_VIEW_BACKGROUND_ALPHA = SCOREBOARD_BACKGROUND_ALPHA');
    expect(scoreSource).toContain('export const SCORE_VIEW_BORDER_COLOR = SCOREBOARD_BORDER_COLOR');
    expect(scoreSource).toContain('export const SCORE_VIEW_BORDER_ALPHA = SCOREBOARD_BORDER_ALPHA');
    expect(scoreSource).toContain('export const SCORE_VIEW_FONT_FAMILY = SCOREBOARD_FONT_FAMILY');
    expect(scoreSource).toContain('scene.add.rectangle(0, 0, SCORE_VIEW_WIDTH, SCORE_VIEW_HEIGHT');
    expect(scoreSource).toContain('SCORE_VIEW_BACKGROUND_COLOR, SCORE_VIEW_BACKGROUND_ALPHA');
    expect(scoreSource).toContain('background.setStrokeStyle(2, SCORE_VIEW_BORDER_COLOR, SCORE_VIEW_BORDER_ALPHA)');
    expect(scoreSource).not.toContain('background.setStrokeStyle(2, 0x436b58, 0.95)');
    expect(advantageSource).toContain('scene.add.rectangle(0, 0, ADVANTAGE_VIEW_WIDTH, ADVANTAGE_VIEW_HEIGHT');
    expect(scoreSource).not.toContain('scene.add.rectangle(0, 0, 620, 78');
  });

  it('uses scoreboard codes and the score font for all top scoreboard text', () => {
    const scoreSource = readSource('src/ui/ScoreView.ts');

    expect(scoreSource).toContain("import { getFlagAssetKey, getTeamScoreboardCode } from '../data/nationalTeams'");
    expect(scoreSource).toContain('getTeamScoreboardCode(playerOneFlagCode)');
    expect(scoreSource).toContain('getTeamScoreboardCode(playerTwoFlagCode)');
    expect(scoreSource).toContain('fontFamily: SCORE_VIEW_FONT_FAMILY');
    expect(scoreSource.match(/fontFamily: SCORE_VIEW_FONT_FAMILY/g)?.length).toBeGreaterThanOrEqual(5);
    expect(scoreSource).not.toContain('fontFamily: \'Arial, sans-serif\'');
    expect(scoreSource).not.toContain('createPlayerLabel(scene, -158, 26, playerOneName)');
    expect(scoreSource).not.toContain('createPlayerLabel(scene, 158, 26, playerTwoName)');
  });

  it('uses a transparent black background without borders for in-game info panels', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain("import { SCORE_VIEW_HEIGHT, SCORE_VIEW_WIDTH, ScoreView } from '../ui/ScoreView'");
    expect(source).toContain('const INFO_MODAL_BACKGROUND_COLOR = 0x000000');
    expect(source).toContain('const INFO_MODAL_BACKGROUND_ALPHA = 0.82');
    expect(source).toContain(
      'INFO_MODAL.width,\n      INFO_MODAL.height,\n      INFO_MODAL_BACKGROUND_COLOR,\n      INFO_MODAL_BACKGROUND_ALPHA'
    );
    expect(source).not.toContain('background.setStrokeStyle(2, 0x9dd2a7)');
    expect(source).toContain('const overlay = this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72)');
  });

  it('restores failed move card animation while leaving field success on card flight', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('const card = new CardView(this, startX, startY, {');
    expect(source).toContain("onComplete: () => this.finishAttackAnimation(state, context, card, target, outcome, onComplete)");
    expect(source).toContain("if (outcome === 'post' || outcome === 'save' || outcome === 'miss') {");
    expect(source).toContain('this.showImpactPulse(target.x, target.y, outcome);');
    expect(source).toContain('this.playGoalkeeperImpactSound(context.positionId, outcome);');
    expect(source).toContain("state.log.slice(-4).some((event) => event.type === 'ATTACK_MISSED') ? 'miss' : 'defeat'");
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOALPOST_HIT'))");
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOALKEEPER_SAVE'))");
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOAL_SCORED'))");
    expect(source).not.toContain("if (outcome === 'miss') {\n      this.render(state, {");
    expect(source).not.toContain('this.playFailedMoveAnimation(state, context, target');
  });

  it('prepares a turn-ball based helper for goalkeeper shot outcomes without wiring it to failed moves', () => {
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const deckSource = readSource('src/ui/DeckView.ts');

    expect(gameSceneSource).toContain("const TURN_BALL_TEXTURE_KEY = 'turn-ball'");
    expect(gameSceneSource).toContain('const GOALKEEPER_SHOT_BALL_SIZE = 34');
    expect(gameSceneSource).toContain('const GOALKEEPER_SHOT_BALL_ARC_HEIGHT = 58');
    expect(gameSceneSource).toContain("type GoalkeeperShotAnimationOutcome = Extract<AttackAnimationOutcome, 'goal' | 'post' | 'save'>");
    expect(gameSceneSource).toContain('private playGoalkeeperShotBallFlight(');
    expect(gameSceneSource).toContain('outcome: GoalkeeperShotAnimationOutcome');
    expect(gameSceneSource).toContain('private animateBallFlightToGoalkeeper(options: {');
    expect(gameSceneSource).toContain('const ball = this.add.image(options.start.x, options.start.y, TURN_BALL_TEXTURE_KEY)');
    expect(gameSceneSource).toContain('ball.setDisplaySize(GOALKEEPER_SHOT_BALL_SIZE, GOALKEEPER_SHOT_BALL_SIZE)');
    expect(gameSceneSource).toContain('const flight = { progress: 0 }');
    expect(gameSceneSource).toContain('targets: flight');
    expect(gameSceneSource).toContain('progress: 1');
    expect(gameSceneSource).toContain('const arcLift = Math.sin(Math.PI * progress) * GOALKEEPER_SHOT_BALL_ARC_HEIGHT');
    expect(gameSceneSource).toContain('Phaser.Math.Linear(options.start.x, options.target.x, progress)');
    expect(gameSceneSource).toContain('Phaser.Math.Linear(options.start.y, options.target.y, progress) - arcLift');
    expect(gameSceneSource).toContain('ball.setAngle(rotationSign * 720 * progress)');
    expect(gameSceneSource).toContain('ball.setScale(baseScaleX * scale, baseScaleY * scale)');
    expect(gameSceneSource).toContain('private finishGoalkeeperShotBallImpact(');
    expect(gameSceneSource).toContain('this.showGoalkeeperShotTargetImpact(target, outcome)');
    expect(gameSceneSource).toContain('const exit = getGoalkeeperShotBallExit(target, outcome, activeOnLeft)');
    expect(gameSceneSource).toContain('ball.destroy();\n        onComplete();');
    expect(gameSceneSource).toContain('return getDeckTurnBallWorldPosition(getPlayerDeckX(state, playerId), DECK_Y, markerSide)');
    expect(gameSceneSource).not.toContain('this.playFailedMoveAnimation(state, context, target');
    expect(gameSceneSource).not.toContain('private playFailedMoveBallFlight(');
    expect(gameSceneSource).not.toContain('getFailedMoveBallDeflection');
    expect(deckSource).toContain('showActiveMarker?: boolean');
    expect(deckSource).toContain('if (options.active === true && options.showActiveMarker !== false)');
    expect(deckSource).toContain('export function getDeckTurnBallWorldPosition');
  });

  it('keeps a temporary source kick available before goalkeeper shot ball flight', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const sourceKickBlock = source.slice(
      source.indexOf('private playShotSourceKick('),
      source.indexOf('private animateBallFlightToGoalkeeper(')
    );

    expect(source).toContain('const SHOT_SOURCE_KICK_FORWARD_MS = 90');
    expect(source).toContain('const SHOT_SOURCE_KICK_RETURN_MS = 80');
    expect(source).toContain('const SHOT_SOURCE_KICK_DISTANCE = 16');
    expect(source).toContain('const SHOT_SOURCE_KICK_ROTATION = Phaser.Math.DegToRad(9)');
    expect(source).toContain('this.playShotSourceKick(state, context, start, () => {');
    expect(source).toContain('private playShotSourceKick(');
    expect(source).toContain('const sourceCard = new CardView(this, source.x, source.y, {');
    expect(source).toContain('const kickDirection = new Phaser.Math.Vector2(ballStart.x - source.x, ballStart.y - source.y)');
    expect(source).toContain('const kickRotation = (context.attackerId === state.players[0].id ? 1 : -1) * SHOT_SOURCE_KICK_ROTATION;');
    expect(source).toContain('this.tweens.chain({');
    expect(source).toContain('x: source.x + kickDirection.x * SHOT_SOURCE_KICK_DISTANCE');
    expect(source).toContain('y: source.y + kickDirection.y * SHOT_SOURCE_KICK_DISTANCE');
    expect(source).toContain('rotation: kickRotation');
    expect(source).toContain('x: source.x,\n          y: source.y,\n          rotation: 0');
    expect(source).not.toContain('SHOT_SOURCE_KICK_LIFT');
    expect(sourceKickBlock).not.toContain('yoyo: true');
    expect(sourceKickBlock).toContain('sourceCard.destroy();');
    expect(sourceKickBlock).toContain('onComplete();');
  });

  it('does not use source kick or temporary ball for ordinary failed move', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('const card = new CardView(this, startX, startY, {');
    expect(source).toContain("onComplete: () => this.finishAttackAnimation(state, context, card, target, outcome, onComplete)");
    expect(source).toContain("if (outcome === 'post' || outcome === 'save' || outcome === 'miss') {");
    expect(source).toContain('private finishAttackAnimationSequence(onComplete: () => void): void');
    expect(source).toContain('this.isAttackAnimationInProgress = false;\n    this.input.enabled = true;\n    onComplete();');
    expect(source).not.toContain("if (outcome === 'miss') {\n      this.render(state, {");
    expect(source).not.toContain('hideActiveTurnBall: true\n      });\n      this.playFailedMoveAnimation');
  });

  it('uses ball flight only for goalkeeper shot outcomes', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('if (isGoalkeeperShotAnimationOutcome(context, outcome)) {');
    expect(source).toContain(
      "this.render(state, {\n        hiddenRestoredCards,\n        interactive: false,\n        hideActiveTurnBall: true\n      });\n      this.playGoalkeeperShotBallFlight(state, context, target, outcome, () => this.finishAttackAnimationSequence(onComplete));"
    );
    expect(source).toContain('function isGoalkeeperShotAnimationOutcome(');
    expect(source).toContain("return context.positionId === 'goalkeeper' && (outcome === 'goal' || outcome === 'save' || outcome === 'post')");
    expect(source).toContain("state.log.slice(-4).some((event) => event.type === 'ATTACK_MISSED') ? 'miss' : 'defeat'");
    expect(source).toContain("if (outcome === 'post' || outcome === 'save' || outcome === 'miss') {");
    expect(source).toContain('this.playGoalkeeperImpactSound(\'goalkeeper\', outcome);');
  });

  it('defers restored field cards until goalkeeper shot and outcome visuals complete', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('const pendingRestores = this.getPendingRestoreAnimationEntries(state);');
    expect(source).toContain('const hiddenRestoredCards = options.hiddenRestoredCards ?? (interactive ? pendingRestores : undefined);');
    expect(source).toContain('hiddenCards: hiddenRestoredCards');
    expect(source).toContain(
      'if (interactive && pendingRestores.length > 0) {\n      this.isRestoreAnimationInProgress = true;\n      this.animateRestoredCards(state, pendingRestores);\n      return;\n    }'
    );
    expect(source).toContain('const hiddenRestoredCards = this.getPendingRestoreAnimationEntries(state);');
    expect(source).toContain('this.render(state, { hiddenRestoredCards, interactive: false });');
    expect(source).not.toContain('this.render(state, {\n        hiddenRestoredCards: pendingRestores,\n        interactive: false\n      });');
  });

  it('animates goalkeeper impact card for goal shot outcome', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('defenderCard: FieldCard');
    expect(source).toContain('defenderCardColor: Player[\'teamColor\'] | Card[\'color\']');
    expect(source).toContain('const goalkeeperImpactCard = this.createGoalkeeperShotImpactCard(context, target, outcome);');
    expect(source).toContain(
      'const start = this.getTurnBallStartPosition(state, context.attackerId);\n    const goalkeeperImpactCard = this.createGoalkeeperShotImpactCard(context, target, outcome);\n\n    this.playShotSourceKick'
    );
    expect(source).toContain('private createGoalkeeperShotImpactCard(');
    expect(source).toContain("if (outcome === 'post') {\n      return null;\n    }");
    expect(source).toContain('rank: context.defenderCard.rank');
    expect(source).toContain("label: 'GK'");
    expect(source).toContain('tooltipEnabled: false');
    expect(source).toContain('this.animateGoalkeeperShotImpactCard(goalkeeperImpactCard, outcome, activeOnLeft);');
    expect(source).toContain('private animateGoalkeeperShotImpactCard(');
    expect(source).toContain('x: card.x + (activeOnLeft ? 8 : -8)');
    expect(source).toContain('onComplete: () => card.destroy()');
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOAL_SCORED'))");
  });

  it('animates goalkeeper save as a catch pulse and sends ball toward defending deck', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain("if (outcome === 'save') {\n      this.tweens.add({");
    expect(source).toContain('scale: 1.1');
    expect(source).toContain('duration: GOALKEEPER_SHOT_BALL_OUTCOME_MS / 2');
    expect(source).toContain('yoyo: true');
    expect(source).toContain("if (outcome === 'save') {\n    return {\n      x: activeOnLeft ? 1485 : 115,\n      y: DECK_Y\n    };\n  }");
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOALKEEPER_SAVE'))");
  });

  it('animates post outcome as a bounce back toward the attacking deck', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain("if (outcome === 'post') {\n      this.animateGoalkeeperShotPostReturn(ball, target, activeOnLeft, baseScaleX, baseScaleY, onComplete);");
    expect(source).toContain('private animateGoalkeeperShotPostReturn(');
    expect(source).toContain('x: target.x + (activeOnLeft ? 86 : -86)');
    expect(source).toContain('y: target.y - 112');
    expect(source).toContain("const returnTarget = getGoalkeeperShotBallExit(target, 'post', activeOnLeft)");
    expect(source).toContain('x: activeOnLeft ? 115 : 1485');
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOALPOST_HIT'))");
  });
});

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
    expect(source).toContain('syncDeckTurnBallMarker(scene, x, y, markerSide)');
    expect(source).toContain('const activeDeckMarkers = new WeakMap<Phaser.Scene, ActiveDeckMarkerState>()');
    expect(source).toContain('export function syncDeckTurnBallMarker(');
    expect(source).toContain('export function clearDeckTurnBallMarker(scene: Phaser.Scene): void');
    expect(source).toContain('if (activeMarker !== undefined && activeMarker.stopped === false && activeMarker.markerSide === markerSide) {');
    expect(source).toContain('activeMarker.baseX = markerBase.x');
    expect(source).toContain('activeMarker.baseY = markerBase.y');
    expect(source).toContain('applyDeckTurnBallMarkerState(activeMarker)');
    expect(source).toContain('return;');
    expect(source).toContain('clearDeckTurnBallMarker(scene);');
    expect(source).toContain("const deckEdgeX = markerSide === 'right' ? DECK_WIDTH * DECK_STACK_SCALE / 2 : -DECK_WIDTH * DECK_STACK_SCALE / 2");
    expect(source).toContain('const deckBottomY = DECK_HEIGHT * DECK_STACK_SCALE / 2');
    expect(source).toContain('deckEdgeX + DECK_MARKER_SIZE * DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO');
    expect(source).toContain('deckEdgeX - DECK_MARKER_SIZE * DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO');
    expect(source).toContain('const markerBaseY = deckBottomY - DECK_MARKER_SIZE / 2');
    expect(source).toContain("const marker = scene.add.image(markerBase.x, markerBase.y, 'turn-ball')");
    expect(source).toContain('scene.tweens.chain');
    expect(source).toContain('targets: markerState');
    expect(source).toContain('offsetY: -DECK_MARKER_BOUNCE_HEIGHT');
    expect(source).toContain('onUpdate: () => applyDeckTurnBallMarkerState(markerState)');
    expect(source).toContain("ease: 'Quad.easeOut'");
    expect(source).toContain("ease: 'Quad.easeIn'");
    expect(source).toContain('scaleX: markerState.baseScaleX * 1.08');
    expect(source).toContain('scaleY: markerState.baseScaleY * 0.92');
    expect(source).toContain('markerState.tween.stop()');
    expect(source).toContain('Phaser.Scenes.Events.SHUTDOWN');
    expect(source).not.toContain("ease: 'Sine.easeInOut'");
    expect(source).not.toContain('repeat: -1');
  });

  it('clears the active deck ball when goalkeeper shot hides the turn marker', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain("import { clearDeckTurnBallMarker, DeckView, getDeckTurnBallWorldPosition } from '../ui/DeckView'");
    expect(source).toContain(
      'if (options.hideActiveTurnBall === true) {\n      clearDeckTurnBallMarker(this);\n    }'
    );
  });

  it('positions the active deck ball beside the active deck with one-third horizontal overlap', () => {
    const deckSource = readSource('src/ui/DeckView.ts');
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const matchCardScaleSource = readSource('src/ui/matchCardScale.ts');

    expect(gameSceneSource).toContain("state.players[0],\n        'right',");
    expect(gameSceneSource).toContain("state.players[1],\n        'left',");

    const markerSizeMatch = deckSource.match(/const DECK_MARKER_SIZE = (\d+);/);
    const bounceHeightMatch = deckSource.match(/export const DECK_MARKER_BOUNCE_HEIGHT = (\d+);/);
    const matchCardScaleMatch = matchCardScaleSource.match(/export const MATCH_CARD_SCALE = ([\d.]+);/);

    expect(deckSource).toContain('const DECK_WIDTH = CARD_WIDTH');
    expect(deckSource).toContain("import { MATCH_CARD_SCALE } from './matchCardScale'");
    expect(deckSource).toContain('const DECK_STACK_SCALE = MATCH_CARD_SCALE');
    expect(markerSizeMatch).not.toBeNull();
    expect(bounceHeightMatch).not.toBeNull();
    expect(matchCardScaleMatch).not.toBeNull();

    const matchCardScale = Number(matchCardScaleMatch![1]);
    const markerSize = Number(markerSizeMatch![1]);
    const bounceHeight = Number(bounceHeightMatch![1]);
    const markerOverlap = markerSize * (1 / 3);
    const markerOutsideCenterOffset = markerSize * (1 / 2 - 1 / 3);

    expect(matchCardScale).toBe(1.12);
    expect(markerSize).toBe(42);
    expect(bounceHeight).toBe(20);
    expect(markerOverlap).toBeCloseTo(14, 2);
    expect(markerOutsideCenterOffset).toBeCloseTo(7, 2);
    expect(deckSource).toContain("markerSide === 'right'");
    expect(deckSource).toContain('deckEdgeX + DECK_MARKER_SIZE * DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO');
    expect(deckSource).toContain('deckEdgeX - DECK_MARKER_SIZE * DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO');
    expect(deckSource).toContain('const markerBaseY = deckBottomY - DECK_MARKER_SIZE / 2');
    expect(deckSource).not.toContain("scene.add.image(0, -DECK_HEIGHT * DECK_STACK_SCALE / 2 - 30, 'turn-ball')");
  });

  it('shows the deck count below a slightly enlarged deck stack', () => {
    const source = readSource('src/ui/DeckView.ts');

    expect(source).toContain('const DECK_STACK_SCALE = MATCH_CARD_SCALE');
    expect(source).toContain('const DECK_COUNT_OFFSET_Y = DECK_HEIGHT * DECK_STACK_SCALE / 2 + 32');
    expect(source).toContain('const deckStack = scene.add.container(0, 0)');
    expect(source).toContain('deckStack.add([back, frontBackground, cover, frontBorder])');
    expect(source).toContain('.text(0, DECK_COUNT_OFFSET_Y, `${count}`');
    expect(source).toContain('deckStack.setScale(DECK_STACK_SCALE)');
    expect(source).toContain('this.add([deckStack, countText])');
    expect(source).toContain('DECK_WIDTH * DECK_STACK_SCALE + 24');
    expect(source).not.toContain("options.countSide === 'left' ? -84 : 84");
  });

  it('uses the same match card scale for field cards and deck cards', () => {
    const fieldSource = readSource('src/ui/FieldView.ts');
    const deckSource = readSource('src/ui/DeckView.ts');
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const matchCardScaleSource = readSource('src/ui/matchCardScale.ts');

    expect(matchCardScaleSource).toContain('export const MATCH_CARD_SCALE = 1.12');
    expect(fieldSource).toContain("import { MATCH_CARD_SCALE } from './matchCardScale'");
    expect(fieldSource).toContain('cardView.setScale(MATCH_CARD_SCALE)');
    expect(fieldSource).toContain('CARD_WIDTH * MATCH_CARD_SCALE');
    expect(fieldSource).toContain('CARD_HEIGHT * MATCH_CARD_SCALE');
    expect(deckSource).toContain("import { MATCH_CARD_SCALE } from './matchCardScale'");
    expect(deckSource).toContain('const DECK_STACK_SCALE = MATCH_CARD_SCALE');
    expect(deckSource).toContain('deckStack.setScale(DECK_STACK_SCALE)');
    expect(gameSceneSource).toContain("import { MATCH_CARD_SCALE } from '../ui/matchCardScale'");
    expect(gameSceneSource).toContain('card.setScale(MATCH_CARD_SCALE * 0.92)');
    expect(gameSceneSource).toContain('scale: MATCH_CARD_SCALE * 1.04');
    expect(gameSceneSource).toContain('scale: MATCH_CARD_SCALE * 1.12');
    expect(gameSceneSource).toContain('scale: MATCH_CARD_SCALE');
  });

  it('keeps enlarged midfield cards separated with symmetric field offsets', () => {
    const fieldSource = readSource('src/ui/FieldView.ts');
    const matchCardScaleSource = readSource('src/ui/matchCardScale.ts');

    const matchCardScale = Number(matchCardScaleSource.match(/export const MATCH_CARD_SCALE = ([\d.]+);/)?.[1]);
    const fieldViewHeight = Number(fieldSource.match(/export const FIELD_VIEW_HEIGHT = (\d+);/)?.[1]);
    const midfieldOffset = Number(fieldSource.match(/const MIDFIELDER_Y_OFFSET = (\d+);/)?.[1]);
    const defenderOffset = Number(fieldSource.match(/const DEFENDER_Y_OFFSET = (\d+);/)?.[1]);
    const scaledCardHeight = 148.5 * matchCardScale;

    expect(matchCardScale).toBe(1.12);
    expect(fieldViewHeight).toBe(600);
    expect(midfieldOffset).toBe(185);
    expect(defenderOffset).toBe(115);
    expect(midfieldOffset - scaledCardHeight).toBeGreaterThan(16);
    expect(fieldViewHeight / 2 - (midfieldOffset + scaledCardHeight / 2)).toBeGreaterThan(30);
    expect(fieldSource).toContain("{ positionId: 'midfielder-1', x: -MIDFIELDER_X_OFFSET, y: -MIDFIELDER_Y_OFFSET }");
    expect(fieldSource).toContain("{ positionId: 'midfielder-2', x: -MIDFIELDER_X_OFFSET, y: 0 }");
    expect(fieldSource).toContain("{ positionId: 'midfielder-3', x: -MIDFIELDER_X_OFFSET, y: MIDFIELDER_Y_OFFSET }");
    expect(fieldSource).toContain("{ positionId: 'midfielder-1', x: MIDFIELDER_X_OFFSET, y: -MIDFIELDER_Y_OFFSET }");
    expect(fieldSource).toContain("{ positionId: 'midfielder-2', x: MIDFIELDER_X_OFFSET, y: 0 }");
    expect(fieldSource).toContain("{ positionId: 'midfielder-3', x: MIDFIELDER_X_OFFSET, y: MIDFIELDER_Y_OFFSET }");
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
    expect(scoreSource).toContain("import { px, SHARP_TEXT_RESOLUTION } from './textRendering'");
    expect(scoreSource).toContain('getTeamScoreboardCode(playerOneFlagCode)');
    expect(scoreSource).toContain('getTeamScoreboardCode(playerTwoFlagCode)');
    expect(scoreSource).toContain('fontFamily: SCORE_VIEW_FONT_FAMILY');
    expect(scoreSource.match(/fontFamily: SCORE_VIEW_FONT_FAMILY/g)?.length).toBeGreaterThanOrEqual(5);
    expect(scoreSource.match(/resolution: SHARP_TEXT_RESOLUTION/g)?.length).toBeGreaterThanOrEqual(5);
    expect(scoreSource).toContain('super(scene, px(x), px(y))');
    expect(scoreSource).not.toContain('.setScale(');
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
    expect(source).toContain('this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);');
    expect(source).toContain("state.log.slice(-4).some((event) => event.type === 'ATTACK_MISSED') ? 'miss' : 'defeat'");
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOALPOST_HIT'))");
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOALKEEPER_SAVE'))");
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOAL_SCORED'))");
    expect(source).not.toContain("if (outcome === 'miss') {\n      this.render(state, {");
    expect(source).not.toContain('this.playFailedMoveAnimation(state, context, target');
  });

  it('hides the deck source card for successful and failed attack flight', () => {
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const deckSource = readSource('src/ui/DeckView.ts');
    const animationBlock = gameSceneSource.slice(
      gameSceneSource.indexOf('private animateAttackSelection('),
      gameSceneSource.indexOf('private finishAttackAnimation(')
    );

    expect(deckSource).toContain('attackCardSourcePlayerId?: string');
    expect(deckSource).toContain("attackCard.setData('attackDeckSourcePlayerId', options.attackCardSourcePlayerId)");
    expect(gameSceneSource).toContain("attackCardSourcePlayerId: isActive && state.attackCard !== null ? player.id : undefined");
    expect(animationBlock).toContain(
      "if (outcome === 'defeat' || (outcome === 'miss' && context.sourcePositionId === undefined)) {\n      this.hideAttackAnimationSource(context);\n    }"
    );
    expect(gameSceneSource).toContain("return cardView.getData('attackDeckSourcePlayerId') === context.attackerId");
    expect(animationBlock).not.toContain("if (outcome === 'miss') {\n      this.hideAttackAnimationSource(context);");
    expect(animationBlock).not.toContain("outcome === 'miss' || outcome === 'defeat'");
  });

  it('hides a committed midfielder source card only during successful attack flight', () => {
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const fieldSource = readSource('src/ui/FieldView.ts');

    expect(gameSceneSource).toContain('sourcePositionId?: MidfielderPositionId');
    expect(gameSceneSource).toContain('sourcePositionId: positionId');
    expect(gameSceneSource).toContain("state.currentAttackCardSource === 'MIDFIELDER'");
    expect(fieldSource).toContain("cardView.setData('fieldSourcePlayerId', player.id)");
    expect(fieldSource).toContain("cardView.setData('fieldSourcePositionId', position.positionId)");
    expect(gameSceneSource).toContain("cardView.getData('fieldSourcePlayerId') === context.attackerId");
    expect(gameSceneSource).toContain("cardView.getData('fieldSourcePositionId') === context.sourcePositionId");
  });

  it('cleans hidden source visuals through normal render instead of persistent game state', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('private hideAttackAnimationSource(context: AttackAnimationContext): void');
    expect(source).toContain('sourceView?.setVisible(false);');
    expect(source).toContain('private findAttackAnimationSourceView(context: AttackAnimationContext): CardView | null');
    expect(source).toContain('function findCardView(');
    expect(source).toContain('child instanceof CardView && predicate(child)');
    expect(source).not.toContain('hiddenAnimatingSourceCards');
    expect(source).not.toContain('hiddenAnimatingSourceSlots');
  });

  it('prepares a turn-ball based helper for goalkeeper shot outcomes without wiring it to failed moves', () => {
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const deckSource = readSource('src/ui/DeckView.ts');

    expect(gameSceneSource).toContain("const TURN_BALL_TEXTURE_KEY = 'turn-ball'");
    expect(gameSceneSource).toContain('const GOALKEEPER_SHOT_BALL_SIZE = 42');
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
    expect(source).toContain('const GOALKEEPER_SHOT_SOURCE_SNAPSHOT_DEPTH = 840');
    expect(source).toContain('const sourceSnapshot = this.createGoalkeeperShotSourceSnapshot(state, context);');
    expect(source).toContain('this.playShotSourceKick(state, context, sourceSnapshot, start, () => {');
    expect(source).toContain('private playShotSourceKick(');
    expect(source).toContain('private createGoalkeeperShotSourceSnapshot(');
    expect(source).toContain('const sourceSnapshot = new CardView(this, sourceTransform.x, sourceTransform.y, {');
    expect(source).toContain('sourceSnapshot.setDepth(GOALKEEPER_SHOT_SOURCE_SNAPSHOT_DEPTH);');
    expect(source).toContain('const kickDirection = new Phaser.Math.Vector2(ballStart.x - source.x, ballStart.y - source.y)');
    expect(source).toContain('const kickRotation = (context.attackerId === state.players[0].id ? 1 : -1) * SHOT_SOURCE_KICK_ROTATION;');
    expect(source).toContain('this.tweens.chain({');
    expect(source).toContain('targets: sourceSnapshot');
    expect(source).toContain('x: source.x + kickDirection.x * SHOT_SOURCE_KICK_DISTANCE');
    expect(source).toContain('y: source.y + kickDirection.y * SHOT_SOURCE_KICK_DISTANCE');
    expect(source).toContain('rotation: kickRotation');
    expect(source).toContain('x: source.x,\n          y: source.y,\n          rotation: source.rotation');
    expect(source).not.toContain('SHOT_SOURCE_KICK_LIFT');
    expect(sourceKickBlock).not.toContain('yoyo: true');
    expect(sourceKickBlock).not.toContain('sourceSnapshot.destroy();');
    expect(sourceKickBlock).toContain('onComplete();');
  });

  it('copies the real source CardView scale into the goalkeeper shot source snapshot', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const transformBlock = source.slice(
      source.indexOf('private getGoalkeeperShotSourceTransform('),
      source.indexOf('private createGoalkeeperShotImpactCard(')
    );

    expect(source).toContain('interface CardVisualTransform');
    expect(transformBlock).toContain('const sourceView = this.findAttackAnimationSourceView(context);');
    expect(transformBlock).toContain('const transform = sourceView.getWorldTransformMatrix().decomposeMatrix();');
    expect(transformBlock).toContain('x: transform.translateX');
    expect(transformBlock).toContain('y: transform.translateY');
    expect(transformBlock).toContain('rotation: transform.rotation');
    expect(transformBlock).toContain('scaleX: transform.scaleX');
    expect(transformBlock).toContain('scaleY: transform.scaleY');
    expect(transformBlock).toContain('alpha: sourceView.alpha');
    expect(source).toContain('sourceSnapshot.setRotation(sourceTransform.rotation);');
    expect(source).toContain('sourceSnapshot.setScale(sourceTransform.scaleX, sourceTransform.scaleY);');
    expect(source).toContain('sourceSnapshot.setAlpha(sourceTransform.alpha);');
    expect(source).not.toContain('sourceSnapshot.setScale(0.92);');
  });

  it('returns the goalkeeper shot source snapshot to its original scale after kick', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const sourceKickBlock = source.slice(
      source.indexOf('private playShotSourceKick('),
      source.indexOf('private animateBallFlightToGoalkeeper(')
    );

    expect(sourceKickBlock).toContain('scaleX: sourceSnapshot.scaleX');
    expect(sourceKickBlock).toContain('scaleY: sourceSnapshot.scaleY');
    expect(sourceKickBlock).toContain('rotation: sourceSnapshot.rotation');
    expect(sourceKickBlock).toContain('rotation: source.rotation');
    expect(sourceKickBlock).toContain('scaleX: source.scaleX');
    expect(sourceKickBlock).toContain('scaleY: source.scaleY');
    expect(sourceKickBlock).not.toContain('scaleX: 0.92');
    expect(sourceKickBlock).not.toContain('scaleY: 0.92');
  });

  it('uses relative squash stretch for goalkeeper shot source kick scale', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const sourceKickBlock = source.slice(
      source.indexOf('private playShotSourceKick('),
      source.indexOf('private animateBallFlightToGoalkeeper(')
    );

    expect(sourceKickBlock).toContain('scaleX: source.scaleX * 1.04');
    expect(sourceKickBlock).toContain('scaleY: source.scaleY * 0.97');
    expect(sourceKickBlock).not.toContain('scaleX: 0.97');
    expect(sourceKickBlock).not.toContain('scaleY: 0.88');
  });

  it('keeps the goalkeeper shot source snapshot visible through goal animation', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const flightBlock = source.slice(
      source.indexOf('private playGoalkeeperShotBallFlight('),
      source.indexOf('private createGoalkeeperShotImpactCard(')
    );
    const impactBlock = source.slice(
      source.indexOf('private finishGoalkeeperShotBallImpact('),
      source.indexOf('private animateGoalkeeperShotGoalDisappear(')
    );
    const goalBlock = source.slice(
      source.indexOf('private animateGoalkeeperShotGoalDisappear('),
      source.indexOf('private animateGoalkeeperShotSaveDeflection(')
    );

    expect(flightBlock).toContain('const sourceSnapshot = this.createGoalkeeperShotSourceSnapshot(state, context);');
    expect(flightBlock).toContain('sourceSnapshot,');
    expect(impactBlock).toContain("if (outcome === 'goal') {");
    expect(impactBlock).toContain('this.animateGoalkeeperShotGoalDisappear(');
    expect(goalBlock).toContain('goalkeeperImpactCard?.destroy();\n        onComplete();');
    expect(goalBlock).not.toContain('sourceSnapshot.destroy();');
  });

  it('keeps the goalkeeper shot source snapshot visible through save animation', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const impactBlock = source.slice(
      source.indexOf('private finishGoalkeeperShotBallImpact('),
      source.indexOf('private animateGoalkeeperShotGoalDisappear(')
    );
    const saveBlock = source.slice(
      source.indexOf('private animateGoalkeeperShotSaveDeflection('),
      source.indexOf('private animateGoalkeeperShotPostForwardDeflection(')
    );

    expect(impactBlock).toContain("if (outcome === 'save') {\n      this.animateGoalkeeperShotSaveDeflection(ball, target, activeOnLeft, baseScaleX, baseScaleY, onComplete);");
    expect(saveBlock).toContain('ball.destroy();\n        onComplete();');
    expect(saveBlock).not.toContain('sourceSnapshot.destroy();');
  });

  it('keeps the goalkeeper shot source snapshot visible through post animation', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const impactBlock = source.slice(
      source.indexOf('private finishGoalkeeperShotBallImpact('),
      source.indexOf('private animateGoalkeeperShotGoalDisappear(')
    );
    const postBlock = source.slice(
      source.indexOf('private animateGoalkeeperShotPostForwardDeflection('),
      source.indexOf('private animateGoalkeeperShotImpactCard(')
    );

    expect(impactBlock).toContain("if (outcome === 'post') {\n      this.animateGoalkeeperShotPostForwardDeflection(ball, target, activeOnLeft, baseScaleX, baseScaleY, onComplete);");
    expect(postBlock).toContain('ball.destroy();\n            onComplete();');
    expect(postBlock).not.toContain('sourceSnapshot.destroy();');
  });

  it('removes the goalkeeper shot source snapshot after outcome animation complete', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const flightBlock = source.slice(
      source.indexOf('private animateBallFlightToGoalkeeper(options: {'),
      source.indexOf('private finishGoalkeeperShotSourceSnapshot(')
    );
    const cleanupBlock = source.slice(
      source.indexOf('private finishGoalkeeperShotSourceSnapshot('),
      source.indexOf('private finishGoalkeeperShotBallImpact(')
    );

    expect(flightBlock).toContain('sourceSnapshot: CardView;');
    expect(flightBlock).toContain('() => this.finishGoalkeeperShotSourceSnapshot(options.sourceSnapshot, options.onComplete)');
    expect(cleanupBlock).toContain('sourceSnapshot.destroy();\n    onComplete();');
  });

  it('keeps goalkeeper shot source snapshot visuals out of GameEngine rules', () => {
    const engineSource = readSource('src/game/GameEngine.ts');

    expect(engineSource).not.toContain('GoalkeeperShotSourceSnapshot');
    expect(engineSource).not.toContain('sourceSnapshot');
    expect(engineSource).not.toContain('GOALKEEPER_SHOT_SOURCE_SNAPSHOT_DEPTH');
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
      'const start = this.getTurnBallStartPosition(state, context.attackerId);\n    const goalkeeperImpactCard = this.createGoalkeeperShotImpactCard(context, target, outcome);\n    const sourceSnapshot = this.createGoalkeeperShotSourceSnapshot(state, context);\n\n    this.playShotSourceKick'
    );
    expect(source).toContain('private createGoalkeeperShotImpactCard(');
    expect(source).toContain("if (outcome === 'post') {\n      return null;\n    }");
    expect(source).toContain('rank: context.defenderCard.rank');
    expect(source).toContain("label: 'GK'");
    expect(source).toContain('tooltipEnabled: false');
    expect(source).toContain('const GOALKEEPER_SHOT_GOAL_SPIN_DEGREES = 1080');
    expect(source).toContain("if (outcome === 'goal') {");
    expect(source).toContain('this.animateGoalkeeperShotGoalDisappear(');
    expect(source).toContain('private animateGoalkeeperShotGoalDisappear(');
    expect(source).toContain("const exit = getGoalkeeperShotBallExit(target, 'goal', activeOnLeft)");
    expect(source).toContain('angle: spin');
    expect(source).toContain('scale: 0.18');
    expect(source).toContain('angle: ball.angle + spin');
    expect(source).toContain('goalkeeperImpactCard?.destroy();');
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOAL_SCORED'))");
  });

  it('animates goalkeeper save as a catch pulse and side deflection', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain("if (outcome === 'save') {\n      this.tweens.add({");
    expect(source).toContain('scale: MATCH_CARD_SCALE * 1.1');
    expect(source).toContain('duration: GOALKEEPER_SHOT_BALL_OUTCOME_MS / 2');
    expect(source).toContain('yoyo: true');
    expect(source).toContain("if (outcome === 'save') {\n      this.animateGoalkeeperShotSaveDeflection(ball, target, activeOnLeft, baseScaleX, baseScaleY, onComplete);");
    expect(source).toContain('private animateGoalkeeperShotSaveDeflection(');
    expect(source).toContain('const deflection = getGoalkeeperShotSaveDeflection(target, activeOnLeft)');
    expect(source).toContain('x: target.x + (activeOnLeft ? -155 : 155)');
    expect(source).toContain('y: target.y + 104');
    expect(source).toContain('angle: ball.angle + rotationSign * 420');
    expect(source).not.toContain("if (outcome === 'save') {\n    return {\n      x: activeOnLeft ? 1485 : 115,\n      y: DECK_Y\n    };\n  }");
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOALKEEPER_SAVE'))");
  });

  it('rolls the goalkeeper rank on the same field card after a goalkeeper save', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain("type GoalkeeperRankChangedSceneEvent = Extract<GameEvent, { type: 'GOALKEEPER_RANK_CHANGED' }>");
    expect(source).toContain('const GOALKEEPER_RANK_ROLL_SEQUENCE');
    expect(source).toContain('const goalkeeperRankChange = getLastGoalkeeperRankChangedEvent(state.log);');
    expect(source).toContain('this.animateGoalkeeperRankChange(goalkeeperRankChange, () => this.startTurn());');
    expect(source).not.toContain("this.showFlyingMessage('Goalkeeper!!', 'save', () => this.startTurn())");
    expect(source).toContain("const goalkeeperView = this.findFieldCardView(event.playerId, 'goalkeeper');");
    expect(source).toContain('goalkeeperView.setDisplayRank(event.previousCard.rank);');
    expect(source).toContain('goalkeeperView\n      .animateDisplayRankRoll(event.nextCard.rank');
    expect(source).toContain('steps: getGoalkeeperRankRollSteps(event.previousCard.rank, event.nextCard.rank)');
    expect(source).toContain("cardView.getData('fieldSourcePlayerId') === playerId");
    expect(source).toContain("cardView.getData('fieldSourcePositionId') === positionId");
  });

  it('animates post outcome as a forward goalkeeper deflection with goalpost sound', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const eventEffectsSource = readSource('src/scenes/gameSceneEventEffects.ts');

    expect(source).toContain("if (outcome === 'post') {\n      this.animateGoalkeeperShotPostForwardDeflection(ball, target, activeOnLeft, baseScaleX, baseScaleY, onComplete);");
    expect(source).toContain('private animateGoalkeeperShotPostForwardDeflection(');
    expect(source).toContain('const deflection = getGoalkeeperShotPostForwardDeflection(target, activeOnLeft)');
    expect(source).toContain('x: target.x + (activeOnLeft ? -190 : 190)');
    expect(source).toContain('y: target.y - 64');
    expect(source).toContain('x: deflection.x + (activeOnLeft ? -88 : 88)');
    expect(source).toContain("case 'post':\n        this.playSound('sound-goalpost', 0.72);");
    expect(eventEffectsSource).toContain("flyingMessage: 'Post!'");
    expect(source).not.toContain('private animateGoalkeeperShotPostReturn(');
    expect(source).not.toContain("const returnTarget = getGoalkeeperShotBallExit(target, 'post', activeOnLeft)");
    expect(source).not.toContain('x: activeOnLeft ? 115 : 1485');
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOALPOST_HIT'))");
  });

  it('shows goalkeeper shot flying messages at the impact tick and enlarges GOAL!! only', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const impactBlock = source.slice(
      source.indexOf('private finishGoalkeeperShotBallImpact('),
      source.indexOf('private animateGoalkeeperShotGoalDisappear(')
    );

    expect(source).toContain("import { getGoalkeeperShotSceneEffect, getNextGoalScoredSceneEffect } from './gameSceneEventEffects'");
    expect(impactBlock).toContain('const shotEffect = getGoalkeeperShotSceneEffect(outcome);');
    expect(impactBlock).toContain('this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);');
    expect(impactBlock.indexOf('this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);')).toBeLessThan(
      impactBlock.indexOf('this.showGoalkeeperShotTargetImpact(target, outcome);')
    );
    expect(impactBlock.indexOf('this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);')).toBeLessThan(
      impactBlock.indexOf("this.playGoalkeeperImpactSound('goalkeeper', outcome);")
    );
    expect(source).toContain("const fontSize = tone === 'goal' ? '88px' : tone === 'post' || tone === 'save' ? '48px' : '38px';");
    expect(source).toContain("const isShotOutcomeTone = tone === 'goal' || tone === 'post' || tone === 'save';");
    expect(source).toContain('const FLYING_MESSAGE_DEPTH = 3000;');
    expect(source).toContain('.setDepth(FLYING_MESSAGE_DEPTH);');
    expect(source).toContain('const popDuration = isShotOutcomeTone ? 220 : 0;');
    expect(source).toContain('const fadeDelay = isShotOutcomeTone ? 520 : 0;');
    expect(source).toContain('const fadeDuration = isShotOutcomeTone ? 1900 : 900;');
    expect(source).toContain('const startFadeTween = (): void => {');
    expect(source).toContain('text.setScale(0.82);');
    expect(source).toContain('scale: 1.08,');
    expect(source).toContain("ease: 'Back.easeOut'");
    expect(source).toContain('delay: fadeDelay,');
    expect(source).toContain('duration: fadeDuration,');
  });
});

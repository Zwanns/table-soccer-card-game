import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function normalizeSourceLineEndings(source: string): string {
  return source.replace(/\r\n/g, '\n');
}

function readSource(relativePath: string): string {
  return normalizeSourceLineEndings(readFileSync(join(process.cwd(), relativePath), 'utf8'));
}

function readConstNumber(source: string, constName: string, key: string): number {
  const blockMatch = source.match(new RegExp(`const ${constName} = \\{([\\s\\S]*?)\\} as const;`));
  expect(blockMatch).not.toBeNull();

  const valueMatch = blockMatch![1].match(new RegExp(`${key}: (-?\\d+)`));
  expect(valueMatch).not.toBeNull();

  return Number(valueMatch![1]);
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
    const dimensionsSource = readSource('src/ui/fieldDimensions.ts');
    const matchCardScaleSource = readSource('src/ui/matchCardScale.ts');

    const matchCardScale = Number(matchCardScaleSource.match(/export const MATCH_CARD_SCALE = ([\d.]+);/)?.[1]);
    const fieldViewHeight = Number(dimensionsSource.match(/export const FIELD_VIEW_HEIGHT = (\d+);/)?.[1]);
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
    const controlsSource = readSource('src/ui/matchControlButtons.ts');

    expect(source).toContain('const matchControls = createMatchControlButtons({');
    expect(source).toContain('onPause: () => this.openPauseModal(state)');
    expect(controlsSource).toContain("export const MATCH_CONTROL_BUTTON_FONT_SIZE = '28px'");
    expect(controlsSource).toContain('export const MATCH_CONTROL_BUTTON_HEIGHT = 86');
    expect(controlsSource).toContain('export const MATCH_CONTROL_BUTTON_WIDTH = Math.min');
    expect(controlsSource).toContain('MATCH_CONTROL_BUTTON_LEFT_X');
    expect(controlsSource).toContain("config.labels?.pause ?? 'Pause'");
    expect(source).not.toContain("'Menu', () => this.openExitConfirmModal()");
    expect(source).not.toContain("'Result',\n        () => this.openResult(state)");
    expect(source).not.toContain("new Button(this, 120, 34, 'Menu'");
    expect(source).not.toContain("new Button(this, 120, 90, 'Result'");
  });

  it('keeps one tall Rules button on the right side of the match UI', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const controlsSource = readSource('src/ui/matchControlButtons.ts');

    expect(source).toContain("onRules: () => this.openMatchInfoModal('rules')");
    expect(controlsSource).toContain('MATCH_CONTROL_BUTTON_RIGHT_X');
    expect(controlsSource).toContain("config.labels?.rules ?? 'Rules'");
    expect(controlsSource).toContain('height: MATCH_CONTROL_BUTTON_HEIGHT');
    expect(controlsSource).toContain('fontSize: MATCH_CONTROL_BUTTON_FONT_SIZE');
    expect(controlsSource).toContain('width: MATCH_CONTROL_BUTTON_WIDTH');
    expect(source).not.toContain("() => this.openMatchInfoModal('about')");
    expect(source).not.toContain("this.scene.start('MenuScene', { mode: 'rules' })");
    expect(source).not.toContain("this.scene.start('MenuScene', { mode: 'about' })");
  });

  it('opens a Pause overlay with Sim, Continue and Exit to Menu actions', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const overlaySource = readSource('src/ui/matchPauseOverlay.ts');

    expect(source).toContain('private pauseModal: Phaser.GameObjects.Container | null = null');
    expect(source).toContain('private openPauseModal(state: Readonly<GameState>): void');
    expect(source).toContain('this.pauseModal = createMatchPauseOverlay(this, [');
    expect(source).toContain("{ label: 'Continue', onClick: () => this.closePauseModal() }");
    expect(source).toContain("label: 'Exit to Menu'");
    expect(source).toContain('this.openExitConfirmModal()');
    expect(source).toContain("label: 'Sim'");
    expect(source).toContain('this.simulatePausedMatch(state)');
    expect(source).toContain('private simulatePausedMatch(state: Readonly<GameState>): void');
    expect(source).toContain('submitSimulatedTournamentMatch(tournament, match, homeTeam, awayTeam)');
    expect(source).toContain("this.scene.start('TournamentCompleteScene')");
    expect(source).toContain("this.scene.start('TournamentHubScene', { initialTab: 'matches' })");
    const pauseBlock = source.slice(source.indexOf('private openPauseModal('), source.indexOf('private closePauseModal('));
    expect(pauseBlock).not.toContain("label: 'About'");
    expect(pauseBlock).not.toContain("this.openMatchInfoModal('about')");
    expect(source).toContain('], { state });');
    expect(source).toContain('private closePauseModal(options: { resumeAutomaticCardFlow?: boolean } = {}): void');
    expect(source).toContain('this.pauseModal === null');
    expect(overlaySource).toContain('setDepth(MATCH_OVERLAY_DEPTH)');
    expect(overlaySource).toContain('overlay.setInteractive()');
    expect(overlaySource).not.toContain(".text(0, titleY, 'Pause'");
    expect(overlaySource).not.toContain("fontSize: '34px'");
    expect(overlaySource).toContain('MATCH_STATS_PANEL_CENTER_Y');
    expect(overlaySource).toContain("import { createResultActionButtons } from './resultActionButtons'");
    expect(overlaySource).toContain('const buttons = createResultActionButtons(scene, centerX, actions);');
  });

  it('shows a referee match-finished modal before results for card-depletion game over states', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const helperSource = readSource('src/ui/matchFinishedModal.ts');

    expect(source).toContain("import { createMatchFinishedModal } from '../ui/matchFinishedModal'");
    expect(helperSource).toContain('export const MATCH_FINISHED_MODAL = {');
    expect(source).toContain('private matchFinishedModal: Phaser.GameObjects.Container | null = null');
    expect(source).toContain('private isMatchFinishedModalOpen = false');
    expect(source).toContain('private isMatchFinishedOkHandled = false');
    expect(source).toContain('private matchFinishedWhistlePlayed = false');
    expect(source).toContain('private shouldShowMatchFinishedModal(state: Readonly<GameState>): boolean');
    expect(source).toContain(
      "state.phase === 'GAME_OVER' &&\n      state.players.some((player) => player.deck.cards.length === 0 || player.goalkeeperDeck.getSize() === 0)"
    );
    expect(source).toContain('if (this.shouldShowMatchFinishedModal(state)) {\n      this.showMatchFinishedModal(state);\n      return;\n    }');
    expect(source).toContain('private showMatchFinishedModal(state: Readonly<GameState>): void');
  });

  it('builds the match-finished modal as a centered overlay with referee art and OK action', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const helperSource = readSource('src/ui/matchFinishedModal.ts');
    const modalBlock = source.slice(
      source.indexOf('private showMatchFinishedModal('),
      source.indexOf('private getMatchFinishedBodyText(')
    );

    expect(modalBlock).toContain('this.cancelAutomaticCardFlow();');
    expect(modalBlock).toContain('this.aiTurnController?.dispose();');
    expect(modalBlock).toContain('this.matchFinishedModal = createMatchFinishedModal(this');
    expect(modalBlock).toContain('centerX: SCENE_WIDTH / 2');
    expect(modalBlock).toContain('centerY: SCENE_HEIGHT / 2');
    expect(modalBlock).toContain('overlayWidth: SCENE_WIDTH');
    expect(modalBlock).toContain('overlayHeight: SCENE_HEIGHT');
    expect(modalBlock).toContain('bodyText: this.getMatchFinishedBodyText(state)');
    expect(modalBlock).toContain('onOk: () => this.confirmMatchFinishedModal(state)');
    expect(helperSource).toContain('const overlay = scene.add.rectangle(');
    expect(helperSource).toContain('overlay.setInteractive();');
    expect(helperSource).toContain('SCOREBOARD_BACKGROUND_COLOR');
    expect(helperSource).toContain('SCOREBOARD_BACKGROUND_ALPHA');
    expect(modalBlock).not.toContain('fillRoundedRect(');
    expect(modalBlock).not.toContain('strokeRoundedRect(');
    expect(modalBlock).not.toContain('0xf0c95a');
    expect(helperSource).toContain('const refereeVisual = createMatchFinishedRefereeVisual(scene);');
    expect(helperSource).toContain("'Final whistle'");
    expect(helperSource).toContain("'OK'");
    expect(helperSource).toContain('borderWidth: 0');
    expect(helperSource).toContain('borderRadius: 8');
  });

  it('builds match-finished body text from the team with an empty attack deck', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const bodyBlock = source.slice(
      source.indexOf('private getMatchFinishedBodyText('),
      source.indexOf('private playMatchFinishedWhistleOnce()')
    );

    expect(bodyBlock).toContain('const exhaustedPlayer = state.players.find((player) => player.deck.cards.length === 0);');
    expect(bodyBlock).toContain('const exhaustedTeamName = exhaustedPlayer?.name.trim();');
    expect(bodyBlock).toContain("'The match is over because one side has no cards left to attack.'");
    expect(bodyBlock).toContain('return `The match is over because ${exhaustedTeamName} has no cards left to attack.`;');
    expect(bodyBlock).not.toContain('flagCode');
    expect(bodyBlock).not.toContain('getTeamScoreboardCode');
  });

  it('uses the referee image when loaded and falls back safely when missing', () => {
    const visualBlock = readSource('src/ui/matchFinishedModal.ts');

    expect(visualBlock).toContain("if (!scene.textures.exists('arbitr-end'))");
    expect(visualBlock).toContain('placeholder.fillRoundedRect(');
    expect(visualBlock).toContain("const image = scene.add.image(0, MATCH_FINISHED_MODAL.imageY, 'arbitr-end');");
    expect(visualBlock).toContain("const source = scene.textures.get('arbitr-end').getSourceImage() as { width: number; height: number };");
    expect(visualBlock).toContain('const scale = Math.min(');
    expect(visualBlock).toContain('image.setDisplaySize(source.width * scale, source.height * scale);');
  });

  it('enlarges the match-finished referee image and lets it overflow above the panel safely', () => {
    const source = readSource('src/ui/matchFinishedModal.ts');
    const modalWidth = readConstNumber(source, 'MATCH_FINISHED_MODAL', 'width');
    const modalHeight = readConstNumber(source, 'MATCH_FINISHED_MODAL', 'height');
    const imageWidth = readConstNumber(source, 'MATCH_FINISHED_MODAL', 'imageWidth');
    const imageHeight = readConstNumber(source, 'MATCH_FINISHED_MODAL', 'imageHeight');
    const imageY = readConstNumber(source, 'MATCH_FINISHED_MODAL', 'imageY');
    const titleY = readConstNumber(source, 'MATCH_FINISHED_MODAL', 'titleY');
    const bodyY = readConstNumber(source, 'MATCH_FINISHED_MODAL', 'bodyY');
    const buttonY = readConstNumber(source, 'MATCH_FINISHED_MODAL', 'buttonY');
    const buttonHeight = readConstNumber(source, 'MATCH_FINISHED_MODAL', 'buttonHeight');

    expect(imageWidth).toBe(300);
    expect(imageHeight).toBe(250);
    expect(imageWidth).toBeGreaterThan(180);
    expect(imageHeight).toBeGreaterThan(150);
    expect(imageY - imageHeight / 2).toBeLessThan(-modalHeight / 2);
    expect(imageY + imageHeight / 2).toBeLessThan(titleY);
    expect(titleY).toBeLessThan(bodyY);
    expect(bodyY).toBeLessThan(buttonY);
    expect(buttonY + buttonHeight / 2).toBeLessThanOrEqual(modalHeight / 2);
    expect(imageWidth).toBeLessThan(modalWidth);
  });

  it('plays the final whistle once on modal appearance and suppresses the ResultScene duplicate', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('private playMatchFinishedWhistleOnce(): void');
    expect(source).toContain('if (this.matchFinishedWhistlePlayed) {\n      return;\n    }');
    expect(source).toContain("this.playSound('sound-whistle-finish', 0.68);");
    expect(source).toContain('this.openResultScene(state, true);');
    expect(source).toContain("this.scene.start('ResultScene', { state, launchContext: this.launchContext, suppressFinalWhistle });");
  });

  it('waits for OK before opening results and guards against duplicate OK transitions', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const confirmBlock = source.slice(
      source.indexOf('private confirmMatchFinishedModal('),
      source.indexOf('private prepareToLeaveMatchScene()')
    );

    expect(confirmBlock).toContain('if (this.isMatchFinishedOkHandled || this.isNavigationAwayInProgress || this.isSceneShutDown) {');
    expect(confirmBlock).toContain('this.isMatchFinishedOkHandled = true;');
    expect(confirmBlock).toContain('this.isMatchFinishedModalOpen = false;');
    expect(confirmBlock).toContain('this.matchFinishedModal?.destroy();');
    expect(confirmBlock).toContain('this.openResultScene(state, true);');
    expect(source.indexOf('private showMatchFinishedModal(')).toBeLessThan(source.indexOf('private confirmMatchFinishedModal('));
  });

  it('keeps pause-menu Sim on the direct result path without the referee modal', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const simulateBlock = source.slice(
      source.indexOf('private simulatePausedMatch('),
      source.indexOf('private executeAiAction(')
    );

    expect(simulateBlock).toContain('this.openResultScene(state);');
    expect(simulateBlock).not.toContain('this.openResult(state);');
    expect(simulateBlock).not.toContain('this.showMatchFinishedModal');
    expect(simulateBlock).toContain('submitSimulatedTournamentMatch(tournament, match, homeTeam, awayTeam)');
  });

  it('uses the result screen button row for Pause actions', () => {
    const source = readSource('src/ui/matchPauseOverlay.ts');
    const resultActionsSource = readSource('src/ui/resultActionButtons.ts');

    expect(source).toContain('createResultActionButtons(scene, centerX, actions)');
    expect(source).not.toContain('PAUSE_BUTTON_WIDTH');
    expect(source).not.toContain('PAUSE_BUTTON_HEIGHT');
    expect(source).not.toContain('PAUSE_BUTTON_GAP');
    expect(resultActionsSource).toContain('export const RESULT_ACTION_PANEL_WIDTH = 840');
    expect(resultActionsSource).toContain('export const RESULT_ACTION_BUTTON_HEIGHT = 68');
    expect(resultActionsSource).toContain("export const RESULT_ACTION_BUTTON_FONT_SIZE = '24px'");
    expect(resultActionsSource).toContain('export const RESULT_ACTION_BUTTON_RADIUS = 8');
  });

  it('shows current match statistics above the pause actions', () => {
    const overlaySource = readSource('src/ui/matchPauseOverlay.ts');
    const statsPanelSource = readSource('src/ui/MatchStatsPanel.ts');

    expect(overlaySource).toContain('export interface MatchPauseOverlayOptions');
    expect(overlaySource).toContain('state?: Readonly<GameState>');
    expect(overlaySource).toContain('new MatchStatsPanel(scene, centerX, MATCH_STATS_PANEL_CENTER_Y');
    expect(statsPanelSource).toContain('export class MatchStatsPanel extends Phaser.GameObjects.Container');
    expect(statsPanelSource).toContain("import { RESULT_ACTION_PANEL_WIDTH } from './resultActionButtons'");
    expect(statsPanelSource).toContain('export const MATCH_STATS_PANEL_WIDTH = RESULT_ACTION_PANEL_WIDTH');
    expect(statsPanelSource).toContain('export const MATCH_STATS_PANEL_HEIGHT = 500');
    expect(statsPanelSource).toContain('export const MATCH_STATS_PANEL_CENTER_Y = 360');
    expect(statsPanelSource).toContain('const [playerOneStats, playerTwoStats] = getMatchStats(options.state)');
    expect(statsPanelSource).toContain("['Goals', String(playerOneStats.goals), String(playerTwoStats.goals)]");
    expect(statsPanelSource).toContain("['Shots', String(playerOneStats.shots), String(playerTwoStats.shots)]");
    expect(statsPanelSource).toContain("['GK saves', String(playerOneStats.goalkeeperSaves), String(playerTwoStats.goalkeeperSaves)]");
    expect(statsPanelSource).toContain('formatGoalScorerLabel(scorer)');
    expect(statsPanelSource).toContain('getTeamScoreboardCode(options.playerOneFlagCode)');
    expect(statsPanelSource).toContain('getTeamScoreboardCode(options.playerTwoFlagCode)');
    expect(statsPanelSource).toContain('this.add(this.createScorersList(scene, -168, 92, playerOneScorers, columnWidth))');
    expect(statsPanelSource).toContain('this.add(this.createScorersList(scene, 168, 92, playerTwoScorers, columnWidth))');
    expect(statsPanelSource).toContain("align: 'center'");
    expect(statsPanelSource).toContain('.setOrigin(0.5, 0)');
    expect(statsPanelSource).toContain("return '-'");
  });

  it('keeps pause action hit areas tied to the shared result Button size', () => {
    const pauseSource = readSource('src/ui/matchPauseOverlay.ts');
    const actionsSource = readSource('src/ui/resultActionButtons.ts');
    const buttonSource = readSource('src/ui/Button.ts');

    expect(pauseSource).toContain('createResultActionButtons(scene, centerX, actions)');
    expect(actionsSource).toContain('fontSize: RESULT_ACTION_BUTTON_FONT_SIZE');
    expect(actionsSource).toContain('height: RESULT_ACTION_BUTTON_HEIGHT');
    expect(actionsSource).toContain('width: buttonWidth');
    expect(buttonSource).toContain('const width = options.width ?? 220');
    expect(buttonSource).toContain('const height = options.height ?? 54');
    expect(buttonSource).toContain('const background = scene.add.rectangle(0, 0, width, height');
    expect(buttonSource).toContain('this.setSize(width, height)');
    expect(buttonSource).toContain('this.setInteractive({ useHandCursor: true })');
    expect(buttonSource).not.toContain('hitArea');
  });

  it('keeps match info overlays localized, scrollable and non-resetting', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const rulesSource = readSource('src/ui/MatchRulesOverlay.ts');
    const menuSource = readSource('src/scenes/MenuScene.ts');

    expect(menuSource).toContain('export const ABOUT_LANGUAGES');
    expect(menuSource).toContain('export const ABOUT_CONTENT');
    expect(menuSource).toContain('export const RULES_CONTENT');
    expect(source).toContain("import { ABOUT_CONTENT, ABOUT_LANGUAGES, RULES_CONTENT, type AboutLanguage, type InfoModalKind } from './MenuScene'");
    expect(source).toContain('private infoModal: Phaser.GameObjects.Container | null = null');
    expect(source).toContain('private activeInfoModal: InfoModalKind | null = null');
    expect(source).toContain('private infoLanguage: AboutLanguage = getPreferredLanguage()');
    expect(source).toContain('setPreferredLanguage(language)');
    expect(source).toContain('return getLanguageCode(language)');
    expect(source).toContain('this.infoModal = createMatchRulesOverlay({');
    expect(rulesSource).toContain('scene.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72)');
    expect(rulesSource).toContain('overlay.setInteractive()');
    expect(rulesSource).toContain('getLanguageCode(language)');
    expect(source).toContain('const INFO_BACK_BUTTON = {');
    expect(source).toContain("return new Button(this, 0, INFO_BACK_BUTTON.y, 'Back', () => this.closeMatchInfoModal()");
    expect(source).toContain('height: 360');
    expect(source).not.toContain("'Close'");
    expect(source).not.toContain("text(0, -1, '<'");
    expect(source).toContain('const viewport = this.createMatchAboutViewport(aboutContent)');
    expect(rulesSource).toContain("scrollZone.on('wheel'");
    expect(source).toContain('this.infoModal === null');
    expect(source).toContain('this.pauseModal === null');
    expect(source).toContain("this.aiTurnController?.requestTurnCheck('STATE_RENDERED')");
    expect(source).not.toContain("openMatchInfoModal('rules') => this.scene.start");
    expect(source).not.toContain("openMatchInfoModal('about') => this.scene.start");
  });

  it('draws a striped grass pitch under the field markings', () => {
    const fieldSource = readSource('src/ui/FieldView.ts');
    const source = readSource('src/ui/MatchFieldView.ts');
    const dimensionsSource = readSource('src/ui/fieldDimensions.ts');

    expect(dimensionsSource).toContain('export const FIELD_VIEW_WIDTH = 1120');
    expect(dimensionsSource).toContain('export const FIELD_VIEW_HEIGHT = 600');
    expect(fieldSource).toContain('export class FieldView extends MatchFieldView');
    expect(fieldSource).toContain('super(scene, x, y)');
    expect(source).toContain('export const FIELD_GRASS_STRIPE_COUNT = 14');
    expect(source).toContain('export const FIELD_GRASS_BASE_COLOR = 0x157a43');
    expect(source).toContain('export const FIELD_GRASS_LIGHT_STRIPE_COLOR = 0x19864a');
    expect(source).toContain('export const FIELD_GRASS_DARK_STRIPE_COLOR = 0x126d3c');
    expect(source).toContain('this.createStripedPitch(scene, x, y)');
    expect(source).toContain('const grassLeft = -centerX');
    expect(source).toContain('const grassTop = -centerY');
    expect(source).toContain('const stripeWidth = FIELD_VIEW_WIDTH / FIELD_GRASS_STRIPE_COUNT');
    expect(source).toContain('const firstStripeIndex = Math.floor((grassLeft - pitchLeft) / stripeWidth)');
    expect(source).toContain('const lastStripeIndex = Math.ceil((grassLeft + MATCH_SCREEN_WIDTH - pitchLeft) / stripeWidth)');
    expect(source).toContain('pitch.fillRect(grassLeft, grassTop, MATCH_SCREEN_WIDTH, MATCH_SCREEN_HEIGHT)');
    expect(source).toContain('pitch.fillStyle(stripeColor, 0.28)');
    expect(source).toContain('for (let stripeIndex = firstStripeIndex; stripeIndex < lastStripeIndex; stripeIndex += 1)');
    expect(source).toContain('pitch.fillRect(pitchLeft + stripeIndex * stripeWidth, grassTop, stripeWidth, MATCH_SCREEN_HEIGHT)');
    expect(source).toContain('pitch.strokeRect(pitchLeft, pitchTop, FIELD_VIEW_WIDTH, FIELD_VIEW_HEIGHT)');
    expect(source).toContain('scene.add.rectangle(0, 0, 2, FIELD_VIEW_HEIGHT, FIELD_MARKING_COLOR, FIELD_MARKING_ALPHA)');
    expect(source).toContain('const FIELD_GOAL_DEPTH = 42');
    expect(source).toContain('const FIELD_GOAL_HEIGHT = 131');
    expect(source).toContain('const FIELD_GOAL_FRAME_WIDTH = 4');
    expect(source).toContain('const FIELD_GOAL_NET_WIDTH = 1');
    expect(source).toContain('const FIELD_GOAL_NET_CELL_SIZE = 7');
    expect(source).toContain('private createGoals(scene: Phaser.Scene): Phaser.GameObjects.Graphics');
    expect(source).toContain('drawGoal(');
    expect(source).toContain('graphics.lineStyle(FIELD_GOAL_NET_WIDTH, FIELD_MARKING_COLOR, FIELD_GOAL_NET_ALPHA)');
    expect(source).toContain('graphics.lineStyle(FIELD_GOAL_FRAME_WIDTH, FIELD_MARKING_COLOR, FIELD_GOAL_FRAME_ALPHA)');
    expect(source).toContain('graphics.strokeRect(x, y, width, height)');
    expect(source).toContain('const FIELD_CORNER_ARC_RADIUS = 22');
    expect(source).toContain('drawCornerArc(markings, pitchLeft, pitchTop, 0, 90)');
    expect(source).not.toContain('scene.add.rectangle(0, 0, 1120, 600');
    expect(source).not.toContain('FIELD_OUTER_GRASS_');
  });

  it('keeps the full-screen grass background behind match UI controls', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const fieldIndex = source.indexOf('new FieldView(this, centerX, FIELD_CENTER_Y');
    const controlsIndex = source.indexOf('const matchControls = createMatchControlButtons({');
    const scoreIndex = source.indexOf('new ScoreView(');
    const deckIndex = source.indexOf('createPlayerDeck(');

    expect(fieldIndex).toBeGreaterThan(-1);
    expect(controlsIndex).toBeGreaterThan(fieldIndex);
    expect(scoreIndex).toBeGreaterThan(fieldIndex);
    expect(deckIndex).toBeGreaterThan(fieldIndex);
    expect(source).not.toContain('this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a)');
  });

  it('aligns Goals panels with the shared penalty side-panel geometry', () => {
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const statsSource = readSource('src/ui/TeamStatsView.ts');
    const sidePanelSource = readSource('src/ui/matchSidePanelStyle.ts');

    expect(gameSceneSource).toContain('new TeamStatsView(this, MATCH_SIDE_PANEL_LEFT_X, MATCH_SIDE_PANEL_CENTER_Y');
    expect(gameSceneSource).toContain('new TeamStatsView(this, MATCH_SIDE_PANEL_RIGHT_X, MATCH_SIDE_PANEL_CENTER_Y');
    expect(statsSource).toContain('export const TEAM_STATS_VIEW_WIDTH = MATCH_SIDE_PANEL_WIDTH');
    expect(statsSource).toContain('export const TEAM_STATS_VIEW_HEIGHT = MATCH_SIDE_PANEL_HEIGHT');
    expect(statsSource).toContain('const viewportHeight = height - 56');
    expect(statsSource).toContain('createMatchSidePanelBackground(scene, 0)');
    expect(sidePanelSource).toContain('export const MATCH_SIDE_PANEL_LEFT_X = MATCH_SIDE_PANEL_CORRIDOR_WIDTH / 2');
    expect(sidePanelSource).toContain('export const MATCH_SIDE_PANEL_RIGHT_X = MATCH_SCREEN_WIDTH - MATCH_SIDE_PANEL_LEFT_X');
    expect(sidePanelSource).toContain('export const MATCH_SIDE_PANEL_TOP_Y = MATCH_FIELD_CENTER_Y - MATCH_FIELD_HEIGHT / 2');
    expect(sidePanelSource).toContain('background.setStrokeStyle(1, MATCH_SIDE_PANEL_BORDER_COLOR, MATCH_SIDE_PANEL_BORDER_ALPHA)');
  });

  it('matches the top scoreboard width to the advantage indicator width', () => {
    const scoreSource = readSource('src/ui/ScoreView.ts');
    const scoreboardStyleSource = readSource('src/ui/scoreboardStyle.ts');
    const advantageSource = readSource('src/ui/AdvantageView.ts');

    expect(advantageSource).toContain('export const ADVANTAGE_VIEW_WIDTH = 520');
    expect(advantageSource).toContain('export const ADVANTAGE_TRACK_WIDTH = ADVANTAGE_VIEW_WIDTH - 12');
    expect(scoreSource).toContain("import { ADVANTAGE_VIEW_WIDTH } from './AdvantageView'");
    expect(scoreSource).toContain("} from './scoreboardStyle'");
    expect(scoreSource).toContain('export const SCORE_VIEW_WIDTH = ADVANTAGE_VIEW_WIDTH');
    expect(scoreboardStyleSource).toContain('export const SCOREBOARD_BACKGROUND_COLOR = 0x08120f');
    expect(scoreboardStyleSource).toContain('export const SCOREBOARD_BACKGROUND_ALPHA = 0.92');
    expect(scoreboardStyleSource).toContain('export const SCOREBOARD_BORDER_COLOR = 0xf0c95a');
    expect(scoreboardStyleSource).toContain('export const SCOREBOARD_BORDER_ALPHA = 0.95');
    expect(scoreboardStyleSource).toContain('export const MATCH_HEADER_BORDER_COLOR = 0x436b58');
    expect(scoreboardStyleSource).toContain('export const MATCH_HEADER_BORDER_ALPHA = 0.9');
    expect(scoreboardStyleSource).toContain('export const MATCH_HEADER_BORDER_WIDTH = 2');
    expect(scoreboardStyleSource).toContain("export const SCOREBOARD_FONT_FAMILY = 'DS-Digital, Arial, sans-serif'");
    expect(scoreSource).toContain('export const SCORE_VIEW_BACKGROUND_COLOR = SCOREBOARD_BACKGROUND_COLOR');
    expect(scoreSource).toContain('export const SCORE_VIEW_BACKGROUND_ALPHA = SCOREBOARD_BACKGROUND_ALPHA');
    expect(scoreSource).toContain('export const SCORE_VIEW_BORDER_COLOR = MATCH_HEADER_BORDER_COLOR');
    expect(scoreSource).toContain('export const SCORE_VIEW_BORDER_ALPHA = MATCH_HEADER_BORDER_ALPHA');
    expect(scoreSource).toContain('export const SCORE_VIEW_BORDER_WIDTH = MATCH_HEADER_BORDER_WIDTH');
    expect(scoreSource).toContain('export const SCORE_VIEW_FONT_FAMILY = SCOREBOARD_FONT_FAMILY');
    expect(scoreSource).toContain('scene.add.rectangle(0, 0, SCORE_VIEW_WIDTH, SCORE_VIEW_HEIGHT');
    expect(scoreSource).toContain('SCORE_VIEW_BACKGROUND_COLOR, SCORE_VIEW_BACKGROUND_ALPHA');
    expect(scoreSource).toContain('background.setStrokeStyle(SCORE_VIEW_BORDER_WIDTH, SCORE_VIEW_BORDER_COLOR, SCORE_VIEW_BORDER_ALPHA)');
    expect(advantageSource).toContain('background.setStrokeStyle(MATCH_HEADER_BORDER_WIDTH, MATCH_HEADER_BORDER_COLOR, MATCH_HEADER_BORDER_ALPHA)');
    expect(advantageSource).toContain('scene.add.rectangle(0, 0, ADVANTAGE_VIEW_WIDTH, ADVANTAGE_VIEW_HEIGHT');
    expect(scoreSource).not.toContain('scene.add.rectangle(0, 0, 620, 78');
  });

  it('docks the advantage indicator to the scoreboard with reduced inner side padding', () => {
    const layoutSource = readSource('src/ui/matchScreenLayout.ts');
    const scoreSource = readSource('src/ui/ScoreView.ts');
    const advantageSource = readSource('src/ui/AdvantageView.ts');
    const scoreboardY = Number(layoutSource.match(/export const MATCH_SCOREBOARD_CENTER_Y = (\d+)/)?.[1]);
    const advantageY = Number(layoutSource.match(/export const MATCH_ADVANTAGE_CENTER_Y = (\d+)/)?.[1]);
    const scoreHeight = Number(scoreSource.match(/export const SCORE_VIEW_HEIGHT = (\d+)/)?.[1]);
    const advantageHeight = Number(advantageSource.match(/export const ADVANTAGE_VIEW_HEIGHT = (\d+)/)?.[1]);
    const scoreboardBottom = scoreboardY + scoreHeight / 2;
    const advantageTop = advantageY - advantageHeight / 2;

    expect(scoreboardBottom).toBe(81);
    expect(advantageTop).toBe(scoreboardBottom);
    expect(layoutSource).toContain('export const MATCH_ADVANTAGE_CENTER_Y = 92');
    expect(advantageSource).toContain('export const ADVANTAGE_TRACK_WIDTH = ADVANTAGE_VIEW_WIDTH - 12');
    expect(advantageSource).not.toContain('export const ADVANTAGE_TRACK_WIDTH = 420');
  });

  it('uses scoreboard codes and the score font for all top scoreboard text', () => {
    const scoreSource = readSource('src/ui/ScoreView.ts');

    expect(scoreSource).toContain("import { getFlagAssetKey, getTeamScoreboardCode } from '../data/nationalTeams'");
    expect(scoreSource).toContain("import { px, SHARP_TEXT_RESOLUTION } from './textRendering'");
    expect(scoreSource).toContain('getTeamScoreboardCode(playerOneFlagCode)');
    expect(scoreSource).toContain('getTeamScoreboardCode(playerTwoFlagCode)');
    expect(scoreSource).toContain('fontFamily: SCORE_VIEW_FONT_FAMILY');
    expect(scoreSource.match(/fontFamily: SCORE_VIEW_FONT_FAMILY/g)?.length).toBeGreaterThanOrEqual(3);
    expect(scoreSource.match(/resolution: SHARP_TEXT_RESOLUTION/g)?.length).toBeGreaterThanOrEqual(3);
    expect(scoreSource).toContain('super(scene, px(x), px(y))');
    expect(scoreSource).not.toContain('.setScale(');
    expect(scoreSource).not.toContain('fontFamily: \'Arial, sans-serif\'');
    expect(scoreSource).not.toContain('createPlayerLabel(scene, -158, 26, playerOneName)');
    expect(scoreSource).not.toContain('createPlayerLabel(scene, 158, 26, playerTwoName)');
    expect(scoreSource).not.toContain('createShotsLabel');
    expect(scoreSource).not.toContain('Shots:');
  });

  it('keeps top scoreboard flags inset with team codes between flags and score', () => {
    const scoreSource = readSource('src/ui/ScoreView.ts');
    const width = 520;
    const flagWidth = 58;
    const playerOneFlagX = Number(scoreSource.match(/this\.createFlag\(scene, (-?\d+), playerOneFlagCode\)/)?.[1]);
    const playerTwoFlagX = Number(scoreSource.match(/this\.createFlag\(scene, (-?\d+), playerTwoFlagCode\)/)?.[1]);
    const playerOneCodeX = Number(scoreSource.match(/this\.createPlayerLabel\(scene, (-?\d+), getTeamScoreboardCode\(playerOneFlagCode\)/)?.[1]);
    const playerTwoCodeX = Number(scoreSource.match(/this\.createPlayerLabel\(scene, (-?\d+), getTeamScoreboardCode\(playerTwoFlagCode\)/)?.[1]);
    const edgeGap = playerOneFlagX - flagWidth / 2 - -width / 2;
    const codeEstimateWidth = 56;
    const flagToCodeGap = playerOneCodeX - codeEstimateWidth - (playerOneFlagX + flagWidth / 2);

    expect(playerOneFlagX).toBe(-221);
    expect(playerTwoFlagX).toBe(221);
    expect(playerOneFlagX).toBeLessThan(playerOneCodeX);
    expect(playerOneCodeX).toBeLessThan(0);
    expect(0).toBeLessThan(playerTwoCodeX);
    expect(playerTwoCodeX).toBeLessThan(playerTwoFlagX);
    expect(edgeGap).toBeGreaterThanOrEqual(9);
    expect(edgeGap).toBeCloseTo(flagToCodeGap, 0);
  });

  it('uses a transparent black background without borders for in-game info panels', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const rulesSource = readSource('src/ui/MatchRulesOverlay.ts');

    expect(source).toContain("import { ScoreView } from '../ui/ScoreView'");
    expect(source).toContain('const INFO_MODAL_BACKGROUND_COLOR = 0x000000');
    expect(source).toContain('const INFO_MODAL_BACKGROUND_ALPHA = 0.82');
    expect(source).toContain(
      'INFO_MODAL.width,\n      INFO_MODAL.height,\n      INFO_MODAL_BACKGROUND_COLOR,\n      INFO_MODAL_BACKGROUND_ALPHA'
    );
    expect(source).not.toContain('background.setStrokeStyle(2, 0x9dd2a7)');
    expect(source).toContain('const overlay = this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72)');
    expect(rulesSource).toContain('scene.add.rectangle(0, 0, MODAL_WIDTH, MODAL_HEIGHT, 0x000000, 0.82)');
  });

  it('restores failed move card animation while leaving field success on card flight', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('const card = new CardView(this, startX, startY, {');
    expect(source).toContain("onComplete: () => this.finishAttackAnimation(state, context, card, target, outcome, onComplete)");
    expect(source).toContain("if (outcome === 'post' || outcome === 'save' || outcome === 'miss') {");
    expect(source).toContain('this.showImpactPulse(target.x, target.y, outcome);');
    expect(source).not.toContain('this.playGoalkeeperImpactSound(context.positionId, outcome);');
    expect(source).not.toContain('private playGoalkeeperImpactSound(');
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
    expect(gameSceneSource).not.toContain("const GOALKEEPER_GOAL_FX_TEXTURE_KEY = 'goalkeeper-goal-fx'");
    expect(gameSceneSource).not.toContain("const GOALKEEPER_SAVE_HAND_FX_TEXTURE_KEY = 'goalkeeper-save-hand-fx'");
    expect(gameSceneSource).toContain('const GOALKEEPER_SHOT_BALL_SIZE = 42');
    expect(gameSceneSource).toContain('const GOALKEEPER_SHOT_BALL_ARC_HEIGHT = 58');
    expect(gameSceneSource).not.toContain('const GOALKEEPER_SHOT_BACKGROUND_FX_DEPTH = 620');
    expect(gameSceneSource).not.toContain('const GOALKEEPER_SHOT_BACKGROUND_BALL_DEPTH = 680');
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

  it('runs goalkeeper goal shots directly into the restored ball-flight flow', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const flightBlock = source.slice(
      source.indexOf('private playGoalkeeperShotBallFlight('),
      source.indexOf('private createGoalkeeperShotSourceSnapshot(')
    );

    expect(flightBlock).toContain('this.animateBallFlightToGoalkeeper({');
    expect(flightBlock).not.toContain("if (outcome === 'goal') {");
    expect(source).not.toContain('private animateGoalkeeperShotSourceHit(');
    expect(source).not.toContain('this.animateGoalkeeperShotSourceHit(');
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
    expect(saveBlock).not.toContain('handFx');
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
      "this.render(state, {\n        hiddenRestoredCards,\n        interactive: false,\n        hideActiveTurnBall: true\n      });"
    );
    expect(source).toContain('this.playGoalkeeperShotBallFlight(');
    expect(source).toContain('() => this.finishAttackAnimationSequence(onComplete),\n        onEffectStarted');
    expect(source).toContain('function isGoalkeeperShotAnimationOutcome(');
    expect(source).toContain("return context.positionId === 'goalkeeper' && (outcome === 'goal' || outcome === 'save' || outcome === 'post')");
    expect(source).toContain("state.log.slice(-4).some((event) => event.type === 'ATTACK_MISSED') ? 'miss' : 'defeat'");
    expect(source).toContain("if (outcome === 'post' || outcome === 'save' || outcome === 'miss') {");
    expect(source).toContain('this.playSceneEffectSound(shotEffect);');
  });

  it('defers restored field cards until goalkeeper shot and outcome visuals complete', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('const pendingRestores = this.getPendingRestoreAnimationEntries(state);');
    expect(source).toContain('const hiddenRestoredCards = options.hiddenRestoredCards ?? (interactive ? pendingRestores : undefined);');
    expect(source).toContain('const hasPendingRestores = pendingRestores.length > 0;');
    expect(source).toContain(
      'if (interactive && hasPendingRestores) {\n      this.isGameplayReady = false;\n    } else if (interactive && !this.isRestoreAnimationInProgress) {\n      this.markInitialDealComplete();\n    }'
    );
    expect(source).toContain(
      'const gameInteractive =\n      interactive &&\n      this.canAcceptGameplayInput() &&\n      !(this.aiTurnController?.isAiTurn(state) ?? false);'
    );
    expect(source).toContain('hiddenCards: hiddenRestoredCards');
    expect(source).toContain(
      'if (interactive && hasPendingRestores && !this.isRestoreAnimationInProgress) {\n      this.markInitialDealStarted();\n      const flowId = this.startAutomaticCardFlow();\n      this.scheduleCardRestoreDelayedCall(0, flowId, () => this.animateRestoredCards(state, pendingRestores, 0, flowId));\n      return;\n    }'
    );
    expect(source).toContain('const hiddenRestoredCards = this.getPendingRestoreAnimationEntries(state);');
    expect(source).toContain('this.render(state, { hiddenRestoredCards, interactive: false });');
    expect(source).not.toContain('this.render(state, {\n        hiddenRestoredCards: pendingRestores,\n        interactive: false\n      });');
  });

  it('starts the initial deal automatically from match creation without waiting for a deck click', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const createBlock = source.slice(source.indexOf('public create(): void'), source.indexOf('private startTurn(): void'));
    const renderBlock = source.slice(source.indexOf('private render('), source.indexOf('private drawAttackCard(): void'));

    expect(createBlock).toContain('this.engine.startNewGame({');
    expect(createBlock).toContain('setupPreset: this.matchMode === \'tutorial\' ? TUTORIAL_MATCH_V2_SETUP_PRESET : undefined');
    expect(createBlock).toContain('this.startTurn();');
    expect(createBlock).not.toContain('this.drawAttackCard();');
    expect(renderBlock).toContain('this.scheduleCardRestoreDelayedCall(0, flowId, () => this.animateRestoredCards(state, pendingRestores, 0, flowId));');
    expect(renderBlock.indexOf('this.scheduleCardRestoreDelayedCall(0, flowId, () => this.animateRestoredCards(state, pendingRestores, 0, flowId));')).toBeLessThan(
      renderBlock.indexOf('this.aiTurnController?.requestTurnCheck(options.aiCheckReason);')
    );
  });

  it('blocks deck and card gameplay input while the initial deal is pending or running', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const renderBlock = source.slice(source.indexOf('private render('), source.indexOf('private drawAttackCard(): void'));

    expect(source).toContain('private isGameplayReady = false');
    expect(source).toContain('private isInitialDealStarted = false');
    expect(source).toContain('private isInitialDealComplete = false');
    expect(renderBlock).toContain('this.isGameplayReady = false;');
    expect(renderBlock).toContain('this.markInitialDealStarted();');
    expect(renderBlock).toContain('this.canAcceptGameplayInput()');
    expect(renderBlock).toContain('interactive: gameInteractive');
    expect(renderBlock).toContain(
      'this.player1CoverTextureKey,\n        gameInteractive,\n        () => this.drawAttackCard(),'
    );
    expect(renderBlock).toContain(
      'this.player2CoverTextureKey,\n        gameInteractive,\n        () => this.drawAttackCard(),'
    );
    expect(source).toContain('private canAcceptGameplayInput(): boolean');
    expect(source).toContain('private isInitialDealActive(): boolean');
    expect(source).toContain('!this.isInitialDealActive()');
    expect(source).toContain('!this.isRestoreAnimationInProgress');
  });

  it('ignores stale gameplay callbacks until setup is complete and then re-enables input', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const drawBlock = source.slice(source.indexOf('private drawAttackCard(): void'), source.indexOf('private commitMidfielder'));
    const commitBlock = source.slice(source.indexOf('private commitMidfielder'), source.indexOf('private useMidfieldGap'));
    const gapBlock = source.slice(source.indexOf('private useMidfieldGap'), source.indexOf('private selectTarget'));
    const targetBlock = source.slice(source.indexOf('private selectTarget'), source.indexOf('private handleSelectedTargetState'));
    const restoreBlock = source.slice(
      source.indexOf('private animateRestoredCards('),
      source.indexOf('private isSceneStableForAi(): boolean')
    );

    expect(drawBlock).toContain('if (!this.canAcceptGameplayInput()) {\n      return;\n    }');
    expect(commitBlock).toContain('if (!this.canAcceptGameplayInput()) {\n      return;\n    }');
    expect(gapBlock).toContain('if (!this.canAcceptGameplayInput()) {\n      return;\n    }');
    expect(targetBlock).toContain('if (!this.canAcceptGameplayInput()) {\n      return;\n    }');
    expect(restoreBlock).toContain('this.markInitialDealComplete();\n      this.render(state);');
    expect(restoreBlock).toContain('this.markInitialDealComplete();\n        this.render(state);');
  });

  it('keeps Quick Match, Tournament Match and Tutorial Match startup on the guarded automatic deal path', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const createBlock = source.slice(source.indexOf('public create(): void'), source.indexOf('private startTurn(): void'));

    expect(source).toContain('this.launchContext = data.launchContext ?? QUICK_MATCH_CONTEXT;');
    expect(source).toContain('this.matchMode = data.matchMode ?? \'quick\';');
    expect(createBlock).toContain('player1ControllerType: this.player1ControllerType');
    expect(createBlock).toContain('player2ControllerType: this.player2ControllerType');
    expect(createBlock).toContain('setupPreset: this.matchMode === \'tutorial\' ? TUTORIAL_MATCH_V2_SETUP_PRESET : undefined');
    expect(createBlock).toContain('this.startTurn();');
  });

  it('leaves pause/menu controls and match-finished modal outside the gameplay input guard', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const renderBlock = source.slice(source.indexOf('private render('), source.indexOf('private drawAttackCard(): void'));
    const modalBlock = source.slice(
      source.indexOf('private showMatchFinishedModal('),
      source.indexOf('private getMatchFinishedBodyText(')
    );

    expect(renderBlock).toContain('const matchControls = createMatchControlButtons({');
    expect(renderBlock).toContain('onPause: () => this.openPauseModal(state)');
    expect(renderBlock).toContain('onRules: () => this.openMatchInfoModal(\'rules\')');
    expect(modalBlock).toContain('this.cancelAutomaticCardFlow();');
    expect(modalBlock).toContain('this.input.enabled = true;');
    expect(modalBlock).toContain('createMatchFinishedModal(this');
    expect(modalBlock).toContain('onOk: () => this.confirmMatchFinishedModal(state)');
  });

  it('cancels automatic card-flow timers and tweens before leaving the match scene', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('private isNavigationAwayInProgress = false');
    expect(source).toContain('private isSceneShutDown = false');
    expect(source).toContain('private isAutomaticCardFlowInProgress = false');
    expect(source).toContain('private isAutomaticCardFlowPaused = false');
    expect(source).toContain('private cardRestoreFlowId = 0');
    expect(source).toContain('private readonly pendingCardRestoreCallbacks = new Set<Phaser.Time.TimerEvent>()');
    expect(source).toContain('private readonly activeCardRestoreTweens = new Set<Phaser.Tweens.Tween>()');
    expect(source).toContain('private readonly activeCardRestoreCards = new Set<CardView>()');
    expect(source).toContain('private prepareToLeaveMatchScene(): void');
    expect(source).toContain('this.isNavigationAwayInProgress = true;');
    expect(source).toContain('this.cancelAutomaticCardFlow();');
    expect(source).toContain('private exitToMainMenu(): void');
    expect(source).toContain("this.scene.start('MenuScene');");
    expect(source).toContain("new Button(this, -125, 76, 'Menu', () => this.exitToMainMenu())");
    expect(source).not.toContain("new Button(this, -125, 76, 'Menu', () => this.scene.start('MenuScene'))");
  });

  it('guards automatic card-flow delayed callbacks after scene exit, shutdown, or stale flow generation', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).toContain('private canRunSceneSetup(): boolean');
    expect(source).toContain('private canRunAutomaticCardFlowStep(flowId: number): boolean');
    expect(source).toContain(
      'return this.engine !== null && !this.isSceneShutDown && !this.isNavigationAwayInProgress;'
    );
    expect(source).toContain('return this.canRunSceneSetup() && flowId === this.cardRestoreFlowId;');
    expect(source).toContain('private scheduleCardRestoreDelayedCall(delayMs: number, flowId: number, callback: () => void): void');
    expect(source).toContain('this.pendingCardRestoreCallbacks.delete(timer);');
    expect(source).toContain('if (!this.canRunAutomaticCardFlowStep(flowId)) {\n        return;\n      }\n\n      callback();');
    expect(source).toContain('this.scheduleCardRestoreDelayedCall(45, flowId, () =>');
    expect(source).toContain('this.animateRestoredCards(state, entries, index + 1, flowId)');
    expect(source).not.toContain('this.time.delayedCall(45, () => this.animateRestoredCards(state, entries, index + 1));');
  });

  it('keeps pause and exit-confirm modal ownership separate from automatic card-flow cleanup', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const pauseBlock = source.slice(
      source.indexOf('private openPauseModal('),
      source.indexOf('private openMatchInfoModal(')
    );
    const exitBlock = source.slice(
      source.indexOf('private openExitConfirmModal('),
      source.indexOf('private openPauseModal(')
    );
    const flowBlock = source.slice(
      source.indexOf('private pauseAutomaticCardFlow('),
      source.indexOf('private isTutorialBlockingSystemUi()')
    );

    expect(pauseBlock).toContain('this.pauseAutomaticCardFlow();');
    expect(pauseBlock).toContain('this.closePauseModal({ resumeAutomaticCardFlow: false });');
    expect(pauseBlock).toContain('this.openExitConfirmModal();');
    expect(pauseBlock).toContain('private closePauseModal(options: { resumeAutomaticCardFlow?: boolean } = {}): void');
    expect(pauseBlock).toContain('if (options.resumeAutomaticCardFlow !== false) {\n      this.resumeAutomaticCardFlow();\n    }');
    expect(exitBlock).toContain('this.pauseAutomaticCardFlow();');
    expect(exitBlock).toContain('private closeExitConfirmModal(options: { resumeAutomaticCardFlow?: boolean } = {}): void');
    expect(exitBlock).toContain('if (options.resumeAutomaticCardFlow !== false) {\n      this.resumeAutomaticCardFlow();\n    }');
    expect(flowBlock).toContain('timer.paused = true;');
    expect(flowBlock).toContain('tween.pause();');
    expect(flowBlock).toContain('timer.paused = false;');
    expect(flowBlock).toContain('tween.resume();');
    expect(flowBlock).toContain('this.cardRestoreFlowId += 1;');
    expect(flowBlock).not.toContain('this.pauseModal?.destroy();');
    expect(flowBlock).not.toContain('this.exitConfirmModal?.destroy();');
    expect(flowBlock).not.toContain('this.matchFinishedModal?.destroy();');
  });

  it('cleans pause overlays and input blockers when leaving from the pause menu', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const cleanupBlock = source.slice(
      source.indexOf('private prepareToLeaveMatchScene(): void'),
      source.indexOf('private exitToMainMenu(): void')
    );

    expect(cleanupBlock).toContain('this.exitConfirmModal?.destroy();');
    expect(cleanupBlock).toContain('this.pauseModal?.destroy();');
    expect(cleanupBlock).toContain('this.infoModal?.destroy();');
    expect(cleanupBlock).toContain('this.message?.destroy();');
    expect(cleanupBlock).toContain('this.tutorialOverlay?.destroy();');
    expect(cleanupBlock).toContain('this.input.enabled = true;');
    expect(cleanupBlock).toContain('clearDeckTurnBallMarker(this);');
    expect(cleanupBlock).toContain('this.aiTurnController?.dispose();');
    expect(source).toContain('this.input.enabled = true;\n    this.cancelAutomaticCardFlow();');
  });

  it('keeps normal automatic card restore completion while removing tracked deal objects', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const restoreBlock = source.slice(
      source.indexOf('private animateRestoredCards('),
      source.indexOf('private isSceneStableForAi(): boolean')
    );

    expect(restoreBlock).toContain('this.activeCardRestoreCards.add(card);');
    expect(restoreBlock).toContain('let dealTween: Phaser.Tweens.Tween;');
    expect(restoreBlock).toContain('dealTween = this.tweens.add({');
    expect(restoreBlock).toContain('this.activeCardRestoreTweens.delete(dealTween);');
    expect(restoreBlock).toContain('this.activeCardRestoreCards.delete(card);');
    expect(restoreBlock).toContain('card.destroy();');
    expect(restoreBlock).toContain('this.animatedRestoreCount += 1;');
    expect(restoreBlock).toContain('this.completeAutomaticCardFlow(flowId);\n        this.markInitialDealComplete();\n        this.render(state);');
    expect(restoreBlock).toContain('this.activeCardRestoreTweens.add(dealTween);');
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
    expect(source).toContain("import { getGoalkeeperGoalAnimation } from '../ui/goalkeeperGoalAnimation'");
    expect(source).toContain("if (outcome === 'goal') {");
    expect(source).toContain('this.animateGoalkeeperShotGoalDisappear(');
    expect(source).toContain('private animateGoalkeeperShotGoalDisappear(');
    expect(source).toContain("const goalAnimation = getGoalkeeperGoalAnimation(target, activeOnLeft ? 'right' : 'left')");
    expect(source).not.toContain('const goalFx = this.createGoalkeeperGoalFx(target, activeOnLeft);');
    expect(source).not.toContain('const ballTarget = goalFx?.ballTarget ?? goalAnimation.target;');
    expect(source).not.toContain('private createGoalkeeperGoalFx(');
    expect(source).not.toContain('GOALKEEPER_GOAL_FX_TEXTURE_KEY');
    expect(source).not.toContain('image.setDisplaySize(GOALKEEPER_GOAL_FX_WIDTH, GOALKEEPER_GOAL_FX_HEIGHT);');
    expect(source).toContain('angle: goalAnimation.angle');
    expect(source).toContain('scale: goalAnimation.scale');
    expect(source).toContain('angle: ball.angle + goalAnimation.angle');
    expect(source).not.toContain('goalFx?.image.destroy();');
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
    expect(source).not.toContain('const handFx = this.createGoalkeeperSaveHandFx(target, activeOnLeft);');
    expect(source).toContain('const deflection = getGoalkeeperShotSaveDeflection(target, activeOnLeft);');
    expect(source).not.toContain('private createGoalkeeperSaveHandFx(');
    expect(source).not.toContain('GOALKEEPER_SAVE_HAND_FX_TEXTURE_KEY');
    expect(source).not.toContain('image.setDisplaySize(GOALKEEPER_SAVE_HAND_FX_SIZE, GOALKEEPER_SAVE_HAND_FX_SIZE);');
    expect(source).not.toContain('handFx?.image.destroy();');
    expect(source).toContain('x: target.x + (activeOnLeft ? -155 : 155)');
    expect(source).toContain('y: target.y + 104');
    expect(source).toContain('angle: ball.angle + rotationSign * 420');
    expect(source).not.toContain("if (outcome === 'save') {\n    return {\n      x: activeOnLeft ? 1485 : 115,\n      y: DECK_Y\n    };\n  }");
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOALKEEPER_SAVE'))");
  });

  it('does not use reverted goalkeeper goal and hand FX assets', () => {
    const source = readSource('src/scenes/GameScene.ts');

    expect(source).not.toContain('function getGoalkeeperShotFxLayout(');
    expect(source).not.toContain('GOALKEEPER_GOAL_FX_X_OFFSET');
    expect(source).not.toContain('GOALKEEPER_SAVE_HAND_FX_X_OFFSET');
    expect(source).not.toContain("image.setFlipX(layout.defendingSide === 'left');");
    expect(source).not.toContain('image.setDepth(GOALKEEPER_SHOT_BACKGROUND_FX_DEPTH);');
    expect(source).toContain('ball.setDepth(900);');
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
    expect(source).not.toContain("if (outcome !== 'goal' && outcome !== 'post' && outcome !== 'save') {");
    expect(source).toContain('const shotEffect = getGoalkeeperShotSceneEffect(outcome);');
    expect(source).toContain('this.playSceneEffectSound(shotEffect);');
    expect(eventEffectsSource).toContain("flyingMessage: 'Post!'");
    expect(eventEffectsSource).toContain("soundKey: 'sound-goalpost'");
    expect(source).not.toContain('private animateGoalkeeperShotPostReturn(');
    expect(source).not.toContain("const returnTarget = getGoalkeeperShotBallExit(target, 'post', activeOnLeft)");
    expect(source).not.toContain('x: activeOnLeft ? 115 : 1485');
    expect(source).toContain("if (recentEvents.some((event) => event.type === 'GOALPOST_HIT'))");
  });

  it('shows goalkeeper shot flying messages at the impact tick and enlarges GOAL!! only', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const helperSource = readSource('src/ui/goalNotification.ts');
    const impactBlock = source.slice(
      source.indexOf('private finishGoalkeeperShotBallImpact('),
      source.indexOf('private animateGoalkeeperShotGoalDisappear(')
    );

    expect(source).toContain('getGoalkeeperShotSceneEffect,');
    expect(source).toContain('getNextGoalScoredSceneEffect,');
    expect(source).toContain('type GoalkeeperShotSceneEffect,');
    expect(source).toContain('type GoalScoredSceneEffect');
    expect(impactBlock).toContain('const shotEffect = getGoalkeeperShotSceneEffect(outcome);');
    expect(impactBlock).toContain('const shotEventIndex = getGoalkeeperShotEventIndex(this.requireEngine().getState().log, outcome);');
    expect(impactBlock).toContain('const shouldStartImpactEffects = claimGoalkeeperShotImpactEvent(');
    expect(impactBlock).toContain('this.handledGoalkeeperShotEventIndexes,\n      shotEventIndex');
    expect(impactBlock).toContain('if (shouldStartImpactEffects) {');
    expect(impactBlock).toContain('this.playSceneEffectSound(shotEffect);');
    expect(impactBlock).toContain('this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);');
    expect(impactBlock.indexOf('this.playSceneEffectSound(shotEffect);')).toBeLessThan(
      impactBlock.indexOf('this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);')
    );
    expect(impactBlock.indexOf('this.playSceneEffectSound(shotEffect);')).toBeLessThan(
      impactBlock.indexOf('this.showGoalkeeperShotTargetImpact(target, outcome);')
    );
    expect(impactBlock.indexOf('this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);')).toBeLessThan(
      impactBlock.indexOf('this.showGoalkeeperShotTargetImpact(target, outcome);')
    );
    expect(impactBlock.indexOf('this.showGoalkeeperShotTargetImpact(target, outcome);')).toBeLessThan(
      impactBlock.indexOf('onEffectStarted?.();')
    );
    expect(impactBlock).not.toContain("this.playGoalkeeperImpactSound('goalkeeper', outcome);");
    expect(source).toContain('this.playSceneEffectSound(goalEffect);');
    expect(source).toContain("import { GOAL_NOTIFICATION_OFFSET_Y, showGoalNotification } from '../ui/goalNotification'");
    expect(source).toContain('showGoalNotification(this, centerX, centerY + GOAL_NOTIFICATION_OFFSET_Y, message, onComplete);');
    expect(source).toContain("const fontSize = tone === 'post' || tone === 'save' ? '48px' : '38px';");
    expect(source).toContain("const isShotOutcomeTone = tone === 'post' || tone === 'save';");
    expect(source).toContain('const FLYING_MESSAGE_DEPTH = 3000;');
    expect(source).toContain('.setDepth(FLYING_MESSAGE_DEPTH);');
    expect(source).toContain('const popDuration = isShotOutcomeTone ? 220 : 0;');
    expect(source).toContain('const fadeDelay = isShotOutcomeTone ? 520 : 0;');
    expect(source).toContain('const fadeDuration = isShotOutcomeTone ? 1900 : 900;');
    expect(source).toContain('const startFadeTween = (): void => {');
    expect(helperSource).toContain('startScale: 0.82');
    expect(helperSource).toContain('targetScale: 1.08');
    expect(helperSource).toContain('fontSize: \'88px\'');
    expect(helperSource).toContain("ease: 'Back.easeOut'");
    expect(source).toContain('delay: fadeDelay,');
    expect(source).toContain('duration: fadeDuration,');
    expect(source).toContain('private playSceneEffectSound(effect: GoalkeeperShotSceneEffect | GoalScoredSceneEffect): boolean');
    expect(source).toContain('return playSoundSafe(this, effect.soundKey, { volume: 0.72 });');
    expect(source).not.toContain('handledGoalScoredEventCursor');
    expect(source).not.toContain('this.requireEngine().getState().log.length');
  });
});

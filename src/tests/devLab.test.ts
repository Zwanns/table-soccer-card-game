import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appendDevLabScene, isDevLabEnabled } from '../devLab';
import { DEV_LAB_PANEL_GAP, createDevLabLayout } from '../devLabLayout';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';

function normalizeSourceLineEndings(source: string): string {
  return source.replace(/\r\n/g, '\n');
}

function readSource(relativePath: string): string {
  return normalizeSourceLineEndings(readFileSync(join(process.cwd(), relativePath), 'utf8'));
}

describe('Dev Lab local-only access', () => {
  it('enables Dev Lab only for the Vite dev flag', () => {
    expect(isDevLabEnabled({ DEV: true })).toBe(true);
    expect(isDevLabEnabled({ DEV: false })).toBe(false);
    expect(isDevLabEnabled({})).toBe(false);
  });

  it('registers the Dev Lab scene only in local/dev mode', () => {
    const devScenes = appendDevLabScene(['BootScene'], 'DevLabScene', { DEV: true });
    const prodScenes = appendDevLabScene(['BootScene'], 'DevLabScene', { DEV: false });

    expect(devScenes).toContain('DevLabScene');
    expect(prodScenes).not.toContain('DevLabScene');
  });

  it('wires main scene registration through the dev gate', () => {
    const mainSource = readSource('src/main.ts');
    const helperSource = readSource('src/devLab.ts');

    expect(mainSource).toContain("import { appendDevLabScene, isDevLabEnabled } from './devLab'");
    expect(mainSource).toContain("const { DevLabScene } = await import('./scenes/DevLabScene')");
    expect(mainSource).toContain('return appendDevLabScene(CORE_SCENES, DevLabScene)');
    expect(helperSource).toContain('export function isDevLabEnabled(env: DevLabEnv = import.meta.env): boolean');
    expect(helperSource).toContain('return env.DEV === true;');
    expect(helperSource).toContain('return [...scenes, devLabScene];');
  });

  it('shows the Dev Lab menu button only behind the dev flag', () => {
    const menuSource = readSource('src/scenes/MenuScene.ts');
    const gameModesBlock = menuSource.slice(
      menuSource.indexOf('private createGameModeButtons(): void'),
      menuSource.indexOf('private createTournamentButtons(): void')
    );

    expect(menuSource).toContain("import { DEV_LAB_SCENE_KEY, isDevLabEnabled } from '../devLab'");
    expect(gameModesBlock).toContain('if (import.meta.env.DEV && isDevLabEnabled())');
    expect(gameModesBlock).toContain("'Dev Lab'");
    expect(gameModesBlock).toContain('() => this.scene.start(DEV_LAB_SCENE_KEY)');
  });
});

describe('Dev Lab scene previews', () => {
  it('creates the requested preview buttons and returns to the main menu', () => {
    const source = readSource('src/scenes/DevLabScene.ts');

    expect(source).toContain("super('DevLabScene')");
    expect(source).toContain("'Goal notification preview'");
    expect(source).toContain("'Final whistle modal preview'");
    expect(source).toContain("'Initial deal preview'");
    expect(source).toContain("'Post-attack restore preview'");
    expect(source).toContain("'Pause during restore test'");
    expect(source).toContain("'Result screen preview'");
    expect(source).toContain("'Tournament complete preview'");
    expect(source).toContain("'Back', () => this.scene.start('MenuScene')");
  });

  it('opens and closes the final whistle preview without navigating to ResultScene', () => {
    const source = readSource('src/scenes/DevLabScene.ts');
    const modalBlock = source.slice(
      source.indexOf('private showFinalWhistleModalPreview()'),
      source.indexOf('private closePreviewModal()')
    );

    expect(modalBlock).toContain('createMatchFinishedModal(this');
    expect(modalBlock).toContain('FINAL_WHISTLE_PREVIEW_TEXT');
    expect(modalBlock).toContain('onOk: () => this.closePreviewModal()');
    expect(modalBlock).not.toContain("this.scene.start('ResultScene'");
  });

  it('uses the shared real-game Goal notification renderer in GameScene and Dev Lab', () => {
    const devLabSource = readSource('src/scenes/DevLabScene.ts');
    const gameSource = readSource('src/scenes/GameScene.ts');
    const helperSource = readSource('src/ui/goalNotification.ts');

    expect(devLabSource).toContain("import { GOAL_NOTIFICATION_DEPTH, GOAL_NOTIFICATION_OFFSET_Y, showGoalNotification }");
    expect(gameSource).toContain("import { GOAL_NOTIFICATION_OFFSET_Y, showGoalNotification }");
    expect(devLabSource).toContain('showGoalNotification(');
    expect(gameSource).toContain('showGoalNotification(this, centerX, centerY + GOAL_NOTIFICATION_OFFSET_Y, message, onComplete)');
    expect(devLabSource).not.toContain(".text(layout.preview.centerX, layout.preview.centerY, 'GOAL!!'");
    expect(helperSource).toContain("export const GOAL_NOTIFICATION_MESSAGE = 'GOAL!!'");
  });

  it('keeps the Goal notification real scale and tween timing contract in one helper', () => {
    const helperSource = readSource('src/ui/goalNotification.ts');

    expect(helperSource).toContain('fontSize: \'88px\'');
    expect(helperSource).toContain('paddingX: 28');
    expect(helperSource).toContain('paddingY: 14');
    expect(helperSource).toContain('popDuration: 220');
    expect(helperSource).toContain('fadeDelay: 520');
    expect(helperSource).toContain('fadeDuration: 1900');
    expect(helperSource).toContain('startScale: 0.82');
    expect(helperSource).toContain('targetScale: 1.08');
    expect(helperSource).toContain("ease: 'Back.easeOut'");
    expect(helperSource).toContain("ease: 'Sine.easeOut'");
  });

  it('uses the shared real-game final whistle modal renderer in GameScene and Dev Lab', () => {
    const devLabSource = readSource('src/scenes/DevLabScene.ts');
    const gameSource = readSource('src/scenes/GameScene.ts');
    const helperSource = readSource('src/ui/matchFinishedModal.ts');

    expect(devLabSource).toContain("import { createMatchFinishedModal } from '../ui/matchFinishedModal'");
    expect(gameSource).toContain("import { createMatchFinishedModal } from '../ui/matchFinishedModal'");
    expect(devLabSource).toContain('const modal = createMatchFinishedModal(this');
    expect(gameSource).toContain('this.matchFinishedModal = createMatchFinishedModal(this');
    expect(devLabSource).not.toContain('const MATCH_FINISHED_MODAL =');
    expect(gameSource).not.toContain('const MATCH_FINISHED_MODAL =');
    expect(helperSource).toContain('width: 620');
    expect(helperSource).toContain('height: 430');
    expect(helperSource).toContain('buttonWidth: 190');
    expect(helperSource).toContain('buttonHeight: 58');
  });

  it('opens result preview with mock quick-match data and no tournament save writes', () => {
    const source = readSource('src/scenes/DevLabScene.ts');
    const resultBlock = source.slice(
      source.indexOf('private openResultPreview()'),
      source.indexOf('private openTournamentCompletePreview()')
    );

    expect(resultBlock).toContain("this.scene.start('ResultScene'");
    expect(resultBlock).toContain('state: createDevLabResultState()');
    expect(resultBlock).toContain('launchContext: QUICK_MATCH_CONTEXT');
    expect(resultBlock).toContain('devMockReturnScene: \'DevLabScene\'');
    expect(source).not.toContain('saveTournament(');
    expect(source).not.toContain('deleteStoredTournament(');
    expect(source).not.toContain('localStorage');
  });

  it('opens tournament complete preview with mock scene data and no real tournament overwrite', () => {
    const source = readSource('src/scenes/DevLabScene.ts');
    const completeBlock = source.slice(
      source.indexOf('private openTournamentCompletePreview()'),
      source.indexOf('function createDevLabResultState()')
    );

    expect(completeBlock).toContain("this.scene.start('TournamentCompleteScene'");
    expect(completeBlock).toContain('devMockTournament: createDevLabCompletedTournament()');
    expect(completeBlock).toContain('devMockReturnScene: \'DevLabScene\'');
    expect(source).not.toContain("this.registry.set('currentTournament'");
    expect(source).not.toContain('saveTournament(');
    expect(source).not.toContain('deleteStoredTournament(');
  });

  it('keeps dev mock ResultScene and TournamentCompleteScene exits sandboxed', () => {
    const resultSource = readSource('src/scenes/ResultScene.ts');
    const completeSource = readSource('src/scenes/TournamentCompleteScene.ts');

    expect(resultSource).toContain('devMockReturnScene?: string');
    expect(resultSource).toContain("label: 'Back'");
    expect(resultSource).toContain('this.scene.start(this.devMockReturnScene!)');
    expect(completeSource).toContain('devMockTournament?: TournamentState');
    expect(completeSource).toContain('this.devMockTournament ?? (this.registry.get');
    expect(completeSource).toContain("new Button(this, SCENE_WIDTH / 2, layout.actions.y, 'Back'");
    expect(completeSource).toContain('return;');
  });
});

describe('Dev Lab side-panel layout', () => {
  it('keeps controls in a right-side panel outside the central preview area', () => {
    const layout = createDevLabLayout(false);
    const sidePanelCenterX = layout.sidePanel.x + layout.sidePanel.width / 2;
    const previewRight = layout.preview.x + layout.preview.width;

    expect(layout.sidePanel.x).toBeGreaterThan(SCENE_WIDTH / 2);
    expect(previewRight + DEV_LAB_PANEL_GAP).toBe(layout.sidePanel.x);
    expect(sidePanelCenterX).toBeGreaterThan(previewRight);
    expect(layout.preview.centerX).toBeLessThan(sidePanelCenterX);
    expect(layout.preview.x).toBeGreaterThanOrEqual(0);
    expect(layout.preview.y).toBeGreaterThanOrEqual(0);
    expect(layout.preview.width).toBeGreaterThan(1000);
    expect(layout.preview.height).toBe(SCENE_HEIGHT - 48);
  });

  it('keeps every scenario button and the Back button inside the side panel', () => {
    const scenarioCount = 7;

    for (const mobileLandscape of [false, true]) {
      const layout = createDevLabLayout(mobileLandscape);
      const panelCenterX = layout.sidePanel.x + layout.sidePanel.width / 2;
      const buttonLeft = panelCenterX - layout.buttons.width / 2;
      const buttonRight = panelCenterX + layout.buttons.width / 2;
      const firstButtonTop = layout.buttons.startY - layout.buttons.height / 2;
      const lastButtonBottom =
        layout.buttons.startY + (scenarioCount - 1) * layout.buttons.gap + layout.buttons.height / 2;
      const backTop = layout.backButton.y - layout.backButton.height / 2;
      const backBottom = layout.backButton.y + layout.backButton.height / 2;

      expect(buttonLeft).toBeGreaterThanOrEqual(layout.sidePanel.x + layout.sidePanel.paddingX - 8);
      expect(buttonRight).toBeLessThanOrEqual(layout.sidePanel.x + layout.sidePanel.width - layout.sidePanel.paddingX + 8);
      expect(firstButtonTop).toBeGreaterThan(layout.subtitle.y);
      expect(lastButtonBottom).toBeLessThan(backTop);
      expect(backBottom).toBeLessThanOrEqual(layout.sidePanel.y + layout.sidePanel.height);
    }
  });

  it('keeps desktop and mobile landscape preview areas unobstructed by controls', () => {
    const desktop = createDevLabLayout(false);
    const mobile = createDevLabLayout(true);

    expect(desktop.sidePanel.width).toBeLessThan(420);
    expect(mobile.sidePanel.width).toBeGreaterThan(desktop.sidePanel.width);
    expect(mobile.preview.width).toBeGreaterThan(1000);
    expect(desktop.preview.centerX).toBeLessThan(desktop.sidePanel.x);
    expect(mobile.preview.centerX).toBeLessThan(mobile.sidePanel.x);
    expect(desktop.preview.centerY).toBe(SCENE_HEIGHT / 2);
    expect(mobile.preview.centerY).toBe(SCENE_HEIGHT / 2);
  });

  it('renders preview effects from preview coordinates instead of the side-panel controls', () => {
    const source = readSource('src/scenes/DevLabScene.ts');

    expect(source).toContain('new Button(this, layout.sidePanel.x + layout.sidePanel.width / 2, y, scenario.label');
    expect(source).toContain("new Button(this, layout.sidePanel.x + layout.sidePanel.width / 2, layout.backButton.y, 'Back'");
    expect(source).toContain('this.previewLayer = this.add.container(0, 0).setDepth(GOAL_NOTIFICATION_DEPTH)');
    expect(source).toContain('layout.preview.centerX,');
    expect(source).toContain('layout.preview.centerY + GOAL_NOTIFICATION_OFFSET_Y');
    expect(source).toContain('overlayWidth: layout.preview.width');
    expect(source).toContain('overlayHeight: layout.preview.height');
    expect(source).not.toContain('setMask(');
    expect(source).not.toContain('createGeometryMask');
    expect(source).not.toContain('DEV_LAB_LAYOUT.centerX');
    expect(source).not.toContain('DEV_LAB_LAYOUT.buttonsStartY');
  });
});

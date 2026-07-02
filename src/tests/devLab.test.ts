import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appendDevLabScene, isDevLabEnabled } from '../devLab';

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
      source.indexOf('private createMatchFinishedRefereeVisual()')
    );

    expect(modalBlock).toContain('FINAL_WHISTLE_PREVIEW_TEXT');
    expect(modalBlock).toContain("'Final whistle'");
    expect(modalBlock).toContain("'OK'");
    expect(modalBlock).toContain('() => this.closePreviewModal()');
    expect(modalBlock).not.toContain("this.scene.start('ResultScene'");
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

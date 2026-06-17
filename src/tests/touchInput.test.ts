import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DRAG_SCROLL_THRESHOLD_PX, clampScroll, isDragScrollGesture } from '../ui/touchInput';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('touch drag-scroll helpers', () => {
  it('distinguishes a short tap from a vertical drag', () => {
    expect(isDragScrollGesture(DRAG_SCROLL_THRESHOLD_PX - 1)).toBe(false);
    expect(isDragScrollGesture(-DRAG_SCROLL_THRESHOLD_PX + 1)).toBe(false);
    expect(isDragScrollGesture(DRAG_SCROLL_THRESHOLD_PX + 1)).toBe(true);
    expect(isDragScrollGesture(-DRAG_SCROLL_THRESHOLD_PX - 1)).toBe(true);
  });

  it('clamps scroll values to the available min and max', () => {
    expect(clampScroll(-20, 120)).toBe(0);
    expect(clampScroll(64, 120)).toBe(64);
    expect(clampScroll(180, 120)).toBe(120);
    expect(clampScroll(12, 0)).toBe(0);
  });

  it('keeps menu button hit areas aligned with the visual button rectangles', () => {
    const buttonSource = readSource('src/ui/Button.ts');
    const menuSource = readSource('src/scenes/MenuScene.ts');
    const gameSource = readSource('src/scenes/GameScene.ts');

    expect(buttonSource).toContain('this.setInteractive({ useHandCursor: true })');
    expect(buttonSource).not.toContain('touchHeight?: number');
    expect(buttonSource).not.toContain('touchWidth?: number');
    expect(buttonSource).not.toContain('hitArea: new Phaser.Geom.Rectangle');
    expect(menuSource).not.toContain('buttonTouchHeight');
    expect(menuSource).not.toContain('touchHeight:');
    expect(menuSource).not.toContain('hitArea: new Phaser.Geom.Rectangle(-24, -22, 48, 44)');
    expect(gameSource).not.toContain('touchHeight:');
    expect(gameSource).not.toContain('hitArea: new Phaser.Geom.Rectangle(-24, -22, 48, 44)');
  });

  it('wires team lists through tap-aware drag-scroll targets', () => {
    const teamSelectSource = readSource('src/scenes/TeamSelectScene.ts');
    const squadSelectSource = readSource('src/scenes/SquadSelectScene.ts');
    const setupSource = readSource('src/scenes/TournamentSetupScene.ts');

    expect(teamSelectSource).toContain('TEAM_SCREEN_TEAM_BUTTON_HEIGHT + 6');
    expect(teamSelectSource).toContain('dragScroll.bindScrollableTapTarget(option');
    expect(teamSelectSource).toContain('dragScroll.updateScrollableItemInputs(content, teamOptions)');
    expect(squadSelectSource).toContain('const CARD_HEIGHT = 48');
    expect(squadSelectSource).toContain('dragScroll.bindScrollableTapTarget(option');
    expect(squadSelectSource).toContain('content.setMask(mask)');
    expect(setupSource).toContain('dragScroll.bindScrollableTapTarget(option');
    expect(setupSource).toContain('dragScroll.updateScrollableItemInputs(content, teamOptions)');
  });

  it('keeps rules/about drag-scroll zones inside the text viewport', () => {
    const menuSource = readSource('src/scenes/MenuScene.ts');
    const gameSource = readSource('src/scenes/GameScene.ts');

    expect(menuSource).toContain('.zone(0, ABOUT_VIEWPORT.y + ABOUT_VIEWPORT.height / 2, ABOUT_VIEWPORT.width, ABOUT_VIEWPORT.height)');
    expect(menuSource).toContain('width: ABOUT_VIEWPORT.width');
    expect(menuSource).toContain('height: ABOUT_VIEWPORT.height');
    expect(gameSource).toContain('.zone(0, INFO_VIEWPORT.y + INFO_VIEWPORT.height / 2, INFO_VIEWPORT.width, INFO_VIEWPORT.height)');
    expect(gameSource).toContain('width: INFO_VIEWPORT.width');
    expect(gameSource).toContain('height: INFO_VIEWPORT.height');
  });

  it('keeps tournament bottom buttons on the shared exact Button hit area', () => {
    const setupSource = readSource('src/scenes/TournamentSetupScene.ts');
    const hubSource = readSource('src/scenes/TournamentHubScene.ts');

    expect(setupSource).toContain("new Button(this, 130, 666, 'Menu'");
    expect(setupSource).toContain("new Button(this, 1360, 666, 'Start tournament'");
    expect(setupSource).not.toContain('touchHeight:');
    expect(hubSource).toContain("new Button(this, 132, 666, 'Menu'");
    expect(hubSource).not.toContain('touchHeight:');
  });
});

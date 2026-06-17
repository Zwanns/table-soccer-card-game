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

  it('uses larger menu hit areas without changing the shared button visuals', () => {
    const buttonSource = readSource('src/ui/Button.ts');
    const menuSource = readSource('src/scenes/MenuScene.ts');

    expect(buttonSource).toContain('touchHeight?: number');
    expect(buttonSource).toContain('hitArea: new Phaser.Geom.Rectangle');
    expect(menuSource).toContain('buttonTouchHeight: 60');
    expect(menuSource).toContain('touchHeight: MENU_LAYOUT.buttonTouchHeight');
    expect(menuSource).toContain('hitArea: new Phaser.Geom.Rectangle(-24, -22, 48, 44)');
  });

  it('wires team lists through tap-aware drag-scroll targets', () => {
    const teamSelectSource = readSource('src/scenes/TeamSelectScene.ts');
    const squadSelectSource = readSource('src/scenes/SquadSelectScene.ts');
    const setupSource = readSource('src/scenes/TournamentSetupScene.ts');

    expect(teamSelectSource).toContain('TEAM_SCREEN_TEAM_BUTTON_HEIGHT + 6');
    expect(teamSelectSource).toContain('dragScroll.bindScrollableTapTarget(option');
    expect(teamSelectSource).toContain('dragScroll.updateScrollableItemInputs(content, teamOptions)');
    expect(squadSelectSource).toContain('const CARD_HEIGHT = 42');
    expect(squadSelectSource).toContain('dragScroll.bindScrollableTapTarget(option');
    expect(squadSelectSource).toContain('content.setMask(mask)');
    expect(setupSource).toContain('dragScroll.bindScrollableTapTarget(option');
    expect(setupSource).toContain('dragScroll.updateScrollableItemInputs(content, teamOptions)');
  });
});

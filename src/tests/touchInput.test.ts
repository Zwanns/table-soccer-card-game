import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('touch-friendly input contract', () => {
  it('keeps interactive hit areas at least 44x44 in game coordinates', () => {
    const touchInputSource = readFileSync(join(process.cwd(), 'src', 'ui', 'touchInput.ts'), 'utf8');

    expect(touchInputSource).toContain('export const MIN_TOUCH_TARGET_SIZE = 44');
    expect(touchInputSource).toContain('width: Math.max(width, MIN_TOUCH_TARGET_SIZE)');
    expect(touchInputSource).toContain('height: Math.max(height, MIN_TOUCH_TARGET_SIZE)');
    expect(touchInputSource).toContain('new Phaser.Geom.Rectangle(-hitArea.width / 2, -hitArea.height / 2');
  });

  it('applies the shared touch helper to small buttons and language targets', () => {
    const buttonSource = readFileSync(join(process.cwd(), 'src', 'ui', 'Button.ts'), 'utf8');
    const menuSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');
    const gameSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');
    const teamSelectSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TeamSelectScene.ts'), 'utf8');
    const squadSelectSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'SquadSelectScene.ts'), 'utf8');
    const tournamentSetupSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentSetupScene.ts'), 'utf8');
    const tournamentHubSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentHubScene.ts'), 'utf8');

    expect(buttonSource).toContain('setTouchFriendlyInteractive(this, width, height, {');
    expect(buttonSource).toContain('minWidth: options.touchWidth');
    expect(buttonSource).toContain('minHeight: options.touchHeight');
    expect(menuSource).toContain('setTouchFriendlyInteractive(label, Math.max(label.width, 1), Math.max(label.height, 1))');
    expect(gameSource).toContain('setTouchFriendlyInteractive(label, Math.max(label.width, 1), Math.max(label.height, 1))');
    expect(teamSelectSource).toContain('setTouchFriendlyInteractive(checkbox, 58, 28, {');
    expect(teamSelectSource).toContain('minHeight: layout.selectedPanels.aiTouchHeight');
    expect(squadSelectSource).toContain('setTouchFriendlyInteractive(option, teamList.cardWidth, teamList.cardHeight, {');
    expect(squadSelectSource).toContain('minHeight: teamList.touchHeight');
    expect(tournamentSetupSource).toContain('createTouchHitArea(this, 188, SLOT_HEIGHT / 2, 22, 26)');
    expect(tournamentSetupSource).toContain('createTouchHitArea(this, 0, 0, 42, 24)');
    expect(tournamentHubSource).toContain('setTouchFriendlyInteractive(button, tabWidth, 46)');
  });

  it('keeps the portrait overlay as a blocking fixed layer', () => {
    const indexSource = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const cssSource = readFileSync(join(process.cwd(), 'src', 'styles', 'main.css'), 'utf8');

    expect(indexSource).toContain('id="rotate-device-overlay"');
    expect(indexSource).toContain('overlay.hidden = !shouldShow');
    expect(cssSource).toContain('#rotate-device-overlay');
    expect(cssSource).toContain('position: fixed');
    expect(cssSource).toContain('z-index: 10000');
    expect(cssSource).toContain('touch-action: none');
  });

  it('keeps Phaser canvas sizing stable for mobile Chrome input alignment', () => {
    const mainSource = readFileSync(join(process.cwd(), 'src', 'main.ts'), 'utf8');
    const indexSource = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const cssSource = readFileSync(join(process.cwd(), 'src', 'styles', 'main.css'), 'utf8');

    expect(indexSource).toContain('maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    expect(mainSource).toContain('game.scale.refresh()');
    expect(mainSource).toContain("window.visualViewport?.addEventListener('resize', scheduleScaleRefresh");
    expect(cssSource).toContain('width: 100%');
    expect(cssSource).toContain('min-width: 100vw');
    expect(cssSource).toContain('min-height: 100dvh');
    expect(cssSource).not.toContain('100dvw');
    expect(cssSource).not.toContain('transform: scale');
  });
});

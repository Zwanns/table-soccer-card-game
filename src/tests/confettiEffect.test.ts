import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONFETTI_EFFECT_MODE,
  CONFETTI_MAX_LIFETIME_MS,
  CONFETTI_MIN_LIFETIME_MS,
  CONFETTI_REPEAT_INTERVAL_MS,
  DEFAULT_CONFETTI_COLORS,
  DESKTOP_CONFETTI_PIECES_PER_SIDE,
  FULL_SCENE_CONFETTI_VIEWPORT,
  MOBILE_CONFETTI_PIECES_PER_SIDE,
  createSideCannonBurstPieceConfigs,
  getConfettiPiecesPerSide,
  normalizeConfettiColors
} from '../ui/confettiEffect';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('side-cannon confetti effect helper', () => {
  it('creates a side-cannon burst from both left and right sides', () => {
    const viewport = { x: 0, y: 0, width: 1600, height: 720 };
    const pieces = createSideCannonBurstPieceConfigs({
      colors: ['#ff0000', '#00aaee'],
      piecesPerSide: 4,
      random: () => 0.5,
      viewport
    });
    const leftPieces = pieces.filter((piece) => piece.side === 'left');
    const rightPieces = pieces.filter((piece) => piece.side === 'right');

    expect(CONFETTI_EFFECT_MODE).toBe('side-cannons');
    expect(leftPieces).toHaveLength(4);
    expect(rightPieces).toHaveLength(4);
    leftPieces.forEach((piece) => {
      expect(piece.x).toBeLessThan(viewport.width * 0.05);
      expect(piece.peakX).toBeGreaterThan(piece.x);
      expect(piece.peakY).toBeLessThan(piece.y);
    });
    rightPieces.forEach((piece) => {
      expect(piece.x).toBeGreaterThan(viewport.width * 0.95);
      expect(piece.peakX).toBeLessThan(piece.x);
      expect(piece.peakY).toBeLessThan(piece.y);
    });
  });

  it('uses provided colors randomly and keeps ribbon-like piece shapes', () => {
    const pieces = createSideCannonBurstPieceConfigs({
      colors: ['#ff0000', '#00aaee'],
      piecesPerSide: 6,
      random: () => 0.5
    });

    pieces.forEach((piece) => {
      expect(['#FF0000', '#00AAEE']).toContain(piece.color);
      expect(piece.width).toBeGreaterThanOrEqual(5);
      expect(piece.width).toBeLessThanOrEqual(10);
      expect(piece.height).toBeGreaterThanOrEqual(12);
      expect(piece.height).toBeLessThanOrEqual(24);
      expect(Math.abs(piece.targetRotation)).toBeGreaterThan(0);
    });
  });

  it('accepts a golden champion palette for shared side-cannon bursts', () => {
    const goldenPalette = ['#F7D56A', '#F0B93A', '#FFF2A6', '#D69A24', '#FFFFFF'];
    const pieces = createSideCannonBurstPieceConfigs({
      colors: goldenPalette,
      piecesPerSide: 5,
      random: () => 0.5
    });

    pieces.forEach((piece) => {
      expect(goldenPalette).toContain(piece.color);
    });
  });

  it('uses lower mobile intensity than desktop within the requested ranges', () => {
    expect(getConfettiPiecesPerSide(false)).toBe(DESKTOP_CONFETTI_PIECES_PER_SIDE);
    expect(getConfettiPiecesPerSide(true)).toBe(MOBILE_CONFETTI_PIECES_PER_SIDE);
    expect(DESKTOP_CONFETTI_PIECES_PER_SIDE).toBe(52);
    expect(MOBILE_CONFETTI_PIECES_PER_SIDE).toBe(28);
    expect(DESKTOP_CONFETTI_PIECES_PER_SIDE).toBeGreaterThan(34);
    expect(MOBILE_CONFETTI_PIECES_PER_SIDE).toBeGreaterThan(18);
    expect(MOBILE_CONFETTI_PIECES_PER_SIDE).toBeLessThan(DESKTOP_CONFETTI_PIECES_PER_SIDE);
  });

  it('keeps burst lifetime around 1800 to 2600ms', () => {
    const pieces = createSideCannonBurstPieceConfigs({
      piecesPerSide: 8,
      random: () => 0.95
    });

    expect(CONFETTI_MIN_LIFETIME_MS).toBe(1800);
    expect(CONFETTI_MAX_LIFETIME_MS).toBe(2600);
    pieces.forEach((piece) => {
      expect(piece.lifetimeMs).toBeGreaterThanOrEqual(CONFETTI_MIN_LIFETIME_MS);
      expect(piece.lifetimeMs).toBeLessThanOrEqual(CONFETTI_MAX_LIFETIME_MS);
      expect(piece.launchDurationMs + piece.fallDurationMs).toBe(piece.lifetimeMs);
    });
  });

  it('normalizes invalid or missing colors to the neutral fallback palette', () => {
    expect(normalizeConfettiColors(undefined)).toEqual([...DEFAULT_CONFETTI_COLORS]);
    expect(normalizeConfettiColors(['nope', '#ffffff', '#FFFFFF', '#d9d9d9'])).toEqual(['#FFFFFF', '#D9D9D9']);
    expect(DEFAULT_CONFETTI_COLORS).toEqual(['#FFFFFF', '#F0C95A', '#D9D9D9']);
  });

  it('uses the full scene viewport by default', () => {
    expect(FULL_SCENE_CONFETTI_VIEWPORT).toEqual({
      x: 0,
      y: 0,
      width: 1600,
      height: 720
    });
  });

  it('starts immediately, repeats every two seconds, and cleans timer/tweens/pieces on destroy', () => {
    const source = readSource('src/ui/confettiEffect.ts');

    expect(CONFETTI_REPEAT_INTERVAL_MS).toBe(2000);
    expect(source).toContain('if (options.autoStart !== false)');
    expect(source).toContain('createBurst();');
    expect(source).toContain('repeatTimer = scene.time.addEvent({');
    expect(source).toContain('delay: repeatIntervalMs');
    expect(source).toContain('loop: true');
    expect(source.match(/scene.time.addEvent/g)).toHaveLength(1);
    expect(source).toContain('repeatTimer.remove(false);');
    expect(source).toContain('tween.stop();');
    expect(source).toContain('tween.remove();');
    expect(source).toContain('for (const piece of activePieces)');
    expect(source).toContain('destroyPiece(piece);');
    expect(source).toContain('if (destroyed) {\n      return;\n    }');
  });

  it('does not create a continuous Phaser particle emitter or interactive objects', () => {
    const source = readSource('src/ui/confettiEffect.ts');

    expect(source).not.toContain('scene.add.particles');
    expect(source).not.toContain('createEmitter');
    expect(source).not.toContain('setInteractive');
  });
});

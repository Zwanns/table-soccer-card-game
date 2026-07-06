import type Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { isMobileLandscapeLayout } from './mobileLayout';

export const CONFETTI_EFFECT_MODE = 'side-cannons';
export const CONFETTI_REPEAT_INTERVAL_MS = 2000;
export const CONFETTI_MIN_LIFETIME_MS = 1800;
export const CONFETTI_MAX_LIFETIME_MS = 2600;
export const DESKTOP_CONFETTI_PIECES_PER_SIDE = 52;
export const MOBILE_CONFETTI_PIECES_PER_SIDE = 28;
export const DEFAULT_CONFETTI_COLORS = ['#FFFFFF', '#F0C95A', '#D9D9D9'] as const;
export const FULL_SCENE_CONFETTI_VIEWPORT = {
  x: 0,
  y: 0,
  width: SCENE_WIDTH,
  height: SCENE_HEIGHT
} as const;

const SCENE_SHUTDOWN_EVENT = 'shutdown';
const SCENE_DESTROY_EVENT = 'destroy';
const CANNON_EDGE_OFFSET = 28;
const CANNON_VERTICAL_MIN_RATIO = 0.58;
const CANNON_VERTICAL_MAX_RATIO = 0.86;

export type ConfettiEffectMode = typeof CONFETTI_EFFECT_MODE;
export type ConfettiCannonSide = 'left' | 'right';

export interface ConfettiEffectHandle {
  destroy: () => void;
}

export interface ConfettiViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConfettiPieceConfig {
  side: ConfettiCannonSide;
  x: number;
  y: number;
  peakX: number;
  peakY: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  color: string;
  alpha: number;
  rotation: number;
  targetRotation: number;
  lifetimeMs: number;
  launchDurationMs: number;
  fallDurationMs: number;
  delayMs: number;
}

export interface CreateConfettiEffectOptions {
  autoStart?: boolean;
  colors?: readonly string[];
  depth?: number;
  isMobile?: boolean;
  mode?: ConfettiEffectMode;
  piecesPerSide?: number;
  random?: () => number;
  repeatIntervalMs?: number;
  viewport?: ConfettiViewportBounds;
}

export function createConfettiEffect(
  scene: Phaser.Scene,
  options: CreateConfettiEffectOptions = {}
): ConfettiEffectHandle {
  let destroyed = false;
  const activePieces = new Set<Phaser.GameObjects.Rectangle>();
  const activeTweens: Phaser.Tweens.Tween[] = [];
  const container = scene.add.container(0, 0);
  const mode = options.mode ?? CONFETTI_EFFECT_MODE;
  const repeatIntervalMs = options.repeatIntervalMs ?? CONFETTI_REPEAT_INTERVAL_MS;
  let repeatTimer: Phaser.Time.TimerEvent | null = null;

  if (options.depth !== undefined) {
    container.setDepth(options.depth);
  }

  const destroyPiece = (piece: Phaser.GameObjects.Rectangle): void => {
    activePieces.delete(piece);

    if (piece.scene && piece.active) {
      piece.destroy();
    }
  };

  const trackTween = (tween: Phaser.Tweens.Tween): Phaser.Tweens.Tween => {
    activeTweens.push(tween);
    return tween;
  };

  const createBurst = (): void => {
    if (destroyed || mode !== CONFETTI_EFFECT_MODE) {
      return;
    }

    for (const config of createSideCannonBurstPieceConfigs(options)) {
      if (destroyed) {
        break;
      }

      const piece = scene.add.rectangle(
        config.x,
        config.y,
        config.width,
        config.height,
        toPhaserColor(config.color),
        config.alpha
      );

      piece.setRotation(config.rotation);
      container.add(piece);
      activePieces.add(piece);

      trackTween(
        scene.tweens.add({
          targets: piece,
          x: config.peakX,
          y: config.peakY,
          angle: radiansToDegrees(config.targetRotation * 0.45),
          delay: config.delayMs,
          duration: config.launchDurationMs,
          ease: 'Sine.easeOut',
          onComplete: () => {
            if (destroyed || !piece.active) {
              return;
            }

            trackTween(
              scene.tweens.add({
                targets: piece,
                x: config.targetX,
                y: config.targetY,
                angle: radiansToDegrees(config.targetRotation),
                alpha: 0,
                duration: config.fallDurationMs,
                ease: 'Sine.easeIn',
                onComplete: () => destroyPiece(piece)
              })
            );
          }
        })
      );
    }
  };

  const destroy = (): void => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    scene.events.off(SCENE_SHUTDOWN_EVENT, destroy);
    scene.events.off(SCENE_DESTROY_EVENT, destroy);

    if (repeatTimer !== null) {
      repeatTimer.remove(false);
      repeatTimer = null;
    }

    for (const tween of activeTweens) {
      tween.stop();
      tween.remove();
    }
    activeTweens.length = 0;

    for (const piece of activePieces) {
      destroyPiece(piece);
    }
    activePieces.clear();

    if (container.scene && container.active) {
      container.destroy(true);
    }
  };

  scene.events.once(SCENE_SHUTDOWN_EVENT, destroy);
  scene.events.once(SCENE_DESTROY_EVENT, destroy);

  if (options.autoStart !== false) {
    createBurst();
  }

  repeatTimer = scene.time.addEvent({
    delay: repeatIntervalMs,
    callback: createBurst,
    loop: true
  });

  return { destroy };
}

export function createSideCannonBurstPieceConfigs(options: CreateConfettiEffectOptions = {}): ConfettiPieceConfig[] {
  const random = options.random ?? Math.random;
  const colors = normalizeConfettiColors(options.colors);
  const viewport = options.viewport ?? FULL_SCENE_CONFETTI_VIEWPORT;
  const piecesPerSide = options.piecesPerSide ?? getConfettiPiecesPerSide(options.isMobile ?? isMobileLandscapeLayout());

  return [
    ...createCannonSidePieceConfigs('left', piecesPerSide, colors, viewport, random),
    ...createCannonSidePieceConfigs('right', piecesPerSide, colors, viewport, random)
  ];
}

export function getConfettiPiecesPerSide(isMobile: boolean): number {
  return isMobile ? MOBILE_CONFETTI_PIECES_PER_SIDE : DESKTOP_CONFETTI_PIECES_PER_SIDE;
}

export function normalizeConfettiColors(colors: readonly string[] | undefined): string[] {
  const normalized = (colors ?? [])
    .map((color) => color.trim().toUpperCase())
    .filter((color) => /^#[0-9A-F]{6}$/.test(color));

  return normalized.length === 0 ? [...DEFAULT_CONFETTI_COLORS] : [...new Set(normalized)];
}

function createCannonSidePieceConfigs(
  side: ConfettiCannonSide,
  count: number,
  colors: readonly string[],
  viewport: ConfettiViewportBounds,
  random: () => number
): ConfettiPieceConfig[] {
  const left = viewport.x;
  const right = viewport.x + viewport.width;
  const top = viewport.y;
  const bottom = viewport.y + viewport.height;
  const centerX = left + viewport.width / 2;
  const cannonX = side === 'left' ? left + CANNON_EDGE_OFFSET : right - CANNON_EDGE_OFFSET;

  return Array.from({ length: count }, () => {
    const y = randomRange(random, top + viewport.height * CANNON_VERTICAL_MIN_RATIO, top + viewport.height * CANNON_VERTICAL_MAX_RATIO);
    const towardCenter = side === 'left' ? 1 : -1;
    const lifetimeMs = randomRange(random, CONFETTI_MIN_LIFETIME_MS, CONFETTI_MAX_LIFETIME_MS);
    const launchDurationMs = lifetimeMs * randomRange(random, 0.32, 0.44);
    const fallDurationMs = lifetimeMs - launchDurationMs;
    const horizontalReach = randomRange(random, viewport.width * 0.2, viewport.width * 0.48);
    const peakX = clamp(cannonX + towardCenter * horizontalReach, left + 20, right - 20);
    const peakY = randomRange(random, top + viewport.height * 0.08, top + viewport.height * 0.46);
    const drift = randomRange(random, -viewport.width * 0.18, viewport.width * 0.18);
    const targetX = clamp(peakX + drift, left + 12, right - 12);
    const targetY = randomRange(random, top + viewport.height * 0.72, bottom + 120);
    const rotationDirection = random() < 0.5 ? -1 : 1;

    return {
      side,
      x: cannonX,
      y,
      peakX: clamp(peakX, side === 'left' ? left : centerX - viewport.width * 0.1, side === 'left' ? centerX + viewport.width * 0.1 : right),
      peakY,
      targetX,
      targetY,
      width: randomRange(random, 5, 10),
      height: randomRange(random, 12, 24),
      color: colors[Math.floor(random() * colors.length)] ?? DEFAULT_CONFETTI_COLORS[0],
      alpha: randomRange(random, 0.74, 0.96),
      rotation: randomRange(random, -0.9, 0.9),
      targetRotation: rotationDirection * Math.PI * 2 * randomRange(random, 0.9, 2.4),
      lifetimeMs,
      launchDurationMs,
      fallDurationMs,
      delayMs: randomRange(random, 0, 180)
    };
  });
}

function randomRange(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function radiansToDegrees(value: number): number {
  return value * (180 / Math.PI);
}

function toPhaserColor(color: string): number {
  return Number.parseInt(color.slice(1), 16);
}

import type Phaser from 'phaser';
import { MATCH_OVERLAY_DEPTH } from './matchUiDepth';

interface SceneTooltips {
  dismiss: Set<() => void>;
  modals: Set<Phaser.GameObjects.Container>;
  suppressInitialHover: boolean;
}

const sceneTooltips = new WeakMap<Phaser.Scene, SceneTooltips>();

function getSceneTooltips(scene: Phaser.Scene): SceneTooltips {
  let state = sceneTooltips.get(scene);
  if (state === undefined) {
    state = { dismiss: new Set(), modals: new Set(), suppressInitialHover: false };
    sceneTooltips.set(scene, state);
  }
  return state;
}

export function isPlayerTooltipBlocked(scene: Phaser.Scene): boolean {
  return (sceneTooltips.get(scene)?.modals.size ?? 0) > 0;
}

export function registerPlayerTooltip(scene: Phaser.Scene, dismiss: () => void): () => void {
  const state = getSceneTooltips(scene);
  state.dismiss.add(dismiss);
  if (state.modals.size > 0 || state.suppressInitialHover) dismiss();
  return () => state.dismiss.delete(dismiss);
}

export function resumePlayerTooltipHover(scene: Phaser.Scene): void {
  const state = sceneTooltips.get(scene);
  if (state !== undefined && state.modals.size === 0) state.suppressInitialHover = false;
}

export function createBlockingModal(
  scene: Phaser.Scene,
  depth = MATCH_OVERLAY_DEPTH
): Phaser.GameObjects.Container {
  const state = getSceneTooltips(scene);
  const modal = scene.add.container(0, 0).setDepth(depth);
  state.modals.add(modal);
  state.suppressInitialHover = true;
  // Clear held/hovered names before the modal becomes visible. Closing it never restores them.
  for (const dismiss of state.dismiss) dismiss();
  modal.once('destroy', () => state.modals.delete(modal));
  return modal;
}

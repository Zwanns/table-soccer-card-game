import type Phaser from 'phaser';

export const DRAG_SCROLL_THRESHOLD_PX = 8;
export const TOUCH_SCROLL_WHEEL_FACTOR = 0.35;

export interface ScrollViewport {
  x?: number;
  y: number;
  width?: number;
  height: number;
}

export interface DragScrollAreaOptions {
  scene: Phaser.Scene;
  viewport: ScrollViewport;
  maxScroll: number;
  getScroll: () => number;
  setScroll: (value: number) => void;
  threshold?: number;
}

type InteractiveGameObject = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.Transform & {
    height: number;
    input?: Phaser.Types.Input.InteractiveObject | null;
    setInteractive: (...args: Parameters<Phaser.GameObjects.GameObject['setInteractive']>) => Phaser.GameObjects.GameObject;
  };

export function isDragScrollGesture(deltaY: number, threshold = DRAG_SCROLL_THRESHOLD_PX): boolean {
  return Math.abs(deltaY) > threshold;
}

export function clampScroll(value: number, maxScroll: number): number {
  return Math.min(Math.max(value, 0), Math.max(0, maxScroll));
}

export function createDragScrollArea(options: DragScrollAreaOptions): {
  bindDragTarget: (target: Phaser.GameObjects.GameObject) => void;
  bindScrollableTapTarget: (target: Phaser.GameObjects.GameObject, onTap: () => void) => void;
  updateScrollableItemInputs: (content: Phaser.GameObjects.Container, targets: readonly InteractiveGameObject[]) => void;
} {
  const threshold = options.threshold ?? DRAG_SCROLL_THRESHOLD_PX;
  let activePointerId: number | null = null;
  let startY = 0;
  let startScroll = 0;
  let dragging = false;

  const begin = (pointer: Phaser.Input.Pointer): void => {
    activePointerId = pointer.id;
    startY = pointer.worldY;
    startScroll = options.getScroll();
    dragging = false;
  };

  const move = (pointer: Phaser.Input.Pointer): void => {
    if (activePointerId !== pointer.id || options.maxScroll <= 0) {
      return;
    }

    const deltaY = pointer.worldY - startY;

    if (!dragging && isDragScrollGesture(deltaY, threshold)) {
      dragging = true;
    }

    if (dragging) {
      options.setScroll(startScroll - deltaY);
    }
  };

  const finish = (pointer: Phaser.Input.Pointer): boolean => {
    if (activePointerId !== pointer.id) {
      return false;
    }

    const wasDragging = dragging;
    activePointerId = null;
    dragging = false;

    return wasDragging;
  };

  const canTap = (pointer: Phaser.Input.Pointer): boolean => {
    return !dragging && isPointerInsideViewport(pointer, options.viewport);
  };

  const bindDragTarget = (target: Phaser.GameObjects.GameObject): void => {
    target.on('pointerdown', begin);
    target.on('pointermove', move);
    target.on('pointerup', finish);
    target.on('pointerupoutside', finish);
  };

  const bindScrollableTapTarget = (target: Phaser.GameObjects.GameObject, onTap: () => void): void => {
    target.on('pointerdown', begin);
    target.on('pointermove', move);
    target.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const startedInsideThisArea = activePointerId === pointer.id;
      const shouldTap = startedInsideThisArea && canTap(pointer);
      const wasDragging = finish(pointer);

      if (shouldTap && !wasDragging) {
        onTap();
      }
    });
    target.on('pointerupoutside', finish);
  };

  const updateScrollableItemInputs = (
    content: Phaser.GameObjects.Container,
    targets: readonly InteractiveGameObject[]
  ): void => {
    targets.forEach((target) => {
      const input = target.input;

      if (input === undefined || input === null) {
        return;
      }

      const itemHeight = target.height || 0;
      const itemTop = content.y + target.y - itemHeight / 2;
      const itemBottom = itemTop + itemHeight;
      input.enabled = itemBottom > options.viewport.y && itemTop < options.viewport.y + options.viewport.height;
    });
  };

  options.scene.events.once('shutdown', () => {
    activePointerId = null;
  });

  return {
    bindDragTarget,
    bindScrollableTapTarget,
    updateScrollableItemInputs
  };
}

function isPointerInsideViewport(pointer: Phaser.Input.Pointer, viewport: ScrollViewport): boolean {
  const insideY = pointer.worldY >= viewport.y && pointer.worldY <= viewport.y + viewport.height;

  if (viewport.x === undefined || viewport.width === undefined) {
    return insideY;
  }

  return insideY && pointer.worldX >= viewport.x && pointer.worldX <= viewport.x + viewport.width;
}

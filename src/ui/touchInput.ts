import Phaser from 'phaser';

export const MIN_TOUCH_TARGET_SIZE = 44;

export type TouchTargetSize = {
  width: number;
  height: number;
};

export function getTouchTargetSize(width: number, height: number): TouchTargetSize {
  return {
    width: Math.max(width, MIN_TOUCH_TARGET_SIZE),
    height: Math.max(height, MIN_TOUCH_TARGET_SIZE)
  };
}

type InteractiveGameObject = Phaser.GameObjects.GameObject & {
  input?: Phaser.Types.Input.InteractiveObject | null;
  setInteractive: (...args: any[]) => Phaser.GameObjects.GameObject;
};

export function setTouchFriendlyInteractive<T extends InteractiveGameObject>(
  target: T,
  width: number,
  height: number,
  options: { minWidth?: number; minHeight?: number; useHandCursor?: boolean } = {}
): T {
  const hitArea = {
    width: Math.max(width, options.minWidth ?? MIN_TOUCH_TARGET_SIZE),
    height: Math.max(height, options.minHeight ?? MIN_TOUCH_TARGET_SIZE)
  };

  target.setInteractive(
    new Phaser.Geom.Rectangle(-hitArea.width / 2, -hitArea.height / 2, hitArea.width, hitArea.height),
    Phaser.Geom.Rectangle.Contains
  );

  if (options.useHandCursor !== false && target.input != null) {
    target.input.cursor = 'pointer';
  }

  return target;
}

export function createTouchHitArea(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { useHandCursor?: boolean } = {}
): Phaser.GameObjects.Rectangle {
  const hitArea = getTouchTargetSize(width, height);
  const target = scene.add.rectangle(x, y, hitArea.width, hitArea.height, 0xffffff, 0.01);

  target.setInteractive({ useHandCursor: options.useHandCursor !== false });

  return target;
}

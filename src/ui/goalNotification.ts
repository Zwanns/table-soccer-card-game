import Phaser from 'phaser';
import { selectRandomAvailableTextureKey, type RandomSource } from './textureSelection';

export type GoalNotificationTone = 'goal';
export interface GoalNotificationOptions {
  random?: RandomSource;
}

export const GOAL_NOTIFICATION_MESSAGE = 'GOAL!!';
export const GOAL_NOTIFICATION_DEPTH = 3000;
export const GOAL_NOTIFICATION_OFFSET_Y = -40;
export const GOAL_NOTIFICATION_GOALKEEPER_TEXTURE_KEY = 'gk-goals';
export const GOAL_NOTIFICATION_GOALKEEPER_TEXTURE_KEYS = [
  GOAL_NOTIFICATION_GOALKEEPER_TEXTURE_KEY,
  'gk-goals-2',
  'gk-goals-3',
  'gk-goals-4',
  'gk-goals-5'
] as const;
export const GOAL_NOTIFICATION_IMAGE_DEPTH = 0;
export const GOAL_NOTIFICATION_TEXT_DEPTH = 1;
export const GOAL_NOTIFICATION_IMAGE_SCALE_RATIO = 1.16;
export const GOAL_NOTIFICATION_IMAGE_ALPHA = 0.94;
export const GOAL_NOTIFICATION_STYLE = {
  color: '#f0c95a',
  fadeDelay: 520,
  fadeDistanceY: 82,
  fadeDuration: 1900,
  fontFamily: 'Bangers, Arial, sans-serif',
  fontSize: '88px',
  fontStyle: '700',
  paddingX: 28,
  paddingY: 14,
  popDuration: 220,
  startScale: 0.82,
  targetScale: 1.08,
  stroke: '#123b2a',
  strokeThickness: 5
} as const;

export function showGoalNotification(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message = GOAL_NOTIFICATION_MESSAGE,
  onComplete?: () => void,
  options: GoalNotificationOptions = {}
): Phaser.GameObjects.Container {
  const notification = scene.add
    .container(x, y)
    .setDepth(GOAL_NOTIFICATION_DEPTH)
    .setAlpha(0)
    .setScale(GOAL_NOTIFICATION_STYLE.startScale);

  const text = scene.add
    .text(0, 0, message, {
      color: GOAL_NOTIFICATION_STYLE.color,
      fontFamily: GOAL_NOTIFICATION_STYLE.fontFamily,
      fontSize: GOAL_NOTIFICATION_STYLE.fontSize,
      fontStyle: GOAL_NOTIFICATION_STYLE.fontStyle,
      stroke: GOAL_NOTIFICATION_STYLE.stroke,
      strokeThickness: GOAL_NOTIFICATION_STYLE.strokeThickness
    })
    .setPadding(
      GOAL_NOTIFICATION_STYLE.paddingX,
      GOAL_NOTIFICATION_STYLE.paddingY,
      GOAL_NOTIFICATION_STYLE.paddingX,
      GOAL_NOTIFICATION_STYLE.paddingY
    )
    .setOrigin(0.5)
    .setDepth(GOAL_NOTIFICATION_TEXT_DEPTH);

  const goalkeeperTextureKey = selectRandomAvailableTextureKey(
    scene,
    GOAL_NOTIFICATION_GOALKEEPER_TEXTURE_KEYS,
    options.random
  );

  if (goalkeeperTextureKey !== null) {
    const image = scene.add
      .image(0, 0, goalkeeperTextureKey)
      .setAlpha(GOAL_NOTIFICATION_IMAGE_ALPHA)
      .setDepth(GOAL_NOTIFICATION_IMAGE_DEPTH);
    const imageSource = scene.textures.get(goalkeeperTextureKey).getSourceImage() as {
      width: number;
      height: number;
    };
    const imageScale = Math.max(
      (text.displayWidth * GOAL_NOTIFICATION_IMAGE_SCALE_RATIO) / imageSource.width,
      (text.displayHeight * GOAL_NOTIFICATION_IMAGE_SCALE_RATIO) / imageSource.height
    );

    image.setDisplaySize(
      imageSource.width * imageScale,
      imageSource.height * imageScale
    );
    notification.add(image);
  }

  notification.add(text);

  scene.tweens.add({
    targets: notification,
    alpha: 1,
    scale: GOAL_NOTIFICATION_STYLE.targetScale,
    duration: GOAL_NOTIFICATION_STYLE.popDuration,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: notification,
        y: notification.y - GOAL_NOTIFICATION_STYLE.fadeDistanceY,
        alpha: 0,
        delay: GOAL_NOTIFICATION_STYLE.fadeDelay,
        duration: GOAL_NOTIFICATION_STYLE.fadeDuration,
        ease: 'Sine.easeOut',
        onComplete: () => {
          notification.destroy();
          onComplete?.();
        }
      });
    }
  });

  return notification;
}

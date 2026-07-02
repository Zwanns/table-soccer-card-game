import Phaser from 'phaser';

export type GoalNotificationTone = 'goal';

export const GOAL_NOTIFICATION_MESSAGE = 'GOAL!!';
export const GOAL_NOTIFICATION_DEPTH = 3000;
export const GOAL_NOTIFICATION_OFFSET_Y = -40;
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
  onComplete?: () => void
): Phaser.GameObjects.Text {
  const text = scene.add
    .text(x, y, message, {
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
    .setDepth(GOAL_NOTIFICATION_DEPTH)
    .setAlpha(0)
    .setScale(GOAL_NOTIFICATION_STYLE.startScale);

  scene.tweens.add({
    targets: text,
    alpha: 1,
    scale: GOAL_NOTIFICATION_STYLE.targetScale,
    duration: GOAL_NOTIFICATION_STYLE.popDuration,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: text,
        y: text.y - GOAL_NOTIFICATION_STYLE.fadeDistanceY,
        alpha: 0,
        delay: GOAL_NOTIFICATION_STYLE.fadeDelay,
        duration: GOAL_NOTIFICATION_STYLE.fadeDuration,
        ease: 'Sine.easeOut',
        onComplete: () => {
          text.destroy();
          onComplete?.();
        }
      });
    }
  });

  return text;
}

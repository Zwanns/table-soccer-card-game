import Phaser from 'phaser';
import { playSoundSafe } from '../audio/playSoundSafe';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getGoalkeeperGoalAnimation } from './goalkeeperGoalAnimation';
import { GOAL_NOTIFICATION_OFFSET_Y, showGoalNotification } from './goalNotification';

export type ShotOutcomeTone = 'goal' | 'post' | 'save';
export type ShotOutcomeEventType = 'GOAL_SCORED' | 'GOALPOST_HIT' | 'GOALKEEPER_SAVE';

export type ShotOutcomeEffectDefinition = {
  type: ShotOutcomeEventType;
  flyingMessage: 'GOAL!!' | 'Post!' | 'Goalkeeper!!';
  flyingMessageTone: ShotOutcomeTone;
  soundKey: 'sound-goal' | 'sound-goalpost' | 'sound-goalkeeper-save';
};

export type ShotOutcomeEffectHandle = {
  destroy: () => void;
};

export type ShotOutcomeEffectOptions = {
  notificationX?: number;
  notificationY?: number;
  ballFxX?: number;
  ballFxY?: number;
  x?: number;
  y?: number;
  impactX?: number;
  impactY?: number;
  depth?: number;
  soundEnabled?: boolean;
  parent?: Phaser.GameObjects.Container;
  showBallPreview?: boolean;
  activeOnLeft?: boolean;
  ballStartX?: number;
  ballStartY?: number;
  ballSize?: number;
  ballTextureKey?: string;
  onComplete?: () => void;
};

export const SHOT_OUTCOME_EFFECT_DEPTH = 3000;
export const SHOT_OUTCOME_MESSAGE_OFFSET_Y = -40;
export const SHOT_OUTCOME_MESSAGE_FONT_SIZE = '48px';
export const SHOT_OUTCOME_MESSAGE_POP_DURATION = 220;
export const SHOT_OUTCOME_MESSAGE_FADE_DELAY = 520;
export const SHOT_OUTCOME_MESSAGE_FADE_DURATION = 1900;
export const SHOT_OUTCOME_MESSAGE_START_SCALE = 0.82;
export const SHOT_OUTCOME_MESSAGE_TARGET_SCALE = 1.08;
export const SHOT_OUTCOME_IMPACT_RADIUS = 20;
export const SHOT_OUTCOME_IMPACT_DURATION = 320;
export const GOALKEEPER_SAVE_NOTIFICATION_TEXTURE_KEY = 'gk-save';
export const GOALKEEPER_SAVE_NOTIFICATION_LINE_1 = 'Goalkeeper';
export const GOALKEEPER_SAVE_NOTIFICATION_LINE_2 = 'SAVE!!';
export const GOALKEEPER_SAVE_NOTIFICATION_GOALKEEPER_FONT_SIZE = 44;
export const GOALKEEPER_SAVE_NOTIFICATION_SAVE_BASE_FONT_SIZE = 64;
export const GOALKEEPER_SAVE_NOTIFICATION_MAX_SAVE_FONT_SIZE = 78;
export const GOALKEEPER_SAVE_NOTIFICATION_SAVE_WIDTH_RATIO = 0.84;
export const GOALKEEPER_SAVE_NOTIFICATION_LINE_GAP = -22;
export const GOALKEEPER_SAVE_NOTIFICATION_IMAGE_SCALE_RATIO = 1.2;
export const GOALKEEPER_SAVE_NOTIFICATION_IMAGE_ALPHA = 0.94;
export const GOALKEEPER_SAVE_NOTIFICATION_IMAGE_DEPTH = 0;
export const GOALKEEPER_SAVE_NOTIFICATION_TEXT_DEPTH = 1;
export const SHOT_OUTCOME_BALL_TEXTURE_KEY = 'turn-ball';
export const SHOT_OUTCOME_BALL_SIZE = 42;
export const SHOT_OUTCOME_BALL_FLIGHT_MS = 320;
export const SHOT_OUTCOME_BALL_GOAL_DISAPPEAR_MS = 300;
export const SHOT_OUTCOME_BALL_SAVE_DEFLECTION_MS = 240;
export const SHOT_OUTCOME_BALL_POST_DEFLECTION_MS = 130;
export const SHOT_OUTCOME_BALL_POST_SETTLE_MS = 250;

export const GOAL_SHOT_OUTCOME_EFFECT = {
  type: 'GOAL_SCORED',
  flyingMessage: 'GOAL!!',
  flyingMessageTone: 'goal',
  soundKey: 'sound-goal'
} as const satisfies ShotOutcomeEffectDefinition;

export const POST_HIT_SHOT_OUTCOME_EFFECT = {
  type: 'GOALPOST_HIT',
  flyingMessage: 'Post!',
  flyingMessageTone: 'post',
  soundKey: 'sound-goalpost'
} as const satisfies ShotOutcomeEffectDefinition;

export const GOALKEEPER_SAVE_SHOT_OUTCOME_EFFECT = {
  type: 'GOALKEEPER_SAVE',
  flyingMessage: 'Goalkeeper!!',
  flyingMessageTone: 'save',
  soundKey: 'sound-goalkeeper-save'
} as const satisfies ShotOutcomeEffectDefinition;

export function createGoalkeeperSaveEffect(
  scene: Phaser.Scene,
  options: ShotOutcomeEffectOptions = {}
): ShotOutcomeEffectHandle {
  return createShotOutcomeEffect(scene, GOALKEEPER_SAVE_SHOT_OUTCOME_EFFECT, options);
}

export function createGoalScoredEffect(
  scene: Phaser.Scene,
  options: ShotOutcomeEffectOptions = {}
): ShotOutcomeEffectHandle {
  return createShotOutcomeEffect(scene, GOAL_SHOT_OUTCOME_EFFECT, options);
}

export function createPostHitEffect(
  scene: Phaser.Scene,
  options: ShotOutcomeEffectOptions = {}
): ShotOutcomeEffectHandle {
  return createShotOutcomeEffect(scene, POST_HIT_SHOT_OUTCOME_EFFECT, options);
}

export function createShotOutcomeEffect(
  scene: Phaser.Scene,
  effect: ShotOutcomeEffectDefinition,
  options: ShotOutcomeEffectOptions = {}
): ShotOutcomeEffectHandle {
  const root = scene.add.container(0, 0).setDepth(options.depth ?? SHOT_OUTCOME_EFFECT_DEPTH);
  const ownedObjects = new Set<Phaser.GameObjects.GameObject>([root]);
  const ownedTweens = new Set<Phaser.Tweens.Tween | Phaser.Tweens.TweenChain>();
  let destroyed = false;

  options.parent?.add(root);

  const destroy = (): void => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    ownedTweens.forEach((tween) => tween.stop());
    ownedTweens.clear();
    ownedObjects.forEach((object) => {
      if (object.active) {
        object.destroy();
      }
    });
    ownedObjects.clear();
  };

  if (options.soundEnabled !== false) {
    playSoundSafe(scene, effect.soundKey, { volume: 0.72 });
  }

  const notificationX = options.notificationX ?? options.x ?? SCENE_WIDTH / 2;
  const notificationY = options.notificationY ?? options.y ?? SCENE_HEIGHT / 2;
  const ballFxX = options.ballFxX ?? options.impactX;
  const ballFxY = options.ballFxY ?? options.impactY;

  if (effect.flyingMessageTone === 'goal') {
    const notification = showGoalNotification(scene, notificationX, notificationY + GOAL_NOTIFICATION_OFFSET_Y, effect.flyingMessage, () => {
      if (!destroyed) {
        options.onComplete?.();
      }
    });
    ownedObjects.add(notification);
    root.add(notification);
  } else if (effect.flyingMessageTone === 'save') {
    createGoalkeeperSaveNotification(scene, root, ownedObjects, ownedTweens, notificationX, notificationY, () => {
      if (!destroyed) {
        options.onComplete?.();
      }
    });
  } else {
    createShotOutcomeMessage(scene, root, ownedObjects, ownedTweens, effect, notificationX, notificationY, () => {
      if (!destroyed) {
        options.onComplete?.();
      }
    });
  }

  if (ballFxX !== undefined && ballFxY !== undefined) {
    createShotOutcomeImpactPulse(scene, root, ownedObjects, ownedTweens, effect.flyingMessageTone, ballFxX, ballFxY);
    createShotOutcomePreviewBall(scene, root, ownedObjects, ownedTweens, effect.flyingMessageTone, {
      ...options,
      ballFxX,
      ballFxY
    });
  }

  return { destroy };
}

export function getGoalkeeperShotSaveDeflection(
  target: { x: number; y: number },
  activeOnLeft: boolean
): { x: number; y: number } {
  return {
    x: target.x + (activeOnLeft ? -155 : 155),
    y: target.y + 104
  };
}

export function getGoalkeeperShotPostForwardDeflection(
  target: { x: number; y: number },
  activeOnLeft: boolean
): { x: number; y: number } {
  return {
    x: target.x + (activeOnLeft ? -190 : 190),
    y: target.y - 64
  };
}

export function getGoalkeeperSaveMatchedFontSize(goalkeeperWidth: number, saveWidth: number): number {
  if (goalkeeperWidth <= 0 || saveWidth <= 0) {
    return GOALKEEPER_SAVE_NOTIFICATION_SAVE_BASE_FONT_SIZE;
  }

  return Math.min(
    GOALKEEPER_SAVE_NOTIFICATION_MAX_SAVE_FONT_SIZE,
    Math.round(GOALKEEPER_SAVE_NOTIFICATION_SAVE_BASE_FONT_SIZE * (goalkeeperWidth / saveWidth) * GOALKEEPER_SAVE_NOTIFICATION_SAVE_WIDTH_RATIO)
  );
}

function createShotOutcomeMessage(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  ownedObjects: Set<Phaser.GameObjects.GameObject>,
  ownedTweens: Set<Phaser.Tweens.Tween | Phaser.Tweens.TweenChain>,
  effect: ShotOutcomeEffectDefinition,
  x: number,
  y: number,
  onComplete: () => void
): void {
  const color = effect.flyingMessageTone === 'post' ? '#f0c95a' : '#ffffff';
  const textPadding = effect.flyingMessageTone === 'save' ? 28 : 14;
  const text = scene.add
    .text(x, y + SHOT_OUTCOME_MESSAGE_OFFSET_Y, effect.flyingMessage, {
      color,
      fontFamily: effect.flyingMessageTone === 'save' ? 'Bangers, Arial, sans-serif' : 'Arial, sans-serif',
      fontSize: SHOT_OUTCOME_MESSAGE_FONT_SIZE,
      fontStyle: '700',
      stroke: '#123b2a',
      strokeThickness: 5
    })
    .setPadding(textPadding, textPadding / 2, textPadding, textPadding / 2)
    .setOrigin(0.5)
    .setDepth(SHOT_OUTCOME_EFFECT_DEPTH)
    .setAlpha(0)
    .setScale(SHOT_OUTCOME_MESSAGE_START_SCALE);

  ownedObjects.add(text);
  root.add(text);

  const startFadeTween = (): void => {
    const fadeTween = scene.tweens.add({
      targets: text,
      y: text.y - 82,
      alpha: 0,
      delay: SHOT_OUTCOME_MESSAGE_FADE_DELAY,
      duration: SHOT_OUTCOME_MESSAGE_FADE_DURATION,
      ease: 'Sine.easeOut',
      onComplete: () => {
        ownedTweens.delete(fadeTween);
        text.destroy();
        ownedObjects.delete(text);
        onComplete();
      }
    });
    ownedTweens.add(fadeTween);
  };

  const popTween = scene.tweens.add({
    targets: text,
    alpha: 1,
    scale: SHOT_OUTCOME_MESSAGE_TARGET_SCALE,
    duration: SHOT_OUTCOME_MESSAGE_POP_DURATION,
    ease: 'Back.easeOut',
    onComplete: () => {
      ownedTweens.delete(popTween);
      startFadeTween();
    }
  });
  ownedTweens.add(popTween);
}

function createGoalkeeperSaveNotification(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  ownedObjects: Set<Phaser.GameObjects.GameObject>,
  ownedTweens: Set<Phaser.Tweens.Tween | Phaser.Tweens.TweenChain>,
  x: number,
  y: number,
  onComplete: () => void
): void {
  const notification = scene.add.container(x, y + SHOT_OUTCOME_MESSAGE_OFFSET_Y);
  notification.setDepth(SHOT_OUTCOME_EFFECT_DEPTH);
  notification.setAlpha(0);
  notification.setScale(SHOT_OUTCOME_MESSAGE_START_SCALE);

  const goalkeeperText = scene.add
    .text(0, 0, GOALKEEPER_SAVE_NOTIFICATION_LINE_1, {
      color: '#ffffff',
      fontFamily: 'Bangers, Arial, sans-serif',
      fontSize: `${GOALKEEPER_SAVE_NOTIFICATION_GOALKEEPER_FONT_SIZE}px`,
      fontStyle: '700',
      stroke: '#123b2a',
      strokeThickness: 5
    })
    .setPadding(18, 8, 18, 8)
    .setOrigin(0.5)
    .setDepth(GOALKEEPER_SAVE_NOTIFICATION_TEXT_DEPTH);

  const saveText = scene.add
    .text(0, 0, GOALKEEPER_SAVE_NOTIFICATION_LINE_2, {
      color: '#ffffff',
      fontFamily: 'Bangers, Arial, sans-serif',
      fontSize: `${GOALKEEPER_SAVE_NOTIFICATION_SAVE_BASE_FONT_SIZE}px`,
      fontStyle: '700',
      stroke: '#123b2a',
      strokeThickness: 6
    })
    .setPadding(18, 8, 18, 8)
    .setOrigin(0.5)
    .setDepth(GOALKEEPER_SAVE_NOTIFICATION_TEXT_DEPTH);

  matchGoalkeeperSaveTextWidths(goalkeeperText, saveText);
  layoutGoalkeeperSaveText(goalkeeperText, saveText);

  const image = createGoalkeeperSaveNotificationImage(scene, goalkeeperText, saveText);

  if (image !== null) {
    notification.add(image);
  }

  notification.add([goalkeeperText, saveText]);
  ownedObjects.add(notification);
  root.add(notification);

  const startFadeTween = (): void => {
    const fadeTween = scene.tweens.add({
      targets: notification,
      y: notification.y - 82,
      alpha: 0,
      delay: SHOT_OUTCOME_MESSAGE_FADE_DELAY,
      duration: SHOT_OUTCOME_MESSAGE_FADE_DURATION,
      ease: 'Sine.easeOut',
      onComplete: () => {
        ownedTweens.delete(fadeTween);
        notification.destroy();
        ownedObjects.delete(notification);
        onComplete();
      }
    });
    ownedTweens.add(fadeTween);
  };

  const popTween = scene.tweens.add({
    targets: notification,
    alpha: 1,
    scale: SHOT_OUTCOME_MESSAGE_TARGET_SCALE,
    duration: SHOT_OUTCOME_MESSAGE_POP_DURATION,
    ease: 'Back.easeOut',
    onComplete: () => {
      ownedTweens.delete(popTween);
      startFadeTween();
    }
  });
  ownedTweens.add(popTween);
}

function matchGoalkeeperSaveTextWidths(
  goalkeeperText: Phaser.GameObjects.Text,
  saveText: Phaser.GameObjects.Text
): void {
  const goalkeeperWidth = goalkeeperText.displayWidth;
  const saveWidth = saveText.displayWidth;

  if (goalkeeperWidth <= 0 || saveWidth <= 0) {
    return;
  }

  const matchedFontSize = getGoalkeeperSaveMatchedFontSize(goalkeeperWidth, saveWidth);

  saveText.setFontSize(matchedFontSize);
}

function layoutGoalkeeperSaveText(
  goalkeeperText: Phaser.GameObjects.Text,
  saveText: Phaser.GameObjects.Text
): void {
  const totalTextHeight =
    goalkeeperText.displayHeight + GOALKEEPER_SAVE_NOTIFICATION_LINE_GAP + saveText.displayHeight;

  goalkeeperText.setY(-totalTextHeight / 2 + goalkeeperText.displayHeight / 2);
  saveText.setY(totalTextHeight / 2 - saveText.displayHeight / 2);
}

function createGoalkeeperSaveNotificationImage(
  scene: Phaser.Scene,
  goalkeeperText: Phaser.GameObjects.Text,
  saveText: Phaser.GameObjects.Text
): Phaser.GameObjects.Image | null {
  if (!scene.textures.exists(GOALKEEPER_SAVE_NOTIFICATION_TEXTURE_KEY)) {
    return null;
  }

  const image = scene.add.image(0, 0, GOALKEEPER_SAVE_NOTIFICATION_TEXTURE_KEY);
  const imageSource = scene.textures.get(GOALKEEPER_SAVE_NOTIFICATION_TEXTURE_KEY).getSourceImage() as {
    width: number;
    height: number;
  };
  const textWidth = Math.max(goalkeeperText.displayWidth, saveText.displayWidth);
  const textHeight =
    goalkeeperText.displayHeight + GOALKEEPER_SAVE_NOTIFICATION_LINE_GAP + saveText.displayHeight;
  const imageScale = Math.max(
    (textWidth * GOALKEEPER_SAVE_NOTIFICATION_IMAGE_SCALE_RATIO) / imageSource.width,
    (textHeight * GOALKEEPER_SAVE_NOTIFICATION_IMAGE_SCALE_RATIO) / imageSource.height
  );

  image.setDisplaySize(imageSource.width * imageScale, imageSource.height * imageScale);
  image.setAlpha(GOALKEEPER_SAVE_NOTIFICATION_IMAGE_ALPHA);
  image.setDepth(GOALKEEPER_SAVE_NOTIFICATION_IMAGE_DEPTH);

  return image;
}

function createShotOutcomeImpactPulse(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  ownedObjects: Set<Phaser.GameObjects.GameObject>,
  ownedTweens: Set<Phaser.Tweens.Tween | Phaser.Tweens.TweenChain>,
  tone: ShotOutcomeTone,
  x: number,
  y: number
): void {
  const color = tone === 'save' ? 0xffffff : tone === 'post' ? 0xf0c95a : 0x93f0b2;
  const pulse = scene.add.circle(x, y, SHOT_OUTCOME_IMPACT_RADIUS, color, 0.2);
  pulse.setStrokeStyle(4, color, 0.86);

  ownedObjects.add(pulse);
  root.add(pulse);

  const pulseTween = scene.tweens.add({
    targets: pulse,
    scale: tone === 'goal' ? 2.4 : 1.8,
    alpha: 0,
    duration: SHOT_OUTCOME_IMPACT_DURATION,
    ease: 'Sine.easeOut',
    onComplete: () => {
      ownedTweens.delete(pulseTween);
      pulse.destroy();
      ownedObjects.delete(pulse);
    }
  });
  ownedTweens.add(pulseTween);
}

function createShotOutcomePreviewBall(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  ownedObjects: Set<Phaser.GameObjects.GameObject>,
  ownedTweens: Set<Phaser.Tweens.Tween | Phaser.Tweens.TweenChain>,
  tone: ShotOutcomeTone,
  options: ShotOutcomeEffectOptions
): void {
  if (options.showBallPreview !== true || options.ballFxX === undefined || options.ballFxY === undefined) {
    return;
  }

  const textureKey = options.ballTextureKey ?? SHOT_OUTCOME_BALL_TEXTURE_KEY;

  if (!scene.textures.exists(textureKey)) {
    return;
  }

  const activeOnLeft = options.activeOnLeft ?? true;
  const target = { x: options.ballFxX, y: options.ballFxY };
  const ball = scene.add.image(
    options.ballStartX ?? target.x + (activeOnLeft ? -180 : 180),
    options.ballStartY ?? target.y + 112,
    textureKey
  );
  ball.setDisplaySize(options.ballSize ?? SHOT_OUTCOME_BALL_SIZE, options.ballSize ?? SHOT_OUTCOME_BALL_SIZE);
  ball.setDepth(SHOT_OUTCOME_EFFECT_DEPTH + 1);
  ownedObjects.add(ball);
  root.add(ball);

  const baseScaleX = ball.scaleX;
  const baseScaleY = ball.scaleY;
  const rotationSign = activeOnLeft ? 1 : -1;

  const flightTween = scene.tweens.add({
    targets: ball,
    x: target.x,
    y: target.y,
    angle: rotationSign * 360,
    duration: SHOT_OUTCOME_BALL_FLIGHT_MS,
    ease: 'Sine.easeInOut',
    onComplete: () => {
      ownedTweens.delete(flightTween);
      if (tone === 'goal') {
        animateShotOutcomeGoalPreviewBall(scene, ball, ownedObjects, ownedTweens, target, activeOnLeft, baseScaleX, baseScaleY);
        return;
      }

      if (tone === 'save') {
        animateShotOutcomeSavePreviewBall(scene, ball, ownedObjects, ownedTweens, target, activeOnLeft, baseScaleX, baseScaleY);
        return;
      }

      animateShotOutcomePostPreviewBall(scene, ball, ownedObjects, ownedTweens, target, activeOnLeft, baseScaleX, baseScaleY);
    }
  });
  ownedTweens.add(flightTween);
}

function animateShotOutcomeGoalPreviewBall(
  scene: Phaser.Scene,
  ball: Phaser.GameObjects.Image,
  ownedObjects: Set<Phaser.GameObjects.GameObject>,
  ownedTweens: Set<Phaser.Tweens.Tween | Phaser.Tweens.TweenChain>,
  target: { x: number; y: number },
  activeOnLeft: boolean,
  baseScaleX: number,
  baseScaleY: number
): void {
  const goalAnimation = getGoalkeeperGoalAnimation(target, activeOnLeft ? 'right' : 'left');
  const tween = scene.tweens.add({
    targets: ball,
    x: goalAnimation.target.x,
    y: goalAnimation.target.y,
    angle: ball.angle + goalAnimation.angle,
    alpha: goalAnimation.alpha,
    scaleX: baseScaleX * goalAnimation.scale,
    scaleY: baseScaleY * goalAnimation.scale,
    duration: SHOT_OUTCOME_BALL_GOAL_DISAPPEAR_MS,
    ease: goalAnimation.ease,
    onComplete: () => {
      ownedTweens.delete(tween);
      ball.destroy();
      ownedObjects.delete(ball);
    }
  });
  ownedTweens.add(tween);
}

function animateShotOutcomeSavePreviewBall(
  scene: Phaser.Scene,
  ball: Phaser.GameObjects.Image,
  ownedObjects: Set<Phaser.GameObjects.GameObject>,
  ownedTweens: Set<Phaser.Tweens.Tween | Phaser.Tweens.TweenChain>,
  target: { x: number; y: number },
  activeOnLeft: boolean,
  baseScaleX: number,
  baseScaleY: number
): void {
  const deflection = getGoalkeeperShotSaveDeflection(target, activeOnLeft);
  const rotationSign = activeOnLeft ? -1 : 1;
  const tween = scene.tweens.add({
    targets: ball,
    x: deflection.x,
    y: deflection.y,
    angle: ball.angle + rotationSign * 420,
    alpha: 0,
    scaleX: baseScaleX * 0.45,
    scaleY: baseScaleY * 0.45,
    duration: SHOT_OUTCOME_BALL_SAVE_DEFLECTION_MS,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      ownedTweens.delete(tween);
      ball.destroy();
      ownedObjects.delete(ball);
    }
  });
  ownedTweens.add(tween);
}

function animateShotOutcomePostPreviewBall(
  scene: Phaser.Scene,
  ball: Phaser.GameObjects.Image,
  ownedObjects: Set<Phaser.GameObjects.GameObject>,
  ownedTweens: Set<Phaser.Tweens.Tween | Phaser.Tweens.TweenChain>,
  target: { x: number; y: number },
  activeOnLeft: boolean,
  baseScaleX: number,
  baseScaleY: number
): void {
  const deflection = getGoalkeeperShotPostForwardDeflection(target, activeOnLeft);
  const settle = {
    x: deflection.x + (activeOnLeft ? -88 : 88),
    y: deflection.y - 28
  };
  const rotationSign = activeOnLeft ? 1 : -1;
  const chain = scene.tweens.chain({
    targets: ball,
    tweens: [
      {
        x: deflection.x,
        y: deflection.y,
        angle: ball.angle + rotationSign * 520,
        scaleX: baseScaleX * 0.9,
        scaleY: baseScaleY * 0.9,
        duration: SHOT_OUTCOME_BALL_POST_DEFLECTION_MS,
        ease: 'Cubic.easeOut'
      },
      {
        x: settle.x,
        y: settle.y,
        angle: ball.angle + rotationSign * 760,
        alpha: 0,
        scaleX: baseScaleX * 0.5,
        scaleY: baseScaleY * 0.5,
        duration: SHOT_OUTCOME_BALL_POST_SETTLE_MS,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          ownedTweens.delete(chain);
          ball.destroy();
          ownedObjects.delete(ball);
        }
      }
    ]
  });
  ownedTweens.add(chain);
}

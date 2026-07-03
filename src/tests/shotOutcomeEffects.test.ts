import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GOALKEEPER_SAVE_SHOT_OUTCOME_EFFECT,
  GOAL_SHOT_OUTCOME_EFFECT,
  POST_HIT_SHOT_OUTCOME_EFFECT,
  getGoalkeeperShotPostForwardDeflection,
  getGoalkeeperShotSaveDeflection
} from '../ui/shotOutcomeEffects';

function normalizeSourceLineEndings(source: string): string {
  return source.replace(/\r\n/g, '\n');
}

function readSource(relativePath: string): string {
  return normalizeSourceLineEndings(readFileSync(join(process.cwd(), relativePath), 'utf8'));
}

describe('shared shot outcome effects', () => {
  it('keeps goal, save and post effect definitions aligned with real match sounds', () => {
    expect(GOAL_SHOT_OUTCOME_EFFECT).toEqual({
      type: 'GOAL_SCORED',
      flyingMessage: 'GOAL!!',
      flyingMessageTone: 'goal',
      soundKey: 'sound-goal'
    });
    expect(GOALKEEPER_SAVE_SHOT_OUTCOME_EFFECT).toEqual({
      type: 'GOALKEEPER_SAVE',
      flyingMessage: 'Goalkeeper!!',
      flyingMessageTone: 'save',
      soundKey: 'sound-goalkeeper-save'
    });
    expect(POST_HIT_SHOT_OUTCOME_EFFECT).toEqual({
      type: 'GOALPOST_HIT',
      flyingMessage: 'Post!',
      flyingMessageTone: 'post',
      soundKey: 'sound-goalpost'
    });
  });

  it('uses safe sound playback and exposes cleanup for preview callers', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');

    expect(helperSource).toContain("import { playSoundSafe } from '../audio/playSoundSafe'");
    expect(helperSource).toContain('if (options.soundEnabled !== false) {');
    expect(helperSource).toContain('playSoundSafe(scene, effect.soundKey, { volume: 0.72 });');
    expect(helperSource).toContain('export type ShotOutcomeEffectHandle = {');
    expect(helperSource).toContain('destroy: () => void;');
    expect(helperSource).toContain('ownedTweens.forEach((tween) => tween.stop());');
    expect(helperSource).toContain('ownedObjects.forEach((object) => {');
  });

  it('uses safe texture fallback through the shared goal notification for goal outcomes', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');
    const notificationSource = readSource('src/ui/goalNotification.ts');

    expect(helperSource).toContain("import { GOAL_NOTIFICATION_OFFSET_Y, showGoalNotification } from './goalNotification'");
    expect(helperSource).toContain(
      'showGoalNotification(scene, notificationX, notificationY + GOAL_NOTIFICATION_OFFSET_Y, effect.flyingMessage'
    );
    expect(notificationSource).toContain('scene.textures.exists(GOAL_NOTIFICATION_GOALKEEPER_TEXTURE_KEY)');
  });

  it('supports separate notification and ball FX anchors', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');

    expect(helperSource).toContain('notificationX?: number;');
    expect(helperSource).toContain('notificationY?: number;');
    expect(helperSource).toContain('ballFxX?: number;');
    expect(helperSource).toContain('ballFxY?: number;');
    expect(helperSource).toContain('const notificationX = options.notificationX ?? options.x ?? SCENE_WIDTH / 2;');
    expect(helperSource).toContain('const notificationY = options.notificationY ?? options.y ?? SCENE_HEIGHT / 2;');
    expect(helperSource).toContain('const ballFxX = options.ballFxX ?? options.impactX;');
    expect(helperSource).toContain('const ballFxY = options.ballFxY ?? options.impactY;');
    expect(helperSource).toContain('createShotOutcomeImpactPulse(scene, root, ownedObjects, ownedTweens, effect.flyingMessageTone, ballFxX, ballFxY);');
    expect(helperSource).toContain('const target = { x: options.ballFxX, y: options.ballFxY };');
  });

  it('exports the real goalkeeper shot deflection formulas for GameScene and Dev Lab', () => {
    expect(getGoalkeeperShotSaveDeflection({ x: 800, y: 360 }, true)).toEqual({ x: 645, y: 464 });
    expect(getGoalkeeperShotSaveDeflection({ x: 800, y: 360 }, false)).toEqual({ x: 955, y: 464 });
    expect(getGoalkeeperShotPostForwardDeflection({ x: 800, y: 360 }, true)).toEqual({ x: 610, y: 296 });
    expect(getGoalkeeperShotPostForwardDeflection({ x: 800, y: 360 }, false)).toEqual({ x: 990, y: 296 });
  });

  it('previews the ball deflection only when the existing turn-ball texture is available', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');
    const devLabSource = readSource('src/scenes/DevLabScene.ts');

    expect(helperSource).toContain("export const SHOT_OUTCOME_BALL_TEXTURE_KEY = 'turn-ball'");
    expect(helperSource).toContain('if (!scene.textures.exists(textureKey)) {');
    expect(helperSource).toContain('return;');
    expect(helperSource).toContain('options.showBallPreview !== true');
    expect(helperSource).toContain('animateShotOutcomeGoalPreviewBall(');
    expect(helperSource).toContain('getGoalkeeperGoalAnimation(target, activeOnLeft ? \'right\' : \'left\')');
    expect(helperSource).toContain('getGoalkeeperShotSaveDeflection(target, activeOnLeft)');
    expect(helperSource).toContain('getGoalkeeperShotPostForwardDeflection(target, activeOnLeft)');
    expect(devLabSource).toContain('showBallPreview: true');
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GOALKEEPER_SAVE_SHOT_OUTCOME_EFFECT,
  GOAL_SHOT_OUTCOME_EFFECT,
  POST_HIT_SHOT_OUTCOME_EFFECT,
  GOALKEEPER_SAVE_NOTIFICATION_GOALKEEPER_FONT_SIZE,
  GOALKEEPER_SAVE_NOTIFICATION_IMAGE_DEPTH,
  GOALKEEPER_SAVE_NOTIFICATION_LINE_1,
  GOALKEEPER_SAVE_NOTIFICATION_LINE_2,
  GOALKEEPER_SAVE_NOTIFICATION_SAVE_BASE_FONT_SIZE,
  GOALKEEPER_SAVE_NOTIFICATION_TEXT_DEPTH,
  GOALKEEPER_SAVE_NOTIFICATION_TEXTURE_KEYS,
  POST_HIT_NOTIFICATION_FONT_SIZE,
  POST_HIT_NOTIFICATION_TEXT,
  POST_HIT_NOTIFICATION_TEXTURE_KEYS,
  SHOT_OUTCOME_MESSAGE_FONT_SIZE,
  getGoalkeeperSaveMatchedFontSize,
  getGoalkeeperShotPostForwardDeflection,
  getGoalkeeperShotSaveDeflection
} from '../ui/shotOutcomeEffects';
import {
  EVENT_ARTWORK_SOURCE_SIZE,
  EVENT_ARTWORK_TARGET_SIZE,
  getEventArtworkScale
} from '../ui/eventArtwork';

function normalizeSourceLineEndings(source: string): string {
  return source.replace(/\r\n/g, '\n');
}

function readSource(relativePath: string): string {
  return normalizeSourceLineEndings(readFileSync(join(process.cwd(), relativePath), 'utf8'));
}

describe('shared shot outcome effects', () => {
  const previousEventArtworkTargetSize = 292;
  const enlargedEventArtworkTargetSize = previousEventArtworkTargetSize * 1.25;

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

  it('builds the updated two-line goalkeeper save notification with image fallback', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');

    expect(GOALKEEPER_SAVE_NOTIFICATION_LINE_1).toBe('Goalkeeper');
    expect(GOALKEEPER_SAVE_NOTIFICATION_LINE_2).toBe('SAVE!!');
    expect(helperSource).toContain('function createGoalkeeperSaveNotification(');
    expect(helperSource).toContain('createGoalkeeperSaveNotification(scene, root, ownedObjects, ownedTweens, notificationX, notificationY');
    expect(helperSource).toContain('text(0, 0, GOALKEEPER_SAVE_NOTIFICATION_LINE_1');
    expect(helperSource).toContain('text(0, 0, GOALKEEPER_SAVE_NOTIFICATION_LINE_2');
    expect(helperSource).toContain('saveText.setY(totalTextHeight / 2 - saveText.displayHeight / 2);');
    expect(helperSource).toContain('selectRandomAvailableTextureKey(');
    expect(helperSource).toContain('GOALKEEPER_SAVE_NOTIFICATION_TEXTURE_KEYS');
    expect(helperSource).toContain('if (goalkeeperTextureKey === null) {');
    expect(helperSource).toContain('return null;');
    expect(helperSource).toContain('notification.add([goalkeeperText, saveText]);');
  });

  it('selects goalkeeper save artwork from the five-key pool through the shared helper', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');

    expect(GOALKEEPER_SAVE_NOTIFICATION_TEXTURE_KEYS).toEqual([
      'gk-save',
      'gk-save-2',
      'gk-save-3',
      'gk-save-4',
      'gk-save-5'
    ]);
    expect(helperSource).toContain("import { selectRandomAvailableTextureKey, type RandomSource } from './textureSelection'");
    expect(helperSource).toContain('random?: RandomSource;');
    expect(helperSource).toContain('GOALKEEPER_SAVE_NOTIFICATION_TEXTURE_KEYS');
    expect(helperSource).toContain('random');
    expect(helperSource).toContain('const image = scene.add.image(0, 0, goalkeeperTextureKey);');
  });

  it('selects post hit artwork from the two-key pool through the shared helper', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');

    expect(POST_HIT_NOTIFICATION_TEXTURE_KEYS).toEqual(['gk-post-1', 'gk-post-2']);
    expect(helperSource).toContain('function createPostHitNotification(');
    expect(helperSource).toContain('function createPostHitNotificationImage(');
    expect(helperSource).toContain('selectRandomAvailableTextureKey(scene, POST_HIT_NOTIFICATION_TEXTURE_KEYS, random)');
    expect(helperSource).toContain('if (textureKey === null) {');
    expect(helperSource).toContain('return null;');
    expect(helperSource).toContain('createPostHitNotification(scene, root, ownedObjects, ownedTweens, notificationX, notificationY, options.random');
  });

  it('layers the post artwork behind the text and cleans the whole container', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');
    const postBlock = helperSource.slice(
      helperSource.indexOf('function createPostHitNotification('),
      helperSource.indexOf('function createPostHitNotificationImage(')
    );

    expect(postBlock.indexOf('notification.add(image)')).toBeLessThan(postBlock.indexOf('notification.add(text)'));
    expect(postBlock).toContain('targets: notification');
    expect(postBlock).toContain('notification.destroy();');
    expect(postBlock).toContain('ownedObjects.delete(notification);');
  });

  it('uses the save notification style family for the larger Post text', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');
    const postBlock = helperSource.slice(
      helperSource.indexOf('function createPostHitNotification('),
      helperSource.indexOf('function createPostHitNotificationImage(')
    );

    expect(POST_HIT_NOTIFICATION_TEXT).toBe('Post!');
    expect(POST_HIT_NOTIFICATION_FONT_SIZE).toBeGreaterThan(Number.parseInt(SHOT_OUTCOME_MESSAGE_FONT_SIZE, 10));
    expect(postBlock).toContain("fontFamily: 'Bangers, Arial, sans-serif'");
    expect(postBlock).toContain('strokeThickness: 6');
    expect(postBlock).toContain('POST_HIT_NOTIFICATION_FONT_SIZE');
  });

  it('keeps SAVE!! compact by font size instead of horizontal scale', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');
    const goalkeeperWidth = 152;
    const saveBaseWidth = 168;
    const saveFontSize = getGoalkeeperSaveMatchedFontSize(goalkeeperWidth, saveBaseWidth);
    const projectedSaveWidth = saveBaseWidth * (saveFontSize / GOALKEEPER_SAVE_NOTIFICATION_SAVE_BASE_FONT_SIZE);

    expect(GOALKEEPER_SAVE_NOTIFICATION_GOALKEEPER_FONT_SIZE).toBeGreaterThan(0);
    expect(saveFontSize).toBeLessThanOrEqual(GOALKEEPER_SAVE_NOTIFICATION_SAVE_BASE_FONT_SIZE);
    expect(projectedSaveWidth).toBeLessThan(goalkeeperWidth);
    expect(helperSource).toContain('saveText.setFontSize(matchedFontSize);');
    expect(helperSource).not.toContain('saveText.setScaleX');
  });

  it('uses one source-size based enlarged artwork scale contract for goal, save, and post notifications', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');
    const notificationSource = readSource('src/ui/goalNotification.ts');
    const artworkSource = readSource('src/ui/eventArtwork.ts');
    const expectedScale = EVENT_ARTWORK_TARGET_SIZE / EVENT_ARTWORK_SOURCE_SIZE;

    expect(EVENT_ARTWORK_TARGET_SIZE).toBe(enlargedEventArtworkTargetSize);
    expect(getEventArtworkScale({ width: EVENT_ARTWORK_SOURCE_SIZE, height: EVENT_ARTWORK_SOURCE_SIZE })).toBe(expectedScale);
    expect(getEventArtworkScale({ width: EVENT_ARTWORK_SOURCE_SIZE, height: 800 }) * EVENT_ARTWORK_SOURCE_SIZE).toBe(
      EVENT_ARTWORK_TARGET_SIZE
    );
    expect(getEventArtworkScale({ width: 800, height: EVENT_ARTWORK_SOURCE_SIZE }) * EVENT_ARTWORK_SOURCE_SIZE).toBe(
      EVENT_ARTWORK_TARGET_SIZE
    );
    expect(artworkSource).toContain('export const EVENT_ARTWORK_SOURCE_SIZE = 1254');
    expect(artworkSource).toContain('export const EVENT_ARTWORK_TARGET_SIZE = 365');
    expect(notificationSource).toContain('applyEventArtworkDisplaySize(image, imageSource);');
    expect(helperSource.match(/applyEventArtworkDisplaySize\(image, imageSource\);/g)).toHaveLength(2);
    expect(notificationSource).not.toContain('GOAL_NOTIFICATION_IMAGE_SCALE_RATIO');
    expect(helperSource).not.toContain('GOALKEEPER_SAVE_NOTIFICATION_IMAGE_SCALE_RATIO');
  });

  it('layers the save image behind both text lines and cleans the whole container', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');

    expect(GOALKEEPER_SAVE_NOTIFICATION_IMAGE_DEPTH).toBeLessThan(GOALKEEPER_SAVE_NOTIFICATION_TEXT_DEPTH);
    expect(helperSource).toContain('image.setDepth(GOALKEEPER_SAVE_NOTIFICATION_IMAGE_DEPTH);');
    expect(helperSource).toContain('.setDepth(GOALKEEPER_SAVE_NOTIFICATION_TEXT_DEPTH)');
    expect(helperSource.indexOf('notification.add(image)')).toBeLessThan(
      helperSource.indexOf('notification.add([goalkeeperText, saveText])')
    );
    expect(helperSource).toContain('targets: notification');
    expect(helperSource).toContain('notification.destroy();');
    expect(helperSource).toContain('ownedObjects.delete(notification);');
  });

  it('uses safe texture fallback through the shared goal notification for goal outcomes', () => {
    const helperSource = readSource('src/ui/shotOutcomeEffects.ts');
    const notificationSource = readSource('src/ui/goalNotification.ts');

    expect(helperSource).toContain("import { GOAL_NOTIFICATION_OFFSET_Y, showGoalNotification } from './goalNotification'");
    expect(helperSource).toContain('const notification = showGoalNotification(');
    expect(helperSource).toContain('notificationY + GOAL_NOTIFICATION_OFFSET_Y');
    expect(helperSource).toContain('effect.flyingMessage');
    expect(helperSource).toContain('{ random: options.random }');
    expect(notificationSource).toContain('selectRandomAvailableTextureKey(');
    expect(notificationSource).toContain('GOAL_NOTIFICATION_GOALKEEPER_TEXTURE_KEYS');
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

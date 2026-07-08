import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GOAL_NOTIFICATION_GOALKEEPER_TEXTURE_KEYS,
  GOAL_NOTIFICATION_GOALKEEPER_TEXTURE_KEY,
  GOAL_NOTIFICATION_IMAGE_DEPTH,
  GOAL_NOTIFICATION_MESSAGE,
  GOAL_NOTIFICATION_TEXT_DEPTH
} from '../ui/goalNotification';

function normalizeSourceLineEndings(source: string): string {
  return source.replace(/\r\n/g, '\n');
}

function readSource(relativePath: string): string {
  return normalizeSourceLineEndings(readFileSync(join(process.cwd(), relativePath), 'utf8'));
}

describe('shared goal notification artwork', () => {
  it('keeps the legacy goal texture key first in the five-key random pool', () => {
    expect(GOAL_NOTIFICATION_MESSAGE).toBe('GOAL!!');
    expect(GOAL_NOTIFICATION_GOALKEEPER_TEXTURE_KEY).toBe('gk-goals');
    expect(GOAL_NOTIFICATION_GOALKEEPER_TEXTURE_KEYS).toEqual([
      'gk-goals',
      'gk-goals-2',
      'gk-goals-3',
      'gk-goals-4',
      'gk-goals-5'
    ]);
  });

  it('selects available goal artwork through the shared random texture helper', () => {
    const source = readSource('src/ui/goalNotification.ts');

    expect(source).toContain("import { selectRandomAvailableTextureKey, type RandomSource } from './textureSelection'");
    expect(source).toContain('export interface GoalNotificationOptions');
    expect(source).toContain('random?: RandomSource;');
    expect(source).toContain('selectRandomAvailableTextureKey(');
    expect(source).toContain('GOAL_NOTIFICATION_GOALKEEPER_TEXTURE_KEYS');
    expect(source).toContain('options.random');
    expect(source).toContain('if (goalkeeperTextureKey !== null) {');
    expect(source).toContain('scene.add\n      .image(0, 0, goalkeeperTextureKey)');
  });

  it('keeps the goal text above selected artwork and cleans up the shared container', () => {
    const source = readSource('src/ui/goalNotification.ts');

    expect(GOAL_NOTIFICATION_IMAGE_DEPTH).toBeLessThan(GOAL_NOTIFICATION_TEXT_DEPTH);
    expect(source).toContain('.setDepth(GOAL_NOTIFICATION_IMAGE_DEPTH)');
    expect(source).toContain('.setDepth(GOAL_NOTIFICATION_TEXT_DEPTH)');
    expect(source.indexOf('notification.add(image)')).toBeLessThan(source.indexOf('notification.add(text)'));
    expect(source).toContain('targets: notification');
    expect(source).toContain('notification.destroy();');
  });

  it('is shared by GameScene and Dev Lab through shot outcome helpers', () => {
    const devLabSource = readSource('src/scenes/DevLabScene.ts');
    const gameSceneSource = readSource('src/scenes/GameScene.ts');
    const shotOutcomeSource = readSource('src/ui/shotOutcomeEffects.ts');

    expect(gameSceneSource).toContain('showGoalNotification(this, centerX, centerY + GOAL_NOTIFICATION_OFFSET_Y, message, onComplete)');
    expect(devLabSource).toContain('this.previewEffect = createGoalScoredEffect(this, this.createShotOutcomePreviewOptions(layout));');
    expect(devLabSource).not.toContain('showGoalNotification(');
    expect(shotOutcomeSource).toContain('showGoalNotification(');
  });
});

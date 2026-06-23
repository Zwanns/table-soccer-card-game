import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH, TOURNAMENT_ASSETS } from '../config';

const TOURNAMENT_BACKGROUND_FALLBACK_COLOR = 0x123b2a;
const TOURNAMENT_BACKGROUND_DEPTH = -20;

export function createTournamentBackground(
  scene: Phaser.Scene
): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
  if (!scene.textures.exists(TOURNAMENT_ASSETS.background)) {
    return scene.add
      .rectangle(
        SCENE_WIDTH / 2,
        SCENE_HEIGHT / 2,
        SCENE_WIDTH,
        SCENE_HEIGHT,
        TOURNAMENT_BACKGROUND_FALLBACK_COLOR
      )
      .setDepth(TOURNAMENT_BACKGROUND_DEPTH);
  }

  const background = scene.add.image(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, TOURNAMENT_ASSETS.background);
  const coverScale = Math.max(SCENE_WIDTH / background.width, SCENE_HEIGHT / background.height);
  background.setScale(coverScale);
  background.setDepth(TOURNAMENT_BACKGROUND_DEPTH);
  return background;
}

import type Phaser from 'phaser';
import { resolveTeamIdentityVisual } from '../assets/teamIdentity';

// Keep flag fallback proportions while showing logos as squares at the old height.
export function createTeamIdentityImage(
  scene: Phaser.Scene, x: number, y: number, flagCode: string, flagWidth: number, flagHeight: number
): Phaser.GameObjects.Image {
  const visual = resolveTeamIdentityVisual(flagCode, flagWidth, flagHeight, (key) => scene.textures.exists(key));
  return scene.add.image(x, y, visual.key).setDisplaySize(visual.width, visual.height);
}

import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';

export function createTeamFieldBackground(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics();
  const stripeCount = 14;
  const stripeWidth = SCENE_WIDTH / stripeCount;
  const lineColor = 0xe5fff0;

  graphics.fillStyle(0x0f3425, 1);
  graphics.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);

  for (let index = 0; index < stripeCount; index += 1) {
    graphics.fillStyle(index % 2 === 0 ? 0x123b2a : 0x174530, 1);
    graphics.fillRect(index * stripeWidth, 0, stripeWidth + 1, SCENE_HEIGHT);
  }

  graphics.lineStyle(3, lineColor, 0.24);
  graphics.strokeRect(56, 94, SCENE_WIDTH - 112, SCENE_HEIGHT - 158);
  graphics.lineBetween(SCENE_WIDTH / 2, 94, SCENE_WIDTH / 2, SCENE_HEIGHT - 64);
  graphics.strokeCircle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2 + 20, 120);
  graphics.strokeCircle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2 + 20, 5);
  graphics.strokeRect(56, 212, 166, 250);
  graphics.strokeRect(SCENE_WIDTH - 222, 212, 166, 250);
  graphics.strokeRect(56, 272, 66, 130);
  graphics.strokeRect(SCENE_WIDTH - 122, 272, 66, 130);
  graphics.setDepth(-20);
}

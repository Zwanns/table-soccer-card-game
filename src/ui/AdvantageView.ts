import Phaser from 'phaser';
import type { TeamAdvantage } from '../game';

export interface AdvantageViewOptions {
  advantage: TeamAdvantage;
}

export class AdvantageView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, options: AdvantageViewOptions) {
    super(scene, x, y);

    const width = 520;
    const height = 22;
    const trackWidth = 420;
    const trackHeight = 14;
    const playerOneWidth = Math.round(trackWidth * options.advantage.playerOneShare);
    const playerTwoWidth = trackWidth - playerOneWidth;
    const hasPoints = options.advantage.playerOnePoints + options.advantage.playerTwoPoints > 0;

    const background = scene.add.rectangle(0, 0, width, height, 0x08120f, 0.88);
    background.setStrokeStyle(2, 0x436b58, 0.9);

    const track = scene.add.rectangle(0, 0, trackWidth, trackHeight, 0x1a3028, 1);
    track.setStrokeStyle(1, 0x86a995, 0.55);

    const playerOneFill = scene.add.rectangle(
      -trackWidth / 2 + playerOneWidth / 2,
      0,
      Math.max(1, playerOneWidth),
      trackHeight - 2,
      0xd84a3f,
      hasPoints ? 0.96 : 0.35
    );
    const playerTwoFill = scene.add.rectangle(
      trackWidth / 2 - playerTwoWidth / 2,
      0,
      Math.max(1, playerTwoWidth),
      trackHeight - 2,
      0x4da3d9,
      hasPoints ? 0.96 : 0.35
    );

    const splitX = -trackWidth / 2 + playerOneWidth;
    const splitMarker = scene.add.rectangle(splitX, 0, 2, 18, 0xffffff, 0.95);
    const centerMarker = scene.add.rectangle(0, 0, 1, 18, 0xf6e06e, 0.82);

    this.add([background, track, playerOneFill, playerTwoFill, centerMarker, splitMarker]);
    scene.add.existing(this);
  }
}

import Phaser from 'phaser';
import type { TeamAdvantage } from '../game';
import { MATCH_HEADER_BORDER_ALPHA, MATCH_HEADER_BORDER_COLOR, MATCH_HEADER_BORDER_WIDTH } from './scoreboardStyle';

export const ADVANTAGE_VIEW_WIDTH = 520;
export const ADVANTAGE_VIEW_HEIGHT = 22;
export const ADVANTAGE_TRACK_WIDTH = ADVANTAGE_VIEW_WIDTH - 12;
export const ADVANTAGE_TRACK_HEIGHT = 14;

export interface AdvantageViewOptions {
  advantage: TeamAdvantage;
}

export class AdvantageView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, options: AdvantageViewOptions) {
    super(scene, x, y);

    const playerOneWidth = Math.round(ADVANTAGE_TRACK_WIDTH * options.advantage.playerOneShare);
    const playerTwoWidth = ADVANTAGE_TRACK_WIDTH - playerOneWidth;

    const background = scene.add.rectangle(0, 0, ADVANTAGE_VIEW_WIDTH, ADVANTAGE_VIEW_HEIGHT, 0x08120f, 0.88);
    background.setStrokeStyle(MATCH_HEADER_BORDER_WIDTH, MATCH_HEADER_BORDER_COLOR, MATCH_HEADER_BORDER_ALPHA);

    const track = scene.add.rectangle(0, 0, ADVANTAGE_TRACK_WIDTH, ADVANTAGE_TRACK_HEIGHT, 0x1a3028, 1);
    track.setStrokeStyle(1, 0x86a995, 0.55);

    const playerOneFill = scene.add.rectangle(
      -ADVANTAGE_TRACK_WIDTH / 2 + playerOneWidth / 2,
      0,
      Math.max(1, playerOneWidth),
      ADVANTAGE_TRACK_HEIGHT - 2,
      0xd84a3f,
      0.96
    );
    const playerTwoFill = scene.add.rectangle(
      ADVANTAGE_TRACK_WIDTH / 2 - playerTwoWidth / 2,
      0,
      Math.max(1, playerTwoWidth),
      ADVANTAGE_TRACK_HEIGHT - 2,
      0x4da3d9,
      0.96
    );

    const splitX = -ADVANTAGE_TRACK_WIDTH / 2 + playerOneWidth;
    const splitMarker = scene.add.rectangle(splitX, 0, 2, 18, 0xffffff, 0.95);
    const centerMarker = scene.add.rectangle(0, 0, 1, 18, 0xf6e06e, 0.82);

    this.add([background, track, playerOneFill, playerTwoFill, centerMarker, splitMarker]);
    scene.add.existing(this);
  }
}

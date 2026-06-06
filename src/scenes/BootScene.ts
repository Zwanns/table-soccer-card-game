import Phaser from 'phaser';
import { getFlagAssetUrl } from '../data/flagAssets';
import { getFlagAssetKey, NATIONAL_TEAMS } from '../data/nationalTeams';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    this.load.image('turn-ball', 'cards/ball.webp');

    for (const team of NATIONAL_TEAMS) {
      this.load.svg(getFlagAssetKey(team.flagCode), getFlagAssetUrl(team.flagCode), { width: 96, height: 72 });
    }

    this.load.audio('sound-whistle-start', 'Sounds/referees-whistle_start.mp3');
    this.load.audio('sound-whistle-finish', 'Sounds/referees-whistle_finish.mp3');
    this.load.audio('sound-goal', 'Sounds/bolely-goal.mp3');
    this.load.audio('sound-goalkeeper-save', 'Sounds/bolely-net.mp3');
    this.load.audio('sound-goalpost', 'Sounds/shtanga.mp3');
  }

  public create(): void {
    this.scene.start('MenuScene');
  }
}

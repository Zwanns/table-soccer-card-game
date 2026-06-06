import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    this.load.image('turn-ball', 'cards/ball.webp');
  }

  public create(): void {
    this.scene.start('MenuScene');
  }
}

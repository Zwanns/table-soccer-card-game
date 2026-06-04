import Phaser from 'phaser';
import { GAME_TITLE } from '../config';

export class MainScene extends Phaser.Scene {
  public constructor() {
    super('MainScene');
  }

  public create(): void {
    this.add
      .text(640, 360, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '56px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }
}

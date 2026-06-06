import Phaser from 'phaser';
import { GAME_TITLE } from '../config';
import { Button } from '../ui/Button';

export class ResultScene extends Phaser.Scene {
  public constructor() {
    super('ResultScene');
  }

  public create(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x142231);

    this.add
      .text(640, 220, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '54px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add
      .text(640, 304, 'Экран результата', {
        color: '#dfeaf2',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add
      .text(640, 358, 'На этом этапе здесь показан только каркас сцены.', {
        color: '#c2d1dc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px'
      })
      .setOrigin(0.5);

    new Button(this, 640, 456, 'В меню', () => this.scene.start('MenuScene'));
  }
}

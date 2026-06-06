import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { Button } from '../ui/Button';

export class ResultScene extends Phaser.Scene {
  public constructor() {
    super('ResultScene');
  }

  public create(): void {
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;

    this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x142231);

    this.add
      .text(centerX, 220, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '54px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 304, 'Экран результата', {
        color: '#dfeaf2',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 358, 'На этом этапе здесь показан только каркас сцены.', {
        color: '#c2d1dc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px'
      })
      .setOrigin(0.5);

    new Button(this, centerX, 456, 'В меню', () => this.scene.start('MenuScene'));
  }
}

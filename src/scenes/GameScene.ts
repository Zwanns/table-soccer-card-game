import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { FieldView } from '../ui/FieldView';
import { ScoreView } from '../ui/ScoreView';

export class GameScene extends Phaser.Scene {
  public constructor() {
    super('GameScene');
  }

  public create(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x123b2a);
    new ScoreView(this, 640, 50, 0, 0);
    new FieldView(this, 640, 362);
    new Button(this, 1100, 662, 'Результат', () => this.scene.start('ResultScene'));
    new Button(this, 180, 662, 'В меню', () => this.scene.start('MenuScene'));
  }
}

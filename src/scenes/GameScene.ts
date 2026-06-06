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
    new Button(this, 172, 42, 'В меню', () => this.scene.start('MenuScene'));
    new ScoreView(this, 640, 42, 0, 0);
    new Button(this, 1108, 42, 'Результат', () => this.scene.start('ResultScene'));
    new FieldView(this, 640, 382);
  }
}

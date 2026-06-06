import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { Button } from '../ui/Button';
import { FieldView } from '../ui/FieldView';
import { ScoreView } from '../ui/ScoreView';
import { TeamStatsView } from '../ui/TeamStatsView';

export class GameScene extends Phaser.Scene {
  public constructor() {
    super('GameScene');
  }

  public create(): void {
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;

    this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a);
    new Button(this, 280, 42, 'В меню', () => this.scene.start('MenuScene'));
    new ScoreView(this, centerX, 42, 0, 0);
    new Button(this, 1320, 42, 'Результат', () => this.scene.start('ResultScene'));
    new TeamStatsView(this, 115, 280, {
      align: 'left',
      shots: 0,
      scorers: []
    });
    new TeamStatsView(this, 1485, 280, {
      align: 'right',
      shots: 0,
      scorers: []
    });
    new FieldView(this, centerX, 400);
  }
}

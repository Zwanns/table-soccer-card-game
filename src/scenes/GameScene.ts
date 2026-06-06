import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { Button } from '../ui/Button';
import { DeckView } from '../ui/DeckView';
import { FieldView } from '../ui/FieldView';
import { ScoreView } from '../ui/ScoreView';
import { TeamStatsView } from '../ui/TeamStatsView';

const FIELD_WIDTH = 1120;
const FIELD_TOP = 100;

export class GameScene extends Phaser.Scene {
  public constructor() {
    super('GameScene');
  }

  public create(): void {
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;

    this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a);
    new Button(this, centerX - FIELD_WIDTH / 2 + 110, 42, 'В меню', () => this.scene.start('MenuScene'));
    new ScoreView(this, centerX, 42, 0, 0);
    new Button(this, centerX + FIELD_WIDTH / 2 - 110, 42, 'Результат', () => this.scene.start('ResultScene'));
    new TeamStatsView(this, 115, FIELD_TOP + 63, {
      align: 'left',
      shots: 0,
      scorers: []
    });
    new TeamStatsView(this, 1485, FIELD_TOP + 63, {
      align: 'right',
      shots: 0,
      scorers: []
    });
    new DeckView(this, 115, 520, 21, {
      active: true,
      attackCardRank: 'A'
    });
    new DeckView(this, 1485, 520, 21);
    new FieldView(this, centerX, 400);
  }
}

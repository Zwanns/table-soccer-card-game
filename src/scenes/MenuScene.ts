import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { Button } from '../ui/Button';

export class MenuScene extends Phaser.Scene {
  private rulesPanel: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('MenuScene');
  }

  public create(): void {
    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;

    this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x0b5f3a);

    this.add
      .text(centerX, 190, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '64px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 248, 'Браузерная карточная игра', {
        color: '#d7eadc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px'
      })
      .setOrigin(0.5);

    new Button(this, centerX, 340, 'Новая игра', () => this.scene.start('GameScene'));
    new Button(this, centerX, 410, 'Правила', () => this.toggleRules());
  }

  private toggleRules(): void {
    if (this.rulesPanel !== null) {
      this.rulesPanel.destroy();
      this.rulesPanel = null;
      return;
    }

    const panel = this.add.container(SCENE_WIDTH / 2, 540);
    const background = this.add.rectangle(0, 0, 620, 94, 0x173d2b, 0.98);
    background.setStrokeStyle(2, 0x9dd2a7);

    const text = this.add
      .text(0, 0, 'Пробивайте линии соперника по порядку: полузащита, защита, вратарь.', {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        wordWrap: { width: 560 }
      })
      .setOrigin(0.5);

    panel.add([background, text]);
    this.rulesPanel = panel;
  }
}

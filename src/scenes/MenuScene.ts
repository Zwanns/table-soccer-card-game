import Phaser from 'phaser';
import { GAME_TITLE, GAME_VERSION, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { Button } from '../ui/Button';

export class MenuScene extends Phaser.Scene {
  private rulesModal: Phaser.GameObjects.Container | null = null;

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

    this.add
      .text(centerX, 282, `v${GAME_VERSION}`, {
        color: '#b8d2c1',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    new Button(this, centerX, 340, 'Новая игра', () => this.scene.start('TeamSelectScene'));
    new Button(this, centerX, 410, 'Правила', () => this.openRulesModal());
  }

  private openRulesModal(): void {
    if (this.rulesModal !== null) {
      return;
    }

    const centerX = SCENE_WIDTH / 2;
    const centerY = SCENE_HEIGHT / 2;
    const modal = this.add.container(0, 0);
    const overlay = this.add.rectangle(centerX, centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72);
    overlay.setInteractive();

    const panel = this.add.container(centerX, centerY);
    const background = this.add.rectangle(0, 0, 960, 600, 0x0b2118, 0.98);
    background.setStrokeStyle(2, 0x9dd2a7);

    const title = this.add
      .text(0, -260, 'Правила', {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(0, -220, 'Карточная дуэль для настоящих футбольных фанатов', {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const intro = this.add
      .text(
        0,
        -178,
        'Если вы любите карточные игры и футбол, здесь все решает чтение руки, расчет номиналов и футбольное чутье. Выберите сборную, продавите линии соперника и доведите атаку до удара по воротам.',
        {
          align: 'center',
          color: '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '19px',
          lineSpacing: 8,
          wordWrap: { width: 760 }
        }
      )
      .setOrigin(0.5);

    const divider = this.add.rectangle(0, -132, 790, 2, 0x5f9572, 0.88);
    const rules = [
      ['1', 'Атака идет по линиям: полузащита -> защита -> вратарь. Нажимать можно только карту текущей линии.'],
      ['2', 'Карта атаки обычно бьет равную или младшую карту. Спецудары: 2-Joker, 6-A, 7-K, 8-Q, 9-J.'],
      ['3', 'Если выбранную карту нельзя побить, атака заканчивается потерей мяча. Подсказок нет: силу карт оценивает игрок.'],
      ['4', 'Побитые карты переходят в вашу колоду и меняют цвет команды. Так можно наращивать давление.'],
      ['5', 'Удар по GK дает гол, штангу или сэйв. Для GK от 3 до 10 нужен строго больший номинал.'],
      ['6', 'Гол очищает поле соперника. Шкала под табло показывает, кто сильнее давит в последние ходы.']
    ] satisfies Array<[string, string]>;
    const ruleObjects = rules.flatMap(([number, text], index) => {
      const rowY = -88 + index * 54;
      const marker = this.add.circle(-386, rowY, 15, 0xf0c95a, 1);
      const markerText = this.add
        .text(-386, rowY, number, {
          align: 'center',
          color: '#1f2a2e',
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          fontStyle: '700'
        })
        .setOrigin(0.5);
      const ruleText = this.add
        .text(-346, rowY, text, {
          align: 'left',
          color: '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '19px',
          lineSpacing: 8,
          wordWrap: { width: 710 }
        })
        .setOrigin(0, 0.5);

      return [marker, markerText, ruleText];
    });

    panel.add([
      background,
      title,
      subtitle,
      intro,
      divider,
      ...ruleObjects,
      new Button(this, 0, 252, 'Закрыть', () => this.closeRulesModal())
    ]);
    modal.add([overlay, panel]);
    this.rulesModal = modal;
  }

  private closeRulesModal(): void {
    this.rulesModal?.destroy();
    this.rulesModal = null;
  }
}

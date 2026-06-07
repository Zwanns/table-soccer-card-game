import Phaser from 'phaser';
import { GAME_TITLE, GAME_VERSION, MENU_ASSETS, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { Button } from '../ui/Button';

const MENU_LAYOUT = {
  centerX: SCENE_WIDTH / 2,
  centerY: SCENE_HEIGHT / 2,
  titleY: 138,
  subtitleY: 238,
  buttonsStartY: 338,
  buttonsGap: 70,
  footerMargin: 24
} as const;

const RULES_MODAL = {
  width: 960,
  height: 600
} as const;

type MenuAnimatedObject = Phaser.GameObjects.Container | Phaser.GameObjects.Image | Phaser.GameObjects.Text;

export class MenuScene extends Phaser.Scene {
  private rulesModal: Phaser.GameObjects.Container | null = null;
  private introTargets: MenuAnimatedObject[] = [];
  private idleTargets: Phaser.GameObjects.Image[] = [];

  public constructor() {
    super('MenuScene');
  }

  public create(): void {
    this.rulesModal = null;
    this.introTargets = [];
    this.idleTargets = [];

    this.createBackground();
    this.createOverlay();
    this.createDecor();
    this.createTitle();
    this.createButtons();
    this.createFooter();
    this.playIntroAnimation();
    this.playIdleAnimation();
  }

  private createBackground(): void {
    if (this.textures.exists(MENU_ASSETS.background)) {
      const background = this.add.image(MENU_LAYOUT.centerX, MENU_LAYOUT.centerY, MENU_ASSETS.background);
      const scale = Math.max(SCENE_WIDTH / background.width, SCENE_HEIGHT / background.height);
      background.setScale(scale);
      return;
    }

    this.add.rectangle(MENU_LAYOUT.centerX, MENU_LAYOUT.centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x102132);

    const pitch = this.add.graphics();
    pitch.fillStyle(0x0b5f3a, 0.88);
    pitch.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    pitch.fillStyle(0x0f7447, 0.18);

    for (let x = 0; x < SCENE_WIDTH; x += 160) {
      pitch.fillRect(x, 0, 80, SCENE_HEIGHT);
    }

    pitch.lineStyle(3, 0xbfe8c9, 0.18);
    pitch.strokeRect(250, 94, 1100, 532);
    pitch.lineBetween(MENU_LAYOUT.centerX, 94, MENU_LAYOUT.centerX, 626);
    pitch.strokeCircle(MENU_LAYOUT.centerX, MENU_LAYOUT.centerY + 4, 92);
  }

  private createOverlay(): void {
    this.add.rectangle(MENU_LAYOUT.centerX, MENU_LAYOUT.centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x000000, 0.34);
  }

  private createDecor(): void {
    const spotlight = this.add.graphics();
    spotlight.fillStyle(0xf0c95a, 0.08);
    spotlight.fillTriangle(250, 0, 560, 0, 430, 520);
    spotlight.fillTriangle(1350, 0, 1040, 0, 1170, 520);

    if (this.textures.exists(MENU_ASSETS.flags)) {
      const flags = this.add.image(MENU_LAYOUT.centerX, 80, MENU_ASSETS.flags);
      flags.setAlpha(0.68);
      flags.setDisplaySize(Math.min(flags.width, 720), Math.min(flags.height, 72));
      this.introTargets.push(flags);
    }

    if (this.textures.exists(MENU_ASSETS.ball)) {
      const ball = this.add.image(1176, 478, MENU_ASSETS.ball);
      ball.setDisplaySize(78, 78);
      ball.setAlpha(0.9);
      this.idleTargets.push(ball);
      this.introTargets.push(ball);
      return;
    }

    const fallbackBall = this.add.image(1176, 478, 'turn-ball');
    fallbackBall.setDisplaySize(58, 58);
    fallbackBall.setAlpha(0.42);
    this.idleTargets.push(fallbackBall);
  }

  private createTitle(): void {
    if (this.textures.exists(MENU_ASSETS.logo)) {
      const logo = this.add.image(MENU_LAYOUT.centerX, MENU_LAYOUT.titleY, MENU_ASSETS.logo);
      logo.setDisplaySize(Math.min(logo.width, 620), Math.min(logo.height, 160));
      this.introTargets.push(logo);
      return;
    }

    const [firstLine, secondLine = 'Mundial'] = GAME_TITLE.split(':').map((part) => part.trim());
    const title = this.add
      .text(MENU_LAYOUT.centerX, MENU_LAYOUT.titleY - 18, firstLine, {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '68px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(MENU_LAYOUT.centerX, MENU_LAYOUT.titleY + 54, secondLine, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '42px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const description = this.add
      .text(MENU_LAYOUT.centerX, MENU_LAYOUT.subtitleY, 'Карточная дуэль для футбольных фанатов', {
        align: 'center',
        color: '#d7eadc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px'
      })
      .setOrigin(0.5);

    this.introTargets.push(title, subtitle, description);
  }

  private createButtons(): void {
    const buttons = [
      new Button(this, MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY, 'Играть', () => this.scene.start('TeamSelectScene')),
      new Button(this, MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap, 'Правила', () => this.openRulesModal())
    ];

    this.introTargets.push(...buttons);
  }

  private createFooter(): void {
    const version = this.add
      .text(SCENE_WIDTH - MENU_LAYOUT.footerMargin, SCENE_HEIGHT - MENU_LAYOUT.footerMargin, `v${GAME_VERSION}`, {
        align: 'right',
        color: '#b8d2c1',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700'
      })
      .setOrigin(1, 1);

    this.introTargets.push(version);
  }

  private playIntroAnimation(): void {
    this.introTargets.forEach((target, index) => {
      target.setAlpha(0);
      target.y += 12;

      this.tweens.add({
        targets: target,
        alpha: 1,
        y: target.y - 12,
        delay: index * 70,
        duration: 520,
        ease: 'Sine.easeOut'
      });
    });
  }

  private playIdleAnimation(): void {
    for (const target of this.idleTargets) {
      this.tweens.add({
        targets: target,
        y: target.y - 8,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private openRulesModal(): void {
    if (this.rulesModal !== null) {
      return;
    }

    const modal = this.add.container(0, 0);
    const overlay = this.add.rectangle(MENU_LAYOUT.centerX, MENU_LAYOUT.centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72);
    overlay.setInteractive();

    const panel = this.add.container(MENU_LAYOUT.centerX, MENU_LAYOUT.centerY);
    const background = this.add.rectangle(0, 0, RULES_MODAL.width, RULES_MODAL.height, 0x0b2118, 0.98);
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

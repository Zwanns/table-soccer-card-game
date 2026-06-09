import Phaser from 'phaser';
import { GAME_AUTHOR, GAME_AUTHOR_URL, GAME_TITLE, GAME_VERSION, MENU_ASSETS, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import type { TournamentMatchResult } from '../tournament';
import { Button } from '../ui/Button';

const MENU_LAYOUT = {
  centerX: SCENE_WIDTH / 2,
  centerY: SCENE_HEIGHT / 2,
  titleY: 138,
  subtitleY: 238,
  buttonsStartY: 286,
  buttonsGap: 60,
  footerMargin: 24
} as const;

const ABOUT_MODAL = {
  width: 960,
  height: 600
} as const;

const ABOUT_VIEWPORT = {
  x: -390,
  y: -150,
  width: 780,
  height: 382
} as const;

type MenuAnimatedObject = Phaser.GameObjects.Container | Phaser.GameObjects.Image | Phaser.GameObjects.Text;
type MenuView = 'main' | 'modes';
type AboutLanguage = 'en' | 'pl' | 'uk';

const ABOUT_LANGUAGES: readonly AboutLanguage[] = ['en', 'pl', 'uk'];
const ABOUT_CONTENT: Record<
  AboutLanguage,
  {
    title: string;
    authorLabel: string;
    intro: string;
    rules: readonly string[];
  }
> = {
  en: {
    title: 'About',
    authorLabel: 'Author',
    intro:
      'The game is in development. Quick matches, tournaments, penalty shootouts, and local squad editing are currently available.',
    rules: [
      'Attacks move through lines: midfield -> defense -> goalkeeper. You can select only a card from the current line.',
      'An attacking card usually beats an equal or lower card. Special hits: 2-Joker, 6-A, 7-K, 8-Q, 9-J.',
      'If the selected card cannot be beaten, the attack ends with a turnover. There are no hints: players judge card strength themselves.',
      'Beaten cards move into your deck and change to your team color. This lets you build pressure.',
      'A shot against GK can result in a goal, post, or save. For GK cards from 3 to 10, the attacking rank must be strictly higher.',
      'Tournament progress is currently saved only locally on this device.'
    ]
  },
  pl: {
    title: 'O projekcie',
    authorLabel: 'Autor',
    intro:
      'Gra jest w trakcie tworzenia. Dostępne są szybkie mecze, turnieje, serie rzutów karnych oraz lokalna edycja składów.',
    rules: [
      'Atak przechodzi przez linie: pomoc -> obrona -> bramkarz. Można wybrać tylko kartę z aktualnej linii.',
      'Karta ataku zwykle bije kartę równą lub niższą. Specjalne zagrania: 2-Joker, 6-A, 7-K, 8-Q, 9-J.',
      'Jeśli wybranej karty nie da się pobić, atak kończy się stratą piłki. Nie ma podpowiedzi: siłę kart ocenia gracz.',
      'Pobite karty trafiają do twojej talii i zmieniają kolor na kolor drużyny. W ten sposób budujesz presję.',
      'Strzał przeciwko GK może skończyć się golem, słupkiem albo obroną. Dla GK od 3 do 10 potrzebna jest karta ściśle wyższa.',
      'Postęp turnieju jest obecnie zapisywany tylko lokalnie na tym urządzeniu.'
    ]
  },
  uk: {
    title: 'Про проєкт',
    authorLabel: 'Автор',
    intro:
      'Гра перебуває в розробці. Зараз доступні швидкі матчі, турніри, серії пенальті та локальне редагування складів.',
    rules: [
      'Атака проходить лініями: півзахист -> захист -> воротар. Обирати можна лише карту поточної лінії.',
      'Карта атаки зазвичай б’є рівну або нижчу карту. Спеціальні удари: 2-Joker, 6-A, 7-K, 8-Q, 9-J.',
      'Якщо вибрану карту не можна побити, атака завершується втратою м’яча. Підказок немає: силу карт оцінює гравець.',
      'Побиті карти переходять у вашу колоду й змінюють колір команди. Так можна нарощувати тиск.',
      'Удар проти GK може дати гол, штангу або сейв. Для GK від 3 до 10 потрібен строго вищий номінал.',
      'Прогрес турніру поки зберігається лише локально на цьому пристрої.'
    ]
  }
};

export class MenuScene extends Phaser.Scene {
  private aboutModal: Phaser.GameObjects.Container | null = null;
  private introTargets: MenuAnimatedObject[] = [];
  private idleTargets: Phaser.GameObjects.Image[] = [];
  private currentView: MenuView = 'main';
  private aboutLanguage: AboutLanguage = 'en';

  public constructor() {
    super('MenuScene');
  }

  public create(): void {
    this.aboutModal = null;
    this.introTargets = [];
    this.idleTargets = [];
    this.currentView = 'main';

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
    if (this.currentView === 'modes') {
      this.createGameModeButtons();
      return;
    }

    this.createMainButtons();
  }

  private createMainButtons(): void {
    const buttons = [
      new Button(this, MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY, 'Режимы игры', () => this.openGameModes()),
      new Button(this, MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap, 'Составы', () =>
        this.scene.start('SquadSelectScene')
      ),
      new Button(this, MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap * 2, 'О проекте', () =>
        this.openAboutModal()
      )
    ];

    this.introTargets.push(...buttons);
  }

  private createGameModeButtons(): void {
    const title = this.add
      .text(MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY - 46, 'Режимы игры', {
        align: 'center',
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const buttons = [
      title,
      new Button(this, MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY, 'Турниры', () =>
        this.scene.start('TournamentSetupScene')
      ),
      new Button(this, MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap, 'Быстрый матч', () =>
        this.scene.start('TeamSelectScene')
      ),
      new Button(this, MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap * 2, 'Серия пенальти', () =>
        this.startStandalonePenaltyShootout()
      ),
      new Button(this, MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap * 3, 'Назад', () =>
        this.scene.start('MenuScene')
      )
    ];

    this.introTargets.push(...buttons);
  }

  private openGameModes(): void {
    this.currentView = 'modes';
    this.children.removeAll(true);
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

  private openAboutModal(): void {
    if (this.aboutModal !== null) {
      return;
    }

    const content = ABOUT_CONTENT[this.aboutLanguage];
    const modal = this.add.container(0, 0);
    const overlay = this.add.rectangle(MENU_LAYOUT.centerX, MENU_LAYOUT.centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72);
    overlay.setInteractive();

    const panel = this.add.container(MENU_LAYOUT.centerX, MENU_LAYOUT.centerY);
    const background = this.add.rectangle(0, 0, ABOUT_MODAL.width, ABOUT_MODAL.height, 0x0b2118, 0.98);
    background.setStrokeStyle(2, 0x9dd2a7);

    const backButton = this.createAboutBackButton(-420, -258);
    const languageSelector = this.createAboutLanguageSelector(336, -258);
    const title = this.add
      .text(0, -252, content.title, {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(0, -214, `${GAME_TITLE} | v${GAME_VERSION}`, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const author = this.add
      .text(0, -184, `${content.authorLabel}: ${GAME_AUTHOR}`, {
        align: 'center',
        color: '#8fd4ff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    author.on('pointerover', () => author.setColor('#bfe7ff'));
    author.on('pointerout', () => author.setColor('#8fd4ff'));
    author.on('pointerdown', () => window.open(GAME_AUTHOR_URL, '_blank', 'noopener,noreferrer'));

    const viewport = this.createAboutViewport(content);

    panel.add([
      background,
      backButton,
      languageSelector,
      title,
      subtitle,
      author,
      viewport
    ]);
    modal.add([overlay, panel]);
    this.aboutModal = modal;
  }

  private closeAboutModal(): void {
    this.aboutModal?.destroy();
    this.aboutModal = null;
  }

  private createAboutBackButton(x: number, y: number): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, 44, 38, 0xf0c95a, 1);
    background.setStrokeStyle(2, 0x2d382f);
    const arrow = this.add
      .text(0, -1, '<', {
        align: 'center',
        color: '#1f2a2e',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    button.add([background, arrow]);
    button.setSize(44, 38);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => background.setFillStyle(0xffd978));
    button.on('pointerout', () => background.setFillStyle(0xf0c95a));
    button.on('pointerdown', () => this.closeAboutModal());
    return button;
  }

  private createAboutLanguageSelector(x: number, y: number): Phaser.GameObjects.Container {
    const selector = this.add.container(x, y);
    const startX = -62;

    ABOUT_LANGUAGES.forEach((language, index) => {
      const isActive = language === this.aboutLanguage;
      const label = this.add
        .text(startX + index * 54, 0, getAboutLanguageCode(language), {
          align: 'center',
          color: isActive ? '#f0c95a' : '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: '700'
        })
        .setOrigin(0.5);

      if (!isActive) {
        label.setInteractive({ useHandCursor: true });
        label.on('pointerover', () => label.setColor('#ffffff'));
        label.on('pointerout', () => label.setColor('#d9eadf'));
        label.on('pointerdown', () => this.switchAboutLanguage(language));
      }

      selector.add(label);

      if (index < ABOUT_LANGUAGES.length - 1) {
        selector.add(
          this.add
            .text(startX + index * 54 + 27, 0, '|', {
              color: '#5f9572',
              fontFamily: 'Arial, sans-serif',
              fontSize: '18px',
              fontStyle: '700'
            })
            .setOrigin(0.5)
        );
      }
    });

    return selector;
  }

  private createAboutViewport(content: (typeof ABOUT_CONTENT)[AboutLanguage]): Phaser.GameObjects.Container {
    const wrapper = this.add.container(0, 0);
    const scrollContent = this.add.container(0, ABOUT_VIEWPORT.y);
    let contentHeight = 0;

    const intro = this.add
      .text(0, contentHeight, content.intro, {
        align: 'center',
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        lineSpacing: 12,
        wordWrap: { width: ABOUT_VIEWPORT.width }
      })
      .setOrigin(0.5, 0);
    scrollContent.add(intro);
    contentHeight += intro.height + 24;

    scrollContent.add(this.add.rectangle(0, contentHeight, ABOUT_VIEWPORT.width, 2, 0x5f9572, 0.88));
    contentHeight += 24;

    content.rules.forEach((rule, index) => {
      const rowY = contentHeight;
      const marker = this.add.circle(ABOUT_VIEWPORT.x + 20, rowY + 15, 15, 0xf0c95a, 1);
      const markerText = this.add
        .text(ABOUT_VIEWPORT.x + 20, rowY + 15, String(index + 1), {
          align: 'center',
          color: '#1f2a2e',
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          fontStyle: '700'
        })
        .setOrigin(0.5);
      const ruleText = this.add
        .text(ABOUT_VIEWPORT.x + 62, rowY, rule, {
          align: 'left',
          color: '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '17px',
          lineSpacing: 14,
          wordWrap: { width: ABOUT_VIEWPORT.width - 74 }
        })
        .setOrigin(0, 0);

      scrollContent.add([marker, markerText, ruleText]);
      contentHeight += Math.max(42, ruleText.height) + 20;
    });

    const maxScroll = Math.max(0, contentHeight - ABOUT_VIEWPORT.height);
    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(
        MENU_LAYOUT.centerX + ABOUT_VIEWPORT.x,
        MENU_LAYOUT.centerY + ABOUT_VIEWPORT.y,
        ABOUT_VIEWPORT.width,
        ABOUT_VIEWPORT.height
      )
      .createGeometryMask();
    maskGraphics.setVisible(false);
    scrollContent.setMask(mask);

    const scrollZone = this.add
      .zone(0, ABOUT_VIEWPORT.y + ABOUT_VIEWPORT.height / 2, ABOUT_VIEWPORT.width, ABOUT_VIEWPORT.height)
      .setInteractive();

    wrapper.add([scrollContent, scrollZone]);

    if (maxScroll > 0) {
      const trackX = ABOUT_VIEWPORT.x + ABOUT_VIEWPORT.width + 16;
      const track = this.add.rectangle(trackX, ABOUT_VIEWPORT.y + ABOUT_VIEWPORT.height / 2, 4, ABOUT_VIEWPORT.height, 0x5f9572, 0.28);
      const thumbHeight = Math.max(28, (ABOUT_VIEWPORT.height / contentHeight) * ABOUT_VIEWPORT.height);
      const thumb = this.add.rectangle(trackX, ABOUT_VIEWPORT.y + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);
      let scrollY = 0;

      const setScroll = (value: number): void => {
        scrollY = Phaser.Math.Clamp(value, 0, maxScroll);
        scrollContent.y = ABOUT_VIEWPORT.y - scrollY;
        thumb.y = ABOUT_VIEWPORT.y + thumbHeight / 2 + (scrollY / maxScroll) * (ABOUT_VIEWPORT.height - thumbHeight);
      };

      scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
        setScroll(scrollY + deltaY * 0.35);
      });
      wrapper.add([track, thumb]);
    }

    return wrapper;
  }

  private switchAboutLanguage(language: AboutLanguage): void {
    this.aboutLanguage = language;
    this.closeAboutModal();
    this.openAboutModal();
  }

  private startStandalonePenaltyShootout(): void {
    this.scene.start('TournamentPenaltyScene', {
      standalone: true,
      matchResult: createStandalonePenaltyMatchResult()
    });
  }
}

function createStandalonePenaltyMatchResult(): TournamentMatchResult {
  return {
    matchId: 'standalone-penalty',
    homeTeamId: 'fr',
    awayTeamId: 'es',
    homeGoals: 0,
    awayGoals: 0,
    teamStats: {
      home: {
        teamId: 'fr',
        goals: 0,
        shots: 0,
        goalpostHits: 0,
        goalkeeperSaves: 0
      },
      away: {
        teamId: 'es',
        goals: 0,
        shots: 0,
        goalpostHits: 0,
        goalkeeperSaves: 0
      }
    },
    playerStats: []
  };
}

function getAboutLanguageCode(language: AboutLanguage): string {
  switch (language) {
    case 'en':
      return 'EN';
    case 'pl':
      return 'PL';
    case 'uk':
      return 'UA';
  }
}

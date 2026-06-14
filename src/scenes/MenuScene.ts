import Phaser from 'phaser';
import { GAME_AUTHOR, GAME_AUTHOR_URL, GAME_TITLE, GAME_VERSION, MENU_ASSETS, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { deleteStoredTournament, hasActiveTournamentSave, loadActiveTournament } from '../tournament';
import { Button } from '../ui/Button';

const MENU_LAYOUT = {
  centerX: SCENE_WIDTH / 2,
  centerY: SCENE_HEIGHT / 2,
  titleY: 138,
  logoMaxWidth: SCENE_WIDTH * 0.76,
  logoMaxHeight: SCENE_HEIGHT * 0.28,
  subtitleY: 238,
  buttonsStartY: 286,
  buttonsGap: 60,
  buttonMinWidth: 280,
  buttonMaxWidthRatio: 0.78,
  fallbackButtonWidthRatio: 0.72,
  fallbackButtonMaxWidth: 520,
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
type InfoModalKind = 'about' | 'rules';

const LOGO_BLINK_INITIAL_DELAY_MS = 1800;
const LOGO_BLINK_PATTERN: ReadonlyArray<{ textureKey: string; delay: number }> = [
  { textureKey: MENU_ASSETS.logoOff, delay: 120 },
  { textureKey: MENU_ASSETS.logoOn, delay: 900 },
  { textureKey: MENU_ASSETS.logoOff, delay: 90 },
  { textureKey: MENU_ASSETS.logoOn, delay: 2600 }
];

const ABOUT_LANGUAGES: readonly AboutLanguage[] = ['en', 'pl', 'uk'];
const ABOUT_CONTENT: Record<
  AboutLanguage,
  {
    title: string;
    authorLabel: string;
    paragraphs: readonly string[];
  }
> = {
  en: {
    title: 'About',
    authorLabel: 'Author',
    paragraphs: [
      'TOTAL SOCCER: MUNDIAL is a retro card-football game about international matches, tournaments, and dramatic penalty shootouts.',
      'Choose national teams, build attacks, defend your goal, support moves with midfielders, and play against another human or AI.',
      'The game is inspired by football albums, arcade games of the 80s, and the atmosphere of major international tournaments.'
    ]
  },
  pl: {
    title: 'O projekcie',
    authorLabel: 'Autor',
    paragraphs: [
      'TOTAL SOCCER: MUNDIAL to retro kartkowa gra piłkarska o meczach międzynarodowych, turniejach i dramatycznych seriach rzutów karnych.',
      'Wybieraj reprezentacje, buduj ataki, broń bramki, wspieraj akcje pomocnikami i graj przeciwko drugiemu graczowi albo AI.',
      'Gra jest inspirowana albumami piłkarskimi, automatowymi grami z lat 80. i atmosferą wielkich turniejów międzynarodowych.'
    ]
  },
  uk: {
    title: 'Про гру',
    authorLabel: 'Автор',
    paragraphs: [
      'TOTAL SOCCER: MUNDIAL — це ретро-карткова футбольна гра про міжнародні матчі, турніри та драматичні серії пенальті.',
      'Обирай збірні, проводь атаки, захищайся, підключай півзахисників і змагайся проти людини або AI.',
      'Гра натхненна футбольними альбомами, аркадними іграми 80-х і атмосферою великих міжнародних турнірів.'
    ]
  }
};

const RULES_CONTENT: Record<AboutLanguage, { title: string; sections: readonly { heading: string; body: readonly string[] }[] }> = {
  en: {
    title: 'Rules',
    sections: [
      { heading: 'TOTAL SOCCER: MUNDIAL — Rules', body: [] },
      { heading: 'Goal of the game', body: ['Score more goals than your opponent before the match ends.'] },
      {
        heading: 'Teams and cards',
        body: [
          'Each team has field players linked to card ranks: 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A and JOKER.',
          'Each team also has a goalkeeper card drawn from a separate goalkeeper deck.'
        ]
      },
      {
        heading: 'Basic attack',
        body: [
          'The attacking player draws or plays an attacking card and tries to beat a card in the current defensive line.',
          'A normal deck card beats a defender if its rank is equal or higher.'
        ]
      },
      {
        heading: 'Special rules',
        body: ['Some lower cards can beat high cards:', '2 beats JOKER.', '6 beats A.', '7 beats K.', '8 beats Q.', '9 beats J.']
      },
      {
        heading: 'Defensive lines',
        body: [
          'An attack moves through the opponent’s lines step by step.',
          'The attacker must choose legal targets from the current line.'
        ]
      },
      {
        heading: 'Midfield support',
        body: [
          'While attacking through the midfield line, a player may use one of their own midfielders in the matching corridor.',
          'A committed midfielder must strictly beat the opposite midfielder, or use a special rule.',
          'Equal ranks do not work for committed midfielders.',
          'If the attack is lost after using midfielders, the opponent may receive one open midfield zone for the next counterattack.'
        ]
      },
      {
        heading: 'Open midfield zone',
        body: [
          'An open midfield zone works like a weak rank-2 gap.',
          'It can be used only when the rules allow it.',
          'The AI should prefer beating a real defensive card before using an open zone.'
        ]
      },
      {
        heading: 'Goalkeeper',
        body: [
          'The goalkeeper is resolved with a separate goalkeeper card.',
          'After a goal, the goalkeeper card returns to the bottom of the goalkeeper deck.',
          'The goalkeeper card is never captured by the attacker.'
        ]
      },
      { heading: 'Shot result', body: ['A shot can end as:', 'Goal.', 'Goalkeeper save.', 'Post.', 'Turnover.'] },
      {
        heading: 'Penalty shootout',
        body: [
          'Penalty shootouts use a separate penalty system.',
          'Penalty AI is separate from normal match AI.',
          'The goalkeeper deck from the normal match is not used in penalties.'
        ]
      },
      {
        heading: 'Tournament',
        body: [
          'Tournament mode supports group matches, knockout matches and penalty shootouts when needed.',
          'Teams may be controlled by a human player or AI.'
        ]
      }
    ]
  },
  pl: {
    title: 'Zasady',
    sections: [
      { heading: 'TOTAL SOCCER: MUNDIAL — Zasady', body: [] },
      { heading: 'Cel gry', body: ['Zdobądź więcej bramek niż przeciwnik przed końcem meczu.'] },
      {
        heading: 'Drużyny i karty',
        body: [
          'Każda drużyna ma zawodników z pola przypisanych do rang kart: 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A oraz JOKER.',
          'Każda drużyna ma też bramkarza dobieranego z osobnej talii bramkarza.'
        ]
      },
      {
        heading: 'Podstawowy atak',
        body: [
          'Gracz atakujący dobiera lub zagrywa kartę ataku i próbuje pokonać kartę w aktualnej linii obrony przeciwnika.',
          'Zwykła karta z talii pokonuje obrońcę, jeśli ma taką samą lub wyższą rangę.'
        ]
      },
      {
        heading: 'Zasady specjalne',
        body: ['Niektóre niższe karty mogą pokonać wysokie karty:', '2 pokonuje JOKERA.', '6 pokonuje A.', '7 pokonuje K.', '8 pokonuje Q.', '9 pokonuje J.']
      },
      {
        heading: 'Linie obrony',
        body: ['Atak przechodzi przez kolejne linie przeciwnika.', 'Atakujący musi wybierać legalne cele z aktualnej linii.']
      },
      {
        heading: 'Wsparcie pomocnika',
        body: [
          'Podczas ataku przez linię pomocy gracz może użyć jednego ze swoich pomocników w tym samym korytarzu.',
          'Podłączony pomocnik musi być wyraźnie silniejszy od przeciwnego pomocnika albo użyć zasady specjalnej.',
          'Równe rangi nie działają dla podłączonych pomocników.',
          'Jeśli atak zostanie stracony po użyciu pomocników, przeciwnik może otrzymać jedną otwartą strefę w środku pola do następnej kontry.'
        ]
      },
      {
        heading: 'Otwarta strefa w środku pola',
        body: [
          'Otwarta strefa działa jak słaba luka o randze 2.',
          'Można jej użyć tylko wtedy, gdy pozwalają na to zasady.',
          'AI powinno najpierw próbować pokonać prawdziwą kartę obrony, a dopiero potem używać otwartej strefy.'
        ]
      },
      {
        heading: 'Bramkarz',
        body: [
          'Bramkarz jest rozstrzygany osobną kartą bramkarza.',
          'Po golu karta bramkarza wraca na spód talii bramkarza.',
          'Karta bramkarza nigdy nie jest przejmowana przez atakującego.'
        ]
      },
      { heading: 'Wynik strzału', body: ['Strzał może zakończyć się jako:', 'Gol.', 'Obrona bramkarza.', 'Słupek.', 'Strata piłki.'] },
      {
        heading: 'Rzuty karne',
        body: [
          'Serie rzutów karnych używają osobnego systemu.',
          'AI rzutów karnych jest oddzielne od AI zwykłego meczu.',
          'Talia bramkarza ze zwykłego meczu nie jest używana w rzutach karnych.'
        ]
      },
      {
        heading: 'Turniej',
        body: [
          'Tryb turniejowy obsługuje mecze grupowe, fazę pucharową i serie rzutów karnych, gdy są potrzebne.',
          'Drużyny mogą być kontrolowane przez gracza lub AI.'
        ]
      }
    ]
  },
  uk: {
    title: 'Правила',
    sections: [
      { heading: 'TOTAL SOCCER: MUNDIAL — Правила', body: [] },
      { heading: 'Мета гри', body: ['Забий більше голів, ніж суперник, до завершення матчу.'] },
      {
        heading: 'Команди і карти',
        body: [
          'Кожна команда має польових гравців, прив’язаних до рангів карт: 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A та JOKER.',
          'Кожна команда також має воротаря, який бере карту з окремої воротарської колоди.'
        ]
      },
      {
        heading: 'Базова атака',
        body: [
          'Гравець, який атакує, бере або розігрує атакувальну карту і намагається побити карту в поточній лінії захисту суперника.',
          'Звичайна карта з колоди б’є захисника, якщо її ранг дорівнює або вищий.'
        ]
      },
      {
        heading: 'Спеціальні правила',
        body: ['Деякі нижчі карти можуть побити високі карти:', '2 б’є JOKER.', '6 б’є A.', '7 б’є K.', '8 б’є Q.', '9 б’є J.']
      },
      {
        heading: 'Лінії захисту',
        body: ['Атака проходить через лінії суперника поетапно.', 'Атакувальний гравець має вибирати легальні цілі з поточної лінії.']
      },
      {
        heading: 'Підключення півзахисника',
        body: [
          'Під час атаки через лінію півзахисту гравець може використати одного зі своїх півзахисників у відповідному коридорі.',
          'Підключений півзахисник має бути строго сильнішим за карту навпроти або використати спеціальне правило.',
          'Рівні ранги для підключених півзахисників не працюють.',
          'Якщо після використання півзахисників атака завершується втратою м’яча, суперник може отримати одну відкриту зону в півзахисті для наступної контратаки.'
        ]
      },
      {
        heading: 'Відкрита зона в півзахисті',
        body: [
          'Відкрита зона працює як слабка прогалина з рангом 2.',
          'Її можна використати лише тоді, коли це дозволено правилами.',
          'AI має спочатку намагатися побити справжню карту захисту, а вже потім використовувати відкриту зону.'
        ]
      },
      {
        heading: 'Воротар',
        body: [
          'Дія воротаря розігрується окремою воротарською картою.',
          'Після гола карта воротаря повертається вниз воротарської колоди.',
          'Карта воротаря ніколи не захоплюється атакувальним гравцем.'
        ]
      },
      { heading: 'Результат удару', body: ['Удар може завершитися як:', 'Гол.', 'Сейв воротаря.', 'Штанга.', 'Втрата м’яча.'] },
      {
        heading: 'Серія пенальті',
        body: [
          'Серії пенальті використовують окрему систему.',
          'AI для пенальті відокремлений від AI звичайного матчу.',
          'Воротарська колода звичайного матчу не використовується в пенальті.'
        ]
      },
      {
        heading: 'Турнір',
        body: [
          'Турнірний режим підтримує групові матчі, плей-оф і серії пенальті, коли вони потрібні.',
          'Команди можуть керуватися гравцем або AI.'
        ]
      }
    ]
  }
};

export class MenuScene extends Phaser.Scene {
  private aboutModal: Phaser.GameObjects.Container | null = null;
  private activeInfoModal: InfoModalKind | null = null;
  private introTargets: MenuAnimatedObject[] = [];
  private logoImage: Phaser.GameObjects.Image | null = null;
  private logoBlinkTimer?: Phaser.Time.TimerEvent;
  private logoBlinkStepIndex = 0;
  private currentView: MenuView = 'main';
  private aboutLanguage: AboutLanguage = 'en';

  public constructor() {
    super('MenuScene');
  }

  public create(): void {
    this.cleanupLogoBlink();
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.cleanupLogoBlink, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.cleanupLogoBlink, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupLogoBlink, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupLogoBlink, this);
    this.aboutModal = null;
    this.activeInfoModal = null;
    this.introTargets = [];
    this.currentView = 'main';

    this.createBackground();
    this.createOverlay();
    this.createDecor();
    this.createTitle();
    this.createButtons();
    this.createFooter();
    this.playIntroAnimation();
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
    if (this.textures.exists(MENU_ASSETS.flags)) {
      const flags = this.add.image(MENU_LAYOUT.centerX, 80, MENU_ASSETS.flags);
      flags.setAlpha(0.68);
      flags.setDisplaySize(Math.min(flags.width, 720), Math.min(flags.height, 72));
      this.introTargets.push(flags);
    }
  }

  private createTitle(): void {
    if (this.textures.exists(MENU_ASSETS.logoOn)) {
      const logo = this.add.image(MENU_LAYOUT.centerX, MENU_LAYOUT.titleY, MENU_ASSETS.logoOn);
      fitImageWithin(logo, MENU_LAYOUT.logoMaxWidth, MENU_LAYOUT.logoMaxHeight);
      this.logoImage = logo;
      this.introTargets.push(logo);
      this.startLogoBlink();
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
      .text(MENU_LAYOUT.centerX, MENU_LAYOUT.subtitleY, 'A card duel for soccer fans', {
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
    const buttonWidth = this.getMenuButtonWidth();
    const buttons = [
      new Button(this, MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY, 'Game modes', () => this.openGameModes(), {
        width: buttonWidth
      }),
      new Button(
        this,
        MENU_LAYOUT.centerX,
        MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap,
        'Teams',
        () => this.scene.start('SquadSelectScene'),
        { width: buttonWidth }
      ),
      new Button(
        this,
        MENU_LAYOUT.centerX,
        MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap * 2,
        'Rules',
        () => this.openRulesModal(),
        { width: buttonWidth }
      ),
      new Button(
        this,
        MENU_LAYOUT.centerX,
        MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap * 3,
        'About',
        () => this.openAboutModal(),
        { width: buttonWidth }
      )
    ];

    this.introTargets.push(...buttons);
  }

  private createGameModeButtons(): void {
    const hasTournamentSave = hasActiveTournamentSave();
    const buttonWidth = this.getMenuButtonWidth();
    const title = this.add
      .text(MENU_LAYOUT.centerX, MENU_LAYOUT.buttonsStartY - 46, 'Game modes', {
        align: 'center',
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const buttons: MenuAnimatedObject[] = [title];
    let buttonIndex = 0;

    if (hasTournamentSave) {
      buttons.push(
        new Button(
          this,
          MENU_LAYOUT.centerX,
          MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap * buttonIndex,
          'Continue tournament',
          () => this.continueTournament(),
          { width: buttonWidth }
        )
      );
      buttonIndex += 1;
    }

    buttons.push(
      new Button(
        this,
        MENU_LAYOUT.centerX,
        MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap * buttonIndex,
        hasTournamentSave ? 'New tournament' : 'Tournaments',
        () => this.startNewTournamentSetup(),
        { width: buttonWidth }
      )
    );
    buttonIndex += 1;

    buttons.push(
      new Button(
        this,
        MENU_LAYOUT.centerX,
        MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap * buttonIndex,
        'Quick match',
        () => this.scene.start('TeamSelectScene'),
        { width: buttonWidth }
      )
    );
    buttonIndex += 1;

    buttons.push(
      new Button(
        this,
        MENU_LAYOUT.centerX,
        MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap * buttonIndex,
        'Penalty shootout',
        () => this.scene.start('TeamSelectScene', { mode: 'penalty' }),
        { width: buttonWidth }
      )
    );
    buttonIndex += 1;

    if (hasTournamentSave) {
      buttons.push(
        new Button(
          this,
          MENU_LAYOUT.centerX,
          MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap * buttonIndex,
          'Delete save',
          () => this.deleteTournamentSave(),
          { fontSize: '20px', width: buttonWidth }
        )
      );
      buttonIndex += 1;
    }

    buttons.push(
      new Button(
        this,
        MENU_LAYOUT.centerX,
        MENU_LAYOUT.buttonsStartY + MENU_LAYOUT.buttonsGap * buttonIndex,
        'Back',
        () => this.scene.start('MenuScene'),
        { width: buttonWidth }
      )
    );

    this.introTargets.push(...buttons);
  }

  private getMenuButtonWidth(): number {
    const maxButtonWidth = this.scale.width * MENU_LAYOUT.buttonMaxWidthRatio;

    if (this.logoImage !== null && this.logoImage.displayWidth > 0) {
      return Phaser.Math.Clamp(this.logoImage.displayWidth, MENU_LAYOUT.buttonMinWidth, maxButtonWidth);
    }

    return Phaser.Math.Clamp(
      Math.min(this.scale.width * MENU_LAYOUT.fallbackButtonWidthRatio, MENU_LAYOUT.fallbackButtonMaxWidth),
      MENU_LAYOUT.buttonMinWidth,
      maxButtonWidth
    );
  }

  private continueTournament(): void {
    const tournament = loadActiveTournament();

    if (tournament === null) {
      this.openGameModes();
      return;
    }

    this.registry.set('currentTournament', tournament);
    this.scene.start('TournamentHubScene');
  }

  private startNewTournamentSetup(): void {
    if (hasActiveTournamentSave() && !confirmTournamentSaveOverwrite()) {
      return;
    }

    deleteStoredTournament();
    this.registry.remove('currentTournament');
    this.scene.start('TournamentSetupScene');
  }

  private deleteTournamentSave(): void {
    if (!confirmTournamentSaveDelete()) {
      return;
    }

    deleteStoredTournament();
    this.registry.remove('currentTournament');
    this.openGameModes();
  }

  private openGameModes(): void {
    this.cleanupLogoBlink();
    this.currentView = 'modes';
    this.children.removeAll(true);
    this.introTargets = [];
    this.createBackground();
    this.createOverlay();
    this.createDecor();
    this.createTitle();
    this.createButtons();
    this.createFooter();
    this.playIntroAnimation();
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

  private startLogoBlink(): void {
    this.logoBlinkTimer?.remove(false);
    this.logoBlinkTimer = undefined;
    this.logoBlinkStepIndex = 0;

    if (this.logoImage === null || !this.textures.exists(MENU_ASSETS.logoOff)) {
      return;
    }

    this.scheduleLogoBlink(LOGO_BLINK_INITIAL_DELAY_MS);
  }

  private scheduleLogoBlink(delay: number): void {
    this.logoBlinkTimer = this.time.delayedCall(delay, () => this.advanceLogoBlink());
  }

  private advanceLogoBlink(): void {
    if (this.logoImage === null || !this.textures.exists(MENU_ASSETS.logoOn) || !this.textures.exists(MENU_ASSETS.logoOff)) {
      this.cleanupLogoBlink();
      return;
    }

    const step = LOGO_BLINK_PATTERN[this.logoBlinkStepIndex];
    this.logoImage.setTexture(step.textureKey);
    fitImageWithin(this.logoImage, MENU_LAYOUT.logoMaxWidth, MENU_LAYOUT.logoMaxHeight);
    this.logoBlinkStepIndex = (this.logoBlinkStepIndex + 1) % LOGO_BLINK_PATTERN.length;
    this.scheduleLogoBlink(step.delay);
  }

  private cleanupLogoBlink(): void {
    this.logoBlinkTimer?.remove(false);
    this.logoBlinkTimer = undefined;
    this.logoImage = null;
    this.logoBlinkStepIndex = 0;
  }

  private openAboutModal(): void {
    this.openInfoModal('about');
  }

  private openRulesModal(): void {
    this.openInfoModal('rules');
  }

  private openInfoModal(kind: InfoModalKind): void {
    if (this.aboutModal !== null) {
      return;
    }

    this.activeInfoModal = kind;
    const aboutContent = ABOUT_CONTENT[this.aboutLanguage];
    const rulesContent = RULES_CONTENT[this.aboutLanguage];
    const titleText = kind === 'about' ? aboutContent.title : rulesContent.title;
    const modal = this.add.container(0, 0);
    const overlay = this.add.rectangle(MENU_LAYOUT.centerX, MENU_LAYOUT.centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72);
    overlay.setInteractive();

    const panel = this.add.container(MENU_LAYOUT.centerX, MENU_LAYOUT.centerY);
    const background = this.add.rectangle(0, 0, ABOUT_MODAL.width, ABOUT_MODAL.height, 0x0b2118, 0.98);
    background.setStrokeStyle(2, 0x9dd2a7);

    const backButton = this.createAboutBackButton(-420, -258);
    const languageSelector = this.createAboutLanguageSelector(336, -258);
    const title = this.add
      .text(0, -252, titleText, {
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
      .text(0, -184, `${aboutContent.authorLabel}: ${GAME_AUTHOR}`, {
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

    const viewport = kind === 'about' ? this.createAboutViewport(aboutContent) : this.createRulesViewport(rulesContent);

    panel.add(kind === 'about'
      ? [background, backButton, languageSelector, title, subtitle, author, viewport]
      : [background, backButton, languageSelector, title, subtitle, viewport]);
    modal.add([overlay, panel]);
    this.aboutModal = modal;
  }

  private closeAboutModal(): void {
    this.aboutModal?.destroy();
    this.aboutModal = null;
    this.activeInfoModal = null;
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

    content.paragraphs.forEach((paragraph) => {
      const text = this.add
        .text(ABOUT_VIEWPORT.x, contentHeight, paragraph, {
          align: 'left',
          color: '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          lineSpacing: 12,
          wordWrap: { width: ABOUT_VIEWPORT.width }
        })
        .setOrigin(0, 0);

      scrollContent.add(text);
      contentHeight += text.height + 28;
    });

    this.applyScrollableViewport(wrapper, scrollContent, contentHeight);

    return wrapper;
  }

  private createRulesViewport(content: (typeof RULES_CONTENT)[AboutLanguage]): Phaser.GameObjects.Container {
    const wrapper = this.add.container(0, 0);
    const scrollContent = this.add.container(0, ABOUT_VIEWPORT.y);
    let contentHeight = 0;

    content.sections.forEach((section, index) => {
      const heading = this.add
        .text(ABOUT_VIEWPORT.x, contentHeight, section.heading, {
          align: 'left',
          color: index === 0 ? '#f0c95a' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: index === 0 ? '22px' : '19px',
          fontStyle: '700',
          wordWrap: { width: ABOUT_VIEWPORT.width }
        })
        .setOrigin(0, 0);

      scrollContent.add(heading);
      contentHeight += heading.height + 8;

      section.body.forEach((paragraph) => {
        const body = this.add
          .text(ABOUT_VIEWPORT.x, contentHeight, paragraph, {
            align: 'left',
            color: '#d9eadf',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            lineSpacing: 8,
            wordWrap: { width: ABOUT_VIEWPORT.width }
          })
          .setOrigin(0, 0);

        scrollContent.add(body);
        contentHeight += body.height + 6;
      });

      contentHeight += 12;
    });

    this.applyScrollableViewport(wrapper, scrollContent, contentHeight);

    return wrapper;
  }

  private applyScrollableViewport(
    wrapper: Phaser.GameObjects.Container,
    scrollContent: Phaser.GameObjects.Container,
    contentHeight: number
  ): void {
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

    if (maxScroll <= 0) {
      return;
    }

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

  private switchAboutLanguage(language: AboutLanguage): void {
    const activeInfoModal = this.activeInfoModal;
    this.aboutLanguage = language;
    this.closeAboutModal();
    if (activeInfoModal === 'rules') {
      this.openRulesModal();
      return;
    }

    this.openAboutModal();
  }

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

function confirmTournamentSaveOverwrite(): boolean {
  return typeof window === 'undefined' || window.confirm('Start a new tournament and overwrite saved progress?');
}

function confirmTournamentSaveDelete(): boolean {
  return typeof window === 'undefined' || window.confirm('Delete saved tournament?');
}

function fitImageWithin(image: Phaser.GameObjects.Image, maxWidth: number, maxHeight: number): void {
  if (image.width <= 0 || image.height <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return;
  }

  image.setScale(Math.min(maxWidth / image.width, maxHeight / image.height));
}

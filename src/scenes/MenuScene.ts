import Phaser from 'phaser';
import { GAME_AUTHOR, GAME_AUTHOR_URL, GAME_TITLE, GAME_VERSION, MENU_ASSETS, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { deleteStoredTournament, hasActiveTournamentSave, loadActiveTournament } from '../tournament';
import { Button } from '../ui/Button';
import { createMenuLayout, type MenuLayout } from '../ui/menuLayout';
import { SCORE_VIEW_BACKGROUND_COLOR } from '../ui/ScoreView';
import { setTouchFriendlyInteractive } from '../ui/touchInput';

export const LEGAL_DISCLAIMER_TEXT =
  '© 2026 Total Soccer: Mundial. All rights reserved.\n' +
  'This is an unofficial football card game. It is not affiliated with FIFA, UEFA, national football associations, clubs, leagues, or players. All team names, player names, kits, card backs, and visual elements used in the game are fictional or stylized unless otherwise stated.';

type MenuAnimatedObject = Phaser.GameObjects.Container | Phaser.GameObjects.Image | Phaser.GameObjects.Text;
type MenuInfoLayout = MenuLayout['info'];
type MenuView = 'main' | 'modes';
export type AboutLanguage = 'en' | 'pl' | 'uk';
export type InfoModalKind = 'about' | 'rules';

const LOGO_BLINK_INITIAL_DELAY_MS = 1800;
const LOGO_BLINK_PATTERN: ReadonlyArray<{ textureKey: string; delay: number }> = [
  { textureKey: MENU_ASSETS.logoOff, delay: 120 },
  { textureKey: MENU_ASSETS.logoOn, delay: 900 },
  { textureKey: MENU_ASSETS.logoOff, delay: 90 },
  { textureKey: MENU_ASSETS.logoOn, delay: 2600 }
];

export const ABOUT_LANGUAGES: readonly AboutLanguage[] = ['en', 'pl', 'uk'];
export const ABOUT_CONTENT: Record<
  AboutLanguage,
  {
    title: string;
    authorLabel: string;
    paragraphs: readonly string[];
    sections: readonly { heading: string; body: readonly string[] }[];
  }
> = {
  en: {
    title: 'About',
    authorLabel: 'Author',
    paragraphs: [
      'TOTAL SOCCER: MUNDIAL is a retro card-football game about international matches, tournaments, and dramatic penalty shootouts.',
      'Choose national teams, build attacks, defend your goal, support moves with midfielders, and play against another human or AI.',
      'The game is inspired by football albums, arcade games of the 80s, and the atmosphere of major international tournaments.'
    ],
    sections: [
      {
        heading: 'Legal / Disclaimer',
        body: [
          '© 2026 Total Soccer: Mundial. All rights reserved.',
          'This is an unofficial football card game. It is not affiliated with FIFA, UEFA, national football associations, clubs, leagues, or players.',
          'All team names, player names, kits, card backs, and visual elements used in the game are fictional or stylized unless otherwise stated.'
        ]
      }
    ]
  },
  pl: {
    title: 'O projekcie',
    authorLabel: 'Autor',
    paragraphs: [
      'TOTAL SOCCER: MUNDIAL to retro kartkowa gra piłkarska o meczach międzynarodowych, turniejach i dramatycznych seriach rzutów karnych.',
      'Wybieraj reprezentacje, buduj ataki, broń bramki, wspieraj akcje pomocnikami i graj przeciwko drugiemu graczowi albo AI.',
      'Gra jest inspirowana albumami piłkarskimi, automatowymi grami z lat 80. i atmosferą wielkich turniejów międzynarodowych.'
    ],
    sections: [
      {
        heading: 'Informacje prawne / Zastrzezenie',
        body: [
          '© 2026 Total Soccer: Mundial. Wszelkie prawa zastrzezone.',
          'To jest nieoficjalna pilkarska gra karciana. Gra nie jest powiazana z FIFA, UEFA, krajowymi federacjami pilkarskimi, klubami, ligami ani pilkarzami.',
          'Wszystkie nazwy druzyn, nazwiska zawodnikow, stroje, rewersy kart oraz elementy wizualne uzyte w grze sa fikcyjne lub stylizowane, chyba ze zaznaczono inaczej.'
        ]
      }
    ]
  },
  uk: {
    title: 'Про гру',
    authorLabel: 'Автор',
    paragraphs: [
      'TOTAL SOCCER: MUNDIAL — це ретро-карткова футбольна гра про міжнародні матчі, турніри та драматичні серії пенальті.',
      'Обирай збірні, проводь атаки, захищайся, підключай півзахисників і змагайся проти людини або AI.',
      'Гра натхненна футбольними альбомами, аркадними іграми 80-х і атмосферою великих міжнародних турнірів.'
    ],
    sections: [
      {
        heading: 'Правова інформація / Дисклеймер',
        body: [
          '© 2026 Total Soccer: Mundial. Усі права захищено.',
          "Це неофіційна футбольна карткова гра. Вона не пов'язана з FIFA, UEFA, національними футбольними асоціаціями, клубами, лігами або футболістами.",
          'Усі назви команд, прізвища гравців, форми, сорочки карт і візуальні елементи, використані в грі, є вигаданими або стилізованими, якщо не зазначено інше.'
        ]
      }
    ]
  }
};

export const RULES_CONTENT: Record<AboutLanguage, { title: string; sections: readonly { heading: string; body: readonly string[] }[] }> = {
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

  private getMenuLayout(): MenuLayout {
    return createMenuLayout({
      width: this.scale.displaySize.width || this.scale.width,
      height: this.scale.displaySize.height || this.scale.height
    });
  }

  private createBackground(): void {
    const layout = this.getMenuLayout();

    if (this.textures.exists(MENU_ASSETS.background)) {
      const background = this.add.image(layout.scene.centerX, layout.scene.centerY, MENU_ASSETS.background);
      const scale = Math.max(SCENE_WIDTH / background.width, SCENE_HEIGHT / background.height);
      background.setScale(scale);
      return;
    }

    this.add.rectangle(layout.scene.centerX, layout.scene.centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x102132);

    const pitch = this.add.graphics();
    pitch.fillStyle(0x0b5f3a, 0.88);
    pitch.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    pitch.fillStyle(0x0f7447, 0.18);

    for (let x = 0; x < SCENE_WIDTH; x += 160) {
      pitch.fillRect(x, 0, 80, SCENE_HEIGHT);
    }

    pitch.lineStyle(3, 0xbfe8c9, 0.18);
    pitch.strokeRect(250, 94, 1100, 532);
    pitch.lineBetween(layout.scene.centerX, 94, layout.scene.centerX, 626);
    pitch.strokeCircle(layout.scene.centerX, layout.scene.centerY + 4, 92);
  }

  private createOverlay(): void {
    const layout = this.getMenuLayout();

    this.add.rectangle(layout.scene.centerX, layout.scene.centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x000000, 0.34);
  }

  private createDecor(): void {
    const layout = this.getMenuLayout();

    if (this.textures.exists(MENU_ASSETS.flags)) {
      const flags = this.add.image(layout.scene.centerX, layout.flags.y, MENU_ASSETS.flags);
      flags.setAlpha(0.68);
      flags.setDisplaySize(Math.min(flags.width, layout.flags.maxWidth), Math.min(flags.height, layout.flags.maxHeight));
      this.introTargets.push(flags);
    }
  }

  private createTitle(): void {
    const layout = this.getMenuLayout();

    if (this.textures.exists(MENU_ASSETS.logoOn)) {
      const logo = this.add.image(layout.scene.centerX, layout.title.y, MENU_ASSETS.logoOn);
      fitImageWithin(logo, layout.title.logoMaxWidth, layout.title.logoMaxHeight);
      this.logoImage = logo;
      this.introTargets.push(logo);
      this.startLogoBlink();
      return;
    }

    const [firstLine, secondLine = 'Mundial'] = GAME_TITLE.split(':').map((part) => part.trim());
    const title = this.add
      .text(layout.scene.centerX, layout.title.y + layout.title.fallbackTitleOffsetY, firstLine, {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.title.fallbackTitleFontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(layout.scene.centerX, layout.title.y + layout.title.fallbackSubtitleOffsetY, secondLine, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.title.fallbackSubtitleFontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const description = this.add
      .text(layout.scene.centerX, layout.subtitle.y, 'A card duel for soccer fans', {
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
    const layout = this.getMenuLayout();
    const buttonWidth = this.getMenuButtonWidth();
    const buttons = [
      new Button(this, layout.scene.centerX, layout.buttons.startY, 'Game modes', () => this.openGameModes(), {
        fontSize: layout.buttons.fontSize,
        height: layout.buttons.height,
        width: buttonWidth
      }),
      new Button(
        this,
        layout.scene.centerX,
        layout.buttons.startY + layout.buttons.gap,
        'Teams',
        () => this.scene.start('SquadSelectScene'),
        { fontSize: layout.buttons.fontSize, height: layout.buttons.height, width: buttonWidth }
      ),
      new Button(
        this,
        layout.scene.centerX,
        layout.buttons.startY + layout.buttons.gap * 2,
        'Rules',
        () => this.openRulesModal(),
        { fontSize: layout.buttons.fontSize, height: layout.buttons.height, width: buttonWidth }
      ),
      new Button(
        this,
        layout.scene.centerX,
        layout.buttons.startY + layout.buttons.gap * 3,
        'About',
        () => this.openAboutModal(),
        { fontSize: layout.buttons.fontSize, height: layout.buttons.height, width: buttonWidth }
      )
    ];

    this.introTargets.push(...buttons);
  }

  private createGameModeButtons(): void {
    const hasTournamentSave = hasActiveTournamentSave();
    const layout = this.getMenuLayout();
    const buttonWidth = this.getMenuButtonWidth();
    const title = this.add
      .text(layout.scene.centerX, layout.buttons.startY + layout.buttons.submenuTitleOffsetY, 'Game modes', {
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
          layout.scene.centerX,
          layout.buttons.startY + layout.buttons.gap * buttonIndex,
          'Continue tournament',
          () => this.continueTournament(),
          { fontSize: layout.buttons.fontSize, height: layout.buttons.height, width: buttonWidth }
        )
      );
      buttonIndex += 1;
    }

    buttons.push(
      new Button(
        this,
        layout.scene.centerX,
        layout.buttons.startY + layout.buttons.gap * buttonIndex,
        hasTournamentSave ? 'New tournament' : 'Tournaments',
        () => this.startNewTournamentSetup(),
        { fontSize: layout.buttons.fontSize, height: layout.buttons.height, width: buttonWidth }
      )
    );
    buttonIndex += 1;

    buttons.push(
      new Button(
        this,
        layout.scene.centerX,
        layout.buttons.startY + layout.buttons.gap * buttonIndex,
        'Quick match',
        () => this.scene.start('TeamSelectScene'),
        { fontSize: layout.buttons.fontSize, height: layout.buttons.height, width: buttonWidth }
      )
    );
    buttonIndex += 1;

    buttons.push(
      new Button(
        this,
        layout.scene.centerX,
        layout.buttons.startY + layout.buttons.gap * buttonIndex,
        'Penalty shootout',
        () => this.scene.start('TeamSelectScene', { mode: 'penalty' }),
        { fontSize: layout.buttons.fontSize, height: layout.buttons.height, width: buttonWidth }
      )
    );
    buttonIndex += 1;

    if (hasTournamentSave) {
      buttons.push(
        new Button(
          this,
          layout.scene.centerX,
          layout.buttons.startY + layout.buttons.gap * buttonIndex,
          'Delete save',
          () => this.deleteTournamentSave(),
          { fontSize: '20px', height: layout.buttons.height, width: buttonWidth }
        )
      );
      buttonIndex += 1;
    }

    buttons.push(
      new Button(
        this,
        layout.scene.centerX,
        layout.buttons.startY + layout.buttons.gap * buttonIndex,
        'Back',
        () => this.scene.start('MenuScene'),
        { fontSize: layout.buttons.fontSize, height: layout.buttons.height, width: buttonWidth }
      )
    );

    this.introTargets.push(...buttons);
  }

  private getMenuButtonWidth(): number {
    const layout = this.getMenuLayout();
    const maxButtonWidth = this.scale.width * layout.buttons.maxWidthRatio;

    if (this.logoImage !== null && this.logoImage.displayWidth > 0) {
      return Phaser.Math.Clamp(this.logoImage.displayWidth, layout.buttons.minWidth, maxButtonWidth);
    }

    return Phaser.Math.Clamp(
      Math.min(this.scale.width * layout.buttons.fallbackWidthRatio, layout.buttons.fallbackMaxWidth),
      layout.buttons.minWidth,
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
    const layout = this.getMenuLayout();
    const disclaimer = this.add
      .text(layout.scene.centerX, layout.footer.y, LEGAL_DISCLAIMER_TEXT, {
        align: 'center',
        color: '#c4d6cc',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.footer.disclaimerFontSize,
        lineSpacing: 3,
        wordWrap: { width: layout.footer.disclaimerWidth }
      })
      .setOrigin(0.5, 1)
      .setAlpha(0.82);
    const version = this.add
      .text(SCENE_WIDTH - layout.footer.margin, SCENE_HEIGHT - layout.footer.margin, `v${GAME_VERSION}`, {
        align: 'right',
        color: '#b8d2c1',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.footer.versionFontSize,
        fontStyle: '700'
      })
      .setOrigin(1, 1);

    this.introTargets.push(disclaimer, version);
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
    const layout = this.getMenuLayout();
    this.logoImage.setTexture(step.textureKey);
    fitImageWithin(this.logoImage, layout.title.logoMaxWidth, layout.title.logoMaxHeight);
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
    const layout = this.getMenuLayout();
    const info = layout.info;
    const aboutContent = ABOUT_CONTENT[this.aboutLanguage];
    const rulesContent = RULES_CONTENT[this.aboutLanguage];
    const titleText = kind === 'about' ? aboutContent.title : rulesContent.title;
    const modal = this.add.container(0, 0);
    const overlay = this.add.rectangle(layout.scene.centerX, layout.scene.centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x06140f, 0.72);
    overlay.setInteractive();

    const panel = this.add.container(layout.scene.centerX, layout.scene.centerY);
    const background = this.add.rectangle(0, 0, info.modal.width, info.modal.height, SCORE_VIEW_BACKGROUND_COLOR, 0.98);
    background.setStrokeStyle(2, 0x9dd2a7);

    const backButton = this.createInfoBackButton(info);
    const languageSelector = this.createAboutLanguageSelector(info);
    const title = this.add
      .text(0, info.titleY, titleText, {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(0, info.subtitleY, `${GAME_TITLE} | v${GAME_VERSION}`, {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const author = this.add
      .text(0, info.authorY, `${aboutContent.authorLabel}: ${GAME_AUTHOR}`, {
        align: 'center',
        color: '#8fd4ff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    setTouchFriendlyInteractive(author, Math.max(author.width, 1), Math.max(author.height, 1));
    author.on('pointerover', () => author.setColor('#bfe7ff'));
    author.on('pointerout', () => author.setColor('#8fd4ff'));
    author.on('pointerdown', () => window.open(GAME_AUTHOR_URL, '_blank', 'noopener,noreferrer'));

    const viewport = kind === 'about' ? this.createAboutViewport(aboutContent, info) : this.createRulesViewport(rulesContent, info);

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

  private createInfoBackButton(info: MenuInfoLayout): Phaser.GameObjects.Container {
    return new Button(this, 0, info.backButton.y, 'Back', () => this.closeAboutModal(), {
      fontSize: info.backButton.fontSize,
      height: info.backButton.height,
      width: info.backButton.width
    });
  }

  private createAboutLanguageSelector(info: MenuInfoLayout): Phaser.GameObjects.Container {
    const selector = this.add.container(info.languageSelector.x, info.languageSelector.y);
    const startX = -62;

    ABOUT_LANGUAGES.forEach((language, index) => {
      const isActive = language === this.aboutLanguage;
      const label = this.add
        .text(startX + index * info.languageSelector.itemGap, 0, getAboutLanguageCode(language), {
          align: 'center',
          color: isActive ? '#f0c95a' : '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: '700'
        })
        .setOrigin(0.5);

      if (!isActive) {
        setTouchFriendlyInteractive(label, Math.max(label.width, 1), Math.max(label.height, 1));
        label.on('pointerover', () => label.setColor('#ffffff'));
        label.on('pointerout', () => label.setColor('#d9eadf'));
        label.on('pointerdown', () => this.switchAboutLanguage(language));
      }

      selector.add(label);

      if (index < ABOUT_LANGUAGES.length - 1) {
        selector.add(
          this.add
            .text(startX + index * info.languageSelector.itemGap + info.languageSelector.itemGap / 2, 0, '|', {
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

  private createAboutViewport(
    content: (typeof ABOUT_CONTENT)[AboutLanguage],
    info: MenuInfoLayout
  ): Phaser.GameObjects.Container {
    const wrapper = this.add.container(0, 0);
    const viewport = info.viewport;
    const scrollContent = this.add.container(0, viewport.y);
    let contentHeight = 0;

    content.paragraphs.forEach((paragraph) => {
      const text = this.add
        .text(viewport.x, contentHeight, paragraph, {
          align: 'left',
          color: '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          lineSpacing: 12,
          wordWrap: { width: viewport.width }
        })
        .setOrigin(0, 0);

      scrollContent.add(text);
      contentHeight += text.height + 28;
    });

    content.sections.forEach((section) => {
      const heading = this.add
        .text(viewport.x, contentHeight + 4, section.heading, {
          align: 'left',
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: '19px',
          fontStyle: '700',
          wordWrap: { width: viewport.width }
        })
        .setOrigin(0, 0);

      scrollContent.add(heading);
      contentHeight += heading.height + 18;

      section.body.forEach((paragraph) => {
        const text = this.add
          .text(viewport.x, contentHeight, paragraph, {
            align: 'left',
            color: '#d9eadf',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            lineSpacing: 8,
            wordWrap: { width: viewport.width }
          })
          .setOrigin(0, 0);

        scrollContent.add(text);
        contentHeight += text.height + 10;
      });

      contentHeight += 12;
    });

    this.applyScrollableViewport(wrapper, scrollContent, contentHeight, info);

    return wrapper;
  }

  private createRulesViewport(
    content: (typeof RULES_CONTENT)[AboutLanguage],
    info: MenuInfoLayout
  ): Phaser.GameObjects.Container {
    const wrapper = this.add.container(0, 0);
    const viewport = info.viewport;
    const scrollContent = this.add.container(0, viewport.y);
    let contentHeight = 0;

    content.sections.forEach((section, index) => {
      const heading = this.add
        .text(viewport.x, contentHeight, section.heading, {
          align: 'left',
          color: index === 0 ? '#f0c95a' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: index === 0 ? '22px' : '19px',
          fontStyle: '700',
          wordWrap: { width: viewport.width }
        })
        .setOrigin(0, 0);

      scrollContent.add(heading);
      contentHeight += heading.height + 8;

      section.body.forEach((paragraph) => {
        const body = this.add
          .text(viewport.x, contentHeight, paragraph, {
            align: 'left',
            color: '#d9eadf',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            lineSpacing: 8,
            wordWrap: { width: viewport.width }
          })
          .setOrigin(0, 0);

        scrollContent.add(body);
        contentHeight += body.height + 6;
      });

      contentHeight += 12;
    });

    this.applyScrollableViewport(wrapper, scrollContent, contentHeight, info);

    return wrapper;
  }

  private applyScrollableViewport(
    wrapper: Phaser.GameObjects.Container,
    scrollContent: Phaser.GameObjects.Container,
    contentHeight: number,
    info: MenuInfoLayout
  ): void {
    const layout = this.getMenuLayout();
    const viewport = info.viewport;
    const maxScroll = Math.max(0, contentHeight - viewport.height);
    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(
        layout.scene.centerX + viewport.x,
        layout.scene.centerY + viewport.y,
        viewport.width,
        viewport.height
      )
      .createGeometryMask();
    maskGraphics.setVisible(false);
    scrollContent.setMask(mask);
    wrapper.once(Phaser.GameObjects.Events.DESTROY, () => maskGraphics.destroy());

    const scrollZone = this.add
      .zone(0, viewport.y + viewport.height / 2, viewport.width, viewport.height)
      .setInteractive();

    wrapper.add([scrollContent, scrollZone]);

    if (maxScroll <= 0) {
      return;
    }

    const trackX = viewport.x + viewport.width + 16;
    const track = this.add.rectangle(trackX, viewport.y + viewport.height / 2, 4, viewport.height, 0x5f9572, 0.28);
    const thumbHeight = Math.max(28, (viewport.height / contentHeight) * viewport.height);
    const thumb = this.add.rectangle(trackX, viewport.y + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);
    let scrollY = 0;
    let dragPointerId: number | null = null;
    let lastDragY = 0;

    const setScroll = (value: number): void => {
      scrollY = Phaser.Math.Clamp(value, 0, maxScroll);
      scrollContent.y = viewport.y - scrollY;
      thumb.y = viewport.y + thumbHeight / 2 + (scrollY / maxScroll) * (viewport.height - thumbHeight);
    };

    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(scrollY + deltaY * 0.35);
    });
    scrollZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragPointerId = pointer.id;
      lastDragY = pointer.y;
    });
    scrollZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (dragPointerId !== pointer.id || !pointer.isDown) {
        return;
      }

      setScroll(scrollY + (lastDragY - pointer.y));
      lastDragY = pointer.y;
    });
    scrollZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (dragPointerId === pointer.id) {
        dragPointerId = null;
      }
    });
    scrollZone.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      if (dragPointerId === pointer.id) {
        dragPointerId = null;
      }
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

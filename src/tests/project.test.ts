import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAME_AUTHOR, GAME_AUTHOR_URL, GAME_TITLE, GAME_VERSION, MENU_ASSETS, MENU_ASSET_PATHS } from '../config';
import { NATIONAL_TEAMS } from '../data/nationalTeams';

describe('project scaffold', () => {
  it('uses the required game title', () => {
    expect(GAME_TITLE).toBe('Total Soccer: Mundial');
  });

  it('uses the required game version', () => {
    expect(GAME_VERSION).toBe('1.3.2');
  });

  it('uses the configured game author', () => {
    expect(GAME_AUTHOR).toBe('Oleh Myronchuk');
    expect(GAME_AUTHOR_URL).toBe('https://www.linkedin.com/in/myronczuk-oleg/');
  });

  it('does not render an OUT button in the match scene', () => {
    const gameSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');

    expect(gameSceneSource).not.toContain("'OUT'");
    expect(gameSceneSource).not.toContain('"OUT"');
  });

  it('prepares the main menu asset folder and architecture', () => {
    const menuSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');
    const bootSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'BootScene.ts'), 'utf8');
    const configSource = readFileSync(join(process.cwd(), 'src', 'config.ts'), 'utf8');

    expect(existsSync(join(process.cwd(), 'public', 'menu'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'README.md'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'menu-logo1.png'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'menu-logo2.png'))).toBe(true);
    expect(MENU_ASSETS.logoOn).toBe('menu-logo-on');
    expect(MENU_ASSETS.logoOff).toBe('menu-logo-off');
    expect(MENU_ASSET_PATHS.logoOn).toBe('menu/menu-logo1.png');
    expect(MENU_ASSET_PATHS.logoOff).toBe('menu/menu-logo2.png');
    expect(menuSceneSource).toContain('createBackground');
    expect(menuSceneSource).toContain('createOverlay');
    expect(menuSceneSource).toContain('createDecor');
    expect(menuSceneSource).toContain('createTitle');
    expect(menuSceneSource).toContain('createButtons');
    expect(menuSceneSource).toContain('createFooter');
    expect(menuSceneSource).toContain('MENU_LAYOUT');
    expect(bootSceneSource).toContain('MENU_ASSETS.background');
    expect(bootSceneSource).toContain('MENU_ASSETS.logoOn');
    expect(bootSceneSource).toContain('MENU_ASSETS.logoOff');
    expect(configSource).not.toContain('menu-logo.png');
    expect(configSource).not.toContain('menu-ball');
    expect(menuSceneSource).not.toContain('MENU_ASSETS.ball');
    expect(menuSceneSource).not.toContain('turn-ball');
    expect(menuSceneSource).not.toContain('fillTriangle');
  });

  it('uses a blinking scoreboard logo without stretching or old menu decorations', () => {
    const menuSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');

    expect(menuSceneSource).toContain('LOGO_BLINK_PATTERN');
    expect(menuSceneSource).toContain('LOGO_BLINK_INITIAL_DELAY_MS');
    expect(menuSceneSource).toContain('private logoBlinkTimer?: Phaser.Time.TimerEvent');
    expect(menuSceneSource).toContain('this.logoBlinkTimer?.remove(false)');
    expect(menuSceneSource).toContain('Phaser.Scenes.Events.SHUTDOWN');
    expect(menuSceneSource).toContain('Phaser.Scenes.Events.DESTROY');
    expect(menuSceneSource).toContain('this.textures.exists(MENU_ASSETS.logoOn)');
    expect(menuSceneSource).toContain('this.textures.exists(MENU_ASSETS.logoOff)');
    expect(menuSceneSource).toContain('this.logoImage.setTexture(step.textureKey)');
    expect(menuSceneSource).toContain('function fitImageWithin');
    expect(menuSceneSource).toContain('image.setScale(Math.min(maxWidth / image.width, maxHeight / image.height))');
    expect(menuSceneSource).not.toContain('setDisplaySize(Math.min(logo.width');
    expect(menuSceneSource).not.toContain('playIdleAnimation');
    expect(menuSceneSource).not.toContain('idleTargets');
  });

  it('matches main menu and game mode button widths to the scoreboard logo', () => {
    const menuSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');

    expect(menuSceneSource).toContain('private getMenuButtonWidth(): number');
    expect(menuSceneSource).toContain('this.logoImage.displayWidth');
    expect(menuSceneSource).toContain('Phaser.Math.Clamp(this.logoImage.displayWidth');
    expect(menuSceneSource).toContain('this.scale.width * MENU_LAYOUT.buttonMaxWidthRatio');
    expect(menuSceneSource).toContain('MENU_LAYOUT.fallbackButtonWidthRatio');
    expect(menuSceneSource).toContain('MENU_LAYOUT.fallbackButtonMaxWidth');
    expect(menuSceneSource.match(/const buttonWidth = this\.getMenuButtonWidth\(\);/g)?.length).toBe(2);
    expect(menuSceneSource.match(/width: buttonWidth/g)?.length).toBeGreaterThanOrEqual(8);
    expect(menuSceneSource).not.toContain('{ width: 280 }');
    expect(menuSceneSource).not.toContain('fontSize: \'20px\', width: 280');
  });

  it('groups main menu actions into game modes, squads and about', () => {
    const menuSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');

    expect(menuSceneSource).toContain('Game modes');
    expect(menuSceneSource).toContain('Tournaments');
    expect(menuSceneSource).toContain('Quick match');
    expect(menuSceneSource).toContain('Penalty shootout');
    expect(menuSceneSource).toContain('Teams');
    expect(menuSceneSource).toContain('Rules');
    expect(menuSceneSource).toContain('About');
    expect(menuSceneSource).toContain('GAME_AUTHOR_URL');
    expect(menuSceneSource).toContain('ABOUT_LANGUAGES');
    expect(menuSceneSource).toContain('ABOUT_CONTENT');
    expect(menuSceneSource).toContain('LEGAL_DISCLAIMER_TEXT');
    expect(menuSceneSource).toContain('This is an unofficial football card game.');
    expect(menuSceneSource).toContain('RULES_CONTENT');
    expect(menuSceneSource).toContain("import { SCORE_VIEW_BACKGROUND_COLOR } from '../ui/ScoreView'");
    expect(menuSceneSource).toContain(
      'this.add.rectangle(0, 0, ABOUT_MODAL.width, ABOUT_MODAL.height, SCORE_VIEW_BACKGROUND_COLOR, 0.98)'
    );
    expect(menuSceneSource).toContain('openRulesModal');
    expect(menuSceneSource).toContain("return 'EN'");
    expect(menuSceneSource).toContain("return 'PL'");
    expect(menuSceneSource).toContain("return 'UA'");
    expect(menuSceneSource).toContain('createInfoBackButton');
    expect(menuSceneSource).toContain('const INFO_BACK_BUTTON = {');
    expect(menuSceneSource).toContain("return new Button(this, 0, INFO_BACK_BUTTON.y, 'Back', () => this.closeAboutModal()");
    expect(menuSceneSource).toContain('height: 360');
    expect(menuSceneSource).not.toContain("text(0, -1, '<'");
    expect(menuSceneSource).toContain('createAboutViewport');
    expect(menuSceneSource).toContain('createGeometryMask');
    expect(menuSceneSource).toContain("scrollZone.on('wheel'");
    expect(menuSceneSource).toContain("this.scene.start('TeamSelectScene', { mode: 'penalty' })");
    expect(menuSceneSource).not.toContain('createStandalonePenaltyMatchResult');
  });

  it('separates localized about text from the rules modal', () => {
    const menuSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');

    expect(menuSceneSource).toContain('TOTAL SOCCER: MUNDIAL is a retro card-football game');
    expect(menuSceneSource).toContain('TOTAL SOCCER: MUNDIAL to retro kartkowa gra');
    expect(menuSceneSource).toContain('TOTAL SOCCER: MUNDIAL — це ретро-карткова футбольна гра');
    expect(menuSceneSource).toContain('Legal / Disclaimer');
    expect(menuSceneSource).toContain('Informacje prawne / Zastrzezenie');
    expect(menuSceneSource).toContain('Правова інформація / Дисклеймер');
    expect(menuSceneSource).toContain('All team names, player names, kits, card backs, and visual elements used in the game are fictional');
    expect(menuSceneSource).toContain("title: 'Про гру'");
    expect(menuSceneSource).toContain("authorLabel: 'Автор'");
    expect(menuSceneSource).toContain('createAboutViewport(aboutContent)');
    expect(menuSceneSource).toContain('createRulesViewport(rulesContent)');
    expect(menuSceneSource).toContain("const viewport = kind === 'about'");
    expect(menuSceneSource).not.toContain("uk: {\n    title: 'About'");
    expect(menuSceneSource).not.toContain('content.rules');
  });

  it('ships localized rules covering current card, goalkeeper, midfield, penalty and tournament contracts', () => {
    const menuSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');

    expect(menuSceneSource).toContain('TOTAL SOCCER: MUNDIAL — Rules');
    expect(menuSceneSource).toContain('TOTAL SOCCER: MUNDIAL — Zasady');
    expect(menuSceneSource).toContain('TOTAL SOCCER: MUNDIAL — Правила');
    expect(menuSceneSource).toContain('2 beats JOKER.');
    expect(menuSceneSource).toContain('6 beats A.');
    expect(menuSceneSource).toContain('7 beats K.');
    expect(menuSceneSource).toContain('8 beats Q.');
    expect(menuSceneSource).toContain('9 beats J.');
    expect(menuSceneSource).toContain('A committed midfielder must strictly beat the opposite midfielder');
    expect(menuSceneSource).toContain('An open midfield zone works like a weak rank-2 gap.');
    expect(menuSceneSource).toContain('The goalkeeper is resolved with a separate goalkeeper card.');
    expect(menuSceneSource).toContain('Penalty shootouts use a separate penalty system.');
    expect(menuSceneSource).toContain('Tournament mode supports group matches');
    expect(menuSceneSource).toContain('2 pokonuje JOKERA.');
    expect(menuSceneSource).toContain('2 б’є JOKER.');
    expect(menuSceneSource).toContain('Воротарська колода звичайного матчу не використовується в пенальті.');
  });

  it('provides 65 unique national teams for match setup', () => {
    const teamNames = NATIONAL_TEAMS.map((team) => team.name);

    expect(NATIONAL_TEAMS).toHaveLength(65);
    expect(new Set(teamNames).size).toBe(65);
  });

  it('keeps Northern Ireland separate from Ireland', () => {
    const ireland = NATIONAL_TEAMS.find((team) => team.name === 'Ireland');
    const northernIreland = NATIONAL_TEAMS.find((team) => team.name === 'Northern Ireland');

    expect(ireland).toMatchObject({ flagCode: 'ie' });
    expect(northernIreland).toMatchObject({ flagCode: 'nir' });
    expect(ireland?.flagCode).not.toBe(northernIreland?.flagCode);
    expect(northernIreland?.rank).toBe(38);
  });

  it('keeps national teams alphabetized with the selected replacements', () => {
    const teamNames = NATIONAL_TEAMS.map((team) => team.name);

    expect(teamNames).toEqual([...teamNames].sort((first, second) => first.localeCompare(second)));
    expect(teamNames).toEqual(expect.arrayContaining(['Armenia', 'Belarus', 'Georgia', 'Kazakhstan']));
    expect(teamNames).not.toEqual(expect.arrayContaining(['Russia', 'Burkina Faso', 'DR Congo', 'Jordan']));
  });

  it('has a local svg flag for every national team', () => {
    for (const team of NATIONAL_TEAMS) {
      expect(team.flagCode).not.toBe('');
      expect(existsSync(join(process.cwd(), 'public', 'flags', `${team.flagCode}.svg`))).toBe(true);
    }
  });

  it('provides the national deck cover folder and fallback cover', () => {
    expect(existsSync(join(process.cwd(), 'public', 'covers'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'covers', 'none.webp'))).toBe(true);
  });

  it('ships production game assets from public with normalized paths', () => {
    const requiredAssets = [
      join('public', 'cards', 'ball.webp'),
      join('public', 'sounds', 'referees-whistle-start.mp3'),
      join('public', 'sounds', 'referees-whistle-finish.mp3'),
      join('public', 'sounds', 'bolely-net.mp3'),
      join('public', 'sounds', 'penalty-goal.mp3'),
      join('public', 'sounds', 'bolely-goal.mp3'),
      join('public', 'sounds', 'shtanga.mp3')
    ];

    for (const assetPath of requiredAssets) {
      expect(existsSync(join(process.cwd(), assetPath))).toBe(true);
    }

    const source = [
      readFileSync(join(process.cwd(), 'src', 'scenes', 'BootScene.ts'), 'utf8'),
      readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8'),
      readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8'),
      readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentPenaltyScene.ts'), 'utf8')
    ].join('\n');

    expect(source).not.toContain('/Sounds/');
    expect(source).not.toContain('Sounds/');
    expect(source).not.toContain('referees-whistle_start');
    expect(source).not.toContain('referees-whistle_finish');
    expect(source).toContain("'/cards/ball.webp'");
    expect(source).toContain("'/sounds/referees-whistle-start.mp3'");
    expect(source).toContain('playSoundSafe');
  });

  it('keeps final match statistics labels readable', () => {
    const resultSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8');
    const gameSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');
    const teamStatsViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'TeamStatsView.ts'), 'utf8');

    expect(resultSceneSource).toContain("'Goalscorers'");
    expect(resultSceneSource).toContain('formatGoalScorerLabel(scorer)');
    expect(gameSceneSource).toContain('formatGoalScorerMatchLabel');
    expect(teamStatsViewSource).toContain("options.scorers.join('\\n')");
    expect(teamStatsViewSource).toContain("options.scorers.length === 0 ? '-'");
    expect(teamStatsViewSource).not.toContain('No goals yet');
    expect(teamStatsViewSource).toContain('x + maskLeft');
    expect(teamStatsViewSource).toContain('y + maskTop');
    expect(teamStatsViewSource).toContain('createGeometryMask');
    expect(teamStatsViewSource).toContain("scrollZone.on('wheel'");
    expect(resultSceneSource).not.toContain('Winner');
    expect(resultSceneSource).not.toContain("'Post'");
    expect(resultSceneSource).not.toContain("'GK saves'");
    expect(resultSceneSource).not.toContain("'Conversion'");
    expect(resultSceneSource).not.toContain("'None yet'");
    expect(resultSceneSource).not.toMatch(/[ĐŃ]/);
  });

  it('clips and scrolls long final match scorer lists', () => {
    const resultSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8');

    expect(resultSceneSource).toContain('createGeometryMask');
    expect(resultSceneSource).toContain("scrollZone.on('wheel'");
    expect(resultSceneSource).toContain('timelineContent.setMask');
  });

  it('starts goalkeeper outcome sounds at attack-card impact time', () => {
    const gameSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');

    expect(gameSceneSource).toMatch(
      /this\.showImpactPulse\(target\.x, target\.y, outcome\);\s+this\.playGoalkeeperImpactSound\(context\.positionId, outcome\);/
    );
    expect(gameSceneSource).toContain("case 'goal':");
    expect(gameSceneSource).toContain("this.playSound('sound-goal', 0.72)");
    expect(gameSceneSource).toContain("case 'post':");
    expect(gameSceneSource).toContain("this.playSound('sound-goalpost', 0.72)");
    expect(gameSceneSource).toContain("case 'save':");
    expect(gameSceneSource).toContain("this.playSound('sound-goalkeeper-save', 0.72)");
    expect(gameSceneSource).not.toContain('this.playSound(goalEffect.soundKey');
  });

  it('keeps the advantage bar active at match start and neutral 50/50', () => {
    const advantageViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'AdvantageView.ts'), 'utf8');

    expect(advantageViewSource).not.toContain('hasPoints ?');
    expect(advantageViewSource).not.toContain(': 0.35');
    expect(advantageViewSource.match(/0\.96/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

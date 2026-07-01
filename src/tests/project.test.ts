import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GAME_AUTHOR,
  GAME_AUTHOR_URL,
  GAME_TITLE,
  GAME_VERSION,
  MENU_ASSETS,
  MENU_ASSET_PATHS,
  TOURNAMENT_ASSETS,
  TOURNAMENT_ASSET_PATHS
} from '../config';
import { getTeamScoreboardCode, NATIONAL_TEAMS, TEAM_SCOREBOARD_CODES } from '../data/nationalTeams';

const SOURCE_FILE_EXTENSIONS = new Set(['.css', '.html', '.ts']);

function normalizeSourceLineEndings(source: string): string {
  return source.replace(/\r\n/g, '\n');
}

function collectProjectSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'tests') {
        continue;
      }

      files.push(...collectProjectSourceFiles(fullPath));
      continue;
    }

    if (entry.isFile() && SOURCE_FILE_EXTENSIONS.has(fullPath.slice(fullPath.lastIndexOf('.')))) {
      files.push(fullPath);
    }
  }

  return files;
}

function readProductionSource(): string {
  const sourceFiles = [join(process.cwd(), 'index.html'), ...collectProjectSourceFiles(join(process.cwd(), 'src'))];

  return normalizeSourceLineEndings(sourceFiles.map((sourceFile) => readFileSync(sourceFile, 'utf8')).join('\n'));
}

describe('project scaffold', () => {
  it('uses the required game title', () => {
    expect(GAME_TITLE).toBe('Total Soccer: Mundial');
  });

  it('uses the required game version', () => {
    expect(GAME_VERSION).toBe('1.4.0');
  });

  it('auto-syncs kit registry through the Vite dev and build pipeline', () => {
    const viteConfigSource = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');
    const kitRegistryPluginSource = readFileSync(
      join(process.cwd(), 'scripts', 'vite-kit-registry-plugin.ts'),
      'utf8'
    );

    expect(viteConfigSource).toContain('createKitRegistrySyncPlugin()');
    expect(kitRegistryPluginSource).toContain('syncKitRegistry({');
    expect(kitRegistryPluginSource).toContain("environment.command === 'serve' || environment.command === 'build'");
    expect(kitRegistryPluginSource).toContain("server.watcher.add(join(projectRoot, KIT_IMAGE_GLOB))");
    expect(kitRegistryPluginSource).toContain("server.watcher.on('add', handleKitFileEvent)");
    expect(kitRegistryPluginSource).toContain("server.watcher.on('change', handleKitFileEvent)");
    expect(kitRegistryPluginSource).toContain("server.watcher.on('unlink', handleKitFileEvent)");
    expect(kitRegistryPluginSource).toContain("server.ws.send({ type: 'full-reload' })");
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

  it('shows a mobile portrait orientation overlay from static bootstrap markup', () => {
    const indexSource = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const stylesSource = readFileSync(join(process.cwd(), 'src', 'styles', 'main.css'), 'utf8');

    expect(indexSource).toContain('id="orientation-overlay"');
    expect(indexSource).toContain('hidden role="status"');
    expect(indexSource).toContain('Please rotate your device');
    expect(indexSource).toContain('Use landscape mode');
    expect(indexSource).toContain("window.matchMedia('(pointer: coarse)').matches");
    expect(indexSource).toContain("window.addEventListener('resize', updateOrientationOverlay)");
    expect(indexSource).toContain("window.addEventListener('orientationchange', updateOrientationOverlay)");
    expect(indexSource).toContain("window.addEventListener('DOMContentLoaded', updateOrientationOverlay, { once: true })");
    expect(indexSource).toContain("window.dispatchEvent(new Event('tsm:landscape-visible'))");
    expect(stylesSource).toContain('#orientation-overlay');
    expect(stylesSource).toContain('#orientation-overlay[hidden]');
    expect(stylesSource).toContain('touch-action: none');
  });

  it('schedules a soft Phaser scale refresh after orientation and viewport changes', () => {
    const mainSource = readFileSync(join(process.cwd(), 'src', 'main.ts'), 'utf8');

    expect(mainSource).toContain('const game = new Phaser.Game(config);');
    expect(mainSource).toContain('function scheduleScaleRefresh()');
    expect(mainSource).toContain('window.clearTimeout(timer)');
    expect(mainSource.match(/game\.scale\.refresh\(\);/g)).toHaveLength(2);
    expect(mainSource).toContain('}, 150)');
    expect(mainSource).toContain('}, 500)');
    expect(mainSource).toContain("window.addEventListener('orientationchange', scheduleScaleRefresh)");
    expect(mainSource).toContain("window.addEventListener('resize', scheduleScaleRefresh)");
    expect(mainSource).toContain("window.addEventListener('tsm:landscape-visible', scheduleScaleRefresh)");
    expect(mainSource).not.toContain('game.scale.resize');
    expect(mainSource).not.toContain('game.scale.updateBounds');
  });

  it('uses rounded renderer pixels without switching the whole game to pixel art', () => {
    const mainSource = readFileSync(join(process.cwd(), 'src', 'main.ts'), 'utf8');

    expect(mainSource).toContain('render: {');
    expect(mainSource).toContain('antialias: true');
    expect(mainSource).toContain('pixelArt: false');
    expect(mainSource).toContain('roundPixels: true');
  });

  it('keeps mobile orientation handling away from forced locks and viewport resize hooks', () => {
    const productionSource = readProductionSource();
    const forcedOrientationLock = ['screen', 'orientation', 'lock'].join('.');
    const visualViewportResize = ['visualViewport', 'resize'].join('.');
    const scaleUpdateBounds = ['game', 'scale', 'updateBounds'].join('.');

    expect(productionSource).not.toContain(forcedOrientationLock);
    expect(productionSource).not.toContain(visualViewportResize);
    expect(productionSource).not.toContain(scaleUpdateBounds);
  });

  it('does not add manual canvas CSS sizing or transforms', () => {
    const stylesSource = readFileSync(join(process.cwd(), 'src', 'styles', 'main.css'), 'utf8');
    const canvasRules = stylesSource.match(/(?:^|})\s*[^{}]*canvas[^{}]*\{[^}]*\}/g) ?? [];

    expect(canvasRules).toEqual([]);
    expect(stylesSource).not.toMatch(/canvas[^{}]*\{[^}]*(?:width|height|transform)\s*:/);
    expect(stylesSource).not.toMatch(/canvas[^{}]*\{[^}]*scale\s*\(/);
  });

  it('prepares the main menu asset folder and architecture', () => {
    const menuSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');
    const bootSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'BootScene.ts'), 'utf8');
    const configSource = readFileSync(join(process.cwd(), 'src', 'config.ts'), 'utf8');

    expect(existsSync(join(process.cwd(), 'public', 'menu'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'README.md'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'menu-logo1.png'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'menu-logo2.png'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'teams-bg.webp'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'menu-2-bg.webp'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'tournaments-bg.webp'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'cup-stats-bg.webp'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'cup-win-bg.webp'))).toBe(true);
    expect(MENU_ASSETS.logoOn).toBe('menu-logo-on');
    expect(MENU_ASSETS.logoOff).toBe('menu-logo-off');
    expect(MENU_ASSETS.teamsBackground).toBe('teams-bg');
    expect(MENU_ASSETS.teamSelectBackground).toBe('team-select-bg');
    expect(MENU_ASSETS.resultDrawBackground).toBe('result-draw-bg');
    expect(MENU_ASSETS.resultWinBackground).toBe('result-win-bg');
    expect(MENU_ASSET_PATHS.logoOn).toBe('menu/menu-logo1.png');
    expect(MENU_ASSET_PATHS.logoOff).toBe('menu/menu-logo2.png');
    expect(MENU_ASSET_PATHS.teamsBackground).toBe('menu/teams-bg.webp');
    expect(MENU_ASSET_PATHS.teamSelectBackground).toBe('menu/menu-2-bg.webp');
    expect(MENU_ASSET_PATHS.resultDrawBackground).toBe('menu/remis-bg.webp');
    expect(MENU_ASSET_PATHS.resultWinBackground).toBe('menu/gamestat-bg.webp');
    expect(TOURNAMENT_ASSETS.background).toBe('tournaments-bg');
    expect(TOURNAMENT_ASSETS.statsBackground).toBe('cup-stats-bg');
    expect(TOURNAMENT_ASSETS.winnerBackground).toBe('cup-win-bg');
    expect(TOURNAMENT_ASSET_PATHS.background).toBe('/menu/tournaments-bg.webp');
    expect(TOURNAMENT_ASSET_PATHS.statsBackground).toBe('/menu/cup-stats-bg.webp');
    expect(TOURNAMENT_ASSET_PATHS.winnerBackground).toBe('/menu/cup-win-bg.webp');
    expect(menuSceneSource).toContain('createBackground');
    expect(menuSceneSource).toContain('createOverlay');
    expect(menuSceneSource).toContain('createDecor');
    expect(menuSceneSource).toContain('createTitle');
    expect(menuSceneSource).toContain('createButtons');
    expect(menuSceneSource).toContain('createFooter');
    expect(menuSceneSource).toContain('MENU_LAYOUT');
    expect(bootSceneSource).toContain('MENU_ASSETS.background');
    expect(bootSceneSource).toContain('MENU_ASSETS.teamsBackground');
    expect(bootSceneSource).toContain('MENU_ASSETS.teamSelectBackground');
    expect(bootSceneSource).toContain('TOURNAMENT_ASSETS.background');
    expect(bootSceneSource).toContain('TOURNAMENT_ASSET_PATHS.background');
    expect(bootSceneSource).toContain('TOURNAMENT_ASSETS.statsBackground');
    expect(bootSceneSource).toContain('TOURNAMENT_ASSET_PATHS.statsBackground');
    expect(bootSceneSource).toContain('TOURNAMENT_ASSETS.winnerBackground');
    expect(bootSceneSource).toContain('TOURNAMENT_ASSET_PATHS.winnerBackground');
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

    expect(menuSceneSource).toContain("import { isMobileLandscapeLayout } from '../ui/mobileLayout'");
    expect(menuSceneSource).toContain('private getMenuButtonWidth(): number');
    expect(menuSceneSource).toContain('const mobileWide = isMobileLandscapeLayout()');
    expect(menuSceneSource).toContain('this.logoImage.displayWidth');
    expect(menuSceneSource).toContain('Phaser.Math.Clamp(this.logoImage.displayWidth');
    expect(menuSceneSource).toContain('this.scale.width * MENU_LAYOUT.buttonMaxWidthRatio');
    expect(menuSceneSource).toContain('buttonHeight: 62');
    expect(menuSceneSource).toContain("buttonFontSize: '24px'");
    expect(menuSceneSource).toContain('private getMenuButtonOptions(width: number)');
    expect(menuSceneSource).toContain('MENU_LAYOUT.fallbackButtonWidthRatio');
    expect(menuSceneSource).toContain('MENU_LAYOUT.fallbackButtonMaxWidth');
    expect(menuSceneSource).toContain('MENU_LAYOUT.mobileWideButtonWidthRatio');
    expect(menuSceneSource).toContain('MENU_LAYOUT.mobileWideButtonMaxWidth');
    expect(menuSceneSource).toContain('Math.max(this.logoImage.displayWidth, fallbackButtonWidth)');
    expect(menuSceneSource.match(/const buttonWidth = this\.getMenuButtonWidth\(\);/g)?.length).toBe(3);
    expect(menuSceneSource.match(/buttonOptions/g)?.length).toBeGreaterThanOrEqual(8);
    expect(menuSceneSource).toContain('height: MENU_LAYOUT.buttonHeight');
    expect(menuSceneSource).toContain('fontSize: MENU_LAYOUT.buttonFontSize');
    expect(menuSceneSource).toContain('width');
    expect(menuSceneSource).not.toContain('{ width: 280 }');
    expect(menuSceneSource).not.toContain('fontSize: \'20px\', width: 280');
  });

  it('groups main menu actions into game modes, squads and about', () => {
    const menuSceneSource = normalizeSourceLineEndings(readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8'));

    expect(menuSceneSource).toContain('Game modes');
    expect(menuSceneSource).toContain('Tournament');
    expect(menuSceneSource).toContain('Quick match');
    expect(menuSceneSource).toContain('Penalty shootout');
    expect(menuSceneSource).toContain('Teams');
    expect(menuSceneSource).toContain('Rules');
    expect(menuSceneSource).toContain('About');
    expect(menuSceneSource).toContain('GAME_AUTHOR_URL');
    expect(menuSceneSource).toContain('ABOUT_LANGUAGES');
    expect(menuSceneSource).toContain('ABOUT_CONTENT');
    expect(menuSceneSource).toContain('LEGAL_DISCLAIMER_TEXT');
    expect(menuSceneSource).toContain('`${GAME_TITLE} | v${GAME_VERSION}`');
    expect(menuSceneSource).toContain('This is an unofficial football card game.');
    expect(menuSceneSource).toContain('RULES_CONTENT');
    expect(menuSceneSource).toContain('const ABOUT_MODAL_BACKGROUND_COLOR = 0x000000');
    expect(menuSceneSource).toContain('const ABOUT_MODAL_BACKGROUND_ALPHA = 0.82');
    expect(menuSceneSource).toContain(
      'ABOUT_MODAL.width,\n      ABOUT_MODAL.height,\n      ABOUT_MODAL_BACKGROUND_COLOR,\n      ABOUT_MODAL_BACKGROUND_ALPHA'
    );
    expect(menuSceneSource).not.toContain('background.setStrokeStyle(2, 0x9dd2a7)');
    expect(menuSceneSource).toContain('openRulesModal');
    expect(menuSceneSource).toContain('getPreferredLanguage()');
    expect(menuSceneSource).toContain('setPreferredLanguage(language)');
    expect(menuSceneSource).toContain('getLanguageCode(language)');
    expect(menuSceneSource).toContain('createInfoBackButton');
    expect(menuSceneSource).toContain('const INFO_BACK_BUTTON = {');
    expect(menuSceneSource).toContain("return new Button(this, 0, INFO_BACK_BUTTON.y, 'Back', () => this.closeAboutModal()");
    expect(menuSceneSource).toContain('height: 360');
    expect(menuSceneSource).not.toContain("text(0, -1, '<'");
    expect(menuSceneSource).toContain('createAboutViewport');
    expect(menuSceneSource).toContain('createGeometryMask');
    expect(menuSceneSource).toContain("scrollZone.on('wheel'");
    expect(menuSceneSource).toContain("this.scene.start('TeamSelectScene', { mode: 'match' })");
    expect(menuSceneSource).toContain("this.scene.start('TeamSelectScene', { mode: 'penalty' })");
    expect(menuSceneSource).not.toContain('createStandalonePenaltyMatchResult');
  });

  it('nests tournament actions under a stable Game modes tournament submenu', () => {
    const menuSceneSource = normalizeSourceLineEndings(readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8'));
    const gameModesBlock = menuSceneSource.slice(
      menuSceneSource.indexOf('private createGameModeButtons'),
      menuSceneSource.indexOf('private createTournamentButtons')
    );
    const tournamentBlock = menuSceneSource.slice(
      menuSceneSource.indexOf('private createTournamentButtons'),
      menuSceneSource.indexOf('private getMenuButtonWidth')
    );

    expect(menuSceneSource).toContain("type MenuView = 'main' | 'modes' | 'tournament'");
    expect(menuSceneSource).toContain("if (this.currentView === 'tournament')");
    expect(menuSceneSource).toContain('private openTournamentMenu(): void');
    expect(gameModesBlock).toContain("'Quick match'");
    expect(gameModesBlock).toContain("'Tournament'");
    expect(gameModesBlock).toContain('() => this.openTournamentMenu()');
    expect(gameModesBlock).toContain("'Penalty shootout'");
    expect(gameModesBlock).toContain("'Tutorial Match'");
    expect(gameModesBlock).toContain("'Back'");
    expect(gameModesBlock).not.toContain("'Delete save'");
    expect(gameModesBlock).not.toContain("'New tournament'");
    expect(gameModesBlock).not.toContain("'Continue tournament'");
    expect(gameModesBlock).not.toContain("'Tournaments'");
    expect(gameModesBlock.indexOf("'Quick match'")).toBeLessThan(gameModesBlock.indexOf("'Tournament'"));
    expect(gameModesBlock.indexOf("'Tournament'")).toBeLessThan(gameModesBlock.indexOf("'Penalty shootout'"));
    expect(gameModesBlock.indexOf("'Penalty shootout'")).toBeLessThan(gameModesBlock.indexOf("'Tutorial Match'"));
    expect(gameModesBlock.indexOf("'Tutorial Match'")).toBeLessThan(gameModesBlock.indexOf("'Back'"));
    expect(tournamentBlock).toContain("'New tournament'");
    expect(tournamentBlock).toContain('() => this.startNewTournamentSetup()');
    expect(tournamentBlock).toContain("'Continue tournament'");
    expect(tournamentBlock).toContain('() => this.continueTournament()');
    expect(tournamentBlock).toContain('{ ...buttonOptions, disabled: !hasTournamentSave }');
    expect(tournamentBlock).toContain("'Delete save'");
    expect(tournamentBlock).toContain('() => this.deleteTournamentSave()');
    expect(tournamentBlock).toContain("{ ...buttonOptions, disabled: !hasTournamentSave, fontSize: '22px' }");
    expect(tournamentBlock).toContain("'Back'");
    expect(tournamentBlock).toContain('() => this.openGameModes()');
    expect(tournamentBlock.indexOf("'New tournament'")).toBeLessThan(tournamentBlock.indexOf("'Continue tournament'"));
    expect(tournamentBlock.indexOf("'Continue tournament'")).toBeLessThan(tournamentBlock.indexOf("'Delete save'"));
    expect(tournamentBlock.indexOf("'Delete save'")).toBeLessThan(tournamentBlock.indexOf("'Back'"));
    expect(menuSceneSource).toContain("if (tournament === null) {\n      this.openTournamentMenu();");
    expect(menuSceneSource).toContain("deleteStoredTournament();\n    this.registry.remove('currentTournament');\n    this.openTournamentMenu();");
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

  it('provides uppercase 3-letter scoreboard codes for every national team', () => {
    for (const team of NATIONAL_TEAMS) {
      const code = getTeamScoreboardCode(team.flagCode);

      expect(TEAM_SCOREBOARD_CODES).toHaveProperty(team.flagCode);
      expect(code).toHaveLength(3);
      expect(code).toBe(code.toUpperCase());
    }

    expect(getTeamScoreboardCode('ua')).toBe('UKR');
    expect(getTeamScoreboardCode('pl')).toBe('POL');
    expect(getTeamScoreboardCode('ie')).toBe('IRL');
    expect(getTeamScoreboardCode('no')).toBe('NOR');
    expect(getTeamScoreboardCode('cl')).toBe('CHI');
    expect(getTeamScoreboardCode('co')).toBe('COL');
    expect(getTeamScoreboardCode('es')).toBe('ESP');
    expect(getTeamScoreboardCode('nir')).toBe('NIR');
    expect(getTeamScoreboardCode('kr')).toBe('KOR');
  });

  it('provides the national deck cover folder and fallback cover', () => {
    expect(existsSync(join(process.cwd(), 'public', 'covers'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'covers', 'none.webp'))).toBe(true);
  });

  it('ships production game assets from public with normalized paths', () => {
    const requiredAssets = [
      join('public', 'cards', 'ball.webp'),
      join('public', 'menu', 'arbitr-end.webp'),
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
    expect(source).toContain("goal: '/sounds/bolely-goal.mp3'");
    expect(source).toContain("this.load.audio('sound-goal', ASSET_PATHS.sounds.goal)");
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
    expect(teamStatsViewSource).toContain('maskSceneX + maskLeft');
    expect(teamStatsViewSource).toContain('maskSceneY + maskTop');
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
    expect(resultSceneSource).toContain('content.setMask(mask)');
    expect(resultSceneSource).toContain('private addStatsScrollContent');
  });

  it('starts goalkeeper outcome sounds at attack-card impact time', () => {
    const gameSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');
    const effectSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'gameSceneEventEffects.ts'), 'utf8');
    const audioHelperSource = readFileSync(join(process.cwd(), 'src', 'audio', 'playSoundSafe.ts'), 'utf8');
    const impactBlock = gameSceneSource.slice(
      gameSceneSource.indexOf('private finishGoalkeeperShotBallImpact('),
      gameSceneSource.indexOf('private animateGoalkeeperShotGoalDisappear(')
    );

    expect(effectSource).toContain("soundKey: 'sound-goal'");
    expect(effectSource).toContain("soundKey: 'sound-goalpost'");
    expect(effectSource).toContain("soundKey: 'sound-goalkeeper-save'");
    expect(impactBlock.indexOf('this.playSceneEffectSound(shotEffect);')).toBeLessThan(
      impactBlock.indexOf('this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);')
    );
    expect(impactBlock.indexOf('this.playSceneEffectSound(shotEffect);')).toBeLessThan(
      impactBlock.indexOf('this.showGoalkeeperShotTargetImpact(target, outcome);')
    );
    expect(gameSceneSource).toContain('this.playSceneEffectSound(goalEffect);');
    expect(gameSceneSource).toContain('return playSoundSafe(this, effect.soundKey, { volume: 0.72 });');
    expect(audioHelperSource).toContain('): boolean');
    expect(audioHelperSource).toContain('return false;');
    expect(audioHelperSource).toContain('const didPlay = scene.sound.play(key, config);');
    expect(audioHelperSource).toContain('return didPlay;');
    expect(audioHelperSource).toContain('if (!import.meta.env.DEV)');
    expect(audioHelperSource).toContain('Sound manager rejected playback');
    expect(gameSceneSource).not.toContain("this.playSound('sound-goal', 0.72)");
  });

  it('keeps the advantage bar active at match start and neutral 50/50', () => {
    const advantageViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'AdvantageView.ts'), 'utf8');

    expect(advantageViewSource).not.toContain('hasPoints ?');
    expect(advantageViewSource).not.toContain(': 0.35');
    expect(advantageViewSource.match(/0\.96/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

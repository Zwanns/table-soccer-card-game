import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAME_AUTHOR, GAME_AUTHOR_URL, GAME_TITLE, GAME_VERSION } from '../config';
import { NATIONAL_TEAMS } from '../data/nationalTeams';

describe('project scaffold', () => {
  it('uses the required game title', () => {
    expect(GAME_TITLE).toBe('Total Soccer: Mundial');
  });

  it('uses the required game version', () => {
    expect(GAME_VERSION).toBe('1.2.0');
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

    expect(existsSync(join(process.cwd(), 'public', 'menu'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'menu', 'README.md'))).toBe(true);
    expect(menuSceneSource).toContain('createBackground');
    expect(menuSceneSource).toContain('createOverlay');
    expect(menuSceneSource).toContain('createDecor');
    expect(menuSceneSource).toContain('createTitle');
    expect(menuSceneSource).toContain('createButtons');
    expect(menuSceneSource).toContain('createFooter');
    expect(menuSceneSource).toContain('MENU_LAYOUT');
    expect(bootSceneSource).toContain('MENU_ASSETS.background');
  });

  it('groups main menu actions into game modes, squads and about', () => {
    const menuSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');

    expect(menuSceneSource).toContain('Game modes');
    expect(menuSceneSource).toContain('Tournaments');
    expect(menuSceneSource).toContain('Quick match');
    expect(menuSceneSource).toContain('Penalty shootout');
    expect(menuSceneSource).toContain('Teams');
    expect(menuSceneSource).toContain('About');
    expect(menuSceneSource).toContain('GAME_AUTHOR_URL');
    expect(menuSceneSource).toContain('ABOUT_LANGUAGES');
    expect(menuSceneSource).toContain('ABOUT_CONTENT');
    expect(menuSceneSource).toContain("return 'EN'");
    expect(menuSceneSource).toContain("return 'PL'");
    expect(menuSceneSource).toContain("return 'UA'");
    expect(menuSceneSource).toContain('createAboutBackButton');
    expect(menuSceneSource).toContain('createAboutViewport');
    expect(menuSceneSource).toContain('createGeometryMask');
    expect(menuSceneSource).toContain("scrollZone.on('wheel'");
    expect(menuSceneSource).toContain("this.scene.start('TeamSelectScene', { mode: 'penalty' })");
    expect(menuSceneSource).not.toContain('createStandalonePenaltyMatchResult');
    expect(menuSceneSource).toContain('Tournament progress is currently saved only locally');
    expect(menuSceneSource).toContain('Postęp turnieju jest obecnie zapisywany tylko lokalnie');
  });

  it('provides 64 unique national teams for match setup', () => {
    const teamNames = NATIONAL_TEAMS.map((team) => team.name);

    expect(NATIONAL_TEAMS).toHaveLength(64);
    expect(new Set(teamNames).size).toBe(64);
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

  it('keeps final match statistics labels readable', () => {
    const resultSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'ResultScene.ts'), 'utf8');
    const gameSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');
    const teamStatsViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'TeamStatsView.ts'), 'utf8');

    expect(resultSceneSource).toContain("'Goalscorers'");
    expect(resultSceneSource).toContain('${scorer.playerName} (turn ${scorer.turnNumber})');
    expect(resultSceneSource).not.toContain('(#${scorer.shirtNumber})');
    expect(gameSceneSource).toContain('${scorer.playerName} (turn ${scorer.turnNumber})');
    expect(gameSceneSource).not.toContain('(#${scorer.shirtNumber})');
    expect(teamStatsViewSource).toContain("options.scorers.join('\\n')");
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

  it('keeps the advantage bar active at match start and neutral 50/50', () => {
    const advantageViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'AdvantageView.ts'), 'utf8');

    expect(advantageViewSource).not.toContain('hasPoints ?');
    expect(advantageViewSource).not.toContain(': 0.35');
    expect(advantageViewSource.match(/0\.96/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

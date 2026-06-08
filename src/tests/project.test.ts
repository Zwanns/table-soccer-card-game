import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAME_TITLE, GAME_VERSION } from '../config';
import { NATIONAL_TEAMS } from '../data/nationalTeams';

describe('project scaffold', () => {
  it('uses the required game title', () => {
    expect(GAME_TITLE).toBe('Total Soccer: Mundial');
  });

  it('uses the required game version', () => {
    expect(GAME_VERSION).toBe('0.7c');
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

    expect(resultSceneSource).toContain("'Авторы голов'");
    expect(resultSceneSource).toContain('ход ${scorer.turnNumber}');
    expect(resultSceneSource).not.toContain('Победитель');
    expect(resultSceneSource).not.toContain("'Штанги'");
    expect(resultSceneSource).not.toContain("'Сэйвы GK'");
    expect(resultSceneSource).not.toContain("'Реализация'");
    expect(resultSceneSource).not.toContain("'пока нет'");
    expect(resultSceneSource).not.toMatch(/[ĐŃ]/);
  });
});

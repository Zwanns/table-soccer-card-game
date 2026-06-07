import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAME_TITLE, GAME_VERSION } from '../config';
import { NATIONAL_TEAMS } from '../data/nationalTeams';

describe('project scaffold', () => {
  it('uses the required game title', () => {
    expect(GAME_TITLE).toBe('Total Soccer Mundial');
  });

  it('uses the required game version', () => {
    expect(GAME_VERSION).toBe('0.6a');
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
});

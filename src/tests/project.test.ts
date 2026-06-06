import { describe, expect, it } from 'vitest';
import { GAME_TITLE } from '../config';
import { NATIONAL_TEAMS } from '../data/nationalTeams';

describe('project scaffold', () => {
  it('uses the required game title', () => {
    expect(GAME_TITLE).toBe('Table Soccer');
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
});

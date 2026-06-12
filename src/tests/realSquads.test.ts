import { describe, expect, it } from 'vitest';
import { FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import { getRealSquad, REAL_SQUADS, requireRealSquad } from '../data/realSquads';
import { validateSquad } from '../data/squadValidation';

const PLACEHOLDER_NAME_PATTERN = /^(?:Player|Field Player|Goalkeeper|Игрок|Вратарь)(?:\s|$)/u;

describe('real static squads', () => {
  it('provides exactly one real squad for every national team', () => {
    const squadFlagCodes = REAL_SQUADS.map((squad) => squad.flagCode);
    const teamFlagCodes = NATIONAL_TEAMS.map((team) => team.flagCode);

    expect(REAL_SQUADS).toHaveLength(64);
    expect(squadFlagCodes).toHaveLength(new Set(squadFlagCodes).size);
    expect(new Set(squadFlagCodes)).toEqual(new Set(teamFlagCodes));
  });

  it('contains exactly 960 static players across all squads', () => {
    const playerCount = REAL_SQUADS.reduce(
      (total, squad) => total + Object.keys(squad.fieldPlayers).length + 1,
      0
    );

    expect(playerCount).toBe(960);
  });

  it('keeps every squad valid and aligned with the card ranks', () => {
    for (const squad of REAL_SQUADS) {
      expect(validateSquad(squad)).toEqual({ ok: true, issues: [] });
      expect(Object.keys(squad.fieldPlayers)).toEqual([...FIELD_SQUAD_RANKS]);
      expect(squad.goalkeeper).toMatchObject({
        id: 'gk',
        shirtNumber: 1
      });
      expect(squad.fieldPlayers.JOKER.shirtNumber).toBe(18);
      expect(squad).not.toHaveProperty('teamId');
      expect(squad).not.toHaveProperty('goalkeepers');
      expect(squad).not.toHaveProperty('defaultStartingGoalkeeperId');
    }
  });

  it('uses unique non-placeholder shirt numbers and names inside every squad', () => {
    for (const squad of REAL_SQUADS) {
      const players = [...FIELD_SQUAD_RANKS.map((rank) => squad.fieldPlayers[rank]), squad.goalkeeper];
      const shirtNumbers = players.map((player) => player.shirtNumber);

      expect(new Set(shirtNumbers).size).toBe(shirtNumbers.length);
      expect(shirtNumbers).not.toContain(99);

      for (const player of players) {
        expect(player.name).not.toMatch(PLACEHOLDER_NAME_PATTERN);
      }
    }
  });

  it('resolves optional and required squads by flag code', () => {
    expect(getRealSquad('pl')).toBe(requireRealSquad('pl'));
    expect(requireRealSquad('pl')).toMatchObject({
      flagCode: 'pl',
      goalkeeper: {
        id: 'gk',
        name: 'Skorupski',
        shirtNumber: 1
      }
    });
    expect(getRealSquad('missing')).toBeUndefined();
    expect(() => requireRealSquad('missing')).toThrow('Missing real squad for flagCode: missing');
  });
});

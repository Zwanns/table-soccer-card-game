import { describe, expect, expectTypeOf, it } from 'vitest';
import type { CardRank } from '../cards';
import { createDefaultSquad, DEFAULT_SQUADS, FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import type { FieldSquadMember, GoalkeeperSquadMember, NationalTeamSquad } from '../data/squadTypes';
import { validatePlayerName, validateShirtNumber, validateSquad } from '../data/squadValidation';

describe('static national team squads', () => {
  it('uses the card rank type only for field squad members', () => {
    expectTypeOf<FieldSquadMember['rank']>().toEqualTypeOf<CardRank>();
    expectTypeOf<GoalkeeperSquadMember>().not.toHaveProperty('rank');
  });

  it('creates one static squad for every national team', () => {
    expect(DEFAULT_SQUADS).toHaveLength(64);
    expect(DEFAULT_SQUADS).toHaveLength(NATIONAL_TEAMS.length);

    for (const team of NATIONAL_TEAMS) {
      expect(DEFAULT_SQUADS.some((squad) => squad.flagCode === team.flagCode)).toBe(true);
    }
  });

  it('creates 14 field players and one goalkeeper for every squad', () => {
    for (const squad of DEFAULT_SQUADS) {
      expect(Object.keys(squad.fieldPlayers)).toHaveLength(14);
      expect(squad.goalkeeper).toEqual({
        id: 'gk',
        name: 'Вратарь',
        shirtNumber: 1
      });
      expect(squad).not.toHaveProperty('teamId');
      expect(squad).not.toHaveProperty('goalkeepers');
      expect(squad).not.toHaveProperty('defaultStartingGoalkeeperId');
    }
  });

  it('provides a field player profile for every supported field rank', () => {
    expect(FIELD_SQUAD_RANKS).toEqual([
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
      'A',
      'JOKER'
    ]);

    for (const squad of DEFAULT_SQUADS) {
      for (const rank of FIELD_SQUAD_RANKS) {
        expect(squad.fieldPlayers[rank]).toEqual({
          rank,
          name: `Игрок ${rank}`,
          shirtNumber: expect.any(Number)
        });
      }
    }
  });

  it('uses placeholder JOKER number 18 and no placeholder number 99', () => {
    for (const squad of DEFAULT_SQUADS) {
      expect(squad.fieldPlayers.JOKER.shirtNumber).toBe(18);
      expect(getSquadNumbers(squad)).not.toContain(99);
    }
  });

  it('uses valid and unique shirt numbers in every default squad', () => {
    for (const squad of DEFAULT_SQUADS) {
      const allNumbers = getSquadNumbers(squad);

      expect(validateSquad(squad)).toEqual({ ok: true, issues: [] });
      expect(allNumbers.every(validateShirtNumber)).toBe(true);
      expect(new Set(allNumbers).size).toBe(allNumbers.length);
    }
  });
});

describe('squad validation', () => {
  it('accepts player names from 1 to 24 trimmed characters', () => {
    expect(validatePlayerName('Игрок 9')).toBe(true);
    expect(validatePlayerName('  Игрок 9  ')).toBe(true);
    expect(validatePlayerName('')).toBe(false);
    expect(validatePlayerName('   ')).toBe(false);
    expect(validatePlayerName('a'.repeat(25))).toBe(false);
  });

  it('accepts only integer shirt numbers from 0 to 99', () => {
    expect(validateShirtNumber(0)).toBe(true);
    expect(validateShirtNumber(99)).toBe(true);
    expect(validateShirtNumber(-1)).toBe(false);
    expect(validateShirtNumber(100)).toBe(false);
    expect(validateShirtNumber(7.5)).toBe(false);
  });

  it('rejects an empty player name', () => {
    const squad = cloneSquad(createDefaultSquad('pl'));
    squad.fieldPlayers['9'].name = ' ';

    expect(validateSquad(squad)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: 'INVALID_PLAYER_NAME',
          path: 'fieldPlayers.9.name'
        })
      ])
    });
  });

  it('rejects invalid shirt numbers', () => {
    const tooLow = cloneSquad(createDefaultSquad('pl'));
    tooLow.fieldPlayers['9'].shirtNumber = -1;
    expectIssueCode(tooLow, 'INVALID_SHIRT_NUMBER');

    const tooHigh = cloneSquad(createDefaultSquad('pl'));
    tooHigh.fieldPlayers['9'].shirtNumber = 100;
    expectIssueCode(tooHigh, 'INVALID_SHIRT_NUMBER');

    const fractional = cloneSquad(createDefaultSquad('pl'));
    fractional.fieldPlayers['9'].shirtNumber = 9.5;
    expectIssueCode(fractional, 'INVALID_SHIRT_NUMBER');
  });

  it('rejects duplicate shirt numbers across all 15 players', () => {
    const squad = cloneSquad(createDefaultSquad('pl'));
    squad.goalkeeper.shirtNumber = squad.fieldPlayers['9'].shirtNumber;

    expectIssueCode(squad, 'DUPLICATE_SHIRT_NUMBER');
  });

  it('rejects missing field players and mismatched ranks', () => {
    const missingFieldPlayerSquad = cloneSquad(createDefaultSquad('pl'));
    delete (missingFieldPlayerSquad.fieldPlayers as Partial<Record<CardRank, FieldSquadMember>>).JOKER;

    expectIssueCode(missingFieldPlayerSquad, 'MISSING_FIELD_PLAYER');
    expectIssueCode(missingFieldPlayerSquad, 'INVALID_FIELD_PLAYER_COUNT');

    const mismatchedRankSquad = cloneSquad(createDefaultSquad('pl'));
    mismatchedRankSquad.fieldPlayers.Q.rank = 'K';

    expectIssueCode(mismatchedRankSquad, 'INVALID_FIELD_PLAYER_RANK');
  });

  it('rejects goalkeeper rank fields and legacy goalkeeper fields', () => {
    const squad = cloneSquad(createDefaultSquad('pl'));
    (squad.goalkeeper as GoalkeeperSquadMember & { rank: CardRank }).rank = 'A';
    const legacySquad = {
      ...squad,
      goalkeepers: [squad.goalkeeper, { id: 'old-gk-2', name: 'Old', shirtNumber: 12 }],
      defaultStartingGoalkeeperId: 'old-gk-2'
    } as unknown as NationalTeamSquad;

    const result = validateSquad(legacySquad);

    expect(result).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'GOALKEEPER_HAS_RANK' }),
        expect.objectContaining({ code: 'LEGACY_GOALKEEPERS_PRESENT' }),
        expect.objectContaining({ code: 'LEGACY_STARTING_GOALKEEPER_PRESENT' })
      ])
    });
  });

  it('allows real squads to use a unique non-placeholder JOKER number', () => {
    const squad = cloneSquad(createDefaultSquad('pl'));
    squad.fieldPlayers.JOKER.name = 'Real Joker';
    squad.fieldPlayers.JOKER.shirtNumber = 19;

    expect(validateSquad(squad)).toEqual({ ok: true, issues: [] });
  });
});

function cloneSquad(squad: NationalTeamSquad): NationalTeamSquad {
  return {
    flagCode: squad.flagCode,
    fieldPlayers: Object.fromEntries(
      Object.entries(squad.fieldPlayers).map(([rank, player]) => [rank, { ...player }])
    ) as Record<CardRank, FieldSquadMember>,
    goalkeeper: { ...squad.goalkeeper }
  };
}

function getSquadNumbers(squad: NationalTeamSquad): number[] {
  return [...FIELD_SQUAD_RANKS.map((rank) => squad.fieldPlayers[rank].shirtNumber), squad.goalkeeper.shirtNumber];
}

function expectIssueCode(squad: NationalTeamSquad, code: string): void {
  expect(validateSquad(squad)).toMatchObject({
    ok: false,
    issues: expect.arrayContaining([expect.objectContaining({ code })])
  });
}

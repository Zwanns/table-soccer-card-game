import { describe, expect, expectTypeOf, it } from 'vitest';
import type { CardRank } from '../cards';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import {
  createDefaultSquad,
  DEFAULT_SQUADS,
  FIELD_SQUAD_RANKS
} from '../data/defaultSquads';
import type {
  FieldSquadMember,
  GoalkeeperSquadMember,
  NationalTeamSquad
} from '../data/squadTypes';
import {
  validatePlayerName,
  validateShirtNumber,
  validateSquad
} from '../data/squadValidation';

describe('default national team squads', () => {
  it('uses the existing card rank type for field squad members', () => {
    expectTypeOf<FieldSquadMember['rank']>().toEqualTypeOf<CardRank>();
    expectTypeOf<GoalkeeperSquadMember>().not.toHaveProperty('rank');
  });

  it('creates one default squad for every national team', () => {
    expect(DEFAULT_SQUADS).toHaveLength(NATIONAL_TEAMS.length);

    for (const team of NATIONAL_TEAMS) {
      expect(DEFAULT_SQUADS.some((squad) => squad.teamId === team.flagCode)).toBe(true);
    }
  });

  it('creates exactly 14 field players and two goalkeepers for every squad', () => {
    for (const squad of DEFAULT_SQUADS) {
      expect(Object.keys(squad.fieldPlayers)).toHaveLength(14);
      expect(squad.goalkeepers).toHaveLength(2);
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

  it('does not store ranks on goalkeepers', () => {
    for (const squad of DEFAULT_SQUADS) {
      for (const goalkeeper of squad.goalkeepers) {
        expect(goalkeeper).not.toHaveProperty('rank');
      }
    }
  });

  it('points defaultStartingGoalkeeperId at an existing goalkeeper', () => {
    for (const squad of DEFAULT_SQUADS) {
      expect(squad.goalkeepers.map((goalkeeper) => goalkeeper.id)).toContain(squad.defaultStartingGoalkeeperId);
    }
  });

  it('uses valid and unique shirt numbers in every default squad', () => {
    for (const squad of DEFAULT_SQUADS) {
      const result = validateSquad(squad);
      const fieldNumbers = FIELD_SQUAD_RANKS.map((rank) => squad.fieldPlayers[rank].shirtNumber);
      const goalkeeperNumbers = squad.goalkeepers.map((goalkeeper) => goalkeeper.shirtNumber);
      const allNumbers = [...fieldNumbers, ...goalkeeperNumbers];

      expect(result).toEqual({ ok: true, issues: [] });
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

  it('rejects shirt numbers lower than 0', () => {
    const squad = cloneSquad(createDefaultSquad('pl'));
    squad.fieldPlayers['9'].shirtNumber = -1;

    expectIssueCode(squad, 'INVALID_SHIRT_NUMBER');
  });

  it('rejects shirt numbers greater than 99', () => {
    const squad = cloneSquad(createDefaultSquad('pl'));
    squad.fieldPlayers['9'].shirtNumber = 100;

    expectIssueCode(squad, 'INVALID_SHIRT_NUMBER');
  });

  it('rejects fractional shirt numbers', () => {
    const squad = cloneSquad(createDefaultSquad('pl'));
    squad.fieldPlayers['9'].shirtNumber = 9.5;

    expectIssueCode(squad, 'INVALID_SHIRT_NUMBER');
  });

  it('rejects duplicate shirt numbers across field players and goalkeepers', () => {
    const squad = cloneSquad(createDefaultSquad('pl'));
    squad.goalkeepers[0].shirtNumber = squad.fieldPlayers['9'].shirtNumber;

    expectIssueCode(squad, 'DUPLICATE_SHIRT_NUMBER');
  });

  it('rejects missing field players and mismatched ranks', () => {
    const missingFieldPlayerSquad = cloneSquad(createDefaultSquad('pl'));
    delete (missingFieldPlayerSquad.fieldPlayers as Partial<Record<CardRank, FieldSquadMember>>)['JOKER'];

    expectIssueCode(missingFieldPlayerSquad, 'MISSING_FIELD_PLAYER');

    const mismatchedRankSquad = cloneSquad(createDefaultSquad('pl'));
    mismatchedRankSquad.fieldPlayers.Q.rank = 'K';

    expectIssueCode(mismatchedRankSquad, 'INVALID_FIELD_PLAYER_RANK');
  });

  it('rejects goalkeeper rank fields and missing starting goalkeeper ids', () => {
    const squad = cloneSquad(createDefaultSquad('pl'));
    (squad.goalkeepers[0] as GoalkeeperSquadMember & { rank: CardRank }).rank = 'A';
    squad.defaultStartingGoalkeeperId = 'missing-gk';

    const result = validateSquad(squad);

    expect(result).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'GOALKEEPER_HAS_RANK' }),
        expect.objectContaining({ code: 'INVALID_STARTING_GOALKEEPER' })
      ])
    });
  });
});

function cloneSquad(squad: NationalTeamSquad): NationalTeamSquad {
  return {
    teamId: squad.teamId,
    fieldPlayers: Object.fromEntries(
      Object.entries(squad.fieldPlayers).map(([rank, player]) => [rank, { ...player }])
    ) as Record<CardRank, FieldSquadMember>,
    goalkeepers: [{ ...squad.goalkeepers[0] }, { ...squad.goalkeepers[1] }],
    defaultStartingGoalkeeperId: squad.defaultStartingGoalkeeperId
  };
}

function expectIssueCode(squad: NationalTeamSquad, code: string): void {
  expect(validateSquad(squad)).toMatchObject({
    ok: false,
    issues: expect.arrayContaining([expect.objectContaining({ code })])
  });
}

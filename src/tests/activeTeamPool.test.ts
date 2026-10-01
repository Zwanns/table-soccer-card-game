import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ACTIVE_NATIONAL_TEAMS, ACTIVE_TEAM_FLAG_CODES, isActiveTeam,
  resolveActiveTeamSelection, validateActiveTeamPool
} from '../data/activeTeams';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import { loadAllSquads } from '../services/squadStorage';
import {
  createTournamentFromSetupDraft, createTournamentSetupDraft, fillEmptyTournamentSetupSlots,
  fillTournamentSetupRandom, getDefaultTournamentSetupTeamIds, selectTournamentSetupTeam
} from '../scenes/tournamentSetupDraft';
import { fillEmptyTournamentSlots, fillTournamentTeamsRandom, TournamentEngine, type TournamentFormatId } from '../tournament';
import source from './fixtures/team-kit-metadata-32.json';

const expectedCodes = [
  'ar', 'be', 'br', 'cm', 'co', 'hr', 'cz', 'dk',
  'eng', 'fr', 'ge', 'de', 'it', 'jm', 'jp', 'mx',
  'ma', 'nl', 'ng', 'no', 'py', 'pl', 'pt', 'ca',
  'kr', 'es', 'se', 'tr', 'ua', 'uy', 'us', 'uz'
];

describe('active team pool', () => {
  it('defines exactly the product and metadata source set while retaining 66 master teams and squads', () => {
    expect([...ACTIVE_TEAM_FLAG_CODES].sort()).toEqual([...expectedCodes].sort());
    expect(new Set(ACTIVE_TEAM_FLAG_CODES).size).toBe(32);
    expect(ACTIVE_NATIONAL_TEAMS.map((team) => team.flagCode).sort()).toEqual([...expectedCodes].sort());
    expect(source.rows.map((row) => row[2]).sort()).toEqual([...expectedCodes].sort());
    expect(NATIONAL_TEAMS).toHaveLength(66);
    expect(loadAllSquads()).toHaveLength(66);
    expect(validateActiveTeamPool).not.toThrow();
    expect(isActiveTeam('eng')).toBe(true);
    for (const code of ['sct', 'wls', 'al', 'nir']) expect(isActiveTeam(code)).toBe(false);
  });

  it('preserves the master display order and provides active input fallbacks', () => {
    expect(ACTIVE_NATIONAL_TEAMS).toEqual(NATIONAL_TEAMS.filter((team) => expectedCodes.includes(team.flagCode)));
    expect(getDefaultTournamentSetupTeamIds()).toEqual(ACTIVE_NATIONAL_TEAMS.map((team) => team.flagCode));
    for (const team of NATIONAL_TEAMS) {
      expect(isActiveTeam(resolveActiveTeamSelection(team.flagCode))).toBe(true);
    }
    expect(resolveActiveTeamSelection(undefined)).toBe('fr');
    expect(resolveActiveTeamSelection('al', 'sct')).toBe(ACTIVE_NATIONAL_TEAMS[0].flagCode);
  });

  it.each(['cup-m', 'cup-l', 'cup-xl'] as TournamentFormatId[])('fills %s from only unique active teams for multiple seeds', (formatId) => {
    for (let seed = 0; seed < 30; seed++) {
      const random = fillTournamentTeamsRandom(formatId, `pool-${seed}`);
      expect(new Set(random).size).toBe(random.length);
      expect(random.every(isActiveTeam)).toBe(true);
      if (formatId === 'cup-xl') expect([...random].sort()).toEqual([...expectedCodes].sort());
      const draft = fillTournamentSetupRandom(createTournamentSetupDraft(formatId), `draft-${seed}`);
      const tournament = createTournamentFromSetupDraft(draft, `create-${seed}`);
      expect(tournament.teamIds.every(isActiveTeam)).toBe(true);
      expect(tournament.participants.every((participant) => isActiveTeam(participant.flagCode))).toBe(true);
      expect(tournament.participants.every((participant) => participant.controllerType === 'AI')).toBe(true);
    }
  });

  it('fills Cup XL empty slots without replacing manual active choices', () => {
    let draft = createTournamentSetupDraft('cup-xl');
    draft = selectTournamentSetupTeam(draft, 0, 'eng');
    draft = selectTournamentSetupTeam(draft, 8, 'ua');
    draft = fillEmptyTournamentSetupSlots(draft, 'all-active');
    expect(draft.slots[0]).toBe('eng');
    expect(draft.slots[8]).toBe('ua');
    expect([...draft.slots].sort()).toEqual([...expectedCodes].sort());
  });

  it('blocks inactive manual choices and injected inactive drafts', () => {
    for (const code of NATIONAL_TEAMS.map((team) => team.flagCode).filter((code) => !isActiveTeam(code))) {
      expect(() => selectTournamentSetupTeam(createTournamentSetupDraft('cup-m'), 0, code)).toThrow('active team pool');
      const draft = fillTournamentSetupRandom(createTournamentSetupDraft('cup-m'), 'invalid-draft');
      draft.slots[0] = code;
      expect(() => createTournamentFromSetupDraft(draft, 'invalid')).toThrow('active team pool');
      expect(() => TournamentEngine.create('cup-m', draft.slots as string[])).toThrow('active team pool');
      expect(() => fillEmptyTournamentSlots('cup-m', [code, null, null, null, null, null, null, null], 'invalid')).toThrow('active team pool');
    }
  });

  it('filters inactive and duplicate entries even when random fill is passed a full custom registry', () => {
    const master = NATIONAL_TEAMS.map((team) => team.flagCode);
    expect(fillTournamentTeamsRandom('cup-xl', 'master-input', [...master, ...master]).sort()).toEqual([...expectedCodes].sort());
  });

  it('connects all user-facing grids and their scrolling indexes to the same active list', () => {
    for (const scene of ['TeamSelectScene', 'TournamentSetupScene', 'SquadSelectScene']) {
      const text = readFileSync(join(process.cwd(), 'src/scenes', `${scene}.ts`), 'utf8');
      expect(text).toContain('ACTIVE_NATIONAL_TEAMS.forEach');
      expect(text).toContain('ACTIVE_NATIONAL_TEAMS[index]');
      expect(text).toContain('ACTIVE_NATIONAL_TEAMS.length');
      expect(text).not.toMatch(/(?<!ACTIVE_)NATIONAL_TEAMS/);
    }
  });
});

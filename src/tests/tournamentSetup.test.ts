import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  changeTournamentSetupFormat,
  clearTournamentSetupDraft,
  createTournamentFromSetupDraft,
  createTournamentSetupDraft,
  fillEmptyTournamentSetupSlots,
  fillTournamentSetupRandom,
  getSelectedTournamentTeamIds,
  getTournamentSetupSlotCount,
  isTournamentSetupComplete,
  removeTournamentSetupTeam,
  selectTournamentSetupTeam,
  shuffleTournamentSetupGroups
} from '../scenes/tournamentSetupDraft';

describe('tournament setup scene integration', () => {
  it('registers the tournament setup scene', () => {
    const mainSource = readFileSync(join(process.cwd(), 'src', 'main.ts'), 'utf8');

    expect(mainSource).toContain('TournamentSetupScene');
  });

  it('adds a main menu tournament button', () => {
    const menuSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');

    expect(menuSource).toContain('Турнир');
    expect(menuSource).toContain("this.scene.start('TournamentSetupScene')");
  });
});

describe('tournament setup draft helpers', () => {
  it('creates the correct slot count for every format', () => {
    expect(getTournamentSetupSlotCount('cup-m')).toBe(8);
    expect(getTournamentSetupSlotCount('cup-l')).toBe(16);
    expect(getTournamentSetupSlotCount('cup-xl')).toBe(32);
  });

  it('selects, replaces and removes teams manually', () => {
    let draft = createTournamentSetupDraft('cup-m');

    draft = selectTournamentSetupTeam(draft, 0, 'pl');
    draft = selectTournamentSetupTeam(draft, 0, 'ua');
    draft = selectTournamentSetupTeam(draft, 1, 'fr');

    expect(draft.slots.slice(0, 2)).toEqual(['ua', 'fr']);

    draft = removeTournamentSetupTeam(draft, 0);

    expect(draft.slots.slice(0, 2)).toEqual([null, 'fr']);
  });

  it('does not allow selecting one team twice', () => {
    const draft = selectTournamentSetupTeam(createTournamentSetupDraft('cup-m'), 0, 'pl');

    expect(() => selectTournamentSetupTeam(draft, 1, 'pl')).toThrow('уже выбрана');
  });

  it('fills all teams randomly with unique ids', () => {
    const draft = fillTournamentSetupRandom(createTournamentSetupDraft('cup-l'), 'setup-random');

    expect(draft.slots).toHaveLength(16);
    expect(new Set(draft.slots).size).toBe(16);
    expect(isTournamentSetupComplete(draft)).toBe(true);
  });

  it('fills only empty slots and preserves manual teams', () => {
    let draft = createTournamentSetupDraft('cup-m');
    draft = selectTournamentSetupTeam(draft, 0, 'pl');
    draft = selectTournamentSetupTeam(draft, 3, 'ua');
    draft = fillEmptyTournamentSetupSlots(draft, 'setup-empty');

    expect(draft.slots[0]).toBe('pl');
    expect(draft.slots[3]).toBe('ua');
    expect(new Set(draft.slots).size).toBe(8);
    expect(isTournamentSetupComplete(draft)).toBe(true);
  });

  it('clears selected teams', () => {
    const filledDraft = fillTournamentSetupRandom(createTournamentSetupDraft('cup-m'), 'setup-clear');
    const clearedDraft = clearTournamentSetupDraft(filledDraft);

    expect(getSelectedTournamentTeamIds(clearedDraft)).toEqual([]);
    expect(clearedDraft.slots.every((teamId) => teamId === null)).toBe(true);
  });

  it('shuffles complete groups without changing participants', () => {
    const filledDraft = fillTournamentSetupRandom(createTournamentSetupDraft('cup-m'), 'setup-shuffle');
    const shuffledDraft = shuffleTournamentSetupGroups(filledDraft, 'setup-shuffle-groups');

    expect([...shuffledDraft.slots].sort()).toEqual([...filledDraft.slots].sort());
  });

  it('preserves selected teams when changing to a larger format', () => {
    let draft = createTournamentSetupDraft('cup-m');
    draft = selectTournamentSetupTeam(draft, 0, 'pl');
    draft = selectTournamentSetupTeam(draft, 1, 'ua');
    draft = changeTournamentSetupFormat(draft, 'cup-l');

    expect(draft.slots).toHaveLength(16);
    expect(draft.slots.slice(0, 2)).toEqual(['pl', 'ua']);
  });

  it('does not create a tournament until all slots are filled', () => {
    const draft = createTournamentSetupDraft('cup-m');

    expect(() => createTournamentFromSetupDraft(draft, 'setup-start')).toThrow('заполнены');
  });

  it('creates a tournament from a complete draft', () => {
    const draft = fillTournamentSetupRandom(createTournamentSetupDraft('cup-m'), 'setup-start-complete');
    const tournament = createTournamentFromSetupDraft(draft, 'setup-start-complete');

    expect(tournament.formatId).toBe('cup-m');
    expect(tournament.teamIds).toEqual(draft.slots);
    expect(tournament.matches).toHaveLength(15);
  });
});

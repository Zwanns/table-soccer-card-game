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
  shuffleTournamentSetupGroups,
  toggleTournamentSetupTeamControllerType
} from '../scenes/tournamentSetupDraft';

describe('tournament setup scene integration', () => {
  it('registers the tournament setup scene', () => {
    const mainSource = readFileSync(join(process.cwd(), 'src', 'main.ts'), 'utf8');

    expect(mainSource).toContain('TournamentSetupScene');
  });

  it('adds a main menu tournament button', () => {
    const menuSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');

    expect(menuSource).toContain('Tournament');
    expect(menuSource).toContain("this.scene.start('TournamentSetupScene')");
  });

  it('renders compact AI checkbox controls without sharing the remove hit area', () => {
    const setupSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentSetupScene.ts'), 'utf8');

    expect(setupSource).toContain('createAiCheckbox');
    expect(setupSource).toContain("text(-1, 0, 'AI'");
    expect(setupSource).toContain('this.toggleTeamControllerType(slotIndex)');
    expect(setupSource).toContain('event.stopPropagation()');
    expect(setupSource).toContain('this.removeTeam(slotIndex)');
  });

  it('resets setup draft on each fresh scene create and uses a 3-column scrollable team list', () => {
    const setupSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'TournamentSetupScene.ts'), 'utf8');

    expect(setupSource).toContain("this.draft = createTournamentSetupDraft('cup-m')");
    expect(setupSource).toContain('const TEAM_GRID_COLUMNS = 3');
    expect(setupSource).toContain('TEAM_GRID_VIEWPORT_HEIGHT');
    expect(setupSource).toContain("scrollZone.on('wheel'");
    expect(setupSource).toContain("option.on('wheel'");
    expect(setupSource).not.toContain('TEAMS_PER_PAGE');
    expect(setupSource).not.toContain('changePage');
    expect(setupSource).not.toContain('page + 1');
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

  it('keeps new tournament teams HUMAN by default', () => {
    let draft = createTournamentSetupDraft('cup-m');

    expect(draft.controllerTypes.every((controllerType) => controllerType === 'HUMAN')).toBe(true);

    draft = selectTournamentSetupTeam(draft, 0, 'pl');

    expect(draft.controllerTypes[0]).toBe('HUMAN');
  });

  it('toggles controller type only for the selected slot', () => {
    let draft = createTournamentSetupDraft('cup-m');
    draft = selectTournamentSetupTeam(draft, 0, 'pl');
    draft = selectTournamentSetupTeam(draft, 1, 'ua');
    draft = toggleTournamentSetupTeamControllerType(draft, 1);

    expect(draft.controllerTypes[0]).toBe('HUMAN');
    expect(draft.controllerTypes[1]).toBe('AI');
  });

  it('removes AI state with the removed team and adds a replacement as HUMAN', () => {
    let draft = createTournamentSetupDraft('cup-m');
    draft = selectTournamentSetupTeam(draft, 0, 'pl');
    draft = toggleTournamentSetupTeamControllerType(draft, 0);
    draft = removeTournamentSetupTeam(draft, 0);

    expect(draft.slots[0]).toBeNull();
    expect(draft.controllerTypes[0]).toBe('HUMAN');

    draft = selectTournamentSetupTeam(draft, 0, 'ua');

    expect(draft.slots[0]).toBe('ua');
    expect(draft.controllerTypes[0]).toBe('HUMAN');
  });

  it('does not allow selecting one team twice', () => {
    const draft = selectTournamentSetupTeam(createTournamentSetupDraft('cup-m'), 0, 'pl');

    expect(() => selectTournamentSetupTeam(draft, 1, 'pl')).toThrow('already selected');
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
    draft = toggleTournamentSetupTeamControllerType(draft, 3);
    draft = fillEmptyTournamentSetupSlots(draft, 'setup-empty');

    expect(draft.slots[0]).toBe('pl');
    expect(draft.slots[3]).toBe('ua');
    expect(draft.controllerTypes[0]).toBe('HUMAN');
    expect(draft.controllerTypes[3]).toBe('AI');
    expect(new Set(draft.slots).size).toBe(8);
    expect(isTournamentSetupComplete(draft)).toBe(true);
    expect(draft.controllerTypes.every((controllerType, index) => draft.slots[index] !== null || controllerType === 'HUMAN')).toBe(true);
  });

  it('clears selected teams', () => {
    const filledDraft = fillTournamentSetupRandom(createTournamentSetupDraft('cup-m'), 'setup-clear');
    const clearedDraft = clearTournamentSetupDraft(filledDraft);

    expect(getSelectedTournamentTeamIds(clearedDraft)).toEqual([]);
    expect(clearedDraft.slots.every((teamId) => teamId === null)).toBe(true);
    expect(clearedDraft.controllerTypes.every((controllerType) => controllerType === 'HUMAN')).toBe(true);
  });

  it('shuffles complete groups without changing participants', () => {
    let filledDraft = fillTournamentSetupRandom(createTournamentSetupDraft('cup-m'), 'setup-shuffle');
    filledDraft = toggleTournamentSetupTeamControllerType(filledDraft, 2);
    const aiTeamId = filledDraft.slots[2];
    const shuffledDraft = shuffleTournamentSetupGroups(filledDraft, 'setup-shuffle-groups');

    expect([...shuffledDraft.slots].sort()).toEqual([...filledDraft.slots].sort());
    expect(shuffledDraft.controllerTypes[shuffledDraft.slots.indexOf(aiTeamId)]).toBe('AI');
  });

  it('preserves selected teams when changing to a larger format', () => {
    let draft = createTournamentSetupDraft('cup-m');
    draft = selectTournamentSetupTeam(draft, 0, 'pl');
    draft = selectTournamentSetupTeam(draft, 1, 'ua');
    draft = toggleTournamentSetupTeamControllerType(draft, 1);
    draft = changeTournamentSetupFormat(draft, 'cup-l');

    expect(draft.slots).toHaveLength(16);
    expect(draft.slots.slice(0, 2)).toEqual(['pl', 'ua']);
    expect(draft.controllerTypes.slice(0, 3)).toEqual(['HUMAN', 'AI', 'HUMAN']);
  });

  it('does not create a tournament until all slots are filled', () => {
    const draft = createTournamentSetupDraft('cup-m');

    expect(() => createTournamentFromSetupDraft(draft, 'setup-start')).toThrow('filled');
  });

  it('creates a tournament from a complete draft', () => {
    let draft = fillTournamentSetupRandom(createTournamentSetupDraft('cup-m'), 'setup-start-complete');
    draft = toggleTournamentSetupTeamControllerType(draft, 1);
    const tournament = createTournamentFromSetupDraft(draft, 'setup-start-complete');

    expect(tournament.formatId).toBe('cup-m');
    expect(tournament.teamIds).toEqual(draft.slots);
    expect(tournament.participants[0]).toEqual({
      flagCode: draft.slots[0],
      controllerType: 'HUMAN'
    });
    expect(tournament.participants[1]).toEqual({
      flagCode: draft.slots[1],
      controllerType: 'AI'
    });
    expect(tournament.matches).toHaveLength(15);
  });
});

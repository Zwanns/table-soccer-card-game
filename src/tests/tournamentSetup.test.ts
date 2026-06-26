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
  selectTournamentSetupTeam,
  shuffleTournamentSetupGroups,
  toggleTournamentSetupTeamControllerType
} from '../scenes/tournamentSetupDraft';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import {
  createTournamentSetupLayout,
  getTournamentSetupGroupMaxScroll
} from '../ui/tournamentSetupLayout';

const readSourceFile = (...pathSegments: string[]) =>
  readFileSync(join(process.cwd(), ...pathSegments), 'utf8').replace(/\r\n/g, '\n');

describe('tournament setup scene integration', () => {
  it('registers the tournament setup scene', () => {
    const mainSource = readSourceFile('src', 'main.ts');

    expect(mainSource).toContain('TournamentSetupScene');
  });

  it('adds a main menu tournament button', () => {
    const menuSource = readSourceFile('src', 'scenes', 'MenuScene.ts');

    expect(menuSource).toContain('Tournament');
    expect(menuSource).toContain("this.scene.start('TournamentSetupScene')");
  });

  it('renders a full-height AI toggle button without a delete control in group slots', () => {
    const setupSource = readSourceFile('src', 'scenes', 'TournamentSetupScene.ts');
    const layoutSource = readSourceFile('src', 'ui', 'tournamentSetupLayout.ts');
    const aiButtonBlock = setupSource.slice(
      setupSource.indexOf('private createAiButton'),
      setupSource.indexOf('private createTeamGrid')
    );

    expect(setupSource).toContain('createAiButton');
    expect(layoutSource).toContain('slotAiButtonWidth: 44');
    expect(layoutSource).toContain('slotAiButtonWidth: 64');
    expect(setupSource).toContain("const SLOT_AI_BUTTON_FONT_SIZE = '16px'");
    expect(setupSource).toContain('const SLOT_AI_BUTTON_ACTIVE_BACKGROUND_COLOR = 0xf0c95a');
    expect(setupSource).toContain('const SLOT_AI_BUTTON_ACTIVE_TEXT_COLOR = \'#10291f\'');
    expect(setupSource).toContain('const SLOT_AI_BUTTON_OFF_BACKGROUND_COLOR = TEAM_CARD_STYLE.normal.backgroundColor');
    expect(setupSource).toContain('const SLOT_AI_BUTTON_OFF_BORDER_COLOR = 0x9f8952');
    expect(setupSource).toContain("const SLOT_AI_BUTTON_OFF_TEXT_COLOR = '#b9ad7a'");
    expect(setupSource).toContain('layout.groups.slotAiButtonWidth');
    expect(setupSource).toContain('layout.groups.slotHeight');
    expect(setupSource).toContain("text(0, 0, 'AI'");
    expect(setupSource).toContain('fontSize: SLOT_AI_BUTTON_FONT_SIZE');
    expect(setupSource).toContain('this.toggleTeamControllerType(slotIndex)');
    expect(setupSource).toContain('event.stopPropagation()');
    expect(aiButtonBlock).not.toContain('0x0b2118');
    expect(aiButtonBlock).not.toContain('0x5f9572');
    expect(aiButtonBlock).not.toContain("'#9fb9a9'");
    expect(setupSource).not.toContain('createAiCheckbox');
    expect(setupSource).not.toContain('this.removeTeam(slotIndex)');
    expect(setupSource).not.toContain("text(188");
  });

  it('resets setup draft on each fresh scene create and uses a 3-column scrollable team list', () => {
    const setupSource = readSourceFile('src', 'scenes', 'TournamentSetupScene.ts');
    const desktopLayout = createTournamentSetupLayout(false);

    expect(setupSource).toContain("this.draft = createTournamentSetupDraft('cup-m')");
    expect(desktopLayout.teams.columns).toBe(3);
    expect(desktopLayout.teams.viewportHeight).toBe(464);
    expect(setupSource).toContain("scrollZone.on('wheel'");
    expect(setupSource).toContain("option.on('wheel'");
    expect(setupSource).not.toContain('TEAMS_PER_PAGE');
    expect(setupSource).not.toContain('changePage');
    expect(setupSource).not.toContain('page + 1');
  });

  it('uses the shared tournament background without changing the main menu background', () => {
    const setupSource = readSourceFile('src', 'scenes', 'TournamentSetupScene.ts');
    const menuSource = readSourceFile('src', 'scenes', 'MenuScene.ts');
    const backgroundSource = readSourceFile('src', 'ui', 'tournamentBackground.ts');

    expect(setupSource).toContain("import { createTournamentBackground } from '../ui/tournamentBackground'");
    expect(setupSource).toContain('createTournamentBackground(this)');
    expect(backgroundSource).toContain('scene.textures.exists(TOURNAMENT_ASSETS.background)');
    expect(backgroundSource).toContain('Math.max(SCENE_WIDTH / background.width, SCENE_HEIGHT / background.height)');
    expect(backgroundSource).toContain('TOURNAMENT_BACKGROUND_FALLBACK_COLOR');
    expect(backgroundSource).toContain('.setDepth(TOURNAMENT_BACKGROUND_DEPTH)');
    expect(menuSource).toContain('MENU_ASSETS.background');
    expect(menuSource).not.toContain('TOURNAMENT_ASSETS.background');
  });

  it('shares the Teams card palette across tournament setup cards without changing setup actions', () => {
    const setupSource = readSourceFile('src', 'scenes', 'TournamentSetupScene.ts');
    const teamsSource = readSourceFile('src', 'scenes', 'SquadSelectScene.ts');

    expect(teamsSource).toContain("import { TEAM_CARD_STYLE } from '../ui/teamCardStyle'");
    expect(setupSource).toContain(
      "import { TEAM_CARD_STYLE, type TeamCardVisualStyle } from '../ui/teamCardStyle'"
    );
    expect(setupSource).toContain(
      'const style = selected ? TEAM_CARD_STYLE.selected : TEAM_CARD_STYLE.normal'
    );
    expect(setupSource).toContain('TEAM_CARD_STYLE.panel.backgroundColor');
    expect(setupSource).toContain(
      'const style = selected ? TEAM_CARD_STYLE.selected : team === undefined ? TEAM_CARD_STYLE.muted : TEAM_CARD_STYLE.normal'
    );
    expect(setupSource).toContain(
      'const style = isSelected ? TEAM_CARD_STYLE.selected : TEAM_CARD_STYLE.normal'
    );
    expect(setupSource).toContain('this.applyTeamCardStyle(background, TEAM_CARD_STYLE.hover)');
    expect(setupSource).toContain('changeTournamentSetupFormat(this.draft, formatId)');
    expect(setupSource).toContain('fillTournamentSetupRandom(this.draft');
    expect(setupSource).toContain('shuffleTournamentSetupGroups(this.draft');
    expect(setupSource).toContain('createTournamentFromSetupDraft(this.draft');
  });

  it('renders tournament team cards with shared 3-letter codes, padded flags and full-name tooltips', () => {
    const setupSource = readSourceFile('src', 'scenes', 'TournamentSetupScene.ts');
    const desktopLayout = createTournamentSetupLayout(false);

    expect(setupSource).toContain("import { getFlagAssetKey, getTeamScoreboardCode, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams'");
    expect(setupSource).toContain('getTeamScoreboardCode(team.flagCode)');
    expect(desktopLayout.teams.flagX).toBe(-44);
    expect(desktopLayout.groups.slotFlagX).toBe(32);
    expect(desktopLayout.teams.codeX).toBe(24);
    expect(desktopLayout.groups.slotCodeX).toBe(94);
    expect(setupSource).toContain('.text(teamLayout.codeX, 0, teamCode');
    expect(setupSource).toContain(".setOrigin(0.5)");
    expect(desktopLayout.teams.codeFontSize).toBe('22px');
    expect(desktopLayout.groups.emptyFontSize).toBe('14px');
    expect(desktopLayout.groups.slotFontSize).toBe('18px');
    expect(setupSource).toContain('fontSize: teamLayout.codeFontSize');
    expect(setupSource).toContain('fontSize: team === undefined ? layout.groups.emptyFontSize : layout.groups.slotFontSize');
    expect(setupSource).toContain('showTeamTooltip(team.name');
    expect(setupSource).toContain('moveTeamTooltip(pointer.x, pointer.y)');
    expect(setupSource).toContain('hideTeamTooltip()');
    expect(setupSource).toContain('setDepth(TEAM_TOOLTIP_DEPTH)');
  });

  it('uses a two-column masked group viewport only in mobile landscape', () => {
    const setupSource = readSourceFile('src', 'scenes', 'TournamentSetupScene.ts');
    const desktopLayout = createTournamentSetupLayout(false);
    const mobileLayout = createTournamentSetupLayout(true);

    expect(setupSource).toContain("import {\n  createTournamentSetupLayout,");
    expect(setupSource).toContain('if (layout.mobileLandscape) {');
    expect(setupSource).toContain('this.createMobileGroupSlots(layout)');
    expect(setupSource).toContain('private createMobileGroupSlots(');
    expect(setupSource).toContain('content.setMask(mask)');
    expect(setupSource).toContain('dragScroll.bindScrollableTapTarget(selectionZone');
    expect(setupSource).toContain('dragScroll.bindScrollableTapTarget(aiZone');
    expect(setupSource).toContain('dragScroll.bindDragTarget(scrollZone)');
    expect(desktopLayout.groups.viewportHeight).toBeNull();
    expect(mobileLayout.groups.columns).toBe(2);
    expect(mobileLayout.groups.viewportHeight).toBe(350);
    expect(mobileLayout.groups.panelHeight).toBe(330);
    expect(mobileLayout.groups.slotHeight).toBeGreaterThan(desktopLayout.groups.slotHeight);
    expect(getTournamentSetupGroupMaxScroll(2, mobileLayout)).toBe(0);
    expect(getTournamentSetupGroupMaxScroll(4, mobileLayout)).toBeGreaterThan(0);
    expect(getTournamentSetupGroupMaxScroll(8, mobileLayout)).toBeGreaterThan(
      getTournamentSetupGroupMaxScroll(4, mobileLayout)
    );
  });

  it('keeps exact desktop geometry and uses compact mobile teams and two action rows', () => {
    const desktopLayout = createTournamentSetupLayout(false);
    const mobileLayout = createTournamentSetupLayout(true);

    expect(desktopLayout.groups).toMatchObject({
      startX: 54,
      startY: 166,
      panelWidth: 220,
      panelHeight: 196,
      gapX: 14,
      gapY: 16,
      slotWidth: 200,
      slotHeight: 38
    });
    expect(desktopLayout.bottomButtons.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 130, y: 666 },
      { x: 342, y: 666 },
      { x: 574, y: 666 },
      { x: 832, y: 666 },
      { x: 1090, y: 666 },
      { x: 1360, y: 666 }
    ]);
    expect(mobileLayout.teams.columns).toBe(2);
    expect(mobileLayout.teams.buttonHeight).toBeGreaterThan(desktopLayout.teams.buttonHeight);
    expect(new Set(mobileLayout.bottomButtons.map((button) => button.y))).toEqual(new Set([548, 624]));
    expect(mobileLayout.bottomButtons.every((button) => button.height >= 56)).toBe(true);
  });

  it('keeps selected slots as replacement targets and disables already selected teams in the right list', () => {
    const setupSource = readSourceFile('src', 'scenes', 'TournamentSetupScene.ts');

    expect(setupSource).toContain('const isSelected = team !== undefined && this.draft.slots.includes(team.flagCode)');
    expect(setupSource).toContain('if (team !== undefined) {');
    expect(setupSource).toContain('if (!isSelected) {\n            this.selectTeam(team.flagCode);');
    expect(setupSource).toContain('option.setAlpha(isSelected ? 0.48 : 1)');
    expect(setupSource).toContain('option.setInteractive({ useHandCursor: !isSelected })');
    expect(setupSource).not.toContain('this.activeSlotIndex = Math.min(this.activeSlotIndex + 1, this.draft.slots.length - 1)');
  });
});

describe('tournament setup draft helpers', () => {
  it('creates the correct slot count for every format', () => {
    expect(getTournamentSetupSlotCount('cup-m')).toBe(8);
    expect(getTournamentSetupSlotCount('cup-l')).toBe(16);
    expect(getTournamentSetupSlotCount('cup-xl')).toBe(32);
  });

  it('selects and replaces teams manually while making the old team available again', () => {
    let draft = createTournamentSetupDraft('cup-m');

    draft = selectTournamentSetupTeam(draft, 0, 'pl');
    draft = selectTournamentSetupTeam(draft, 0, 'ua');
    draft = selectTournamentSetupTeam(draft, 1, 'fr');

    expect(draft.slots.slice(0, 2)).toEqual(['ua', 'fr']);

    draft = selectTournamentSetupTeam(draft, 1, 'pl');

    expect(draft.slots.slice(0, 2)).toEqual(['ua', 'pl']);
  });

  it('keeps new tournament teams AI by default', () => {
    let draft = createTournamentSetupDraft('cup-m');

    expect(draft.controllerTypes.every((controllerType) => controllerType === 'AI')).toBe(true);

    draft = selectTournamentSetupTeam(draft, 0, 'pl');

    expect(draft.controllerTypes[0]).toBe('AI');
  });

  it('toggles controller type only for the selected slot', () => {
    let draft = createTournamentSetupDraft('cup-m');
    draft = selectTournamentSetupTeam(draft, 0, 'pl');
    draft = selectTournamentSetupTeam(draft, 1, 'ua');
    draft = toggleTournamentSetupTeamControllerType(draft, 1);

    expect(draft.controllerTypes[0]).toBe('AI');
    expect(draft.controllerTypes[1]).toBe('HUMAN');
  });

  it('resets a replaced occupied slot to the AI default', () => {
    let draft = createTournamentSetupDraft('cup-m');
    draft = selectTournamentSetupTeam(draft, 0, 'pl');
    draft = toggleTournamentSetupTeamControllerType(draft, 0);
    draft = selectTournamentSetupTeam(draft, 0, 'ua');

    expect(draft.slots[0]).toBe('ua');
    expect(draft.controllerTypes[0]).toBe('AI');
  });

  it('does not allow selecting one team twice', () => {
    const draft = selectTournamentSetupTeam(createTournamentSetupDraft('cup-m'), 0, 'pl');

    expect(() => selectTournamentSetupTeam(draft, 1, 'pl')).toThrow('already selected');
  });

  it('fills all teams randomly with unique ids', () => {
    const draft = fillTournamentSetupRandom(createTournamentSetupDraft('cup-l'), 'setup-random');

    expect(draft.slots).toHaveLength(16);
    expect(new Set(draft.slots).size).toBe(16);
    expect(NATIONAL_TEAMS).toHaveLength(65);
    expect(NATIONAL_TEAMS.some((team) => team.flagCode === 'nir')).toBe(true);
    expect(isTournamentSetupComplete(draft)).toBe(true);
    expect(draft.controllerTypes.every((controllerType) => controllerType === 'AI')).toBe(true);
  });

  it('fills only empty slots and preserves manual teams', () => {
    let draft = createTournamentSetupDraft('cup-m');
    draft = selectTournamentSetupTeam(draft, 0, 'pl');
    draft = selectTournamentSetupTeam(draft, 3, 'ua');
    draft = toggleTournamentSetupTeamControllerType(draft, 3);
    draft = fillEmptyTournamentSetupSlots(draft, 'setup-empty');

    expect(draft.slots[0]).toBe('pl');
    expect(draft.slots[3]).toBe('ua');
    expect(draft.controllerTypes[0]).toBe('AI');
    expect(draft.controllerTypes[3]).toBe('HUMAN');
    expect(new Set(draft.slots).size).toBe(8);
    expect(isTournamentSetupComplete(draft)).toBe(true);
    expect(draft.controllerTypes.every((controllerType, index) => draft.slots[index] !== null || controllerType === 'AI')).toBe(true);
  });

  it('clears selected teams', () => {
    const filledDraft = fillTournamentSetupRandom(createTournamentSetupDraft('cup-m'), 'setup-clear');
    const clearedDraft = clearTournamentSetupDraft(filledDraft);

    expect(getSelectedTournamentTeamIds(clearedDraft)).toEqual([]);
    expect(clearedDraft.slots.every((teamId) => teamId === null)).toBe(true);
    expect(clearedDraft.controllerTypes.every((controllerType) => controllerType === 'AI')).toBe(true);
  });

  it('shuffles complete groups without changing participants', () => {
    let filledDraft = fillTournamentSetupRandom(createTournamentSetupDraft('cup-m'), 'setup-shuffle');
    filledDraft = toggleTournamentSetupTeamControllerType(filledDraft, 2);
    const humanTeamId = filledDraft.slots[2];
    const shuffledDraft = shuffleTournamentSetupGroups(filledDraft, 'setup-shuffle-groups');

    expect([...shuffledDraft.slots].sort()).toEqual([...filledDraft.slots].sort());
    expect(shuffledDraft.controllerTypes[shuffledDraft.slots.indexOf(humanTeamId)]).toBe('HUMAN');
  });

  it('preserves selected teams when changing to a larger format', () => {
    let draft = createTournamentSetupDraft('cup-m');
    draft = selectTournamentSetupTeam(draft, 0, 'pl');
    draft = selectTournamentSetupTeam(draft, 1, 'ua');
    draft = toggleTournamentSetupTeamControllerType(draft, 1);
    draft = changeTournamentSetupFormat(draft, 'cup-l');

    expect(draft.slots).toHaveLength(16);
    expect(draft.slots.slice(0, 2)).toEqual(['pl', 'ua']);
    expect(draft.controllerTypes.slice(0, 3)).toEqual(['AI', 'HUMAN', 'AI']);
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
      controllerType: 'AI'
    });
    expect(tournament.participants[1]).toEqual({
      flagCode: draft.slots[1],
      controllerType: 'HUMAN'
    });
    expect(tournament.matches).toHaveLength(15);
  });
});

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';

const ui = vi.hoisted(() => ({ buttons: [] as any[], mobile: false }));
vi.mock('phaser', () => ({ default: {
  Scene: class {}, GameObjects: { Container: class { add() {} once() {} } },
  Math: { DegToRad: (n: number) => n * Math.PI / 180 }
} }));
vi.mock('../ui/mobileLayout', () => ({ isMobileLandscapeLayout: () => ui.mobile }));
vi.mock('../ui/Button', () => ({ Button: class {
  constructor(scene: unknown, x: number, y: number, label: string, onClick: () => void, options: any) {
    Object.assign(this, { x, y, label, onClick, options }); ui.buttons.push(this);
  }
} }));
vi.mock('../ui/MatchStatsPanel', () => ({
  MatchStatsPanel: class {}, MATCH_STATS_PANEL_CENTER_Y: 354,
  MATCH_STATS_PANEL_WIDTH: 840, MATCH_STATS_PANEL_HEIGHT: 512
}));
vi.mock('../ui/PenaltyPauseStatsPanel', () => ({ PenaltyPauseStatsPanel: class {} }));
vi.mock('../tournament/TournamentStorage', () => ({ saveTournament: vi.fn(), loadTournament: vi.fn() }));

import { TeamSelectScene } from '../scenes/TeamSelectScene';
import { ResultScene } from '../scenes/ResultScene';
import { TournamentHubScene } from '../scenes/TournamentHubScene';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import { createTeamScreenLayout } from '../ui/teamScreenLayout';
import { GameEngine } from '../game/GameEngine';
import * as kitSelection from '../game/tournamentKitSelection';
import { GameScene } from '../scenes/GameScene';
import { TournamentPenaltyScene } from '../scenes/TournamentPenaltyScene';
import { PenaltyAiController } from '../ai';
import {
  createTournamentState, submitTournamentMatchResult, createPenaltyShootoutState,
  drawPenaltyGoalkeeperCard, revealPenaltyAttackCard, takePenaltyKick, saveTournament,
  type TournamentState, type TournamentMatchResult
} from '../tournament';
import { getMatchHeaderContext } from '../ui/matchHeaderContext';
import { ScoreView } from '../ui/ScoreView';
import { createDevLabLayout } from '../devLabLayout';
import { createResultActionButtons, RESULT_ACTION_BUTTON_Y } from '../ui/resultActionButtons';
import { SCOREBOARD_BORDER_COLOR } from '../ui/scoreboardStyle';

function node(x = 0, y = 0): any {
  return { x, y, width: 200, height: 50, destroy: vi.fn(), add: vi.fn(),
    setText() { return this; }, setVisible() { return this; }, setMask() { return this; },
    get displayWidth() { return this.width; }, setX(nextX: number) { this.x = nextX; return this; },
    setDepth() { return this; }, setInteractive() { return this; }, setStrokeStyle() { return this; },
    setOrigin() { return this; }, setDisplaySize(width: number, height: number) { this.width = width; this.height = height; return this; }, setScale: vi.fn() };
}
function attach(scene: any): any {
  Object.assign(scene, {
    make: { graphics: () => ({ fillStyle() { return this; }, fillRect() { return this; }, createGeometryMask() { return this; }, setVisible() {} }) },
    textures: { exists: () => true },
    add: { container: vi.fn(node), rectangle: vi.fn(node), text: vi.fn(node), image: vi.fn(node), existing: vi.fn() },
    input: { enabled: true }, scene: { start: vi.fn(), restart: vi.fn() },
    time: { removeAllEvents: vi.fn() }, tweens: { killAll: vi.fn() }
  });
  return scene;
}
function tournamentAt(stage: 'semi-final' | 'final'): TournamentState {
  let tournament = createTournamentState({ formatId: 'cup-m', teamIds: ['es', 'fr', 'br', 'de', 'it', 'pt', 'nl', 'ar'], seed: 'stage17' });
  while (true) {
    const match = tournament.matches.find((m) => m.status === 'available');
    if (!match || match.stage === stage) return tournament;
    tournament = submitTournamentMatchResult(tournament, match.id, { homeGoals: 2, awayGoals: 0 });
  }
}
function penalty(stage: 'semi-final' | 'final' = 'semi-final'): any {
  const scene = attach(new TournamentPenaltyScene());
  let tournament = tournamentAt(stage);
  const match = tournament.matches.find((m) => m.status === 'available')!;
  const result: TournamentMatchResult = {
    matchId: match.id, homeTeamId: match.homeTeamId!, awayTeamId: match.awayTeamId!, homeGoals: 1, awayGoals: 1,
    teamStats: { home: { teamId: match.homeTeamId!, goals: 1, shots: 3, goalkeeperSaves: 1 },
      away: { teamId: match.awayTeamId!, goals: 1, shots: 2, goalkeeperSaves: 2 } }, playerStats: []
  };
  scene.init({ tournamentId: tournament.id, matchResult: result, homeControllerType: 'HUMAN', awayControllerType: 'AI' });
  scene.registry = { get: vi.fn(() => tournament), set: vi.fn((_key, value) => { tournament = value; }) };
  scene.shootoutState = createPenaltyShootoutState({ matchId: match.id, homeTeamId: match.homeTeamId!, awayTeamId: match.awayTeamId!, seed: 'stage17-penalty' });
  scene.render = vi.fn();
  return scene;
}
function complete(scene: any): void {
  for (let i = 0; i < 300 && scene.shootoutState.status !== 'complete'; i++) {
    const s = scene.shootoutState;
    scene.shootoutState = s.phase === 'selecting-goalkeeper' ? drawPenaltyGoalkeeperCard(s)
      : s.phase === 'selecting-attacker' ? revealPenaltyAttackCard(s, 0) : takePenaltyKick(s);
  }
  expect(scene.shootoutState.status).toBe('complete');
  scene.completeTournamentMatch();
}
function click(label: string): void { [...ui.buttons].reverse().find((button) => button.label === label).onClick(); }
beforeEach(() => { ui.buttons = []; ui.mobile = false; vi.clearAllMocks(); });
afterEach(() => vi.unstubAllEnvs());

describe('completed penalty navigation and persistence', () => {
  it.each(['semi-final', 'final'] as const)('saves %s once and Continue follows the real updated bracket', (stage) => {
    const scene = penalty(stage);
    complete(scene);
    const saved = structuredClone(scene.registry.get());
    scene.completeTournamentMatch();
    // Also protect a scene re-entry with a completed match in the registry.
    scene.resultRecorded = false;
    scene.completeTournamentMatch();
    scene.createCompletedShootoutActions();
    expect(ui.buttons.map((b) => b.label)).toEqual(['Play Again', 'Continue']);
    click('Continue');
    expect(scene.scene.start).toHaveBeenLastCalledWith(stage === 'final' ? 'TournamentCompleteScene' : 'TournamentHubScene');
    click('Play Again');
    expect(scene.scene.start).toHaveBeenLastCalledWith('GameScene', expect.objectContaining({
      player1FlagCode: scene.matchResult.homeTeamId, player2FlagCode: scene.matchResult.awayTeamId,
      player1ControllerType: 'HUMAN', player2ControllerType: 'AI', launchContext: { mode: 'quick-match' }
    }));
    expect(saveTournament).toHaveBeenCalledTimes(1);
    expect(scene.registry.set).toHaveBeenCalledTimes(1);
    expect(scene.registry.get()).toEqual(saved);
  });
  it('keeps standalone replay, selection and menu actions', () => {
    const scene = penalty(); scene.standalone = true; scene.tournamentId = null;
    complete(scene); scene.createCompletedShootoutActions();
    expect(ui.buttons.map((b) => b.label)).toEqual(['Play Again', 'New Match', 'Menu']);
    click('Play Again');
    expect(scene.scene.start).toHaveBeenLastCalledWith('TournamentPenaltyScene', {
      fieldKits: {}, standalone: true, matchResult: scene.matchResult, homeControllerType: 'HUMAN', awayControllerType: 'AI'
    });
    click('New Match'); expect(scene.scene.start).toHaveBeenLastCalledWith('TeamSelectScene', { mode: 'penalty' });
    click('Menu'); expect(scene.scene.start).toHaveBeenLastCalledWith('MenuScene');
    expect(saveTournament).not.toHaveBeenCalled();
  });
  it('isolates the completed dev preview and returns to Dev Lab', () => {
    const scene = penalty(); scene.devMockCompleted = true;
    const original = structuredClone(scene.registry.get());
    scene.completeShootoutFromPause();
    scene.createCompletedShootoutActions(); click('Continue');
    expect(scene.scene.start).toHaveBeenCalledWith('DevLabScene');
    expect(scene.registry.get()).toEqual(original);
    expect(scene.registry.set).not.toHaveBeenCalled(); expect(saveTournament).not.toHaveBeenCalled();
  });
  it('ignores the preview flag in production', () => {
    vi.stubEnv('DEV', false);
    const scene = penalty(); scene.init({ devMockCompleted: true });
    expect(scene.devMockCompleted).toBe(false);
  });
});

describe('pause and restart', () => {
  it.each([false, true])('penalty restart preserves teams/controllers and restarts the proper mode (standalone=%s)', (standalone) => {
    const scene = penalty(); scene.standalone = standalone;
    const original = structuredClone(scene.registry.get());
    scene.openPauseModal();
    expect(ui.buttons.map((b) => b.label)).toEqual(['Exit to Menu', 'Restart', 'Continue', 'Sim']);
    const primary = ui.buttons.slice(0, 3);
    expect(primary.map((b) => [b.options.width, b.options.height, b.options.fontSize])).toEqual(Array(3).fill([280, 68, '24px']));
    expect(primary[2].x + 140 - (primary[0].x - 140)).toBe(840);
    expect(ui.buttons[3].y).not.toBe(primary[0].y);
    click('Restart'); click('Restart');
    if (standalone) expect(scene.scene.start).toHaveBeenCalledWith('TournamentPenaltyScene', expect.objectContaining({ standalone: true, homeControllerType: 'HUMAN', awayControllerType: 'AI' }));
    else expect(scene.scene.start).toHaveBeenCalledWith('GameScene', expect.objectContaining({ launchContext: {
      mode: 'tournament', tournamentId: original.id, tournamentMatchId: scene.matchResult.matchId
    } }));
    expect(scene.time.removeAllEvents).toHaveBeenCalledOnce(); expect(scene.tweens.killAll).toHaveBeenCalledOnce();
    expect(scene.registry.get()).toEqual(original); expect(saveTournament).not.toHaveBeenCalled();
  });
  it('Cancel keeps penalty state and resumes AI only after confirmation is closed', () => {
    const scene = penalty(); const state = scene.shootoutState;
    const controller = { cancelPendingAction: vi.fn(), scheduleNextAction: vi.fn() };
    scene.penaltyAiController = controller;
    scene.openPauseModal(); click('Restart'); scene.schedulePenaltyAiAction();
    expect(controller.scheduleNextAction).not.toHaveBeenCalled();
    click('Cancel');
    expect(scene.shootoutState).toBe(state); expect(scene.scene.start).not.toHaveBeenCalled();
    expect(controller.scheduleNextAction).toHaveBeenCalledOnce();
  });
  it('destroys pending penalty AI so an old callback cannot act after restart', () => {
    const scene = penalty(); const actions = vi.fn(); let callback = () => {};
    scene.penaltyAiController = new PenaltyAiController({ getState: () => scene.shootoutState,
      getControllerType: () => 'AI', random: () => 0,
      scheduleTimer: (_delay, cb) => { callback = cb; return { remove: vi.fn() }; }, onAction: actions });
    scene.penaltyAiController.scheduleNextAction(); scene.restartMatch(); callback();
    expect(actions).not.toHaveBeenCalled();
  });
  it.each(['quick', 'tournament', 'tutorial'])('restarts %s using existing match cleanup and unchanged selection', (mode) => {
    const scene = attach(new GameScene());
    scene.player1Name = 'Spain'; scene.player2Name = 'France'; scene.player1FlagCode = 'es'; scene.player2FlagCode = 'fr';
    scene.player1ControllerType = 'HUMAN'; scene.player2ControllerType = 'AI';
    scene.matchMode = mode === 'tutorial' ? 'tutorial' : 'quick';
    scene.launchContext = mode === 'tournament' ? { mode: 'tournament', tournamentId: 'cup', tournamentMatchId: 'semi-final-1' } : { mode: 'quick-match' };
    scene.cancelAutomaticCardFlow = vi.fn(); scene.aiTurnController = { dispose: vi.fn() };
    scene.pauseModal = node(); scene.exitConfirmModal = node(); scene.tutorialOverlay = node();
    const ai = scene.aiTurnController;
    scene.restartMatch(); scene.restartMatch();
    expect(scene.scene.restart).toHaveBeenCalledExactlyOnceWith({ player1FieldKit: 'home', player2FieldKit: 'home', player1Name: 'Spain', player2Name: 'France',
      player1FlagCode: 'es', player2FlagCode: 'fr', player1ControllerType: 'HUMAN', player2ControllerType: 'AI',
      matchMode: mode === 'tutorial' ? 'tutorial' : 'quick', launchContext: scene.launchContext });
    expect(ai.dispose).toHaveBeenCalledOnce(); expect(scene.cancelAutomaticCardFlow).toHaveBeenCalledOnce();
    expect(scene.pauseModal).toBeNull(); expect(scene.exitConfirmModal).toBeNull();
    expect(scene.time.removeAllEvents).toHaveBeenCalledOnce(); expect(scene.tweens.killAll).toHaveBeenCalledOnce();
  });
  it('Cancel in a main match keeps the engine and resumes the existing card flow', () => {
    const scene = attach(new GameScene()); const engine = { getState: vi.fn() }; scene.engine = engine;
    scene.pauseModal = node(); scene.resumeAutomaticCardFlow = vi.fn();
    scene.refreshGameplayAfterBlockingModal = vi.fn(() => true);
    scene.openRestartConfirmation(); click('Cancel');
    expect(scene.engine).toBe(engine); expect(scene.scene.restart).not.toHaveBeenCalled();
    expect(scene.resumeAutomaticCardFlow).toHaveBeenCalledOnce(); expect(scene.exitConfirmModal).toBeNull();
  });
});

describe('diagnostics across pause and rules', () => {
  it('keeps the existing match event log and sequence when dismissing either overlay', () => {
    const scene = attach(new GameScene());
    const engine = new GameEngine(); engine.startNewGame({ seed: 'pause-log' });
    const entries = engine.getEventLog(); const snapshot = structuredClone(entries);
    scene.engine = engine; scene.isSceneStableForAi = vi.fn(() => false);
    scene.pauseModal = node(); scene.closePauseModal({ resumeAutomaticCardFlow: false });
    scene.infoModal = node(); scene.activeInfoModal = 'rules'; scene.closeMatchInfoModal();
    expect(scene.engine).toBe(engine); expect(engine.getEventLog()).toBe(entries);
    expect(engine.getEventLog()).toEqual(snapshot);
  });
});

describe('mobile match context', () => {
  it('uses the real format, match stage and group with a neutral fallback', () => {
    const t = tournamentAt('semi-final');
    const context = { mode: 'tournament' as const, tournamentId: t.id, tournamentMatchId: 'semi-final-1' };
    expect(getMatchHeaderContext('quick', context, t)).toBe('CUP M /\nSEMI-FINAL');
    context.tournamentMatchId = t.matches[0].id;
    expect(getMatchHeaderContext('quick', context, t)).toBe('CUP M /\nGROUP A');
    expect(getMatchHeaderContext('quick', context)).toBe('TOURNAMENT');
    expect(getMatchHeaderContext('quick', { ...context, tournamentId: 'missing' }, t)).toBe('TOURNAMENT');
    expect(getMatchHeaderContext('tutorial', context, t)).toBe('TUTORIAL');
    expect(getMatchHeaderContext('quick', { mode: 'quick-match' })).toBe('QUICK MATCH');
  });
  it.each([false, true])('preserves the central score and adds the mirror divider only on mobile=%s', (mobile) => {
    ui.mobile = mobile; const scene = attach({});
    new ScoreView(scene as Phaser.Scene, 800, 42, 'Spain', 'France', 'es', 'fr', 1, 1, { matchContext: 'PENALTIES', penaltyScore: { playerOne: 4, playerTwo: 3 } });
    const rects = scene.add.rectangle.mock.calls;
    expect(rects).toHaveLength(3);
    const right = rects[1]; expect(right.slice(0, 4)).toEqual([260, 0, 1, 58]);
    expect(rects[2]).toEqual([-260, ...right.slice(1)]);
    expect(scene.add.text).toHaveBeenCalledWith(0, -1, '1:1', expect.anything());
    expect(scene.add.text).toHaveBeenCalledWith(410, -1, '', expect.anything());
    expect(scene.add.image.mock.calls.map((c: any[]) => c[0])).toEqual([-221, 221]);
  });
  it.each([false, true])('fits all eleven Dev Lab scenarios above Back (mobile=%s)', (mobile) => {
    const layout = createDevLabLayout(mobile);
    expect(layout.buttons.startY + 10 * layout.buttons.gap + layout.buttons.height / 2)
      .toBeLessThan(layout.backButton.y - layout.backButton.height / 2);
  });
});


describe('Stage 17.1 penalty result button attachment', () => {
  it.each([false, true])('joins the real panel geometry with only outer bottom corners rounded (standalone=%s)', (standalone) => {
    const scene = penalty();
    scene.standalone = standalone;
    scene.createMatchStatsPanel = vi.fn();
    scene.createCompletedShootoutPanel(scene.matchResult);
    const [panelX, panelY] = scene.add.container.mock.calls[0];
    const [, , panelWidth, panelHeight] = scene.add.rectangle.mock.calls[0];
    const panelBottom = panelY + panelHeight / 2;

    scene.createCompletedShootoutActions();
    const count = standalone ? 3 : 2;
    expect(ui.buttons).toHaveLength(count);
    expect(panelWidth).toBe(900);
    expect(panelBottom).toBe(600);
    expect(ui.buttons[0].x - ui.buttons[0].options.width / 2).toBe(panelX - panelWidth / 2);
    expect(ui.buttons[count - 1].x + ui.buttons[count - 1].options.width / 2).toBe(panelX + panelWidth / 2);

    ui.buttons.forEach((button, index) => {
      expect(button.options.width).toBe(900 / count);
      expect(button.options.height).toBe(68);
      expect(button.y).toBe(634);
      expect(button.y - button.options.height / 2).toBe(panelBottom);
      expect(button.options.borderRadius).toEqual({
        topLeft: 0, topRight: 0,
        bottomLeft: index === 0 ? 8 : 0,
        bottomRight: index === count - 1 ? 8 : 0
      });
      expect(button.options.borderColor).toBe(SCOREBOARD_BORDER_COLOR);
      if (index > 0) {
        const previous = ui.buttons[index - 1];
        // Both side strokes share one coordinate, forming one divider with no gap.
        expect(previous.x + previous.options.width / 2).toBe(button.x - button.options.width / 2);
        expect(previous.options.rightBorderColor).toBe(0x000000);
        expect(button.options.leftBorderColor).toBe(0x000000);
      }
    });
    expect(ui.buttons[0].options.leftBorderColor).toBeUndefined();
    expect(ui.buttons[count - 1].options.rightBorderColor).toBeUndefined();
  });

  it('keeps the default ResultScene position and geometry after rendering penalty results', () => {
    const scene = penalty();
    scene.createCompletedShootoutActions();
    ui.buttons = [];
    createResultActionButtons(scene, 800, [
      { label: 'Play Again', onClick: vi.fn() }, { label: 'Continue', onClick: vi.fn() }
    ], { attachedToPanel: true });
    expect(RESULT_ACTION_BUTTON_Y).toBe(644);
    expect(ui.buttons.map((button) => [button.x, button.y, button.options.width, button.options.height]))
      .toEqual([[590, 644, 420, 68], [1010, 644, 420, 68]]);
    ui.buttons = [];
    createResultActionButtons(scene, 800, [{ label: 'Back', onClick: vi.fn() }]);
    expect(ui.buttons[0].y).toBe(644);
    expect(ui.buttons[0].options.borderRadius).toBe(8);
  });

  it('keeps pause button placement and attached styling unchanged', () => {
    const scene = penalty();
    scene.openPauseModal();
    expect(ui.buttons.slice(0, 3).map((button) => [button.y, button.options.width, button.options.height]))
      .toEqual(Array(3).fill([644, 280, 68]));
    expect(ui.buttons.slice(0, 3).map((button) => button.options.borderRadius)).toEqual([
      { topLeft: 0, topRight: 0, bottomLeft: 8, bottomRight: 0 },
      { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 8 }
    ]);
  });
});


describe('field kit scene lifecycle', () => {
  it('keeps desktop preview buttons independent and disables missing AWAY', () => {
    const mobile = false;
    const scene = attach(new TeamSelectScene());
    scene.init();
    scene.render = vi.fn();
    scene.textures = { exists: () => true };
    scene.add.graphics = () => ({ fillStyle() {}, fillRoundedRect() {}, lineStyle() {}, strokeRoundedRect() {} });
    const layout = createTeamScreenLayout({ mobileWide: mobile });
    expect(scene.fieldKits).toEqual({ 1: 'home', 2: 'home' });
    const germany = NATIONAL_TEAMS.find((team) => team.flagCode === 'de')!;
    scene.createTeamKitPreview(layout.team1KitPreviewRect, germany, 1);
    expect(scene.add.image).toHaveBeenLastCalledWith(expect.any(Number), expect.any(Number), 'kit-de');
    const away = ui.buttons.at(-1);
    expect(away.options.disabled).toBe(false);
    away.onClick();
    expect(scene.fieldKits).toEqual({ 1: 'away', 2: 'home' });
    expect(scene.render).toHaveBeenCalledOnce();
    scene.createTeamKitPreview(layout.team1KitPreviewRect, germany, 1);
    expect(scene.add.image).toHaveBeenLastCalledWith(expect.any(Number), expect.any(Number), 'kit-de-away');
    scene.createTeamKitPreview(layout.team2KitPreviewRect, germany, 2);
    ui.buttons.at(-1).onClick();
    expect(scene.fieldKits).toEqual({ 1: 'away', 2: 'away' });
    scene.createTeamKitPreview(layout.team1KitPreviewRect, germany, 1);
    ui.buttons.at(-2).onClick();
    expect(scene.fieldKits).toEqual({ 1: 'home', 2: 'away' });
    scene.createTeamKitPreview(layout.team2KitPreviewRect, NATIONAL_TEAMS.find((team) => team.flagCode === 'fr'), 2);
    expect(ui.buttons.at(-1).options.disabled).toBe(true);
    // Toggle hitboxes sit above each preview and clear the title and team panels.
    for (const button of ui.buttons) {
      expect(button.y - button.options.height / 2).toBeGreaterThan(51);
      expect(button.y + button.options.height / 2).toBeLessThan(layout.team1SelectedCardRect.y);
    }
  });

  it.each(['match', 'penalty'])('passes manual kit choice to %s and resets it on new team/selection', (mode) => {
    const scene = attach(new TeamSelectScene());
    scene.init({ mode }); scene.render = vi.fn();
    scene.selectTeam('Germany'); scene.fieldKits[1] = 'away';
    scene.startMatch();
    if (mode === 'match') expect(scene.scene.start).toHaveBeenLastCalledWith('GameScene', expect.objectContaining({
      player1FlagCode: 'de', player1FieldKit: 'away', player2FieldKit: 'home'
    }));
    else expect(scene.scene.start).toHaveBeenLastCalledWith('TournamentPenaltyScene', expect.objectContaining({ fieldKits: { de: 'away', es: 'home' } }));
    scene.selectTeam('Germany'); expect(scene.fieldKits[1]).toBe('away');
    scene.selectTeam('France'); expect(scene.fieldKits[1]).toBe('home');
    scene.fieldKits[2] = 'away'; scene.activeSlot = 2; scene.selectTeam('Germany');
    expect(scene.fieldKits[2]).toBe('home');
    scene.fieldKits[1] = 'away'; scene.fieldKits[2] = 'away'; scene.init({ mode });
    expect(scene.fieldKits).toEqual({ 1: 'home', 2: 'home' });
  });

  it('preserves AWAY through Restart without consulting the tournament selector', () => {
    const selector = vi.spyOn(kitSelection, 'resolveTournamentKits');
    try {
      const scene = attach(new GameScene());
      scene.cancelAutomaticCardFlow = vi.fn();
      scene.init({ player1FlagCode: 'de', player1FieldKit: 'away', player2FieldKit: 'home',
        launchContext: { mode: 'tournament', tournamentId: 'cup', tournamentMatchId: 'fixture' } });
      scene.restartMatch();
      expect(scene.scene.restart).toHaveBeenCalledWith(expect.objectContaining({ player1FieldKit: 'away', player2FieldKit: 'home' }));
      expect(selector).not.toHaveBeenCalled();
    } finally { selector.mockRestore(); }
  });

  it('maps match kits to tournament penalties by team and preserves direct replay', () => {
    const scene = attach(new ResultScene());
    const state = new GameEngine().startNewGame({ player1FlagCode: 'de', player2FlagCode: 'fr', player1FieldKit: 'away' });
    scene.init({ state });
    scene.startReplayMatch();
    expect(scene.scene.start).toHaveBeenLastCalledWith('GameScene', expect.objectContaining({ player1FieldKit: 'away', player2FieldKit: 'home' }));
    const tournament = tournamentAt('semi-final');
    const result = { homeTeamId: 'fr', awayTeamId: 'de', matchId: 'fixture' };
    scene.startPenaltyShootout(tournament, result);
    const data = scene.scene.start.mock.calls.at(-1)[1];
    expect(data.fieldKits).toEqual({ de: 'away', fr: 'home' });
    const shootout = attach(new TournamentPenaltyScene()); shootout.init(data);
    shootout.startMainMatch(true);
    expect(shootout.scene.start).toHaveBeenLastCalledWith('GameScene', expect.objectContaining({ player1FlagCode: 'fr', player1FieldKit: 'home', player2FlagCode: 'de', player2FieldKit: 'away' }));
    shootout.startStandalonePenaltyReplay();
    expect(shootout.scene.start).toHaveBeenLastCalledWith('TournamentPenaltyScene', expect.objectContaining({ fieldKits: { de: 'away', fr: 'home' } }));
  });

  it('selects anew for each fixture using actual fixture order', () => {
    const selector = vi.spyOn(kitSelection, 'resolveTournamentKits').mockReturnValueOnce(['home', 'away']).mockReturnValueOnce(['away', 'home']);
    try {
      const scene = attach(new TournamentHubScene()); scene.time.now = 1000;
      const tournament = tournamentAt('semi-final');
      scene.startTournamentMatch(tournament, { id: 'first', homeTeamId: 'fr', awayTeamId: 'de' });
      expect(selector).toHaveBeenNthCalledWith(1, 'fr', 'de');
      expect(scene.scene.start).toHaveBeenLastCalledWith('GameScene', expect.objectContaining({ player1FieldKit: 'home', player2FieldKit: 'away' }));
      scene.startTournamentMatch(tournament, { id: 'next', homeTeamId: 'de', awayTeamId: 'fr' });
      expect(selector).toHaveBeenNthCalledWith(2, 'de', 'fr');
      expect(scene.scene.start).toHaveBeenLastCalledWith('GameScene', expect.objectContaining({ player1FieldKit: 'away', player2FieldKit: 'home' }));
    } finally { selector.mockRestore(); }
  });
});


describe('KIT.SELECTOR.MOBILE.2', () => {
  it.each(['match', 'penalty'])('swaps stacked cards and starts with the active kit in %s', (mode) => {
    const scene = attach(new TeamSelectScene());
    scene.init({ mode });
    scene.selectedTeamOne = 'Germany';
    scene.textures = { exists: () => true };
    scene.add.graphics = () => ({ fillStyle() {}, fillRoundedRect() {}, lineStyle() {}, strokeRoundedRect() {} });
    const cards: any[] = [];
    scene.add.container = (x: number, y: number) => {
      const card = { x, y, children: [] as any[], handler: null as any,
        add(child: any) { this.children.push(child); }, setAlpha: vi.fn(),
        setSize(width: number, height: number) { Object.assign(this, { width, height }); },
        setInteractive: vi.fn(), on(_event: string, handler: any) { this.handler = handler; } };
      cards.push(card); return card;
    };
    scene.add.image = (_x: number, _y: number, key: string) => ({ ...node(), key });
    const layout = createTeamScreenLayout({ mobileWide: true });
    scene.render = () => {
      cards.length = 0;
      scene.createTeamKitPreview(layout.team1KitPreviewRect, scene.getSelectedTeam(1), 1, true);
      scene.createTeamKitPreview(layout.team2KitPreviewRect, scene.getSelectedTeam(2), 2, true);
    };
    const tap = (card: any) => card.handler(null, 0, 0, { stopPropagation: vi.fn() });
    const key = (card: any) => card.children.find((child: any) => child.key)?.key;
    scene.render();
    expect(ui.buttons).toEqual([]);
    expect(cards.map(key)).toEqual(['kit-de-away', 'kit-de', 'kit-none', 'kit-es']);
    expect(cards[0].x - cards[1].x).toBe(cards[0].width / 2);
    expect(cards[2].x - cards[3].x).toBe(-cards[2].width / 2);
    expect(cards[0].y).toBe(cards[1].y);
    expect(cards[0].y - cards[1].y).toBeLessThan(cards[0].height);
    expect(cards[1].width).toBeGreaterThan(layout.team1KitPreviewRect.width);
    expect(cards[1].height).toBeGreaterThan(layout.team1KitPreviewRect.height);
    tap(cards[1]); expect(scene.fieldKits).toEqual({ 1: 'home', 2: 'home' });
    tap(cards[2]); expect(scene.fieldKits).toEqual({ 1: 'home', 2: 'home' });
    tap(cards[0]);
    expect(scene.fieldKits).toEqual({ 1: 'away', 2: 'home' });
    expect(cards.map(key).slice(0, 2)).toEqual(['kit-de', 'kit-de-away']);
    scene.startMatch();
    expect(scene.scene.start).toHaveBeenLastCalledWith(mode === 'match' ? 'GameScene' : 'TournamentPenaltyScene',
      expect.objectContaining(mode === 'match' ? { player1FieldKit: 'away', player2FieldKit: 'home' } : { fieldKits: { de: 'away', es: 'home' } }));
    tap(cards[0]);
    expect(scene.fieldKits[1]).toBe('home');
    expect(cards.map(key).slice(0, 2)).toEqual(['kit-de-away', 'kit-de']);
    // Existing image with no tournament colors stays manually selectable; a missing texture does not.
    scene.textures.exists = (key: string) => key !== 'kit-de-away';
    scene.render(); expect(key(cards[0])).toBe('kit-none');
    tap(cards[0]); expect(scene.fieldKits[1]).toBe('home');
    scene.textures.exists = () => true;
    scene.selectedTeamOne = 'France'; scene.selectedTeamTwo = 'Germany';
    scene.render(); tap(cards[2]);
    expect(scene.fieldKits).toEqual({ 1: 'home', 2: 'away' });
    expect(cards.map(key).slice(2)).toEqual(['kit-de', 'kit-de-away']);
    tap(cards[2]); expect(scene.fieldKits[2]).toBe('home');
  });
});

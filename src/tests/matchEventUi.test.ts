import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';

vi.mock('phaser', () => ({ default: { Scene: class {}, Math: { DegToRad: (degrees: number) => degrees * Math.PI / 180 },
  GameObjects: { Events: { DESTROY: 'destroy' }, Container: class extends EventEmitter {
  list: any[] = []; visible = true; depth = 0;
  constructor(public scene: any, public x = 0, public y = 0) { super(); }
  add(items: any) { this.list.push(...[items].flat()); return this; }
  setVisible(value: boolean) { this.visible = value; return this; }
  setDepth(depth: number) { this.depth = depth; return this; } setName() { return this; }
} } } }));

vi.mock('../ui/matchPauseOverlay', async (importOriginal) => {
  const module = await importOriginal<typeof import('../ui/matchPauseOverlay')>();
  return { ...module, createMatchPauseOverlay: vi.fn(() => new Node().setDepth(module.MATCH_OVERLAY_DEPTH)) };
});
vi.mock('../ui/MatchRulesOverlay', () => ({ createMatchRulesOverlay: vi.fn(() => new Node().setDepth(1000)) }));
vi.mock('../ui/matchRestartConfirmation', () => ({ createMatchRestartConfirmation: vi.fn(() => new Node().setDepth(1001)) }));

import { EventLogView, EVENT_LOG_DEPTH } from '../ui/EventLogView';
import { GameScene } from '../scenes/GameScene';
import { createMatchPauseOverlay, MATCH_OVERLAY_DEPTH } from '../ui/matchPauseOverlay';
import { createMatchRulesOverlay } from '../ui/MatchRulesOverlay';
import { createMatchRestartConfirmation } from '../ui/matchRestartConfirmation';
import { GameEngine } from '../game/GameEngine';
import { ScoreView } from '../ui/ScoreView';
import { EVENT_LOG_BOUNDS, EVENT_LOG_ROW_HEIGHT, EVENT_LOG_VIEWPORT_TOP, EVENT_LOG_VIEWPORT_HEIGHT,
  EVENT_LOG_CONTENT_INSET, EVENT_LOG_VISIBLE_CAPACITY, EVENT_LOG_OVERSCAN, EVENT_LOG_POOL_SIZE,
  formatMatchLogEntry } from '../ui/matchEventPresentation';
import { TOUCH_SCROLL_WHEEL_FACTOR } from '../ui/touchInput';
import type { MatchEventLogEntry } from '../game/MatchEventLog';

class Node extends EventEmitter {
  list: Node[] = []; visible = true; active = true; mask: unknown; input?: { enabled: boolean }; displayWidth = 0;
  depth = 0;
  destroy = vi.fn();
  data = new Map<string, unknown>();
  width = 0; height = 0; text = '';
  constructor(public x = 0, public y = 0, public style: any = {}) { super(); }
  setText(text: string) { this.text = text; const lineWidth = this.style.wordWrap?.width || Infinity;
    const lines = text.split('\n').reduce((total, line) => total + Math.max(1, Math.ceil(line.length * 10 / lineWidth)), 0);
    this.width = this.style.fixedWidth || Math.min(lineWidth, text.length * 10); this.displayWidth = this.width;
    this.height = this.style.fixedHeight || lines * 24; return this; }
  setX(x: number) { this.x = x; return this; }
  setDepth(depth: number) { this.depth = depth; return this; }
  setActive(v: boolean) { this.active = v; return this; }
  setData(key: string, value: unknown) { this.data.set(key, value); return this; }
  getData(key: string) { return this.data.get(key); }
  setOrigin() { return this; } setVisible(v: boolean) { this.visible = v; return this; }
  setStrokeStyle() { return this; } setInteractive() { this.input = { enabled: true }; return this; }
  disableInteractive() { if (this.input) this.input.enabled = false; return this; }
  setDisplaySize(w: number, h: number) { this.width = w; this.height = h; this.displayWidth = w; return this; }
  setMask(mask: unknown) { this.mask = mask; return this; }
  clearMask = vi.fn(() => this);
  add(nodes: Node[]) { this.list.push(...nodes); return this; }
}

function sceneMock() {
  const texts: Node[] = [], zones: Node[] = [], masks: any[] = [], containers: Node[] = [];
  const tweens: any[] = [];
  const scene = {
    input: new EventEmitter(), textures: { exists: () => true },
    add: { existing() {}, rectangle: (x: number, y: number) => new Node(x, y),
      container: (x: number, y: number) => { const node = new Node(x, y); containers.push(node); return node; },
      image: (x: number, y: number) => new Node(x, y),
      text: (x: number, y: number, text: string, style: any) => { const node = new Node(x, y, style).setText(text); texts.push(node); return node; },
      zone: (x: number, y: number) => { const node = new Node(x, y); zones.push(node); return node; } },
    make: { graphics: () => { const mask = { fillStyle() { return this; }, fillRect: vi.fn().mockReturnThis(),
      createGeometryMask() { return { graphics: this, destroy: vi.fn() }; }, setVisible() {}, destroy: vi.fn() }; masks.push(mask); return mask; } },
    tweens: { add: vi.fn((options: any) => { const tween = { options, remove: vi.fn() }; tweens.push(tween); return tween; }) }
  };
  return { scene: scene as unknown as Phaser.Scene, texts, zones, masks, containers, tweens, input: scene.input };
}

function entries(count: number): MatchEventLogEntry[] {
  return Array.from({ length: count }, (_, i) => ({ type: i % 2 ? 'SAVE' : 'SHOT', sequence: i + 1, turnNumber: i,
    moveNumber: Math.floor(i / 2) + 1,
    attacker: { rank: 'A', teamId: 'ua', shirtNumber: 17, playerName: 'Very Long\nActual Name' },
    goalkeeper: { rank: '9', teamId: 'tr', shirtNumber: 1, playerName: 'Very Long\r\nGoalkeeper Name' } }));
}

function diagnostics(view: EventLogView) {
  return view as unknown as { scrollY: number; maxScroll: number; events: readonly MatchEventLogEntry[]; rowsContainer: Node };
}

function visibleRows(view: EventLogView, rows: Node[]) {
  const parentY = diagnostics(view).rowsContainer.y;
  return rows.filter(row => row.visible && parentY + row.y + EVENT_LOG_ROW_HEIGHT > EVENT_LOG_VIEWPORT_TOP
    && parentY + row.y < EVENT_LOG_VIEWPORT_TOP + EVENT_LOG_VIEWPORT_HEIGHT).sort((a, b) => a.y - b.y);
}

function modalHarness(open = true) {
  const mock = sceneMock();
  const view = new EventLogView(mock.scene);
  const history = entries(200);
  view.refresh(history);
  if (open) {
    view.toggle();
    mock.zones[0].emit('pointerdown', { id: 0, worldY: 100 });
    mock.input.emit('pointermove', { id: 0, worldY: 100 + diagnostics(view).scrollY - 317 });
    mock.input.emit('pointerup');
  }
  const scene = Object.assign(Object.create(GameScene.prototype), mock.scene, {
    engine: new GameEngine(), eventLogView: view,
    pauseModal: null, infoModal: null, exitConfirmModal: null, matchFinishedModal: null,
    isSceneShutDown: false, isNavigationAwayInProgress: false, isMatchFinishedModalOpen: false,
    isGameplayReady: true, isInitialDealComplete: true, isAutomaticCardFlowInProgress: false,
    isAttackAnimationInProgress: false, isRestoreAnimationInProgress: false, isMatchEffectInProgress: false,
    matchMode: 'quick', tutorialController: null, tutorialOverlay: null, aiTurnController: null, message: null,
    activeInfoModal: null, infoLanguage: 'en',
    pauseAutomaticCardFlow: vi.fn(), resumeAutomaticCardFlow: vi.fn(), cancelAutomaticCardFlow: vi.fn(),
    refreshGameplayAfterBlockingModal: vi.fn(() => false),
    scene: { restart: vi.fn(), start: vi.fn() }, time: { removeAllEvents: vi.fn() },
    tweens: { ...mock.scene.tweens, killAll: vi.fn() },
    player1FieldKit: 'home', player2FieldKit: 'away', player1Name: 'Ukraine', player2Name: 'Poland',
    player1FlagCode: 'ua', player2FlagCode: 'pl', player1ControllerType: 'HUMAN', player2ControllerType: 'HUMAN'
  }) as Record<string, any>;
  scene.input.enabled = true;
  return { ...mock, view, history, game: scene };
}

describe('MATCH.EVENT.LOG.1.3 modal layering and isolation', () => {
  it('keeps the log above gameplay and below modal roots, including their dim children', () => {
    const { view, game } = modalHarness();
    expect(view.depth).toBe(EVENT_LOG_DEPTH);
    expect(view.depth).toBeGreaterThan(900);
    expect(view.depth).toBeLessThan(MATCH_OVERLAY_DEPTH);
    game.openPauseModal(game.engine.getState());
    expect(view.depth).toBeLessThan(game.pauseModal.depth);
    game.closePauseModal();
    game.openMatchInfoModal('rules');
    expect(view.depth).toBeLessThan(game.infoModal.depth);
  });

  it.each(['pause', 'rules'] as const)('locks %s drag, wheel and score toggle while preserving an open log', (kind) => {
    const { view, zones, input, game, history, texts, containers, masks } = modalHarness();
    const zone = zones[0], state = diagnostics(view);
    const originalRows = [...texts], originalContainerY = state.rowsContainer.y;
    const rowChanges = texts.map(row => vi.spyOn(row, 'setText'));
    zone.emit('pointerdown', { id: 1, worldY: 300 });
    if (kind === 'pause') game.openPauseModal(game.engine.getState());
    else game.openMatchInfoModal('rules');
    expect(zone.input?.enabled).toBe(false);
    expect(view.visible).toBe(true);
    input.emit('pointermove', { id: 1, worldY: 500 });
    zone.emit('pointerdown', { id: 2, worldY: 200 });
    input.emit('pointermove', { id: 2, worldY: 600 });
    zone.emit('wheel', {}, 0, 100000);
    game.toggleEventLog();
    view.toggle();
    expect(state.scrollY).toBe(317);
    expect(state.rowsContainer.y).toBe(originalContainerY);
    expect(view.visible).toBe(true);
    expect(state.events).toBe(history);
    expect(rowChanges.every(spy => spy.mock.calls.length === 0)).toBe(true);
    if (kind === 'pause') {
      const actions = vi.mocked(createMatchPauseOverlay).mock.calls.at(-1)![1];
      actions.find(action => action.label === 'Continue')!.onClick();
    } else vi.mocked(createMatchRulesOverlay).mock.calls.at(-1)![0].onClose();
    expect(view.visible).toBe(true);
    expect(state.scrollY).toBe(317);
    expect(state.events).toBe(history);
    expect(zone.input?.enabled).toBe(true);
    expect(game.eventLogView).toBe(view);
    expect(texts).toEqual(originalRows);
    expect(containers).toHaveLength(1);
    expect(masks).toHaveLength(1);
    expect(rowChanges.every(spy => spy.mock.calls.length === 0)).toBe(true);
    // A drag started before the modal cannot resume behind it after Continue/Back.
    input.emit('pointermove', { id: 1, worldY: 500 });
    expect(state.scrollY).toBe(317);
    zone.emit('wheel', {}, 0, 10);
    expect(state.scrollY).toBe(320.5);
  });

  it.each(['pause', 'rules'] as const)('keeps a closed log closed across %s and restores only its input eligibility', (kind) => {
    const { view, game, zones } = modalHarness(false);
    if (kind === 'pause') game.openPauseModal(game.engine.getState());
    else game.openMatchInfoModal('rules');
    game.toggleEventLog();
    expect(view.visible).toBe(false);
    if (kind === 'pause') game.closePauseModal();
    else game.closeMatchInfoModal();
    expect(view.visible).toBe(false);
    expect(zones[0].input?.enabled).toBe(false);
    game.toggleEventLog();
    expect(view.visible).toBe(true);
    expect(zones[0].input?.enabled).toBe(true);
  });

  it('keeps the lock through Pause -> Restart confirmation, then preserves state on Cancel', () => {
    const { game, view, zones, history } = modalHarness();
    game.openPauseModal(game.engine.getState());
    vi.mocked(createMatchPauseOverlay).mock.calls.at(-1)![1].find(action => action.label === 'Restart')!.onClick();
    expect(game.pauseModal).toBeNull();
    expect(game.exitConfirmModal.depth).toBeGreaterThan(view.depth);
    expect(zones[0].input?.enabled).toBe(false);
    game.toggleEventLog();
    expect(view.visible).toBe(true);
    vi.mocked(createMatchRestartConfirmation).mock.calls.at(-1)![1]();
    expect(game.exitConfirmModal).toBeNull();
    expect(zones[0].input?.enabled).toBe(true);
    expect(diagnostics(view)).toMatchObject({ scrollY: 317, events: history });
    expect(game.scene.restart).not.toHaveBeenCalled();
  });

  it('preserves Restart navigation and its new-session lifecycle, keeping the old log locked during exit', () => {
    const { game, view, zones } = modalHarness();
    game.openPauseModal(game.engine.getState());
    game.openRestartConfirmation();
    vi.mocked(createMatchRestartConfirmation).mock.calls.at(-1)![2]();
    expect(game.scene.restart).toHaveBeenCalledWith(expect.objectContaining({
      player1FlagCode: 'ua', player2FlagCode: 'pl', player1FieldKit: 'home', player2FieldKit: 'away'
    }));
    expect(game.isNavigationAwayInProgress).toBe(true);
    expect(game.time.removeAllEvents).toHaveBeenCalledOnce();
    expect(game.tweens.killAll).toHaveBeenCalledOnce();
    expect(zones[0].input?.enabled).toBe(false);
    game.toggleEventLog();
    expect(view.visible).toBe(true);
  });

  it('does not unlock an open log while another modal is still active', () => {
    const { game, zones, view } = modalHarness();
    game.openPauseModal(game.engine.getState());
    const pause = game.pauseModal;
    game.openMatchInfoModal('rules');
    expect(game.infoModal).toBeNull();
    expect(game.pauseModal).toBe(pause);
    game.closeMatchInfoModal();
    expect(zones[0].input?.enabled).toBe(false);
    expect(view.visible).toBe(true);
    game.closePauseModal();
    expect(zones[0].input?.enabled).toBe(true);
  });

  it('retains history and scroll when switching the Rules language', () => {
    const { game, view, zones, history } = modalHarness();
    game.openMatchInfoModal('rules');
    vi.mocked(createMatchRulesOverlay).mock.calls.at(-1)![0].onLanguageChange('pl');
    expect(game.infoLanguage).toBe('pl');
    expect(zones[0].input?.enabled).toBe(false);
    expect(diagnostics(view)).toMatchObject({ scrollY: 317, events: history });
    game.closeMatchInfoModal();
    expect(zones[0].input?.enabled).toBe(true);
    expect(view.visible).toBe(true);
  });

  it('handles shutdown after Phaser has already destroyed the log display objects', () => {
    const { view, game, zones } = modalHarness();
    const disable = vi.spyOn(zones[0], 'disableInteractive');
    const enable = vi.spyOn(zones[0], 'setInteractive');
    // GameObject.destroy clears scene before later GameScene shutdown listeners.
    Reflect.set(view, 'scene', undefined);
    game.isSceneShutDown = true;
    expect(() => game.syncEventLogInput()).not.toThrow();
    expect(disable).not.toHaveBeenCalled();
    expect(enable).not.toHaveBeenCalled();
    view.toggle();
    expect(view.visible).toBe(true);
  });
});

describe('scoreboard and diagnostic overlay interaction', () => {
  it('uses a normal score tap to toggle the overlay and has no pause side effect', () => {
    const { scene, texts } = sceneMock();
    const overlay = new EventLogView(scene);
    new ScoreView(scene, 800, 42, 'Ukraine', 'Turkey', 'ua', 'tr', 0, 0, { onScoreTap: () => overlay.toggle() });
    const score = texts.find(n => n.text === '0:0')!;
    expect(score.input).toBeDefined();
    expect(overlay.visible).toBe(false);
    score.emit('pointerdown'); expect(overlay.visible).toBe(true);
    score.emit('pointerdown'); expect(overlay.visible).toBe(false);
  });

  it('clips the ticker strictly inside the context block, runs only overflow, and removes a replaced tween', () => {
    const { scene, texts, masks, tweens } = sceneMock();
    const score = new ScoreView(scene, 800, 42, 'Ukraine', 'Turkey', 'ua', 'tr', 0, 0, { matchContext: 'SHOT!!' });
    expect(tweens).toHaveLength(0);
    expect(masks[0].fillRect).toHaveBeenCalledWith(252, 13, 276, 58);
    for (const message of ['GOALKEEPER!!', 'OFF THE POST!!', 'QUICK MATCH']) score.setContext(message);
    expect(tweens).toHaveLength(0);
    score.setContext('GOAL!! #17 A Very Long Actual Player Name');
    expect(tweens).toHaveLength(1);
    expect(tweens[0].options.repeat).toBe(-1);
    expect(tweens[0].options.targets).toHaveLength(2);
    const messages = texts.filter(n => n.text.startsWith('GOAL'));
    expect(messages).toHaveLength(2);
    expect(messages.every(n => (n.mask as any).graphics === masks[0])).toBe(true);
    score.setContext('GOALKEEPER!!');
    expect(tweens[0].remove).toHaveBeenCalledOnce();
    expect(messages[1].visible).toBe(false);
    expect(tweens).toHaveLength(1);
  });

  it('uses a clipped field-center panel that avoids the scoreboard and midfielder cards', () => {
    const { scene, texts, masks, containers } = sceneMock();
    const overlay = new EventLogView(scene);
    overlay.refresh(entries(10)); overlay.toggle();
    const b = EVENT_LOG_BOUNDS;
    expect(masks[0].fillRect).toHaveBeenCalledWith(b.x + EVENT_LOG_CONTENT_INSET, b.y + EVENT_LOG_VIEWPORT_TOP,
      b.width - EVENT_LOG_CONTENT_INSET * 2, EVENT_LOG_VIEWPORT_HEIGHT);
    expect((containers[0].mask as any).graphics).toBe(masks[0]);
    expect(texts.every(row => row.mask === undefined && row.text !== 'MATCH EVENT LOG')).toBe(true);
    expect(containers[0].y + texts[0].y).toBe(10);
    expect(EVENT_LOG_VIEWPORT_HEIGHT).toBe(500);
    expect(b.width).toBeLessThan(280);
    expect((280 - b.width) / 280).toBeCloseTo(0.15);
    expect(b.x + b.width / 2).toBe(800);
    expect(b.y).toBeGreaterThan(100);
    expect(b.x).toBeGreaterThan(800 - 205 + 108 * 1.12 / 2);
    expect(b.x + b.width).toBeLessThan(800 + 205 - 108 * 1.12 / 2);
    expect(b.y + b.height).toBeLessThanOrEqual(700);
  });

  it('touch-drags to the oldest entry, preserves history position on append, follows bottom, and reopens at latest', () => {
    const { scene, texts, zones, input } = sceneMock();
    const overlay = new EventLogView(scene);
    const history = entries(62);
    overlay.refresh(history.slice(0, 60), 'QUICK MATCH'); overlay.toggle();
    const rows = texts;
    const visible = () => visibleRows(overlay, rows);
    expect(visible().at(-1)?.text).toBe('#30 SAVE A ← GK 9');
    zones[0].emit('pointerdown', { id: 1, worldY: 200 });
    input.emit('pointermove', { id: 1, worldY: 5000 }); input.emit('pointerup');
    expect(visible()[0].text).toBe('#1 SHOT A → GK 9');
    expect(visible()[0].y + diagnostics(overlay).rowsContainer.y).toBe(EVENT_LOG_VIEWPORT_TOP);
    overlay.refresh(history.slice(0, 61), 'QUICK MATCH'); expect(diagnostics(overlay).scrollY).toBe(0);
    zones[0].emit('wheel', {}, 0, 100000);
    overlay.refresh(history, 'QUICK MATCH'); expect(visible().at(-1)?.text).toBe('#31 SAVE A ← GK 9');
    zones[0].emit('wheel', {}, 0, -100000); expect(diagnostics(overlay).scrollY).toBe(0);
    overlay.toggle(); overlay.toggle(); expect(visible().at(-1)?.text).toBe('#31 SAVE A ← GK 9');
  });

  it.each([10, 20, 50, 100, 200, 300, 400, 402])('retains all %s events with fixed geometry and bounded row textures', count => {
    const { scene, texts, zones } = sceneMock();
    const overlay = new EventLogView(scene);
    const history = entries(count);
    overlay.refresh(history, 'QUICK MATCH'); overlay.toggle();
    const rows = texts, state = diagnostics(overlay);
    expect(state.events).toHaveLength(count);
    expect(state.maxScroll).toBe(Math.max(0, count * EVENT_LOG_ROW_HEIGHT - EVENT_LOG_VIEWPORT_HEIGHT));
    expect(state.scrollY).toBe(state.maxScroll);
    const last = visibleRows(overlay, rows).at(-1)!;
    expect(last.text).toBe(formatMatchLogEntry(history[count - 1]));
    expect(last.y + state.rowsContainer.y).toBe(EVENT_LOG_VIEWPORT_TOP + (count - 1) * EVENT_LOG_ROW_HEIGHT - state.maxScroll);
    expect(last.y + state.rowsContainer.y + EVENT_LOG_ROW_HEIGHT).toBeLessThanOrEqual(EVENT_LOG_VIEWPORT_TOP + EVENT_LOG_VIEWPORT_HEIGHT);
    zones[0].emit('wheel', {}, 0, -100000);
    expect(rows[0]).toMatchObject({ text: '#1 SHOT A → GK 9', y: 0 });
    expect(state.rowsContainer.y).toBe(EVENT_LOG_VIEWPORT_TOP);
    // Visit every event, including those outside the pool, to prove virtualization loses no history.
    for (let index = 0; index < count; index++) {
      const next = Math.min(index * EVENT_LOG_ROW_HEIGHT, state.maxScroll);
      zones[0].emit('wheel', {}, 0, (next - state.scrollY) / TOUCH_SCROLL_WHEEL_FACTOR);
      expect(visibleRows(overlay, rows).some(row => row.text === formatMatchLogEntry(history[index]))).toBe(true);
      expect(rows.every(row => row.height === EVENT_LOG_ROW_HEIGHT && !/[\r\n]/.test(row.text))).toBe(true);
    }
    expect(rows).toHaveLength(EVENT_LOG_VISIBLE_CAPACITY + EVENT_LOG_OVERSCAN * 2);
    expect(rows.every(row => row.style.wordWrap.width === 0 && row.width === EVENT_LOG_BOUNDS.width - EVENT_LOG_CONTENT_INSET * 2)).toBe(true);
    expect(rows.some(row => row.text === 'MATCH EVENT LOG')).toBe(false);
    expect([overlay.x, overlay.y]).toEqual([EVENT_LOG_BOUNDS.x, EVENT_LOG_BOUNDS.y]);
    expect(EVENT_LOG_BOUNDS).toMatchObject({ width: 238, height: 520 });
  });

  it('clips horizontal overflow without wrapping or changing row geometry', () => {
    const { scene, texts } = sceneMock();
    const overlay = new EventLogView(scene);
    const event: MatchEventLogEntry = { type: 'FAILED', sequence: 1, moveNumber: 1, turnNumber: 1,
      attacker: { rank: 'unexpected-rank'.repeat(40), teamId: 'ua' } };
    overlay.refresh([event]); overlay.toggle();
    const row = texts[0];
    expect(row.text.length * 10).toBeGreaterThan(row.width);
    expect(row.width).toBe(228);
    expect(row.height).toBe(24);
    expect(diagnostics(overlay).rowsContainer.mask).toBeDefined();
    expect(row.mask).toBeUndefined();
    expect(row.style.wordWrap.width).toBe(0);
  });

  it('reuses the same row, container and mask objects from 10 to 402 events and across toggles', () => {
    const { scene, texts, containers, masks, zones } = sceneMock();
    const overlay = new EventLogView(scene), history = entries(402);
    overlay.refresh(history.slice(0, 10)); overlay.toggle();
    const originalRows = [...texts], originalMask = containers[0].mask;
    overlay.refresh(history);
    for (let i = 0; i < 10; i++) { overlay.toggle(); overlay.toggle(); }
    expect(texts).toEqual(originalRows);
    expect(texts).toHaveLength(EVENT_LOG_POOL_SIZE);
    expect(containers).toHaveLength(1);
    expect(masks).toHaveLength(1);
    expect(zones).toHaveLength(1);
    expect(containers[0].mask).toBe(originalMask);
    expect(texts.every(row => row.mask === undefined)).toBe(true);
  });

  it.each([0, 201 * 24, 402 * 24 - EVENT_LOG_VIEWPORT_HEIGHT])('maps the correct contiguous 402-event slice at scroll %s', scroll => {
    const { scene, texts, zones } = sceneMock();
    const overlay = new EventLogView(scene), history = entries(402);
    overlay.refresh(history); overlay.toggle();
    zones[0].emit('wheel', {}, 0, (scroll - diagnostics(overlay).scrollY) / TOUCH_SCROLL_WHEEL_FACTOR);
    const rows = visibleRows(overlay, texts), current = diagnostics(overlay).scrollY;
    const first = Math.floor(current / EVENT_LOG_ROW_HEIGHT);
    const end = Math.min(history.length, Math.ceil((current + EVENT_LOG_VIEWPORT_HEIGHT) / EVENT_LOG_ROW_HEIGHT));
    expect(rows.map(row => row.getData('eventIndex'))).toEqual(Array.from({ length: end - first }, (_, i) => first + i));
    for (const row of rows) expect(row.text).toBe(formatMatchLogEntry(history[row.getData('eventIndex') as number]));
    expect(new Set(rows.map(row => row.getData('eventIndex'))).size).toBe(rows.length);
  });

  it('appends at bottom without creating objects and reveals the new last entry', () => {
    const { scene, texts } = sceneMock();
    const overlay = new EventLogView(scene), history = entries(402);
    overlay.refresh(history); overlay.toggle();
    const oldMax = diagnostics(overlay).maxScroll, originalRows = [...texts];
    history.push({ type: 'MATCH_END', sequence: 403, turnNumber: 200, moveNumber: 200, score: [1, 0] });
    overlay.refresh(history);
    expect(diagnostics(overlay).events).toHaveLength(403);
    expect(diagnostics(overlay).maxScroll).toBe(oldMax + 24);
    expect(diagnostics(overlay).scrollY).toBe(diagnostics(overlay).maxScroll);
    expect(visibleRows(overlay, texts).at(-1)?.text).toBe('#200 MATCH END 1:0');
    expect(texts).toEqual(originalRows);
  });

  it('follows append within 32px of bottom', () => {
    const { scene, texts, zones } = sceneMock();
    const overlay = new EventLogView(scene), history = entries(402);
    overlay.refresh(history); overlay.toggle();
    zones[0].emit('wheel', {}, 0, -20 / TOUCH_SCROLL_WHEEL_FACTOR);
    history.push({ type: 'TURN', sequence: 403, turnNumber: 200, moveNumber: 200, fromTeamId: 'ua', toTeamId: 'tr' });
    overlay.refresh(history);
    expect(diagnostics(overlay).scrollY).toBe(diagnostics(overlay).maxScroll);
    expect(visibleRows(overlay, texts).at(-1)?.text).toBe('#200 TURN');
  });

  it('keeps the viewed slice and untouched textures on append while scrolled up', () => {
    const { scene, texts, zones } = sceneMock();
    const overlay = new EventLogView(scene), history = entries(402);
    overlay.refresh(history); overlay.toggle();
    zones[0].emit('wheel', {}, 0, -100000);
    const oldSlice = visibleRows(overlay, texts).map(row => row.text);
    const calls = texts.map(row => vi.spyOn(row, 'setText'));
    history.push({ type: 'MATCH_END', sequence: 403, turnNumber: 200, moveNumber: 200, score: [1, 0] });
    overlay.refresh(history);
    expect(diagnostics(overlay).scrollY).toBe(0);
    expect(visibleRows(overlay, texts).map(row => row.text)).toEqual(oldSlice);
    expect(calls.every(call => call.mock.calls.length === 0)).toBe(true);
    expect(texts).toHaveLength(EVENT_LOG_POOL_SIZE);
    zones[0].emit('wheel', {}, 0, 100000);
    expect(visibleRows(overlay, texts).at(-1)?.text).toBe('#200 MATCH END 1:0');
  });

  it('captures 50 closed-panel appends with zero visual refresh, disabled input, and shows latest on reopen', () => {
    const { scene, texts, zones, input, containers } = sceneMock();
    const overlay = new EventLogView(scene), history = entries(10), more = entries(60).slice(10);
    overlay.refresh(history); overlay.toggle(); overlay.toggle();
    const calls = texts.map(row => vi.spyOn(row, 'setText'));
    const refresh = vi.spyOn(overlay as any, 'refreshRows');
    for (const event of more) { history.push(event); overlay.refresh(history); }
    expect(diagnostics(overlay).events).toHaveLength(60);
    expect(refresh).not.toHaveBeenCalled();
    expect(calls.every(call => call.mock.calls.length === 0)).toBe(true);
    expect(containers[0]).toMatchObject({ visible: false, active: false });
    expect(zones[0].input?.enabled).toBe(false);
    const before = diagnostics(overlay).scrollY;
    zones[0].emit('wheel', {}, 0, -100000);
    zones[0].emit('pointerdown', { id: 1, worldY: 200 });
    input.emit('pointermove', { id: 1, worldY: 5000 }); input.emit('pointerup');
    expect(diagnostics(overlay).scrollY).toBe(before);
    overlay.toggle();
    expect(refresh).toHaveBeenCalledOnce();
    expect(visibleRows(overlay, texts).at(-1)?.text).toBe('#30 SAVE A ← GK 9');
    expect(zones[0].input?.enabled).toBe(true);
    expect(containers[0]).toMatchObject({ visible: true, active: true });
    expect(texts).toHaveLength(EVENT_LOG_POOL_SIZE);
  });

  it('performs no visual work for unchanged per-frame refresh or a no-op wheel event', () => {
    const { scene, texts, zones } = sceneMock();
    const overlay = new EventLogView(scene), history = entries(402);
    overlay.refresh(history); overlay.toggle();
    const refresh = vi.spyOn(overlay as any, 'refreshRows');
    const calls = texts.map(row => vi.spyOn(row, 'setText'));
    for (let i = 0; i < 120; i++) overlay.refresh(history);
    zones[0].emit('wheel', {}, 0, 0);
    zones[0].emit('wheel', {}, 0, 100000);
    expect(refresh).not.toHaveBeenCalled();
    expect(calls.every(call => call.mock.calls.length === 0)).toBe(true);
  });

  it('moves only the container within one index and rebinds only one entering ring row at an index crossing', () => {
    const { scene, texts, zones } = sceneMock();
    const overlay = new EventLogView(scene), history = entries(402);
    overlay.refresh(history); overlay.toggle();
    zones[0].emit('wheel', {}, 0, -100000);
    zones[0].emit('pointerdown', { id: 1, worldY: 200 });
    // Each touch position below is relative to the same gesture's original scroll of zero.
    const input = (scene as any).input as EventEmitter;
    input.emit('pointermove', { id: 1, worldY: 100 });
    const refresh = vi.spyOn(overlay as any, 'refreshRows');
    const calls = texts.map(row => vi.spyOn(row, 'setText'));
    const dataCalls = texts.map(row => vi.spyOn(row, 'setData'));
    const oldPositions = texts.map(row => row.y), oldContainerY = diagnostics(overlay).rowsContainer.y;
    input.emit('pointermove', { id: 1, worldY: 99 });
    expect(diagnostics(overlay).rowsContainer.y).toBe(oldContainerY - 1);
    expect(texts.map(row => row.y)).toEqual(oldPositions);
    expect(refresh).not.toHaveBeenCalled();
    expect(calls.every(call => call.mock.calls.length === 0)).toBe(true);
    input.emit('pointermove', { id: 1, worldY: 80 });
    expect(refresh).toHaveBeenCalledOnce();
    expect(calls.reduce((sum, call) => sum + call.mock.calls.length, 0)).toBe(1);
    expect(dataCalls.reduce((sum, call) => sum + call.mock.calls.length, 0)).toBe(1);
    expect(texts).toHaveLength(EVENT_LOG_POOL_SIZE);
  });

  it('clears cached row bindings on log reset, including replacement by a same-length session', () => {
    const { scene, texts } = sceneMock();
    const overlay = new EventLogView(scene);
    overlay.refresh(entries(10)); overlay.toggle();
    const replacement = entries(10).map(event => 'attacker' in event ? { ...event, attacker: { ...event.attacker, rank: '2' } } : event);
    overlay.refresh(replacement);
    expect(visibleRows(overlay, texts)[0].text).toBe('#1 SHOT 2 → GK 9');
    overlay.refresh([]);
    expect(diagnostics(overlay)).toMatchObject({ scrollY: 0, maxScroll: 0, events: [] });
    expect(texts.every(row => !row.visible && row.text === '')).toBe(true);
    overlay.refresh(entries(402));
    expect(visibleRows(overlay, texts).at(-1)?.text).toBe('#201 SAVE A ← GK 9');
    expect(texts).toHaveLength(EVENT_LOG_POOL_SIZE);
  });

  it('removes global pointer listeners and its clipping graphics when destroyed', () => {
    const { scene, masks, input } = sceneMock();
    const overlay = new EventLogView(scene);
    expect(input.listenerCount('pointermove')).toBe(1);
    overlay.emit('destroy');
    expect(input.listenerCount('pointermove')).toBe(0);
    expect(input.listenerCount('pointerup')).toBe(0);
    expect(masks[0].destroy).toHaveBeenCalledOnce();
  });
});

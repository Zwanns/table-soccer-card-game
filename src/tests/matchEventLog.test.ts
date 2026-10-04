import { describe, expect, it } from 'vitest';
import { GameEngine } from '../game/GameEngine';
import { createEmptyField } from '../game/PlayerField';
import type { Card, CardRank, GoalkeeperCard } from '../cards';
import { MatchEventLog, type MatchEventLogEntry } from '../game/MatchEventLog';
import { formatMatchLogEntry, getTickerLayout, getTooltipPosition, ScoreboardEventDisplay,
  SCOREBOARD_EVENT_DURATION_MS, SCOREBOARD_GOAL_DURATION_MS } from '../ui/matchEventPresentation';
import { getCardRankDisplayLabel } from '../ui/kitCardFaceModel';

const card = (rank: CardRank): Card => ({ id: `attack-${rank}`, rank, color: 'RED', suit: 'HEARTS' });
const goalkeeper = (rank: GoalkeeperCard['rank']): GoalkeeperCard => ({ id: `gk-${rank}`, rank, kind: 'goalkeeper' });

function ready(rank: CardRank, target: CardRank | GoalkeeperCard['rank'], gk = false, limit = 200) {
  const engine = new GameEngine();
  const state = engine.startNewGame({ seed: 'event-log', player1FlagCode: 'ua', player2FlagCode: 'tr', matchStepLimit: limit });
  engine.startNextTurn();
  state.activePlayerId = 'PLAYER_1';
  state.players[0].deck.cards = [card(rank), card('K')];
  state.players[1].field = createEmptyField();
  if (gk) state.players[1].field.goalkeeper = goalkeeper(target as GoalkeeperCard['rank']);
  else state.players[1].field['defender-1'] = card(target as CardRank);
  engine.drawAttackCard();
  engine.selectTarget(gk ? 'goalkeeper' : 'defender-1');
  return { engine, state, events: engine.getEventLog() };
}

describe('structured match diagnostics', () => {
  it('starts every new match at sequence one and resets on replay/restart', () => {
    const { engine, events } = ready('A', '3');
    expect(events[0]).toMatchObject({ type: 'MATCH_START', sequence: 1, teams: ['ua', 'tr'] });
    expect(events.map(e => e.sequence)).toEqual(events.map((_, i) => i + 1));
    engine.startNewGame({ seed: 'restart' });
    expect(engine.getEventLog()).toEqual([expect.objectContaining({ type: 'MATCH_START', sequence: 1 })]);
    expect(events.length).toBeGreaterThan(1);
  });

  it.each([['A', '3', 'BEAT'], ['3', 'A', 'FAILED']] as const)('records the actual %s vs %s field duel as %s', (a, d, type) => {
    const { state, events } = ready(a, d);
    const event = events.find(e => e.type === type);
    expect(event).toMatchObject({ type, positionId: 'defender-1', attacker: {
      teamId: 'ua', rank: a, shirtNumber: state.matchSetups.PLAYER_1.squad.fieldPlayers[a].shirtNumber,
      playerName: state.matchSetups.PLAYER_1.squad.fieldPlayers[a].name
    }, defender: { teamId: 'tr', rank: d, shirtNumber: state.matchSetups.PLAYER_2.squad.fieldPlayers[d].shirtNumber } });
  });

  it('records a turn transition with both teams', () => {
    expect(ready('3', 'A').events.at(-1)).toMatchObject({ type: 'TURN', fromTeamId: 'ua', toTeamId: 'tr' });
  });

  it.each([['3', 'A', 'SAVE'], ['8', '8', 'POST'], ['A', '3', 'GOAL']] as const)('records shot %s vs goalkeeper %s followed by %s', (a, g, outcome) => {
    const { state, events } = ready(a, g, true);
    const shotIndex = events.findIndex(e => e.type === 'SHOT');
    expect(shotIndex).toBeGreaterThan(0);
    expect(events[shotIndex]).toMatchObject({ type: 'SHOT', attacker: { teamId: 'ua', rank: a },
      goalkeeper: { teamId: 'tr', rank: g, shirtNumber: state.matchSetups.PLAYER_2.squad.goalkeeper.shirtNumber,
        playerName: state.matchSetups.PLAYER_2.squad.goalkeeper.name } });
    expect(events.slice(shotIndex + 1).some(e => e.type === outcome)).toBe(true);
    if (outcome === 'GOAL') {
      const goal = events.find(e => e.type === 'GOAL')!;
      expect(goal).toMatchObject({ score: [1, 0], attacker: {
        shirtNumber: state.matchSetups.PLAYER_1.squad.fieldPlayers.A.shirtNumber,
        playerName: state.matchSetups.PLAYER_1.squad.fieldPlayers.A.name
      } });
      expect(formatMatchLogEntry(goal, 'QUICK MATCH')).toBe(`#${state.matchStepCount} GOAL A`);
    }
  });

  it('captures final score after the completing action', () => {
    expect(ready('A', '3', true, 1).events.at(-1)).toMatchObject({ type: 'MATCH_END', score: [1, 0] });
  });

  it('holds immutable identities and scores even when cards and state later change', () => {
    const { events, state } = ready('A', '3', true);
    const shot = events.find(e => e.type === 'SHOT')!;
    const snapshot = structuredClone(events);
    state.players[0].goals = 9;
    state.matchSetups.PLAYER_1.squad.fieldPlayers.A.name = 'Changed';
    state.players[0].deck.cards[0].rank = '2';
    expect(events).toEqual(snapshot);
    expect(Object.isFrozen(shot)).toBe(true);
    if ('attacker' in shot) expect(Object.isFrozen(shot.attacker)).toBe(true);
  });

  it('does not invent a defending card for an attack without a target', () => {
    const state = new GameEngine().startNewGame({ seed: 'no-target' });
    const log = new MatchEventLog();
    state.activePlayerId = 'PLAYER_1';
    log.observe({ type: 'ATTACK_MISSED', card: card('3') }, state);
    expect(log.getEntries()[0]).toMatchObject({ type: 'FAILED', attacker: { teamId: 'fr' } });
    expect(log.getEntries()[0]).not.toHaveProperty('defender');
  });

  it('observing diagnostics throughout a complete seeded match has identical gameplay and stats', () => {
    const engines = [new GameEngine(), new GameEngine()];
    engines.forEach(engine => engine.startNewGame({ seed: 'closed-open-log' }));
    const display = new ScoreboardEventDisplay(() => 0);
    let steps = 0;
    while (engines[0].getState().phase !== 'GAME_OVER' && steps++ < 5000) {
      for (const engine of engines) {
        const state = engine.getState();
        if (state.phase === 'ENDING_TURN') engine.startNextTurn();
        else if (state.phase === 'WAITING_FOR_ATTACK_CARD') engine.drawAttackCard();
        else if (state.phase === 'WAITING_FOR_TARGET') engine.selectTarget(engine.getLegalTargets()[0]);
        else throw new Error(`Unexpected phase ${state.phase}`);
      }
      engines[0].getEventLog().forEach(event => { formatMatchLogEntry(event, 'QUICK MATCH'); display.observe(event); });
      expect(engines[0].getState()).toEqual(engines[1].getState());
    }
    expect(engines[0].getState().phase).toBe('GAME_OVER');
    expect(engines[0].getEventLog().at(-1)?.type).toBe('MATCH_END');
  });
});

const identity = (rank: string) => ({ rank, teamId: 'ua', shirtNumber: 17, playerName: 'Long Player Name', playerId: 'actual-player' });
const stamp = { sequence: 999, turnNumber: 4 };
const compactCases: [MatchEventLogEntry, string][] = [
  [{ ...stamp, moveNumber: 2, type: 'BEAT', attacker: identity('Q'), defender: identity('10') }, '#2 BEAT Q → 10'],
  [{ ...stamp, moveNumber: 3, type: 'BEAT', attacker: identity('5'), defender: identity('2') }, '#3 BEAT 5 → 2'],
  [{ ...stamp, moveNumber: 4, type: 'BEAT', attacker: identity('9'), defender: identity('J') }, '#4 BEAT 9 → V'],
  [{ ...stamp, moveNumber: 5, type: 'FAILED', attacker: identity('7'), defender: identity('8') }, '#5 FAIL 7 ← 8'],
  [{ ...stamp, moveNumber: 37, type: 'SHOT', attacker: identity('A'), goalkeeper: identity('9') }, '#37 SHOT A → GK 9'],
  [{ ...stamp, moveNumber: 37, type: 'SAVE', attacker: identity('A'), goalkeeper: identity('9') }, '#37 SAVE A ← GK 9'],
  [{ ...stamp, moveNumber: 42, type: 'POST', attacker: identity('K'), goalkeeper: identity('9') }, '#42 POST K'],
  [{ ...stamp, moveNumber: 95, type: 'GOAL', attacker: identity('Q'), score: [1, 0] }, '#95 GOAL Q'],
  [{ ...stamp, moveNumber: 28, type: 'TURN', fromTeamId: 'ua', toTeamId: 'tr' }, '#28 TURN'],
  [{ ...stamp, moveNumber: 0, type: 'MATCH_START', teams: ['ua', 'tr'] }, '#0 MATCH START'],
  [{ ...stamp, moveNumber: 107, type: 'MATCH_END', score: [1, 0] }, '#107 MATCH END 1:0'],
  [{ ...stamp, moveNumber: 6, type: 'FAILED', attacker: identity('3') }, '#6 FAIL 3']
];

describe('compact one-line match presentation', () => {
  it.each(compactCases)('formats %j exactly as %s without exposing identities, context or sequence', (event, expected) => {
    const snapshot = structuredClone(event);
    const text = formatMatchLogEntry(event, 'CUP XL /\nGROUP B');
    expect(text).toBe(expected);
    expect(text).not.toMatch(/[\r\n]/);
    expect(text).not.toMatch(/ua|tr|Long Player|#17|actual-player|CUP|999/);
    expect(event).toEqual(snapshot);
  });

  it.each(['2', '10', 'J', 'Q', 'K', 'A', 'JOKER'])('uses the card UI canonical label for %s', rank => {
    expect(formatMatchLogEntry({ ...stamp, moveNumber: 1, type: 'GOAL', attacker: identity(rank), score: [1, 0] }))
      .toBe(`#1 GOAL ${getCardRankDisplayLabel(rank)}`);
  });

  it('removes line breaks defensively even from malformed ranks', () => {
    expect(formatMatchLogEntry({ ...stamp, moveNumber: 1, type: 'FAILED', attacker: identity('7\r\n') })).toBe('#1 FAIL 7');
  });

  it('keeps multiple events at the actual engine move number while sequence increments', () => {
    const { events, state } = ready('3', 'A', true);
    const shot = events.find(e => e.type === 'SHOT')!;
    const save = events.find(e => e.type === 'SAVE')!;
    expect(shot.moveNumber).toBe(state.matchStepCount);
    expect(save.moveNumber).toBe(shot.moveNumber);
    expect(save.sequence).toBeGreaterThan(shot.sequence);
    expect(formatMatchLogEntry(shot)).toBe(`#${state.matchStepCount} SHOT 3 → GK A`);
    expect(formatMatchLogEntry(save)).toBe(`#${state.matchStepCount} SAVE 3 ← GK A`);
  });
});

describe('scoreboard notifications with an injected clock', () => {
  it.each(['SHOT', 'SAVE', 'POST', 'GOAL'] as const)('shows %s then restores the actual context at its expiry', type => {
    let now = 100;
    const display = new ScoreboardEventDisplay(() => now);
    const context = 'CUP XL /\nROUND OF 16';
    expect(display.getText(context)).toBe('CUP XL / ROUND OF 16');
    const events = type === 'GOAL' ? ready('A', '3', true).events : type === 'POST' ? ready('8', '8', true).events : ready('3', 'A', true).events;
    const event = events.find(e => e.type === type)!;
    display.observe(event);
    const expected = type === 'GOAL' && event.type === 'GOAL'
      ? `GOAL!! #${event.attacker.shirtNumber} ${event.attacker.playerName}`
      : type === 'SAVE' ? 'GOALKEEPER!!' : type === 'POST' ? 'OFF THE POST!!' : 'SHOT!!';
    expect(display.getText(context)).toBe(expected);
    if (type === 'GOAL' && event.type === 'GOAL') {
      expect(display.getText(context)).toContain(`#${event.attacker.shirtNumber}`);
      expect(display.getText(context)).toContain(event.attacker.playerName);
    }
    const duration = type === 'GOAL' ? SCOREBOARD_GOAL_DURATION_MS : SCOREBOARD_EVENT_DURATION_MS;
    now += duration - 1;
    expect(display.getText(context)).toBe(expected);
    now++;
    expect(display.getText(context)).toBe('CUP XL / ROUND OF 16');
  });

  it.each(['SAVE', 'POST', 'GOAL'] as const)('lets %s replace SHOT from the same move and ignores later TURN', type => {
    const display = new ScoreboardEventDisplay(() => 0);
    const shot = compactCases.find(([e]) => e.type === 'SHOT')![0];
    const outcome = compactCases.find(([e]) => e.type === type)![0];
    display.observe(shot);
    expect(display.getText('QUICK MATCH')).toBe('SHOT!!');
    display.observe({ ...outcome, moveNumber: shot.moveNumber });
    display.observe(compactCases.find(([e]) => e.type === 'TURN')![0]);
    expect(display.getText('QUICK MATCH')).toBe(type === 'SAVE' ? 'GOALKEEPER!!' : type === 'POST' ? 'OFF THE POST!!' : 'GOAL!! #17 Long Player Name');
  });

  it('shows the exact actual scorer and restores the latest context rather than a cached one', () => {
    let now = 0;
    const display = new ScoreboardEventDisplay(() => now);
    display.observe({ ...stamp, moveNumber: 95, type: 'GOAL', attacker: { ...identity('Q'), playerName: 'DOVBYK' }, score: [1, 0] });
    expect(display.getText('QUICK MATCH')).toBe('GOAL!! #17 DOVBYK');
    now = SCOREBOARD_GOAL_DURATION_MS;
    expect(display.getText('CUP M / FINAL')).toBe('CUP M / FINAL');
  });

  it('replaces the notification immediately without an old timer clearing the new event', () => {
    let now = 0;
    const display = new ScoreboardEventDisplay(() => now);
    display.observe(ready('3', 'A', true).events.find(e => e.type === 'SAVE')!);
    now = 2500;
    display.observe(ready('A', '3', true).events.find(e => e.type === 'GOAL')!);
    now = 3000;
    expect(display.getText('QUICK MATCH')).toContain('GOAL');
    now = 7500;
    expect(display.getText('QUICK MATCH')).toBe('QUICK MATCH');
  });

  it('runs a ticker only for overflow, at a fixed readable speed', () => {
    expect(getTickerLayout(100, 276).marquee).toBe(false);
    expect(getTickerLayout(276, 276).marquee).toBe(false);
    expect(getTickerLayout(600, 276)).toEqual({ marquee: true, distance: 636, duration: 636 / 45 * 1000 });
  });
});

describe('touch tooltip viewport bounds', () => {
  it('keeps a 48px gap above the finger when there is space', () => {
    expect(getTooltipPosition({ centerX: 800, top: 400, bottom: 428 }, 300, 60)).toEqual({ x: 650, y: 292 });
  });
  it.each([0, 1590])('clamps horizontal bounds near x=%s and flips below a top-edge indicator', centerX => {
    const point = getTooltipPosition({ centerX, top: 18, bottom: 46 }, 300, 60);
    expect(point.x).toBeGreaterThanOrEqual(16);
    expect(point.x + 300).toBeLessThanOrEqual(1584);
    expect(point.y).toBe(94);
    expect(point.y + 60).toBeLessThanOrEqual(704);
  });
});

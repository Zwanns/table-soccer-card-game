import { getTeamScoreboardCode } from '../data/nationalTeams';
import type { MatchEventLogEntry } from '../game/MatchEventLog';
import { getCardRankDisplayLabel } from './kitCardFaceModel';

export const SCOREBOARD_EVENT_DURATION_MS = 3000;
export const SCOREBOARD_GOAL_DURATION_MS = 5000;
export const SCOREBOARD_TICKER_SPEED = 45;
export const SCOREBOARD_TICKER_GAP = 36;
export const EVENT_LOG_BOUNDS = { x: 681, y: 140, width: 238, height: 520 } as const;
export const EVENT_LOG_BOTTOM_THRESHOLD = 32;
export const EVENT_LOG_ROW_HEIGHT = 24;
export const EVENT_LOG_CONTENT_INSET = 5;
export const EVENT_LOG_VIEWPORT_TOP = 10;
export const EVENT_LOG_VIEWPORT_HEIGHT = EVENT_LOG_BOUNDS.height - 20;
export const EVENT_LOG_VISIBLE_CAPACITY = Math.ceil(EVENT_LOG_VIEWPORT_HEIGHT / EVENT_LOG_ROW_HEIGHT);
export const EVENT_LOG_OVERSCAN = 2;
export const EVENT_LOG_POOL_SIZE = EVENT_LOG_VISIBLE_CAPACITY + EVENT_LOG_OVERSCAN * 2;

export function formatMatchLogEntry(event: MatchEventLogEntry, _context?: string): string {
  const prefix = `#${event.moveNumber}`;
  const rank = getCardRankDisplayLabel;
  let text: string;
  switch (event.type) {
    case 'MATCH_START': text = `${prefix} MATCH START`; break;
    case 'BEAT': case 'FAILED': text = `${prefix} ${event.type === 'FAILED' ? 'FAIL' : 'BEAT'} ${rank(event.attacker.rank)}${event.defender ? ` ${event.type === 'FAILED' ? '←' : '→'} ${rank(event.defender.rank)}` : ''}`; break;
    case 'TURN': text = `${prefix} TURN`; break;
    case 'SHOT': case 'SAVE': text = `${prefix} ${event.type} ${rank(event.attacker.rank)}${event.goalkeeper ? ` ${event.type === 'SAVE' ? '←' : '→'} GK ${rank(event.goalkeeper.rank)}` : ''}`; break;
    case 'POST': case 'GOAL': text = `${prefix} ${event.type} ${rank(event.attacker.rank)}`; break;
    case 'MATCH_END': text = `${prefix} MATCH END ${event.score.join(':')}`; break;
  }
  return text.replace(/[\r\n]/g, '');
}

/** An injected clock keeps expiration independent of real waits and overlay visibility. */
export class ScoreboardEventDisplay {
  private notification: { text: string; expiresAt: number } | null = null;
  public constructor(private readonly now: () => number) {}
  public observe(event: MatchEventLogEntry): void {
    if (!['SHOT', 'SAVE', 'POST', 'GOAL'].includes(event.type)) return;
    const text = event.type === 'GOAL'
      ? `GOAL!! ${event.attacker.shirtNumber == null ? '' : `#${event.attacker.shirtNumber} `}${event.attacker.playerName ?? getTeamScoreboardCode(event.attacker.teamId)}`
      : event.type === 'SAVE' ? 'GOALKEEPER!!' : event.type === 'POST' ? 'OFF THE POST!!' : 'SHOT!!';
    this.notification = { text, expiresAt: this.now() + (event.type === 'GOAL' ? SCOREBOARD_GOAL_DURATION_MS : SCOREBOARD_EVENT_DURATION_MS) };
  }
  public getText(context: string): string {
    return this.notification && this.now() < this.notification.expiresAt ? this.notification.text : context.replace(/\s*\n\s*/g, ' ');
  }
}

export function getTickerLayout(textWidth: number, panelWidth: number) {
  return { marquee: textWidth > panelWidth, distance: textWidth + SCOREBOARD_TICKER_GAP,
    duration: (textWidth + SCOREBOARD_TICKER_GAP) / SCOREBOARD_TICKER_SPEED * 1000 };
}

export function getTooltipPosition(bounds: { centerX: number; top: number; bottom: number }, width: number, height: number,
  viewportWidth = 1600, viewportHeight = 720, offset = 48) {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));
  const above = bounds.top - height - offset;
  return { x: clamp(bounds.centerX - width / 2, 16, viewportWidth - width - 16),
    y: clamp(above >= 16 ? above : bounds.bottom + offset, 16, viewportHeight - height - 16) };
}

import type { Card, GoalkeeperCard } from '../cards';
import type { GameEvent } from './GameEvent';
import type { GameState } from './GameState';
import { getOptionalFieldPlayerForCard } from './squadResolver';

export interface MatchCardIdentity {
  readonly teamId: string;
  readonly rank: string;
  readonly shirtNumber?: number;
  readonly playerName?: string;
  readonly playerId?: string;
}

type MatchEventData =
  | { type: 'MATCH_START'; teams: readonly [string, string] }
  | { type: 'BEAT' | 'FAILED'; attacker: MatchCardIdentity; defender?: MatchCardIdentity; positionId?: string }
  | { type: 'TURN'; fromTeamId: string; toTeamId: string }
  | { type: 'SHOT' | 'SAVE' | 'POST'; attacker: MatchCardIdentity; goalkeeper: MatchCardIdentity }
  | { type: 'GOAL'; attacker: MatchCardIdentity; score: readonly [number, number] }
  | { type: 'MATCH_END'; score: readonly [number, number] };

export type MatchEventLogEntry = Readonly<MatchEventData & { sequence: number; turnNumber: number; moveNumber: number }>;

/** Session-only diagnostic observation. Never retains mutable cards or changes GameState. */
export class MatchEventLog {
  private entries: MatchEventLogEntry[] = [];

  public getEntries(): readonly MatchEventLogEntry[] { return this.entries; }
  public reset(): void { this.entries = []; }

  public observe(event: GameEvent, state: Readonly<GameState>): void {
    const team = (id: string) => state.matchSetups[id]?.flagCode ?? state.players.find(p => p.id === id)?.flagCode ?? id;
    const playerId = 'playerId' in event ? event.playerId ?? state.activePlayerId : state.activePlayerId;
    const opponentId = state.players.find(p => p.id !== playerId)?.id;
    const identity = (id: string | null | undefined, card: Card | GoalkeeperCard, goalkeeper = false): MatchCardIdentity => {
      const setup = id == null ? undefined : state.matchSetups[id];
      const member = goalkeeper ? setup?.squad.goalkeeper : getOptionalFieldPlayerForCard(setup, card as Card);
      return Object.freeze({ teamId: team(id ?? ''), rank: card.rank, shirtNumber: member?.shirtNumber,
        playerName: member?.name, ...(member && 'id' in member ? { playerId: member.id } : {}) });
    };
    const score = () => Object.freeze([state.players[0].goals, state.players[1].goals] as const);
    let data: MatchEventData;
    switch (event.type) {
      case 'GAME_STARTED': data = { type: 'MATCH_START', teams: Object.freeze([team(state.players[0].id), team(state.players[1].id)]) }; break;
      case 'CARD_DEFEATED': data = { type: 'BEAT', attacker: identity(playerId, event.attackerCard),
        defender: identity(opponentId, event.defenderCard, event.positionId === 'goalkeeper'), positionId: event.positionId }; break;
      case 'ATTACK_MISSED': data = { type: 'FAILED', attacker: identity(playerId, event.attackerCard ?? event.card),
        ...(event.defenderCard ? { defender: identity(opponentId, event.defenderCard) } : {}), positionId: event.positionId }; break;
      case 'TURN_ENDED': data = { type: 'TURN', fromTeamId: team(event.playerId), toTeamId: team(opponentId ?? '') }; break;
      case 'SHOT_ON_GOAL':
      case 'GOALKEEPER_SAVE':
      case 'GOALPOST_HIT': data = { type: event.type === 'SHOT_ON_GOAL' ? 'SHOT' : event.type === 'GOALKEEPER_SAVE' ? 'SAVE' : 'POST',
        attacker: identity(playerId, event.attackerCard), goalkeeper: identity(opponentId, event.goalkeeperCard, true) }; break;
      case 'GOAL_SCORED': data = { type: 'GOAL', attacker: Object.freeze({ ...identity(playerId, event.attackerCard),
        teamId: event.scorer.teamId, playerName: event.scorer.playerName, shirtNumber: event.scorer.shirtNumber }), score: score() }; break;
      case 'GAME_OVER': data = { type: 'MATCH_END', score: score() }; break;
      default: return;
    }
    this.entries.push(Object.freeze({ ...data, sequence: this.entries.length + 1, turnNumber: state.turnNumber,
      moveNumber: state.matchStepCount ?? 0 }));
  }
}

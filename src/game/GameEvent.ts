import type { Card } from '../cards';
import type { Player } from './Player';

export type GameEvent =
  | { type: 'GAME_STARTED' }
  | { type: 'FIRST_PLAYER_SELECTED'; playerId: Player['id'] }
  | { type: 'FIELD_RESTORED'; playerId: Player['id'] }
  | { type: 'ATTACK_CARD_DRAWN'; playerId: Player['id']; card: Card }
  | { type: 'TARGETS_AVAILABLE'; positionIds: string[] }
  | { type: 'CARD_DEFEATED'; attackerCard: Card; defenderCard: Card }
  | { type: 'ATTACK_MISSED'; card: Card }
  | { type: 'GOAL_SCORED'; playerId: Player['id'] }
  | { type: 'TURN_ENDED'; playerId: Player['id'] }
  | { type: 'GAME_OVER'; winnerId: Player['id'] | null };

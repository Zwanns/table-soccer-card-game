import type { Card } from '../cards';
import type { FieldPositionId } from './PlayerField';
import type { Player } from './Player';

export type GameEvent =
  | { type: 'GAME_STARTED' }
  | { type: 'FIRST_PLAYER_SELECTED'; playerId: Player['id'] }
  | { type: 'FIELD_RESTORED'; playerId: Player['id'] }
  | { type: 'FIELD_CARD_RESTORED'; playerId: Player['id']; positionId: FieldPositionId; card: Card }
  | { type: 'ATTACK_CARD_DRAWN'; playerId: Player['id']; card: Card }
  | { type: 'TARGETS_AVAILABLE'; positionIds: string[] }
  | {
      type: 'CARD_DEFEATED';
      playerId: Player['id'];
      turnNumber: number;
      positionId: FieldPositionId;
      attackerCard: Card;
      defenderCard: Card;
    }
  | { type: 'SHOT_ON_GOAL'; playerId: Player['id']; attackerCard: Card; goalkeeperCard: Card }
  | { type: 'GOALPOST_HIT'; playerId: Player['id']; attackerCard: Card; goalkeeperCard: Card }
  | { type: 'GOALKEEPER_SAVE'; playerId: Player['id']; attackerCard: Card; goalkeeperCard: Card }
  | { type: 'ATTACK_MISSED'; card: Card }
  | { type: 'GOAL_SCORED'; playerId: Player['id'] }
  | { type: 'TURN_ENDED'; playerId: Player['id'] }
  | { type: 'GAME_OVER'; winnerId: Player['id'] | null };

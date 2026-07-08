import type { Card, CardRank, GoalkeeperCard, GoalkeeperRank } from '../cards';
import type { FieldCard, FieldPositionId, MidfielderPositionId } from './PlayerField';
import type { Player } from './Player';

export type ScorerSnapshot = {
  playerName?: string;
  shirtNumber?: number;
  rank: CardRank;
  teamId: string;
};

export type GoalkeeperRankChangedEvent = {
  type: 'GOALKEEPER_RANK_CHANGED';
  playerId: Player['id'];
  turnNumber: number;
  previousCard: GoalkeeperCard;
  nextCard: GoalkeeperCard;
};

export type AttackDeckEmptyEvent = {
  type: 'ATTACK_DECK_EMPTY';
  playerId: Player['id'];
  turnNumber: number;
};

export type GameOverReason = 'CANNOT_RESTORE_FIELD' | 'NO_ATTACK_CARD' | 'NO_FIRST_PLAYER_CARD';

export type GameEvent =
  | { type: 'GAME_STARTED' }
  | { type: 'FIRST_PLAYER_SELECTED'; playerId: Player['id'] }
  | { type: 'FIELD_RESTORED'; playerId: Player['id'] }
  | {
      type: 'FIELD_CARD_RESTORED';
      playerId: Player['id'];
      turnNumber: number;
      positionId: FieldPositionId;
      card: FieldCard;
      cardKind: 'outfield' | 'goalkeeper';
      cardRank: CardRank | GoalkeeperRank;
    }
  | { type: 'ATTACK_CARD_DRAWN'; playerId: Player['id']; card: Card }
  | {
      type: 'MIDFIELDER_COMMITTED';
      playerId: Player['id'];
      turnNumber: number;
      positionId: MidfielderPositionId;
      card: Card;
    }
  | { type: 'TARGETS_AVAILABLE'; positionIds: string[] }
  | {
      type: 'MIDFIELD_GAP_USED';
      playerId: Player['id'];
      turnNumber: number;
      positionId: MidfielderPositionId;
      attackerCard: Card;
    }
  | {
      type: 'CARD_DEFEATED';
      playerId: Player['id'];
      turnNumber: number;
      positionId: FieldPositionId;
      attackerCard: Card;
      defenderCard: FieldCard;
    }
  | { type: 'SHOT_ON_GOAL'; playerId: Player['id']; attackerCard: Card; goalkeeperCard: GoalkeeperCard }
  | { type: 'GOALPOST_HIT'; playerId: Player['id']; attackerCard: Card; goalkeeperCard: GoalkeeperCard }
  | { type: 'GOALKEEPER_SAVE'; playerId: Player['id']; attackerCard: Card; goalkeeperCard: GoalkeeperCard }
  | GoalkeeperRankChangedEvent
  | AttackDeckEmptyEvent
  | {
      type: 'GOALKEEPER_CARD_RECYCLED';
      playerId: Player['id'];
      turnNumber: number;
      goalkeeperRank: GoalkeeperRank;
    }
  | {
      type: 'ATTACK_MISSED';
      card: Card;
      playerId?: Player['id'];
      turnNumber?: number;
      positionId?: FieldPositionId;
      attackerCard?: Card;
      defenderCard?: Card;
    }
  | { type: 'GOAL_SCORED'; playerId: Player['id']; turnNumber: number; attackerCard: Card; scorer: ScorerSnapshot }
  | { type: 'TURN_ENDED'; playerId: Player['id'] }
  | {
      type: 'GAME_OVER';
      winnerId: Player['id'] | null;
      reason?: GameOverReason;
      depletedPlayerId?: Player['id'];
    };

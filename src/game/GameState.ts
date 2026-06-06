import type { Card } from '../cards';
import type { GameEvent } from './GameEvent';
import type { GamePhase } from './GamePhase';
import type { Player } from './Player';

export interface GameState {
  players: [Player, Player];
  activePlayerId: Player['id'] | null;
  phase: GamePhase;
  attackCard: Card | null;
  attackBank: Card[];
  legalTargetPositionIds: string[];
  winnerId: Player['id'] | null;
  isDraw: boolean;
  turnNumber: number;
  log: GameEvent[];
}

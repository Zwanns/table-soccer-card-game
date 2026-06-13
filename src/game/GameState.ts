import type { Card } from '../cards';
import type { GameEvent } from './GameEvent';
import type { GamePhase } from './GamePhase';
import type { MatchTeamSetups } from './MatchTeamSetup';
import type { Player } from './Player';
import type { MidfielderPositionId } from './PlayerField';

export type AttackCardSource = 'DECK' | 'MIDFIELDER';

export interface CounterattackMidfieldGap {
  defendingPlayerId: Player['id'];
  positionIds: MidfielderPositionId[];
  used: boolean;
  turnNumber: number;
}

export interface GameState {
  players: [Player, Player];
  matchSetups: MatchTeamSetups;
  activePlayerId: Player['id'] | null;
  phase: GamePhase;
  attackCard: Card | null;
  currentAttackCardSource?: AttackCardSource | null;
  currentAttackingMidfielderPositionId?: MidfielderPositionId | null;
  attackBank: Card[];
  legalTargetPositionIds: string[];
  committableMidfielderPositionIds?: MidfielderPositionId[];
  committedMidfielderPositionIds?: MidfielderPositionId[];
  legalMidfieldGapPositionIds?: MidfielderPositionId[];
  counterattackMidfieldGap?: CounterattackMidfieldGap | null;
  winnerId: Player['id'] | null;
  isDraw: boolean;
  turnNumber: number;
  log: GameEvent[];
}

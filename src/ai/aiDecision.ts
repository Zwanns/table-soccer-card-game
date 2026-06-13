import type { GameState, MidfielderPositionId, Player } from '../game';
import type { FieldPositionId } from '../game/PlayerField';
import {
  chooseAttackSource,
  chooseTarget,
  createAiDecisionRandom,
  type SeededRandomLike
} from './aiHeuristics';

export type AiAction =
  | {
      type: 'DRAW_FROM_DECK';
    }
  | {
      type: 'COMMIT_MIDFIELDER';
      positionId: MidfielderPositionId;
    }
  | {
      type: 'SELECT_TARGET';
      positionId: FieldPositionId;
    }
  | {
      type: 'SELECT_MIDFIELD_GAP';
      positionId: MidfielderPositionId;
    };

export type { SeededRandomLike };
export { createAiDecisionRandom };

export function chooseAiAction(
  state: Readonly<GameState>,
  playerId: Player['id'],
  random: SeededRandomLike
): AiAction | null {
  switch (state.phase) {
    case 'WAITING_FOR_ATTACK_CARD':
      return chooseAttackSource(state, playerId, random);
    case 'WAITING_FOR_TARGET':
      return chooseTarget(state, playerId, random);
    default:
      return null;
  }
}

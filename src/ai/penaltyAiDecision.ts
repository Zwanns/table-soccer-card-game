import type { PenaltyShootoutState } from '../tournament';
import type { PenaltyAiAction, PenaltyAiControllerSide, PenaltyAiRandomSource } from './penaltyAiTypes';

export function choosePenaltyAiAction(
  state: Readonly<PenaltyShootoutState>,
  controllerSide: PenaltyAiControllerSide,
  random: PenaltyAiRandomSource
): PenaltyAiAction | null {
  if (state.status === 'complete') {
    return null;
  }

  if (state.phase === 'selecting-goalkeeper') {
    return controllerSide === getGoalkeeperSide(state.nextShooter)
      ? {
          type: 'DRAW_GOALKEEPER_CARD'
        }
      : null;
  }

  if (state.phase === 'selecting-attacker') {
    if (controllerSide !== state.nextShooter) {
      return null;
    }

    const cardCount = getAvailableAttackCardCount(state, controllerSide);

    if (cardCount <= 0) {
      return null;
    }

    return {
      type: 'SELECT_ATTACK_CARD',
      cardIndex: pickCardIndex(cardCount, random)
    };
  }

  return null;
}

function getGoalkeeperSide(shooterSide: PenaltyAiControllerSide): PenaltyAiControllerSide {
  return shooterSide === 'home' ? 'away' : 'home';
}

function getAvailableAttackCardCount(
  state: Readonly<PenaltyShootoutState>,
  side: PenaltyAiControllerSide
): number {
  return side === 'home' ? state.homeAvailableCards.length : state.awayAvailableCards.length;
}

function pickCardIndex(cardCount: number, random: PenaltyAiRandomSource): number {
  return Math.min(cardCount - 1, Math.floor(random() * cardCount));
}

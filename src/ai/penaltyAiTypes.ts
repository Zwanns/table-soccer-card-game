import type { PenaltyShootoutSide } from '../tournament';

export type PenaltyAiRandomSource = () => number;

export type PenaltyAiAction =
  | {
      type: 'DRAW_GOALKEEPER_CARD';
    }
  | {
      type: 'SELECT_ATTACK_CARD';
      cardIndex: number;
    };

export type PenaltyAiControllerSide = PenaltyShootoutSide;

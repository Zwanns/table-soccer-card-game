import { describe, expect, it } from 'vitest';
import {
  getGoalkeeperGoalAnimation,
  GOALKEEPER_GOAL_DURATION_MS,
  GOALKEEPER_GOAL_EXIT_DISTANCE,
  GOALKEEPER_GOAL_SCALE,
  GOALKEEPER_GOAL_SPIN_DEGREES
} from '../ui/goalkeeperGoalAnimation';

describe('goalkeeper goal animation', () => {
  it('moves a left goalkeeper deeper into the left goal', () => {
    expect(getGoalkeeperGoalAnimation({ x: -490, y: 0 }, 'left')).toEqual({
      target: { x: -490 - GOALKEEPER_GOAL_EXIT_DISTANCE, y: 0 },
      angle: -GOALKEEPER_GOAL_SPIN_DEGREES,
      scale: GOALKEEPER_GOAL_SCALE,
      alpha: 0,
      duration: GOALKEEPER_GOAL_DURATION_MS,
      ease: 'Cubic.easeIn'
    });
  });

  it('moves a right goalkeeper deeper into the right goal', () => {
    expect(getGoalkeeperGoalAnimation({ x: 490, y: 0 }, 'right')).toEqual({
      target: { x: 490 + GOALKEEPER_GOAL_EXIT_DISTANCE, y: 0 },
      angle: GOALKEEPER_GOAL_SPIN_DEGREES,
      scale: GOALKEEPER_GOAL_SCALE,
      alpha: 0,
      duration: GOALKEEPER_GOAL_DURATION_MS,
      ease: 'Cubic.easeIn'
    });
  });
});

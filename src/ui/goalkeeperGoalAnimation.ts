export type GoalkeeperGoalSide = 'left' | 'right';

export interface GoalkeeperGoalAnimation {
  target: { x: number; y: number };
  angle: number;
  scale: number;
  alpha: number;
  duration: number;
  ease: 'Cubic.easeIn';
}

export const GOALKEEPER_GOAL_EXIT_DISTANCE = 120;
export const GOALKEEPER_GOAL_SPIN_DEGREES = 1080;
export const GOALKEEPER_GOAL_SCALE = 0.18;
export const GOALKEEPER_GOAL_DURATION_MS = 300;

export function getGoalkeeperGoalAnimation(
  goalkeeperPosition: { x: number; y: number },
  goalkeeperSide: GoalkeeperGoalSide
): GoalkeeperGoalAnimation {
  const direction = goalkeeperSide === 'left' ? -1 : 1;

  return {
    target: {
      x: goalkeeperPosition.x + direction * GOALKEEPER_GOAL_EXIT_DISTANCE,
      y: goalkeeperPosition.y
    },
    angle: direction * GOALKEEPER_GOAL_SPIN_DEGREES,
    scale: GOALKEEPER_GOAL_SCALE,
    alpha: 0,
    duration: GOALKEEPER_GOAL_DURATION_MS,
    ease: 'Cubic.easeIn'
  };
}

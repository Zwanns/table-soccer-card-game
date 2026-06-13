import type { GameEvent } from '../game';

export type GoalScoredSceneEffect = {
  type: 'GOAL_SCORED';
  eventIndex: number;
  soundKey: 'sound-goal';
  soundVolume: 0.72;
  flyingMessage: 'GOAL!!';
  flyingMessageTone: 'goal';
};

export function getNextGoalScoredSceneEffect(
  events: readonly GameEvent[],
  handledEventCursor: number
): GoalScoredSceneEffect | null {
  const startIndex = Math.max(0, handledEventCursor);

  for (let eventIndex = startIndex; eventIndex < events.length; eventIndex += 1) {
    const event = events[eventIndex];

    if (event?.type === 'GOAL_SCORED') {
      return {
        type: 'GOAL_SCORED',
        eventIndex,
        soundKey: 'sound-goal',
        soundVolume: 0.72,
        flyingMessage: 'GOAL!!',
        flyingMessageTone: 'goal'
      };
    }
  }

  return null;
}

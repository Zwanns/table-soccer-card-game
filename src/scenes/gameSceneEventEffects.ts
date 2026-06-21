import type { GameEvent } from '../game';

export type GoalScoredSceneEffect = {
  type: 'GOAL_SCORED';
  eventIndex: number;
  flyingMessage: 'GOAL!!';
  flyingMessageTone: 'goal';
};

export type GoalkeeperShotSceneEffect = {
  type: 'GOAL_SCORED' | 'GOALPOST_HIT' | 'GOALKEEPER_SAVE';
  flyingMessage: 'GOAL!!' | 'Post!' | 'Goalkeeper!!';
  flyingMessageTone: 'goal' | 'post' | 'save';
};

export function getGoalkeeperShotSceneEffect(
  outcome: 'goal' | 'post' | 'save'
): GoalkeeperShotSceneEffect {
  switch (outcome) {
    case 'goal':
      return {
        type: 'GOAL_SCORED',
        flyingMessage: 'GOAL!!',
        flyingMessageTone: 'goal'
      };
    case 'post':
      return {
        type: 'GOALPOST_HIT',
        flyingMessage: 'Post!',
        flyingMessageTone: 'post'
      };
    case 'save':
      return {
        type: 'GOALKEEPER_SAVE',
        flyingMessage: 'Goalkeeper!!',
        flyingMessageTone: 'save'
      };
  }
}

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
        flyingMessage: 'GOAL!!',
        flyingMessageTone: 'goal'
      };
    }
  }

  return null;
}

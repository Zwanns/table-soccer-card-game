import type { GameEvent } from '../game';

export type GoalScoredSceneEffect = {
  type: 'GOAL_SCORED';
  eventIndex: number;
  flyingMessage: 'GOAL!!';
  flyingMessageTone: 'goal';
  soundKey: 'sound-goal';
};

export type GoalkeeperShotSceneEffect = {
  type: 'GOAL_SCORED' | 'GOALPOST_HIT' | 'GOALKEEPER_SAVE';
  flyingMessage: 'GOAL!!' | 'Post!' | 'Goalkeeper!!';
  flyingMessageTone: 'goal' | 'post' | 'save';
  soundKey: 'sound-goal' | 'sound-goalpost' | 'sound-goalkeeper-save';
};

const GOALKEEPER_SHOT_EVENT_TYPES = {
  goal: 'GOAL_SCORED',
  post: 'GOALPOST_HIT',
  save: 'GOALKEEPER_SAVE'
} as const;

export function getGoalkeeperShotSceneEffect(
  outcome: 'goal' | 'post' | 'save'
): GoalkeeperShotSceneEffect {
  switch (outcome) {
    case 'goal':
      return {
        type: 'GOAL_SCORED',
        flyingMessage: 'GOAL!!',
        flyingMessageTone: 'goal',
        soundKey: 'sound-goal'
      };
    case 'post':
      return {
        type: 'GOALPOST_HIT',
        flyingMessage: 'Post!',
        flyingMessageTone: 'post',
        soundKey: 'sound-goalpost'
      };
    case 'save':
      return {
        type: 'GOALKEEPER_SAVE',
        flyingMessage: 'Goalkeeper!!',
        flyingMessageTone: 'save',
        soundKey: 'sound-goalkeeper-save'
      };
  }
}

export function getGoalkeeperShotEventIndex(
  events: readonly GameEvent[],
  outcome: 'goal' | 'post' | 'save'
): number | null {
  const eventType = GOALKEEPER_SHOT_EVENT_TYPES[outcome];

  for (let eventIndex = events.length - 1; eventIndex >= 0; eventIndex -= 1) {
    if (events[eventIndex]?.type === eventType) {
      return eventIndex;
    }
  }

  return null;
}

export function claimGoalkeeperShotImpactEvent(
  handledEventIndexes: Set<number>,
  eventIndex: number | null
): boolean {
  if (eventIndex === null) {
    return true;
  }

  if (handledEventIndexes.has(eventIndex)) {
    return false;
  }

  handledEventIndexes.add(eventIndex);
  return true;
}

export function getNextGoalScoredSceneEffect(
  events: readonly GameEvent[],
  handledEventIndexes: ReadonlySet<number>
): GoalScoredSceneEffect | null {
  for (let eventIndex = 0; eventIndex < events.length; eventIndex += 1) {
    const event = events[eventIndex];

    if (event?.type === 'GOAL_SCORED' && !handledEventIndexes.has(eventIndex)) {
      return {
        type: 'GOAL_SCORED',
        eventIndex,
        flyingMessage: 'GOAL!!',
        flyingMessageTone: 'goal',
        soundKey: 'sound-goal'
      };
    }
  }

  return null;
}

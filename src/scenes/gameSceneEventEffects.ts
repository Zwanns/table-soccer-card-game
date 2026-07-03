import type { GameEvent } from '../game';
import {
  GOALKEEPER_SAVE_SHOT_OUTCOME_EFFECT,
  GOAL_SHOT_OUTCOME_EFFECT,
  POST_HIT_SHOT_OUTCOME_EFFECT,
  type ShotOutcomeEffectDefinition
} from '../ui/shotOutcomeEffects';

export type GoalScoredSceneEffect = typeof GOAL_SHOT_OUTCOME_EFFECT & {
  eventIndex: number;
};

export type GoalkeeperShotSceneEffect = ShotOutcomeEffectDefinition;

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
      return { ...GOAL_SHOT_OUTCOME_EFFECT };
    case 'post':
      return { ...POST_HIT_SHOT_OUTCOME_EFFECT };
    case 'save':
      return { ...GOALKEEPER_SAVE_SHOT_OUTCOME_EFFECT };
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
        ...GOAL_SHOT_OUTCOME_EFFECT,
        type: 'GOAL_SCORED',
        eventIndex
      };
    }
  }

  return null;
}

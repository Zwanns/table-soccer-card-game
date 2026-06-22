import type { GameEvent, TargetLine } from '../game';
import {
  TUTORIAL_MATCH_V2_STEPS
} from './tutorialScenario';
import type {
  TutorialAction,
  TutorialActionResult,
  TutorialAllowedAction,
  TutorialStep
} from './tutorialTypes';
import type { TutorialTextKey } from './tutorialTexts';

const DEFAULT_BLOCKED_MESSAGE_KEY: TutorialTextKey = 'tutorial.guard.tryCard';

export class TutorialController {
  private readonly steps: readonly TutorialStep[];
  private currentStepIndex = 0;
  private completed = false;

  public constructor(steps: readonly TutorialStep[] = TUTORIAL_MATCH_V2_STEPS) {
    this.steps = steps;
    this.completed = steps.length === 0;
  }

  public getCurrentStep(): TutorialStep | null {
    return this.completed ? null : this.steps[this.currentStepIndex] ?? null;
  }

  public isComplete(): boolean {
    return this.completed;
  }

  public continue(): boolean {
    const step = this.getCurrentStep();

    if (step?.waitFor !== 'next') {
      return false;
    }

    this.advance();
    return true;
  }

  public checkAction(action: TutorialAction): TutorialActionResult {
    const step = this.getCurrentStep();

    if (step === null) {
      return { allowed: true };
    }

    if (step.allowedAction === undefined) {
      return step.waitFor === 'line-reached'
        ? { allowed: true }
        : {
            allowed: false,
            messageKey: step.waitFor === 'next' ? 'tutorial.guard.pressContinue' : DEFAULT_BLOCKED_MESSAGE_KEY
          };
    }

    if (isActionAllowed(action, step.allowedAction)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      messageKey: step.blockedMessageKey ?? getDefaultBlockedMessageKey(step.allowedAction.type)
    };
  }

  public recordAction(action: TutorialAction): boolean {
    const step = this.getCurrentStep();

    if (step?.waitFor !== 'action') {
      return false;
    }

    if (step.allowedAction !== undefined && !isActionAllowed(action, step.allowedAction)) {
      return false;
    }

    this.advance();
    return true;
  }

  public recordEvents(events: readonly GameEvent[]): boolean {
    const step = this.getCurrentStep();

    if (step?.waitFor !== 'engine-event' || step.expectedEventType === undefined) {
      return false;
    }

    if (!events.some((event) => event.type === step.expectedEventType)) {
      return false;
    }

    this.advance();
    return true;
  }

  public recordTargetLine(line: TargetLine | null): boolean {
    const step = this.getCurrentStep();

    if (step?.waitFor !== 'line-reached' || line !== step.expectedLine) {
      return false;
    }

    this.advance();
    return true;
  }

  private advance(): void {
    this.currentStepIndex += 1;

    if (this.currentStepIndex >= this.steps.length) {
      this.completed = true;
    }
  }
}

function isActionAllowed(action: TutorialAction, allowedAction: TutorialAllowedAction): boolean {
  if (action.type !== allowedAction.type) {
    return false;
  }

  switch (allowedAction.type) {
    case 'draw-attack-card':
      if (action.type !== 'draw-attack-card') {
        return false;
      }

      return allowedAction.rank === undefined || action.rank === allowedAction.rank;
    case 'select-target':
      if (action.type !== 'select-target') {
        return false;
      }

      if (allowedAction.positionId !== undefined && action.positionId !== allowedAction.positionId) {
        return false;
      }

      return allowedAction.rank === undefined || action.rank === allowedAction.rank;
    case 'commit-midfielder':
      if (action.type !== 'commit-midfielder') {
        return false;
      }

      if (allowedAction.positionId !== undefined && action.positionId !== allowedAction.positionId) {
        return false;
      }

      if (allowedAction.slot !== undefined && action.slot !== allowedAction.slot) {
        return false;
      }

      return allowedAction.rank === undefined || action.rank === allowedAction.rank;
    case 'use-midfield-gap':
      if (action.type !== 'use-midfield-gap') {
        return false;
      }

      if (allowedAction.positionId !== undefined && action.positionId !== allowedAction.positionId) {
        return false;
      }

      return allowedAction.slot === undefined || action.slot === allowedAction.slot;
  }

  return false;
}

function getDefaultBlockedMessageKey(actionType: TutorialAllowedAction['type']): TutorialTextKey {
  if (actionType === 'draw-attack-card') {
    return 'tutorial.guard.useDeck';
  }

  if (actionType === 'commit-midfielder') {
    return 'tutorial.guard.tryMidfielder';
  }

  if (actionType === 'use-midfield-gap') {
    return 'tutorial.guard.passOpenZone';
  }

  return DEFAULT_BLOCKED_MESSAGE_KEY;
}

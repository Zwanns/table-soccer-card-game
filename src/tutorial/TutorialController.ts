import type { GameEvent, TargetLine } from '../game';
import {
  TUTORIAL_MATCH_V1_STEPS
} from './tutorialScenario';
import type {
  TutorialAction,
  TutorialActionResult,
  TutorialAllowedAction,
  TutorialStep
} from './tutorialTypes';

const DEFAULT_BLOCKED_MESSAGE = 'Try this card.';

export class TutorialController {
  private readonly steps: readonly TutorialStep[];
  private currentStepIndex = 0;
  private completed = false;

  public constructor(steps: readonly TutorialStep[] = TUTORIAL_MATCH_V1_STEPS) {
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
            message: step.waitFor === 'next' ? 'Press Continue first.' : DEFAULT_BLOCKED_MESSAGE
          };
    }

    if (isActionAllowed(action, step.allowedAction)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      message: step.allowedAction.type === 'draw-attack-card' ? 'Use the highlighted deck.' : DEFAULT_BLOCKED_MESSAGE
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

  if (allowedAction.type === 'select-target') {
    if (allowedAction.positionId !== undefined && action.type === 'select-target' && action.positionId !== allowedAction.positionId) {
      return false;
    }
  }

  if (allowedAction.rank !== undefined && action.rank !== allowedAction.rank) {
    return false;
  }

  return true;
}

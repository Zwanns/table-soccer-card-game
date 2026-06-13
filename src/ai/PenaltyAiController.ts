import type { PlayerControllerType } from './aiTypes';
import { choosePenaltyAiAction } from './penaltyAiDecision';
import type { PenaltyAiAction, PenaltyAiControllerSide, PenaltyAiRandomSource } from './penaltyAiTypes';
import type { PenaltyShootoutState } from '../tournament';

export const PENALTY_AI_TIMING = {
  beforeShotChoiceMs: 750,
  beforeGoalkeeperChoiceMs: 750,
  afterResultMs: 850,
  jitterMs: 150
} as const;

export type PenaltyAiScheduledTimer = {
  remove(dispatchCallback?: boolean): void;
};

export type PenaltyAiControllerOptions = {
  getState: () => Readonly<PenaltyShootoutState> | null;
  getControllerType: (side: PenaltyAiControllerSide) => PlayerControllerType;
  random: PenaltyAiRandomSource;
  scheduleTimer: (delayMs: number, callback: () => void) => PenaltyAiScheduledTimer;
  onAction: (action: PenaltyAiAction) => void;
};

export class PenaltyAiController {
  private pendingTimer: PenaltyAiScheduledTimer | null = null;
  private destroyed = false;

  public constructor(private readonly options: PenaltyAiControllerOptions) {}

  public scheduleNextAction(): void {
    if (this.destroyed || this.pendingTimer !== null) {
      return;
    }

    const state = this.options.getState();
    const side = state === null ? null : getCurrentDecisionSide(state);

    if (state === null || side === null || state.status === 'complete' || this.options.getControllerType(side) !== 'AI') {
      return;
    }

    const delayMs = getBaseDelayMs(state) + getJitterMs(this.options.random);

    this.pendingTimer = this.options.scheduleTimer(delayMs, () => this.runScheduledAction(side));
  }

  public cancelPendingAction(): void {
    if (this.pendingTimer === null) {
      return;
    }

    this.pendingTimer.remove(false);
    this.pendingTimer = null;
  }

  public destroy(): void {
    this.destroyed = true;
    this.cancelPendingAction();
  }

  public isPending(): boolean {
    return this.pendingTimer !== null;
  }

  private runScheduledAction(side: PenaltyAiControllerSide): void {
    this.pendingTimer = null;

    if (this.destroyed) {
      return;
    }

    const state = this.options.getState();

    if (state === null || state.status === 'complete' || this.options.getControllerType(side) !== 'AI') {
      return;
    }

    const action = choosePenaltyAiAction(state, side, this.options.random);

    if (action !== null) {
      this.options.onAction(action);
    }
  }
}

function getCurrentDecisionSide(state: Readonly<PenaltyShootoutState>): PenaltyAiControllerSide | null {
  if (state.phase === 'selecting-goalkeeper') {
    return state.nextShooter === 'home' ? 'away' : 'home';
  }

  if (state.phase === 'selecting-attacker') {
    return state.nextShooter;
  }

  return null;
}

function getBaseDelayMs(state: Readonly<PenaltyShootoutState>): number {
  return state.phase === 'selecting-goalkeeper'
    ? PENALTY_AI_TIMING.beforeGoalkeeperChoiceMs
    : PENALTY_AI_TIMING.beforeShotChoiceMs;
}

function getJitterMs(random: PenaltyAiRandomSource): number {
  return Math.floor(random() * PENALTY_AI_TIMING.jitterMs);
}

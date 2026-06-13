import type { GameState, Player } from '../game';
import { chooseAiAction, createAiDecisionRandom, type AiAction, type SeededRandomLike } from './aiDecision';

export const AI_TIMING = {
  beforeSourceChoiceMs: 650,
  beforeTargetChoiceMs: 650,
  afterTurnStartMs: 500
} as const;

export type AiTurnCheckReason = 'TURN_STARTED' | 'STATE_RENDERED';

export type AiScheduledTimer = {
  remove: (dispatchCallback?: boolean) => void;
};

export type AiTurnControllerOptions = {
  getState: () => Readonly<GameState> | null;
  getMatchSeed: () => string;
  executeAction: (action: AiAction) => void;
  scheduleDelayedCall: (delayMs: number, callback: () => void) => AiScheduledTimer;
  timingJitterMs?: number;
};

export class AiTurnController {
  private pendingTimer: AiScheduledTimer | null = null;
  private isExecuting = false;
  private isDisposed = false;
  private queuedCheckReason: AiTurnCheckReason | null = null;
  private readonly decisionRandoms = new Map<Player['id'], SeededRandomLike>();
  private readonly timingRandoms = new Map<Player['id'], SeededRandomLike>();
  private readonly timingJitterMs: number;

  public constructor(private readonly options: AiTurnControllerOptions) {
    this.timingJitterMs = options.timingJitterMs ?? 150;
  }

  public requestTurnCheck(reason: AiTurnCheckReason = 'STATE_RENDERED'): void {
    if (this.isDisposed) {
      return;
    }

    if (this.isExecuting) {
      this.queuedCheckReason = reason;
      return;
    }

    if (this.pendingTimer !== null) {
      return;
    }

    const state = this.options.getState();
    const activePlayerId = state?.activePlayerId ?? null;

    if (state === null || activePlayerId === null || !this.isAiTurn(state)) {
      return;
    }

    if (!isAiActionPhase(state)) {
      return;
    }

    const delayMs = this.getDelayMs(state, activePlayerId, reason);

    this.pendingTimer = this.options.scheduleDelayedCall(delayMs, () => {
      this.pendingTimer = null;
      this.executeNextAction();
    });
  }

  public isAiTurn(state: Readonly<GameState>): boolean {
    const activePlayerId = state.activePlayerId;

    if (activePlayerId === null) {
      return false;
    }

    return state.matchSetups[activePlayerId]?.controllerType === 'AI';
  }

  public dispose(): void {
    this.isDisposed = true;
    this.clearPendingTimer();
    this.queuedCheckReason = null;
  }

  private executeNextAction(): void {
    if (this.isDisposed || this.isExecuting) {
      return;
    }

    const state = this.options.getState();
    const activePlayerId = state?.activePlayerId ?? null;

    if (state === null || activePlayerId === null || !this.isAiTurn(state) || !isAiActionPhase(state)) {
      return;
    }

    const action = chooseAiAction(state, activePlayerId, this.getDecisionRandom(activePlayerId));

    if (action === null) {
      return;
    }

    this.isExecuting = true;

    try {
      this.options.executeAction(action);
    } finally {
      this.isExecuting = false;

      const queuedReason = this.queuedCheckReason;
      this.queuedCheckReason = null;

      if (queuedReason !== null) {
        this.requestTurnCheck(queuedReason);
      }
    }
  }

  private getDelayMs(state: Readonly<GameState>, playerId: Player['id'], reason: AiTurnCheckReason): number {
    const baseDelay =
      reason === 'TURN_STARTED'
        ? AI_TIMING.afterTurnStartMs
        : state.phase === 'WAITING_FOR_ATTACK_CARD'
          ? AI_TIMING.beforeSourceChoiceMs
          : AI_TIMING.beforeTargetChoiceMs;
    const jitter = this.getTimingJitter(playerId);

    return Math.max(0, baseDelay + jitter);
  }

  private getTimingJitter(playerId: Player['id']): number {
    if (this.timingJitterMs <= 0) {
      return 0;
    }

    return Math.round((this.getTimingRandom(playerId)() * 2 - 1) * this.timingJitterMs);
  }

  private getDecisionRandom(playerId: Player['id']): SeededRandomLike {
    const existing = this.decisionRandoms.get(playerId);

    if (existing !== undefined) {
      return existing;
    }

    const random = createAiDecisionRandom(this.options.getMatchSeed(), playerId);
    this.decisionRandoms.set(playerId, random);

    return random;
  }

  private getTimingRandom(playerId: Player['id']): SeededRandomLike {
    const existing = this.timingRandoms.get(playerId);

    if (existing !== undefined) {
      return existing;
    }

    const random = createAiDecisionRandom(`${this.options.getMatchSeed()}:timing`, playerId);
    this.timingRandoms.set(playerId, random);

    return random;
  }

  private clearPendingTimer(): void {
    if (this.pendingTimer === null) {
      return;
    }

    this.pendingTimer.remove(false);
    this.pendingTimer = null;
  }
}

function isAiActionPhase(state: Readonly<GameState>): boolean {
  return state.phase === 'WAITING_FOR_ATTACK_CARD' || state.phase === 'WAITING_FOR_TARGET';
}

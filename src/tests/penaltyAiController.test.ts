import { describe, expect, it, vi } from 'vitest';
import {
  PENALTY_AI_TIMING,
  PenaltyAiController,
  type PenaltyAiAction,
  type PlayerControllerType,
  type PenaltyAiScheduledTimer
} from '../ai';
import {
  createPenaltyShootoutState,
  drawPenaltyGoalkeeperCard,
  revealPenaltyAttackCard,
  takePenaltyKick,
  type PenaltyShootoutState
} from '../tournament';

type FakeTimer = PenaltyAiScheduledTimer & {
  run(): void;
  removed: boolean;
};

function createShootout(): PenaltyShootoutState {
  return createPenaltyShootoutState({
    matchId: 'penalty-ai-controller-match',
    homeTeamId: 'fr',
    awayTeamId: 'es',
    seed: 'penalty-ai-controller-seed'
  });
}

function createFakeTimer(callback: () => void): FakeTimer {
  return {
    removed: false,
    remove: vi.fn(function remove(this: FakeTimer) {
      this.removed = true;
    }),
    run() {
      callback();
    }
  };
}

describe('PenaltyAiController', () => {
  it('does not schedule a timer for HUMAN controlled sides', () => {
    const scheduleTimer = vi.fn();
    const controller = new PenaltyAiController({
      getState: () => createShootout(),
      getControllerType: () => 'HUMAN',
      random: () => 0,
      scheduleTimer,
      onAction: vi.fn()
    });

    controller.scheduleNextAction();

    expect(scheduleTimer).not.toHaveBeenCalled();
    expect(controller.isPending()).toBe(false);
  });

  it('schedules one jittered timer for an AI controlled side', () => {
    const timers: FakeTimer[] = [];
    const controller = new PenaltyAiController({
      getState: () => createShootout(),
      getControllerType: (side) => (side === 'away' ? 'AI' : 'HUMAN'),
      random: () => 0.5,
      scheduleTimer: (delayMs, callback) => {
        const timer = createFakeTimer(callback);
        timers.push(timer);
        expect(delayMs).toBe(PENALTY_AI_TIMING.beforeGoalkeeperChoiceMs + 75);
        return timer;
      },
      onAction: vi.fn()
    });

    controller.scheduleNextAction();
    controller.scheduleNextAction();

    expect(timers).toHaveLength(1);
    expect(controller.isPending()).toBe(true);
  });

  it('runs one scheduled action and clears the pending timer', () => {
    const state = createShootout();
    const timers: FakeTimer[] = [];
    const onAction = vi.fn();
    const controller = new PenaltyAiController({
      getState: () => state,
      getControllerType: (side) => (side === 'away' ? 'AI' : 'HUMAN'),
      random: () => 0,
      scheduleTimer: (_delayMs, callback) => {
        const timer = createFakeTimer(callback);
        timers.push(timer);
        return timer;
      },
      onAction
    });

    controller.scheduleNextAction();
    timers[0].run();

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ type: 'DRAW_GOALKEEPER_CARD' });
    expect(controller.isPending()).toBe(false);
  });

  it('removes pending timer on destroy and ignores late callbacks', () => {
    const timers: FakeTimer[] = [];
    const onAction = vi.fn();
    const controller = new PenaltyAiController({
      getState: () => createShootout(),
      getControllerType: (side) => (side === 'away' ? 'AI' : 'HUMAN'),
      random: () => 0,
      scheduleTimer: (_delayMs, callback) => {
        const timer = createFakeTimer(callback);
        timers.push(timer);
        return timer;
      },
      onAction
    });

    controller.scheduleNextAction();
    controller.destroy();
    timers[0].run();

    expect(timers[0].remove).toHaveBeenCalledWith(false);
    expect(onAction).not.toHaveBeenCalled();
    expect(controller.isPending()).toBe(false);
  });

  it('does not act after the shootout is complete', () => {
    const scheduleTimer = vi.fn();
    const completeState: PenaltyShootoutState = {
      ...createShootout(),
      status: 'complete',
      winnerTeamId: 'fr'
    };
    const controller = new PenaltyAiController({
      getState: () => completeState,
      getControllerType: () => 'AI',
      random: () => 0,
      scheduleTimer,
      onAction: vi.fn()
    });

    controller.scheduleNextAction();

    expect(scheduleTimer).not.toHaveBeenCalled();
  });

  it('can drive an AI vs AI shootout to completion through public engine actions', () => {
    const state = completeStandaloneShootout('AI', 'AI');

    expect(state.status).toBe('complete');
    expect(state.winnerTeamId).toBeDefined();
  });

  it.each([
    ['HUMAN vs HUMAN', 'HUMAN', 'HUMAN'],
    ['HUMAN vs AI', 'HUMAN', 'AI'],
    ['AI vs HUMAN', 'AI', 'HUMAN'],
    ['AI vs AI', 'AI', 'AI']
  ] satisfies Array<[string, PlayerControllerType, PlayerControllerType]>)(
    'completes standalone penalty shootout for %s',
    (_label, homeControllerType, awayControllerType) => {
      const state = completeStandaloneShootout(homeControllerType, awayControllerType);

      expect(state.status).toBe('complete');
      expect(state.winnerTeamId).toBeDefined();
      expect(state.kicks.length).toBeGreaterThanOrEqual(6);
    }
  );

  it('continues an AI vs AI tied extra series without hanging', () => {
    const state = completeAiShootoutFromState(createTiedExtraSeriesState());

    expect(state.status).toBe('complete');
    expect(state.winnerTeamId).toBeDefined();
    expect(state.kicks.length).toBe(12);
  });
});

function applyPenaltyAiAction(state: PenaltyShootoutState, action: PenaltyAiAction): PenaltyShootoutState {
  if (action.type === 'DRAW_GOALKEEPER_CARD') {
    return drawPenaltyGoalkeeperCard(state);
  }

  return takePenaltyKick(revealPenaltyAttackCard(state, action.cardIndex));
}

function completeStandaloneShootout(
  homeControllerType: PlayerControllerType,
  awayControllerType: PlayerControllerType
): PenaltyShootoutState {
  let state = createShootout();
  const timers: FakeTimer[] = [];
  const controller = new PenaltyAiController({
    getState: () => state,
    getControllerType: (side) => (side === 'home' ? homeControllerType : awayControllerType),
    random: () => 0,
    scheduleTimer: (_delayMs, callback) => {
      const timer = createFakeTimer(callback);
      timers.push(timer);
      return timer;
    },
    onAction: (action) => {
      state = applyPenaltyAiAction(state, action);
    }
  });

  for (let index = 0; index < 80 && state.status !== 'complete'; index += 1) {
    controller.scheduleNextAction();
    const timer = timers.shift();

    if (timer !== undefined) {
      timer.run();
    } else {
      state = applyHumanPenaltyAction(state);
    }
  }

  controller.destroy();
  return state;
}

function applyHumanPenaltyAction(state: PenaltyShootoutState): PenaltyShootoutState {
  if (state.phase === 'selecting-goalkeeper') {
    return drawPenaltyGoalkeeperCard(state);
  }

  if (state.phase === 'selecting-attacker') {
    return revealPenaltyAttackCard(state, 0);
  }

  return takePenaltyKick(state);
}

function completeAiShootoutFromState(initialState: PenaltyShootoutState): PenaltyShootoutState {
  let state = initialState;
  const timers: FakeTimer[] = [];
  const controller = new PenaltyAiController({
    getState: () => state,
    getControllerType: () => 'AI',
    random: () => 0,
    scheduleTimer: (_delayMs, callback) => {
      const timer = createFakeTimer(callback);
      timers.push(timer);
      return timer;
    },
    onAction: (action) => {
      state = applyPenaltyAiAction(state, action);
    }
  });

  for (let index = 0; index < 12 && state.status !== 'complete'; index += 1) {
    controller.scheduleNextAction();
    timers.shift()?.run();
  }

  controller.destroy();
  return state;
}

function createTiedExtraSeriesState(): PenaltyShootoutState {
  const state = createShootout();

  return {
    ...state,
    phase: 'selecting-goalkeeper',
    nextShooter: 'home',
    currentGoalkeeperRank: null,
    revealedAttackerCardIndex: null,
    homeGoals: 5,
    awayGoals: 5,
    homeKicks: 5,
    awayKicks: 5,
    homeDeck: [],
    awayDeck: [],
    homeAvailableCards: ['A'],
    awayAvailableCards: ['2'],
    goalkeeperDeck: ['3', 'A'],
    kicks: Array.from({ length: 10 }, (_value, index) => ({
      shooterTeamId: index % 2 === 0 ? state.homeTeamId : state.awayTeamId,
      attackerRank: 'A',
      goalkeeperRank: '3',
      outcome: 'goal'
    }))
  };
}

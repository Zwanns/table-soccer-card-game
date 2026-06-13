import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AI_TIMING, AiTurnController, type AiAction, type AiScheduledTimer } from '../ai';
import { GoalkeeperDeck, type Card, type CardRank, type Deck, type GoalkeeperCard, type GoalkeeperRank } from '../cards';
import {
  createEmptyField,
  createMatchTeamSetup,
  GameEngine,
  type GamePhase,
  type GameState,
  type Player
} from '../game';
import { createDefaultSquad } from '../data/defaultSquads';

type ScheduledCall = {
  delayMs: number;
  callback: () => void;
  removed: boolean;
};

class FakeScheduler {
  public readonly calls: ScheduledCall[] = [];

  public schedule(delayMs: number, callback: () => void): AiScheduledTimer {
    const call: ScheduledCall = {
      delayMs,
      callback,
      removed: false
    };

    this.calls.push(call);

    return {
      remove: () => {
        call.removed = true;
      }
    };
  }

  public run(index = 0): void {
    const call = this.calls[index];

    if (call !== undefined && !call.removed) {
      call.callback();
    }
  }
}

function card(rank: CardRank, id: string = rank): Card {
  return {
    id: `AI_TURN_${id}`,
    rank,
    color: rank === 'JOKER' ? 'JOKER' : 'RED',
    suit: rank === 'JOKER' ? null : 'HEARTS'
  };
}

function goalkeeperCard(rank: GoalkeeperRank): GoalkeeperCard {
  return {
    id: `AI_TURN_GK_${rank}`,
    kind: 'goalkeeper',
    rank
  };
}

function deck(ranks: CardRank[] = ['2', '3', '4']): Deck {
  return {
    cards: ranks.map((rank, index) => card(rank, `${rank}_${index}`))
  };
}

function player(id: Player['id']): Player {
  return {
    id,
    name: id,
    flagCode: id === 'PLAYER_1' ? 'fr' : 'es',
    teamColor: id === 'PLAYER_1' ? 'RED' : 'BLACK',
    goals: 0,
    deck: deck(),
    goalkeeperDeck: new GoalkeeperDeck([goalkeeperCard('6')]),
    field: createEmptyField()
  };
}

function state(phase: GamePhase = 'WAITING_FOR_ATTACK_CARD', aiPlayerId: Player['id'] = 'PLAYER_1'): GameState {
  const players: [Player, Player] = [player('PLAYER_1'), player('PLAYER_2')];

  return {
    players,
    matchSetups: {
      PLAYER_1: createMatchTeamSetup({
        teamId: 'fr',
        squad: createDefaultSquad('fr'),
        goalkeeperKitId: 'gk1',
        controllerType: aiPlayerId === 'PLAYER_1' ? 'AI' : 'HUMAN'
      }),
      PLAYER_2: createMatchTeamSetup({
        teamId: 'es',
        squad: createDefaultSquad('es'),
        goalkeeperKitId: 'gk2',
        controllerType: aiPlayerId === 'PLAYER_2' ? 'AI' : 'HUMAN'
      })
    },
    activePlayerId: 'PLAYER_1',
    phase,
    attackCard: null,
    currentAttackCardSource: null,
    currentAttackingMidfielderPositionId: null,
    attackBank: [],
    legalTargetPositionIds: [],
    committableMidfielderPositionIds: [],
    committedMidfielderPositionIds: [],
    legalMidfieldGapPositionIds: [],
    counterattackMidfieldGap: null,
    winnerId: null,
    isDraw: false,
    turnNumber: 1,
    log: []
  };
}

function createController(
  gameState: GameState,
  executeAction: (action: AiAction) => void,
  scheduler = new FakeScheduler()
): { controller: AiTurnController; scheduler: FakeScheduler; actions: AiAction[] } {
  const actions: AiAction[] = [];
  const controller = new AiTurnController({
    getState: () => gameState,
    getMatchSeed: () => 'ai-turn-test',
    executeAction: (action) => {
      actions.push(action);
      executeAction(action);
    },
    scheduleDelayedCall: (delayMs, callback) => scheduler.schedule(delayMs, callback),
    timingJitterMs: 0
  });

  return { controller, scheduler, actions };
}

describe('AiTurnController', () => {
  it('does not schedule actions for HUMAN players or unsupported phases', () => {
    const humanState = state('WAITING_FOR_ATTACK_CARD', 'PLAYER_2');
    const endingState = state('ENDING_TURN');
    const humanSetup = createController(humanState, () => undefined);
    const endingSetup = createController(endingState, () => undefined);

    humanSetup.controller.requestTurnCheck();
    endingSetup.controller.requestTurnCheck();

    expect(humanSetup.scheduler.calls).toHaveLength(0);
    expect(endingSetup.scheduler.calls).toHaveLength(0);
  });

  it('schedules and executes one AI action through the supplied action pipeline', () => {
    const gameState = state('WAITING_FOR_ATTACK_CARD');
    const { controller, scheduler, actions } = createController(gameState, () => undefined);

    controller.requestTurnCheck('TURN_STARTED');

    expect(scheduler.calls).toHaveLength(1);
    expect(scheduler.calls[0].delayMs).toBe(AI_TIMING.afterTurnStartMs);

    scheduler.run();

    expect(actions).toEqual([{ type: 'DRAW_FROM_DECK' }]);
  });

  it('does not leave two pending AI timers for the same stable state', () => {
    const gameState = state('WAITING_FOR_ATTACK_CARD');
    const { controller, scheduler } = createController(gameState, () => undefined);

    controller.requestTurnCheck();
    controller.requestTurnCheck();

    expect(scheduler.calls).toHaveLength(1);
    expect(scheduler.calls[0].delayMs).toBe(AI_TIMING.beforeSourceChoiceMs);
  });

  it('clears a pending timer on dispose and does not act after shutdown', () => {
    const gameState = state('WAITING_FOR_ATTACK_CARD');
    const { controller, scheduler, actions } = createController(gameState, () => undefined);

    controller.requestTurnCheck();
    controller.dispose();
    scheduler.run();

    expect(scheduler.calls[0].removed).toBe(true);
    expect(actions).toEqual([]);
  });

  it('re-checks after a synchronous render requested during action execution', () => {
    const gameState = state('WAITING_FOR_ATTACK_CARD');
    const scheduler = new FakeScheduler();
    let controller: AiTurnController;
    const actions: AiAction[] = [];

    controller = new AiTurnController({
      getState: () => gameState,
      getMatchSeed: () => 'ai-turn-test',
      executeAction: (action) => {
        actions.push(action);

        if (action.type === 'DRAW_FROM_DECK') {
          gameState.phase = 'WAITING_FOR_TARGET';
          gameState.attackCard = card('A', 'ATTACK');
          gameState.currentAttackCardSource = 'DECK';
          gameState.players[1].field['midfielder-1'] = card('6', 'TARGET');
          gameState.legalTargetPositionIds = ['midfielder-1'];
          controller.requestTurnCheck();
        }
      },
      scheduleDelayedCall: (delayMs, callback) => scheduler.schedule(delayMs, callback),
      timingJitterMs: 0
    });

    controller.requestTurnCheck();
    scheduler.run(0);

    expect(scheduler.calls).toHaveLength(2);
    expect(scheduler.calls[1].delayMs).toBe(AI_TIMING.beforeTargetChoiceMs);

    scheduler.run(1);

    expect(actions).toEqual([
      { type: 'DRAW_FROM_DECK' },
      { type: 'SELECT_TARGET', positionId: 'midfielder-1' }
    ]);
  });

  it('does not execute a queued timer after the game reaches GAME_OVER', () => {
    const gameState = state('WAITING_FOR_ATTACK_CARD');
    const { controller, scheduler, actions } = createController(gameState, () => undefined);

    controller.requestTurnCheck();
    gameState.phase = 'GAME_OVER';
    scheduler.run();

    expect(actions).toEqual([]);
  });

  it('does not schedule a new AI action while the scene is resolving a goal effect', () => {
    const gameState = state('WAITING_FOR_ATTACK_CARD');
    const scheduler = new FakeScheduler();
    let sceneStable = false;
    const actions: AiAction[] = [];
    const controller = new AiTurnController({
      getState: () => gameState,
      getMatchSeed: () => 'ai-turn-test',
      canAct: () => sceneStable,
      executeAction: (action) => {
        actions.push(action);
      },
      scheduleDelayedCall: (delayMs, callback) => scheduler.schedule(delayMs, callback),
      timingJitterMs: 0
    });

    controller.requestTurnCheck();

    expect(scheduler.calls).toHaveLength(0);

    sceneStable = true;
    controller.requestTurnCheck();
    scheduler.run();

    expect(actions).toEqual([{ type: 'DRAW_FROM_DECK' }]);
  });

  it('drops a queued AI timer if a goal effect starts before the timer fires', () => {
    const gameState = state('WAITING_FOR_ATTACK_CARD');
    const scheduler = new FakeScheduler();
    let sceneStable = true;
    const actions: AiAction[] = [];
    const controller = new AiTurnController({
      getState: () => gameState,
      getMatchSeed: () => 'ai-turn-test',
      canAct: () => sceneStable,
      executeAction: (action) => {
        actions.push(action);
      },
      scheduleDelayedCall: (delayMs, callback) => scheduler.schedule(delayMs, callback),
      timingJitterMs: 0
    });

    controller.requestTurnCheck();
    sceneStable = false;
    scheduler.run();

    expect(actions).toEqual([]);
  });

  it('can drive an AI vs AI game through the public game action pipeline until GAME_OVER', () => {
    const engine = new GameEngine();
    engine.startNewGame({
      seed: 'ai-vs-ai-turn-controller',
      player1ControllerType: 'AI',
      player2ControllerType: 'AI'
    });
    engine.startNextTurn();

    const scheduler = new FakeScheduler();
    const actions: AiAction[] = [];
    const controller = new AiTurnController({
      getState: () => engine.getState(),
      getMatchSeed: () => 'ai-vs-ai-turn-controller',
      executeAction: (action) => {
        actions.push(action);
        executeEngineAction(engine, action);
        requestNextStableCheck(engine, controller);
      },
      scheduleDelayedCall: (delayMs, callback) => scheduler.schedule(delayMs, callback),
      timingJitterMs: 0
    });

    controller.requestTurnCheck('TURN_STARTED');

    for (let callIndex = 0; callIndex < 2000 && engine.getState().phase !== 'GAME_OVER'; callIndex += 1) {
      expect(scheduler.calls[callIndex], `Expected AI timer ${callIndex} to be scheduled.`).toBeDefined();
      scheduler.run(callIndex);
    }

    expect(engine.getState().phase).toBe('GAME_OVER');
    expect(actions.length).toBeGreaterThan(0);
  });

  it('can run HUMAN vs AI and AI vs HUMAN matches through the public game action pipeline until GAME_OVER', () => {
    const humanVsAi = drivePublicPipelineMatch('HUMAN', 'AI', 'human-vs-ai-turn-controller');
    const aiVsHuman = drivePublicPipelineMatch('AI', 'HUMAN', 'ai-vs-human-turn-controller');

    expect(humanVsAi.finalPhase).toBe('GAME_OVER');
    expect(humanVsAi.aiActions.length).toBeGreaterThan(0);
    expect(humanVsAi.humanActions.length).toBeGreaterThan(0);
    expect(aiVsHuman.finalPhase).toBe('GAME_OVER');
    expect(aiVsHuman.aiActions.length).toBeGreaterThan(0);
    expect(aiVsHuman.humanActions.length).toBeGreaterThan(0);
  });

  it('integrates with GameScene only after stable renders and disables field input during AI turns', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');

    expect(source).toContain('const gameInteractive = interactive && !(this.aiTurnController?.isAiTurn(state) ?? false)');
    expect(source).toContain('canAct: () => this.isSceneStableForAi()');
    expect(source).toContain('if (interactive && this.isSceneStableForAi())');
    expect(source).toContain('this.aiTurnController?.requestTurnCheck(options.aiCheckReason)');
    expect(source).toContain('private isSceneStableForAi(): boolean');
    expect(source).toContain('!this.isAttackAnimationInProgress');
    expect(source).toContain('!this.isRestoreAnimationInProgress');
    expect(source).toContain('!this.isMatchEffectInProgress');
  });
});

function executeEngineAction(engine: GameEngine, action: AiAction): void {
  switch (action.type) {
    case 'DRAW_FROM_DECK':
      engine.drawAttackCard();
      return;
    case 'COMMIT_MIDFIELDER':
      engine.commitMidfielder(action.positionId);
      return;
    case 'SELECT_TARGET':
      engine.selectTarget(action.positionId);
      return;
    case 'SELECT_MIDFIELD_GAP':
      engine.useMidfieldGap(action.positionId);
      return;
  }
}

function requestNextStableCheck(engine: GameEngine, controller: AiTurnController): void {
  let state = engine.getState();

  while (state.phase === 'ENDING_TURN') {
    state = engine.startNextTurn();
  }

  if (state.phase !== 'GAME_OVER') {
    controller.requestTurnCheck(state.phase === 'WAITING_FOR_ATTACK_CARD' ? 'TURN_STARTED' : 'STATE_RENDERED');
  }
}

function drivePublicPipelineMatch(
  player1ControllerType: 'HUMAN' | 'AI',
  player2ControllerType: 'HUMAN' | 'AI',
  seed: string
): { finalPhase: GamePhase; aiActions: AiAction[]; humanActions: string[] } {
  const engine = new GameEngine();
  engine.startNewGame({
    seed,
    player1ControllerType,
    player2ControllerType
  });
  engine.startNextTurn();

  const scheduler = new FakeScheduler();
  const aiActions: AiAction[] = [];
  const humanActions: string[] = [];
  let nextTimerIndex = 0;
  const controller = new AiTurnController({
    getState: () => engine.getState(),
    getMatchSeed: () => seed,
    executeAction: (action) => {
      aiActions.push(action);
      executeEngineAction(engine, action);
      requestNextStableCheck(engine, controller);
    },
    scheduleDelayedCall: (delayMs, callback) => scheduler.schedule(delayMs, callback),
    timingJitterMs: 0
  });

  requestNextStableCheck(engine, controller);

  for (let stepIndex = 0; stepIndex < 1500 && engine.getState().phase !== 'GAME_OVER'; stepIndex += 1) {
    const state = settleEndingTurns(engine);

    if (state.phase === 'GAME_OVER') {
      break;
    }

    const activePlayerId = state.activePlayerId;
    expect(activePlayerId).not.toBeNull();

    if (activePlayerId !== null && state.matchSetups[activePlayerId].controllerType === 'AI') {
      expect(scheduler.calls[nextTimerIndex], `Expected AI timer ${nextTimerIndex} to be scheduled.`).toBeDefined();
      scheduler.run(nextTimerIndex);
      nextTimerIndex += 1;
      continue;
    }

    humanActions.push(executeHumanAction(engine));
    requestNextStableCheck(engine, controller);
  }

  return {
    finalPhase: engine.getState().phase,
    aiActions,
    humanActions
  };
}

function settleEndingTurns(engine: GameEngine): Readonly<GameState> {
  let state = engine.getState();

  while (state.phase === 'ENDING_TURN') {
    state = engine.startNextTurn();
  }

  return state;
}

function executeHumanAction(engine: GameEngine): string {
  const state = engine.getState();

  if (state.phase === 'WAITING_FOR_ATTACK_CARD') {
    engine.drawAttackCard();
    return 'DRAW_FROM_DECK';
  }

  if (state.phase === 'WAITING_FOR_TARGET') {
    const gapPositionId = state.legalMidfieldGapPositionIds?.[0];

    if (gapPositionId !== undefined) {
      engine.useMidfieldGap(gapPositionId);
      return `SELECT_MIDFIELD_GAP:${gapPositionId}`;
    }

    const targetPositionId = state.legalTargetPositionIds[0];
    expect(targetPositionId).toBeDefined();
    engine.selectTarget(targetPositionId);
    return `SELECT_TARGET:${targetPositionId}`;
  }

  throw new Error(`Unexpected HUMAN action phase "${state.phase}".`);
}

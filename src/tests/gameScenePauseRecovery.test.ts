import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class Scene {}
  class Container {}
  class Vector2 {
    public x: number;
    public y: number;

    public constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    public lengthSq(): number {
      return this.x * this.x + this.y * this.y;
    }

    public normalize(): this {
      return this;
    }
  }

  return {
    default: {
      Scene,
      GameObjects: {
        Container,
        Events: { DESTROY: 'destroy' }
      },
      Loader: { Events: { FILE_LOAD_ERROR: 'fileloaderror' } },
      Scenes: { Events: { SHUTDOWN: 'shutdown' } },
      Math: {
        Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
        DegToRad: (degrees: number) => degrees * Math.PI / 180,
        Linear: (start: number, end: number, amount: number) => start + (end - start) * amount,
        Vector2
      }
    }
  };
});

import { GoalkeeperDeck, type Card, type CardRank, type Deck, type GoalkeeperCard } from '../cards';
import { createDefaultSquad } from '../data/defaultSquads';
import {
  createEmptyField,
  createMatchTeamSetup,
  GameEngine,
  type GameState,
  type MidfielderPositionId,
  type Player
} from '../game';
import { GameScene } from '../scenes/GameScene';
import { QUICK_MATCH_CONTEXT, type MatchLaunchContext } from '../tournament';

interface GameplayActions {
  deck?: () => void;
  midfielder?: (positionId: MidfielderPositionId) => void;
  target?: (positionId: string) => void;
}

interface PauseRecoveryHarness {
  actions(): GameplayActions;
  engine: GameEngine;
  internal: Record<string, any>;
  render: ((state?: Readonly<GameState>) => void) & { mockClear(): void };
}

function card(rank: CardRank, id: string): Card {
  return {
    id,
    rank,
    color: rank === 'JOKER' ? 'JOKER' : 'RED',
    suit: rank === 'JOKER' ? null : 'HEARTS'
  };
}

function deck(ranks: readonly CardRank[], prefix: string): Deck {
  return {
    cards: ranks.map((rank, index) => card(rank, `${prefix}_${rank}_${index}`))
  };
}

function goalkeeper(rank: GoalkeeperCard['rank'] = '3'): GoalkeeperCard {
  return { id: `GK_${rank}`, kind: 'goalkeeper', rank };
}

function player(id: 'PLAYER_1' | 'PLAYER_2', ranks: readonly CardRank[]): Player {
  return {
    id,
    name: id,
    flagCode: id === 'PLAYER_1' ? 'fr' : 'es',
    teamColor: id === 'PLAYER_1' ? 'RED' : 'BLACK',
    goals: 0,
    deck: deck(ranks, id),
    goalkeeperDeck: new GoalkeeperDeck([goalkeeper('3'), goalkeeper('4')]),
    field: createEmptyField()
  };
}

function createState(playerOneDeck: readonly CardRank[] = ['7', '8'], playerTwoDeck: readonly CardRank[] = ['9']): GameState {
  const players: [Player, Player] = [player('PLAYER_1', playerOneDeck), player('PLAYER_2', playerTwoDeck)];

  return {
    players,
    matchSetups: {
      PLAYER_1: createMatchTeamSetup({
        teamId: 'fr',
        squad: createDefaultSquad('fr'),
        goalkeeperKitId: 'gk1'
      }),
      PLAYER_2: createMatchTeamSetup({
        teamId: 'es',
        squad: createDefaultSquad('es'),
        goalkeeperKitId: 'gk2'
      })
    },
    activePlayerId: 'PLAYER_1',
    phase: 'ENDING_TURN',
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
    turnNumber: 0,
    log: []
  };
}

function fillActiveField(state: GameState): void {
  const field = state.players[0].field;
  field.goalkeeper = goalkeeper();
  field['defender-1'] = card('3', 'P1_D1');
  field['defender-2'] = card('4', 'P1_D2');
  field['midfielder-1'] = card('5', 'P1_M1');
  field['midfielder-2'] = card('6', 'P1_M2');
  field['midfielder-3'] = card('7', 'P1_M3');
}

function fillOpponentField(state: GameState): void {
  const field = state.players[1].field;
  field.goalkeeper = goalkeeper('4');
  field['defender-1'] = card('8', 'P2_D1');
  field['defender-2'] = card('9', 'P2_D2');
  field['midfielder-1'] = card('3', 'P2_M1');
  field['midfielder-2'] = card('10', 'P2_M2');
  field['midfielder-3'] = card('Q', 'P2_M3');
}

function createWaitingEngine(ranks: readonly CardRank[] = ['7', '8']): GameEngine {
  const state = createState(ranks);
  fillActiveField(state);
  state.players[1].field['midfielder-1'] = card('3', 'P2_M1_DEFAULT');
  const engine = new GameEngine(state);
  expect(engine.startNextTurn().phase).toBe('WAITING_FOR_ATTACK_CARD');
  return engine;
}

function createNoCardsTransitionEngine(): GameEngine {
  const state = createState(['7'], ['9', '10']);
  fillActiveField(state);
  fillOpponentField(state);
  const engine = new GameEngine(state);
  engine.startNextTurn();
  engine.drawAttackCard();
  const endingState = engine.selectTarget('midfielder-1');

  expect(endingState.phase).toBe('ENDING_TURN');
  expect(endingState.log).toContainEqual(expect.objectContaining({ type: 'ATTACK_DECK_EMPTY' }));
  return engine;
}

function createHarness(
  engine: GameEngine,
  launchContext: MatchLaunchContext = QUICK_MATCH_CONTEXT
): PauseRecoveryHarness {
  const scene = Object.create(GameScene.prototype) as GameScene;
  const internal = scene as unknown as Record<string, any>;
  let actions: GameplayActions = {};

  Object.assign(internal, {
    engine,
    input: { enabled: true },
    launchContext,
    matchMode: 'quick',
    tutorialController: null,
    tutorialOverlay: null,
    aiTurnController: null,
    scene: { start: vi.fn() },
    pauseModal: null,
    exitConfirmModal: null,
    infoModal: null,
    activeInfoModal: null,
    matchFinishedModal: null,
    message: null,
    isGameplayReady: true,
    isInitialDealStarted: true,
    isInitialDealComplete: true,
    isAutomaticCardFlowInProgress: false,
    isAutomaticCardFlowPaused: false,
    isNavigationAwayInProgress: false,
    isSceneShutDown: false,
    isMatchFinishedModalOpen: false,
    isMatchFinishedResultPending: false,
    matchFinishedPendingResultState: null,
    isAttackAnimationInProgress: false,
    isRestoreAnimationInProgress: false,
    isMatchEffectInProgress: false,
    cardRestoreFlowId: 1,
    pendingCardRestoreCallbacks: new Set(),
    activeCardRestoreTweens: new Set(),
    activeCardRestoreCards: new Set(),
    createAttackAnimationContext: () => null,
    createMidfielderCommitAnimationContext: () => null,
    handleSelectedTargetState: (state: Readonly<GameState>) => internal.render(state)
  });

  const render = vi.fn((state: Readonly<GameState> = engine.getState()) => {
    actions = {};

    if (!internal.canAcceptGameplayInput()) {
      return;
    }

    if (state.phase === 'WAITING_FOR_ATTACK_CARD') {
      actions.deck = () => internal.drawAttackCard();
      actions.midfielder = (positionId) => internal.commitMidfielder(positionId);
    }

    if (state.phase === 'WAITING_FOR_TARGET') {
      actions.target = (positionId) => internal.selectTarget(positionId);
    }
  });
  internal.render = render;

  return { actions: () => actions, engine, internal, render };
}

function renderNonInteractiveSnapshotUnderPause(harness: PauseRecoveryHarness): () => void {
  const destroy = vi.fn();
  harness.internal.pauseModal = { destroy };
  harness.render(harness.engine.getState());
  expect(harness.actions()).toEqual({});
  return destroy;
}

function continueMatch(harness: PauseRecoveryHarness): void {
  harness.internal.closePauseModal();
}

function openExitConfirmationFromPause(harness: PauseRecoveryHarness): {
  exitDestroy: ReturnType<typeof vi.fn>;
  pauseDestroy: ReturnType<typeof vi.fn>;
} {
  const pauseDestroy = vi.fn();
  const exitDestroy = vi.fn();
  harness.internal.pauseModal = { destroy: pauseDestroy };

  harness.internal.closePauseModal({ resumeAutomaticCardFlow: false });
  expect(harness.internal.pauseModal).toBeNull();
  expect(pauseDestroy).toHaveBeenCalledOnce();

  harness.internal.exitConfirmModal = { destroy: exitDestroy };
  return { exitDestroy, pauseDestroy };
}

function stayInNormalMatch(harness: PauseRecoveryHarness): void {
  harness.internal.closeExitConfirmModal({ refreshGameplay: true });
}

describe('GameScene Pause gameplay recovery', () => {
  it.each([
    ['Quick Match', QUICK_MATCH_CONTEXT],
    [
      'Tournament Match',
      { mode: 'tournament', tournamentId: 'cup-1', tournamentMatchId: 'group-A-1' } satisfies MatchLaunchContext
    ]
  ])('restores a real WAITING_FOR_ATTACK_CARD deck action in %s', (_label, launchContext) => {
    const harness = createHarness(createWaitingEngine(), launchContext);
    const destroy = renderNonInteractiveSnapshotUnderPause(harness);
    const beforeLogLength = harness.engine.getState().log.length;
    const beforeDeckSize = harness.engine.getState().players[0].deck.cards.length;

    continueMatch(harness);

    expect(destroy).toHaveBeenCalledOnce();
    expect(harness.actions().deck).toBeTypeOf('function');
    harness.actions().deck?.();
    expect(harness.engine.getState().log.length).toBeGreaterThan(beforeLogLength);
    expect(harness.engine.getState().log).toContainEqual(
      expect.objectContaining({ type: 'ATTACK_CARD_DRAWN', playerId: 'PLAYER_1' })
    );
    expect(harness.engine.getState().players[0].deck.cards).toHaveLength(beforeDeckSize - 1);
  });

  it('restores a real legal field target action after the modal-time render', () => {
    const engine = createWaitingEngine(['7', '8']);
    engine.getState().players[1].field['midfielder-1'] = card('6', 'P2_M1');
    expect(engine.drawAttackCard().phase).toBe('WAITING_FOR_TARGET');
    const harness = createHarness(engine);
    renderNonInteractiveSnapshotUnderPause(harness);

    continueMatch(harness);

    expect(harness.actions().target).toBeTypeOf('function');
    harness.actions().target?.('midfielder-1');
    expect(engine.getState().players[1].field['midfielder-1']).toBeNull();
    expect(engine.getState().log).toContainEqual(
      expect.objectContaining({ type: 'CARD_DEFEATED', positionId: 'midfielder-1' })
    );
  });

  it('restores a real legal Joker midfielder action after Continue', () => {
    const engine = createWaitingEngine(['8', '9']);
    engine.getState().players[0].field['midfielder-1'] = card('JOKER', 'P1_JOKER');
    engine.getState().players[1].field['midfielder-1'] = card('10', 'P2_10');
    expect(engine.canCommitMidfielder('midfielder-1')).toBe(true);
    const harness = createHarness(engine);
    renderNonInteractiveSnapshotUnderPause(harness);

    continueMatch(harness);

    expect(harness.actions().midfielder).toBeTypeOf('function');
    harness.actions().midfielder?.('midfielder-1');
    expect(engine.getState().players[0].field['midfielder-1']).toBeNull();
    expect(engine.getState().players[1].field['midfielder-1']).toBeNull();
    expect(engine.getState().log).toContainEqual(
      expect.objectContaining({ type: 'MIDFIELDER_COMMITTED', positionId: 'midfielder-1' })
    );
  });

  it('recovers when an inter-turn flying-message callback starts and renders the next turn under Pause', () => {
    const state = createState(['7', '8']);
    fillActiveField(state);
    const engine = new GameEngine(state);
    const harness = createHarness(engine);
    harness.internal.pauseModal = { destroy: vi.fn() };

    const completeFlyingMessage = (): void => {
      const nextState = engine.startNextTurn();
      harness.render(nextState);
    };
    completeFlyingMessage();

    expect(engine.getState().phase).toBe('WAITING_FOR_ATTACK_CARD');
    expect(harness.actions()).toEqual({});
    continueMatch(harness);
    harness.actions().deck?.();
    expect(engine.getState().log).toContainEqual(expect.objectContaining({ type: 'ATTACK_CARD_DRAWN' }));
  });

  it('keeps recovery guarded while a paused restore flow is active, then enables gameplay on its final render', () => {
    const engine = createNoCardsTransitionEngine();
    const harness = createHarness(engine);
    harness.internal.pauseModal = { destroy: vi.fn() };
    const restoredState = engine.startNextTurn();
    expect(restoredState.log).toContainEqual(expect.objectContaining({ type: 'FIELD_CARD_RESTORED' }));
    harness.internal.isAutomaticCardFlowInProgress = true;
    harness.internal.isAutomaticCardFlowPaused = true;
    harness.internal.isRestoreAnimationInProgress = true;
    harness.internal.isGameplayReady = false;
    harness.render(restoredState);
    expect(harness.actions()).toEqual({});

    continueMatch(harness);

    expect(harness.internal.isAutomaticCardFlowPaused).toBe(false);
    expect(harness.actions()).toEqual({});
    harness.internal.completeAutomaticCardFlow(1);
    harness.internal.markInitialDealComplete();
    harness.render(harness.engine.getState());
    expect(harness.actions().deck).toBeTypeOf('function');
  });

  it('immediately recovers when the no-cards/restore transition finished under Pause', () => {
    const engine = createNoCardsTransitionEngine();
    const harness = createHarness(engine);
    harness.internal.pauseModal = { destroy: vi.fn() };
    const restoredState = engine.startNextTurn();
    expect(restoredState.log).toContainEqual(expect.objectContaining({ type: 'FIELD_CARD_RESTORED' }));
    harness.internal.isAutomaticCardFlowInProgress = false;
    harness.internal.isAutomaticCardFlowPaused = false;
    harness.internal.isRestoreAnimationInProgress = false;
    harness.internal.isGameplayReady = true;
    harness.render(restoredState);
    expect(harness.actions()).toEqual({});

    continueMatch(harness);

    harness.actions().deck?.();
    expect(harness.engine.getState().log).toContainEqual(expect.objectContaining({ type: 'ATTACK_CARD_DRAWN' }));
  });

  it('survives repeated Pause and Continue cycles without a duplicate engine action', () => {
    const harness = createHarness(createWaitingEngine());
    renderNonInteractiveSnapshotUnderPause(harness);
    continueMatch(harness);
    renderNonInteractiveSnapshotUnderPause(harness);
    continueMatch(harness);
    const draw = harness.actions().deck;
    const beforeDrawEvents = harness.engine.getState().log.filter((event) => event.type === 'ATTACK_CARD_DRAWN').length;

    draw?.();

    expect(harness.engine.getState().log.filter((event) => event.type === 'ATTACK_CARD_DRAWN')).toHaveLength(
      beforeDrawEvents + 1
    );
  });

  it('uses the same recovery render when Android Back closes Pause', () => {
    const harness = createHarness(createWaitingEngine());
    renderNonInteractiveSnapshotUnderPause(harness);

    harness.internal.handleAndroidBackButton();

    expect(harness.internal.pauseModal).toBeNull();
    harness.actions().deck?.();
    expect(harness.engine.getState().log).toContainEqual(expect.objectContaining({ type: 'ATTACK_CARD_DRAWN' }));
  });

  it('does not render when cleanup closes Pause without resuming gameplay', () => {
    const harness = createHarness(createWaitingEngine());
    const destroy = renderNonInteractiveSnapshotUnderPause(harness);
    harness.render.mockClear();

    harness.internal.closePauseModal({ resumeAutomaticCardFlow: false });

    expect(destroy).toHaveBeenCalledOnce();
    expect(harness.render).not.toHaveBeenCalled();
  });

  it('does not render when closePauseModal is called without an open Pause', () => {
    const harness = createHarness(createWaitingEngine());

    harness.internal.closePauseModal();

    expect(harness.render).not.toHaveBeenCalled();
  });

  it.each([
    ['scene shutdown', 'isSceneShutDown'],
    ['navigation away', 'isNavigationAwayInProgress']
  ])('does not recovery-render during %s', (_label, lifecycleFlag) => {
    const harness = createHarness(createWaitingEngine());
    renderNonInteractiveSnapshotUnderPause(harness);
    harness.render.mockClear();
    harness.internal[lifecycleFlag] = true;

    continueMatch(harness);

    expect(harness.render).not.toHaveBeenCalled();
  });
});

describe('GameScene Exit confirmation gameplay recovery', () => {
  it.each([
    ['Quick Match', QUICK_MATCH_CONTEXT],
    [
      'Tournament Match',
      { mode: 'tournament', tournamentId: 'cup-1', tournamentMatchId: 'group-A-1' } satisfies MatchLaunchContext
    ]
  ])('restores a real WAITING_FOR_ATTACK_CARD deck action after Stay in %s', (_label, launchContext) => {
    const harness = createHarness(createWaitingEngine(), launchContext);
    const { exitDestroy } = openExitConfirmationFromPause(harness);
    const beforeLogLength = harness.engine.getState().log.length;
    const beforeDeckSize = harness.engine.getState().players[0].deck.cards.length;

    harness.render(harness.engine.getState());
    expect(harness.actions()).toEqual({});
    stayInNormalMatch(harness);

    expect(exitDestroy).toHaveBeenCalledOnce();
    expect(harness.internal.exitConfirmModal).toBeNull();
    harness.actions().deck?.();
    expect(harness.engine.getState().log.length).toBeGreaterThan(beforeLogLength);
    expect(harness.engine.getState().log).toContainEqual(
      expect.objectContaining({ type: 'ATTACK_CARD_DRAWN', playerId: 'PLAYER_1' })
    );
    expect(harness.engine.getState().players[0].deck.cards).toHaveLength(beforeDeckSize - 1);
  });

  it('restores a real legal field target action after Stay', () => {
    const engine = createWaitingEngine(['7', '8']);
    engine.getState().players[1].field['midfielder-1'] = card('6', 'P2_M1');
    expect(engine.drawAttackCard().phase).toBe('WAITING_FOR_TARGET');
    const harness = createHarness(engine);
    openExitConfirmationFromPause(harness);
    harness.render(engine.getState());
    expect(harness.actions()).toEqual({});

    stayInNormalMatch(harness);
    harness.actions().target?.('midfielder-1');

    expect(engine.getState().players[1].field['midfielder-1']).toBeNull();
    expect(engine.getState().log).toContainEqual(
      expect.objectContaining({ type: 'CARD_DEFEATED', positionId: 'midfielder-1' })
    );
  });

  it('restores a real legal Joker midfielder action after Stay', () => {
    const engine = createWaitingEngine(['8', '9']);
    engine.getState().players[0].field['midfielder-1'] = card('JOKER', 'P1_JOKER');
    engine.getState().players[1].field['midfielder-1'] = card('10', 'P2_10');
    expect(engine.canCommitMidfielder('midfielder-1')).toBe(true);
    const harness = createHarness(engine);
    openExitConfirmationFromPause(harness);
    harness.render(engine.getState());
    expect(harness.actions()).toEqual({});

    stayInNormalMatch(harness);
    harness.actions().midfielder?.('midfielder-1');

    expect(engine.getState().players[0].field['midfielder-1']).toBeNull();
    expect(engine.getState().players[1].field['midfielder-1']).toBeNull();
    expect(engine.getState().log).toContainEqual(
      expect.objectContaining({ type: 'MIDFIELDER_COMMITTED', positionId: 'midfielder-1' })
    );
  });

  it('recovers when an inter-turn callback starts and renders the next turn under Exit confirmation', () => {
    const state = createState(['7', '8']);
    fillActiveField(state);
    const engine = new GameEngine(state);
    const harness = createHarness(engine);
    openExitConfirmationFromPause(harness);

    const completeFlyingMessage = (): void => {
      const nextState = engine.startNextTurn();
      harness.render(nextState);
    };
    completeFlyingMessage();

    expect(engine.getState().phase).toBe('WAITING_FOR_ATTACK_CARD');
    expect(harness.actions()).toEqual({});
    stayInNormalMatch(harness);
    harness.actions().deck?.();
    expect(engine.getState().log).toContainEqual(expect.objectContaining({ type: 'ATTACK_CARD_DRAWN' }));
  });

  it('keeps recovery guarded while a resumed restore flow is active, then enables gameplay on its final render', () => {
    const engine = createNoCardsTransitionEngine();
    const harness = createHarness(engine);
    openExitConfirmationFromPause(harness);
    const restoredState = engine.startNextTurn();
    expect(restoredState.log).toContainEqual(expect.objectContaining({ type: 'FIELD_CARD_RESTORED' }));
    harness.internal.isAutomaticCardFlowInProgress = true;
    harness.internal.isAutomaticCardFlowPaused = true;
    harness.internal.isRestoreAnimationInProgress = true;
    harness.internal.isGameplayReady = false;
    harness.render(restoredState);
    expect(harness.actions()).toEqual({});

    stayInNormalMatch(harness);

    expect(harness.internal.isAutomaticCardFlowPaused).toBe(false);
    expect(harness.actions()).toEqual({});
    harness.internal.completeAutomaticCardFlow(1);
    harness.internal.markInitialDealComplete();
    harness.render(engine.getState());
    expect(harness.actions().deck).toBeTypeOf('function');
  });

  it('immediately recovers when the restore transition finished under Exit confirmation', () => {
    const engine = createNoCardsTransitionEngine();
    const harness = createHarness(engine);
    openExitConfirmationFromPause(harness);
    const restoredState = engine.startNextTurn();
    expect(restoredState.log).toContainEqual(expect.objectContaining({ type: 'FIELD_CARD_RESTORED' }));
    harness.internal.isAutomaticCardFlowInProgress = false;
    harness.internal.isAutomaticCardFlowPaused = false;
    harness.internal.isRestoreAnimationInProgress = false;
    harness.internal.isGameplayReady = true;
    harness.render(restoredState);
    expect(harness.actions()).toEqual({});

    stayInNormalMatch(harness);
    harness.actions().deck?.();

    expect(engine.getState().log).toContainEqual(expect.objectContaining({ type: 'ATTACK_CARD_DRAWN' }));
  });

  it('survives repeated Pause, Exit, and Stay cycles without a duplicate engine action', () => {
    const harness = createHarness(createWaitingEngine());

    for (let cycle = 0; cycle < 3; cycle += 1) {
      openExitConfirmationFromPause(harness);
      harness.render(harness.engine.getState());
      expect(harness.actions()).toEqual({});
      stayInNormalMatch(harness);
    }

    const draw = harness.actions().deck;
    const beforeDrawEvents = harness.engine.getState().log.filter((event) => event.type === 'ATTACK_CARD_DRAWN').length;
    draw?.();

    expect(harness.engine.getState().log.filter((event) => event.type === 'ATTACK_CARD_DRAWN')).toHaveLength(
      beforeDrawEvents + 1
    );
    expect(harness.internal.pauseModal).toBeNull();
    expect(harness.internal.exitConfirmModal).toBeNull();
  });

  it('does not recovery-render before Confirm Exit starts Menu navigation', () => {
    const harness = createHarness(createWaitingEngine());
    openExitConfirmationFromPause(harness);
    harness.render.mockClear();

    harness.internal.exitToMainMenu();

    expect(harness.internal.isNavigationAwayInProgress).toBe(true);
    expect(harness.internal.scene.start).toHaveBeenCalledOnce();
    expect(harness.internal.scene.start).toHaveBeenCalledWith('MenuScene');
    expect(harness.render).not.toHaveBeenCalled();
  });

  it('keeps Tutorial Cancel on the current step without a gameplay recovery render', () => {
    const harness = createHarness(createWaitingEngine());
    const currentStep = { id: 'tutorial-step-7' };
    const continueTutorial = vi.fn();
    const recordAction = vi.fn();
    const tutorialOverlay = { destroy: vi.fn() };
    const exitDestroy = vi.fn();
    Object.assign(harness.internal, {
      matchMode: 'tutorial',
      tutorialController: {
        continue: continueTutorial,
        getCurrentStep: () => currentStep,
        isComplete: () => false,
        recordAction
      },
      tutorialOverlay,
      exitConfirmModal: { destroy: exitDestroy }
    });
    harness.render.mockClear();

    harness.internal.closeExitConfirmModal();

    expect(exitDestroy).toHaveBeenCalledOnce();
    expect(harness.internal.exitConfirmModal).toBeNull();
    expect(harness.internal.tutorialController.getCurrentStep()).toBe(currentStep);
    expect(harness.internal.tutorialOverlay).toBe(tutorialOverlay);
    expect(continueTutorial).not.toHaveBeenCalled();
    expect(recordAction).not.toHaveBeenCalled();
    expect(harness.internal.input.enabled).toBe(true);
    expect(harness.render).not.toHaveBeenCalled();
  });

  it('keeps Tutorial Android Back dismiss on the current step without a gameplay recovery render', () => {
    const harness = createHarness(createWaitingEngine());
    const currentStep = { id: 'tutorial-step-7' };
    const tutorialOverlay = { destroy: vi.fn() };
    const exitDestroy = vi.fn();
    Object.assign(harness.internal, {
      matchMode: 'tutorial',
      tutorialController: {
        continue: vi.fn(),
        getCurrentStep: () => currentStep,
        isComplete: () => false,
        recordAction: vi.fn()
      },
      tutorialOverlay,
      exitConfirmModal: { destroy: exitDestroy }
    });
    harness.render.mockClear();

    harness.internal.handleAndroidBackButton();

    expect(exitDestroy).toHaveBeenCalledOnce();
    expect(harness.internal.exitConfirmModal).toBeNull();
    expect(harness.internal.tutorialController.getCurrentStep()).toBe(currentStep);
    expect(harness.internal.tutorialOverlay).toBe(tutorialOverlay);
    expect(harness.internal.tutorialController.continue).not.toHaveBeenCalled();
    expect(harness.internal.tutorialController.recordAction).not.toHaveBeenCalled();
    expect(harness.render).not.toHaveBeenCalled();
  });
});

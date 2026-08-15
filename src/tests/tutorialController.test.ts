import { describe, expect, it } from 'vitest';
import type { CardRank } from '../cards';
import { GameEngine, getCurrentTargetLine, type FieldPositionId, type GameEvent, type GameState } from '../game';
import { TutorialController } from '../tutorial/TutorialController';
import {
  TUTORIAL_MATCH_V2_SETUP_PRESET,
  TUTORIAL_MATCH_V2_STEPS,
  TUTORIAL_MATCH_V2_TEAMS
} from '../tutorial/tutorialScenario';
import type { TutorialAction } from '../tutorial/tutorialTypes';

interface TutorialProgression {
  controller: TutorialController;
  engine: GameEngine;
  state: GameState;
}

type DefenderPositionId = 'defender-1' | 'defender-2';

function createTutorialProgression(): TutorialProgression {
  const engine = new GameEngine();
  let state = engine.startNewGame({
    ...TUTORIAL_MATCH_V2_TEAMS,
    setupPreset: TUTORIAL_MATCH_V2_SETUP_PRESET
  });

  state = engine.startNextTurn();

  return {
    controller: new TutorialController(TUTORIAL_MATCH_V2_STEPS),
    engine,
    state
  };
}

function drawThroughTutorial(progression: TutorialProgression): CardRank {
  const activePlayer = progression.state.players.find(
    (player) => player.id === progression.state.activePlayerId
  );
  const action: Extract<TutorialAction, { type: 'draw-attack-card' }> = {
    type: 'draw-attack-card',
    rank: activePlayer?.deck.cards[0]?.rank
  };

  expect(progression.controller.checkAction(action)).toEqual({ allowed: true });
  const previousLogLength = progression.state.log.length;
  progression.state = progression.engine.drawAttackCard();
  const drawnRank = progression.state.attackCard?.rank;

  expect(drawnRank).toBeDefined();
  progression.controller.recordAction({ type: 'draw-attack-card', rank: drawnRank });
  progression.controller.recordEvents(progression.state.log.slice(previousLogLength));

  return drawnRank!;
}

function selectTargetThroughTutorial(
  progression: TutorialProgression,
  positionId: FieldPositionId
): readonly GameEvent[] {
  const opponent = progression.state.players.find(
    (player) => player.id !== progression.state.activePlayerId
  );
  const action: Extract<TutorialAction, { type: 'select-target' }> = {
    type: 'select-target',
    positionId,
    rank: opponent?.field[positionId]?.rank
  };

  expect(progression.controller.checkAction(action)).toEqual({ allowed: true });
  const previousLogLength = progression.state.log.length;
  progression.state = progression.engine.selectTarget(positionId);
  const events = progression.state.log.slice(previousLogLength);
  progression.controller.recordAction(action);
  progression.controller.recordEvents(events);

  const currentOpponent = progression.state.players.find(
    (player) => player.id !== progression.state.activePlayerId
  );
  progression.controller.recordTargetLine(
    currentOpponent === undefined ? null : getCurrentTargetLine(currentOpponent.field)
  );

  return events;
}

function commitRightMidfielderThroughTutorial(progression: TutorialProgression): void {
  const activePlayer = progression.state.players.find(
    (player) => player.id === progression.state.activePlayerId
  );
  const action: Extract<TutorialAction, { type: 'commit-midfielder' }> = {
    type: 'commit-midfielder',
    positionId: 'midfielder-3',
    slot: 'right',
    rank: activePlayer?.field['midfielder-3']?.rank
  };

  expect(progression.engine.getCommittableMidfielderPositionIds()).toEqual(['midfielder-3']);
  expect(progression.controller.checkAction(action)).toEqual({ allowed: true });
  const previousLogLength = progression.state.log.length;
  progression.state = progression.engine.commitMidfielder('midfielder-3');
  progression.controller.recordAction(action);
  progression.controller.recordEvents(progression.state.log.slice(previousLogLength));

  const opponent = progression.state.players.find(
    (player) => player.id !== progression.state.activePlayerId
  );
  progression.controller.recordTargetLine(opponent === undefined ? null : getCurrentTargetLine(opponent.field));
}

function reachClearDefense(): TutorialProgression {
  const progression = createTutorialProgression();

  expect(progression.controller.continue()).toBe(true);
  expect(progression.controller.continue()).toBe(true);
  expect(drawThroughTutorial(progression)).toBe('9');
  selectTargetThroughTutorial(progression, 'midfielder-1');
  expect(progression.controller.getCurrentStep()?.id).toBe('turnover-rule');
  expect(progression.controller.continue()).toBe(true);
  expect(progression.controller.continue()).toBe(true);
  expect(drawThroughTutorial(progression)).toBe('6');
  selectTargetThroughTutorial(progression, 'midfielder-2');
  expect(progression.controller.getCurrentStep()?.id).toBe('clear-defense');

  return progression;
}

function completeClearDefense(
  progression: TutorialProgression,
  options: {
    useMidfielder: boolean;
    defenderOrder: readonly [DefenderPositionId, DefenderPositionId];
  }
): CardRank {
  if (options.useMidfielder) {
    commitRightMidfielderThroughTutorial(progression);
  } else {
    expect(drawThroughTutorial(progression)).toBe('10');
    selectTargetThroughTutorial(progression, 'midfielder-3');
  }

  for (const positionId of options.defenderOrder) {
    drawThroughTutorial(progression);
    selectTargetThroughTutorial(progression, positionId);
  }

  const activePlayer = progression.state.players.find(
    (player) => player.id === progression.state.activePlayerId
  );
  const opponent = progression.state.players.find(
    (player) => player.id !== progression.state.activePlayerId
  );
  const topRank = activePlayer?.deck.cards[0]?.rank;

  expect(progression.controller.getCurrentStep()?.id).toBe('goalkeeper');
  expect(progression.state.phase).toBe('WAITING_FOR_ATTACK_CARD');
  expect(opponent === undefined ? null : getCurrentTargetLine(opponent.field)).toBe('GOALKEEPER');
  expect(topRank).toBeDefined();

  return topRank!;
}

function drawAndScoreThroughTutorial(progression: TutorialProgression): {
  drawnRank: CardRank;
  goalEvents: readonly GameEvent[];
} {
  expect(progression.controller.continue()).toBe(true);
  expect(progression.controller.getCurrentStep()?.id).toBe('draw-shot');

  const drawnRank = drawThroughTutorial(progression);
  expect(progression.controller.getCurrentStep()?.id).toBe('take-shot');
  const goalEvents = selectTargetThroughTutorial(progression, 'goalkeeper');

  expect(goalEvents.some((event) => event.type === 'GOAL_SCORED')).toBe(true);
  expect(progression.controller.getCurrentStep()?.id).toBe('turnover-after-goal');

  return { drawnRank, goalEvents };
}

describe('TutorialController', () => {
  it('starts at the first step and advances through Continue-only steps', () => {
    const controller = new TutorialController(TUTORIAL_MATCH_V2_STEPS);

    expect(controller.getCurrentStep()?.id).toBe('welcome');
    expect(controller.continue()).toBe(true);
    expect(controller.getCurrentStep()?.id).toBe('basic-rule');
    expect(controller.continue()).toBe(true);
    expect(controller.getCurrentStep()?.id).toBe('draw-nine');
  });

  it('blocks wrong tutorial actions and accepts the scripted action', () => {
    const controller = new TutorialController(TUTORIAL_MATCH_V2_STEPS);

    controller.continue();
    controller.continue();

    expect(controller.checkAction({ type: 'draw-attack-card', rank: '6' })).toEqual({
      allowed: false,
      messageKey: 'tutorial.guard.useDeck'
    });
    expect(controller.checkAction({ type: 'draw-attack-card', rank: '9' })).toEqual({ allowed: true });
    expect(controller.recordAction({ type: 'draw-attack-card', rank: '9' })).toBe(true);
    expect(controller.getCurrentStep()?.id).toBe('beat-seven');
  });

  it('includes v2 midfield and open-zone steps in order', () => {
    const ids = TUTORIAL_MATCH_V2_STEPS.map((step) => step.id);

    expect(ids.slice(ids.indexOf('turnover-after-goal') + 1)).toEqual([
      'midfield-support-intro',
      'select-left-midfielder',
      'opposite-midfielder-beaten',
      'opposite-slot-rule',
      'empty-slot',
      'draw-low-after-midfielder',
      'lose-after-midfielder',
      'open-zone',
      'draw-counterattack-card',
      'pass-through-open-zone',
      'ready'
    ]);
  });

  it('accepts only the scripted midfielder slot and open-zone slot', () => {
    const controller = new TutorialController([
      {
        id: 'select-left-midfielder',
        messageKey: 'tutorial.selectLeftMidfielder.message',
        waitFor: 'action',
        allowedAction: { type: 'commit-midfielder', slot: 'left', rank: 'A' },
        blockedMessageKey: 'tutorial.guard.tryMidfielder'
      },
      {
        id: 'pass-through-open-zone',
        messageKey: 'tutorial.passThroughOpenZone.message',
        waitFor: 'action',
        allowedAction: { type: 'use-midfield-gap', slot: 'left' },
        blockedMessageKey: 'tutorial.guard.passOpenZone'
      }
    ]);

    expect(controller.checkAction({ type: 'commit-midfielder', positionId: 'midfielder-3', slot: 'right', rank: '10' })).toEqual({
      allowed: false,
      messageKey: 'tutorial.guard.tryMidfielder'
    });
    expect(controller.checkAction({ type: 'commit-midfielder', positionId: 'midfielder-1', slot: 'left', rank: 'A' })).toEqual({
      allowed: true
    });
    expect(controller.recordAction({ type: 'commit-midfielder', positionId: 'midfielder-1', slot: 'left', rank: 'A' })).toBe(true);
    expect(controller.checkAction({ type: 'use-midfield-gap', positionId: 'midfielder-2', slot: 'center' })).toEqual({
      allowed: false,
      messageKey: 'tutorial.guard.passOpenZone'
    });
    expect(controller.recordAction({ type: 'use-midfield-gap', positionId: 'midfielder-1', slot: 'left' })).toBe(true);
    expect(controller.isComplete()).toBe(true);
  });

  it('waits for engine events and target lines when a step requires them', () => {
    const controller = new TutorialController([
      {
        id: 'reach-gk',
        messageKey: 'tutorial.clearDefense.message',
        waitFor: 'line-reached',
        expectedLine: 'GOALKEEPER'
      },
      {
        id: 'score',
        messageKey: 'tutorial.takeShot.message',
        waitFor: 'engine-event',
        expectedEventType: 'GOAL_SCORED'
      }
    ]);

    expect(controller.recordTargetLine('DEFENSE')).toBe(false);
    expect(controller.recordTargetLine('GOALKEEPER')).toBe(true);
    expect(controller.getCurrentStep()?.id).toBe('score');
    expect(controller.recordEvents([{ type: 'TURN_ENDED', playerId: 'PLAYER_1' }])).toBe(false);
    expect(
      controller.recordEvents([
        {
          type: 'GOAL_SCORED',
          playerId: 'PLAYER_1',
          turnNumber: 1,
          attackerCard: { id: 'Q_HEARTS', rank: 'Q', suit: 'HEARTS', color: 'RED' },
          scorer: { playerName: 'Player', shirtNumber: 10, rank: 'Q', teamId: 'br' }
        }
      ])
    ).toBe(true);
    expect(controller.isComplete()).toBe(true);
  });
});

describe('Tutorial Match v2 scenario', () => {
  it('keeps the canonical Q route playable through TutorialController and GameEngine', () => {
    const progression = reachClearDefense();

    expect(
      completeClearDefense(progression, {
        useMidfielder: false,
        defenderOrder: ['defender-1', 'defender-2']
      })
    ).toBe('Q');

    const { drawnRank } = drawAndScoreThroughTutorial(progression);

    expect(drawnRank).toBe('Q');
    expect(progression.state.players[0].goals).toBe(1);
  });

  it('keeps the alternative midfielder K route playable through TutorialController and GameEngine', () => {
    const progression = reachClearDefense();

    expect(
      completeClearDefense(progression, {
        useMidfielder: true,
        defenderOrder: ['defender-1', 'defender-2']
      })
    ).toBe('K');

    expect(progression.controller.continue()).toBe(true);
    expect(progression.controller.getCurrentStep()?.id).toBe('draw-shot');
    const actualDrawAction: Extract<TutorialAction, { type: 'draw-attack-card' }> = {
      type: 'draw-attack-card',
      rank: 'K'
    };

    expect(progression.controller.checkAction(actualDrawAction)).toEqual({ allowed: true });
    expect(drawThroughTutorial(progression)).toBe('K');
    expect(progression.controller.getCurrentStep()?.id).toBe('take-shot');
    const goalEvents = selectTargetThroughTutorial(progression, 'goalkeeper');

    expect(goalEvents.some((event) => event.type === 'GOAL_SCORED')).toBe(true);
    expect(progression.controller.getCurrentStep()?.id).toBe('turnover-after-goal');
  });

  it('keeps every legal clear-defense route shootable and reaches the post-goal step', () => {
    const reachableTopRanks = new Set<CardRank>();
    const routes = [
      { useMidfielder: false, defenderOrder: ['defender-1', 'defender-2'] as const },
      { useMidfielder: false, defenderOrder: ['defender-2', 'defender-1'] as const },
      { useMidfielder: true, defenderOrder: ['defender-1', 'defender-2'] as const },
      { useMidfielder: true, defenderOrder: ['defender-2', 'defender-1'] as const }
    ];

    for (const route of routes) {
      const progression = reachClearDefense();
      const topRank = completeClearDefense(progression, route);
      reachableTopRanks.add(topRank);

      const { drawnRank, goalEvents } = drawAndScoreThroughTutorial(progression);

      expect(drawnRank).toBe(topRank);
      expect(goalEvents.some((event) => event.type === 'GOAL_SCORED')).toBe(true);
      expect(progression.controller.getCurrentStep()?.id).toBe('turnover-after-goal');
    }

    expect([...reachableTopRanks].sort()).toEqual(['K', 'Q']);
  });

  it('allows only a deck draw on draw-shot and advances exactly once to take-shot', () => {
    const progression = reachClearDefense();
    completeClearDefense(progression, {
      useMidfielder: false,
      defenderOrder: ['defender-1', 'defender-2']
    });

    const goalkeeperStep = progression.controller.getCurrentStep();
    expect(goalkeeperStep).toMatchObject({ id: 'goalkeeper', waitFor: 'next' });
    expect(progression.controller.continue()).toBe(true);

    const drawShotStep = progression.controller.getCurrentStep();
    expect(drawShotStep).toMatchObject({
      id: 'draw-shot',
      waitFor: 'action',
      allowedAction: { type: 'draw-attack-card' }
    });
    expect(progression.controller.continue()).toBe(false);
    expect(progression.controller.checkAction({ type: 'draw-attack-card', rank: 'Q' })).toEqual({ allowed: true });
    expect(progression.controller.checkAction({ type: 'draw-attack-card', rank: 'K' })).toEqual({ allowed: true });

    for (const wrongAction of [
      { type: 'select-target', positionId: 'goalkeeper', rank: '5' },
      { type: 'commit-midfielder', positionId: 'midfielder-3', slot: 'right', rank: '8' },
      { type: 'use-midfield-gap', positionId: 'midfielder-3', slot: 'right' }
    ] satisfies TutorialAction[]) {
      expect(progression.controller.checkAction(wrongAction)).toMatchObject({ allowed: false });
    }

    const drawnRank = drawThroughTutorial(progression);
    expect(drawnRank).toBe('Q');
    expect(progression.controller.getCurrentStep()?.id).toBe('take-shot');
    expect(progression.controller.recordAction({ type: 'draw-attack-card', rank: drawnRank })).toBe(false);
    expect(progression.controller.getCurrentStep()?.id).toBe('take-shot');
  });

  it('keeps the fixed Brazil vs Germany opening route to a goal', () => {
    const engine = new GameEngine();
    let state = engine.startNewGame({
      ...TUTORIAL_MATCH_V2_TEAMS,
      setupPreset: TUTORIAL_MATCH_V2_SETUP_PRESET
    });

    state = engine.startNextTurn();
    expect(state.players[0].name).toBe('Brazil');
    expect(state.players[1].name).toBe('Germany');
    expect(state.activePlayerId).toBe('PLAYER_1');

    state = engine.drawAttackCard();
    expect(state.attackCard?.rank).toBe('9');
    state = engine.selectTarget('midfielder-1');
    expect(state.log.at(-1)?.type).toBe('CARD_DEFEATED');

    state = engine.drawAttackCard();
    expect(state.attackCard?.rank).toBe('6');
    state = engine.selectTarget('midfielder-2');
    expect(state.log.at(-1)?.type).toBe('CARD_DEFEATED');

    state = engine.drawAttackCard();
    expect(state.attackCard?.rank).toBe('10');
    state = engine.selectTarget('midfielder-3');
    state = engine.drawAttackCard();
    expect(state.attackCard?.rank).toBe('J');
    state = engine.selectTarget('defender-1');
    state = engine.drawAttackCard();
    expect(state.attackCard?.rank).toBe('K');
    state = engine.selectTarget('defender-2');
    expect(getCurrentTargetLine(state.players[1].field)).toBe('GOALKEEPER');

    state = engine.drawAttackCard();
    expect(state.attackCard?.rank).toBe('Q');
    state = engine.selectTarget('goalkeeper');
    expect(state.log.some((event) => event.type === 'GOAL_SCORED')).toBe(true);
    expect(state.players[0].goals).toBe(1);
  });

  it('scripts midfield support, turnover, one open zone, and pass-through after the first goal', () => {
    const engine = new GameEngine();
    let state = engine.startNewGame({
      ...TUTORIAL_MATCH_V2_TEAMS,
      setupPreset: TUTORIAL_MATCH_V2_SETUP_PRESET
    });

    state = engine.startNextTurn();
    state = engine.drawAttackCard();
    state = engine.selectTarget('midfielder-1');
    state = engine.drawAttackCard();
    state = engine.selectTarget('midfielder-2');
    state = engine.drawAttackCard();
    state = engine.selectTarget('midfielder-3');
    state = engine.drawAttackCard();
    state = engine.selectTarget('defender-1');
    state = engine.drawAttackCard();
    state = engine.selectTarget('defender-2');
    state = engine.drawAttackCard();
    state = engine.selectTarget('goalkeeper');
    state = engine.startNextTurn();

    expect(state.activePlayerId).toBe('PLAYER_2');
    expect([
      state.players[1].field['midfielder-1'],
      state.players[1].field['midfielder-2'],
      state.players[1].field['midfielder-3']
    ]).not.toContain(null);
    expect(state.players[1].field['midfielder-1']?.rank).toBe('A');
    expect(engine.canCommitMidfielder('midfielder-1')).toBe(true);

    state = engine.commitMidfielder('midfielder-1');
    expect(state.log).toContainEqual(expect.objectContaining({ type: 'MIDFIELDER_COMMITTED', positionId: 'midfielder-1' }));
    expect(state.players[1].field['midfielder-1']).toBeNull();
    expect(state.players[1].field['midfielder-2']).not.toBeNull();
    expect(state.players[1].field['midfielder-3']).not.toBeNull();

    state = engine.drawAttackCard();
    expect(state.attackCard?.rank).toBe('3');
    state = engine.selectTarget('midfielder-2');
    expect(state.counterattackMidfieldGap).toMatchObject({
      defendingPlayerId: 'PLAYER_2',
      positionIds: ['midfielder-1'],
      used: false
    });
    expect(state.log).toContainEqual(expect.objectContaining({ type: 'ATTACK_MISSED', positionId: 'midfielder-2' }));

    state = engine.startNextTurn();
    state = engine.drawAttackCard();
    expect(state.legalMidfieldGapPositionIds).toEqual(['midfielder-1']);
    state = engine.useMidfieldGap('midfielder-1');
    expect(state.log.at(-1)).toMatchObject({
      type: 'MIDFIELD_GAP_USED',
      playerId: 'PLAYER_1',
      positionId: 'midfielder-1'
    });
    expect(state.counterattackMidfieldGap?.used).toBe(true);
  });
});

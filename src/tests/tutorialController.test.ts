import { describe, expect, it } from 'vitest';
import { GameEngine, getCurrentTargetLine } from '../game';
import { TutorialController } from '../tutorial/TutorialController';
import {
  TUTORIAL_MATCH_V2_SETUP_PRESET,
  TUTORIAL_MATCH_V2_STEPS,
  TUTORIAL_MATCH_V2_TEAMS
} from '../tutorial/tutorialScenario';

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
    state = engine.selectTarget('defender-1');
    state = engine.drawAttackCard();
    expect(state.attackCard?.rank).toBe('J');
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
    state = engine.selectTarget('defender-1');
    state = engine.drawAttackCard();
    state = engine.selectTarget('defender-2');
    state = engine.drawAttackCard();
    state = engine.selectTarget('goalkeeper');
    state = engine.startNextTurn();

    expect(state.activePlayerId).toBe('PLAYER_2');
    expect(state.players[1].field['midfielder-1']?.rank).toBe('A');
    expect(engine.canCommitMidfielder('midfielder-1')).toBe(true);

    state = engine.commitMidfielder('midfielder-1');
    expect(state.log).toContainEqual(expect.objectContaining({ type: 'MIDFIELDER_COMMITTED', positionId: 'midfielder-1' }));
    expect(state.players[1].field['midfielder-1']).toBeNull();

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

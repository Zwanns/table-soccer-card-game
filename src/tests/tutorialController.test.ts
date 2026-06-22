import { describe, expect, it } from 'vitest';
import { GameEngine, getCurrentTargetLine } from '../game';
import { TutorialController } from '../tutorial/TutorialController';
import {
  TUTORIAL_MATCH_V1_SETUP_PRESET,
  TUTORIAL_MATCH_V1_STEPS,
  TUTORIAL_MATCH_V1_TEAMS
} from '../tutorial/tutorialScenario';

describe('TutorialController', () => {
  it('starts at the first step and advances through Continue-only steps', () => {
    const controller = new TutorialController(TUTORIAL_MATCH_V1_STEPS);

    expect(controller.getCurrentStep()?.id).toBe('welcome');
    expect(controller.continue()).toBe(true);
    expect(controller.getCurrentStep()?.id).toBe('basic-rule');
    expect(controller.continue()).toBe(true);
    expect(controller.getCurrentStep()?.id).toBe('draw-nine');
  });

  it('blocks wrong tutorial actions and accepts the scripted action', () => {
    const controller = new TutorialController(TUTORIAL_MATCH_V1_STEPS);

    controller.continue();
    controller.continue();

    expect(controller.checkAction({ type: 'draw-attack-card', rank: '6' })).toEqual({
      allowed: false,
      message: 'Use the highlighted deck.'
    });
    expect(controller.checkAction({ type: 'draw-attack-card', rank: '9' })).toEqual({ allowed: true });
    expect(controller.recordAction({ type: 'draw-attack-card', rank: '9' })).toBe(true);
    expect(controller.getCurrentStep()?.id).toBe('beat-seven');
  });

  it('waits for engine events and target lines when a step requires them', () => {
    const controller = new TutorialController([
      {
        id: 'reach-gk',
        message: 'Reach GK.',
        waitFor: 'line-reached',
        expectedLine: 'GOALKEEPER'
      },
      {
        id: 'score',
        message: 'Score.',
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

describe('Tutorial Match v1 scenario', () => {
  it('uses fixed Brazil vs Germany teams and a stable opening route to a goal', () => {
    const engine = new GameEngine();
    let state = engine.startNewGame({
      ...TUTORIAL_MATCH_V1_TEAMS,
      setupPreset: TUTORIAL_MATCH_V1_SETUP_PRESET
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
});

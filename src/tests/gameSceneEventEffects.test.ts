import { describe, expect, it } from 'vitest';
import type { GameEvent, Player, ScorerSnapshot } from '../game';
import { getGoalkeeperShotSceneEffect, getNextGoalScoredSceneEffect } from '../scenes/gameSceneEventEffects';

function scorer(playerName: string): ScorerSnapshot {
  return {
    playerName,
    shirtNumber: 9,
    rank: 'A',
    teamId: playerName.toLowerCase()
  };
}

function goalEvent(playerId: Player['id'], playerName: string): GameEvent {
  const attackerCard = { id: `GOAL_${playerName}`, rank: 'A', color: 'RED', suit: 'HEARTS' } as const;

  return {
    type: 'GOAL_SCORED',
    playerId,
    turnNumber: 3,
    attackerCard,
    scorer: scorer(playerName)
  };
}

describe('GameScene goal event effects', () => {
  it('maps a HUMAN goal event to the shared GOAL!! flying message', () => {
    const effect = getNextGoalScoredSceneEffect([goalEvent('PLAYER_1', 'Human Team')], 0);

    expect(effect).toMatchObject({
      type: 'GOAL_SCORED',
      eventIndex: 0,
      flyingMessage: 'GOAL!!',
      flyingMessageTone: 'goal',
      soundKey: 'sound-goal'
    });
  });

  it('maps an AI goal event to the same message-effects pipeline as a HUMAN goal', () => {
    const humanGoalEffect = getNextGoalScoredSceneEffect([goalEvent('PLAYER_1', 'Human Team')], 0);
    const aiGoalEffect = getNextGoalScoredSceneEffect([goalEvent('PLAYER_2', 'AI Team')], 0);

    expect(aiGoalEffect).toEqual(humanGoalEffect);
  });

  it('does not return the same GOAL_SCORED effect after its event cursor was handled', () => {
    const events: GameEvent[] = [
      { type: 'ATTACK_CARD_DRAWN', playerId: 'PLAYER_1', card: { id: 'C_1', rank: 'A', color: 'RED', suit: 'HEARTS' } },
      goalEvent('PLAYER_2', 'AI Team')
    ];
    const firstEffect = getNextGoalScoredSceneEffect(events, 0);
    const duplicateEffect = getNextGoalScoredSceneEffect(events, (firstEffect?.eventIndex ?? 0) + 1);

    expect(firstEffect?.eventIndex).toBe(1);
    expect(duplicateEffect).toBeNull();
  });
});

describe('GameScene goalkeeper shot event effects', () => {
  it('maps goal, post, and save impacts to their flying messages', () => {
    expect(getGoalkeeperShotSceneEffect('goal')).toEqual({
      type: 'GOAL_SCORED',
      flyingMessage: 'GOAL!!',
      flyingMessageTone: 'goal',
      soundKey: 'sound-goal'
    });
    expect(getGoalkeeperShotSceneEffect('post')).toEqual({
      type: 'GOALPOST_HIT',
      flyingMessage: 'Post!',
      flyingMessageTone: 'post',
      soundKey: 'sound-goalpost'
    });
    expect(getGoalkeeperShotSceneEffect('save')).toEqual({
      type: 'GOALKEEPER_SAVE',
      flyingMessage: 'Goalkeeper!!',
      flyingMessageTone: 'save',
      soundKey: 'sound-goalkeeper-save'
    });
  });
});

import { describe, expect, it } from 'vitest';
import type { GameEvent, Player, ScorerSnapshot } from '../game';
import {
  claimGoalkeeperShotImpactEvent,
  getGoalkeeperShotEventIndex,
  getGoalkeeperShotSceneEffect,
  getNextGoalScoredSceneEffect
} from '../scenes/gameSceneEventEffects';

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
    const effect = getNextGoalScoredSceneEffect([goalEvent('PLAYER_1', 'Human Team')], new Set());

    expect(effect).toMatchObject({
      type: 'GOAL_SCORED',
      eventIndex: 0,
      flyingMessage: 'GOAL!!',
      flyingMessageTone: 'goal',
      soundKey: 'sound-goal'
    });
  });

  it('maps an AI goal event to the same message-effects pipeline as a HUMAN goal', () => {
    const humanGoalEffect = getNextGoalScoredSceneEffect([goalEvent('PLAYER_1', 'Human Team')], new Set());
    const aiGoalEffect = getNextGoalScoredSceneEffect([goalEvent('PLAYER_2', 'AI Team')], new Set());

    expect(aiGoalEffect).toEqual(humanGoalEffect);
  });

  it('does not return the same GOAL_SCORED effect after its event cursor was handled', () => {
    const events: GameEvent[] = [
      { type: 'ATTACK_CARD_DRAWN', playerId: 'PLAYER_1', card: { id: 'C_1', rank: 'A', color: 'RED', suit: 'HEARTS' } },
      goalEvent('PLAYER_2', 'AI Team')
    ];
    const firstEffect = getNextGoalScoredSceneEffect(events, new Set());
    const duplicateEffect = getNextGoalScoredSceneEffect(events, new Set([firstEffect?.eventIndex ?? 0]));

    expect(firstEffect?.eventIndex).toBe(1);
    expect(duplicateEffect).toBeNull();
  });

  it('skips only handled goal indexes and still returns later goals from the same match', () => {
    const events: GameEvent[] = [
      goalEvent('PLAYER_1', 'First Team'),
      { type: 'TURN_ENDED', playerId: 'PLAYER_1' },
      goalEvent('PLAYER_2', 'Second Team'),
      goalEvent('PLAYER_1', 'Third Team')
    ];
    const handledIndexes = new Set<number>();

    const firstEffect = getNextGoalScoredSceneEffect(events, handledIndexes);
    handledIndexes.add(firstEffect!.eventIndex);
    const secondEffect = getNextGoalScoredSceneEffect(events, handledIndexes);
    handledIndexes.add(secondEffect!.eventIndex);
    const thirdEffect = getNextGoalScoredSceneEffect(events, handledIndexes);
    handledIndexes.add(thirdEffect!.eventIndex);

    expect([firstEffect?.eventIndex, secondEffect?.eventIndex, thirdEffect?.eventIndex]).toEqual([0, 2, 3]);
    expect(getNextGoalScoredSceneEffect(events, handledIndexes)).toBeNull();
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

  it('finds the exact latest event index for each goalkeeper shot outcome', () => {
    const events: GameEvent[] = [
      goalEvent('PLAYER_1', 'First Team'),
      {
        type: 'GOALKEEPER_SAVE',
        playerId: 'PLAYER_2',
        attackerCard: { id: 'SAVE', rank: 'A', color: 'RED', suit: 'HEARTS' },
        goalkeeperCard: { id: 'GK_SAVE', rank: 'K', kind: 'goalkeeper' }
      },
      {
        type: 'GOALPOST_HIT',
        playerId: 'PLAYER_1',
        attackerCard: { id: 'POST', rank: 'Q', color: 'BLACK', suit: 'SPADES' },
        goalkeeperCard: { id: 'GK_POST', rank: 'Q', kind: 'goalkeeper' }
      },
      goalEvent('PLAYER_2', 'Second Team')
    ];

    expect(getGoalkeeperShotEventIndex(events, 'goal')).toBe(3);
    expect(getGoalkeeperShotEventIndex(events, 'save')).toBe(1);
    expect(getGoalkeeperShotEventIndex(events, 'post')).toBe(2);
    expect(getGoalkeeperShotEventIndex([], 'goal')).toBeNull();
  });

  it('plays each consecutive goalkeeper impact once without blocking later events', () => {
    const handledIndexes = new Set<number>();

    expect(claimGoalkeeperShotImpactEvent(handledIndexes, 4)).toBe(true);
    expect(claimGoalkeeperShotImpactEvent(handledIndexes, 4)).toBe(false);
    expect(claimGoalkeeperShotImpactEvent(handledIndexes, 9)).toBe(true);
    expect(claimGoalkeeperShotImpactEvent(handledIndexes, 12)).toBe(true);
    expect(claimGoalkeeperShotImpactEvent(handledIndexes, 9)).toBe(false);
    expect([...handledIndexes]).toEqual([4, 9, 12]);
  });
});

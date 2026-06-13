import { afterEach, describe, expect, it, vi } from 'vitest';
import { choosePenaltyAiAction, createPenaltyAiRandom, type PenaltyAiRandomSource } from '../ai';
import {
  createPenaltyShootoutState,
  drawPenaltyGoalkeeperCard,
  revealPenaltyAttackCard,
  takePenaltyKick,
  type PenaltyShootoutState
} from '../tournament';

function shootout(): PenaltyShootoutState {
  return createPenaltyShootoutState({
    matchId: 'penalty-ai-match',
    homeTeamId: 'fr',
    awayTeamId: 'es',
    seed: 'penalty-ai-seed'
  });
}

function fixedRandom(value: number): PenaltyAiRandomSource {
  return () => value;
}

function snapshot(state: PenaltyShootoutState): unknown {
  return {
    status: state.status,
    phase: state.phase,
    nextShooter: state.nextShooter,
    currentGoalkeeperRank: state.currentGoalkeeperRank,
    revealedAttackerCardIndex: state.revealedAttackerCardIndex,
    homeGoals: state.homeGoals,
    awayGoals: state.awayGoals,
    homeAvailableCards: [...state.homeAvailableCards],
    awayAvailableCards: [...state.awayAvailableCards],
    goalkeeperDeck: [...state.goalkeeperDeck],
    kicks: [...state.kicks]
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Penalty AI decision model', () => {
  it('returns a goalkeeper draw only for the defending side', () => {
    const state = shootout();

    expect(choosePenaltyAiAction(state, 'away', fixedRandom(0))).toEqual({
      type: 'DRAW_GOALKEEPER_CARD'
    });
    expect(choosePenaltyAiAction(state, 'home', fixedRandom(0))).toBeNull();
  });

  it('returns an attacking card selection only for the shooting side', () => {
    const state = drawPenaltyGoalkeeperCard(shootout());

    expect(choosePenaltyAiAction(state, 'home', fixedRandom(0.4))).toEqual({
      type: 'SELECT_ATTACK_CARD',
      cardIndex: 2
    });
    expect(choosePenaltyAiAction(state, 'away', fixedRandom(0.4))).toBeNull();
  });

  it('returns only legal attacking card indices', () => {
    const state = drawPenaltyGoalkeeperCard({
      ...shootout(),
      homeAvailableCards: ['6']
    });

    expect(choosePenaltyAiAction(state, 'home', fixedRandom(0.99))).toEqual({
      type: 'SELECT_ATTACK_CARD',
      cardIndex: 0
    });
  });

  it('does not inspect hidden attacking card ranks when selecting a card', () => {
    const lowCards = drawPenaltyGoalkeeperCard({
      ...shootout(),
      homeAvailableCards: ['2', '3', '4']
    });
    const highCards = drawPenaltyGoalkeeperCard({
      ...shootout(),
      homeAvailableCards: ['Q', 'K', 'A']
    });

    expect(choosePenaltyAiAction(lowCards, 'home', fixedRandom(0.7))).toEqual(
      choosePenaltyAiAction(highCards, 'home', fixedRandom(0.7))
    );
  });

  it('returns null when no AI choice is currently required', () => {
    const readyState = revealPenaltyAttackCard(drawPenaltyGoalkeeperCard(shootout()), 0);
    let completeState = readyState;

    for (let index = 0; index < 40 && completeState.status !== 'complete'; index += 1) {
      if (completeState.phase === 'selecting-goalkeeper') {
        completeState = drawPenaltyGoalkeeperCard(completeState);
      }

      if (completeState.phase === 'selecting-attacker') {
        completeState = revealPenaltyAttackCard(completeState, 0);
      }

      if (completeState.phase === 'ready-to-shoot') {
        completeState = takePenaltyKick(completeState);
      }
    }

    expect(choosePenaltyAiAction(readyState, 'home', fixedRandom(0))).toBeNull();
    expect(completeState.status).toBe('complete');
    expect(choosePenaltyAiAction(completeState, 'home', fixedRandom(0))).toBeNull();
  });

  it('does not mutate penalty shootout state', () => {
    const state = drawPenaltyGoalkeeperCard(shootout());
    const before = snapshot(state);

    expect(choosePenaltyAiAction(state, 'home', fixedRandom(0))).toEqual({
      type: 'SELECT_ATTACK_CARD',
      cardIndex: 0
    });
    expect(snapshot(state)).toEqual(before);
  });

  it('does not use Math.random', () => {
    const mathRandom = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used by penalty AI decisions.');
    });
    const state = drawPenaltyGoalkeeperCard(shootout());

    expect(() => choosePenaltyAiAction(state, 'home', fixedRandom(0.2))).not.toThrow();
    expect(mathRandom).not.toHaveBeenCalled();
  });

  it('returns deterministic choices for the same penalty AI seed stream', () => {
    const state = drawPenaltyGoalkeeperCard(shootout());
    const firstAction = choosePenaltyAiAction(state, 'home', createPenaltyAiRandom('same-penalty-seed', 'home'));
    const secondAction = choosePenaltyAiAction(state, 'home', createPenaltyAiRandom('same-penalty-seed', 'home'));

    expect(secondAction).toEqual(firstAction);
  });

  it('can vary card choices across different penalty AI seed streams', () => {
    const state = drawPenaltyGoalkeeperCard(shootout());
    const choices = new Set<number>();

    for (const seed of ['penalty-a', 'penalty-b', 'penalty-c', 'penalty-d', 'penalty-e', 'penalty-f']) {
      const action = choosePenaltyAiAction(state, 'home', createPenaltyAiRandom(seed, 'home'));

      if (action?.type === 'SELECT_ATTACK_CARD') {
        choices.add(action.cardIndex);
      }
    }

    expect(choices.size).toBeGreaterThan(1);
  });
});

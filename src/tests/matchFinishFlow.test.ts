import { describe, expect, it } from 'vitest';
import type { Card, Deck } from '../cards';
import { GoalkeeperDeck } from '../cards';
import type { GameEvent, GameState, Player } from '../game';
import { createEmptyField } from '../game';
import {
  CARD_DEPLETION_FALLBACK_BODY,
  resolveCardDepletionMatchFinish
} from '../scenes/matchFinishFlow';

describe('match finish flow', () => {
  it('detects a real Quick Match card-depletion finish and names the depleted left team', () => {
    const state = gameOverState({
      players: [player('PLAYER_1', 'Ukraine', []), player('PLAYER_2', 'Poland', ['A'])],
      activePlayerId: 'PLAYER_1'
    });

    expect(resolveCardDepletionMatchFinish(state)).toEqual({
      depletedPlayerId: 'PLAYER_1',
      bodyText: 'The match is over because Ukraine has no cards left to attack.'
    });
  });

  it('detects the depleted right team from current deck state', () => {
    const state = gameOverState({
      players: [player('PLAYER_1', 'Ukraine', ['K']), player('PLAYER_2', 'Poland', [])],
      activePlayerId: 'PLAYER_2'
    });

    expect(resolveCardDepletionMatchFinish(state)).toEqual({
      depletedPlayerId: 'PLAYER_2',
      bodyText: 'The match is over because Poland has no cards left to attack.'
    });
  });

  it('falls back when the depleted team name cannot be resolved', () => {
    const state = gameOverState({
      players: [player('PLAYER_1', '   ', []), player('PLAYER_2', 'Poland', ['A'])],
      activePlayerId: 'PLAYER_1'
    });

    expect(resolveCardDepletionMatchFinish(state)).toEqual({
      depletedPlayerId: 'PLAYER_1',
      bodyText: CARD_DEPLETION_FALLBACK_BODY
    });
  });

  it('uses a recent attack-deck-empty event as a fallback card-depletion signal', () => {
    const state = gameOverState({
      players: [player('PLAYER_1', 'Ukraine', ['Q']), player('PLAYER_2', 'Poland', ['A'])],
      activePlayerId: 'PLAYER_2',
      log: [
        { type: 'ATTACK_DECK_EMPTY', playerId: 'PLAYER_1', turnNumber: 8 },
        { type: 'TURN_ENDED', playerId: 'PLAYER_1' },
        { type: 'GAME_OVER', winnerId: null }
      ]
    });

    expect(resolveCardDepletionMatchFinish(state)).toEqual({
      depletedPlayerId: 'PLAYER_1',
      bodyText: 'The match is over because Ukraine has no cards left to attack.'
    });
  });

  it('uses current attack decks when the GAME_OVER event does not include a card-depletion reason', () => {
    const state = gameOverState({
      players: [player('PLAYER_1', 'Ukraine', ['Q']), player('PLAYER_2', 'France', [])],
      activePlayerId: 'PLAYER_2',
      log: [{ type: 'GAME_OVER', winnerId: 'PLAYER_1' }]
    });

    expect(resolveCardDepletionMatchFinish(state)).toEqual({
      depletedPlayerId: 'PLAYER_2',
      bodyText: 'The match is over because France has no cards left to attack.'
    });
  });

  it('does not treat goalkeeper deck depletion as an attacking-card finish', () => {
    const state = gameOverState({
      players: [
        player('PLAYER_1', 'Ukraine', ['Q'], new GoalkeeperDeck([])),
        player('PLAYER_2', 'Poland', ['A'])
      ],
      activePlayerId: 'PLAYER_1'
    });

    expect(resolveCardDepletionMatchFinish(state)).toBeNull();
  });

  it('does not show the modal for non-game-over states', () => {
    const state = gameOverState({
      phase: 'WAITING_FOR_ATTACK_CARD',
      players: [player('PLAYER_1', 'Ukraine', []), player('PLAYER_2', 'Poland', ['A'])],
      activePlayerId: 'PLAYER_1'
    });

    expect(resolveCardDepletionMatchFinish(state)).toBeNull();
  });
});

function gameOverState(options: {
  phase?: GameState['phase'];
  players: [Player, Player];
  activePlayerId: Player['id'] | null;
  log?: GameEvent[];
}): Readonly<GameState> {
  return {
    players: options.players,
    matchSetups: {},
    activePlayerId: options.activePlayerId,
    phase: options.phase ?? 'GAME_OVER',
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
    isDraw: true,
    turnNumber: 1,
    log: options.log ?? [{ type: 'GAME_OVER', winnerId: null }]
  };
}

function player(
  id: Player['id'],
  name: string,
  ranks: Card['rank'][],
  goalkeeperDeck = new GoalkeeperDeck([{ id: `${id}_gk`, rank: '6', kind: 'goalkeeper' }])
): Player {
  return {
    id,
    name,
    flagCode: id === 'PLAYER_1' ? 'ua' : 'pl',
    teamColor: id === 'PLAYER_1' ? 'RED' : 'BLACK',
    goals: 0,
    deck: deck(ranks),
    goalkeeperDeck,
    field: createEmptyField()
  };
}

function deck(ranks: Card['rank'][]): Deck {
  return {
    cards: ranks.map((rank, index) => ({
      id: `${rank}_${index}`,
      rank,
      color: 'RED',
      suit: 'HEARTS'
    }))
  };
}

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

  it('uses an explicit GAME_OVER depleted player payload before inspecting fallback state', () => {
    const state = gameOverState({
      players: [player('PLAYER_1', 'Portugal', ['Q'], undefined, 'pt'), player('PLAYER_2', 'England', [], undefined, 'gb-eng')],
      activePlayerId: 'PLAYER_2',
      log: [{ type: 'GAME_OVER', winnerId: 'PLAYER_1', reason: 'NO_ATTACK_CARD', depletedPlayerId: 'PLAYER_1' }]
    });

    expect(resolveCardDepletionMatchFinish(state)).toEqual({
      depletedPlayerId: 'PLAYER_1',
      bodyText: 'The match is over because Portugal has no cards left to attack.'
    });
  });

  it('resolves NO_ATTACK_CARD to the current attacker when the payload has only the reason', () => {
    const state = gameOverState({
      players: [player('PLAYER_1', 'Portugal', ['Q'], undefined, 'pt'), player('PLAYER_2', 'England', [], undefined, 'gb-eng')],
      activePlayerId: 'PLAYER_2',
      log: [{ type: 'GAME_OVER', winnerId: 'PLAYER_1', reason: 'NO_ATTACK_CARD' }]
    });

    expect(resolveCardDepletionMatchFinish(state)).toEqual({
      depletedPlayerId: 'PLAYER_2',
      bodyText: 'The match is over because England has no cards left to attack.'
    });
  });

  it('resolves CANNOT_RESTORE_FIELD to the active team when outfield cards are clearly short', () => {
    const portugal = player('PLAYER_1', 'Portugal', ['2', '3', '4'], undefined, 'pt');
    const england = player('PLAYER_2', 'England', ['A', 'K', 'Q', 'J', '10'], undefined, 'gb-eng');

    portugal.field.goalkeeper = { id: 'pt_gk', kind: 'goalkeeper', rank: '6' };
    portugal.field['defender-1'] = {
      id: 'pt_defender',
      rank: 'K',
      color: 'RED',
      suit: 'HEARTS'
    };
    fillOutfield(england);

    const state = gameOverState({
      players: [portugal, england],
      activePlayerId: 'PLAYER_1',
      log: [{ type: 'GAME_OVER', winnerId: null, reason: 'CANNOT_RESTORE_FIELD' }]
    });

    expect(resolveCardDepletionMatchFinish(state)).toEqual({
      depletedPlayerId: 'PLAYER_1',
      bodyText: 'The match is over because Portugal has no cards left to attack.'
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

  it('falls back when both teams appear unable to provide attack cards', () => {
    const state = gameOverState({
      players: [player('PLAYER_1', 'Portugal', [], undefined, 'pt'), player('PLAYER_2', 'England', [], undefined, 'gb-eng')],
      activePlayerId: 'PLAYER_1',
      log: [{ type: 'GAME_OVER', winnerId: null }]
    });

    expect(resolveCardDepletionMatchFinish(state)).toEqual({
      bodyText: CARD_DEPLETION_FALLBACK_BODY
    });
  });

  it('does not treat goalkeeper deck depletion as an attacking-card finish', () => {
    const portugal = player('PLAYER_1', 'Ukraine', ['Q'], new GoalkeeperDeck([]));
    fillOutfield(portugal);

    const state = gameOverState({
      players: [
        portugal,
        player('PLAYER_2', 'Poland', ['A'])
      ],
      activePlayerId: 'PLAYER_1'
    });

    expect(resolveCardDepletionMatchFinish(state)).toEqual({
      bodyText: CARD_DEPLETION_FALLBACK_BODY
    });
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
  goalkeeperDeck = new GoalkeeperDeck([{ id: `${id}_gk`, rank: '6', kind: 'goalkeeper' }]),
  flagCode = id === 'PLAYER_1' ? 'ua' : 'pl'
): Player {
  return {
    id,
    name,
    flagCode,
    teamColor: id === 'PLAYER_1' ? 'RED' : 'BLACK',
    goals: 0,
    deck: deck(ranks),
    goalkeeperDeck,
    field: createEmptyField()
  };
}

function fillOutfield(target: Player): void {
  target.field['defender-1'] = {
    id: `${target.id}_defender_1`,
    rank: 'K',
    color: target.teamColor,
    suit: 'HEARTS'
  };
  target.field['defender-2'] = {
    id: `${target.id}_defender_2`,
    rank: 'Q',
    color: target.teamColor,
    suit: 'HEARTS'
  };
  target.field['midfielder-1'] = {
    id: `${target.id}_midfielder_1`,
    rank: 'J',
    color: target.teamColor,
    suit: 'HEARTS'
  };
  target.field['midfielder-2'] = {
    id: `${target.id}_midfielder_2`,
    rank: '10',
    color: target.teamColor,
    suit: 'HEARTS'
  };
  target.field['midfielder-3'] = {
    id: `${target.id}_midfielder_3`,
    rank: '9',
    color: target.teamColor,
    suit: 'HEARTS'
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

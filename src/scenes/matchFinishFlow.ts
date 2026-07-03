import type { GameEvent, GameState, Player } from '../game';

export const CARD_DEPLETION_FALLBACK_BODY =
  'The match is over because one side has no cards left to attack.';

export interface CardDepletionMatchFinish {
  depletedPlayerId?: Player['id'];
  bodyText: string;
}

export function resolveCardDepletionMatchFinish(state: Readonly<GameState>): CardDepletionMatchFinish | null {
  if (state.phase !== 'GAME_OVER') {
    return null;
  }

  const depletedPlayer = resolveDepletedAttackPlayer(state);

  if (depletedPlayer !== null) {
    return {
      depletedPlayerId: depletedPlayer.id,
      bodyText: createCardDepletionBodyText(depletedPlayer)
    };
  }

  const attackDeckEmptyEvent = getLastPreGameOverAttackDeckEmptyEvent(state.log);

  if (attackDeckEmptyEvent === null) {
    return null;
  }

  const eventPlayer = state.players.find((player) => player.id === attackDeckEmptyEvent.playerId);

  return {
    depletedPlayerId: eventPlayer?.id,
    bodyText: eventPlayer === undefined ? CARD_DEPLETION_FALLBACK_BODY : createCardDepletionBodyText(eventPlayer)
  };
}

function resolveDepletedAttackPlayer(state: Readonly<GameState>): Player | null {
  if (state.activePlayerId !== null) {
    const activePlayer = state.players.find((player) => player.id === state.activePlayerId);

    if (activePlayer !== undefined && activePlayer.deck.cards.length === 0) {
      return activePlayer;
    }
  }

  return state.players.find((player) => player.deck.cards.length === 0) ?? null;
}

function createCardDepletionBodyText(player: Player): string {
  const teamName = player.name.trim();

  if (teamName.length === 0) {
    return CARD_DEPLETION_FALLBACK_BODY;
  }

  return `The match is over because ${teamName} has no cards left to attack.`;
}

function getLastPreGameOverAttackDeckEmptyEvent(events: readonly GameEvent[]): Extract<GameEvent, { type: 'ATTACK_DECK_EMPTY' }> | null {
  const gameOverIndex = findLastEventIndex(events, (event) => event.type === 'GAME_OVER');

  if (gameOverIndex <= 0) {
    return null;
  }

  for (let index = gameOverIndex - 1; index >= 0; index -= 1) {
    const event = events[index];

    if (event === undefined) {
      continue;
    }

    if (event.type === 'ATTACK_DECK_EMPTY') {
      return event;
    }

    if (event.type === 'TURN_ENDED') {
      continue;
    }

    break;
  }

  return null;
}

function findLastEventIndex(events: readonly GameEvent[], predicate: (event: GameEvent) => boolean): number {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];

    if (event !== undefined && predicate(event)) {
      return index;
    }
  }

  return -1;
}

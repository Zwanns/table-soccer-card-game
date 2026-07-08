import { canCommittedMidfielderBeat } from '../cards';
import {
  getCurrentTargetLine,
  MIDFIELDER_POSITION_IDS,
  RESTORE_ORDER,
  isOutfieldPosition,
  type GameEvent,
  type GameState,
  type MidfielderPositionId,
  type Player
} from '../game';

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

  const explicitPlayer = resolveExplicitGameOverDepletedPlayer(state);

  if (explicitPlayer !== null) {
    return createCardDepletionMatchFinish(explicitPlayer);
  }

  const attackDeckEmptyEvent = getLastPreGameOverAttackDeckEmptyEvent(state.log);

  if (attackDeckEmptyEvent !== null) {
    return createCardDepletionMatchFinishByPlayerId(state, attackDeckEmptyEvent.playerId);
  }

  const gameOverEvent = getLastGameOverEvent(state.log);

  if (gameOverEvent?.reason === 'NO_ATTACK_CARD') {
    const noAttackCardPlayer = resolveCurrentAttackingPlayer(state);

    return noAttackCardPlayer === null ? createFallbackCardDepletionMatchFinish() : createCardDepletionMatchFinish(noAttackCardPlayer);
  }

  if (gameOverEvent?.reason === 'CANNOT_RESTORE_FIELD') {
    const restoreFailurePlayer = resolveCannotRestoreFieldPlayer(state);

    return restoreFailurePlayer === null
      ? createFallbackCardDepletionMatchFinish()
      : createCardDepletionMatchFinish(restoreFailurePlayer);
  }

  const depletedPlayer = resolveDepletedAttackPlayer(state);

  if (depletedPlayer !== null) {
    return createCardDepletionMatchFinish(depletedPlayer);
  }

  if (gameOverEvent === null) {
    return null;
  }

  return createFallbackCardDepletionMatchFinish();
}

function resolveExplicitGameOverDepletedPlayer(state: Readonly<GameState>): Player | null {
  const gameOverEvent = getLastGameOverEvent(state.log);

  if (gameOverEvent?.depletedPlayerId === undefined) {
    return null;
  }

  return state.players.find((player) => player.id === gameOverEvent.depletedPlayerId) ?? null;
}

function createCardDepletionMatchFinishByPlayerId(
  state: Readonly<GameState>,
  playerId: Player['id']
): CardDepletionMatchFinish {
  const player = state.players.find((candidate) => candidate.id === playerId);

  return player === undefined ? createFallbackCardDepletionMatchFinish() : createCardDepletionMatchFinish(player);
}

function createCardDepletionMatchFinish(player: Player): CardDepletionMatchFinish {
  return {
    depletedPlayerId: player.id,
    bodyText: createCardDepletionBodyText(player)
  };
}

function resolveDepletedAttackPlayer(state: Readonly<GameState>): Player | null {
  const restoreFailurePlayer = resolveCannotRestoreFieldPlayer(state);

  if (restoreFailurePlayer !== null) {
    return restoreFailurePlayer;
  }

  const attackDepletedPlayers = state.players.filter((player) => !hasAvailableAttackSource(state, player));

  if (attackDepletedPlayers.length === 1) {
    return attackDepletedPlayers[0]!;
  }

  if (attackDepletedPlayers.length > 1) {
    return null;
  }

  const activePlayer = resolveCurrentAttackingPlayer(state);

  if (activePlayer !== null && !hasAvailableAttackSource(state, activePlayer)) {
    return activePlayer;
  }

  return null;
}

function resolveCurrentAttackingPlayer(state: Readonly<GameState>): Player | null {
  if (state.activePlayerId === null) {
    return null;
  }

  return state.players.find((player) => player.id === state.activePlayerId) ?? null;
}

function resolveCannotRestoreFieldPlayer(state: Readonly<GameState>): Player | null {
  const activePlayer = resolveCurrentAttackingPlayer(state);

  if (activePlayer === null || canRestoreOutfield(activePlayer)) {
    return null;
  }

  const otherRestoreFailures = state.players.filter(
    (player) => player.id !== activePlayer.id && !canRestoreOutfield(player)
  );

  return otherRestoreFailures.length === 0 ? activePlayer : null;
}

function hasAvailableAttackSource(state: Readonly<GameState>, player: Player): boolean {
  return player.deck.cards.length > 0 || getCommittableMidfielderPositionIds(state, player).length > 0;
}

function getCommittableMidfielderPositionIds(
  state: Readonly<GameState>,
  player: Player
): MidfielderPositionId[] {
  const opponent = state.players.find((candidate) => candidate.id !== player.id);

  if (opponent === undefined || getCurrentTargetLine(opponent.field) !== 'MIDFIELD') {
    return [];
  }

  const committedPositionIds = state.activePlayerId === player.id
    ? state.committedMidfielderPositionIds ?? []
    : [];

  return MIDFIELDER_POSITION_IDS.filter((positionId) => {
    const attackerCard = player.field[positionId];
    const defenderCard = opponent.field[positionId];

    return (
      attackerCard !== null &&
      defenderCard !== null &&
      !committedPositionIds.includes(positionId) &&
      canCommittedMidfielderBeat(attackerCard, defenderCard)
    );
  });
}

function canRestoreOutfield(player: Player): boolean {
  const missingOutfieldCount = RESTORE_ORDER.filter(
    (positionId) => isOutfieldPosition(positionId) && player.field[positionId] === null
  ).length;

  return player.deck.cards.length >= missingOutfieldCount;
}

function createFallbackCardDepletionMatchFinish(): CardDepletionMatchFinish {
  return { bodyText: CARD_DEPLETION_FALLBACK_BODY };
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

function getLastGameOverEvent(events: readonly GameEvent[]): Extract<GameEvent, { type: 'GAME_OVER' }> | null {
  const gameOverIndex = findLastEventIndex(events, (event) => event.type === 'GAME_OVER');

  return gameOverIndex < 0 ? null : (events[gameOverIndex] as Extract<GameEvent, { type: 'GAME_OVER' }>);
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

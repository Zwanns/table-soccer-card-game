import type { Card } from '../cards';
import type { Player } from './Player';
import {
  RESTORE_ORDER,
  TARGET_LINE_ORDER,
  TARGET_LINE_POSITIONS,
  type FieldCardEntry,
  type FieldPositionId,
  type PlayerField,
  type TargetLine
} from './PlayerField';

export type RestoreFieldResult =
  | {
      ok: true;
      restoredPositions: FieldCardEntry[];
    }
  | {
      ok: false;
      reason: 'NOT_ENOUGH_CARDS';
      requiredCards: number;
      availableCards: number;
    };

export function getEmptyPositionsInRestoreOrder(field: PlayerField): FieldPositionId[] {
  return RESTORE_ORDER.filter((positionId) => field[positionId] === null);
}

export function restoreField(player: Player): RestoreFieldResult {
  const emptyPositions = getEmptyPositionsInRestoreOrder(player.field);
  const requiredCards = emptyPositions.length;
  const availableCards = player.deck.cards.length;

  if (availableCards < requiredCards) {
    return {
      ok: false,
      reason: 'NOT_ENOUGH_CARDS',
      requiredCards,
      availableCards
    };
  }

  const drawnCards = player.deck.cards.slice(0, requiredCards);
  const restoredPositions = emptyPositions.map((positionId, index) => ({
    positionId,
    card: drawnCards[index] as Card
  }));

  for (const entry of restoredPositions) {
    player.field[entry.positionId] = entry.card;
  }

  player.deck.cards.splice(0, requiredCards);

  return {
    ok: true,
    restoredPositions
  };
}

export function getCurrentTargetLine(field: PlayerField): TargetLine | null {
  for (const line of TARGET_LINE_ORDER) {
    if (TARGET_LINE_POSITIONS[line].some((positionId) => field[positionId] !== null)) {
      return line;
    }
  }

  return null;
}

export function getCardsInCurrentTargetLine(field: PlayerField): FieldCardEntry[] {
  const line = getCurrentTargetLine(field);

  if (line === null) {
    return [];
  }

  return TARGET_LINE_POSITIONS[line].flatMap((positionId) => {
    const card = field[positionId];

    return card === null ? [] : [{ positionId, card }];
  });
}

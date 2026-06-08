import { drawTopCard, type Card, type GoalkeeperCard } from '../cards';
import type { Player } from './Player';
import {
  RESTORE_ORDER,
  TARGET_LINE_ORDER,
  TARGET_LINE_POSITIONS,
  type FieldCardEntry,
  type FieldPositionId,
  isOutfieldPosition,
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
  const needsGoalkeeper = emptyPositions.includes('goalkeeper');
  const requiredOutfieldCards = emptyPositions.filter(isOutfieldPosition).length;
  const availableCards = player.deck.cards.length;

  if (availableCards < requiredOutfieldCards) {
    return {
      ok: false,
      reason: 'NOT_ENOUGH_CARDS',
      requiredCards: requiredOutfieldCards,
      availableCards
    };
  }

  if (needsGoalkeeper && player.goalkeeperDeck.getSize() === 0) {
    return {
      ok: false,
      reason: 'NOT_ENOUGH_CARDS',
      requiredCards: 1,
      availableCards: 0
    };
  }

  const restoredPositions = createRestoredPositions(player, emptyPositions);

  for (const entry of restoredPositions) {
    if (entry.positionId === 'goalkeeper') {
      player.field.goalkeeper = entry.card as GoalkeeperCard;
      continue;
    }

    const card = entry.card as Card;
    card.color = player.teamColor;
    player.field[entry.positionId] = card;
  }

  return {
    ok: true,
    restoredPositions
  };
}

function createRestoredPositions(player: Player, emptyPositions: readonly FieldPositionId[]): FieldCardEntry[] {
  return emptyPositions.map((positionId) => {
    if (positionId === 'goalkeeper') {
      const card = player.goalkeeperDeck.drawTop();

      return {
        positionId,
        card,
        cardKind: 'goalkeeper',
        cardRank: card.rank
      };
    }

    const card = drawTopCard(player.deck);

    if (card === null) {
      throw new Error('Cannot restore outfield position without a main deck card.');
    }

    card.color = player.teamColor;

    return {
      positionId,
      card,
      cardKind: 'outfield',
      cardRank: card.rank
    };
  });
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

    return card === null
      ? []
      : [
          {
            positionId,
            card,
            cardKind: positionId === 'goalkeeper' ? 'goalkeeper' : 'outfield',
            cardRank: card.rank
          }
        ];
  });
}

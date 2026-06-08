import type { Card, CardRank, GoalkeeperCard, GoalkeeperRank } from '../cards';

export type FieldPositionId =
  | 'goalkeeper'
  | 'defender-1'
  | 'defender-2'
  | 'midfielder-1'
  | 'midfielder-2'
  | 'midfielder-3';

export type TargetLine = 'MIDFIELD' | 'DEFENSE' | 'GOALKEEPER';

export type OutfieldPositionId = Exclude<FieldPositionId, 'goalkeeper'>;

export type FieldCard = Card | GoalkeeperCard;

export type PlayerField = {
  goalkeeper: GoalkeeperCard | null;
} & Record<OutfieldPositionId, Card | null>;

export interface FieldCardEntry {
  positionId: FieldPositionId;
  card: FieldCard;
  cardKind: 'outfield' | 'goalkeeper';
  cardRank: CardRank | GoalkeeperRank;
}

export const RESTORE_ORDER: readonly FieldPositionId[] = [
  'goalkeeper',
  'defender-1',
  'defender-2',
  'midfielder-1',
  'midfielder-2',
  'midfielder-3'
];

export const TARGET_LINE_ORDER: readonly TargetLine[] = ['MIDFIELD', 'DEFENSE', 'GOALKEEPER'];

export const TARGET_LINE_POSITIONS: Readonly<Record<TargetLine, readonly FieldPositionId[]>> = {
  MIDFIELD: ['midfielder-1', 'midfielder-2', 'midfielder-3'],
  DEFENSE: ['defender-1', 'defender-2'],
  GOALKEEPER: ['goalkeeper']
};

export function createEmptyField(): PlayerField {
  return {
    goalkeeper: null,
    'defender-1': null,
    'defender-2': null,
    'midfielder-1': null,
    'midfielder-2': null,
    'midfielder-3': null
  };
}

export function isOutfieldPosition(positionId: FieldPositionId): positionId is OutfieldPositionId {
  return positionId !== 'goalkeeper';
}

export function isGoalkeeperCard(card: FieldCard): card is GoalkeeperCard {
  return 'kind' in card && card.kind === 'goalkeeper';
}

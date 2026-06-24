import Phaser from 'phaser';
import { FIELD_VIEW_HEIGHT, FIELD_VIEW_WIDTH } from './fieldDimensions';
import {
  getFieldPlayerForCard,
  getStartingGoalkeeper,
  type FieldPositionId,
  type GameState,
  type MidfielderPositionId,
  type Player
} from '../game';
import type { Card, GoalkeeperCard } from '../cards';
import { getGoalkeeperKitAssetKey, getTeamKitAssetKey } from '../data/teamKits';
import { createCardPlayerProfile, createGoalkeeperCardProfile } from './cardPlayerProfile';
import { CARD_HEIGHT, CARD_WIDTH, CardView } from './CardView';
import { MATCH_CARD_SCALE } from './matchCardScale';
import { MatchFieldView } from './MatchFieldView';

export { FIELD_VIEW_HEIGHT, FIELD_VIEW_WIDTH } from './fieldDimensions';
export {
  FIELD_GRASS_BASE_COLOR,
  FIELD_GRASS_DARK_STRIPE_COLOR,
  FIELD_GRASS_LIGHT_STRIPE_COLOR,
  FIELD_GRASS_STRIPE_COUNT
} from './MatchFieldView';
const GOALKEEPER_X_OFFSET = 490;
const DEFENDER_X_OFFSET = 360;
const DEFENDER_Y_OFFSET = 115;
const MIDFIELDER_X_OFFSET = 205;
const MIDFIELDER_Y_OFFSET = 185;

export type TargetSelectHandler = (positionId: FieldPositionId) => void;
export type MidfielderCommitHandler = (positionId: MidfielderPositionId) => void;
export type MidfieldGapSelectHandler = (positionId: MidfielderPositionId) => void;

export interface FieldPositionView {
  positionId: FieldPositionId;
  x: number;
  y: number;
}

interface HiddenFieldCard {
  playerId: Player['id'];
  positionId: FieldPositionId;
}

export interface FieldViewOptions {
  hiddenCards?: readonly HiddenFieldCard[];
  interactive?: boolean;
  onMidfielderCommit?: MidfielderCommitHandler;
  onOwnMidfielderSelect?: MidfielderCommitHandler;
  onMidfieldGapSelect?: MidfieldGapSelectHandler;
}

export const PLAYER_ONE_POSITIONS: readonly FieldPositionView[] = [
  { positionId: 'goalkeeper', x: -GOALKEEPER_X_OFFSET, y: 0 },
  { positionId: 'defender-1', x: -DEFENDER_X_OFFSET, y: -DEFENDER_Y_OFFSET },
  { positionId: 'defender-2', x: -DEFENDER_X_OFFSET, y: DEFENDER_Y_OFFSET },
  { positionId: 'midfielder-1', x: -MIDFIELDER_X_OFFSET, y: -MIDFIELDER_Y_OFFSET },
  { positionId: 'midfielder-2', x: -MIDFIELDER_X_OFFSET, y: 0 },
  { positionId: 'midfielder-3', x: -MIDFIELDER_X_OFFSET, y: MIDFIELDER_Y_OFFSET }
];

export const PLAYER_TWO_POSITIONS: readonly FieldPositionView[] = [
  { positionId: 'goalkeeper', x: GOALKEEPER_X_OFFSET, y: 0 },
  { positionId: 'defender-1', x: DEFENDER_X_OFFSET, y: -DEFENDER_Y_OFFSET },
  { positionId: 'defender-2', x: DEFENDER_X_OFFSET, y: DEFENDER_Y_OFFSET },
  { positionId: 'midfielder-1', x: MIDFIELDER_X_OFFSET, y: -MIDFIELDER_Y_OFFSET },
  { positionId: 'midfielder-2', x: MIDFIELDER_X_OFFSET, y: 0 },
  { positionId: 'midfielder-3', x: MIDFIELDER_X_OFFSET, y: MIDFIELDER_Y_OFFSET }
];

export class FieldView extends MatchFieldView {
  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    state: Readonly<GameState>,
    onTargetSelect: TargetSelectHandler,
    options: FieldViewOptions = {}
  ) {
    super(scene, x, y);

    this.addPlayerCards(scene, state.players[0], PLAYER_ONE_POSITIONS, state, onTargetSelect, options);
    this.addPlayerCards(scene, state.players[1], PLAYER_TWO_POSITIONS, state, onTargetSelect, options);
  }

  private addPlayerCards(
    scene: Phaser.Scene,
    player: Player,
    positions: readonly FieldPositionView[],
    state: Readonly<GameState>,
    onTargetSelect: TargetSelectHandler,
    options: FieldViewOptions
  ): void {
    positions.forEach((position) => {
      const card = player.field[position.positionId];

      if (card === null || isHidden(player.id, position.positionId, options.hiddenCards ?? [])) {
        const gapSelectable =
          card === null &&
          options.interactive !== false &&
          player.id !== state.activePlayerId &&
          isMidfielderPositionId(position.positionId) &&
          (state.legalMidfieldGapPositionIds ?? []).includes(position.positionId);

        this.addTacticalMarker(scene, position.x, position.y, player.teamColor, {
          onClick:
            gapSelectable && options.onMidfieldGapSelect !== undefined
              ? () => options.onMidfieldGapSelect?.(position.positionId as MidfielderPositionId)
              : undefined
        });
        return;
      }

      const selectable =
        options.interactive !== false && player.id !== state.activePlayerId && state.legalTargetPositionIds.includes(position.positionId);
      const committable =
        options.interactive !== false &&
        player.id === state.activePlayerId &&
        isMidfielderPositionId(position.positionId) &&
        (state.committableMidfielderPositionIds ?? []).includes(position.positionId);
      const tutorialSelectableOwnMidfielder =
        options.interactive !== false &&
        player.id === state.activePlayerId &&
        isMidfielderPositionId(position.positionId) &&
        options.onOwnMidfielderSelect !== undefined;
      const setup = state.matchSetups[player.id];
      const isGoalkeeper = position.positionId === 'goalkeeper';
      const cardView = new CardView(scene, position.x, position.y, {
        rank: card.rank,
        color: isGoalkeeper ? player.teamColor : (card as Card).color,
        playerProfile:
          setup === undefined
            ? undefined
            : isGoalkeeper
              ? createGoalkeeperCardProfile(setup.flagCode, getStartingGoalkeeper(setup), (card as GoalkeeperCard).rank)
              : createCardPlayerProfile(setup.flagCode, getFieldPlayerForCard(setup, card as Card)),
        kitTextureKey:
          setup === undefined
            ? undefined
            : isGoalkeeper
              ? getGoalkeeperKitAssetKey(setup.goalkeeperKitId)
              : getTeamKitAssetKey(setup.flagCode),
        label: isGoalkeeper ? 'GK' : '',
        onClick: selectable
          ? () => onTargetSelect(position.positionId)
          : committable && options.onMidfielderCommit !== undefined
            ? () => options.onMidfielderCommit?.(position.positionId as MidfielderPositionId)
            : tutorialSelectableOwnMidfielder
              ? () => options.onOwnMidfielderSelect?.(position.positionId as MidfielderPositionId)
            : undefined
      });
      cardView.setScale(MATCH_CARD_SCALE);
      cardView.setData('fieldSourcePlayerId', player.id);
      cardView.setData('fieldSourcePositionId', position.positionId);
      this.add(cardView);
    });
  }

  private addTacticalMarker(
    scene: Phaser.Scene,
    x: number,
    y: number,
    teamColor: Player['teamColor'],
    options: { onClick?: () => void } = {}
  ): void {
    const markerColor = teamColor === 'RED' ? 0xc43845 : 0xd9eadf;
    const shadow = scene.add.circle(x + 3, y + 4, 17, 0x062519, 0.34);
    const outer = scene.add.circle(x, y, 16, markerColor, 0.18);
    outer.setStrokeStyle(3, markerColor, 0.82);
    const inner = scene.add.circle(x, y, 6, markerColor, 0.92);

    if (options.onClick !== undefined) {
      const clickTarget = scene.add.rectangle(x, y, CARD_WIDTH * MATCH_CARD_SCALE, CARD_HEIGHT * MATCH_CARD_SCALE, 0xffffff, 0.01);
      clickTarget.setInteractive({ useHandCursor: true });
      clickTarget.on('pointerdown', options.onClick);
      outer.setFillStyle(0xf0c95a, 0.22);
      outer.setStrokeStyle(4, 0xf0c95a, 0.95);
      this.add([shadow, outer, inner, clickTarget]);
      return;
    }

    this.add([shadow, outer, inner]);
  }

}

export function getFieldCardPosition(
  centerX: number,
  centerY: number,
  state: Readonly<GameState>,
  playerId: Player['id'],
  positionId: FieldPositionId
): { x: number; y: number } {
  const playerIndex = state.players.findIndex((player) => player.id === playerId);
  const positions = playerIndex === 0 ? PLAYER_ONE_POSITIONS : PLAYER_TWO_POSITIONS;
  const position = positions.find((item) => item.positionId === positionId);

  if (position === undefined) {
    throw new Error(`Unknown field position "${positionId}".`);
  }

  return {
    x: centerX + position.x,
    y: centerY + position.y
  };
}

function isHidden(playerId: Player['id'], positionId: FieldPositionId, hiddenCards: readonly HiddenFieldCard[]): boolean {
  return hiddenCards.some((card) => card.playerId === playerId && card.positionId === positionId);
}

function isMidfielderPositionId(positionId: FieldPositionId): positionId is MidfielderPositionId {
  return positionId === 'midfielder-1' || positionId === 'midfielder-2' || positionId === 'midfielder-3';
}

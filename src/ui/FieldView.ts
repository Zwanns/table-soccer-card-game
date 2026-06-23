import Phaser from 'phaser';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
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

export { FIELD_VIEW_HEIGHT, FIELD_VIEW_WIDTH } from './fieldDimensions';
export const FIELD_GRASS_STRIPE_COUNT = 14;
export const FIELD_GRASS_BASE_COLOR = 0x157a43;
export const FIELD_GRASS_LIGHT_STRIPE_COLOR = 0x19864a;
export const FIELD_GRASS_DARK_STRIPE_COLOR = 0x126d3c;
const FIELD_MARKING_COLOR = 0xe2efe6;
const FIELD_MARKING_ALPHA = 0.42;
const FIELD_MARKING_WIDTH = 2;
const FIELD_GOAL_DEPTH = 42;
const FIELD_GOAL_HEIGHT = 131;
const FIELD_GOAL_FRAME_WIDTH = 4;
const FIELD_GOAL_FRAME_ALPHA = 0.55;
const FIELD_GOAL_NET_WIDTH = 1;
const FIELD_GOAL_NET_ALPHA = 0.24;
const FIELD_GOAL_NET_CELL_SIZE = 7;
const FIELD_CORNER_ARC_RADIUS = 22;
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

export class FieldView extends Phaser.GameObjects.Container {
  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    state: Readonly<GameState>,
    onTargetSelect: TargetSelectHandler,
    options: FieldViewOptions = {}
  ) {
    super(scene, x, y);

    const centerLine = scene.add.rectangle(0, 0, 2, FIELD_VIEW_HEIGHT, 0xe2efe6, 0.42);
    const centerCircle = scene.add.circle(0, 0, 80);
    centerCircle.setStrokeStyle(2, 0xe2efe6, 0.45);

    this.add([this.createStripedPitch(scene, x, y), this.createPitchMarkings(scene), this.createGoals(scene), centerLine, centerCircle]);

    this.addPlayerCards(scene, state.players[0], PLAYER_ONE_POSITIONS, state, onTargetSelect, options);
    this.addPlayerCards(scene, state.players[1], PLAYER_TWO_POSITIONS, state, onTargetSelect, options);

    scene.add.existing(this);
  }

  private createStripedPitch(scene: Phaser.Scene, centerX: number, centerY: number): Phaser.GameObjects.Graphics {
    const pitch = scene.add.graphics();
    const pitchLeft = -FIELD_VIEW_WIDTH / 2;
    const pitchTop = -FIELD_VIEW_HEIGHT / 2;
    const grassLeft = -centerX;
    const grassTop = -centerY;
    const stripeWidth = FIELD_VIEW_WIDTH / FIELD_GRASS_STRIPE_COUNT;
    const firstStripeIndex = Math.floor((grassLeft - pitchLeft) / stripeWidth);
    const lastStripeIndex = Math.ceil((grassLeft + SCENE_WIDTH - pitchLeft) / stripeWidth);

    pitch.fillStyle(FIELD_GRASS_BASE_COLOR, 1);
    pitch.fillRect(grassLeft, grassTop, SCENE_WIDTH, SCENE_HEIGHT);

    for (let stripeIndex = firstStripeIndex; stripeIndex < lastStripeIndex; stripeIndex += 1) {
      const stripeColor = stripeIndex % 2 === 0 ? FIELD_GRASS_LIGHT_STRIPE_COLOR : FIELD_GRASS_DARK_STRIPE_COLOR;
      pitch.fillStyle(stripeColor, 0.28);
      pitch.fillRect(pitchLeft + stripeIndex * stripeWidth, grassTop, stripeWidth, SCENE_HEIGHT);
    }

    pitch.lineStyle(3, FIELD_MARKING_COLOR, 1);
    pitch.strokeRect(pitchLeft, pitchTop, FIELD_VIEW_WIDTH, FIELD_VIEW_HEIGHT);

    return pitch;
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

  private createPitchMarkings(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const markings = scene.add.graphics();
    const pitchLeft = -FIELD_VIEW_WIDTH / 2;
    const pitchRight = FIELD_VIEW_WIDTH / 2;
    const pitchTop = -FIELD_VIEW_HEIGHT / 2;
    const pitchBottom = FIELD_VIEW_HEIGHT / 2;

    markings.lineStyle(FIELD_MARKING_WIDTH, FIELD_MARKING_COLOR, FIELD_MARKING_ALPHA);

    markings.strokeRect(pitchLeft, -180, 150, 360);
    markings.strokeRect(pitchRight - 150, -180, 150, 360);

    markings.strokeRect(pitchLeft, -95, 70, 190);
    markings.strokeRect(pitchRight - 70, -95, 70, 190);

    markings.strokeCircle(-450, 0, 4);
    markings.strokeCircle(450, 0, 4);

    markings.beginPath();
    markings.arc(-450, 0, 72, Phaser.Math.DegToRad(-56), Phaser.Math.DegToRad(56), false);
    markings.strokePath();

    markings.beginPath();
    markings.arc(450, 0, 72, Phaser.Math.DegToRad(124), Phaser.Math.DegToRad(236), false);
    markings.strokePath();

    markings.beginPath();
    markings.arc(pitchLeft, pitchTop, FIELD_CORNER_ARC_RADIUS, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(90), false);
    markings.strokePath();

    markings.beginPath();
    markings.arc(pitchRight, pitchTop, FIELD_CORNER_ARC_RADIUS, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(180), false);
    markings.strokePath();

    markings.beginPath();
    markings.arc(pitchRight, pitchBottom, FIELD_CORNER_ARC_RADIUS, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(270), false);
    markings.strokePath();

    markings.beginPath();
    markings.arc(pitchLeft, pitchBottom, FIELD_CORNER_ARC_RADIUS, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(360), false);
    markings.strokePath();

    return markings;
  }

  private createGoals(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const goals = scene.add.graphics();
    const pitchLeft = -FIELD_VIEW_WIDTH / 2;
    const pitchRight = FIELD_VIEW_WIDTH / 2;
    const goalTop = -FIELD_GOAL_HEIGHT / 2;

    drawGoal(
      goals,
      pitchLeft - FIELD_GOAL_DEPTH,
      goalTop,
      FIELD_GOAL_DEPTH,
      FIELD_GOAL_HEIGHT,
      FIELD_GOAL_NET_CELL_SIZE
    );
    drawGoal(goals, pitchRight, goalTop, FIELD_GOAL_DEPTH, FIELD_GOAL_HEIGHT, FIELD_GOAL_NET_CELL_SIZE);

    return goals;
  }
}

function drawGoal(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  netCellSize: number
): void {
  graphics.lineStyle(FIELD_GOAL_NET_WIDTH, FIELD_MARKING_COLOR, FIELD_GOAL_NET_ALPHA);

  for (let netX = x + netCellSize; netX < x + width; netX += netCellSize) {
    graphics.lineBetween(netX, y, netX, y + height);
  }

  for (let netY = y + netCellSize; netY < y + height; netY += netCellSize) {
    graphics.lineBetween(x, netY, x + width, netY);
  }

  graphics.lineStyle(FIELD_GOAL_FRAME_WIDTH, FIELD_MARKING_COLOR, FIELD_GOAL_FRAME_ALPHA);
  graphics.strokeRect(x, y, width, height);
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

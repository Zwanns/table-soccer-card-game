import Phaser from 'phaser';
import { getFieldPlayerForCard, getStartingGoalkeeper, type FieldPositionId, type GameState, type Player } from '../game';
import type { Card, GoalkeeperCard } from '../cards';
import { getGoalkeeperKitAssetKey, getTeamKitAssetKey } from '../data/teamKits';
import { createCardPlayerProfile, createGoalkeeperCardProfile } from './cardPlayerProfile';
import { CARD_HEIGHT, CARD_WIDTH, CardView } from './CardView';

export type TargetSelectHandler = (positionId: FieldPositionId) => void;

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
}

export const PLAYER_ONE_POSITIONS: readonly FieldPositionView[] = [
  { positionId: 'goalkeeper', x: -490, y: 0 },
  { positionId: 'defender-1', x: -360, y: -115 },
  { positionId: 'defender-2', x: -360, y: 115 },
  { positionId: 'midfielder-1', x: -205, y: -165 },
  { positionId: 'midfielder-2', x: -205, y: 0 },
  { positionId: 'midfielder-3', x: -205, y: 165 }
];

export const PLAYER_TWO_POSITIONS: readonly FieldPositionView[] = [
  { positionId: 'goalkeeper', x: 490, y: 0 },
  { positionId: 'defender-1', x: 360, y: -115 },
  { positionId: 'defender-2', x: 360, y: 115 },
  { positionId: 'midfielder-1', x: 205, y: -165 },
  { positionId: 'midfielder-2', x: 205, y: 0 },
  { positionId: 'midfielder-3', x: 205, y: 165 }
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

    const pitch = scene.add.rectangle(0, 0, 1120, 600, 0x0d6a42, 1);
    pitch.setStrokeStyle(3, 0xe2efe6);

    const centerLine = scene.add.rectangle(0, 0, 2, 580, 0xe2efe6, 0.42);
    const centerCircle = scene.add.circle(0, 0, 80);
    centerCircle.setStrokeStyle(2, 0xe2efe6, 0.45);

    this.add([pitch, this.createPitchMarkings(scene), centerLine, centerCircle]);

    this.addPlayerCards(scene, state.players[0], PLAYER_ONE_POSITIONS, state, onTargetSelect, options);
    this.addPlayerCards(scene, state.players[1], PLAYER_TWO_POSITIONS, state, onTargetSelect, options);

    scene.add.existing(this);
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
        this.addTacticalMarker(scene, position.x, position.y, player.teamColor);
        return;
      }

      const selectable =
        options.interactive !== false && player.id !== state.activePlayerId && state.legalTargetPositionIds.includes(position.positionId);
      const setup = state.matchSetups[player.id];
      const isGoalkeeper = position.positionId === 'goalkeeper';
      this.add(
        new CardView(scene, position.x, position.y, {
          rank: card.rank,
          color: isGoalkeeper ? player.teamColor : (card as Card).color,
          playerProfile:
            setup === undefined
              ? undefined
              : isGoalkeeper
                ? createGoalkeeperCardProfile(setup.teamId, getStartingGoalkeeper(setup), (card as GoalkeeperCard).rank)
                : createCardPlayerProfile(setup.teamId, getFieldPlayerForCard(setup, card as Card)),
          kitTextureKey:
            setup === undefined
              ? undefined
              : isGoalkeeper
                ? getGoalkeeperKitAssetKey(setup.goalkeeperKitId)
                : getTeamKitAssetKey(setup.teamId, setup.fieldKit),
          label: isGoalkeeper ? 'GK' : '',
          onClick: selectable ? () => onTargetSelect(position.positionId) : undefined
        })
      );
    });
  }

  private addTacticalMarker(scene: Phaser.Scene, x: number, y: number, teamColor: Player['teamColor']): void {
    const markerColor = teamColor === 'RED' ? 0xc43845 : 0xd9eadf;
    const shadow = scene.add.circle(x + 3, y + 4, 17, 0x062519, 0.34);
    const outer = scene.add.circle(x, y, 16, markerColor, 0.18);
    outer.setStrokeStyle(3, markerColor, 0.82);
    const inner = scene.add.circle(x, y, 6, markerColor, 0.92);

    this.add([shadow, outer, inner]);
  }

  private createPitchMarkings(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const markings = scene.add.graphics();
    const lineColor = 0xe2efe6;
    const lineAlpha = 0.42;
    const lineWidth = 2;

    markings.lineStyle(lineWidth, lineColor, lineAlpha);

    markings.strokeRect(-560, -180, 150, 360);
    markings.strokeRect(410, -180, 150, 360);

    markings.strokeRect(-560, -95, 70, 190);
    markings.strokeRect(490, -95, 70, 190);

    markings.strokeCircle(-450, 0, 4);
    markings.strokeCircle(450, 0, 4);

    markings.beginPath();
    markings.arc(-450, 0, 72, Phaser.Math.DegToRad(-56), Phaser.Math.DegToRad(56), false);
    markings.strokePath();

    markings.beginPath();
    markings.arc(450, 0, 72, Phaser.Math.DegToRad(124), Phaser.Math.DegToRad(236), false);
    markings.strokePath();

    return markings;
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

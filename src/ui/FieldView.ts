import Phaser from 'phaser';
import type { Card } from '../cards';
import type { FieldPositionId, GameState, Player } from '../game';
import { CardView } from './CardView';

export type TargetSelectHandler = (positionId: FieldPositionId) => void;

interface FieldPositionView {
  positionId: FieldPositionId;
  x: number;
  y: number;
}

const PLAYER_ONE_POSITIONS: readonly FieldPositionView[] = [
  { positionId: 'goalkeeper', x: -490, y: 0 },
  { positionId: 'defender-1', x: -360, y: -115 },
  { positionId: 'defender-2', x: -360, y: 115 },
  { positionId: 'midfielder-1', x: -205, y: -165 },
  { positionId: 'midfielder-2', x: -205, y: 0 },
  { positionId: 'midfielder-3', x: -205, y: 165 }
];

const PLAYER_TWO_POSITIONS: readonly FieldPositionView[] = [
  { positionId: 'goalkeeper', x: 490, y: 0 },
  { positionId: 'defender-1', x: 360, y: -115 },
  { positionId: 'defender-2', x: 360, y: 115 },
  { positionId: 'midfielder-1', x: 205, y: -165 },
  { positionId: 'midfielder-2', x: 205, y: 0 },
  { positionId: 'midfielder-3', x: 205, y: 165 }
];

export class FieldView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, state: Readonly<GameState>, onTargetSelect: TargetSelectHandler) {
    super(scene, x, y);

    const pitch = scene.add.rectangle(0, 0, 1120, 600, 0x0d6a42, 1);
    pitch.setStrokeStyle(3, 0xe2efe6);

    const centerLine = scene.add.rectangle(0, 0, 2, 580, 0xe2efe6, 0.42);
    const centerCircle = scene.add.circle(0, 0, 80);
    centerCircle.setStrokeStyle(2, 0xe2efe6, 0.45);

    const playerOneLabel = this.createLabel(scene, -525, -260, state.players[0].name);
    const playerTwoLabel = this.createLabel(scene, 425, -260, state.players[1].name);

    this.add([pitch, centerLine, centerCircle, playerTwoLabel, playerOneLabel]);

    this.addPlayerCards(scene, state.players[0], PLAYER_ONE_POSITIONS, state, onTargetSelect);
    this.addPlayerCards(scene, state.players[1], PLAYER_TWO_POSITIONS, state, onTargetSelect);

    scene.add.existing(this);
  }

  private createLabel(scene: Phaser.Scene, x: number, y: number, text: string): Phaser.GameObjects.Text {
    return scene.add
      .text(x, y, text, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
  }

  private addPlayerCards(
    scene: Phaser.Scene,
    player: Player,
    positions: readonly FieldPositionView[],
    state: Readonly<GameState>,
    onTargetSelect: TargetSelectHandler
  ): void {
    positions.forEach((position) => {
      const card = player.field[position.positionId];

      if (card === null) {
        this.addEmptySlot(scene, position.x, position.y);
        return;
      }

      const selectable = player.id !== state.activePlayerId && state.legalTargetPositionIds.includes(position.positionId);
      this.add(
        new CardView(scene, position.x, position.y, {
          rank: card.rank,
          suit: getCardSuitSymbol(card),
          label: position.positionId === 'goalkeeper' ? 'GK' : '',
          onClick: selectable ? () => onTargetSelect(position.positionId) : undefined
        })
      );
    });
  }

  private addEmptySlot(scene: Phaser.Scene, x: number, y: number): void {
    const slot = scene.add.rectangle(x, y, 96, 132, 0x0b5738, 0.18);
    slot.setStrokeStyle(2, 0xcfe3d4, 0.25);
    this.add(slot);
  }
}

function getCardSuitSymbol(card: Card): string | undefined {
  switch (card.suit) {
    case 'HEARTS':
      return '♥';
    case 'DIAMONDS':
      return '♦';
    case 'CLUBS':
      return '♣';
    case 'SPADES':
      return '♠';
    default:
      return undefined;
  }
}

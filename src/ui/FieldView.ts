import Phaser from 'phaser';
import { CardView } from './CardView';
import { DeckView } from './DeckView';
import { StatusPanel } from './StatusPanel';

interface FieldCardData {
  rank: string;
  suit: string;
  label: string;
}

const TOP_FIELD: readonly FieldCardData[] = [
  { rank: 'K', suit: '♣', label: 'GK' },
  { rank: '9', suit: '♠', label: 'D1' },
  { rank: 'Q', suit: '♣', label: 'D2' },
  { rank: '7', suit: '♠', label: 'M1' },
  { rank: '10', suit: '♣', label: 'M2' },
  { rank: 'A', suit: '♠', label: 'M3' }
];

const BOTTOM_FIELD: readonly FieldCardData[] = [
  { rank: 'A', suit: '♦', label: 'GK' },
  { rank: 'Q', suit: '♦', label: 'D1' },
  { rank: '9', suit: '♥', label: 'D2' },
  { rank: 'J', suit: '♥', label: 'M1' },
  { rank: '8', suit: '♦', label: 'M2' },
  { rank: '6', suit: '♥', label: 'M3' }
];

export class FieldView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const pitch = scene.add.rectangle(0, 0, 1248, 600, 0x0d6a42, 1);
    pitch.setStrokeStyle(3, 0xe2efe6);

    const centerLine = scene.add.rectangle(0, 0, 2, 580, 0xe2efe6, 0.42);
    const centerCircle = scene.add.circle(0, 0, 80);
    centerCircle.setStrokeStyle(2, 0xe2efe6, 0.45);

    const playerOneLabel = this.createLabel(scene, -590, -260, 'Игрок 1');
    const playerTwoLabel = this.createLabel(scene, 490, -260, 'Игрок 2');
    const playerOneDeckLabel = this.createLabel(scene, -605, 254, 'Колода: 21');
    const playerTwoDeckLabel = this.createLabel(scene, 490, 254, 'Колода: 21');

    this.add([pitch, centerLine, centerCircle, playerTwoLabel, playerTwoDeckLabel, playerOneLabel, playerOneDeckLabel]);

    this.add([
      new DeckView(scene, -570, 190, 21),
      new DeckView(scene, 570, 190, 21),
      new StatusPanel(scene, 0, 268, 'A', 'Ход игрока 1')
    ]);

    this.addCards(scene, TOP_FIELD, [
      [555, 0],
      [410, -115],
      [410, 115],
      [235, -165],
      [235, 0],
      [235, 165]
    ]);

    this.addCards(scene, BOTTOM_FIELD, [
      [-555, 0],
      [-410, -115],
      [-410, 115],
      [-235, -165],
      [-235, 0],
      [-235, 165]
    ]);

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

  private addCards(scene: Phaser.Scene, cards: readonly FieldCardData[], positions: Array<[number, number]>): void {
    cards.forEach((card, index) => {
      const [cardX, cardY] = positions[index] ?? [0, 0];
      this.add(new CardView(scene, cardX, cardY, card));
    });
  }
}

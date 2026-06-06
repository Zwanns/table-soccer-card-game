import Phaser from 'phaser';
import { CardView } from './CardView';
import { DeckView } from './DeckView';
import { ScoreView } from './ScoreView';
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

    const pitch = scene.add.rectangle(0, 0, 1160, 560, 0x0d6a42, 1);
    pitch.setStrokeStyle(3, 0xe2efe6);

    const centerLine = scene.add.line(0, 0, 0, -250, 0, 250, 0xe2efe6, 0.55);
    const centerCircle = scene.add.circle(0, 0, 80);
    centerCircle.setStrokeStyle(2, 0xe2efe6, 0.45);

    const playerOneLabel = this.createLabel(scene, -535, -238, 'Игрок 1');
    const playerTwoLabel = this.createLabel(scene, 430, -238, 'Игрок 2');
    const playerOneDeckLabel = this.createLabel(scene, -535, 224, 'Колода: 21');
    const playerTwoDeckLabel = this.createLabel(scene, 430, 224, 'Колода: 21');

    this.add([pitch, centerLine, centerCircle, playerTwoLabel, playerTwoDeckLabel, playerOneLabel, playerOneDeckLabel]);

    this.add([
      new DeckView(scene, -492, 170, 21),
      new DeckView(scene, 492, 170, 21),
      new ScoreView(scene, 0, -210, 0, 0),
      new StatusPanel(scene, 0, 240, 'A ♥', 'Ход игрока 1')
    ]);

    this.addCards(scene, TOP_FIELD, [
      [455, 0],
      [315, -74],
      [315, 74],
      [150, -108],
      [150, 0],
      [150, 108]
    ]);

    this.addCards(scene, BOTTOM_FIELD, [
      [-455, 0],
      [-315, -74],
      [-315, 74],
      [-150, -108],
      [-150, 0],
      [-150, 108]
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

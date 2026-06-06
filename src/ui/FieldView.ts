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
  { rank: 'J', suit: '♥', label: 'M1' },
  { rank: '8', suit: '♦', label: 'M2' },
  { rank: '6', suit: '♥', label: 'M3' },
  { rank: 'Q', suit: '♦', label: 'D1' },
  { rank: '9', suit: '♥', label: 'D2' },
  { rank: 'A', suit: '♦', label: 'GK' }
];

export class FieldView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const pitch = scene.add.rectangle(0, 0, 1120, 620, 0x0d6a42, 1);
    pitch.setStrokeStyle(3, 0xe2efe6);

    const centerLine = scene.add.line(0, 0, -520, 0, 520, 0, 0xe2efe6, 0.55);
    const centerCircle = scene.add.circle(0, 0, 80);
    centerCircle.setStrokeStyle(2, 0xe2efe6, 0.45);

    const playerTwoLabel = this.createLabel(scene, -515, -280, 'Игрок 2');
    const playerTwoDeckLabel = this.createLabel(scene, 400, -280, 'Колода: 21');
    const playerOneLabel = this.createLabel(scene, -515, 234, 'Игрок 1');
    const playerOneDeckLabel = this.createLabel(scene, 400, 234, 'Колода: 21');

    this.add([pitch, centerLine, centerCircle, playerTwoLabel, playerTwoDeckLabel, playerOneLabel, playerOneDeckLabel]);

    new DeckView(scene, x + 500, y - 230, 21);
    new DeckView(scene, x + 500, y + 250, 21);
    new ScoreView(scene, x, y, 0, 0);
    new StatusPanel(scene, x, y + 296, 'A ♥', 'Ход игрока 1');

    this.addCards(scene, TOP_FIELD, [
      [0, -220],
      [-120, -130],
      [120, -130],
      [-200, -42],
      [0, -42],
      [200, -42]
    ]);

    this.addCards(scene, BOTTOM_FIELD, [
      [-200, 86],
      [0, 86],
      [200, 86],
      [-120, 176],
      [120, 176],
      [0, 264]
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
      new CardView(scene, this.x + cardX, this.y + cardY, card);
    });
  }
}

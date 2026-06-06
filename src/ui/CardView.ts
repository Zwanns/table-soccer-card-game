import Phaser from 'phaser';

export interface CardViewOptions {
  rank: string;
  suit?: string;
  faceDown?: boolean;
  label?: string;
}

const CARD_WIDTH = 72;
const CARD_HEIGHT = 98;

export class CardView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, options: CardViewOptions) {
    super(scene, x, y);

    const fillColor = options.faceDown ? 0x214f6b : 0xf6f1e7;
    const strokeColor = options.faceDown ? 0x7bb8d8 : 0x1f2a2e;
    const rankColor = options.suit === '♥' || options.suit === '♦' ? '#b72f37' : '#1f2a2e';

    const body = scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, fillColor, 1);
    body.setStrokeStyle(2, strokeColor);

    const title = scene.add
      .text(0, options.suit === undefined ? 0 : -16, options.faceDown ? '' : options.rank, {
        color: rankColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: options.rank.length > 2 ? '18px' : '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const suit = scene.add
      .text(0, 18, options.faceDown ? '' : options.suit ?? '', {
        color: rankColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const label = scene.add
      .text(0, CARD_HEIGHT / 2 + 16, options.label ?? '', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px'
      })
      .setOrigin(0.5);

    this.add([body, title, suit, label]);
    scene.add.existing(this);
  }
}

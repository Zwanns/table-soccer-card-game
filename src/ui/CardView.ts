import Phaser from 'phaser';
import type { CardColor } from '../cards';

export interface CardViewOptions {
  rank: string;
  suit?: string;
  color?: CardColor;
  faceDown?: boolean;
  label?: string;
  highlighted?: boolean;
  onClick?: () => void;
}

const CARD_WIDTH = 96;
const CARD_HEIGHT = 132;

export class CardView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, options: CardViewOptions) {
    super(scene, x, y);

    const fillColor = options.faceDown ? 0x214f6b : 0xf6f1e7;
    const strokeColor = options.highlighted === true ? 0xf0c95a : options.faceDown ? 0x7bb8d8 : 0x1f2a2e;
    const rankColor = getRankColor(options);
    const positionLabel = options.label === 'GK' ? options.label : '';

    const body = scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, fillColor, 1);
    body.setStrokeStyle(options.highlighted === true ? 5 : 2, strokeColor);

    const title = scene.add
      .text(0, 0, options.faceDown ? '' : options.rank, {
        color: rankColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: options.rank.length > 2 ? '24px' : '40px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const label = scene.add
      .text(0, CARD_HEIGHT / 2 + 18, positionLabel, {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add([body, title, label]);

    if (options.onClick !== undefined) {
      body.setInteractive({ useHandCursor: true });
      body.on('pointerdown', options.onClick);
    }

    scene.add.existing(this);
  }
}

function getRankColor(options: CardViewOptions): string {
  if (options.color === 'RED') {
    return '#b72f37';
  }

  if (options.color === 'BLACK') {
    return '#1f2a2e';
  }

  return options.suit === '♥' || options.suit === '♦' ? '#b72f37' : '#1f2a2e';
}

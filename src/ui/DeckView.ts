import Phaser from 'phaser';
import { CardView } from './CardView';

const DECK_WIDTH = 96;
const DECK_HEIGHT = 132;

export interface DeckViewOptions {
  active?: boolean;
  attackCardRank?: string;
}

export class DeckView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, count: number, options: DeckViewOptions = {}) {
    super(scene, x, y);

    const back = scene.add.rectangle(-10, 10, DECK_WIDTH, DECK_HEIGHT, 0x17384c);
    back.setStrokeStyle(2, 0x85bfd5);

    const front = scene.add.rectangle(0, 0, DECK_WIDTH, DECK_HEIGHT, 0x214f6b);
    front.setStrokeStyle(2, 0x9ed0e0);

    const countText = scene.add
      .text(0, DECK_HEIGHT / 2 + 28, `${count}`, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add([back, front, countText]);

    if (options.attackCardRank !== undefined) {
      this.add(new CardView(scene, 0, 0, { rank: options.attackCardRank }));
    }

    if (options.active === true) {
      const marker = scene.add
        .text(0, -DECK_HEIGHT / 2 - 32, 'ХОД', {
          color: '#1f2a2e',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: '700',
          backgroundColor: '#f0c95a',
          padding: {
            x: 12,
            y: 5
          }
        })
        .setOrigin(0.5);

      this.add(marker);
    }

    scene.add.existing(this);
  }
}

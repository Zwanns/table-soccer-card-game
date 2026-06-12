import Phaser from 'phaser';
import { fitImageContain, getFallbackCoverTextureKey } from '../assets/teamCover';
import type { CardColor } from '../cards';
import type { CardPlayerProfile } from './cardPlayerProfile';
import { CARD_HEIGHT, CARD_WIDTH, CardView } from './CardView';
import { KIT_CARD_LAYOUT } from './kitCardFaceModel';

const DECK_WIDTH = CARD_WIDTH;
const DECK_HEIGHT = CARD_HEIGHT;

export interface DeckViewOptions {
  active?: boolean;
  attackCardRank?: string;
  attackCardColor?: CardColor;
  attackCardKitTextureKey?: string;
  attackCardPlayerProfile?: CardPlayerProfile;
  coverTextureKey?: string;
  countSide?: 'left' | 'right';
  onClick?: () => void;
}

export class DeckView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, count: number, options: DeckViewOptions = {}) {
    super(scene, x, y);

    const back = createRoundedDeckCard(scene, -10, 10, 0x17384c, 0x85bfd5);

    const frontBackground = createRoundedDeckCard(scene, 0, 0, 0x214f6b, 0x9ed0e0);
    const cover = scene.add.image(0, 0, options.coverTextureKey ?? getFallbackCoverTextureKey());
    fitImageContain(cover, {
      width: DECK_WIDTH,
      height: DECK_HEIGHT
    });
    const frontBorder = createRoundedDeckBorder(scene, 0, 0, 0x9ed0e0);

    const countOffsetX = options.countSide === 'left' ? -84 : 84;
    const countText = scene.add
      .text(countOffsetX, 0, `${count}`, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add([back, frontBackground, cover, frontBorder, countText]);

    if (options.attackCardRank !== undefined) {
      this.add(
        new CardView(scene, 0, 0, {
          rank: options.attackCardRank,
          color: options.attackCardColor,
          kitTextureKey: options.attackCardKitTextureKey,
          playerProfile: options.attackCardPlayerProfile
        })
      );
    }

    if (options.active === true) {
      const marker = scene.add.image(0, -DECK_HEIGHT / 2 - 30, 'turn-ball');
      marker.setDisplaySize(34, 34);

      scene.tweens.add({
        targets: marker,
        y: marker.y - 6,
        duration: 720,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });

      this.add(marker);
    }

    if (options.onClick !== undefined) {
      const clickTarget = scene.add.rectangle(0, 0, DECK_WIDTH + 24, DECK_HEIGHT + 24, 0xffffff, 0.01);
      clickTarget.setInteractive({ useHandCursor: true });
      clickTarget.on('pointerdown', options.onClick);
      this.add(clickTarget);
    }

    scene.add.existing(this);
  }
}

function createRoundedDeckCard(
  scene: Phaser.Scene,
  x: number,
  y: number,
  fillColor: number,
  strokeColor: number
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  graphics.fillStyle(fillColor, 1);
  graphics.fillRoundedRect(
    x - DECK_WIDTH / 2,
    y - DECK_HEIGHT / 2,
    DECK_WIDTH,
    DECK_HEIGHT,
    KIT_CARD_LAYOUT.deckCornerRadius
  );
  graphics.lineStyle(2, strokeColor, 1);
  graphics.strokeRoundedRect(
    x - DECK_WIDTH / 2,
    y - DECK_HEIGHT / 2,
    DECK_WIDTH,
    DECK_HEIGHT,
    KIT_CARD_LAYOUT.deckCornerRadius
  );

  return graphics;
}

function createRoundedDeckBorder(
  scene: Phaser.Scene,
  x: number,
  y: number,
  strokeColor: number
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  graphics.lineStyle(2, strokeColor, 1);
  graphics.strokeRoundedRect(
    x - DECK_WIDTH / 2,
    y - DECK_HEIGHT / 2,
    DECK_WIDTH,
    DECK_HEIGHT,
    KIT_CARD_LAYOUT.deckCornerRadius
  );

  return graphics;
}

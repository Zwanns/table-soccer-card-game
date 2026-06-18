import Phaser from 'phaser';
import { fitImageContain, getFallbackCoverTextureKey } from '../assets/teamCover';
import type { CardColor } from '../cards';
import type { CardPlayerProfile } from './cardPlayerProfile';
import { CARD_HEIGHT, CARD_WIDTH, CardView } from './CardView';
import { KIT_CARD_LAYOUT } from './kitCardFaceModel';

const DECK_WIDTH = CARD_WIDTH;
const DECK_HEIGHT = CARD_HEIGHT;
const DECK_STACK_SCALE = 1.12;
const DECK_COUNT_OFFSET_Y = DECK_HEIGHT * DECK_STACK_SCALE / 2 + 32;
const DECK_MARKER_SIZE = 34;
export const DECK_MARKER_BOUNCE_HEIGHT = 24;
const DECK_MARKER_DECK_OVERLAP_RATIO = 1 / 3;
const DECK_MARKER_BOUNCE_UP_MS = 360;
const DECK_MARKER_BOUNCE_DOWN_MS = 260;
const DECK_MARKER_SQUASH_MS = 64;

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

    const deckStack = scene.add.container(0, 0);
    const back = createRoundedDeckCard(scene, -10, 10, 0x17384c, 0x85bfd5);

    const frontBackground = createRoundedDeckCard(scene, 0, 0, 0x214f6b, 0x9ed0e0);
    const cover = scene.add.image(0, 0, options.coverTextureKey ?? getFallbackCoverTextureKey());
    fitImageContain(cover, {
      width: DECK_WIDTH,
      height: DECK_HEIGHT
    });
    const frontBorder = createRoundedDeckBorder(scene, 0, 0, 0x9ed0e0);

    const countText = scene.add
      .text(0, DECK_COUNT_OFFSET_Y, `${count}`, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    deckStack.add([back, frontBackground, cover, frontBorder]);

    if (options.attackCardRank !== undefined) {
      deckStack.add(
        new CardView(scene, 0, 0, {
          rank: options.attackCardRank,
          color: options.attackCardColor,
          kitTextureKey: options.attackCardKitTextureKey,
          playerProfile: options.attackCardPlayerProfile
        })
      );
    }

    deckStack.setScale(DECK_STACK_SCALE);
    this.add([deckStack, countText]);

    if (options.active === true) {
      const markerSide = options.countSide ?? 'right';
      const deckEdgeX = markerSide === 'right' ? DECK_WIDTH * DECK_STACK_SCALE / 2 : -DECK_WIDTH * DECK_STACK_SCALE / 2;
      const markerX =
        markerSide === 'right'
          ? deckEdgeX - DECK_MARKER_SIZE * DECK_MARKER_DECK_OVERLAP_RATIO
          : deckEdgeX + DECK_MARKER_SIZE * DECK_MARKER_DECK_OVERLAP_RATIO;
      const marker = scene.add.image(markerX, -DECK_HEIGHT * DECK_STACK_SCALE / 2 - 30, 'turn-ball');
      marker.setDisplaySize(DECK_MARKER_SIZE, DECK_MARKER_SIZE);
      const baseY = marker.y;
      const baseScaleX = marker.scaleX;
      const baseScaleY = marker.scaleY;

      const bounceTween = scene.tweens.chain({
        targets: marker,
        loop: -1,
        tweens: [
          {
            y: baseY - DECK_MARKER_BOUNCE_HEIGHT,
            duration: DECK_MARKER_BOUNCE_UP_MS,
            ease: 'Quad.easeOut'
          },
          {
            y: baseY,
            duration: DECK_MARKER_BOUNCE_DOWN_MS,
            ease: 'Quad.easeIn'
          },
          {
            scaleX: baseScaleX * 1.08,
            scaleY: baseScaleY * 0.92,
            duration: DECK_MARKER_SQUASH_MS,
            yoyo: true,
            ease: 'Sine.easeOut'
          }
        ]
      });
      let bounceTweenStopped = false;
      const stopBounceTween = (): void => {
        if (bounceTweenStopped) {
          return;
        }

        bounceTweenStopped = true;
        scene.events.off(Phaser.Scenes.Events.SHUTDOWN, stopBounceTween);
        marker.off(Phaser.GameObjects.Events.DESTROY, stopBounceTween);
        bounceTween.stop();
      };

      marker.once(Phaser.GameObjects.Events.DESTROY, stopBounceTween);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stopBounceTween);

      this.add(marker);
    }

    if (options.onClick !== undefined) {
      const clickTarget = scene.add.rectangle(
        0,
        0,
        DECK_WIDTH * DECK_STACK_SCALE + 24,
        DECK_HEIGHT * DECK_STACK_SCALE + 24,
        0xffffff,
        0.01
      );
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

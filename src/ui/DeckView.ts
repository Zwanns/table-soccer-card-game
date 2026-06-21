import Phaser from 'phaser';
import { fitImageContain, getFallbackCoverTextureKey } from '../assets/teamCover';
import type { CardColor } from '../cards';
import type { CardPlayerProfile } from './cardPlayerProfile';
import { CARD_HEIGHT, CARD_WIDTH, CardView } from './CardView';
import { KIT_CARD_LAYOUT } from './kitCardFaceModel';
import { MATCH_CARD_SCALE } from './matchCardScale';

const DECK_WIDTH = CARD_WIDTH;
const DECK_HEIGHT = CARD_HEIGHT;
const DECK_STACK_SCALE = MATCH_CARD_SCALE;
const DECK_COUNT_OFFSET_Y = DECK_HEIGHT * DECK_STACK_SCALE / 2 + 32;
const DECK_MARKER_SIZE = 42;
export const DECK_MARKER_BOUNCE_HEIGHT = 20;
const DECK_MARKER_DECK_OVERLAP_RATIO = 1 / 3;
const DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO = 1 / 2 - DECK_MARKER_DECK_OVERLAP_RATIO;
const DECK_MARKER_BOUNCE_UP_MS = 360;
const DECK_MARKER_BOUNCE_DOWN_MS = 260;
const DECK_MARKER_SQUASH_MS = 64;

interface ActiveDeckMarkerState {
  baseScaleX: number;
  baseScaleY: number;
  baseX: number;
  baseY: number;
  stopBounceTween: () => void;
  marker: Phaser.GameObjects.Image;
  markerSide: 'left' | 'right';
  offsetY: number;
  scaleX: number;
  scaleY: number;
  stopped: boolean;
  tween: Phaser.Tweens.TweenChain;
}

const activeDeckMarkers = new WeakMap<Phaser.Scene, ActiveDeckMarkerState>();

export interface DeckViewOptions {
  active?: boolean;
  attackCardRank?: string;
  attackCardColor?: CardColor;
  attackCardKitTextureKey?: string;
  attackCardPlayerProfile?: CardPlayerProfile;
  attackCardSourcePlayerId?: string;
  coverTextureKey?: string;
  countSide?: 'left' | 'right';
  showActiveMarker?: boolean;
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
      const attackCard = new CardView(scene, 0, 0, {
        rank: options.attackCardRank,
        color: options.attackCardColor,
        kitTextureKey: options.attackCardKitTextureKey,
        playerProfile: options.attackCardPlayerProfile
      });

      if (options.attackCardSourcePlayerId !== undefined) {
        attackCard.setData('attackDeckSourcePlayerId', options.attackCardSourcePlayerId);
      }

      deckStack.add(attackCard);
    }

    deckStack.setScale(DECK_STACK_SCALE);
    this.add([deckStack, countText]);

    if (options.active === true && options.showActiveMarker !== false) {
      const markerSide = options.countSide ?? 'right';

      syncDeckTurnBallMarker(scene, x, y, markerSide);
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

export function syncDeckTurnBallMarker(
  scene: Phaser.Scene,
  x: number,
  y: number,
  markerSide: 'left' | 'right'
): void {
  const markerBase = getDeckTurnBallWorldPosition(x, y, markerSide);
  const activeMarker = activeDeckMarkers.get(scene);

  if (activeMarker !== undefined && activeMarker.stopped === false && activeMarker.markerSide === markerSide) {
    activeMarker.baseX = markerBase.x;
    activeMarker.baseY = markerBase.y;
    applyDeckTurnBallMarkerState(activeMarker);
    return;
  }

  clearDeckTurnBallMarker(scene);

  const marker = scene.add.image(markerBase.x, markerBase.y, 'turn-ball');
  marker.setDisplaySize(DECK_MARKER_SIZE, DECK_MARKER_SIZE);
  marker.setDepth(600);

  const markerState: ActiveDeckMarkerState = {
    baseScaleX: marker.scaleX,
    baseScaleY: marker.scaleY,
    baseX: markerBase.x,
    baseY: markerBase.y,
    stopBounceTween: () => undefined,
    marker,
    markerSide,
    offsetY: 0,
    scaleX: marker.scaleX,
    scaleY: marker.scaleY,
    stopped: false,
    tween: undefined as unknown as Phaser.Tweens.TweenChain
  };

  const stopBounceTween = (): void => {
    stopDeckTurnBallMarkerTween(scene, markerState);
  };
  markerState.stopBounceTween = stopBounceTween;

  marker.once(Phaser.GameObjects.Events.DESTROY, stopBounceTween);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stopBounceTween);

  markerState.tween = scene.tweens.chain({
    targets: markerState,
    loop: -1,
    tweens: [
      {
        offsetY: -DECK_MARKER_BOUNCE_HEIGHT,
        duration: DECK_MARKER_BOUNCE_UP_MS,
        ease: 'Quad.easeOut',
        onUpdate: () => applyDeckTurnBallMarkerState(markerState)
      },
      {
        offsetY: 0,
        duration: DECK_MARKER_BOUNCE_DOWN_MS,
        ease: 'Quad.easeIn',
        onUpdate: () => applyDeckTurnBallMarkerState(markerState)
      },
      {
        scaleX: markerState.baseScaleX * 1.08,
        scaleY: markerState.baseScaleY * 0.92,
        duration: DECK_MARKER_SQUASH_MS,
        yoyo: true,
        ease: 'Sine.easeOut',
        onUpdate: () => applyDeckTurnBallMarkerState(markerState)
      }
    ]
  });

  activeDeckMarkers.set(scene, markerState);
}

export function clearDeckTurnBallMarker(scene: Phaser.Scene): void {
  const activeMarker = activeDeckMarkers.get(scene);

  if (activeMarker === undefined) {
    return;
  }

  stopDeckTurnBallMarkerTween(scene, activeMarker);
  activeMarker.marker.destroy();
}

export function getDeckTurnBallWorldPosition(x: number, y: number, markerSide: 'left' | 'right'): { x: number; y: number } {
  const deckEdgeX = markerSide === 'right' ? DECK_WIDTH * DECK_STACK_SCALE / 2 : -DECK_WIDTH * DECK_STACK_SCALE / 2;
  const deckBottomY = DECK_HEIGHT * DECK_STACK_SCALE / 2;
  const markerX =
    markerSide === 'right'
      ? deckEdgeX + DECK_MARKER_SIZE * DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO
      : deckEdgeX - DECK_MARKER_SIZE * DECK_MARKER_OUTSIDE_CENTER_OFFSET_RATIO;
  const markerBaseY = deckBottomY - DECK_MARKER_SIZE / 2;

  return {
    x: x + markerX,
    y: y + markerBaseY
  };
}

function applyDeckTurnBallMarkerState(markerState: ActiveDeckMarkerState): void {
  if (markerState.marker.active === false) {
    return;
  }

  markerState.marker.setPosition(markerState.baseX, markerState.baseY + markerState.offsetY);
  markerState.marker.setScale(markerState.scaleX, markerState.scaleY);
}

function stopDeckTurnBallMarkerTween(scene: Phaser.Scene, markerState: ActiveDeckMarkerState): void {
  if (markerState.stopped) {
    return;
  }

  markerState.stopped = true;
  activeDeckMarkers.delete(scene);
  scene.events.off(Phaser.Scenes.Events.SHUTDOWN, markerState.stopBounceTween);
  markerState.marker.off(Phaser.GameObjects.Events.DESTROY, markerState.stopBounceTween);
  markerState.tween.stop();
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

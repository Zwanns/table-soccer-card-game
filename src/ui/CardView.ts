import Phaser from 'phaser';
import { fitImageContain, getFallbackCoverTextureKey } from '../assets/teamCover';
import type { CardColor } from '../cards';
import { CardTooltipView } from './CardTooltipView';
import type { CardPlayerProfile } from './cardPlayerProfile';
import { KitCardFaceView, type RankRollOptions } from './KitCardFaceView';
import { KIT_CARD_LAYOUT, prepareKitCardFace } from './kitCardFaceModel';
import { px, SHARP_TEXT_RESOLUTION } from './textRendering';

export interface CardViewOptions {
  rank: string;
  suit?: string;
  color?: CardColor;
  faceDown?: boolean;
  label?: string;
  highlighted?: boolean;
  playerProfile?: CardPlayerProfile;
  kitTextureKey?: string;
  coverTextureKey?: string;
  faceDownVariant?: 'deck' | 'preview' | 'squad-preview';
  tooltipEnabled?: boolean;
  onClick?: () => void;
}

export const CARD_WIDTH = 108;
export const CARD_HEIGHT = 148.5;

export class CardView extends Phaser.GameObjects.Container {
  private tooltip: CardTooltipView | null = null;
  private faceView: KitCardFaceView | null = null;

  public constructor(scene: Phaser.Scene, x: number, y: number, options: CardViewOptions) {
    super(scene, px(x), px(y));

    const positionLabel = options.label === 'GK' ? options.label : '';

    if (options.faceDown === true) {
      this.addFaceDownCard(scene, options);
    } else {
      const face = prepareKitCardFace({
        rank: options.rank,
        playerProfile: options.playerProfile
      });

      this.faceView = new KitCardFaceView(scene, 0, 0, {
        rank: face.displayRank,
        teamColor: options.color,
        highlighted: options.highlighted,
        shirtNumber: face.shirtNumber,
        flagTextureKey: face.flagTextureKey,
        kitTextureKey: options.kitTextureKey,
        kitAsset: face.kitAsset ?? undefined
      });
      this.add(this.faceView);
    }

    const label = scene.add
      .text(0, px(CARD_HEIGHT / 2 + 18), positionLabel, {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5);

    this.add(label);

    if (options.onClick !== undefined || (options.faceDown !== true && options.playerProfile !== undefined)) {
      const hitArea = scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff, 0.01);
      if (options.onClick !== undefined) {
        hitArea.setInteractive({ useHandCursor: true });
      } else {
        hitArea.setInteractive();
      }
      if (options.tooltipEnabled !== false) {
        hitArea.on('pointerover', () => this.showTooltip(scene, options.playerProfile));
        hitArea.on('pointerout', () => this.hideTooltip());
      }

      if (options.onClick !== undefined) {
        hitArea.on('pointerdown', options.onClick);
      }

      this.add(hitArea);
    }

    scene.add.existing(this);
  }

  public override destroy(fromScene?: boolean): void {
    this.hideTooltip();
    super.destroy(fromScene);
  }

  public setDisplayRank(rank: string): void {
    this.faceView?.setDisplayRank(rank);
  }

  public animateDisplayRankRoll(targetRank: string, options?: RankRollOptions): Promise<void> {
    return this.faceView?.animateRankRoll(targetRank, options) ?? Promise.resolve();
  }

  private showTooltip(scene: Phaser.Scene, profile?: CardPlayerProfile): void {
    if (profile === undefined || this.tooltip !== null) {
      return;
    }

    this.raiseAboveSiblingCards();
    const tooltipPosition = this.getTooltipPosition();
    this.tooltip = new CardTooltipView(scene, tooltipPosition.x, tooltipPosition.y, profile);
  }

  private hideTooltip(): void {
    this.tooltip?.destroy();
    this.tooltip = null;
  }

  private raiseAboveSiblingCards(): void {
    this.setDepth(1000);
    this.parentContainer?.bringToTop(this);
  }

  private getTooltipPosition(): Phaser.Math.Vector2 {
    const position = new Phaser.Math.Vector2();

    this.getWorldTransformMatrix().transformPoint(CARD_WIDTH / 2 + 8, -CARD_HEIGHT / 4, position);
    return position;
  }

  private addFaceDownCard(scene: Phaser.Scene, options: CardViewOptions): void {
    const faceDownVariant = options.faceDownVariant ?? 'deck';
    const isPreview = faceDownVariant === 'preview';
    const isSquadPreview = faceDownVariant === 'squad-preview';
    const usesNeutralPreviewBorder = isPreview || isSquadPreview;
    const isHighlighted = options.highlighted === true && !usesNeutralPreviewBorder;
    const strokeWidth = isHighlighted ? 5 : 2;
    const strokeColor = isHighlighted ? 0xf0c95a : usesNeutralPreviewBorder ? 0x1f2a2e : 0x7bb8d8;
    const fillColor = isPreview ? 0xffffff : 0x214f6b;
    const background = createRoundedCardBack(scene, fillColor, strokeColor, strokeWidth);
    const coverTextureKey = options.coverTextureKey ?? getFallbackCoverTextureKey();
    const coverInset = isSquadPreview ? 0 : 8;

    if (isSquadPreview) {
      this.add(createRoundedCardBack(scene, 0x17384c, 0x1f2a2e, 2, -10, 10));
    }

    this.add(background);

    if (scene.textures.exists(coverTextureKey)) {
      const cover = scene.add.image(0, 0, coverTextureKey);
      fitImageContain(cover, {
        width: CARD_WIDTH - coverInset,
        height: CARD_HEIGHT - coverInset
      });
      this.add(cover);
    }

    this.add(createRoundedCardBorder(scene, strokeColor, strokeWidth));
  }
}

function createRoundedCardBack(
  scene: Phaser.Scene,
  fillColor: number,
  strokeColor: number,
  strokeWidth: number,
  x = 0,
  y = 0
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  graphics.fillStyle(fillColor, 1);
  graphics.fillRoundedRect(
    x - CARD_WIDTH / 2,
    y - CARD_HEIGHT / 2,
    CARD_WIDTH,
    CARD_HEIGHT,
    KIT_CARD_LAYOUT.cardCornerRadius
  );
  graphics.lineStyle(strokeWidth, strokeColor, 1);
  graphics.strokeRoundedRect(
    x - CARD_WIDTH / 2,
    y - CARD_HEIGHT / 2,
    CARD_WIDTH,
    CARD_HEIGHT,
    KIT_CARD_LAYOUT.cardCornerRadius
  );

  return graphics;
}

function createRoundedCardBorder(
  scene: Phaser.Scene,
  strokeColor: number,
  strokeWidth: number
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  graphics.lineStyle(strokeWidth, strokeColor, 1);
  graphics.strokeRoundedRect(
    -CARD_WIDTH / 2,
    -CARD_HEIGHT / 2,
    CARD_WIDTH,
    CARD_HEIGHT,
    KIT_CARD_LAYOUT.cardCornerRadius
  );

  return graphics;
}

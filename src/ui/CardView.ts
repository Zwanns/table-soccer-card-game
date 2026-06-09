import Phaser from 'phaser';
import type { CardColor } from '../cards';
import { CardTooltipView } from './CardTooltipView';
import type { CardPlayerProfile } from './cardPlayerProfile';
import { KitCardFaceView } from './KitCardFaceView';

export interface CardViewOptions {
  rank: string;
  suit?: string;
  color?: CardColor;
  faceDown?: boolean;
  label?: string;
  highlighted?: boolean;
  playerProfile?: CardPlayerProfile;
  kitTextureKey?: string;
  tooltipEnabled?: boolean;
  onClick?: () => void;
}

export const CARD_WIDTH = 108;
export const CARD_HEIGHT = 148.5;

export class CardView extends Phaser.GameObjects.Container {
  private tooltip: CardTooltipView | null = null;

  public constructor(scene: Phaser.Scene, x: number, y: number, options: CardViewOptions) {
    super(scene, x, y);

    const positionLabel = options.label === 'GK' ? options.label : '';

    if (options.faceDown === true) {
      const body = scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0x214f6b, 1);
      body.setStrokeStyle(options.highlighted === true ? 5 : 2, options.highlighted === true ? 0xf0c95a : 0x7bb8d8);
      this.add(body);
    } else {
      this.add(
        new KitCardFaceView(scene, 0, 0, {
          rank: options.rank,
          teamColor: options.color,
          highlighted: options.highlighted,
          shirtNumber: options.playerProfile?.shirtNumber,
          kitTextureKey: options.kitTextureKey
        })
      );
    }

    const label = scene.add
      .text(0, CARD_HEIGHT / 2 + 18, positionLabel, {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
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
}

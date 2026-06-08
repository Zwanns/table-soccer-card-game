import Phaser from 'phaser';
import { getCardTooltipText, type CardPlayerProfile } from './cardPlayerProfile';

const TOOLTIP_PADDING_X = 12;
const TOOLTIP_PADDING_Y = 8;

export class CardTooltipView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, profile: CardPlayerProfile) {
    super(scene, x, y);

    const text = scene.add
      .text(TOOLTIP_PADDING_X, 0, getCardTooltipText(profile), {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700',
        lineSpacing: 4
      })
      .setOrigin(0, 0.5);
    const background = scene.add.rectangle(
      text.width / 2 + TOOLTIP_PADDING_X,
      0,
      text.width + TOOLTIP_PADDING_X * 2,
      text.height + TOOLTIP_PADDING_Y * 2,
      0x0b2118,
      0.96
    );

    this.add([background, text]);
    this.setDepth(10000);
    scene.add.existing(this);
  }
}

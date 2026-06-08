import Phaser from 'phaser';
import { getCardTooltipText, type CardPlayerProfile } from './cardPlayerProfile';

export class CardTooltipView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, profile: CardPlayerProfile) {
    super(scene, x, y);

    const text = scene.add
      .text(0, 0, getCardTooltipText(profile), {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700',
        lineSpacing: 4
      })
      .setOrigin(0, 0.5);
    const bounds = text.getBounds();
    const background = scene.add.rectangle(
      bounds.width / 2 + 10,
      0,
      bounds.width + 20,
      bounds.height + 16,
      0x0b2118,
      0.96
    );
    background.setStrokeStyle(2, 0xf0c95a, 0.92);

    this.add([background, text]);
    this.setDepth(1000);
    scene.add.existing(this);
  }
}

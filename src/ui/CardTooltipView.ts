import Phaser from 'phaser';
import { getCardTooltipText, type CardPlayerProfile } from './cardPlayerProfile';
import { fitPlayerTooltipText, getPlayerTooltipLayout, getPlayerTooltipSize, PLAYER_TOOLTIP_FONT_SIZE,
  TOOLTIP_PADDING_X, TOOLTIP_PADDING_Y, type TooltipRect } from './cardTooltipLayout';
import { SHARP_TEXT_RESOLUTION } from './textRendering';
import { isMobileLandscapeLayout } from './mobileLayout';

export class CardTooltipView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, cardBounds: TooltipRect, viewport: TooltipRect, profile: CardPlayerProfile) {
    super(scene, 0, 0);

    const name = getCardTooltipText(profile);
    const text = scene.add.text(TOOLTIP_PADDING_X, TOOLTIP_PADDING_Y, name, {
      color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: `${PLAYER_TOOLTIP_FONT_SIZE}px`,
      fontStyle: '700', resolution: SHARP_TEXT_RESOLUTION
    }).setOrigin(0, 0);
    const size = getPlayerTooltipSize(text.width, text.height, viewport);
    const fittedName = fitPlayerTooltipText(name, size.width - TOOLTIP_PADDING_X * 2,
      (candidate) => Math.ceil(text.context.measureText(candidate).width));
    text.setText(fittedName);
    text.y = Math.round((size.height - text.height) / 2);
    const layout = getPlayerTooltipLayout(cardBounds, size, viewport, isMobileLandscapeLayout());
    const background = scene.add.rectangle(0, 0, size.width, size.height, 0x0b2118, 0.96).setOrigin(0, 0);

    this.add([background, text]);
    this.setPosition(layout.x, layout.y);
    this.setSize(size.width, size.height);
    this.setDepth(10000);
    // No interactive objects: the overlay cannot consume card input.
    scene.add.existing(this);
  }
}

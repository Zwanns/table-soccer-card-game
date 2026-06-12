import Phaser from 'phaser';
import type { CardColor } from '../cards';
import type { ResolvedKitAsset } from '../game/kitAssetResolver';
import { getKitImageLayout, getShirtNumberLayout, KIT_CARD_LAYOUT } from './kitCardFaceModel';
import { getFallbackKitColors } from './kitFallback';

const CARD_WIDTH = 108;
const CARD_HEIGHT = 148.5;

export interface KitCardFaceViewOptions {
  rank: string;
  teamColor?: CardColor;
  highlighted?: boolean;
  shirtNumber?: number;
  kitTextureKey?: string;
  kitAsset?: ResolvedKitAsset;
}

type RenderedKitColorScheme = {
  shirt: number;
  shorts: number;
  accent: number;
  number: string;
};

export class KitCardFaceView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, options: KitCardFaceViewOptions) {
    super(scene, x, y);

    const body = createRoundedCardBackground(scene, {
      fillColor: 0xffffff,
      strokeColor: options.highlighted === true ? 0xf0c95a : 0x1f2a2e,
      strokeWidth: options.highlighted === true ? 5 : 2
    });

    this.add(body);
    this.addKit(scene, options);
    this.addShirtNumber(scene, options);
    this.addRank(scene, options);

    scene.add.existing(this);
  }

  private addKit(scene: Phaser.Scene, options: KitCardFaceViewOptions): void {
    const layout = getKitImageLayout();

    if (options.kitAsset !== undefined && scene.textures.exists(options.kitAsset.assetKey)) {
      const image = scene.add.image(layout.x, layout.y, options.kitAsset.assetKey);
      image.setOrigin(layout.originX, layout.originY);
      image.setDisplaySize(layout.width, layout.height);
      this.add(image);
      return;
    }

    if (options.kitTextureKey !== undefined && scene.textures.exists(options.kitTextureKey)) {
      const image = scene.add.image(layout.x, layout.y, options.kitTextureKey);
      image.setOrigin(layout.originX, layout.originY);
      image.setDisplaySize(layout.width, layout.height);
      this.add(image);
      return;
    }

    const fallback = createFallbackKitGraphics(scene, getFallbackKitColors(options.teamColor));
    fallback.x = layout.x - layout.width / 2;
    fallback.y = layout.y - layout.height / 2;
    this.add(fallback);
  }

  private addShirtNumber(scene: Phaser.Scene, options: KitCardFaceViewOptions): void {
    if (options.shirtNumber === undefined) {
      return;
    }

    const color =
      options.kitAsset?.shirtNumberColor ??
      getFallbackKitColors(options.teamColor).number;
    const stroke =
      options.kitAsset?.shirtNumberStrokeColor ??
      '#000000';
    const position = getShirtNumberLayout();
    const number = scene.add
      .text(position.x, position.y, String(options.shirtNumber), {
        align: 'center',
        color,
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700',
        stroke,
        strokeThickness: 2
      })
      .setOrigin(0.5);

    this.add(number);
  }

  private addRank(scene: Phaser.Scene, options: KitCardFaceViewOptions): void {
    const rank = scene.add
      .text(-CARD_WIDTH / 2 + 9, -CARD_HEIGHT / 2 + 8, options.rank, {
        color: KIT_CARD_LAYOUT.rankColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: options.rank.length > 2 ? '24px' : '38px',
        fontStyle: '700'
      })
      .setOrigin(0, 0);

    this.add(rank);
  }
}

function createFallbackKitGraphics(scene: Phaser.Scene, colors: RenderedKitColorScheme): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  graphics.fillStyle(colors.accent, 1);
  graphics.fillRect(-35, -30, 16, 26);
  graphics.fillRect(19, -30, 16, 26);

  graphics.fillStyle(colors.shirt, 1);
  graphics.fillRoundedRect(-24, -36, 48, 58, 8);
  graphics.fillTriangle(-24, -30, -40, -18, -24, -7);
  graphics.fillTriangle(24, -30, 40, -18, 24, -7);

  graphics.fillStyle(colors.shorts, 1);
  graphics.fillRoundedRect(-24, 24, 20, 28, 4);
  graphics.fillRoundedRect(4, 24, 20, 28, 4);

  graphics.lineStyle(2, 0x1f2a2e, 0.72);
  graphics.strokeRoundedRect(-24, -36, 48, 58, 8);
  graphics.strokeRoundedRect(-24, 24, 20, 28, 4);
  graphics.strokeRoundedRect(4, 24, 20, 28, 4);

  graphics.setScale(1.12);

  return graphics;
}

function createRoundedCardBackground(
  scene: Phaser.Scene,
  options: {
    fillColor: number;
    strokeColor: number;
    strokeWidth: number;
  }
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();
  const x = -CARD_WIDTH / 2;
  const y = -CARD_HEIGHT / 2;

  graphics.fillStyle(options.fillColor, 1);
  graphics.fillRoundedRect(x, y, CARD_WIDTH, CARD_HEIGHT, KIT_CARD_LAYOUT.cardCornerRadius);
  graphics.lineStyle(options.strokeWidth, options.strokeColor, 1);
  graphics.strokeRoundedRect(x, y, CARD_WIDTH, CARD_HEIGHT, KIT_CARD_LAYOUT.cardCornerRadius);

  return graphics;
}

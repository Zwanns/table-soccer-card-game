import Phaser from 'phaser';
import type { CardColor } from '../cards';
import { getFallbackKitColors, type FallbackKitColorScheme } from './kitFallback';

const CARD_WIDTH = 108;
const CARD_HEIGHT = 148.5;

export interface KitCardFaceViewOptions {
  rank: string;
  teamColor?: CardColor;
  highlighted?: boolean;
  shirtNumber?: number;
  kitTextureKey?: string;
}

const KIT_BOUNDS = {
  width: 76,
  height: 98
} as const;

export class KitCardFaceView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number, options: KitCardFaceViewOptions) {
    super(scene, x, y);

    const body = scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xffffff, 1);
    body.setStrokeStyle(options.highlighted === true ? 5 : 2, options.highlighted === true ? 0xf0c95a : 0x1f2a2e);

    this.add(body);
    this.addKit(scene, options);
    this.addShirtNumber(scene, options);
    this.addRank(scene, options);

    scene.add.existing(this);
  }

  private addKit(scene: Phaser.Scene, options: KitCardFaceViewOptions): void {
    if (options.kitTextureKey !== undefined && scene.textures.exists(options.kitTextureKey)) {
      const image = scene.add.image(0, 8, options.kitTextureKey);
      const scale = Math.min(KIT_BOUNDS.width / image.width, KIT_BOUNDS.height / image.height);
      image.setScale(scale);
      this.add(image);
      return;
    }

    this.add(createFallbackKitGraphics(scene, getFallbackKitColors(options.teamColor)));
  }

  private addShirtNumber(scene: Phaser.Scene, options: KitCardFaceViewOptions): void {
    if (options.shirtNumber === undefined) {
      return;
    }

    const colors = getFallbackKitColors(options.teamColor);
    const number = scene.add
      .text(0, -8, String(options.shirtNumber), {
        align: 'center',
        color: colors.number,
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '700',
        stroke: '#000000',
        strokeThickness: 2
      })
      .setOrigin(0.5);

    this.add(number);
  }

  private addRank(scene: Phaser.Scene, options: KitCardFaceViewOptions): void {
    const rank = scene.add
      .text(-CARD_WIDTH / 2 + 9, -CARD_HEIGHT / 2 + 8, options.rank, {
        color: getRankColor(options.teamColor),
        fontFamily: 'Arial, sans-serif',
        fontSize: options.rank.length > 2 ? '17px' : '24px',
        fontStyle: '700'
      })
      .setOrigin(0, 0);

    this.add(rank);
  }
}

function createFallbackKitGraphics(scene: Phaser.Scene, colors: FallbackKitColorScheme): Phaser.GameObjects.Graphics {
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

  graphics.fillStyle(colors.socks, 1);
  graphics.fillRoundedRect(-22, 56, 14, 34, 4);
  graphics.fillRoundedRect(8, 56, 14, 34, 4);

  graphics.lineStyle(2, 0x1f2a2e, 0.72);
  graphics.strokeRoundedRect(-24, -36, 48, 58, 8);
  graphics.strokeRoundedRect(-24, 24, 20, 28, 4);
  graphics.strokeRoundedRect(4, 24, 20, 28, 4);
  graphics.strokeRoundedRect(-22, 56, 14, 34, 4);
  graphics.strokeRoundedRect(8, 56, 14, 34, 4);

  graphics.setScale(0.82);
  graphics.y = -2;

  return graphics;
}

function getRankColor(teamColor?: CardColor): string {
  return teamColor === 'RED' ? '#b72f37' : '#1f2a2e';
}

import Phaser from 'phaser';
import { fitImageContain } from '../assets/teamCover';
import type { CardColor } from '../cards';
import type { ResolvedKitAsset } from '../game/kitAssetResolver';
import {
  getKitImageLayout,
  getShirtNumberLayout,
  KIT_CARD_LAYOUT,
  type KitCardFaceLayoutVariant,
  type KitImageLayout
} from './kitCardFaceModel';
import { getFallbackKitColors } from './kitFallback';
import { px, SHARP_TEXT_RESOLUTION } from './textRendering';

const CARD_WIDTH = 108;
const CARD_HEIGHT = 148.5;

export interface KitCardFaceViewOptions {
  rank: string;
  teamColor?: CardColor;
  highlighted?: boolean;
  shirtNumber?: number;
  kitTextureKey?: string;
  kitAsset?: ResolvedKitAsset;
  kitLayoutVariant?: KitCardFaceLayoutVariant;
}

export interface RankRollOptions {
  durationMs?: number;
  steps?: readonly string[];
}

type RenderedKitColorScheme = {
  shirt: number;
  shorts: number;
  accent: number;
  number: string;
};

export class KitCardFaceView extends Phaser.GameObjects.Container {
  private rankText: Phaser.GameObjects.Text | null = null;
  private rankBaseY = px(-CARD_HEIGHT / 2 + KIT_CARD_LAYOUT.rankOffsetTop);

  public constructor(scene: Phaser.Scene, x: number, y: number, options: KitCardFaceViewOptions) {
    super(scene, px(x), px(y));

    const body = createRoundedCardBackground(scene, {
      fillColor: 0xffffff,
      strokeColor: options.highlighted === true ? 0xf0c95a : 0x1f2a2e,
      strokeWidth: options.highlighted === true ? 5 : 2
    });

    this.add(body);
    const renderedKitLayout = this.addKit(scene, options);
    this.addShirtNumber(scene, options, renderedKitLayout);
    this.addRank(scene, options);

    scene.add.existing(this);
  }

  public setDisplayRank(rank: string): void {
    if (this.rankText === null) {
      return;
    }

    this.rankText.setText(rank);
    this.rankText.setFontSize(rank.length > 2 ? '26px' : '42px');
  }

  public animateRankRoll(targetRank: string, options: RankRollOptions = {}): Promise<void> {
    if (this.rankText === null) {
      return Promise.resolve();
    }

    const rankText = this.rankText;
    const steps = options.steps?.length === 0 ? [targetRank] : [...(options.steps ?? [targetRank])];
    const stepDuration = Math.max(24, Math.floor((options.durationMs ?? 780) / steps.length));

    return new Promise((resolve) => {
      let stepIndex = 0;

      const showNextStep = () => {
        const nextRank = steps[stepIndex] ?? targetRank;

        this.scene.tweens.add({
          targets: rankText,
          y: this.rankBaseY + 12,
          alpha: 0.18,
          duration: stepDuration / 2,
          ease: 'Sine.easeIn',
          onComplete: () => {
            this.setDisplayRank(nextRank);
            rankText.setY(this.rankBaseY - 10);
            this.scene.tweens.add({
              targets: rankText,
              y: this.rankBaseY,
              alpha: 1,
              duration: stepDuration / 2,
              ease: 'Sine.easeOut',
              onComplete: () => {
                stepIndex += 1;

                if (stepIndex < steps.length) {
                  showNextStep();
                  return;
                }

                this.setDisplayRank(targetRank);
                resolve();
              }
            });
          }
        });
      };

      showNextStep();
    });
  }

  private addKit(scene: Phaser.Scene, options: KitCardFaceViewOptions): KitImageLayout {
    const layout = getKitImageLayout(options.kitLayoutVariant);

    if (options.kitAsset !== undefined && scene.textures.exists(options.kitAsset.assetKey)) {
      const image = scene.add.image(layout.x, layout.y, options.kitAsset.assetKey);
      image.setOrigin(layout.originX, layout.originY);
      const scale = fitImageContain(image, { width: layout.width, height: layout.height });
      this.add(image);

      return createRenderedKitLayout(layout, image.width, image.height, scale);
    }

    if (options.kitTextureKey !== undefined && scene.textures.exists(options.kitTextureKey)) {
      const image = scene.add.image(layout.x, layout.y, options.kitTextureKey);
      image.setOrigin(layout.originX, layout.originY);
      const scale = fitImageContain(image, { width: layout.width, height: layout.height });
      this.add(image);

      return createRenderedKitLayout(layout, image.width, image.height, scale);
    }

    const fallback = createFallbackKitGraphics(scene, getFallbackKitColors(options.teamColor));
    fallback.x = layout.x - layout.width / 2;
    fallback.y = layout.y - layout.height / 2;
    this.add(fallback);

    return layout;
  }

  private addShirtNumber(scene: Phaser.Scene, options: KitCardFaceViewOptions, kitLayout: KitImageLayout): void {
    if (options.shirtNumber === undefined) {
      return;
    }

    const color =
      options.kitAsset?.numberColor ??
      getGoalkeeperNumberColor(options.kitTextureKey) ??
      getFallbackKitColors(options.teamColor).number;
    const stroke = options.kitAsset?.numberStrokeColor;
    const position = getShirtNumberLayout(options.kitLayoutVariant, kitLayout);
    const number = scene.add
      .text(px(position.x), px(position.y), String(options.shirtNumber), {
        align: 'center',
        color,
        fontFamily: KIT_CARD_LAYOUT.shirtNumberFontFamily,
        fontSize: `${KIT_CARD_LAYOUT.shirtNumberFontSize}px`,
        fontStyle: '600',
        stroke,
        strokeThickness: stroke === undefined ? 0 : KIT_CARD_LAYOUT.shirtNumberStrokeThickness,
        resolution: SHARP_TEXT_RESOLUTION
      })
      .setOrigin(0.5)
      .setScale(1, KIT_CARD_LAYOUT.shirtNumberScaleY);

    this.add(number);
  }

  private addRank(scene: Phaser.Scene, options: KitCardFaceViewOptions): void {
    this.rankText = scene.add
      .text(
        px(-CARD_WIDTH / 2 + KIT_CARD_LAYOUT.rankOffsetLeft),
        this.rankBaseY,
        options.rank,
        {
          color: KIT_CARD_LAYOUT.rankColor,
          fontFamily: KIT_CARD_LAYOUT.rankFontFamily,
          fontSize: options.rank.length > 2 ? '26px' : '42px',
          fontStyle: '400',
          resolution: SHARP_TEXT_RESOLUTION
        }
      )
      .setOrigin(0, 0);

    this.add(this.rankText);
  }
}

function createRenderedKitLayout(layout: KitImageLayout, sourceWidth: number, sourceHeight: number, scale: number): KitImageLayout {
  return {
    ...layout,
    width: px(sourceWidth * scale),
    height: px(sourceHeight * scale)
  };
}

function getGoalkeeperNumberColor(kitTextureKey?: string): string | undefined {
  return isGoalkeeperKitTexture(kitTextureKey) ? '#FFFFFF' : undefined;
}

function isGoalkeeperKitTexture(kitTextureKey?: string): boolean {
  return kitTextureKey === 'kit-gk1' || kitTextureKey === 'kit-gk2';
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

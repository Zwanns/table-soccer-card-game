import Phaser from 'phaser';
import { Button } from './Button';
import { SCOREBOARD_BACKGROUND_ALPHA, SCOREBOARD_BACKGROUND_COLOR } from './scoreboardStyle';

export const MATCH_FINISHED_MODAL = {
  width: 620,
  height: 430,
  imageWidth: 372,
  imageHeight: 310,
  imageY: -114,
  titleY: 38,
  bodyY: 104,
  buttonY: 174,
  buttonWidth: 524,
  buttonHeight: 58
} as const;

export interface MatchFinishedModalLayoutOverrides {
  refereeWidth?: number;
  refereeHeight?: number;
  refereeOffsetY?: number;
  titleAboveReferee?: boolean;
  okButtonFullWidth?: boolean;
  okButtonWidth?: number;
  contentPaddingX?: number;
}

export interface MatchFinishedModalOptions {
  centerX: number;
  centerY: number;
  overlayWidth: number;
  overlayHeight: number;
  bodyText: string;
  onOk: () => void;
  depth?: number;
  layout?: MatchFinishedModalLayoutOverrides;
}

export function createMatchFinishedModal(
  scene: Phaser.Scene,
  options: MatchFinishedModalOptions
): Phaser.GameObjects.Container {
  const layout = resolveMatchFinishedModalLayout(options.layout);
  const modal = scene.add.container(0, 0).setDepth(options.depth ?? 1100);
  const overlay = scene.add.rectangle(
    options.centerX,
    options.centerY,
    options.overlayWidth,
    options.overlayHeight,
    0x06140f,
    0.74
  );
  overlay.setInteractive();

  const panel = scene.add.container(options.centerX, options.centerY);
  const background = scene.add.rectangle(
    0,
    0,
    MATCH_FINISHED_MODAL.width,
    MATCH_FINISHED_MODAL.height,
    SCOREBOARD_BACKGROUND_COLOR,
    SCOREBOARD_BACKGROUND_ALPHA
  );
  const refereeVisual = createMatchFinishedRefereeVisual(scene, layout);
  const title = scene.add
    .text(0, MATCH_FINISHED_MODAL.titleY, 'Final whistle', {
      align: 'center',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      fontStyle: '700'
    })
    .setOrigin(0.5);
  const body = scene.add
    .text(0, MATCH_FINISHED_MODAL.bodyY, options.bodyText, {
      align: 'center',
      color: '#d9eadf',
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      wordWrap: { width: layout.contentWidth }
    })
    .setOrigin(0.5);
  const okButton = new Button(scene, 0, MATCH_FINISHED_MODAL.buttonY, 'OK', options.onOk, {
    borderRadius: 8,
    borderWidth: 0,
    fontSize: '24px',
    height: MATCH_FINISHED_MODAL.buttonHeight,
    width: layout.okButtonWidth
  });

  panel.add(
    layout.titleAboveReferee
      ? [background, refereeVisual, title, body, okButton]
      : [background, title, refereeVisual, body, okButton]
  );
  modal.add([overlay, panel]);

  return modal;
}

function createMatchFinishedRefereeVisual(
  scene: Phaser.Scene,
  layout: ResolvedMatchFinishedModalLayout
): Phaser.GameObjects.GameObject {
  if (!scene.textures.exists('arbitr-end')) {
    const fallback = scene.add.container(0, layout.refereeY);
    const placeholder = scene.add.graphics();
    placeholder.fillStyle(0x142a21, 1);
    placeholder.fillRoundedRect(
      -layout.refereeWidth / 2,
      -layout.refereeHeight / 2,
      layout.refereeWidth,
      layout.refereeHeight,
      12
    );
    placeholder.lineStyle(2, 0x5f9572, 0.8);
    placeholder.strokeRoundedRect(
      -layout.refereeWidth / 2,
      -layout.refereeHeight / 2,
      layout.refereeWidth,
      layout.refereeHeight,
      12
    );
    fallback.add(placeholder);
    return fallback;
  }

  const image = scene.add.image(0, layout.refereeY, 'arbitr-end');
  const source = scene.textures.get('arbitr-end').getSourceImage() as { width: number; height: number };
  const scale = Math.min(layout.refereeWidth / source.width, layout.refereeHeight / source.height);
  image.setDisplaySize(source.width * scale, source.height * scale);
  return image;
}

interface ResolvedMatchFinishedModalLayout {
  contentWidth: number;
  okButtonWidth: number;
  refereeHeight: number;
  refereeWidth: number;
  refereeY: number;
  titleAboveReferee: boolean;
}

function resolveMatchFinishedModalLayout(
  overrides: MatchFinishedModalLayoutOverrides = {}
): ResolvedMatchFinishedModalLayout {
  const contentPaddingX = overrides.contentPaddingX ?? 48;
  const contentWidth = MATCH_FINISHED_MODAL.width - contentPaddingX * 2;
  const okButtonWidth =
    overrides.okButtonWidth ??
    (overrides.okButtonFullWidth === true ? contentWidth : MATCH_FINISHED_MODAL.buttonWidth);

  return {
    contentWidth,
    okButtonWidth,
    refereeHeight: overrides.refereeHeight ?? MATCH_FINISHED_MODAL.imageHeight,
    refereeWidth: overrides.refereeWidth ?? MATCH_FINISHED_MODAL.imageWidth,
    refereeY: MATCH_FINISHED_MODAL.imageY + (overrides.refereeOffsetY ?? 0),
    titleAboveReferee: overrides.titleAboveReferee ?? true
  };
}

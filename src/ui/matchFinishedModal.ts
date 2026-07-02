import Phaser from 'phaser';
import { Button } from './Button';
import { SCOREBOARD_BACKGROUND_ALPHA, SCOREBOARD_BACKGROUND_COLOR } from './scoreboardStyle';

export const MATCH_FINISHED_MODAL = {
  width: 620,
  height: 430,
  imageWidth: 300,
  imageHeight: 250,
  imageY: -150,
  titleY: 38,
  bodyY: 104,
  buttonY: 174,
  buttonWidth: 190,
  buttonHeight: 58
} as const;

export interface MatchFinishedModalOptions {
  centerX: number;
  centerY: number;
  overlayWidth: number;
  overlayHeight: number;
  bodyText: string;
  onOk: () => void;
  depth?: number;
}

export function createMatchFinishedModal(
  scene: Phaser.Scene,
  options: MatchFinishedModalOptions
): Phaser.GameObjects.Container {
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
  const refereeVisual = createMatchFinishedRefereeVisual(scene);
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
      wordWrap: { width: MATCH_FINISHED_MODAL.width - 96 }
    })
    .setOrigin(0.5);
  const okButton = new Button(scene, 0, MATCH_FINISHED_MODAL.buttonY, 'OK', options.onOk, {
    borderRadius: 8,
    borderWidth: 0,
    fontSize: '24px',
    height: MATCH_FINISHED_MODAL.buttonHeight,
    width: MATCH_FINISHED_MODAL.buttonWidth
  });

  panel.add([background, refereeVisual, title, body, okButton]);
  modal.add([overlay, panel]);

  return modal;
}

function createMatchFinishedRefereeVisual(scene: Phaser.Scene): Phaser.GameObjects.GameObject {
  if (!scene.textures.exists('arbitr-end')) {
    const fallback = scene.add.container(0, MATCH_FINISHED_MODAL.imageY);
    const placeholder = scene.add.graphics();
    placeholder.fillStyle(0x142a21, 1);
    placeholder.fillRoundedRect(
      -MATCH_FINISHED_MODAL.imageWidth / 2,
      -MATCH_FINISHED_MODAL.imageHeight / 2,
      MATCH_FINISHED_MODAL.imageWidth,
      MATCH_FINISHED_MODAL.imageHeight,
      12
    );
    placeholder.lineStyle(2, 0x5f9572, 0.8);
    placeholder.strokeRoundedRect(
      -MATCH_FINISHED_MODAL.imageWidth / 2,
      -MATCH_FINISHED_MODAL.imageHeight / 2,
      MATCH_FINISHED_MODAL.imageWidth,
      MATCH_FINISHED_MODAL.imageHeight,
      12
    );
    fallback.add(placeholder);
    return fallback;
  }

  const image = scene.add.image(0, MATCH_FINISHED_MODAL.imageY, 'arbitr-end');
  const source = scene.textures.get('arbitr-end').getSourceImage() as { width: number; height: number };
  const scale = Math.min(MATCH_FINISHED_MODAL.imageWidth / source.width, MATCH_FINISHED_MODAL.imageHeight / source.height);
  image.setDisplaySize(source.width * scale, source.height * scale);
  return image;
}

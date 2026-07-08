import Phaser from 'phaser';

export const EVENT_ARTWORK_SOURCE_SIZE = 1254;
export const EVENT_ARTWORK_TARGET_SIZE = 292;
export const EVENT_ARTWORK_IMAGE_ALPHA = 0.94;
export const EVENT_ARTWORK_IMAGE_DEPTH = 0;
export const EVENT_ARTWORK_TEXT_DEPTH = 1;

export type EventArtworkSource = {
  width: number;
  height: number;
};

export function getEventArtworkScale(source: EventArtworkSource): number {
  const maxSourceSize = Math.max(source.width, source.height);

  if (maxSourceSize <= 0) {
    return 1;
  }

  return EVENT_ARTWORK_TARGET_SIZE / maxSourceSize;
}

export function applyEventArtworkDisplaySize(
  image: Phaser.GameObjects.Image,
  source: EventArtworkSource
): Phaser.GameObjects.Image {
  const scale = getEventArtworkScale(source);

  return image.setDisplaySize(source.width * scale, source.height * scale);
}

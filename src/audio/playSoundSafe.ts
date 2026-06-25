/// <reference types="vite/client" />

import Phaser from 'phaser';

function warnAudio(message: string, error?: unknown): void {
  if (!import.meta.env.DEV) {
    return;
  }

  if (error === undefined) {
    console.warn(message);
    return;
  }

  console.warn(message, error);
}

export function playSoundSafe(scene: Phaser.Scene, key: string, config?: Phaser.Types.Sound.SoundConfig): boolean {
  if (!scene.cache.audio.exists(key)) {
    warnAudio(`[audio] Missing audio asset: ${key}`);
    return false;
  }

  try {
    const didPlay = scene.sound.play(key, config);

    if (!didPlay) {
      warnAudio(`[audio] Sound manager rejected playback: ${key} (locked: ${scene.sound.locked})`);
    }

    return didPlay;
  } catch (error) {
    warnAudio(`[audio] Could not play audio asset: ${key}`, error);
    return false;
  }
}

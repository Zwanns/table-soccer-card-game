import Phaser from 'phaser';

export function playSoundSafe(scene: Phaser.Scene, key: string, config?: Phaser.Types.Sound.SoundConfig): boolean {
  if (!scene.cache.audio.exists(key)) {
    console.warn(`[audio] Missing audio asset: ${key}`);
    return false;
  }

  try {
    scene.sound.play(key, config);
    return true;
  } catch (error) {
    console.warn(`[audio] Could not play audio asset: ${key}`, error);
    return false;
  }
}

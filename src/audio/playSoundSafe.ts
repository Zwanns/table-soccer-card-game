import Phaser from 'phaser';

export function playSoundSafe(scene: Phaser.Scene, key: string, config?: Phaser.Types.Sound.SoundConfig): void {
  if (!scene.cache.audio.exists(key)) {
    console.warn(`[audio] Missing audio asset: ${key}`);
    return;
  }

  scene.sound.play(key, config);
}

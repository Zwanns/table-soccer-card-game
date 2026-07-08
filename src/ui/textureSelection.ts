export interface TextureSelectionScene {
  textures?: {
    exists?: (key: string) => boolean;
  };
}

export type RandomSource = () => number;

export function selectRandomAvailableTextureKey(
  scene: TextureSelectionScene,
  textureKeys: readonly string[],
  random: RandomSource = Math.random
): string | null {
  const exists = scene.textures?.exists;

  if (typeof exists !== 'function') {
    return null;
  }

  const availableTextureKeys = textureKeys.filter((textureKey) => {
    try {
      return exists.call(scene.textures, textureKey);
    } catch {
      return false;
    }
  });

  if (availableTextureKeys.length === 0) {
    return null;
  }

  if (availableTextureKeys.length === 1) {
    return availableTextureKeys[0]!;
  }

  const nextRandomValue = random();
  const randomValue = Number.isFinite(nextRandomValue) ? nextRandomValue : 0;
  const textureIndex = Math.min(
    availableTextureKeys.length - 1,
    Math.max(0, Math.floor(randomValue * availableTextureKeys.length))
  );

  return availableTextureKeys[textureIndex]!;
}

import { describe, expect, it } from 'vitest';
import { selectRandomAvailableTextureKey, type TextureSelectionScene } from '../ui/textureSelection';

function sceneWithTextures(availableTextureKeys: readonly string[]): TextureSelectionScene {
  const available = new Set(availableTextureKeys);

  return {
    textures: {
      exists: (key: string) => available.has(key)
    }
  };
}

describe('random available texture selection', () => {
  it('selects only from available texture keys', () => {
    const scene = sceneWithTextures(['second']);

    expect(selectRandomAvailableTextureKey(scene, ['first', 'second', 'third'], () => 0)).toBe('second');
  });

  it('returns null when no texture key is available', () => {
    expect(selectRandomAvailableTextureKey(sceneWithTextures([]), ['first', 'second'], () => 0)).toBeNull();
  });

  it('does not throw when texture manager is missing or mocked incompletely', () => {
    expect(selectRandomAvailableTextureKey({}, ['first'], () => 0)).toBeNull();
    expect(selectRandomAvailableTextureKey({ textures: {} }, ['first'], () => 0)).toBeNull();
  });

  it('uses deterministic injected random values to select multiple keys', () => {
    const scene = sceneWithTextures(['first', 'second', 'third']);

    expect(selectRandomAvailableTextureKey(scene, ['first', 'second', 'third'], () => 0)).toBe('first');
    expect(selectRandomAvailableTextureKey(scene, ['first', 'second', 'third'], () => 0.34)).toBe('second');
    expect(selectRandomAvailableTextureKey(scene, ['first', 'second', 'third'], () => 0.99)).toBe('third');
  });

  it('clamps unusual random values instead of throwing', () => {
    const scene = sceneWithTextures(['first', 'second']);

    expect(selectRandomAvailableTextureKey(scene, ['first', 'second'], () => -1)).toBe('first');
    expect(selectRandomAvailableTextureKey(scene, ['first', 'second'], () => 2)).toBe('second');
    expect(selectRandomAvailableTextureKey(scene, ['first', 'second'], () => Number.NaN)).toBe('first');
  });
});

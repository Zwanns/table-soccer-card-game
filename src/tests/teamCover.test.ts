import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AVAILABLE_TEAM_COVER_FLAG_CODES,
  fitImageContain,
  getFallbackCoverTextureKey,
  getTeamCoverAssetKey,
  getTeamCoverFilename,
  getTeamCoverPath,
  getTeamCoverTextureKey,
  hasManualTeamCover,
  markTeamCoverLoadFailed,
  resolveTeamCoverAsset,
  resolveTeamCoverLoadResult,
  type ImageLike,
  type TextureLookup
} from '../assets/teamCover';
import { NATIONAL_TEAMS } from '../data/nationalTeams';

describe('team cover assets', () => {
  it('builds webp cover filenames from flag filenames', () => {
    expect(getTeamCoverFilename('poland.png')).toBe('poland.webp');
    expect(getTeamCoverFilename('ukraine.svg')).toBe('ukraine.webp');
    expect(getTeamCoverFilename('argentina.webp')).toBe('argentina.webp');
  });

  it('builds cover paths from flag filenames', () => {
    expect(getTeamCoverPath('poland.png')).toBe('covers/poland.webp');
    expect(getTeamCoverPath('pl')).toBe('covers/pl.webp');
  });

  it('builds stable texture keys from flag filenames', () => {
    expect(getTeamCoverTextureKey('poland.png')).toBe('cover-poland');
    expect(getTeamCoverAssetKey('poland.png')).toBe('cover-poland');
    expect(getTeamCoverTextureKey('gb-eng')).toBe('cover-gb-eng');
    expect(getFallbackCoverTextureKey()).toBe('cover-none');
  });

  it('uses fallback when a national cover is missing or failed to load', () => {
    const textures: TextureLookup = {
      exists: (textureKey) => textureKey === 'cover-br' || textureKey === 'cover-ar'
    };

    expect(resolveTeamCoverLoadResult(textures, 'br')).toEqual({
      textureKey: 'cover-br',
      usedFallback: false
    });
    expect(resolveTeamCoverLoadResult(textures, 'ng')).toEqual({
      textureKey: 'cover-none',
      usedFallback: true
    });

    markTeamCoverLoadFailed('cover-ar');

    expect(resolveTeamCoverLoadResult(textures, 'ar')).toEqual({
      textureKey: 'cover-none',
      usedFallback: true
    });
  });

  it('registers every current team cover file while preserving fallback for unknown teams', () => {
    expect([...AVAILABLE_TEAM_COVER_FLAG_CODES].sort()).toEqual(getCurrentTeamCoverFileCodes());
    expect(AVAILABLE_TEAM_COVER_FLAG_CODES).toEqual(
      expect.arrayContaining(['fr', 'es', 'nir', 'gb-eng', 'gb-sct', 'gb-wls', 'ie'])
    );
    expect(AVAILABLE_TEAM_COVER_FLAG_CODES).not.toContain('none');
    expect(hasManualTeamCover('fr')).toBe(true);
    expect(hasManualTeamCover('es')).toBe(true);
    expect(hasManualTeamCover('nir')).toBe(true);
    expect(hasManualTeamCover('gb-eng')).toBe(true);
    expect(hasManualTeamCover('none')).toBe(false);
    expect(hasManualTeamCover('unknown')).toBe(false);

    const textures: TextureLookup = {
      exists: (textureKey) => textureKey === 'cover-none'
    };

    expect(resolveTeamCoverLoadResult(textures, 'unknown')).toEqual({
      textureKey: 'cover-none',
      usedFallback: true
    });
  });

  it('resolves manual and fallback cover assets by flagCode', () => {
    expect(resolveTeamCoverAsset('fr')).toEqual({
      textureKey: 'cover-fr',
      path: 'covers/fr.webp',
      usedFallback: false
    });
    expect(resolveTeamCoverAsset('es').textureKey).toBe('cover-es');
    expect(resolveTeamCoverAsset('nir').textureKey).toBe('cover-nir');
    expect(resolveTeamCoverAsset('unknown')).toEqual({
      textureKey: 'cover-none',
      path: 'covers/none.webp',
      usedFallback: true
    });
  });

  it('scales cover images with contain while preserving aspect ratio', () => {
    const image = createImageMock(848, 1344);
    const scale = fitImageContain(image, { width: 96, height: 132 });

    expect(scale).toBeCloseTo(132 / 1344);
    expect(image.displayWidth).toBeLessThanOrEqual(96);
    expect(image.displayHeight).toBeLessThanOrEqual(132);
    expect(image.displayWidth / image.displayHeight).toBeCloseTo(848 / 1344);
  });

  it('fits the recommended 960 x 1320 cover size exactly into the current deck ratio', () => {
    const image = createImageMock(960, 1320);
    const scale = fitImageContain(image, { width: 96, height: 132 });

    expect(scale).toBeCloseTo(0.1);
    expect(image.displayWidth).toBeCloseTo(96);
    expect(image.displayHeight).toBeCloseTo(132);
  });

  it('can derive cover metadata for every national team flag code', () => {
    for (const team of NATIONAL_TEAMS) {
      expect(getTeamCoverFilename(team.flagCode)).toBe(`${team.flagCode}.webp`);
      expect(getTeamCoverPath(team.flagCode)).toBe(`covers/${team.flagCode}.webp`);
      expect(getTeamCoverTextureKey(team.flagCode)).toBe(`cover-${team.flagCode}`);
    }
  });
});

function getCurrentTeamCoverFileCodes(): string[] {
  const nationalFlagCodes = new Set(NATIONAL_TEAMS.map((team) => team.flagCode));

  return readdirSync(join(process.cwd(), 'public', 'covers'))
    .filter((fileName) => fileName.endsWith('.webp'))
    .map((fileName) => fileName.slice(0, -'.webp'.length))
    .filter((flagCode) => flagCode !== 'none')
    .filter((flagCode) => nationalFlagCodes.has(flagCode))
    .sort();
}

function createImageMock(width: number, height: number): ImageLike & { displayWidth: number; displayHeight: number } {
  return {
    width,
    height,
    displayWidth: width,
    displayHeight: height,
    setScale(scale: number): void {
      this.displayWidth = this.width * scale;
      this.displayHeight = this.height * scale;
    }
  };
}

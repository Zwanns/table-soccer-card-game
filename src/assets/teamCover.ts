import Phaser from 'phaser';

const COVER_FOLDER = 'covers';
const COVER_EXTENSION = '.webp';
const COVER_TEXTURE_PREFIX = 'cover';
const FALLBACK_COVER_BASENAME = 'none';
const FALLBACK_COVER_PATH = `${COVER_FOLDER}/${FALLBACK_COVER_BASENAME}${COVER_EXTENSION}`;
const FALLBACK_COVER_TEXTURE_KEY = `${COVER_TEXTURE_PREFIX}-${FALLBACK_COVER_BASENAME}`;

export const AVAILABLE_TEAM_COVER_FLAG_CODES: readonly string[] = [
  'al',
  'am',
  'ar',
  'at',
  'au',
  'be',
  'br',
  'by',
  'ca',
  'ch',
  'ci',
  'cl',
  'cm',
  'co',
  'cr',
  'cz',
  'de',
  'dk',
  'dz',
  'ec',
  'eg',
  'es',
  'fr',
  'gb-eng',
  'gb-sct',
  'gb-wls',
  'ge',
  'gr',
  'hr',
  'hu',
  'ie',
  'iq',
  'ir',
  'it',
  'jp',
  'kr',
  'kz',
  'ma',
  'ml',
  'mx',
  'ng',
  'nir',
  'nl',
  'no',
  'pa',
  'pe',
  'pl',
  'pt',
  'py',
  'qa',
  'ro',
  'rs',
  'sa',
  'se',
  'si',
  'sk',
  'sn',
  'tn',
  'tr',
  'ua',
  'us',
  'uy',
  'uz',
  've',
  'za'
] as const;

const failedCoverTextureKeys = new Set<string>();
const AVAILABLE_TEAM_COVER_FLAG_CODE_SET = new Set<string>(AVAILABLE_TEAM_COVER_FLAG_CODES);

export interface TeamCoverLoadResult {
  textureKey: string;
  usedFallback: boolean;
}

export interface TeamCoverAsset {
  textureKey: string;
  path: string;
  usedFallback: boolean;
}

export interface TextureLookup {
  exists(textureKey: string): boolean;
}

export interface ImageLike {
  width: number;
  height: number;
  setScale(scale: number): unknown;
}

export interface FitBounds {
  width: number;
  height: number;
}

export function getTeamCoverFilename(flagFilename: string): string {
  return `${getBasenameWithoutExtension(flagFilename)}${COVER_EXTENSION}`;
}

export function getTeamCoverPath(flagFilename: string): string {
  return `${COVER_FOLDER}/${getTeamCoverFilename(flagFilename)}`;
}

export function getTeamCoverTextureKey(flagFilename: string): string {
  return `${COVER_TEXTURE_PREFIX}-${getBasenameWithoutExtension(flagFilename)}`;
}

export function getTeamCoverAssetKey(flagFilename: string): string {
  return getTeamCoverTextureKey(flagFilename);
}

export function getFallbackCoverPath(): string {
  return FALLBACK_COVER_PATH;
}

export function getFallbackCoverTextureKey(): string {
  return FALLBACK_COVER_TEXTURE_KEY;
}

export function hasManualTeamCover(flagCode: string): boolean {
  return AVAILABLE_TEAM_COVER_FLAG_CODE_SET.has(flagCode);
}

export function resolveTeamCoverAsset(flagCode: string): TeamCoverAsset {
  if (!hasManualTeamCover(flagCode)) {
    return {
      textureKey: FALLBACK_COVER_TEXTURE_KEY,
      path: FALLBACK_COVER_PATH,
      usedFallback: true
    };
  }

  return {
    textureKey: getTeamCoverTextureKey(flagCode),
    path: getTeamCoverPath(flagCode),
    usedFallback: false
  };
}

export function queueTeamCoverLoad(scene: Phaser.Scene, flagFilename: string): void {
  const asset = resolveTeamCoverAsset(flagFilename);

  if (
    asset.usedFallback ||
    scene.textures.exists(asset.textureKey) ||
    failedCoverTextureKeys.has(asset.textureKey)
  ) {
    return;
  }

  scene.load.image(asset.textureKey, asset.path);
}

export function markTeamCoverLoadFailed(textureKey: string): void {
  if (textureKey.startsWith(`${COVER_TEXTURE_PREFIX}-`)) {
    failedCoverTextureKeys.add(textureKey);
  }
}

export function resolveTeamCoverLoadResult(textures: TextureLookup, flagFilename: string): TeamCoverLoadResult {
  const asset = resolveTeamCoverAsset(flagFilename);

  if (!asset.usedFallback && textures.exists(asset.textureKey) && !failedCoverTextureKeys.has(asset.textureKey)) {
    return {
      textureKey: asset.textureKey,
      usedFallback: false
    };
  }

  return {
    textureKey: FALLBACK_COVER_TEXTURE_KEY,
    usedFallback: true
  };
}

export function fitImageContain(image: ImageLike, bounds: FitBounds): number {
  if (image.width <= 0 || image.height <= 0 || bounds.width <= 0 || bounds.height <= 0) {
    return 0;
  }

  const scale = Math.min(bounds.width / image.width, bounds.height / image.height);
  image.setScale(scale);

  return scale;
}

function getBasenameWithoutExtension(filename: string): string {
  const normalizedFilename = filename.trim().replaceAll('\\', '/');
  const file = normalizedFilename.split('/').filter(Boolean).at(-1) ?? normalizedFilename;
  const extensionIndex = file.lastIndexOf('.');

  if (extensionIndex <= 0) {
    return file;
  }

  return file.slice(0, extensionIndex);
}

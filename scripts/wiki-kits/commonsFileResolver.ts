import { resolveCommonsFile } from './commonsClient';
import type { CommonsAssetKind, CommonsAssetMetadata } from './types';

export type KitLayerPart = 'body' | 'leftArm' | 'rightArm' | 'shorts';

export type OptionalCommonsAssetResolution = {
  asset?: CommonsAssetMetadata;
  warnings: string[];
};

const BASE_LAYER_TITLES: Record<KitLayerPart, string> = {
  body: 'Kit body.svg',
  leftArm: 'Kit left arm.svg',
  rightArm: 'Kit right arm.svg',
  shorts: 'Kit shorts.svg'
};

const COMMONS_PART_NAMES: Record<KitLayerPart, string> = {
  body: 'body',
  leftArm: 'left arm',
  rightArm: 'right arm',
  shorts: 'shorts'
};

const BASE_ASSET_KINDS: Record<KitLayerPart, CommonsAssetKind> = {
  body: 'base-body',
  leftArm: 'base-left-arm',
  rightArm: 'base-right-arm',
  shorts: 'base-shorts'
};

const PATTERN_ASSET_KINDS: Record<KitLayerPart, CommonsAssetKind> = {
  body: 'pattern-body',
  leftArm: 'pattern-left-arm',
  rightArm: 'pattern-right-arm',
  shorts: 'pattern-shorts'
};

export function getBaseLayerFileTitle(part: KitLayerPart): string {
  return BASE_LAYER_TITLES[part];
}

export function getPatternFileCandidates(part: KitLayerPart, token: string): string[] {
  const normalizedToken = token.trim().replace(/^_+/, '').replace(/_/g, ' ');
  const partName = COMMONS_PART_NAMES[part];

  return [`Kit ${partName} ${normalizedToken}.png`, `Kit ${partName} ${normalizedToken}.svg`];
}

export async function resolveBaseLayer(part: KitLayerPart): Promise<CommonsAssetMetadata> {
  const title = getBaseLayerFileTitle(part);
  const asset = await resolveCommonsFile(title, BASE_ASSET_KINDS[part]);

  if (asset === null) {
    throw new Error(`Required Commons base layer was not found: ${title}`);
  }

  return asset;
}

export async function resolvePatternLayer(part: KitLayerPart, token: string): Promise<OptionalCommonsAssetResolution> {
  const candidates = getPatternFileCandidates(part, token);

  for (const candidate of candidates) {
    const asset = await resolveCommonsFile(candidate, PATTERN_ASSET_KINDS[part]);

    if (asset !== null) {
      return {
        asset,
        warnings: []
      };
    }
  }

  return {
    warnings: [
      `Pattern not found for ${part} token "${token}". Tried: ${candidates.map((candidate) => `File:${candidate}`).join(', ')}`
    ]
  };
}

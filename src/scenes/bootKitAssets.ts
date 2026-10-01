import { FALLBACK_TEAM_KIT_ASSET, getAllKitAssetDescriptors } from '../data/teamKits';

export type BootKitAssetLoadItem = { assetKey: string; path: string };

export function getRegisteredKitAssetsToLoad(): BootKitAssetLoadItem[] {
  const descriptors = getAllKitAssetDescriptors();
  return [
    FALLBACK_TEAM_KIT_ASSET,
    ...descriptors.filter((kit) => kit.kind === 'goalkeeper')
      .map(({ textureKey, path }) => ({ assetKey: textureKey, path })),
    ...descriptors.filter((kit) => kit.kind === 'field')
      .map(({ textureKey, path }) => ({ assetKey: textureKey, path }))
  ];
}

import {
  AVAILABLE_MANUAL_KIT_FLAG_CODES,
  FALLBACK_TEAM_KIT_ASSET,
  GOALKEEPER_KIT_IDS,
  getGoalkeeperKitAssetKey,
  getGoalkeeperKitAssetPath,
  getTeamKitAssetKey,
  getTeamKitAssetPath
} from '../data/teamKits';

export type BootKitAssetLoadItem = {
  assetKey: string;
  path: string;
};

export function getRegisteredKitAssetsToLoad(): BootKitAssetLoadItem[] {
  return [
    {
      assetKey: FALLBACK_TEAM_KIT_ASSET.assetKey,
      path: FALLBACK_TEAM_KIT_ASSET.path
    },
    ...GOALKEEPER_KIT_IDS.map((goalkeeperKitId) => ({
      assetKey: getGoalkeeperKitAssetKey(goalkeeperKitId),
      path: getGoalkeeperKitAssetPath(goalkeeperKitId)
    })),
    ...[...AVAILABLE_MANUAL_KIT_FLAG_CODES].map((flagCode) => ({
      assetKey: getTeamKitAssetKey(flagCode),
      path: getTeamKitAssetPath(flagCode)
    }))
  ];
}

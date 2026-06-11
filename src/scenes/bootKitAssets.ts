import {
  AVAILABLE_GOALKEEPER_KIT_IDS,
  AVAILABLE_MANUAL_KIT_FLAG_CODES,
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
    ...[...AVAILABLE_MANUAL_KIT_FLAG_CODES].map((flagCode) => ({
      assetKey: getTeamKitAssetKey(flagCode),
      path: getTeamKitAssetPath(flagCode)
    })),
    ...[...AVAILABLE_GOALKEEPER_KIT_IDS].map((goalkeeperKitId) => ({
      assetKey: getGoalkeeperKitAssetKey(goalkeeperKitId),
      path: getGoalkeeperKitAssetPath(goalkeeperKitId)
    }))
  ];
}

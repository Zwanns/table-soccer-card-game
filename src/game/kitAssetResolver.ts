import {
  AVAILABLE_MANUAL_KIT_FLAG_CODES,
  FALLBACK_TEAM_KIT_ASSET,
  getGoalkeeperKitStyle,
  getTeamKitStyle,
  type GoalkeeperKitId,
  type GoalkeeperKitStyle,
  type TeamKitStyle
} from '../data/teamKits';

export type ResolvedKitAsset = {
  assetKey: string;
  numberColor: string;
};

const FALLBACK_NUMBER_COLORS = {
  numberColor: '#111111'
} as const;

export function resolveTeamKitAsset(flagCode: string): ResolvedKitAsset {
  const style = getTeamKitStyle(flagCode);

  if (style === undefined) {
    return createFallbackTeamAsset(FALLBACK_NUMBER_COLORS);
  }

  if (!AVAILABLE_MANUAL_KIT_FLAG_CODES.has(flagCode)) {
    return createFallbackTeamAsset(style);
  }

  return createImageAsset(style);
}

export function resolveGoalkeeperKitAsset(goalkeeperKitId: GoalkeeperKitId): ResolvedKitAsset {
  const style = getGoalkeeperKitStyle(goalkeeperKitId);

  if (style === undefined) {
    return createFallbackTeamAsset(FALLBACK_NUMBER_COLORS);
  }

  return createImageAsset(style);
}

function createImageAsset(
  style: Pick<TeamKitStyle | GoalkeeperKitStyle, 'assetKey' | 'secondaryColor'>
): ResolvedKitAsset {
  return {
    assetKey: style.assetKey,
    numberColor: style.secondaryColor
  };
}

function createFallbackTeamAsset(colors: Pick<TeamKitStyle, 'secondaryColor'> | typeof FALLBACK_NUMBER_COLORS): ResolvedKitAsset {
  return {
    assetKey: FALLBACK_TEAM_KIT_ASSET.assetKey,
    numberColor: 'secondaryColor' in colors ? colors.secondaryColor : colors.numberColor
  };
}

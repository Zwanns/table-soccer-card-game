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
  shirtNumberColor: string;
  shirtNumberStrokeColor: string;
};

const FALLBACK_NUMBER_COLORS = {
  shirtNumberColor: '#111111',
  shirtNumberStrokeColor: '#FFFFFF'
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
  style: Pick<TeamKitStyle | GoalkeeperKitStyle, 'assetKey' | 'shirtNumberColor' | 'shirtNumberStrokeColor'>
): ResolvedKitAsset {
  return {
    assetKey: style.assetKey,
    shirtNumberColor: style.shirtNumberColor,
    shirtNumberStrokeColor: style.shirtNumberStrokeColor
  };
}

function createFallbackTeamAsset(
  colors: Pick<TeamKitStyle, 'shirtNumberColor' | 'shirtNumberStrokeColor'>
): ResolvedKitAsset {
  return {
    assetKey: FALLBACK_TEAM_KIT_ASSET.assetKey,
    shirtNumberColor: colors.shirtNumberColor,
    shirtNumberStrokeColor: colors.shirtNumberStrokeColor
  };
}

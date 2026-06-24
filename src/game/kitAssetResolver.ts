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
  numberStrokeColor?: string;
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
  style: Pick<TeamKitStyle | GoalkeeperKitStyle, 'assetKey' | 'shirtNumberColor' | 'shirtNumberStrokeColor'>
): ResolvedKitAsset {
  return {
    assetKey: style.assetKey,
    numberColor: style.shirtNumberColor,
    ...(style.shirtNumberStrokeColor === undefined
      ? {}
      : { numberStrokeColor: style.shirtNumberStrokeColor })
  };
}

function createFallbackTeamAsset(
  colors: Pick<TeamKitStyle, 'shirtNumberColor' | 'shirtNumberStrokeColor'> | typeof FALLBACK_NUMBER_COLORS
): ResolvedKitAsset {
  const numberStrokeColor =
    'shirtNumberStrokeColor' in colors ? colors.shirtNumberStrokeColor : undefined;

  return {
    assetKey: FALLBACK_TEAM_KIT_ASSET.assetKey,
    numberColor: 'shirtNumberColor' in colors ? colors.shirtNumberColor : colors.numberColor,
    ...(numberStrokeColor === undefined ? {} : { numberStrokeColor })
  };
}

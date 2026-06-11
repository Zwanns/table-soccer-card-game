import {
  AVAILABLE_GOALKEEPER_KIT_IDS,
  AVAILABLE_MANUAL_KIT_FLAG_CODES,
  getGoalkeeperKitStyle,
  getTeamKitStyle,
  type GoalkeeperKitId,
  type GoalkeeperKitStyle,
  type TeamKitStyle
} from '../data/teamKits';

export type ResolvedKitAsset =
  | {
      type: 'image';
      assetKey: string;
      shirtNumberColor: string;
      shirtNumberStrokeColor: string;
    }
  | {
      type: 'fallback';
      primaryColor: string;
      secondaryColor: string;
      shirtNumberColor: string;
      shirtNumberStrokeColor: string;
    };

const SAFE_FALLBACK_KIT: ResolvedKitAsset = {
  type: 'fallback',
  primaryColor: '#FFFFFF',
  secondaryColor: '#111111',
  shirtNumberColor: '#111111',
  shirtNumberStrokeColor: '#FFFFFF'
};

export function resolveTeamKitAsset(flagCode: string): ResolvedKitAsset {
  const style = getTeamKitStyle(flagCode);

  if (style === undefined) {
    return SAFE_FALLBACK_KIT;
  }

  return AVAILABLE_MANUAL_KIT_FLAG_CODES.has(flagCode)
    ? createImageAsset(style)
    : createFallbackAsset(style);
}

export function resolveGoalkeeperKitAsset(goalkeeperKitId: GoalkeeperKitId): ResolvedKitAsset {
  const style = getGoalkeeperKitStyle(goalkeeperKitId);

  if (style === undefined) {
    return SAFE_FALLBACK_KIT;
  }

  return AVAILABLE_GOALKEEPER_KIT_IDS.has(goalkeeperKitId)
    ? createImageAsset(style)
    : createFallbackAsset(style);
}

function createImageAsset(style: Pick<TeamKitStyle | GoalkeeperKitStyle, 'assetKey' | 'shirtNumberColor' | 'shirtNumberStrokeColor'>): ResolvedKitAsset {
  return {
    type: 'image',
    assetKey: style.assetKey,
    shirtNumberColor: style.shirtNumberColor,
    shirtNumberStrokeColor: style.shirtNumberStrokeColor
  };
}

function createFallbackAsset(
  style: Pick<
    TeamKitStyle | GoalkeeperKitStyle,
    'primaryColor' | 'secondaryColor' | 'shirtNumberColor' | 'shirtNumberStrokeColor'
  >
): ResolvedKitAsset {
  return {
    type: 'fallback',
    primaryColor: style.primaryColor,
    secondaryColor: style.secondaryColor,
    shirtNumberColor: style.shirtNumberColor,
    shirtNumberStrokeColor: style.shirtNumberStrokeColor
  };
}

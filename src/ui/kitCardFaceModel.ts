import { type ResolvedKitAsset, resolveTeamKitAsset } from '../game/kitAssetResolver';
import { getFlagAssetKey } from '../data/nationalTeams';
import type { CardPlayerProfile } from './cardPlayerProfile';
import { px } from './textRendering';

export const KIT_CARD_FACE_WIDTH = 108;
export const KIT_CARD_FACE_HEIGHT = 148.5;

export const CARD_FACE_VISUAL_TUNING = {
  rankScale: 0.8,
  rankOffsetY: -5,
  kitScale: 1.2,
  kitOffsetX: -4,
  kitOffsetY: -5
} as const;

export const CARD_FACE_FLAG_LAYOUT = {
  width: 28,
  height: 18,
  offsetRight: 8,
  offsetTop: 8,
  originX: 1,
  originY: 0,
  outlineColor: 0x000000,
  outlineWidth: 1
} as const;

export const KIT_CARD_LAYOUT = {
  kitWidth: 76,
  kitHeight: 88,
  kitAnchorX: 1,
  kitAnchorY: 1,
  kitOffsetRight: 6,
  kitOffsetBottom: 6,
  shirtNumberX: 0.5,
  shirtNumberY: 0.3,
  rankOffsetLeft: 10,
  rankOffsetTop: 8,
  rankColor: '#000000',
  rankFontFamily: 'Anton, Arial, sans-serif',
  rankFontSize: 42,
  longRankFontSize: 26,
  kitRankSafetyGap: 1,
  shirtNumberFontFamily: 'Oswald, Arial, sans-serif',
  shirtNumberFontSize: 16,
  shirtNumberScaleY: 0.88,
  shirtNumberStrokeThickness: 2,
  cardCornerRadius: 8,
  deckCornerRadius: 8
} as const;

export function getCardRankDisplayLabel(rank: string): string {
  if (rank === 'J') return 'V';
  if (rank.toUpperCase() === 'JOKER') return 'J';
  return rank;
}

export function getCardRankFontSize(rank: string): number {
  const baseSize = rank.length > 2 ? KIT_CARD_LAYOUT.longRankFontSize : KIT_CARD_LAYOUT.rankFontSize;
  return baseSize * CARD_FACE_VISUAL_TUNING.rankScale;
}

export function getCardRankY(): number {
  return px(-KIT_CARD_FACE_HEIGHT / 2 + KIT_CARD_LAYOUT.rankOffsetTop + CARD_FACE_VISUAL_TUNING.rankOffsetY);
}

export type PreparedKitCardFace = {
  rank: string;
  displayRank: string;
  shirtNumber?: number;
  flagTextureKey?: string;
  kitAsset: ResolvedKitAsset | null;
};

export type KitImageLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
};

export type ShirtNumberLayout = {
  x: number;
  y: number;
};

export function prepareKitCardFace(options: {
  rank: string;
  playerProfile?: CardPlayerProfile;
  kitAsset?: ResolvedKitAsset;
}): PreparedKitCardFace {
  return {
    rank: options.rank,
    displayRank: getCardRankDisplayLabel(options.rank),
    shirtNumber: options.playerProfile?.shirtNumber,
    flagTextureKey:
      options.playerProfile === undefined ? undefined : getFlagAssetKey(options.playerProfile.teamId),
    kitAsset:
      options.kitAsset ??
      (options.playerProfile === undefined || isGoalkeeperProfile(options.playerProfile)
        ? null
        : resolveTeamKitAsset(options.playerProfile.teamId))
  };
}

export function getKitImageLayout(): KitImageLayout {
  const layout = KIT_CARD_LAYOUT;
  const baseWidth = layout.kitWidth;
  const baseHeight = layout.kitHeight;
  const width = baseWidth * CARD_FACE_VISUAL_TUNING.kitScale;
  const height = baseHeight * CARD_FACE_VISUAL_TUNING.kitScale;
  const baseX = px(KIT_CARD_FACE_WIDTH / 2 - layout.kitOffsetRight);
  const baseY = px(KIT_CARD_FACE_HEIGHT / 2 - layout.kitOffsetBottom);
  const centeredY =
    baseY +
    (height - baseHeight) * (layout.kitAnchorY - 0.5) +
    CARD_FACE_VISUAL_TUNING.kitOffsetY;
  const rankBottom = getCardRankY() + getCardRankFontSize('A');
  const rankSafeY = rankBottom + height + KIT_CARD_LAYOUT.kitRankSafetyGap;

  return {
    // Compensate for scaling around the bottom-right origin, then apply the shared visual offset.
    x:
      baseX +
      (width - baseWidth) * (layout.kitAnchorX - 0.5) +
      CARD_FACE_VISUAL_TUNING.kitOffsetX,
    y: Math.min(Math.max(centeredY, rankSafeY), KIT_CARD_FACE_HEIGHT / 2),
    width,
    height,
    originX: layout.kitAnchorX,
    originY: layout.kitAnchorY
  };
}

export function getCardFlagLayout(): KitImageLayout {
  return {
    x: px(KIT_CARD_FACE_WIDTH / 2 - CARD_FACE_FLAG_LAYOUT.offsetRight),
    y: px(-KIT_CARD_FACE_HEIGHT / 2 + CARD_FACE_FLAG_LAYOUT.offsetTop),
    width: CARD_FACE_FLAG_LAYOUT.width,
    height: CARD_FACE_FLAG_LAYOUT.height,
    originX: CARD_FACE_FLAG_LAYOUT.originX,
    originY: CARD_FACE_FLAG_LAYOUT.originY
  };
}

export function getShirtNumberLayout(
  kit = getKitImageLayout()
): ShirtNumberLayout {
  const layout = KIT_CARD_LAYOUT;

  return {
    x: px(kit.x + (layout.shirtNumberX - kit.originX) * kit.width),
    y: px(kit.y + (layout.shirtNumberY - kit.originY) * kit.height)
  };
}

function isGoalkeeperProfile(profile: CardPlayerProfile): boolean {
  return 'role' in profile && profile.role === 'goalkeeper';
}

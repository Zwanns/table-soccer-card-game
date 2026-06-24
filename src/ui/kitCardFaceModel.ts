import { type ResolvedKitAsset, resolveTeamKitAsset } from '../game/kitAssetResolver';
import type { CardPlayerProfile } from './cardPlayerProfile';
import { px } from './textRendering';

export const KIT_CARD_FACE_WIDTH = 108;
export const KIT_CARD_FACE_HEIGHT = 148.5;

export const KIT_CARD_LAYOUT = {
  kitWidth: 76,
  kitHeight: 88,
  kitAnchorX: 1,
  kitAnchorY: 1,
  kitOffsetRight: 6,
  kitOffsetBottom: 6,
  shirtNumberX: 0.5,
  shirtNumberY: 0.33,
  rankOffsetLeft: 10,
  rankOffsetTop: 8,
  rankColor: '#000000',
  rankFontFamily: 'Anton, Arial, sans-serif',
  shirtNumberFontFamily: 'Oswald, Arial, sans-serif',
  shirtNumberFontSize: 16,
  shirtNumberScaleY: 0.88,
  shirtNumberStrokeThickness: 2,
  cardCornerRadius: 8,
  deckCornerRadius: 8
} as const;

export type KitCardFaceLayoutVariant = 'default' | 'teams-preview';

const TEAMS_PREVIEW_KIT_CARD_LAYOUT = {
  kitWidth: 80,
  kitHeight: 88,
  kitAnchorX: 1,
  kitAnchorY: 1,
  kitOffsetRight: 10,
  kitOffsetBottom: 10,
  shirtNumberX: 0.5,
  shirtNumberY: 0.3
} as const;

export type PreparedKitCardFace = {
  rank: string;
  shirtNumber?: number;
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
    shirtNumber: options.playerProfile?.shirtNumber,
    kitAsset:
      options.kitAsset ??
      (options.playerProfile === undefined || isGoalkeeperProfile(options.playerProfile)
        ? null
        : resolveTeamKitAsset(options.playerProfile.teamId))
  };
}

export function getKitImageLayout(layoutVariant: KitCardFaceLayoutVariant = 'default'): KitImageLayout {
  const layout = getKitLayoutMetrics(layoutVariant);

  return {
    x: px(KIT_CARD_FACE_WIDTH / 2 - layout.kitOffsetRight),
    y: px(KIT_CARD_FACE_HEIGHT / 2 - layout.kitOffsetBottom),
    width: px(layout.kitWidth),
    height: px(layout.kitHeight),
    originX: layout.kitAnchorX,
    originY: layout.kitAnchorY
  };
}

export function getShirtNumberLayout(
  layoutVariant: KitCardFaceLayoutVariant = 'default',
  kit = getKitImageLayout(layoutVariant)
): ShirtNumberLayout {
  const layout = getKitLayoutMetrics(layoutVariant);

  return {
    x: px(kit.x + (layout.shirtNumberX - kit.originX) * kit.width),
    y: px(kit.y + (layout.shirtNumberY - kit.originY) * kit.height)
  };
}

function isGoalkeeperProfile(profile: CardPlayerProfile): boolean {
  return 'role' in profile && profile.role === 'goalkeeper';
}

function getKitLayoutMetrics(layoutVariant: KitCardFaceLayoutVariant): {
  kitWidth: number;
  kitHeight: number;
  kitAnchorX: number;
  kitAnchorY: number;
  kitOffsetRight: number;
  kitOffsetBottom: number;
  shirtNumberX: number;
  shirtNumberY: number;
} {
  return layoutVariant === 'teams-preview' ? TEAMS_PREVIEW_KIT_CARD_LAYOUT : KIT_CARD_LAYOUT;
}

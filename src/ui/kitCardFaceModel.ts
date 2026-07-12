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

export const CARD_INNER_FRAME = {
  inset: 10,
  radius: 6,
  rankAreaRight: -10,
  rankAreaBottom: -14,
  rankGap: 8,
  kitFacingSegmentLength: 14,
  lineWidth: 3,
  alpha: 0.94,
  kitSafeZone: 50,
  normalColor: '#818894',
  jokerColor: '#F0C95A'
} as const;

export type CardInnerFrameSegment =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'arc'; x: number; y: number; radius: number; startAngle: number; endAngle: number };

export function getCardRankDisplayLabel(rank: string): string {
  if (rank === 'J') return 'V';
  if (rank.toUpperCase() === 'JOKER') return 'J';
  return rank;
}

export function getCardInnerFrameColor(rank: string): string {
  return rank.toUpperCase() === 'JOKER' ? CARD_INNER_FRAME.jokerColor : CARD_INNER_FRAME.normalColor;
}

// Corner brackets deliberately leave two 50px+ openings along the perimeter:
// top/left for the rank and right/bottom for the kit artwork.
export function getCardInnerFrameSegments(): readonly CardInnerFrameSegment[] {
  const left = -KIT_CARD_FACE_WIDTH / 2 + CARD_INNER_FRAME.inset;
  const right = KIT_CARD_FACE_WIDTH / 2 - CARD_INNER_FRAME.inset;
  const top = -KIT_CARD_FACE_HEIGHT / 2 + CARD_INNER_FRAME.inset;
  const bottom = KIT_CARD_FACE_HEIGHT / 2 - CARD_INNER_FRAME.inset;
  const radius = CARD_INNER_FRAME.radius;
  const rankFacingHorizontalStart = CARD_INNER_FRAME.rankAreaRight + CARD_INNER_FRAME.rankGap;
  const rankFacingVerticalStart = CARD_INNER_FRAME.rankAreaBottom + CARD_INNER_FRAME.rankGap;
  const kitFacingLength = CARD_INNER_FRAME.kitFacingSegmentLength;
  return [
    { kind: 'line', x1: rankFacingHorizontalStart, y1: top, x2: right - radius, y2: top },
    { kind: 'arc', x: right - radius, y: top + radius, radius, startAngle: -Math.PI / 2, endAngle: 0 },
    { kind: 'line', x1: right, y1: top + radius, x2: right, y2: top + radius + kitFacingLength },
    { kind: 'line', x1: left, y1: rankFacingVerticalStart, x2: left, y2: bottom - radius },
    { kind: 'arc', x: left + radius, y: bottom - radius, radius, startAngle: Math.PI / 2, endAngle: Math.PI },
    { kind: 'line', x1: left + radius, y1: bottom, x2: left + radius + kitFacingLength, y2: bottom }
  ];
}

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
  displayRank: string;
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
    displayRank: getCardRankDisplayLabel(options.rank),
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

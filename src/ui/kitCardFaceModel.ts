import { type ResolvedKitAsset, resolveTeamKitAsset } from '../game/kitAssetResolver';
import type { CardPlayerProfile } from './cardPlayerProfile';

export const KIT_CARD_FACE_WIDTH = 108;
export const KIT_CARD_FACE_HEIGHT = 148.5;

export const KIT_CARD_LAYOUT = {
  kitWidth: 92,
  kitHeight: 106,
  kitAnchorX: 1,
  kitAnchorY: 1,
  kitOffsetRight: 0,
  kitOffsetBottom: 0,
  shirtNumberX: 0.5,
  shirtNumberY: 0.33,
  rankColor: '#000000',
  cardCornerRadius: 8,
  deckCornerRadius: 8
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

export function getKitImageLayout(): KitImageLayout {
  return {
    x: KIT_CARD_FACE_WIDTH / 2 - KIT_CARD_LAYOUT.kitOffsetRight,
    y: KIT_CARD_FACE_HEIGHT / 2 - KIT_CARD_LAYOUT.kitOffsetBottom,
    width: KIT_CARD_LAYOUT.kitWidth,
    height: KIT_CARD_LAYOUT.kitHeight,
    originX: KIT_CARD_LAYOUT.kitAnchorX,
    originY: KIT_CARD_LAYOUT.kitAnchorY
  };
}

export function getShirtNumberLayout(): ShirtNumberLayout {
  const kit = getKitImageLayout();

  return {
    x: kit.x + (KIT_CARD_LAYOUT.shirtNumberX - KIT_CARD_LAYOUT.kitAnchorX) * kit.width,
    y: kit.y + (KIT_CARD_LAYOUT.shirtNumberY - KIT_CARD_LAYOUT.kitAnchorY) * kit.height
  };
}

function isGoalkeeperProfile(profile: CardPlayerProfile): boolean {
  return 'role' in profile && profile.role === 'goalkeeper';
}

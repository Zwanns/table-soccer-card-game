import { SHIRT_NUMBER_ANCHOR } from '../data/teamKits';
import { type ResolvedKitAsset, resolveTeamKitAsset } from '../game/kitAssetResolver';
import type { CardPlayerProfile } from './cardPlayerProfile';

export const KIT_CARD_FACE_WIDTH = 108;
export const KIT_CARD_FACE_HEIGHT = 148.5;

export type PreparedKitCardFace = {
  rank: string;
  shirtNumber?: number;
  kitAsset: ResolvedKitAsset | null;
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

export function getShirtNumberLayout(): ShirtNumberLayout {
  return {
    x: (SHIRT_NUMBER_ANCHOR.x - 0.5) * KIT_CARD_FACE_WIDTH,
    y: -KIT_CARD_FACE_HEIGHT / 2 + SHIRT_NUMBER_ANCHOR.y * KIT_CARD_FACE_HEIGHT
  };
}

function isGoalkeeperProfile(profile: CardPlayerProfile): boolean {
  return 'role' in profile && profile.role === 'goalkeeper';
}

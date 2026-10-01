import { getTeamKitStyle, hasManualTeamKit, type FieldKitVariant } from '../data/teamKits';

export type KitColors = { primaryColor: string; secondaryColor: string };
export type KitCandidate = Partial<KitColors> & { imageAvailable: boolean };
export type TeamKitCandidates = Record<FieldKitVariant, KitCandidate>;
export type TournamentKitPair = readonly [FieldKitVariant, FieldKitVariant];

export const KIT_PRIMARY_WEIGHT = 0.75;
export const KIT_SECONDARY_WEIGHT = 0.25;
export const KIT_REVERSED_PAIR_WEIGHT = 0.8;
export const KIT_SIMILARITY_DISTANCE = 0.25;
export const KIT_CONFLICT_THRESHOLD = 0.65;

// Euclidean distance in Oklab: sRGB is linearized before the perceptual transform.
function oklab(hex: string): readonly number[] {
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
}

function similarity(first: string, second: string): number {
  const a = oklab(first);
  const b = oklab(second);
  const distance = Math.hypot(...a.map((value, index) => value - b[index]));
  return Math.max(0, 1 - distance / KIT_SIMILARITY_DISTANCE);
}

/** Higher scores mean more conflict (0..1). Secondary-only matches score at most 0.25.
 * Reversed pairs receive a separate penalty because both colors still overlap.
 */
export function scoreKitConflict(first: KitColors, second: KitColors): number {
  const direct = KIT_PRIMARY_WEIGHT * similarity(first.primaryColor, second.primaryColor)
    + KIT_SECONDARY_WEIGHT * similarity(first.secondaryColor, second.secondaryColor);
  const reversed = KIT_REVERSED_PAIR_WEIGHT * Math.min(
    similarity(first.primaryColor, second.secondaryColor),
    similarity(first.secondaryColor, second.primaryColor)
  );
  return Math.max(direct, reversed);
}

function eligible(kit: KitCandidate): kit is KitCandidate & KitColors {
  return kit.imageAvailable && [kit.primaryColor, kit.secondaryColor].every(
    (color) => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)
  );
}

/** Input order is fixture order, independent of human/AI controllers. */
export function selectTournamentKits(first: TeamKitCandidates, second: TeamKitCandidates): TournamentKitPair {
  const combinations: readonly TournamentKitPair[] = [
    ['home', 'home'], ['home', 'away'], ['away', 'home'], ['away', 'away']
  ];
  let best: TournamentKitPair = ['home', 'home'];
  let bestScore = Infinity;
  for (const pair of combinations) {
    const a = first[pair[0]];
    const b = second[pair[1]];
    if (!eligible(a) || !eligible(b)) continue;
    const score = scoreKitConflict(a, b);
    if (score < KIT_CONFLICT_THRESHOLD) return pair;
    if (score < bestScore - 1e-12) {
      bestScore = score;
      best = pair;
    }
  }
  return best;
}

export function getTournamentKitCandidates(flagCode: string): TeamKitCandidates {
  const candidate = (variant: FieldKitVariant): KitCandidate => {
    const style = getTeamKitStyle(flagCode, variant);
    return {
      imageAvailable: hasManualTeamKit(flagCode, variant),
      primaryColor: style?.primaryColor,
      secondaryColor: style?.secondaryColor
    };
  };
  return { home: candidate('home'), away: candidate('away') };
}

export function resolveTournamentKits(firstFlagCode: string, secondFlagCode: string): TournamentKitPair {
  return selectTournamentKits(getTournamentKitCandidates(firstFlagCode), getTournamentKitCandidates(secondFlagCode));
}

import { AVAILABLE_TEAM_LOGO_FLAG_CODES } from '../data/generated/availableTeamLogoFlagCodes';
import { normalizeFlagCode } from '../data/flagCodes';
import { getFlagAssetKey } from '../data/nationalTeams';

const logoCodes = new Set<string>(AVAILABLE_TEAM_LOGO_FLAG_CODES);

export function hasTeamLogo(flagCode: string): boolean {
  return logoCodes.has(normalizeFlagCode(flagCode));
}

export function getTeamLogoAssetKey(flagCode: string): string {
  return `team-logo-${normalizeFlagCode(flagCode)}`;
}

export function getTeamLogoAssetPath(flagCode: string): string {
  return `logos/${normalizeFlagCode(flagCode)}.webp`;
}

export function getTeamIdentityAssetKey(flagCode: string, textureExists?: (key: string) => boolean): string {
  const code = normalizeFlagCode(flagCode);
  const logoKey = getTeamLogoAssetKey(code);
  return hasTeamLogo(code) && (textureExists?.(logoKey) ?? true) ? logoKey : getFlagAssetKey(code);
}

export function resolveTeamIdentityVisual(flagCode: string, flagWidth: number, flagHeight: number, textureExists?: (key: string) => boolean) {
  const key = getTeamIdentityAssetKey(flagCode, textureExists);
  return { key, width: key === getTeamLogoAssetKey(flagCode) ? flagHeight : flagWidth, height: flagHeight };
}

export function getRegisteredTeamLogosToLoad() {
  return AVAILABLE_TEAM_LOGO_FLAG_CODES.map((flagCode) => ({
    flagCode, assetKey: getTeamLogoAssetKey(flagCode), path: getTeamLogoAssetPath(flagCode)
  }));
}

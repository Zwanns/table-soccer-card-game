import { normalizeFlagCode } from './flagCodes';
import { NATIONAL_TEAMS, type NationalTeam } from './nationalTeams';

// Product allow-list. Keep master registries intact and preserve their display order.
export const ACTIVE_TEAM_FLAG_CODES = [
  'ar', 'be', 'br', 'cm', 'co', 'hr', 'cz', 'dk',
  'eng', 'fr', 'ge', 'de', 'it', 'jm', 'jp', 'mx',
  'ma', 'nl', 'ng', 'no', 'py', 'pl', 'pt', 'ca',
  'kr', 'es', 'se', 'tr', 'ua', 'uy', 'us', 'uz'
] as const;

const activeCodes = new Set<string>(ACTIVE_TEAM_FLAG_CODES);

export function isActiveTeam(flagCode: string): boolean {
  return activeCodes.has(flagCode);
}

export const ACTIVE_NATIONAL_TEAMS: readonly NationalTeam[] = NATIONAL_TEAMS.filter((team) => isActiveTeam(team.flagCode));

export function resolveActiveTeamSelection(flagCode: string | undefined, fallback = 'fr'): string {
  const canonical = normalizeFlagCode(flagCode ?? fallback);
  if (isActiveTeam(canonical)) return canonical;
  return isActiveTeam(fallback) ? fallback : ACTIVE_NATIONAL_TEAMS[0].flagCode;
}

export function assertActiveTeams(flagCodes: readonly string[]): void {
  for (const code of flagCodes) {
    if (!isActiveTeam(code)) throw new Error(`Team "${code}" is not in the active team pool.`);
  }
}

export function validateActiveTeamPool(): void {
  const nationalCodes = NATIONAL_TEAMS.map((team) => team.flagCode);
  if (ACTIVE_TEAM_FLAG_CODES.length !== 32 || activeCodes.size !== 32) {
    throw new Error('Active team pool must contain exactly 32 unique codes.');
  }
  if (new Set(nationalCodes).size !== nationalCodes.length) throw new Error('National team codes must be unique.');
  if (nationalCodes.some((code) => normalizeFlagCode(code) !== code)) throw new Error('National teams must use canonical codes.');
  if (ACTIVE_TEAM_FLAG_CODES.some((code) => !nationalCodes.includes(code) || normalizeFlagCode(code) !== code)) {
    throw new Error('Every active team must exist in the canonical national team registry.');
  }
}

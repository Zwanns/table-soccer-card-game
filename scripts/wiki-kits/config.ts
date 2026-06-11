import type { KitVariant, TeamId } from './types';

export type WikiKitTeamConfig = {
  teamId: TeamId;
  wikipediaTitle: string;
};

export const TEST_WIKI_KIT_TEAMS: WikiKitTeamConfig[] = [
  {
    teamId: 'poland',
    wikipediaTitle: 'Сборная Польши по футболу'
  },
  {
    teamId: 'ukraine',
    wikipediaTitle: 'Сборная Украины по футболу'
  },
  {
    teamId: 'brazil',
    wikipediaTitle: 'Сборная Бразилии по футболу'
  }
];

export const TEAM_IDS = TEST_WIKI_KIT_TEAMS.map((team) => team.teamId) as TeamId[];
export const KIT_VARIANTS: KitVariant[] = ['home', 'away'];

export const WIKIPEDIA_API_URL = 'https://ru.wikipedia.org/w/api.php';
export const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';
export const REQUEST_DELAY_MS = 150;
export const COMMONS_REQUEST_DELAY_MS = 500;
export const HTTP_429_RETRY_DELAYS_MS = [1_000, 3_000, 7_000] as const;

export const USER_AGENT = 'TotalSoccerMundialKitImporter/0.1 (local development importer)';

export function isTeamId(value: string): value is TeamId {
  return (TEAM_IDS as string[]).includes(value);
}

export function isKitVariant(value: string): value is KitVariant {
  return (KIT_VARIANTS as string[]).includes(value);
}

export function normalizeHexColor(value: string): string {
  const normalized = value.trim().replace(/^#/, '').toUpperCase();

  if (!/^[0-9A-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color "${value}". Expected a 6-digit RRGGBB value.`);
  }

  return normalized;
}

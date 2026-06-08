import { NATIONAL_TEAMS } from './nationalTeams';

export type FieldKitVariant = 'home' | 'away';

export type GoalkeeperKitId =
  | 'gk-1'
  | 'gk-2'
  | 'gk-3'
  | 'gk-4';

export type TeamKitConfig = {
  teamId: string;
  homeAssetKey: string;
  awayAssetKey: string;
};

export type MatchTeamKitSelection = {
  fieldKit: FieldKitVariant;
  goalkeeperKitId: GoalkeeperKitId;
};

export const FIELD_KIT_VARIANTS: readonly FieldKitVariant[] = ['home', 'away'];

export const GOALKEEPER_KIT_IDS: readonly GoalkeeperKitId[] = [
  'gk-1',
  'gk-2',
  'gk-3',
  'gk-4'
];

export const DEFAULT_FIELD_KIT: FieldKitVariant = 'home';

export function getTeamKitAssetKey(teamId: string, variant: FieldKitVariant): string {
  return `kit-team-${teamId}-${variant}`;
}

export function getTeamKitAssetPath(teamId: string, variant: FieldKitVariant): string {
  return `kits/teams/${teamId}/${variant}.png`;
}

export function getGoalkeeperKitAssetKey(goalkeeperKitId: GoalkeeperKitId): string {
  return `kit-goalkeeper-${goalkeeperKitId}`;
}

export function getGoalkeeperKitAssetPath(goalkeeperKitId: GoalkeeperKitId): string {
  return `kits/goalkeepers/${goalkeeperKitId}.png`;
}

export function createTeamKitConfig(teamId: string): TeamKitConfig {
  return {
    teamId,
    homeAssetKey: getTeamKitAssetKey(teamId, 'home'),
    awayAssetKey: getTeamKitAssetKey(teamId, 'away')
  };
}

export const TEAM_KIT_CONFIGS: readonly TeamKitConfig[] = NATIONAL_TEAMS.map((team) =>
  createTeamKitConfig(team.flagCode)
);

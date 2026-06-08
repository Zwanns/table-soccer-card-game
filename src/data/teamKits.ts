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

export type KitAssetKind = 'field' | 'goalkeeper';

export type KitAssetDescriptor = {
  kind: KitAssetKind;
  textureKey: string;
  path: string;
};

export type KitAssetLoadSummary = {
  loadedTextureKeys: string[];
  skippedTextureKeys: string[];
};

export type KitTextureScene = {
  textures: {
    exists(textureKey: string): boolean;
    addImage(textureKey: string, image: HTMLImageElement): unknown;
  };
};

export type LoadAvailableKitTexturesOptions = {
  timeoutMs?: number;
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

export function getTeamKitAssetDescriptors(teamId: string): KitAssetDescriptor[] {
  return FIELD_KIT_VARIANTS.map((variant) => ({
    kind: 'field',
    textureKey: getTeamKitAssetKey(teamId, variant),
    path: getTeamKitAssetPath(teamId, variant)
  }));
}

export function getGoalkeeperKitAssetDescriptors(): KitAssetDescriptor[] {
  return GOALKEEPER_KIT_IDS.map((goalkeeperKitId) => ({
    kind: 'goalkeeper',
    textureKey: getGoalkeeperKitAssetKey(goalkeeperKitId),
    path: getGoalkeeperKitAssetPath(goalkeeperKitId)
  }));
}

export function getAllKitAssetDescriptors(): KitAssetDescriptor[] {
  return [
    ...NATIONAL_TEAMS.flatMap((team) => getTeamKitAssetDescriptors(team.flagCode)),
    ...getGoalkeeperKitAssetDescriptors()
  ];
}

export async function loadAvailableKitTextures(
  scene: KitTextureScene,
  descriptors: readonly KitAssetDescriptor[] = getAllKitAssetDescriptors(),
  options: LoadAvailableKitTexturesOptions = {}
): Promise<KitAssetLoadSummary> {
  const loadedTextureKeys: string[] = [];
  const skippedTextureKeys: string[] = [];
  const timeoutMs = options.timeoutMs ?? 1800;

  await Promise.all(
    descriptors.map(async (descriptor) => {
      if (scene.textures.exists(descriptor.textureKey)) {
        loadedTextureKeys.push(descriptor.textureKey);
        return;
      }

      const image = await loadOptionalImage(descriptor.path, timeoutMs);

      if (image === null) {
        skippedTextureKeys.push(descriptor.textureKey);
        return;
      }

      scene.textures.addImage(descriptor.textureKey, image);
      loadedTextureKeys.push(descriptor.textureKey);
    })
  );

  return {
    loadedTextureKeys,
    skippedTextureKeys
  };
}

async function loadOptionalImage(path: string, timeoutMs: number): Promise<HTMLImageElement | null> {
  if (!(await isReachableImage(path))) {
    return null;
  }

  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }

    const image = new Image();
    const timeout = setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      resolve(null);
    }, timeoutMs);

    image.onload = () => {
      clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
    image.src = path;
  });
}

async function isReachableImage(path: string): Promise<boolean> {
  if (typeof fetch !== 'function') {
    return true;
  }

  try {
    const response = await fetch(path, {
      cache: 'no-cache',
      method: 'HEAD'
    });

    return response.ok;
  } catch {
    return false;
  }
}

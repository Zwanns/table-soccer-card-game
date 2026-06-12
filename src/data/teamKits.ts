import { NATIONAL_TEAMS } from './nationalTeams';

export type ShirtNumberAnchor = {
  x: number;
  y: number;
};

export type TeamKitStyle = {
  flagCode: string;

  assetKey: string;
  path: string;

  primaryColor: string;
  secondaryColor: string;

  shirtNumberColor: string;
  shirtNumberStrokeColor: string;
};

export type GoalkeeperKitId =
  | 'gk1'
  | 'gk2';

export type GoalkeeperKitStyle = {
  id: GoalkeeperKitId;

  assetKey: string;
  path: string;

  primaryColor: string;
  secondaryColor: string;

  shirtNumberColor: string;
  shirtNumberStrokeColor: string;
};

export const SHIRT_NUMBER_ANCHOR: ShirtNumberAnchor = {
  x: 0.5,
  y: 0.31
};

export const KIT_IMAGE_SIZE = {
  width: 130,
  height: 150
} as const;

export const DEFAULT_KIT_IMAGE_SCALE = 1;

export const DEFAULT_SHIRT_NUMBER_STYLE = {
  fontFamily: 'Arial Black',
  fontSize: 17,
  strokeThickness: 2
} as const;

const TEAM_KIT_STYLE_ROWS = [
  ['al', '#D71920', '#111111', '#FFFFFF', '#111111'],
  ['dz', '#FFFFFF', '#00843D', '#00843D', '#FFFFFF'],
  ['ar', '#75AADB', '#FFFFFF', '#111111', '#FFFFFF'],
  ['am', '#D90012', '#0033A0', '#FFFFFF', '#111111'],
  ['au', '#FFCD00', '#00843D', '#006747', '#FFFFFF'],
  ['at', '#ED2939', '#FFFFFF', '#FFFFFF', '#111111'],
  ['by', '#D22730', '#007C4C', '#FFFFFF', '#111111'],
  ['be', '#E30613', '#FFCD00', '#FFCD00', '#111111'],
  ['br', '#FFDF00', '#009C3B', '#002776', '#FFFFFF'],
  ['cm', '#007A5E', '#FCD116', '#FCD116', '#111111'],
  ['ca', '#D80621', '#FFFFFF', '#FFFFFF', '#111111'],
  ['cl', '#D52B1E', '#0039A6', '#FFFFFF', '#111111'],
  ['co', '#FCD116', '#003893', '#003893', '#FFFFFF'],
  ['cr', '#CE1126', '#002B7F', '#FFFFFF', '#111111'],
  ['hr', '#FFFFFF', '#FF0000', '#0033A0', '#FFFFFF'],
  ['cz', '#D7141A', '#11457E', '#FFFFFF', '#111111'],
  ['dk', '#C60C30', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ec', '#FFD100', '#034EA2', '#034EA2', '#FFFFFF'],
  ['eg', '#CE1126', '#000000', '#FFFFFF', '#111111'],
  ['gb-eng', '#FFFFFF', '#1C2C5B', '#1C2C5B', '#FFFFFF'],
  ['fr', '#002654', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ge', '#FFFFFF', '#E30A17', '#E30A17', '#FFFFFF'],
  ['de', '#FFFFFF', '#111111', '#111111', '#FFFFFF'],
  ['gr', '#0D5EAF', '#FFFFFF', '#FFFFFF', '#0D3B73'],
  ['hu', '#CE2939', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ir', '#FFFFFF', '#239F40', '#239F40', '#FFFFFF'],
  ['iq', '#017B3D', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ie', '#169B62', '#FFFFFF', '#FFFFFF', '#111111'],
  ['it', '#0066CC', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ci', '#F77F00', '#009E60', '#006B3F', '#FFFFFF'],
  ['jp', '#003478', '#FFFFFF', '#FFFFFF', '#111111'],
  ['kz', '#00AFCA', '#FEC50C', '#003B5C', '#FFFFFF'],
  ['ml', '#FCD116', '#14B53A', '#007A33', '#FFFFFF'],
  ['mx', '#006847', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ma', '#C1272D', '#006233', '#FFFFFF', '#111111'],
  ['nl', '#F36C21', '#111111', '#111111', '#FFFFFF'],
  ['ng', '#008753', '#FFFFFF', '#FFFFFF', '#111111'],
  ['no', '#BA0C2F', '#00205B', '#FFFFFF', '#111111'],
  ['pa', '#DA121A', '#FFFFFF', '#FFFFFF', '#111111'],
  ['py', '#D52B1E', '#FFFFFF', '#0038A8', '#FFFFFF'],
  ['pe', '#FFFFFF', '#D91023', '#D91023', '#FFFFFF'],
  ['pl', '#FFFFFF', '#DC143C', '#DC143C', '#FFFFFF'],
  ['pt', '#E42518', '#046A38', '#F7D117', '#111111'],
  ['qa', '#8A1538', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ro', '#FCD116', '#002B7F', '#002B7F', '#FFFFFF'],
  ['sa', '#006C35', '#FFFFFF', '#FFFFFF', '#111111'],
  ['gb-sct', '#003876', '#FFFFFF', '#FFFFFF', '#111111'],
  ['sn', '#FFFFFF', '#00853F', '#00853F', '#FFFFFF'],
  ['rs', '#C6363C', '#0C4076', '#FFFFFF', '#111111'],
  ['sk', '#0052B4', '#FFFFFF', '#FFFFFF', '#111111'],
  ['si', '#FFFFFF', '#005DA4', '#005DA4', '#FFFFFF'],
  ['za', '#FFB81C', '#007749', '#007749', '#FFFFFF'],
  ['kr', '#E6002D', '#111111', '#111111', '#FFFFFF'],
  ['es', '#AA151B', '#F1BF00', '#F1BF00', '#111111'],
  ['se', '#FFCD00', '#006AA7', '#006AA7', '#FFFFFF'],
  ['ch', '#D52B1E', '#FFFFFF', '#FFFFFF', '#111111'],
  ['tn', '#FFFFFF', '#E70013', '#E70013', '#FFFFFF'],
  ['tr', '#E30A17', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ua', '#FFD700', '#0057B8', '#0057B8', '#FFFFFF'],
  ['uy', '#5BC0EB', '#111111', '#111111', '#FFFFFF'],
  ['us', '#FFFFFF', '#002868', '#002868', '#FFFFFF'],
  ['uz', '#FFFFFF', '#0099B5', '#006B8F', '#FFFFFF'],
  ['ve', '#8A1538', '#F4C430', '#F4C430', '#111111'],
  ['gb-wls', '#C8102E', '#FFFFFF', '#FFFFFF', '#111111']
] as const satisfies readonly (readonly [string, string, string, string, string])[];

export const TEAM_KIT_STYLES: readonly TeamKitStyle[] = TEAM_KIT_STYLE_ROWS.map(
  ([
    flagCode,
    primaryColor,
    secondaryColor,
    shirtNumberColor,
    shirtNumberStrokeColor
  ]) => ({
    flagCode,
    assetKey: `kit-${flagCode}`,
    path: `kits/images/${flagCode}.webp`,
    primaryColor,
    secondaryColor,
    shirtNumberColor,
    shirtNumberStrokeColor
  })
);

export const GOALKEEPER_KIT_STYLES: readonly GoalkeeperKitStyle[] = [
  {
    id: 'gk1',
    assetKey: 'kit-gk1',
    path: 'kits/images/gk1.webp',

    primaryColor: '#111111',
    secondaryColor: '#3A3A3A',

    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: '#111111'
  },
  {
    id: 'gk2',
    assetKey: 'kit-gk2',
    path: 'kits/images/gk2.webp',

    primaryColor: '#FFB81C',
    secondaryColor: '#111111',

    shirtNumberColor: '#111111',
    shirtNumberStrokeColor: '#FFFFFF'
  }
] as const;

export const FALLBACK_TEAM_KIT_ASSET = {
  assetKey: 'kit-none',
  path: 'kits/images/none.webp'
} as const;

export const AVAILABLE_MANUAL_KIT_FLAG_CODES = new Set<string>([
  'ar',
  'br',
  'de',
  'es',
  'fr',
  'gb-eng',
  'gb-wls',
  'it',
  'mx',
  'ng',
  'no',
  'pl',
  'ua',
  'uy'
]);

export const AVAILABLE_GOALKEEPER_KIT_IDS = new Set<GoalkeeperKitId>(['gk1', 'gk2']);

const TEAM_KIT_STYLES_BY_FLAG_CODE: ReadonlyMap<string, TeamKitStyle> = new Map(
  TEAM_KIT_STYLES.map((style) => [style.flagCode, style])
);

const GOALKEEPER_KIT_STYLES_BY_ID: ReadonlyMap<GoalkeeperKitId, GoalkeeperKitStyle> = new Map(
  GOALKEEPER_KIT_STYLES.map((style) => [style.id, style])
);

export function getTeamKitStyle(flagCode: string): TeamKitStyle | undefined {
  return TEAM_KIT_STYLES_BY_FLAG_CODE.get(flagCode);
}

export function getGoalkeeperKitStyle(id: GoalkeeperKitId): GoalkeeperKitStyle | undefined {
  return GOALKEEPER_KIT_STYLES_BY_ID.get(id);
}

export function hasManualTeamKit(flagCode: string): boolean {
  return AVAILABLE_MANUAL_KIT_FLAG_CODES.has(flagCode);
}

export function hasManualGoalkeeperKit(id: GoalkeeperKitId): boolean {
  return AVAILABLE_GOALKEEPER_KIT_IDS.has(id);
}

export function validateTeamKitStylesAgainstNationalTeams(): void {
  const errors: string[] = [];
  const nationalFlagCodes = NATIONAL_TEAMS.map((team) => team.flagCode);
  const nationalFlagCodeSet = new Set(nationalFlagCodes);
  const styleFlagCodes = TEAM_KIT_STYLES.map((style) => style.flagCode);
  const goalkeeperKitIds = GOALKEEPER_KIT_STYLES.map((style) => style.id);

  if (TEAM_KIT_STYLES.length !== 64) {
    errors.push(`TEAM_KIT_STYLES must contain 64 entries, got ${TEAM_KIT_STYLES.length}.`);
  }

  if (NATIONAL_TEAMS.length !== 64) {
    errors.push(`NATIONAL_TEAMS must contain 64 entries, got ${NATIONAL_TEAMS.length}.`);
  }

  for (const flagCode of nationalFlagCodes) {
    if (!TEAM_KIT_STYLES_BY_FLAG_CODE.has(flagCode)) {
      errors.push(`Missing team kit style for flagCode "${flagCode}".`);
    }
  }

  for (const flagCode of styleFlagCodes) {
    if (!nationalFlagCodeSet.has(flagCode)) {
      errors.push(`Unexpected team kit style flagCode "${flagCode}".`);
    }
  }

  pushDuplicateErrors(errors, styleFlagCodes, 'flagCode');
  pushDuplicateErrors(errors, TEAM_KIT_STYLES.map((style) => style.assetKey), 'team assetKey');
  pushDuplicateErrors(errors, TEAM_KIT_STYLES.map((style) => style.path), 'team path');
  pushDuplicateErrors(errors, GOALKEEPER_KIT_STYLES.map((style) => style.assetKey), 'goalkeeper assetKey');
  pushDuplicateErrors(errors, GOALKEEPER_KIT_STYLES.map((style) => style.path), 'goalkeeper path');

  for (const style of TEAM_KIT_STYLES) {
    validateKitStyleShape(errors, style, `team "${style.flagCode}"`);
  }

  for (const style of GOALKEEPER_KIT_STYLES) {
    validateKitStyleShape(errors, style, `goalkeeper "${style.id}"`);
  }

  if (SHIRT_NUMBER_ANCHOR.x < 0 || SHIRT_NUMBER_ANCHOR.x > 1) {
    errors.push(`SHIRT_NUMBER_ANCHOR.x must be in 0..1, got ${SHIRT_NUMBER_ANCHOR.x}.`);
  }

  if (SHIRT_NUMBER_ANCHOR.y < 0 || SHIRT_NUMBER_ANCHOR.y > 1) {
    errors.push(`SHIRT_NUMBER_ANCHOR.y must be in 0..1, got ${SHIRT_NUMBER_ANCHOR.y}.`);
  }

  if (GOALKEEPER_KIT_STYLES.length !== 2) {
    errors.push(`GOALKEEPER_KIT_STYLES must contain 2 entries, got ${GOALKEEPER_KIT_STYLES.length}.`);
  }

  for (const id of ['gk1', 'gk2'] satisfies GoalkeeperKitId[]) {
    if (!goalkeeperKitIds.includes(id)) {
      errors.push(`Missing goalkeeper kit "${id}".`);
    }
  }

  for (const oldId of ['gk-1', 'gk-2', 'gk-3', 'gk-4']) {
    if ((goalkeeperKitIds as string[]).includes(oldId)) {
      errors.push(`Goalkeeper kit styles must not include ${oldId}.`);
    }
  }

  if (!FALLBACK_TEAM_KIT_ASSET.path.startsWith('kits/images/')) {
    errors.push(`Fallback kit path must start with kits/images/, got "${FALLBACK_TEAM_KIT_ASSET.path}".`);
  }

  if (!FALLBACK_TEAM_KIT_ASSET.path.endsWith('.webp')) {
    errors.push(`Fallback kit path must end with .webp, got "${FALLBACK_TEAM_KIT_ASSET.path}".`);
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

function validateKitStyleShape(
  errors: string[],
  style: {
    assetKey: string;
    path: string;
    primaryColor: string;
    secondaryColor: string;
    shirtNumberColor: string;
    shirtNumberStrokeColor: string;
  },
  label: string
): void {
  for (const [field, value] of [
    ['primaryColor', style.primaryColor],
    ['secondaryColor', style.secondaryColor],
    ['shirtNumberColor', style.shirtNumberColor],
    ['shirtNumberStrokeColor', style.shirtNumberStrokeColor]
  ] as const) {
    if (!isHexColor(value)) {
      errors.push(`${label} ${field} must be #RRGGBB, got "${value}".`);
    }
  }

  if (!style.path.startsWith('kits/images/')) {
    errors.push(`${label} path must start with kits/images/, got "${style.path}".`);
  }

  if (!style.path.endsWith('.webp')) {
    errors.push(`${label} path must end with .webp, got "${style.path}".`);
  }

  if (!style.assetKey.startsWith('kit-')) {
    errors.push(`${label} assetKey must start with kit-, got "${style.assetKey}".`);
  }
}

function pushDuplicateErrors(errors: string[], values: readonly string[], label: string): void {
  const seen = new Set<string>();
  const reported = new Set<string>();

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      continue;
    }

    if (!reported.has(value)) {
      reported.add(value);
      errors.push(`Duplicate ${label} "${value}".`);
    }
  }
}

function isHexColor(value: string): boolean {
  return /^#[0-9A-F]{6}$/.test(value);
}

// Compatibility exports for existing scenes. The Stage 1 contract above is the source of truth.
export type FieldKitVariant = 'home';

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

export const FIELD_KIT_VARIANTS: readonly FieldKitVariant[] = ['home'];

export const GOALKEEPER_KIT_IDS: readonly GoalkeeperKitId[] = ['gk1', 'gk2'];

export const DEFAULT_FIELD_KIT: FieldKitVariant = 'home';

export function getTeamKitAssetKey(flagCode: string, _variant: FieldKitVariant = DEFAULT_FIELD_KIT): string {
  if (!hasManualTeamKit(flagCode)) {
    return FALLBACK_TEAM_KIT_ASSET.assetKey;
  }

  return getTeamKitStyle(flagCode)?.assetKey ?? FALLBACK_TEAM_KIT_ASSET.assetKey;
}

export function getTeamKitAssetPath(flagCode: string, _variant: FieldKitVariant = DEFAULT_FIELD_KIT): string {
  if (!hasManualTeamKit(flagCode)) {
    return FALLBACK_TEAM_KIT_ASSET.path;
  }

  return getTeamKitStyle(flagCode)?.path ?? FALLBACK_TEAM_KIT_ASSET.path;
}

export function getGoalkeeperKitAssetKey(goalkeeperKitId: GoalkeeperKitId): string {
  return getGoalkeeperKitStyle(goalkeeperKitId)?.assetKey ?? `kit-${goalkeeperKitId}`;
}

export function getGoalkeeperKitAssetPath(goalkeeperKitId: GoalkeeperKitId): string {
  return getGoalkeeperKitStyle(goalkeeperKitId)?.path ?? `kits/images/${goalkeeperKitId}.webp`;
}

export function getTeamKitAssetDescriptors(flagCode: string): KitAssetDescriptor[] {
  const style = getTeamKitStyle(flagCode);

  return style === undefined
    ? []
    : [
        {
          kind: 'field',
          textureKey: style.assetKey,
          path: style.path
        }
      ];
}

export function getGoalkeeperKitAssetDescriptors(): KitAssetDescriptor[] {
  return GOALKEEPER_KIT_STYLES.map((style) => ({
    kind: 'goalkeeper',
    textureKey: style.assetKey,
    path: style.path
  }));
}

export function getAllKitAssetDescriptors(): KitAssetDescriptor[] {
  const goalkeeperDescriptors: KitAssetDescriptor[] = [];

  for (const id of AVAILABLE_GOALKEEPER_KIT_IDS) {
    const style = getGoalkeeperKitStyle(id);

    if (style !== undefined) {
      goalkeeperDescriptors.push({
        kind: 'goalkeeper',
        textureKey: style.assetKey,
        path: style.path
      });
    }
  }

  return [
    ...[...AVAILABLE_MANUAL_KIT_FLAG_CODES].flatMap((flagCode) => getTeamKitAssetDescriptors(flagCode)),
    ...goalkeeperDescriptors
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

    return response.ok && (response.headers.get('content-type') ?? '').startsWith('image/');
  } catch {
    return false;
  }
}

import {
  AVAILABLE_AWAY_KIT_FLAG_CODES as GENERATED_AVAILABLE_AWAY_KIT_FLAG_CODES,
  AVAILABLE_MANUAL_KIT_FLAG_CODES as GENERATED_AVAILABLE_MANUAL_KIT_FLAG_CODES
} from './generated/availableManualKitFlagCodes';
import { NATIONAL_TEAMS } from './nationalTeams';
import { normalizeFlagCode } from './flagCodes';

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
  shirtNumberStrokeColor?: string;
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
  accentColor?: string;

  shirtNumberColor: string;
  shirtNumberStrokeColor?: string;
};

export const SHIRT_NUMBER_ANCHOR: ShirtNumberAnchor = {
  x: 0.5,
  y: 0.31
};

export const TEAM_KIT_IMAGE_WIDTH = 702;
export const TEAM_KIT_IMAGE_HEIGHT = 900;

export const KIT_IMAGE_SIZE = {
  width: TEAM_KIT_IMAGE_WIDTH,
  height: TEAM_KIT_IMAGE_HEIGHT
} as const;

export const DEFAULT_KIT_IMAGE_SCALE = 1;

export const DEFAULT_SHIRT_NUMBER_STYLE = {
  fontFamily: 'Arial Black',
  fontSize: 17,
  strokeThickness: 0
} as const;

// HOME row format: [flagCode, primaryColor, secondaryColor, shirtNumberColor, shirtNumberStrokeColor?]
// Number colors are explicit; an undefined stroke means no outline.
// Source for 32 teams: National Football Teams, Teams!A3:K34.
// Other teams retain their effective HOME colors from before this migration.
const TEAM_KIT_STYLE_ROWS = [
  ['al', '#D71920', '#111111', '#111111', undefined],
  ['dz', '#00843D', '#FFFFFF', '#FFFFFF', undefined],
  ['ar', '#75AADB', '#FFFFFF', '#000000', undefined],
  ['am', '#D90012', '#0033A0', '#FFFFFF', '#111111'],
  ['au', '#FFCD00', '#05573D', '#05573D', '#FFFFFF'],
  ['at', '#ED2939', '#FFFFFF', '#FFFFFF', '#111111'],
  ['by', '#D22730', '#007C4C', '#FFFFFF', undefined],
  ['be', '#E30613', '#000000', '#FFCD00', undefined],
  ['br', '#FFDF00', '#003CB1', '#009739', undefined],
  ['cm', '#007A5E', '#D7141A', '#FCD116', undefined],
  ['ca', '#FD0001', '#D52A1D', '#FFFFFF', undefined],
  ['cl', '#D52B1E', '#0039A6', '#0039A6', '#FFFFFF'],
  ['co', '#FCDE00', '#0570E5', '#FF0000', undefined],
  ['cr', '#CE1126', '#002B7F', '#002B7F', '#111111'],
  ['hr', '#DA0C12', '#FFFFFF', '#0303D2', undefined],
  ['cz', '#D7141A', '#11457E', '#FFFFFF', '#11457E'],
  ['dk', '#C60C30', '#FFFFFF', '#FFFFFF', undefined],
  ['ec', '#FFFC00', '#034EA2', '#FFFFFF', '#253167'],
  ['eg', '#CE1126', '#000000', '#000000', '#111111'],
  ['eng', '#FFFFFF', '#1C2C5B', '#1C2C5B', undefined],
  ['fr', '#002654', '#FFFFFF', '#FFFFFF', undefined],
  ['ge', '#FFFFFF', '#E30A17', '#E30A17', undefined],
  ['de', '#FFFFFF', '#111111', '#111111', undefined],
  ['gr', '#0D5EAF', '#FFFFFF', '#0D5EAF', undefined],
  ['hu', '#CE2939', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ir', '#FFFFFF', '#239F40', '#239F40', undefined],
  ['iq', '#017B3D', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ie', '#169B62', '#FFFFFF', '#FFFFFF', undefined],
  ['it', '#0066CC', '#FFFFFF', '#FFFFFF', undefined],
  ['ci', '#F77F00', '#009E60', '#009E60', '#FFFFFF'],
  ['jm', '#FFD100', '#000000', '#000000', undefined],
  ['jp', '#003478', '#FFFFFF', '#FFFFFF', undefined],
  ['kz', '#00AFCA', '#FEC50C', '#FEC50C', '#FFFFFF'],
  ['ml', '#FCD116', '#14B53A', '#14B53A', '#FFFFFF'],
  ['mx', '#006847', '#FFFFFF', '#FFFFFF', undefined],
  ['ma', '#C1272D', '#006233', '#FFFFFF', undefined],
  ['nl', '#FF6000', '#FFFFFF', '#FFFFFF', undefined],
  ['ng', '#008753', '#FFFFFF', '#000000', '#FFFFFF'],
  ['nir', '#006A3A', '#FFFFFF', '#FFFFFF', undefined],
  ['no', '#BA0C2F', '#FFFFFF', '#FFFFFF', undefined],
  ['pa', '#DA121A', '#FFFFFF', '#FFFFFF', '#111111'],
  ['py', '#DA121A', '#003893', '#003893', '#FFFFFF'],
  ['pe', '#FFFFFF', '#D91023', '#D91023', '#FFFFFF'],
  ['pl', '#FFFFFF', '#DC143C', '#DC143C', undefined],
  ['pt', '#E00302', '#1F8F20', '#F8C900', undefined],
  ['qa', '#8A1538', '#FFFFFF', '#FFFFFF', '#111111'],
  ['ro', '#FCD116', '#002B7F', '#002B7F', '#FFFFFF'],
  ['sa', '#006C35', '#FFFFFF', '#FFFFFF', '#111111'],
  ['sct', '#003876', '#FFFFFF', '#FFFFFF', undefined],
  ['sn', '#FFFFFF', '#00853F', '#00853F', '#FFFFFF'],
  ['rs', '#C6363C', '#0C4076', '#0C4076', undefined],
  ['sk', '#0052B4', '#FFFFFF', '#FFFFFF', undefined],
  ['si', '#1D5C4A', '#FFFFFF', '#FFFFFF', '#1D5C4A'],
  ['za', '#FFB81C', '#007749', '#007749', '#FFFFFF'],
  ['kr', '#E61414', '#122EA8', '#122EA8', '#FFFFFF'],
  ['es', '#FF0100', '#07088E', '#FAC803', undefined],
  ['se', '#FFF605', '#0146DC', '#0146DC', undefined],
  ['ch', '#D52B1E', '#FFFFFF', '#FFFFFF', undefined],
  ['tn', '#FFFFFF', '#E70013', '#E70013', '#FFFFFF'],
  ['tr', '#FF0100', '#FF0100', '#FF0100', undefined],
  ['ua', '#FFDF0D', '#FFDF0D', '#0056B6', undefined],
  ['uy', '#7BADD3', '#000000', '#000000', '#FFFFFF'],
  ['us', '#FFFFFF', '#002868', '#002868', undefined],
  ['uz', '#FFFFFF', '#0099B5', '#FFFFFF', undefined],
  ['ve', '#8A1538', '#F4C430', '#F4C430', '#111111'],
  ['wls', '#C8102E', '#FFFFFF', '#FFFFFF', undefined]
] as const satisfies readonly (readonly [string, string, string, string, string?])[];

export const TEAM_KIT_STYLES: readonly TeamKitStyle[] = TEAM_KIT_STYLE_ROWS.map(
  ([flagCode, primaryColor, secondaryColor, shirtNumberColor, shirtNumberStrokeColor]) => ({
    flagCode,
    assetKey: `kit-${flagCode}`,
    path: `kits/images/${flagCode}1.webp`,
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

    shirtNumberColor: '#3A3A3A',
    shirtNumberStrokeColor: '#111111'
  },
  {
    id: 'gk2',
    assetKey: 'kit-gk2',
    path: 'kits/images/gk2.webp',

    primaryColor: '#FFB81C',
    secondaryColor: '#111111',

    shirtNumberColor: '#111111',
    shirtNumberStrokeColor: '#111111'
  }
] as const;

export const FALLBACK_TEAM_KIT_ASSET = {
  assetKey: 'kit-none',
  path: 'kits/images/none.webp'
} as const;

export const AVAILABLE_MANUAL_KIT_FLAG_CODES = new Set<string>(
  GENERATED_AVAILABLE_MANUAL_KIT_FLAG_CODES
);

export const AVAILABLE_AWAY_KIT_FLAG_CODES = new Set<string>(GENERATED_AVAILABLE_AWAY_KIT_FLAG_CODES);

export const AVAILABLE_GOALKEEPER_KIT_IDS = new Set<GoalkeeperKitId>(['gk1', 'gk2']);

const TEAM_KIT_STYLES_BY_FLAG_CODE: ReadonlyMap<string, TeamKitStyle> = new Map(
  TEAM_KIT_STYLES.map((style) => [style.flagCode, style])
);

const GOALKEEPER_KIT_STYLES_BY_ID: ReadonlyMap<GoalkeeperKitId, GoalkeeperKitStyle> = new Map(
  GOALKEEPER_KIT_STYLES.map((style) => [style.id, style])
);

export type AwayKitMetadata = {
  primaryColor?: string;
  secondaryColor?: string;
  shirtNumberColor?: string;
  shirtNumberStrokeColor?: string | null;
};

// AWAY colors from National Football Teams, Teams!A3:K34.
// Add entries by flagCode; image availability is generated independently by sync:kits.
export const AWAY_KIT_METADATA: Record<string, AwayKitMetadata> = {
  'ar': {
    primaryColor: '#173E69',
    secondaryColor: '#FFFFFF',
    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: undefined
  },
  'be': {
    primaryColor: '#0f0f0f',
    secondaryColor: '#f40b0d',
    shirtNumberColor: '#ffd700',
    shirtNumberStrokeColor: undefined
  },
  'br': {
    primaryColor: '#003CB1',
    secondaryColor: '#FFFFFF',
    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: undefined
  },
  'cm': {
    primaryColor: '#D7141A',
    secondaryColor: '#007A5E',
    shirtNumberColor: '#FCD116',
    shirtNumberStrokeColor: undefined
  },
  'co': {
    primaryColor: '#003893',
    secondaryColor: '#FCD116',
    shirtNumberColor: '#FCD116',
    shirtNumberStrokeColor: undefined
  },
  'hr': {
    primaryColor: '#0303D2',
    secondaryColor: '#0303D2',
    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: '#DA0C12'
  },
  'cz': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#11457E',
    shirtNumberColor: '#D7141A',
    shirtNumberStrokeColor: undefined
  },
  'dk': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#C60C30',
    shirtNumberColor: '#C60C30',
    shirtNumberStrokeColor: undefined
  },
  'eng': {
    primaryColor: '#C8102E',
    secondaryColor: '#FFFFFF',
    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: undefined
  },
  'fr': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#002395',
    shirtNumberColor: '#002395',
    shirtNumberStrokeColor: undefined
  },
  'ge': {
    primaryColor: '#E30A17',
    secondaryColor: '#FFFFFF',
    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: undefined
  },
  'de': {
    primaryColor: '#006400',
    secondaryColor: '#FFFFFF',
    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: undefined
  },
  'it': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#0066CC',
    shirtNumberColor: '#0066CC',
    shirtNumberStrokeColor: undefined
  },
  'jm': {
    primaryColor: '#009B3A',
    secondaryColor: '#009B3A',
    shirtNumberColor: '#FFD100',
    shirtNumberStrokeColor: undefined
  },
  'jp': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#003478',
    shirtNumberColor: '#003478',
    shirtNumberStrokeColor: undefined
  },
  'mx': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#006847',
    shirtNumberColor: '#EC0F3D',
    shirtNumberStrokeColor: undefined
  },
  'ma': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#006233',
    shirtNumberColor: '#006233',
    shirtNumberStrokeColor: undefined
  },
  'nl': {
    primaryColor: '#001E62',
    secondaryColor: '#001E62',
    shirtNumberColor: '#FF6000',
    shirtNumberStrokeColor: undefined
  },
  'ng': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#008751',
    shirtNumberColor: '#000000',
    shirtNumberStrokeColor: undefined
  },
  'no': {
    primaryColor: '#000000',
    secondaryColor: '#000000',
    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: undefined
  },
  'py': {
    primaryColor: '#003893',
    secondaryColor: '#003893',
    shirtNumberColor: '#D52B1E',
    shirtNumberStrokeColor: '#FFFFFF'
  },
  'pl': {
    primaryColor: '#DC143C',
    secondaryColor: '#FFFFFF',
    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: undefined
  },
  'pt': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#1F8F20',
    shirtNumberColor: '#E00302',
    shirtNumberStrokeColor: undefined
  },
  'ca': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#C9C9C9',
    shirtNumberColor: '#D52A1D',
    shirtNumberStrokeColor: undefined
  },
  'kr': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#122EA8',
    shirtNumberColor: '#E61414',
    shirtNumberStrokeColor: undefined
  },
  'es': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#74041C',
    shirtNumberColor: '#74041C',
    shirtNumberStrokeColor: undefined
  },
  'se': {
    primaryColor: '#0146DC',
    secondaryColor: '#FFF605',
    shirtNumberColor: '#FFF605',
    shirtNumberStrokeColor: undefined
  },
  'tr': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: undefined
  },
  'ua': {
    primaryColor: '#0056B6',
    secondaryColor: '#FFDF0D',
    shirtNumberColor: '#FFDF0D',
    shirtNumberStrokeColor: undefined
  },
  'uy': {
    primaryColor: '#FFFFFF',
    secondaryColor: '#FFFFFF',
    shirtNumberColor: '#000000',
    shirtNumberStrokeColor: '#7BADD3'
  },
  'us': {
    primaryColor: '#000000',
    secondaryColor: '#000000',
    shirtNumberColor: '#FFFFFF',
    shirtNumberStrokeColor: '#C8102E'
  },
  'uz': {
    primaryColor: '#0099B5',
    secondaryColor: '#FFFFFF',
    shirtNumberColor: '#0099B5',
    shirtNumberStrokeColor: undefined
  }
};

export type FieldKitStyle = Omit<TeamKitStyle, 'primaryColor' | 'secondaryColor'> & {
  primaryColor?: string;
  secondaryColor?: string;
};

export function getTeamKitStyle(flagCode: string): TeamKitStyle | undefined;
export function getTeamKitStyle(flagCode: string, variant: FieldKitVariant): FieldKitStyle | undefined;
export function getTeamKitStyle(flagCode: string, variant: FieldKitVariant = 'home'): FieldKitStyle | undefined {
  const home = TEAM_KIT_STYLES_BY_FLAG_CODE.get(flagCode);
  if (home === undefined || variant === 'home') return home;
  const metadata = AWAY_KIT_METADATA[flagCode] ?? {};
  return {
    flagCode,
    assetKey: `kit-${flagCode}-away`,
    path: `kits/images/${flagCode}2.webp`,
    primaryColor: metadata.primaryColor,
    secondaryColor: metadata.secondaryColor,
    shirtNumberColor: metadata.shirtNumberColor ?? home.shirtNumberColor,
    // Explicit undefined/null clears the outline; only an absent field uses compatibility fallback.
    shirtNumberStrokeColor: Object.prototype.hasOwnProperty.call(metadata, 'shirtNumberStrokeColor')
      ? metadata.shirtNumberStrokeColor ?? undefined : home.shirtNumberStrokeColor
  };
}

export function getGoalkeeperKitStyle(id: GoalkeeperKitId): GoalkeeperKitStyle | undefined {
  return GOALKEEPER_KIT_STYLES_BY_ID.get(id);
}

export function hasManualTeamKit(flagCode: string, variant: FieldKitVariant = 'home'): boolean {
  return variant === 'home' ? AVAILABLE_MANUAL_KIT_FLAG_CODES.has(flagCode) : AVAILABLE_AWAY_KIT_FLAG_CODES.has(flagCode);
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

  if (TEAM_KIT_STYLES.length !== 66) {
    errors.push(`TEAM_KIT_STYLES must contain 66 entries, got ${TEAM_KIT_STYLES.length}.`);
  }

  if (NATIONAL_TEAMS.length !== 66) {
    errors.push(`NATIONAL_TEAMS must contain 66 entries, got ${NATIONAL_TEAMS.length}.`);
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
  pushDuplicateErrors(errors, nationalFlagCodes, 'national team flagCode');
  pushDuplicateErrors(errors, TEAM_KIT_STYLES.map((style) => style.assetKey), 'team assetKey');
  pushDuplicateErrors(errors, TEAM_KIT_STYLES.map((style) => style.path), 'team path');
  pushDuplicateErrors(errors, GOALKEEPER_KIT_STYLES.map((style) => style.assetKey), 'goalkeeper assetKey');
  pushDuplicateErrors(errors, GOALKEEPER_KIT_STYLES.map((style) => style.path), 'goalkeeper path');

  for (const flagCode of [...AVAILABLE_MANUAL_KIT_FLAG_CODES, ...AVAILABLE_AWAY_KIT_FLAG_CODES]) {
    if (!nationalFlagCodeSet.has(flagCode) || normalizeFlagCode(flagCode) !== flagCode) {
      errors.push(`Asset registry flagCode "${flagCode}" must be a canonical national team code.`);
    }
  }

  for (const style of TEAM_KIT_STYLES) {
    if (normalizeFlagCode(style.flagCode) !== style.flagCode) errors.push(`Legacy HOME flagCode "${style.flagCode}".`);
    validateKitStyleShape(errors, style, `team "${style.flagCode}"`);
    if (style.path !== `kits/images/${style.flagCode}1.webp`) {
      errors.push(`team "${style.flagCode}" HOME path must be kits/images/${style.flagCode}1.webp.`);
    }
    if (getTeamKitStyle(style.flagCode, 'away')?.path !== `kits/images/${style.flagCode}2.webp`) {
      errors.push(`team "${style.flagCode}" AWAY path must be kits/images/${style.flagCode}2.webp.`);
    }
  }

  for (const [flagCode, metadata] of Object.entries(AWAY_KIT_METADATA)) {
    if (normalizeFlagCode(flagCode) !== flagCode) errors.push(`Legacy AWAY metadata flagCode "${flagCode}".`);
    if (!nationalFlagCodeSet.has(flagCode)) errors.push(`Unknown AWAY metadata flagCode "${flagCode}".`);
    for (const [field, color] of Object.entries(metadata)) {
      if (color === undefined || (field === 'shirtNumberStrokeColor' && color === null)) continue;
      if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) {
        errors.push(`AWAY "${flagCode}" ${field} must be #RRGGBB, got "${color}".`);
      }
    }
  }

  for (const style of GOALKEEPER_KIT_STYLES) {
    validateKitStyleShape(errors, style, `goalkeeper "${style.id}"`);
    if (style.accentColor !== undefined && !isHexColor(style.accentColor)) {
      errors.push(`goalkeeper "${style.id}" accentColor must be #RRGGBB, got "${style.accentColor}".`);
    }
    if (style.path !== `kits/images/${style.id}.webp`) {
      errors.push(`goalkeeper "${style.id}" path must be kits/images/${style.id}.webp.`);
    }
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
    shirtNumberStrokeColor?: string;
  },
  label: string
): void {
  for (const [field, value] of [
    ['primaryColor', style.primaryColor],
    ['secondaryColor', style.secondaryColor],
    ['shirtNumberColor', style.shirtNumberColor]
  ] as const) {
    if (!isHexColor(value)) {
      errors.push(`${label} ${field} must be #RRGGBB, got "${value}".`);
    }
  }

  if (style.shirtNumberStrokeColor !== undefined && !isHexColor(style.shirtNumberStrokeColor)) {
    errors.push(
      `${label} shirtNumberStrokeColor must be #RRGGBB, got "${style.shirtNumberStrokeColor}".`
    );
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

// Shared field variants and asset-loading helpers.
export type FieldKitVariant = 'home' | 'away';

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

export const GOALKEEPER_KIT_IDS: readonly GoalkeeperKitId[] = ['gk1', 'gk2'];

export const DEFAULT_FIELD_KIT: FieldKitVariant = 'home';

export function getTeamKitAssetKey(flagCode: string, variant: FieldKitVariant = DEFAULT_FIELD_KIT): string {
  if (variant === 'away' && hasManualTeamKit(flagCode, variant)) {
    return getTeamKitStyle(flagCode, variant)?.assetKey ?? FALLBACK_TEAM_KIT_ASSET.assetKey;
  }
  if (!hasManualTeamKit(flagCode)) {
    return FALLBACK_TEAM_KIT_ASSET.assetKey;
  }

  return getTeamKitStyle(flagCode)?.assetKey ?? FALLBACK_TEAM_KIT_ASSET.assetKey;
}

export function getTeamKitAssetPath(flagCode: string, variant: FieldKitVariant = DEFAULT_FIELD_KIT): string {
  if (variant === 'away' && hasManualTeamKit(flagCode, variant)) {
    return getTeamKitStyle(flagCode, variant)?.path ?? FALLBACK_TEAM_KIT_ASSET.path;
  }
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
  return FIELD_KIT_VARIANTS.flatMap((variant) => {
    const style = getTeamKitStyle(flagCode, variant);
    return style === undefined || !hasManualTeamKit(flagCode, variant) ? [] : [{
      kind: 'field' as const, textureKey: style.assetKey, path: style.path
    }];
  });
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
    ...[...new Set([...AVAILABLE_MANUAL_KIT_FLAG_CODES, ...AVAILABLE_AWAY_KIT_FLAG_CODES])].flatMap((flagCode) => getTeamKitAssetDescriptors(flagCode)),
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

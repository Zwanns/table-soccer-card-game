import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  AVAILABLE_MANUAL_KIT_FLAG_CODES,
  GOALKEEPER_KIT_STYLES,
  KIT_IMAGE_SIZE,
  TEAM_KIT_STYLES,
  type GoalkeeperKitId,
  type GoalkeeperKitStyle,
  type TeamKitStyle
} from '../src/data/teamKits';

export type KitAttributionEntry = {
  sourcePage?: string;
  sourceFilePage?: string;
  source?: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
  modified?: boolean;
  modificationNotes?: string;
};

export type KitAttribution = Record<string, KitAttributionEntry>;

export type ValidateKitsOptions = {
  projectRoot?: string;
  attribution?: KitAttribution;
  teamKitStyles?: readonly TeamKitStyle[];
  goalkeeperKitStyles?: readonly GoalkeeperKitStyle[];
  manualKitFlagCodes?: Iterable<string>;
  goalkeeperKitIds?: Iterable<GoalkeeperKitId>;
};

export type ValidateKitsResult = {
  errors: string[];
  warnings: string[];
};

type RegisteredKit = {
  label: string;
  assetKey: string;
  path: string;
};

type ImageMetadata = {
  format?: string;
  width?: number;
  height?: number;
};

const MANDATORY_KITS: readonly RegisteredKit[] = [
  {
    label: 'fallback kit none',
    assetKey: 'kit-none',
    path: 'kits/images/none.webp'
  },
  {
    label: 'goalkeeper kit gk1',
    assetKey: 'kit-gk1',
    path: 'kits/images/gk1.webp'
  },
  {
    label: 'goalkeeper kit gk2',
    assetKey: 'kit-gk2',
    path: 'kits/images/gk2.webp'
  }
];

export async function validateRegisteredKits(options: ValidateKitsOptions = {}): Promise<ValidateKitsResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const registeredKits = collectRegisteredKits(options);
  const errors: string[] = [];
  const warnings: string[] = [];

  pushDuplicateErrors(errors, registeredKits.map((kit) => kit.assetKey), 'assetKey');
  pushDuplicateErrors(errors, registeredKits.map((kit) => kit.path), 'path');

  for (const kit of registeredKits) {
    validateKitPath(errors, kit);

    const filePath = join(projectRoot, 'public', kit.path);

    if (!existsSync(filePath)) {
      errors.push(`${kit.label}: file does not exist at public/${kit.path}.`);
      continue;
    }

    if (!hasWebpSignature(filePath)) {
      errors.push(`${kit.label}: file is not a WebP.`);
      continue;
    }

    const metadata = await readImageMetadata(filePath, errors, kit.label);

    if (metadata === null) {
      continue;
    }

    if (metadata.format !== 'webp') {
      errors.push(`${kit.label}: image format must be WebP, got ${metadata.format ?? 'unknown'}.`);
    }

    if (metadata.width !== KIT_IMAGE_SIZE.width || metadata.height !== KIT_IMAGE_SIZE.height) {
      errors.push(
        `${kit.label}: image size must be ${KIT_IMAGE_SIZE.width}x${KIT_IMAGE_SIZE.height}, got ${
          metadata.width ?? 'unknown'
        }x${metadata.height ?? 'unknown'}.`
      );
    }
  }

  return { errors, warnings };
}

function collectRegisteredKits(options: ValidateKitsOptions): RegisteredKit[] {
  const teamStyles = options.teamKitStyles ?? TEAM_KIT_STYLES;
  const goalkeeperStyles = options.goalkeeperKitStyles ?? GOALKEEPER_KIT_STYLES;
  const manualKitFlagCodes = [...(options.manualKitFlagCodes ?? AVAILABLE_MANUAL_KIT_FLAG_CODES)];
  const goalkeeperKitIds = [...(options.goalkeeperKitIds ?? [])];
  const registeredKits: RegisteredKit[] = [...MANDATORY_KITS];

  for (const flagCode of manualKitFlagCodes) {
    const style = teamStyles.find((candidate) => candidate.flagCode === flagCode);

    if (style !== undefined) {
      registeredKits.push({
        label: `team kit ${flagCode}`,
        assetKey: style.assetKey,
        path: style.path
      });
    }
  }

  for (const id of goalkeeperKitIds) {
    const style = goalkeeperStyles.find((candidate) => candidate.id === id);

    if (style !== undefined) {
      registeredKits.push({
        label: `goalkeeper kit ${id}`,
        assetKey: style.assetKey,
        path: style.path
      });
    }
  }

  return registeredKits;
}

async function readImageMetadata(
  filePath: string,
  errors: string[],
  label: string
): Promise<ImageMetadata | null> {
  try {
    return await sharp(filePath).metadata();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${label}: image is not readable (${message}).`);
    return null;
  }
}

function hasWebpSignature(filePath: string): boolean {
  const signature = readFileSync(filePath);

  return (
    signature.length >= 12 &&
    signature.subarray(0, 4).toString('ascii') === 'RIFF' &&
    signature.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

function validateKitPath(errors: string[], kit: RegisteredKit): void {
  if (!kit.path.startsWith('kits/images/')) {
    errors.push(`${kit.label}: path must start with kits/images/, got "${kit.path}".`);
  }

  if (!kit.path.endsWith('.webp')) {
    errors.push(`${kit.label}: path must end with .webp, got "${kit.path}".`);
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

async function runCli(): Promise<void> {
  const result = await validateRegisteredKits();

  for (const warning of result.warnings) {
    console.warn(`WARNING: ${warning}`);
  }

  for (const error of result.errors) {
    console.error(`ERROR: ${error}`);
  }

  if (result.errors.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`Kit validation passed with ${result.warnings.length} warning(s).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  AVAILABLE_GOALKEEPER_KIT_IDS,
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
  attributionKey: string;
};

type PngMetadata = {
  format?: string;
  width?: number;
  height?: number;
  hasAlpha?: boolean;
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export async function validateRegisteredKits(options: ValidateKitsOptions = {}): Promise<ValidateKitsResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const attribution = options.attribution ?? readAttribution(projectRoot);
  const registeredKits = collectRegisteredKits(options);
  const errors: string[] = [];
  const warnings: string[] = [];

  pushDuplicateErrors(errors, registeredKits.map((kit) => kit.assetKey), 'assetKey');
  pushDuplicateErrors(errors, registeredKits.map((kit) => kit.path), 'path');

  for (const kit of registeredKits) {
    const filePath = join(projectRoot, 'public', kit.path);

    if (!existsSync(filePath)) {
      errors.push(`${kit.label}: file does not exist at public/${kit.path}.`);
      continue;
    }

    if (!hasPngSignature(filePath)) {
      errors.push(`${kit.label}: file is not a PNG.`);
      continue;
    }

    const metadata = await readPngMetadata(filePath, errors, kit.label);

    if (metadata === null) {
      continue;
    }

    if (metadata.format !== 'png') {
      errors.push(`${kit.label}: image format must be PNG, got ${metadata.format ?? 'unknown'}.`);
    }

    if (metadata.width !== KIT_IMAGE_SIZE.width || metadata.height !== KIT_IMAGE_SIZE.height) {
      errors.push(
        `${kit.label}: image size must be ${KIT_IMAGE_SIZE.width}x${KIT_IMAGE_SIZE.height}, got ${
          metadata.width ?? 'unknown'
        }x${metadata.height ?? 'unknown'}.`
      );
    }

    if (await isOpaquePng(filePath, metadata.hasAlpha)) {
      warnings.push(`${kit.label}: Opaque PNG accepted because card face background is white.`);
    }

    const attributionEntry = attribution[kit.attributionKey];

    if (attributionEntry === undefined) {
      errors.push(`${kit.label}: missing attribution entry "${kit.attributionKey}".`);
      continue;
    }

    if ((attributionEntry.license ?? '').trim().length === 0) {
      warnings.push(`${kit.label}: attribution license is empty.`);
    }
  }

  return { errors, warnings };
}

function collectRegisteredKits(options: ValidateKitsOptions): RegisteredKit[] {
  const teamStyles = options.teamKitStyles ?? TEAM_KIT_STYLES;
  const goalkeeperStyles = options.goalkeeperKitStyles ?? GOALKEEPER_KIT_STYLES;
  const manualKitFlagCodes = [...(options.manualKitFlagCodes ?? AVAILABLE_MANUAL_KIT_FLAG_CODES)];
  const goalkeeperKitIds = [...(options.goalkeeperKitIds ?? AVAILABLE_GOALKEEPER_KIT_IDS)];
  const registeredKits: RegisteredKit[] = [];

  for (const flagCode of manualKitFlagCodes) {
    const style = teamStyles.find((candidate) => candidate.flagCode === flagCode);

    if (style !== undefined) {
      registeredKits.push({
        label: `team kit ${flagCode}`,
        assetKey: style.assetKey,
        path: style.path,
        attributionKey: style.path.replace(/^kits\//, '')
      });
    }
  }

  for (const id of goalkeeperKitIds) {
    const style = goalkeeperStyles.find((candidate) => candidate.id === id);

    if (style !== undefined) {
      registeredKits.push({
        label: `goalkeeper kit ${id}`,
        assetKey: style.assetKey,
        path: style.path,
        attributionKey: style.path.replace(/^kits\//, '')
      });
    }
  }

  return registeredKits;
}

function readAttribution(projectRoot: string): KitAttribution {
  const attributionPath = join(projectRoot, 'public', 'kits', 'ATTRIBUTION.json');

  if (!existsSync(attributionPath)) {
    return {};
  }

  return JSON.parse(readFileSync(attributionPath, 'utf8')) as KitAttribution;
}

async function readPngMetadata(
  filePath: string,
  errors: string[],
  label: string
): Promise<PngMetadata | null> {
  try {
    return await sharp(filePath).metadata();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${label}: image is not readable (${message}).`);
    return null;
  }
}

async function isOpaquePng(filePath: string, hasAlpha: boolean | undefined): Promise<boolean> {
  if (hasAlpha !== true) {
    return true;
  }

  const stats = await sharp(filePath).ensureAlpha().stats();
  const alpha = stats.channels[3];

  return alpha !== undefined && alpha.min === 255 && alpha.max === 255;
}

function hasPngSignature(filePath: string): boolean {
  const signature = readFileSync(filePath);

  return signature.length >= PNG_SIGNATURE.length && signature.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
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

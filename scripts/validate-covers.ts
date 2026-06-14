import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { AVAILABLE_TEAM_COVER_FLAG_CODES, getFallbackCoverPath, getTeamCoverPath } from '../src/assets/teamCover';
import { NATIONAL_TEAMS } from '../src/data/nationalTeams';

export type ValidateCoversOptions = {
  projectRoot?: string;
  coverFlagCodes?: Iterable<string>;
};

export type ValidateCoversResult = {
  errors: string[];
  warnings: string[];
};

type RegisteredCover = {
  label: string;
  path: string;
};

type ImageMetadata = {
  format?: string;
};

const RESERVED_COVER_BASENAMES = new Set(['none']);

export async function validateRegisteredCovers(options: ValidateCoversOptions = {}): Promise<ValidateCoversResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const coverFlagCodes = [...(options.coverFlagCodes ?? AVAILABLE_TEAM_COVER_FLAG_CODES)];
  const errors: string[] = [];
  const warnings: string[] = [];
  const registeredCovers = collectRegisteredCovers(coverFlagCodes, errors);

  pushDuplicateErrors(errors, registeredCovers.map((cover) => cover.path), 'cover path');
  validateCoverRegistry(projectRoot, coverFlagCodes, errors);

  for (const cover of registeredCovers) {
    validateCoverPath(errors, cover);

    const filePath = join(projectRoot, 'public', cover.path);

    if (!existsSync(filePath)) {
      errors.push(`${cover.label}: file does not exist at public/${cover.path}.`);
      continue;
    }

    if (!hasWebpSignature(filePath)) {
      errors.push(`${cover.label}: file is not a WebP.`);
      continue;
    }

    const metadata = await readImageMetadata(filePath, errors, cover.label);

    if (metadata === null) {
      continue;
    }

    if (metadata.format !== 'webp') {
      errors.push(`${cover.label}: image format must be WebP, got ${metadata.format ?? 'unknown'}.`);
    }
  }

  return { errors, warnings };
}

function collectRegisteredCovers(coverFlagCodes: readonly string[], errors: string[]): RegisteredCover[] {
  const registeredCovers: RegisteredCover[] = [
    {
      label: 'fallback cover none',
      path: getFallbackCoverPath()
    }
  ];

  for (const flagCode of coverFlagCodes) {
    if (RESERVED_COVER_BASENAMES.has(flagCode)) {
      errors.push(`manual team cover "${flagCode}" is reserved for fallback covers.`);
      continue;
    }

    registeredCovers.push({
      label: `team cover ${flagCode}`,
      path: getTeamCoverPath(flagCode)
    });
  }

  return registeredCovers;
}

function validateCoverRegistry(projectRoot: string, coverFlagCodes: readonly string[], errors: string[]): void {
  const nationalFlagCodeSet = new Set(NATIONAL_TEAMS.map((team) => team.flagCode));
  const coverFlagCodeSet = new Set(coverFlagCodes);

  for (const flagCode of coverFlagCodes) {
    if (!nationalFlagCodeSet.has(flagCode)) {
      errors.push(`manual team cover "${flagCode}" must match a national team flagCode.`);
    }
  }

  for (const fileName of listCoverFileNames(projectRoot)) {
    if (!fileName.endsWith('.webp')) {
      continue;
    }

    const flagCode = fileName.slice(0, -'.webp'.length);

    if (RESERVED_COVER_BASENAMES.has(flagCode)) {
      continue;
    }

    if (!nationalFlagCodeSet.has(flagCode)) {
      errors.push(`team cover file public/covers/${fileName} does not match any national team flagCode.`);
      continue;
    }

    if (!coverFlagCodeSet.has(flagCode)) {
      errors.push(
        `team cover file public/covers/${fileName} exists for flagCode "${flagCode}" but is not registered in AVAILABLE_TEAM_COVER_FLAG_CODES.`
      );
    }
  }
}

function listCoverFileNames(projectRoot: string): string[] {
  const coverDir = join(projectRoot, 'public', 'covers');

  if (!existsSync(coverDir)) {
    return [];
  }

  return readdirSync(coverDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

async function readImageMetadata(filePath: string, errors: string[], label: string): Promise<ImageMetadata | null> {
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

function validateCoverPath(errors: string[], cover: RegisteredCover): void {
  if (!cover.path.startsWith('covers/')) {
    errors.push(`${cover.label}: path must start with covers/, got "${cover.path}".`);
  }

  if (!cover.path.endsWith('.webp')) {
    errors.push(`${cover.label}: path must end with .webp, got "${cover.path}".`);
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
  const result = await validateRegisteredCovers();

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

  console.log(`Cover validation passed with ${result.warnings.length} warning(s).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ACTIVE_TEAM_FLAG_CODES } from '../src/data/activeTeams';
import { collectAvailableTeamLogoFlagCodes } from './sync-logo-registry';

export async function validateTeamLogos(options: { projectRoot?: string; activeCodes?: readonly string[] } = {}) {
  const projectRoot = options.projectRoot ?? process.cwd();
  const errors: string[] = [];
  let flagCodes: string[];
  try {
    flagCodes = collectAvailableTeamLogoFlagCodes(projectRoot);
  } catch (error) {
    return { flagCodes: [], errors: [error instanceof Error ? error.message : String(error)] };
  }
  for (const code of options.activeCodes ?? ACTIVE_TEAM_FLAG_CODES) {
    if (!flagCodes.includes(code)) errors.push(`Missing active team logo: public/logos/${code}.webp.`);
  }
  for (const code of flagCodes) {
    try {
      const metadata = await sharp(await readFile(join(projectRoot, 'public', 'logos', `${code}.webp`))).metadata();
      if (metadata.format !== 'webp') errors.push(`Expected WebP logo for "${code}", found ${metadata.format ?? 'unknown'}.`);
      if (metadata.width !== 64 || metadata.height !== 64) {
        errors.push(`Expected 64x64 logo for "${code}", found ${metadata.width}x${metadata.height}.`);
      }
    } catch (error) {
      errors.push(`Cannot read logo "${code}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { flagCodes, errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validateTeamLogos().then(({ flagCodes, errors }) => {
    if (errors.length > 0) {
      console.error(errors.join('\n'));
      process.exitCode = 1;
    } else {
      console.log(`Validated ${flagCodes.length} canonical 64x64 WebP logos; all ${ACTIVE_TEAM_FLAG_CODES.length} active teams covered.`);
    }
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { validateRegisteredCovers } from '../../scripts/validate-covers';
import { getFallbackCoverPath, getTeamCoverPath } from '../assets/teamCover';

const tempRoots: string[] = [];

describe('cover validator', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      try {
        rmSync(root, { force: true, maxRetries: 5, recursive: true, retryDelay: 100 });
      } catch {
        // Windows can keep sharp-created temp files locked briefly after metadata reads.
      }
    }
  });

  it('accepts the current cover contract', async () => {
    await expect(validateRegisteredCovers()).resolves.toEqual({
      errors: [],
      warnings: []
    });
  });

  it('validates registered cover WebP files', async () => {
    const projectRoot = createTempProjectRoot();

    await createCoverWebp(join(projectRoot, 'public', getFallbackCoverPath()));
    await createCoverWebp(join(projectRoot, 'public', getTeamCoverPath('pl')));

    await expect(
      validateRegisteredCovers({
        projectRoot,
        coverFlagCodes: ['pl']
      })
    ).resolves.toEqual({
      errors: [],
      warnings: []
    });
  });

  it('reports missing fallback, missing registered covers, and non-WebP covers', async () => {
    const projectRoot = createTempProjectRoot();

    await createPng(join(projectRoot, 'public', getTeamCoverPath('pl')));

    const result = await validateRegisteredCovers({
      projectRoot,
      coverFlagCodes: ['pl', 'fr']
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        'fallback cover none: file does not exist at public/covers/none.webp.',
        'team cover pl: file is not a WebP.',
        'team cover fr: file does not exist at public/covers/fr.webp.'
      ])
    );
    expect(result.warnings).toEqual([]);
  });

  it('reports cover files that exist but are not registered', async () => {
    const projectRoot = createTempProjectRoot();

    await createCoverWebp(join(projectRoot, 'public', getFallbackCoverPath()));
    await createCoverWebp(join(projectRoot, 'public', getTeamCoverPath('pl')));
    await createCoverWebp(join(projectRoot, 'public', getTeamCoverPath('fr')));

    const result = await validateRegisteredCovers({
      projectRoot,
      coverFlagCodes: ['pl']
    });

    expect(result.errors).toContain(
      'team cover file public/covers/fr.webp exists for flagCode "fr" but is not registered in AVAILABLE_TEAM_COVER_FLAG_CODES.'
    );
    expect(result.warnings).toEqual([]);
  });

  it('rejects reserved and unknown cover codes and files', async () => {
    const projectRoot = createTempProjectRoot();

    await createCoverWebp(join(projectRoot, 'public', getFallbackCoverPath()));
    await createCoverWebp(join(projectRoot, 'public', 'covers', 'missing.webp'));

    const result = await validateRegisteredCovers({
      projectRoot,
      coverFlagCodes: ['none', 'missing']
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        'manual team cover "none" is reserved for fallback covers.',
        'manual team cover "missing" must match a national team flagCode.',
        'team cover file public/covers/missing.webp does not match any national team flagCode.'
      ])
    );
    expect(result.warnings).toEqual([]);
  });

  it('documents the cover runtime registry contract', () => {
    const readme = readFileSync(join(process.cwd(), 'public', 'covers', 'README.md'), 'utf8');

    expect(readme).toContain('public/covers/<flagCode>.webp');
    expect(readme).toContain('AVAILABLE_TEAM_COVER_FLAG_CODES');
    expect(readme).toContain('Do not add `none` to `AVAILABLE_TEAM_COVER_FLAG_CODES`.');
    expect(readme).toContain('npm run validate:covers');
  });

  it('creates the cover filesystem contract', () => {
    expect(existsSync(join(process.cwd(), 'public', 'covers'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'covers', 'none.webp'))).toBe(true);
  });
});

async function createCoverWebp(filePath: string): Promise<void> {
  await sharp({
    create: {
      width: 960,
      height: 1320,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .webp()
    .toFile(filePath);
}

async function createPng(filePath: string): Promise<void> {
  await sharp({
    create: {
      width: 960,
      height: 1320,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .png()
    .toFile(filePath);
}

function createTempProjectRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'cover-validator-'));

  tempRoots.push(root);
  mkdirSync(join(root, 'public', 'covers'), { recursive: true });

  return root;
}

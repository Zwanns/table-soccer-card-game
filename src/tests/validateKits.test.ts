import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { validateRegisteredKits, type KitAttribution } from '../../scripts/validate-kits';
import { getGoalkeeperKitStyle, getTeamKitStyle } from '../data/teamKits';

const tempRoots: string[] = [];

describe('kit validator', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      try {
        rmSync(root, { force: true, maxRetries: 5, recursive: true, retryDelay: 100 });
      } catch {
        // Windows can keep sharp-created temp files locked briefly after metadata reads.
      }
    }
  });

  it('accepts the current WebP kit contract', async () => {
    await expect(validateRegisteredKits()).resolves.toEqual({
      errors: [],
      warnings: []
    });
  });

  it('validates registered WebP files', async () => {
    const projectRoot = createTempProjectRoot();
    const style = getTeamKitStyle('pl');

    expect(style).toBeDefined();
    await createRequiredWebps(projectRoot);
    await createWebp(join(projectRoot, 'public', 'kits', 'images', 'pl.webp'));

    const attribution: KitAttribution = {
      'images/pl.webp': {
        license: 'CC BY-SA 4.0'
      }
    };
    const result = await validateRegisteredKits({
      projectRoot,
      attribution,
      manualKitFlagCodes: ['pl']
    });

    expect(result).toEqual({
      errors: [],
      warnings: []
    });
  });

  it('reports missing mandatory files, wrong size, and non-WebP files', async () => {
    const projectRoot = createTempProjectRoot();

    await createWebp(join(projectRoot, 'public', 'kits', 'images', 'none.webp'));
    await createWebp(join(projectRoot, 'public', 'kits', 'images', 'gk1.webp'), 200, 200);
    await createPng(join(projectRoot, 'public', 'kits', 'images', 'gk2.webp'));

    const result = await validateRegisteredKits({
      projectRoot
    });

    expect(result.errors).toContain('goalkeeper kit gk1: image size must be 130x150, got 200x200.');
    expect(result.errors).toContain('goalkeeper kit gk2: file is not a WebP.');
    expect(result.warnings).toEqual([]);
  });

  it('documents the WebP contract and importer boundary', () => {
    const readme = readFileSync(join(process.cwd(), 'public', 'kits', 'README.md'), 'utf8');

    expect(readme).toContain('public/kits/images/');
    expect(readme).toContain('130 x 150 px');
    expect(readme).toContain('File must be readable as WebP');
    expect(readme).toContain('File path must be inside `kits/images/`');
    expect(readme).toContain('Do not include a player number');
    expect(readme).toContain('Do not include the card rank');
    expect(readme).toContain('Do not include text or labels');
    expect(readme).toContain('Field kit file name must be `<flagCode>.webp`');
    expect(readme).toContain('none.webp');
    expect(readme).toContain('gk1.webp');
    expect(readme).toContain('gk2.webp');
    expect(readme).toContain('SHIRT_NUMBER_ANCHOR');
    expect(readme).toContain('scripts/wiki-kits/');
    expect(readme).toContain('public/kits/imported/');
    expect(readme).toContain('not used by the game runtime');
  });

  it('creates the Stage 2 filesystem contract', () => {
    expect(existsSync(join(process.cwd(), 'public', 'kits', 'images'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'kits', 'ATTRIBUTION.json'))).toBe(true);
    expect(JSON.parse(readFileSync(join(process.cwd(), 'public', 'kits', 'ATTRIBUTION.json'), 'utf8'))).toEqual({});
    expect(existsSync(join(process.cwd(), 'public', 'kits', 'images', 'none.webp'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'kits', 'images', 'gk1.webp'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'kits', 'images', 'gk2.webp'))).toBe(true);
    expect(getGoalkeeperKitStyle('gk1')?.path).toBe('kits/images/gk1.webp');
    expect(getGoalkeeperKitStyle('gk2')?.path).toBe('kits/images/gk2.webp');
  });
});

async function createRequiredWebps(projectRoot: string): Promise<void> {
  await Promise.all([
    createWebp(join(projectRoot, 'public', 'kits', 'images', 'none.webp')),
    createWebp(join(projectRoot, 'public', 'kits', 'images', 'gk1.webp')),
    createWebp(join(projectRoot, 'public', 'kits', 'images', 'gk2.webp'))
  ]);
}

async function createWebp(filePath: string, width = 130, height = 150): Promise<void> {
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    }
  })
    .webp()
    .toFile(filePath);
}

async function createPng(filePath: string): Promise<void> {
  await sharp({
    create: {
      width: 130,
      height: 150,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    }
  })
    .png()
    .toFile(filePath);
}

function createTempProjectRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'kit-validator-'));

  tempRoots.push(root);
  mkdirSync(join(root, 'public', 'kits', 'images'), { recursive: true });

  return root;
}

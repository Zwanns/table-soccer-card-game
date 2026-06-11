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
      rmSync(root, { force: true, recursive: true });
    }
  });

  it('accepts the current empty manual registries', async () => {
    await expect(validateRegisteredKits()).resolves.toEqual({
      errors: [],
      warnings: []
    });
  });

  it('validates registered PNG files and attribution entries', async () => {
    const projectRoot = createTempProjectRoot();
    const style = getTeamKitStyle('pl');

    expect(style).toBeDefined();
    await createPng(join(projectRoot, 'public', 'kits', 'images', 'pl.png'), true);

    const attribution: KitAttribution = {
      'images/pl.png': {
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

  it('reports missing attribution, wrong size, and opaque PNG warnings for registry entries', async () => {
    const projectRoot = createTempProjectRoot();

    await createPng(join(projectRoot, 'public', 'kits', 'images', 'gk-1.png'), false, 200, 200);

    const result = await validateRegisteredKits({
      projectRoot,
      attribution: {},
      goalkeeperKitIds: ['gk-1']
    });

    expect(result.errors).toContain('goalkeeper kit gk-1: image size must be 384x420, got 200x200.');
    expect(result.errors).toContain('goalkeeper kit gk-1: missing attribution entry "images/gk-1.png".');
    expect(result.warnings).toContain('goalkeeper kit gk-1: Opaque PNG accepted because card face background is white.');
  });

  it('documents the manual PNG contract and importer boundary', () => {
    const readme = readFileSync(join(process.cwd(), 'public', 'kits', 'README.md'), 'utf8');

    expect(readme).toContain('public/kits/images/');
    expect(readme).toContain('384 x 420 px');
    expect(readme).toContain('Transparent background is preferred');
    expect(readme).toContain('solid white background is temporarily accepted');
    expect(readme).toContain('Include only the shirt and shorts');
    expect(readme).toContain('Do not include socks');
    expect(readme).toContain('Do not include a player number');
    expect(readme).toContain('Do not include the card rank');
    expect(readme).toContain('Do not include text or labels');
    expect(readme).toContain('File name must be `<flagCode>.png`');
    expect(readme).toContain('gk-1.png');
    expect(readme).toContain('gk-2.png');
    expect(readme).toContain('SHIRT_NUMBER_ANCHOR');
    expect(readme).toContain('scripts/wiki-kits/');
    expect(readme).toContain('public/kits/imported/');
    expect(readme).toContain('not used by the game runtime');
  });

  it('creates the Stage 2 filesystem contract', () => {
    expect(existsSync(join(process.cwd(), 'public', 'kits', 'images'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public', 'kits', 'ATTRIBUTION.json'))).toBe(true);
    expect(JSON.parse(readFileSync(join(process.cwd(), 'public', 'kits', 'ATTRIBUTION.json'), 'utf8'))).toEqual({});
    expect(getGoalkeeperKitStyle('gk-1')?.path).toBe('kits/images/gk-1.png');
    expect(getGoalkeeperKitStyle('gk-2')?.path).toBe('kits/images/gk-2.png');
  });
});

async function createPng(filePath: string, transparent: boolean, width = 384, height = 420): Promise<void> {
  await sharp({
    create: {
      width,
      height,
      channels: transparent ? 4 : 3,
      background: transparent
        ? { r: 255, g: 255, b: 255, alpha: 0 }
        : { r: 255, g: 255, b: 255 }
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

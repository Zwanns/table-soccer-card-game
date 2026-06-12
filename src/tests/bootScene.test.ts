import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AVAILABLE_MANUAL_KIT_FLAG_CODES } from '../data/teamKits';
import { getRegisteredKitAssetsToLoad } from '../scenes/bootKitAssets';

const initialManualKitFlagCodes = new Set(AVAILABLE_MANUAL_KIT_FLAG_CODES);

describe('BootScene kit asset loading', () => {
  beforeEach(() => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.clear();
  });

  afterEach(() => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.clear();

    for (const flagCode of initialManualKitFlagCodes) {
      AVAILABLE_MANUAL_KIT_FLAG_CODES.add(flagCode);
    }
  });

  it('always queues none.webp, gk1.webp, and gk2.webp', () => {
    expect(getRegisteredKitAssetsToLoad()).toEqual([
      {
        assetKey: 'kit-none',
        path: 'kits/images/none.webp'
      },
      {
        assetKey: 'kit-gk1',
        path: 'kits/images/gk1.webp'
      },
      {
        assetKey: 'kit-gk2',
        path: 'kits/images/gk2.webp'
      }
    ]);
  });

  it('queues only registered team kits in addition to mandatory assets', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('pl');
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('ua');

    expect(getRegisteredKitAssetsToLoad()).toEqual([
      {
        assetKey: 'kit-none',
        path: 'kits/images/none.webp'
      },
      {
        assetKey: 'kit-gk1',
        path: 'kits/images/gk1.webp'
      },
      {
        assetKey: 'kit-gk2',
        path: 'kits/images/gk2.webp'
      },
      {
        assetKey: 'kit-pl',
        path: 'kits/images/pl.webp'
      },
      {
        assetKey: 'kit-ua',
        path: 'kits/images/ua.webp'
      }
    ]);
  });

  it('keeps the runtime loader away from PNG kits, imported kits, sharp, filesystem, and network APIs', () => {
    const source = [
      readFileSync(join(process.cwd(), 'src', 'scenes', 'BootScene.ts'), 'utf8'),
      readFileSync(join(process.cwd(), 'src', 'scenes', 'bootKitAssets.ts'), 'utf8')
    ].join('\n');

    expect(source).not.toContain('.png');
    expect(source).not.toContain('public/kits/imported');
    expect(source).not.toContain('kits/imported');
    expect(source).not.toContain('wiki-kits');
    expect(source).not.toContain('Wikipedia');
    expect(source).not.toContain('Commons');
    expect(source).not.toContain("from 'sharp'");
    expect(source).not.toContain('from "sharp"');
    expect(source).not.toContain("require('sharp')");
    expect(source).not.toContain('require("sharp")');
    expect(source).not.toContain("from 'node:fs'");
    expect(source).not.toContain('from "node:fs"');
    expect(source).not.toContain("from 'fs'");
    expect(source).not.toContain('from "fs"');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('XMLHttpRequest');
  });
});

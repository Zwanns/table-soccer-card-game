import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AVAILABLE_GOALKEEPER_KIT_IDS,
  AVAILABLE_MANUAL_KIT_FLAG_CODES
} from '../data/teamKits';
import { getRegisteredKitAssetsToLoad } from '../scenes/bootKitAssets';

const initialManualKitFlagCodes = new Set(AVAILABLE_MANUAL_KIT_FLAG_CODES);
const initialGoalkeeperKitIds = new Set(AVAILABLE_GOALKEEPER_KIT_IDS);

describe('BootScene kit asset loading', () => {
  beforeEach(() => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.clear();
    AVAILABLE_GOALKEEPER_KIT_IDS.clear();
  });

  afterEach(() => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.clear();
    AVAILABLE_GOALKEEPER_KIT_IDS.clear();

    for (const flagCode of initialManualKitFlagCodes) {
      AVAILABLE_MANUAL_KIT_FLAG_CODES.add(flagCode);
    }

    for (const goalkeeperKitId of initialGoalkeeperKitIds) {
      AVAILABLE_GOALKEEPER_KIT_IDS.add(goalkeeperKitId);
    }
  });

  it('does not queue kit assets when registries are empty', () => {
    expect(getRegisteredKitAssetsToLoad()).toEqual([]);
  });

  it('queues only registered team kits', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('pl');
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('ua');

    expect(getRegisteredKitAssetsToLoad()).toEqual([
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

  it('queues only registered goalkeeper kits', () => {
    AVAILABLE_GOALKEEPER_KIT_IDS.add('gk1');
    AVAILABLE_GOALKEEPER_KIT_IDS.add('gk2');

    expect(getRegisteredKitAssetsToLoad()).toEqual([
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

  it('keeps the runtime loader away from imported kits, sharp, filesystem, and network APIs', () => {
    const source = [
      readFileSync(join(process.cwd(), 'src', 'scenes', 'BootScene.ts'), 'utf8'),
      readFileSync(join(process.cwd(), 'src', 'scenes', 'bootKitAssets.ts'), 'utf8')
    ].join('\n');

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

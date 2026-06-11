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
        path: 'kits/images/pl.png'
      },
      {
        assetKey: 'kit-ua',
        path: 'kits/images/ua.png'
      }
    ]);
  });

  it('queues only registered goalkeeper kits', () => {
    AVAILABLE_GOALKEEPER_KIT_IDS.add('gk-1');
    AVAILABLE_GOALKEEPER_KIT_IDS.add('gk-2');

    expect(getRegisteredKitAssetsToLoad()).toEqual([
      {
        assetKey: 'kit-gk-1',
        path: 'kits/images/gk-1.png'
      },
      {
        assetKey: 'kit-gk-2',
        path: 'kits/images/gk-2.png'
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

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AVAILABLE_TEAM_COVER_FLAG_CODES, getTeamCoverPath, getTeamCoverTextureKey } from '../assets/teamCover';
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

  it('queues every current registered manual team kit for preload', () => {
    for (const flagCode of initialManualKitFlagCodes) {
      AVAILABLE_MANUAL_KIT_FLAG_CODES.add(flagCode);
    }

    const queuedAssets = getRegisteredKitAssetsToLoad();

    for (const flagCode of initialManualKitFlagCodes) {
      expect(queuedAssets).toContainEqual({
        assetKey: `kit-${flagCode}`,
        path: `kits/images/${flagCode}.webp`
      });
    }

    expect(initialManualKitFlagCodes.has('none')).toBe(false);
    expect(initialManualKitFlagCodes.has('gk1')).toBe(false);
    expect(initialManualKitFlagCodes.has('gk2')).toBe(false);
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

  it('loads the current menu scoreboard assets without the retired menu logo or decorative ball', () => {
    const bootSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'BootScene.ts'), 'utf8');
    const configSource = readFileSync(join(process.cwd(), 'src', 'config.ts'), 'utf8');
    const source = `${bootSceneSource}\n${configSource}`;

    expect(source).toContain('logoOn');
    expect(source).toContain('logoOff');
    expect(source).toContain('resultDrawBackground');
    expect(source).toContain('resultWinBackground');
    expect(source).toContain('menu/remis-bg.webp');
    expect(source).toContain('menu/gamestat-bg.webp');
    expect(source).toContain('menu/menu-logo1.png');
    expect(source).toContain('menu/menu-logo2.png');
    expect(source).not.toContain('menu/menu-logo.png');
    expect(source).not.toContain('menu/menu-ball.png');
    expect(source).not.toContain('menu-ball');
  });
});

describe('BootScene cover asset loading', () => {
  it('preloads the fallback cover and every registered team cover', () => {
    const bootSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'BootScene.ts'), 'utf8');

    expect(bootSceneSource).toContain('this.load.image(getFallbackCoverTextureKey(), getFallbackCoverPath())');
    expect(bootSceneSource).toContain('for (const flagCode of AVAILABLE_TEAM_COVER_FLAG_CODES)');
    expect(bootSceneSource).toContain('this.load.image(getTeamCoverTextureKey(flagCode), getTeamCoverPath(flagCode))');

    for (const flagCode of AVAILABLE_TEAM_COVER_FLAG_CODES) {
      expect(getTeamCoverTextureKey(flagCode)).toBe(`cover-${flagCode}`);
      expect(getTeamCoverPath(flagCode)).toBe(`covers/${flagCode}.webp`);
    }
  });
});

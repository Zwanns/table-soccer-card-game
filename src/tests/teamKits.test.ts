import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import {
  createTeamKitConfig,
  DEFAULT_FIELD_KIT,
  FIELD_KIT_VARIANTS,
  GOALKEEPER_KIT_IDS,
  getGoalkeeperKitAssetKey,
  getGoalkeeperKitAssetPath,
  getAllKitAssetDescriptors,
  getGoalkeeperKitAssetDescriptors,
  getTeamKitAssetDescriptors,
  getTeamKitAssetKey,
  getTeamKitAssetPath,
  loadAvailableKitTextures,
  TEAM_KIT_CONFIGS,
  type FieldKitVariant,
  type GoalkeeperKitId,
  type MatchTeamKitSelection
} from '../data/teamKits';

describe('team kit configuration', () => {
  it('defines the field kit and goalkeeper kit type contracts', () => {
    expectTypeOf<FieldKitVariant>().toEqualTypeOf<'home' | 'away'>();
    expectTypeOf<GoalkeeperKitId>().toEqualTypeOf<'gk-1' | 'gk-2' | 'gk-3' | 'gk-4'>();
    expectTypeOf<MatchTeamKitSelection>().toEqualTypeOf<{
      fieldKit: FieldKitVariant;
      goalkeeperKitId: GoalkeeperKitId;
    }>();

    expect(FIELD_KIT_VARIANTS).toEqual(['home', 'away']);
    expect(GOALKEEPER_KIT_IDS).toEqual(['gk-1', 'gk-2', 'gk-3', 'gk-4']);
    expect(DEFAULT_FIELD_KIT).toBe('home');
  });

  it('builds stable field kit asset keys and paths', () => {
    expect(getTeamKitAssetKey('pl', 'home')).toBe('kit-team-pl-home');
    expect(getTeamKitAssetKey('gb-eng', 'away')).toBe('kit-team-gb-eng-away');
    expect(getTeamKitAssetPath('pl', 'home')).toBe('kits/teams/pl/home.png');
    expect(getTeamKitAssetPath('gb-eng', 'away')).toBe('kits/teams/gb-eng/away.png');
  });

  it('builds stable goalkeeper kit asset keys and paths', () => {
    expect(getGoalkeeperKitAssetKey('gk-1')).toBe('kit-goalkeeper-gk-1');
    expect(getGoalkeeperKitAssetKey('gk-4')).toBe('kit-goalkeeper-gk-4');
    expect(getGoalkeeperKitAssetPath('gk-1')).toBe('kits/goalkeepers/gk-1.png');
    expect(getGoalkeeperKitAssetPath('gk-4')).toBe('kits/goalkeepers/gk-4.png');
  });

  it('can derive expected kit asset keys for every national team', () => {
    expect(TEAM_KIT_CONFIGS).toHaveLength(NATIONAL_TEAMS.length);

    for (const team of NATIONAL_TEAMS) {
      const config = createTeamKitConfig(team.flagCode);

      expect(config).toEqual({
        teamId: team.flagCode,
        homeAssetKey: `kit-team-${team.flagCode}-home`,
        awayAssetKey: `kit-team-${team.flagCode}-away`
      });
      expect(TEAM_KIT_CONFIGS).toContainEqual(config);
    }
  });

  it('describes every optional kit png that can be loaded', () => {
    expect(getTeamKitAssetDescriptors('fr')).toEqual([
      {
        kind: 'field',
        textureKey: 'kit-team-fr-home',
        path: 'kits/teams/fr/home.png'
      },
      {
        kind: 'field',
        textureKey: 'kit-team-fr-away',
        path: 'kits/teams/fr/away.png'
      }
    ]);
    expect(getGoalkeeperKitAssetDescriptors()).toEqual([
      {
        kind: 'goalkeeper',
        textureKey: 'kit-goalkeeper-gk-1',
        path: 'kits/goalkeepers/gk-1.png'
      },
      {
        kind: 'goalkeeper',
        textureKey: 'kit-goalkeeper-gk-2',
        path: 'kits/goalkeepers/gk-2.png'
      },
      {
        kind: 'goalkeeper',
        textureKey: 'kit-goalkeeper-gk-3',
        path: 'kits/goalkeepers/gk-3.png'
      },
      {
        kind: 'goalkeeper',
        textureKey: 'kit-goalkeeper-gk-4',
        path: 'kits/goalkeepers/gk-4.png'
      }
    ]);
    expect(getAllKitAssetDescriptors()).toHaveLength(NATIONAL_TEAMS.length * 2 + 4);
  });

  it('quietly loads only reachable optional kit textures', async () => {
    const originalFetch = globalThis.fetch;
    const originalImage = globalThis.Image;
    const addedTextureKeys: string[] = [];

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: async (path: string) =>
        ({
          ok: path.endsWith('/home.png'),
          headers: {
            get: (name: string) =>
              name.toLowerCase() === 'content-type' && path.endsWith('/home.png')
                ? 'image/png'
                : 'text/html'
          }
        }) as Response
    });
    Object.defineProperty(globalThis, 'Image', {
      configurable: true,
      value: class {
        public onerror: (() => void) | null = null;
        public onload: (() => void) | null = null;

        public set src(_path: string) {
          setTimeout(() => this.onload?.(), 0);
        }
      }
    });

    try {
      const summary = await loadAvailableKitTextures(
        {
          textures: {
            exists: () => false,
            addImage: (textureKey) => {
              addedTextureKeys.push(textureKey);
            }
          }
        },
        [
          {
            kind: 'field',
            textureKey: 'kit-team-fr-home',
            path: 'kits/teams/fr/home.png'
          },
          {
            kind: 'field',
            textureKey: 'kit-team-fr-away',
            path: 'kits/teams/fr/away.png'
          }
        ],
        { timeoutMs: 50 }
      );

      expect(addedTextureKeys).toEqual(['kit-team-fr-home']);
      expect(summary.loadedTextureKeys).toEqual(['kit-team-fr-home']);
      expect(summary.skippedTextureKeys).toEqual(['kit-team-fr-away']);
    } finally {
      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        value: originalFetch
      });
      Object.defineProperty(globalThis, 'Image', {
        configurable: true,
        value: originalImage
      });
    }
  });

  it('prepares the kit asset folders and documentation', () => {
    const kitsPath = join(process.cwd(), 'public', 'kits');

    expect(existsSync(kitsPath)).toBe(true);
    expect(existsSync(join(kitsPath, 'README.md'))).toBe(true);
    expect(existsSync(join(kitsPath, 'teams'))).toBe(true);
    expect(existsSync(join(kitsPath, 'goalkeepers'))).toBe(true);
  });
});

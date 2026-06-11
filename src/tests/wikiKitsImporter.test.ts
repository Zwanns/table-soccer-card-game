import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveCommonsFile } from '../../scripts/wiki-kits/commonsClient';
import {
  getPatternFileCandidates,
  resolvePatternLayer
} from '../../scripts/wiki-kits/commonsFileResolver';
import { parseWikiKitsCliArgs } from '../../scripts/wiki-kits/cli';
import { createCommonsCacheFileName, downloadCommonsAsset } from '../../scripts/wiki-kits/downloadCache';
import { runWikiKitsImport } from '../../scripts/wiki-kits/index';
import { extractTeamKitImportData, normalizePatternToken } from '../../scripts/wiki-kits/kitParamsExtractor';
import { renderKitPng } from '../../scripts/wiki-kits/kitRenderer';
import { getPreviewCells, WIKI_KITS_PREVIEW_SIZE, writePreview } from '../../scripts/wiki-kits/previewWriter';
import {
  KIT_VARIANTS,
  TEAM_IDS,
  TEST_WIKI_KIT_TEAMS,
  isKitVariant,
  isTeamId,
  normalizeHexColor
} from '../../scripts/wiki-kits/config';
import { KIT_OUTPUT, KIT_RENDER_GEOMETRY, KIT_RESIZE_KERNEL } from '../../scripts/wiki-kits/renderGeometry';
import type {
  CommonsAssetMetadata,
  KitLayerPart,
  KitVariant,
  ResolvedKitAssets,
  TeamId,
  WikipediaKitParams
} from '../../scripts/wiki-kits/types';
import { fetchWikipediaPageWikitext } from '../../scripts/wiki-kits/wikipediaClient';
import { parseFootballTeamTemplateParams } from '../../scripts/wiki-kits/wikitextParser';

describe('wiki kits importer configuration', () => {
  it('defines the three test national teams', () => {
    expect(TEST_WIKI_KIT_TEAMS).toEqual([
      {
        teamId: 'poland',
        wikipediaTitle: 'Сборная Польши по футболу'
      },
      {
        teamId: 'ukraine',
        wikipediaTitle: 'Сборная Украины по футболу'
      },
      {
        teamId: 'brazil',
        wikipediaTitle: 'Сборная Бразилии по футболу'
      }
    ]);
  });

  it('validates supported team ids', () => {
    expect(TEAM_IDS).toEqual(['poland', 'ukraine', 'brazil']);
    expect(isTeamId('poland')).toBe(true);
    expect(isTeamId('ukraine')).toBe(true);
    expect(isTeamId('brazil')).toBe(true);
    expect(isTeamId('france')).toBe(false);
  });

  it('validates kit variants', () => {
    expect(KIT_VARIANTS).toEqual(['home', 'away']);
    expect(isKitVariant('home')).toBe(true);
    expect(isKitVariant('away')).toBe(true);
    expect(isKitVariant('third')).toBe(false);
  });
});

describe('wiki kits color normalization', () => {
  it('normalizes valid 6-digit hex colors', () => {
    expect(normalizeHexColor('ffffff')).toBe('FFFFFF');
    expect(normalizeHexColor('#00aa44')).toBe('00AA44');
    expect(normalizeHexColor('  123abc  ')).toBe('123ABC');
  });

  it('rejects invalid colors instead of silently falling back', () => {
    expect(() => normalizeHexColor('FFF')).toThrow('Invalid hex color');
    expect(() => normalizeHexColor('#GGGGGG')).toThrow('Invalid hex color');
    expect(() => normalizeHexColor('1234567')).toThrow('Invalid hex color');
    expect(() => normalizeHexColor('')).toThrow('Invalid hex color');
  });
});

describe('wiki kits render geometry', () => {
  it('defines the requested transparent canvas size', () => {
    expect(KIT_OUTPUT).toEqual({
      width: 384,
      height: 420
    });
    expect(KIT_RENDER_GEOMETRY.canvas).toBe(KIT_OUTPUT);
  });

  it('keeps every rendered part inside the canvas', () => {
    const parts = [
      KIT_RENDER_GEOMETRY.leftArm,
      KIT_RENDER_GEOMETRY.body,
      KIT_RENDER_GEOMETRY.rightArm,
      KIT_RENDER_GEOMETRY.shorts
    ];

    parts.forEach((part) => {
      expect(part.x).toBeGreaterThanOrEqual(0);
      expect(part.y).toBeGreaterThanOrEqual(0);
      expect(part.width).toBeGreaterThan(0);
      expect(part.height).toBeGreaterThan(0);
      expect(part.x + part.width).toBeLessThanOrEqual(KIT_OUTPUT.width);
      expect(part.y + part.height).toBeLessThanOrEqual(KIT_OUTPUT.height);
    });
  });

  it('reserves the upper area for shirt parts and lower area for shorts', () => {
    expect(KIT_RENDER_GEOMETRY.body.y + KIT_RENDER_GEOMETRY.body.height).toBeLessThan(
      KIT_RENDER_GEOMETRY.shorts.y + KIT_RENDER_GEOMETRY.shorts.height
    );
    expect(KIT_RENDER_GEOMETRY.shorts.y).toBeGreaterThan(KIT_OUTPUT.height * 0.5);
    expect(KIT_RESIZE_KERNEL).toBe('nearest');
  });
});

describe('wiki kits wikitext parser', () => {
  it('extracts home and away kit params from Poland fixture with line-separated params', () => {
    const data = extractTeamKitImportData(
      'poland',
      'Сборная Польши по футболу',
      readWikiKitFixture('poland')
    );

    expect(data.home).toMatchObject({
      patternLeftArm: 'pol24h',
      patternBody: 'pol24h',
      patternRightArm: 'pol24h',
      patternShorts: 'pol24h',
      leftArmColor: 'FFFFFF',
      bodyColor: 'FFFFFF',
      rightArmColor: 'FFFFFF',
      shortsColor: 'F40018',
      ignoredSocksColor: 'FFFFFF'
    });
    expect(data.home.ignoredSocksPattern).toBeUndefined();
    expect(data.away).toMatchObject({
      patternLeftArm: 'pol24a',
      patternBody: 'pol24a',
      patternRightArm: 'pol24a',
      patternShorts: 'pol24a',
      leftArmColor: 'F40018',
      bodyColor: 'F40018',
      rightArmColor: 'F40018',
      shortsColor: 'F40018',
      ignoredSocksColor: 'F40018'
    });
  });

  it('extracts home and away kit params from Brazil fixture with inline params', () => {
    const data = extractTeamKitImportData(
      'brazil',
      'Сборная Бразилии по футболу',
      readWikiKitFixture('brazil')
    );

    expect(data.home).toMatchObject({
      patternLeftArm: 'bra26h',
      patternBody: 'bra26h',
      patternRightArm: 'bra26h',
      patternShorts: 'bra26h',
      ignoredSocksPattern: 'bra26hl',
      leftArmColor: 'FFE540',
      bodyColor: 'FFE540',
      rightArmColor: 'FFE540',
      shortsColor: '4080FF',
      ignoredSocksColor: 'FFFFFF'
    });
    expect(data.away).toMatchObject({
      patternLeftArm: 'bra26a',
      patternBody: 'bra26a',
      patternRightArm: 'bra26a',
      patternShorts: 'bra26a1',
      leftArmColor: '2A4A9F',
      bodyColor: '2A4A9F',
      rightArmColor: '2A4A9F',
      shortsColor: '2A4A9F',
      ignoredSocksColor: '0F0F0F'
    });
    expect(data.away.ignoredSocksPattern).toBeUndefined();
  });

  it('extracts Ukraine away socks as ignored diagnostics', () => {
    const data = extractTeamKitImportData(
      'ukraine',
      'Сборная Украины по футболу',
      readWikiKitFixture('ukraine')
    );

    expect(data.away).toMatchObject({
      patternLeftArm: 'ukr26a',
      patternBody: 'ukr26aA',
      patternRightArm: 'ukr26a',
      patternShorts: 'ukr26a',
      ignoredSocksPattern: 'ukr26al',
      ignoredSocksColor: '085CB9'
    });
  });

  it('normalizes pattern tokens', () => {
    expect(normalizePatternToken('_pol24h')).toBe('pol24h');
    expect(normalizePatternToken('__pol24h')).toBe('pol24h');
    expect(normalizePatternToken(' pol24h ')).toBe('pol24h');
    expect(normalizePatternToken('')).toBeUndefined();
    expect(normalizePatternToken('   ')).toBeUndefined();
    expect(normalizePatternToken()).toBeUndefined();
  });

  it('keeps nested templates and links from breaking parameter parsing', () => {
    const parsed = parseFootballTeamTemplateParams(`before
{{Сборная страны по футболу
| alias = {{lang|pt|Brasil|note=a=b}}
| link = [[Brazil|team=a]]
| leftarm1 = FFFFFF
| body1 = 00aa44
| rightarm1 = FFFFFF
| shorts1 = 112233
| leftarm2 = 000000
| body2 = 111111
| rightarm2 = 222222
| shorts2 = 333333
}}
after`);

    expect(parsed.name).toBe('Сборная страны по футболу');
    expect(parsed.params.alias).toBe('{{lang|pt|Brasil|note=a=b}}');
    expect(parsed.params.link).toBe('[[Brazil|team=a]]');

    const data = extractTeamKitImportData('brazil', 'Nested template test', `{{Сборная страны по футболу
| alias = {{lang|pt|Brasil|note=a=b}}
| leftarm1 = FFFFFF
| body1 = 00aa44
| rightarm1 = FFFFFF
| shorts1 = 112233
| leftarm2 = 000000
| body2 = 111111
| rightarm2 = 222222
| shorts2 = 333333
}}`);

    expect(data.home.bodyColor).toBe('00AA44');
    expect(data.away.shortsColor).toBe('333333');
  });

  it('throws a clear error when a required color is missing', () => {
    expect(() =>
      extractTeamKitImportData(
        'poland',
        'Missing body test',
        `{{Сборная страны по футболу
| leftarm1 = FFFFFF
| rightarm1 = FFFFFF
| shorts1 = FFFFFF
| leftarm2 = 000000
| body2 = 000000
| rightarm2 = 000000
| shorts2 = 000000
}}`
      )
    ).toThrow('Missing required kit color fields for poland home: body');
  });
});

describe('wiki kits Wikipedia client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests wikitext with the expected query params and User-Agent', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        query: {
          pages: [
            {
              title: 'Сборная Польши по футболу',
              revisions: [
                {
                  revid: 12345,
                  timestamp: '2026-06-11T09:00:00Z',
                  slots: {
                    main: {
                      content: '{{Сборная страны по футболу|body1=FFFFFF}}'
                    }
                  }
                }
              ]
            }
          ]
        }
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchWikipediaPageWikitext('Сборная Польши по футболу');

    expect(result).toEqual({
      title: 'Сборная Польши по футболу',
      revisionId: 12345,
      revisionTimestamp: '2026-06-11T09:00:00Z',
      content: '{{Сборная страны по футболу|body1=FFFFFF}}'
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(url).toBeInstanceOf(URL);
    expect(url.origin + url.pathname).toBe('https://ru.wikipedia.org/w/api.php');
    expect(url.searchParams.get('action')).toBe('query');
    expect(url.searchParams.get('prop')).toBe('revisions');
    expect(url.searchParams.get('titles')).toBe('Сборная Польши по футболу');
    expect(url.searchParams.get('rvprop')).toBe('ids|timestamp|content');
    expect(url.searchParams.get('rvslots')).toBe('main');
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.get('formatversion')).toBe('2');
    expect(init.headers).toEqual({
      'User-Agent': 'TotalSoccerMundialKitImporter/0.1 (local development importer)'
    });
  });

  it('reports missing pages clearly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse({
          query: {
            pages: [
              {
                title: 'Missing',
                missing: true
              }
            ]
          }
        })
      )
    );

    await expect(fetchWikipediaPageWikitext('Missing')).rejects.toThrow(
      'Failed to load Wikipedia wikitext for "Missing": Page is missing'
    );
  });

  it('reports malformed responses without pages clearly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse({
          query: {}
        })
      )
    );

    await expect(fetchWikipediaPageWikitext('Сборная Польши по футболу')).rejects.toThrow(
      'Response does not contain query.pages'
    );
  });

  it('reports missing revisions clearly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse({
          query: {
            pages: [
              {
                title: 'Сборная Украины по футболу'
              }
            ]
          }
        })
      )
    );

    await expect(fetchWikipediaPageWikitext('Сборная Украины по футболу')).rejects.toThrow(
      'Response does not contain revisions'
    );
  });

  it('reports HTTP failures clearly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createJsonResponse({}, { ok: false, status: 500 })));

    await expect(fetchWikipediaPageWikitext('Сборная Бразилии по футболу')).rejects.toThrow(
      'Failed to load Wikipedia wikitext for "Сборная Бразилии по футболу": HTTP 500'
    );
  });

  it('reports invalid JSON clearly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Unexpected token'))
      } as unknown as Response)
    );

    await expect(fetchWikipediaPageWikitext('Сборная Польши по футболу')).rejects.toThrow(
      'Failed to load Wikipedia wikitext for "Сборная Польши по футболу": Unexpected token'
    );
  });

  it('reports empty content clearly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse({
          query: {
            pages: [
              {
                title: 'Сборная Польши по футболу',
                revisions: [
                  {
                    revid: 12345,
                    timestamp: '2026-06-11T09:00:00Z',
                    slots: {
                      main: {
                        content: '   '
                      }
                    }
                  }
                ]
              }
            ]
          }
        })
      )
    );

    await expect(fetchWikipediaPageWikitext('Сборная Польши по футболу')).rejects.toThrow(
      'Response contains empty wikitext'
    );
  });
});

describe('wiki kits Commons client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves imageinfo with source URL and license metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        query: {
          pages: [
            {
              title: 'File:Kit body.svg',
              imageinfo: [
                {
                  url: 'https://upload.wikimedia.org/source/Kit_body.svg',
                  thumburl: 'https://upload.wikimedia.org/thumb/Kit_body.png',
                  descriptionurl: 'https://commons.wikimedia.org/wiki/File:Kit_body.svg',
                  extmetadata: {
                    Artist: { value: 'Example artist' },
                    LicenseShortName: { value: 'CC BY-SA 4.0' },
                    LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
                    AttributionRequired: { value: 'true' },
                    Credit: { value: 'Example credit' },
                    UsageTerms: { value: 'Creative Commons Attribution-Share Alike 4.0' }
                  }
                }
              ]
            }
          ]
        }
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    const metadata = await resolveCommonsFile('Kit body.svg', 'base-body');

    expect(metadata).toEqual({
      kind: 'base-body',
      requestedTitle: 'File:Kit body.svg',
      resolvedTitle: 'File:Kit body.svg',
      sourceUrl: 'https://upload.wikimedia.org/thumb/Kit_body.png',
      descriptionUrl: 'https://commons.wikimedia.org/wiki/File:Kit_body.svg',
      author: 'Example artist',
      licenseShortName: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      credit: 'Example credit',
      usageTerms: 'Creative Commons Attribution-Share Alike 4.0',
      attributionRequired: true
    });

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.origin + url.pathname).toBe('https://commons.wikimedia.org/w/api.php');
    expect(url.searchParams.get('action')).toBe('query');
    expect(url.searchParams.get('prop')).toBe('imageinfo');
    expect(url.searchParams.get('titles')).toBe('File:Kit body.svg');
    expect(url.searchParams.get('iiprop')).toBe('url|extmetadata');
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.get('formatversion')).toBe('2');
    expect(init.headers).toEqual({
      'User-Agent': 'TotalSoccerMundialKitImporter/0.1 (local development importer)'
    });
  });

  it('falls back to url when thumburl is absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse({
          query: {
            pages: [
              {
                title: 'File:Kit shorts.svg',
                imageinfo: [
                  {
                    url: 'https://upload.wikimedia.org/source/Kit_shorts.svg',
                    descriptionurl: 'https://commons.wikimedia.org/wiki/File:Kit_shorts.svg'
                  }
                ]
              }
            ]
          }
        })
      )
    );

    await expect(resolveCommonsFile('Kit shorts.svg', 'base-shorts')).resolves.toMatchObject({
      sourceUrl: 'https://upload.wikimedia.org/source/Kit_shorts.svg'
    });
  });

  it('returns null for missing files and pages without imageinfo', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          query: {
            pages: [
              {
                title: 'File:Missing.png',
                missing: true
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          query: {
            pages: [
              {
                title: 'File:No imageinfo.png'
              }
            ]
          }
        })
      );

    vi.stubGlobal('fetch', fetchMock);

    await expect(resolveCommonsFile('Missing.png')).resolves.toBeNull();
    await expect(resolveCommonsFile('No imageinfo.png')).resolves.toBeNull();
  });
});

describe('wiki kits Commons file resolver', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds PNG and SVG pattern candidates', () => {
    expect(getPatternFileCandidates('body', '_pol24h')).toEqual(['Kit body pol24h.png', 'Kit body pol24h.svg']);
    expect(getPatternFileCandidates('leftArm', 'pol_24h')).toEqual([
      'Kit left arm pol 24h.png',
      'Kit left arm pol 24h.svg'
    ]);
  });

  it('returns a warning instead of throwing when an optional pattern is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse({
          query: {
            pages: [
              {
                title: 'File:Missing pattern.png',
                missing: true
              }
            ]
          }
        })
      )
    );

    const result = await resolvePatternLayer('shorts', 'missing-pattern');

    expect(result.asset).toBeUndefined();
    expect(result.warnings).toEqual([
      'Pattern not found for shorts token "missing-pattern". Tried: File:Kit shorts missing-pattern.png, File:Kit shorts missing-pattern.svg'
    ]);
  });
});

describe('wiki kits download cache', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates stable safe cache file names', () => {
    expect(createCommonsCacheFileName(createCommonsAssetMetadata('File:Kit body pol24h.png'))).toBe('kit-body-pol24h.png');
  });

  it('downloads Commons assets into cache', async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), 'wiki-kits-cache-'));

    try {
      const fetchMock = vi.fn().mockResolvedValue(createBinaryResponse('png-data'));
      vi.stubGlobal('fetch', fetchMock);

      const path = await downloadCommonsAsset(createCommonsAssetMetadata('File:Kit body pol24h.png'), { cacheDir });

      expect(path).toBe(join(cacheDir, 'kit-body-pol24h.png'));
      expect(readFileSync(path, 'utf8')).toBe('png-data');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      await rm(cacheDir, { recursive: true, force: true });
    }
  });

  it('reuses cached files unless force is requested', async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), 'wiki-kits-cache-'));
    const metadata = createCommonsAssetMetadata('File:Kit shorts.svg', 'https://upload.wikimedia.org/Kit_shorts.svg');

    try {
      await writeFile(join(cacheDir, 'kit-shorts.svg'), 'cached', 'utf8');
      const fetchMock = vi.fn().mockResolvedValue(createBinaryResponse('fresh'));
      vi.stubGlobal('fetch', fetchMock);

      const cachedPath = await downloadCommonsAsset(metadata, { cacheDir });
      expect(readFileSync(cachedPath, 'utf8')).toBe('cached');
      expect(fetchMock).toHaveBeenCalledTimes(0);

      const forcedPath = await downloadCommonsAsset(metadata, { cacheDir, force: true });
      expect(readFileSync(forcedPath, 'utf8')).toBe('fresh');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      await rm(cacheDir, { recursive: true, force: true });
    }
  });
});

describe('wiki kits renderer', () => {
  it('renders a transparent 384 x 420 PNG with shirt parts and shorts only', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'wiki-kits-render-'));

    try {
      const assets = await createRendererFixtureAssets(tempDir);
      const outputPath = join(tempDir, 'kit.png');

      await renderKitPng(
        {
          teamId: 'poland',
          variant: 'home',
          params: createRendererParams(),
          assets
        },
        outputPath
      );

      const metadata = await sharp(outputPath).metadata();

      expect(metadata.width).toBe(384);
      expect(metadata.height).toBe(420);
      await expect(readPixel(outputPath, 0, 0)).resolves.toEqual([0, 0, 0, 0]);
      await expect(readPixel(outputPath, 192, 410)).resolves.toEqual([0, 0, 0, 0]);
      await expect(readPixel(outputPath, 192, 90)).resolves.toEqual([18, 52, 86, 255]);
      await expect(readPixel(outputPath, 192, 300)).resolves.toEqual([240, 0, 24, 255]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('overlays patterns over the colored base layer', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'wiki-kits-render-'));

    try {
      const assets = await createRendererFixtureAssets(tempDir, true);
      const outputPath = join(tempDir, 'pattern-kit.png');

      await renderKitPng(
        {
          teamId: 'brazil',
          variant: 'away',
          params: createRendererParams(),
          assets
        },
        outputPath
      );

      await expect(readPixel(outputPath, 192, 90)).resolves.toEqual([255, 0, 255, 255]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('uses the solid-color fallback when a pattern asset is absent', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'wiki-kits-render-'));

    try {
      const assets = await createRendererFixtureAssets(tempDir, false);
      const outputPath = join(tempDir, 'fallback-kit.png');

      await renderKitPng(
        {
          teamId: 'ukraine',
          variant: 'home',
          params: {
            ...createRendererParams(),
            patternBody: 'missing-pattern'
          },
          assets
        },
        outputPath
      );

      await expect(readPixel(outputPath, 192, 90)).resolves.toEqual([18, 52, 86, 255]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('renders deterministically', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'wiki-kits-render-'));

    try {
      const assets = await createRendererFixtureAssets(tempDir, true);
      const firstOutput = join(tempDir, 'first.png');
      const secondOutput = join(tempDir, 'second.png');
      const input = {
        teamId: 'poland' as const,
        variant: 'home' as const,
        params: createRendererParams(),
        assets
      };

      await renderKitPng(input, firstOutput);
      await renderKitPng(input, secondOutput);

      await expect(readFile(firstOutput)).resolves.toEqual(await readFile(secondOutput));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('writes debug intermediate layers when requested', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'wiki-kits-render-'));

    try {
      const assets = await createRendererFixtureAssets(tempDir, true);
      const outputPath = join(tempDir, 'debug-kit.png');
      const intermediateDir = join(tempDir, 'debug');

      await renderKitPng(
        {
          teamId: 'poland',
          variant: 'home',
          params: createRendererParams(),
          assets
        },
        outputPath,
        {
          debug: true,
          intermediateDir
        }
      );

      await expect(readFile(join(intermediateDir, '01-left-arm-base.png'))).resolves.toBeInstanceOf(Buffer);
      await expect(readFile(join(intermediateDir, '03-body-base.png'))).resolves.toBeInstanceOf(Buffer);
      await expect(readFile(join(intermediateDir, '04-body-pattern.png'))).resolves.toBeInstanceOf(Buffer);
      await expect(readFile(join(intermediateDir, '09-composite.png'))).resolves.toBeInstanceOf(Buffer);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe('wiki kits preview writer', () => {
  it('writes a stable contact sheet with six kit cells', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'wiki-kits-preview-'));

    try {
      const inputRoot = join(tempDir, 'kits');
      const outputPath = join(tempDir, 'reports', 'wiki-kits-preview.png');

      await writeAllPreviewFixtureKits(inputRoot);
      await writePreview(inputRoot, outputPath);

      const metadata = await sharp(outputPath).metadata();
      const cells = getPreviewCells(inputRoot);

      expect(metadata.width).toBe(WIKI_KITS_PREVIEW_SIZE.width);
      expect(metadata.height).toBe(WIKI_KITS_PREVIEW_SIZE.height);
      expect(cells).toHaveLength(6);
      expect(cells.map((cell) => cell.label)).toEqual([
        'Poland / home',
        'Poland / away',
        'Ukraine / home',
        'Ukraine / away',
        'Brazil / home',
        'Brazil / away'
      ]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('uses a placeholder block when a kit PNG is missing', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'wiki-kits-preview-'));

    try {
      const inputRoot = join(tempDir, 'kits');
      const outputPath = join(tempDir, 'reports', 'wiki-kits-preview.png');

      await writeAllPreviewFixtureKits(inputRoot, ['brazil/away']);
      await writePreview(inputRoot, outputPath);

      const missingCell = getPreviewCells(inputRoot).find((cell) => cell.teamId === 'brazil' && cell.variant === 'away');

      expect(missingCell).toBeDefined();
      await expect(
        readPixel(
          outputPath,
          missingCell!.x + missingCell!.imageX + 8,
          missingCell!.y + missingCell!.imageY + 8
        )
      ).resolves.toEqual([205, 214, 210, 255]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe('wiki kits CLI and pipeline', () => {
  it('parses supported CLI options', () => {
    expect(parseWikiKitsCliArgs(['--team=poland', '--force', '--clear-cache', '--debug'])).toEqual({
      teamId: 'poland',
      force: true,
      clearCache: true,
      debug: true
    });
    expect(parseWikiKitsCliArgs(['--team', 'ukraine'])).toMatchObject({
      teamId: 'ukraine'
    });
    expect(() => parseWikiKitsCliArgs(['--team=france'])).toThrow('Unsupported team "france"');
    expect(() => parseWikiKitsCliArgs(['--unknown'])).toThrow('Unknown wiki-kits option');
  });

  it('runs one team through the import pipeline with mocked dependencies', async () => {
    const resolveBaseLayer = vi.fn(async (part) => createCommonsAssetMetadata(`File:Kit ${part}.svg`));
    const resolvePatternLayerMock = vi.fn(async () => ({
      asset: createCommonsAssetMetadata('File:Kit body pol24h.png'),
      warnings: []
    }));
    const downloadCommonsAssetMock = vi.fn(async (asset: CommonsAssetMetadata) => `cache/${asset.resolvedTitle}`);
    const renderKitPngMock = vi.fn(async () => undefined);
    const writeManifestMock = vi.fn(async () => undefined);
    const writeAttributionMock = vi.fn(async () => undefined);
    const writeImportReportMock = vi.fn(async () => undefined);
    const writePreviewMock = vi.fn(async () => undefined);

    const report = await runWikiKitsImport(
      {
        teamId: 'poland',
        force: true,
        clearCache: false,
        debug: false
      },
      {
        fetchWikipediaPageWikitext: vi.fn(async () => ({
          title: 'Сборная Польши по футболу',
          revisionId: 100,
          revisionTimestamp: '2026-06-11T09:00:00Z',
          content: 'fixture'
        })),
        extractTeamKitImportData: vi.fn(() => ({
          teamId: 'poland' as const,
          wikipediaTitle: 'Сборная Польши по футболу',
          home: createPipelineParams('pol24h'),
          away: createPipelineParams('pol24a')
        })),
        resolveBaseLayer,
        resolvePatternLayer: resolvePatternLayerMock,
        downloadCommonsAsset: downloadCommonsAssetMock,
        renderKitPng: renderKitPngMock,
        writeManifest: writeManifestMock,
        writeAttribution: writeAttributionMock,
        writeImportReport: writeImportReportMock,
        writePreview: writePreviewMock,
        logger: createSilentLogger()
      }
    );

    expect(report.teams).toHaveLength(1);
    expect(report.teams[0]).toMatchObject({
      teamId: 'poland',
      status: 'SUCCESS',
      kits: [
        {
          variant: 'home',
          status: 'SUCCESS'
        },
        {
          variant: 'away',
          status: 'SUCCESS'
        }
      ]
    });
    expect(resolveBaseLayer).toHaveBeenCalledTimes(4);
    expect(resolvePatternLayerMock).toHaveBeenCalledTimes(8);
    expect(renderKitPngMock).toHaveBeenCalledTimes(2);
    expect(writeManifestMock).toHaveBeenCalledTimes(1);
    expect(writeAttributionMock).toHaveBeenCalledTimes(1);
    expect(writeImportReportMock).toHaveBeenCalledTimes(1);
    expect(writePreviewMock).toHaveBeenCalledTimes(1);
  });

  it('runs the full pipeline offline for three teams with temporary output and cache', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'wiki-kits-pipeline-'));

    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => {
          throw new Error('Network access is disabled in this offline pipeline test');
        })
      );

      const deps = await createOfflinePipelineDependencies(tempDir);
      const report = await runWikiKitsImport(
        {
          force: true,
          clearCache: false,
          debug: false
        },
        deps
      );

      expect(report.teams).toHaveLength(3);
      expect(report.teams.map((team) => team.status)).toEqual(['SUCCESS', 'SUCCESS', 'SUCCESS']);
      expect(report.teams.flatMap((team) => team.kits.map((kit) => `${team.teamId}/${kit.variant}`))).toEqual([
        'poland/home',
        'poland/away',
        'ukraine/home',
        'ukraine/away',
        'brazil/home',
        'brazil/away'
      ]);

      for (const teamId of TEAM_IDS) {
        for (const variant of KIT_VARIANTS) {
          const metadata = await sharp(join(deps.paths!.outputRoot!, teamId, `${variant}.png`)).metadata();

          expect(metadata.width).toBe(384);
          expect(metadata.height).toBe(420);
        }
      }

      const manifest = JSON.parse(readFileSync(join(deps.paths!.outputRoot!, 'manifest.json'), 'utf8'));
      const attribution = JSON.parse(readFileSync(join(deps.paths!.outputRoot!, 'ATTRIBUTION.json'), 'utf8'));
      const diskReport = JSON.parse(readFileSync(deps.paths!.reportPath!, 'utf8'));
      const previewMetadata = await sharp(deps.paths!.previewPath!).metadata();

      expect(manifest.teams.poland.home.path).toBe('poland/home.png');
      expect(attribution.assets.length).toBeGreaterThan(0);
      expect(diskReport.teams).toHaveLength(3);
      expect(previewMetadata.width).toBe(WIKI_KITS_PREVIEW_SIZE.width);
      expect(previewMetadata.height).toBe(WIKI_KITS_PREVIEW_SIZE.height);
      expect(deps.downloadCommonsAsset).toHaveBeenCalled();
      expect(deps.downloadCommonsAsset.mock.calls.every(([, options]) => options?.cacheDir === join(tempDir, 'cache', 'commons'))).toBe(
        true
      );
    } finally {
      vi.unstubAllGlobals();
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('skips existing PNGs without force and rerenders them with force', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'wiki-kits-pipeline-'));

    try {
      const deps = await createOfflinePipelineDependencies(tempDir);

      await writePreviewFixtureKit(deps.paths!.outputRoot!, 'poland', 'home', '#D00027');
      await writePreviewFixtureKit(deps.paths!.outputRoot!, 'poland', 'away', '#FFFFFF');

      const skippedReport = await runWikiKitsImport(
        {
          teamId: 'poland',
          force: false,
          clearCache: false,
          debug: false
        },
        deps
      );

      expect(skippedReport.teams[0]).toMatchObject({
        teamId: 'poland',
        status: 'SKIPPED',
        kits: [
          {
            variant: 'home',
            status: 'SKIPPED'
          },
          {
            variant: 'away',
            status: 'SKIPPED'
          }
        ]
      });
      expect(deps.resolveBaseLayer).not.toHaveBeenCalled();
      expect(deps.renderKitPng).not.toHaveBeenCalled();

      vi.clearAllMocks();

      const forcedReport = await runWikiKitsImport(
        {
          teamId: 'poland',
          force: true,
          clearCache: false,
          debug: false
        },
        deps
      );

      expect(forcedReport.teams[0]).toMatchObject({
        teamId: 'poland',
        status: 'SUCCESS',
        kits: [
          {
            variant: 'home',
            status: 'SUCCESS'
          },
          {
            variant: 'away',
            status: 'SUCCESS'
          }
        ]
      });
      expect(deps.resolveBaseLayer).toHaveBeenCalledTimes(4);
      expect(deps.renderKitPng).toHaveBeenCalledTimes(2);
      expect(deps.downloadCommonsAsset.mock.calls.some(([, options]) => options?.force === true)).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('records missing patterns, fallback layers, report details and attribution usedBy', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'wiki-kits-writers-'));

    try {
      const resolveBaseLayer = vi.fn(async (part) =>
        createCommonsAssetMetadata(
          `File:Kit ${part}.svg`,
          `https://upload.wikimedia.org/${part}.svg`,
          getTestBaseAssetKind(part)
        )
      );
      const resolvePatternLayerMock = vi.fn(async (part) =>
        part === 'shorts'
          ? {
              warnings: ['Pattern not found for shorts token "missing"']
            }
          : {
              asset: createCommonsAssetMetadata(`File:Kit ${part} pol24h.png`, `https://upload.wikimedia.org/${part}.png`),
              warnings: []
            }
      );
      const downloadCommonsAssetMock = vi.fn(async (asset: CommonsAssetMetadata) => `cache/${asset.resolvedTitle}`);
      const outputRoot = join(tempDir, 'output');
      const reportPath = join(tempDir, 'reports', 'wiki-kits-import-report.json');
      const previewPath = join(tempDir, 'reports', 'wiki-kits-preview.png');

      const report = await runWikiKitsImport(
        {
          teamId: 'poland',
          force: true,
          clearCache: false,
          debug: false
        },
        {
          fetchWikipediaPageWikitext: vi.fn(async () => ({
            title: 'Сборная Польши по футболу',
            revisionId: 200,
            revisionTimestamp: '2026-06-11T09:00:00Z',
            content: 'fixture'
          })),
          extractTeamKitImportData: vi.fn(() => ({
            teamId: 'poland' as const,
            wikipediaTitle: 'Сборная Польши по футболу',
            home: {
              ...createPipelineParams('pol24h'),
              patternShorts: 'missing',
              ignoredSocksColor: 'FFFFFF',
              ignoredSocksPattern: 'ignored'
            },
            away: createPipelineParams('pol24a')
          })),
          resolveBaseLayer,
          resolvePatternLayer: resolvePatternLayerMock,
          downloadCommonsAsset: downloadCommonsAssetMock,
          renderKitPng: vi.fn(async () => undefined),
          paths: {
            outputRoot,
            cacheRoot: join(tempDir, 'cache'),
            reportPath,
            previewPath
          },
          logger: createSilentLogger()
        }
      );

      expect(report.teams[0].kits[0]).toMatchObject({
        status: 'PARTIAL',
        ignoredSocks: {
          color: 'FFFFFF',
          pattern: 'ignored'
        },
        missingPatterns: [
          {
            part: 'shorts',
            token: 'missing'
          }
        ],
        fallbackLayers: ['shorts']
      });

      const manifestPath = join(outputRoot, 'manifest.json');
      const attributionPath = join(outputRoot, 'ATTRIBUTION.json');

      expect(JSON.parse(readFileSync(manifestPath, 'utf8'))).toMatchObject({
        ignoredSocks: true,
        teams: {
          poland: {
            home: {
              path: 'poland/home.png',
              wikipediaTitle: 'Сборная Польши по футболу',
              revisionId: 200,
              warnings: ['Pattern not found for shorts token "missing"']
            }
          }
        }
      });
      expect(JSON.parse(readFileSync(attributionPath, 'utf8')).assets[0]).toMatchObject({
        resolvedTitle: expect.any(String),
        descriptionUrl: expect.any(String),
        sourceUrl: expect.any(String),
        usedBy: expect.arrayContaining(['poland/home'])
      });
      expect(JSON.parse(readFileSync(reportPath, 'utf8')).teams[0].kits[0]).toMatchObject({
        extractedParams: expect.any(Object),
        resolvedFiles: expect.any(Array),
        missingPatterns: expect.any(Array),
        fallbackLayers: ['shorts']
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

async function writeAllPreviewFixtureKits(inputRoot: string, missing: string[] = []): Promise<void> {
  const teams: TeamId[] = ['poland', 'ukraine', 'brazil'];
  const variants: KitVariant[] = ['home', 'away'];
  const colors: Record<TeamId, string> = {
    poland: '#F40018',
    ukraine: '#FFD500',
    brazil: '#00A859'
  };

  for (const teamId of teams) {
    for (const variant of variants) {
      if (missing.includes(`${teamId}/${variant}`)) {
        continue;
      }

      await writePreviewFixtureKit(inputRoot, teamId, variant, colors[teamId]);
    }
  }
}

async function writePreviewFixtureKit(
  inputRoot: string,
  teamId: TeamId,
  variant: KitVariant,
  color: string
): Promise<void> {
  const outputPath = join(inputRoot, teamId, `${variant}.png`);

  await mkdir(join(inputRoot, teamId), { recursive: true });
  await sharp({
    create: {
      width: 384,
      height: 420,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      {
        input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="384" height="420">
          <rect x="112" y="52" width="160" height="205" rx="10" fill="${color}"/>
          <rect x="58" y="76" width="72" height="134" rx="8" fill="${color}"/>
          <rect x="254" y="76" width="72" height="134" rx="8" fill="${color}"/>
          <rect x="127" y="270" width="130" height="92" rx="8" fill="${color}"/>
        </svg>`)
      }
    ])
    .png()
    .toFile(outputPath);
}

async function createOfflinePipelineDependencies(tempDir: string) {
  const paths = {
    outputRoot: join(tempDir, 'output'),
    cacheRoot: join(tempDir, 'cache'),
    reportPath: join(tempDir, 'reports', 'wiki-kits-import-report.json'),
    previewPath: join(tempDir, 'reports', 'wiki-kits-preview.png')
  };
  const fixtureAssets = await createPipelineFixtureAssets(join(tempDir, 'assets'));
  const resolveBaseLayer = vi.fn(async (part: KitLayerPart) =>
    createCommonsAssetMetadata(`File:Kit ${part}.svg`, `https://fixtures.local/base/${part}.svg`, getTestBaseAssetKind(part))
  );
  const resolvePatternLayer = vi.fn(async (part: KitLayerPart, token: string) => ({
    asset: createCommonsAssetMetadata(
      `File:Kit ${part} ${token}.png`,
      `https://fixtures.local/pattern/${part}-${token}.png`,
      getTestPatternAssetKind(part)
    ),
    warnings: []
  }));
  const downloadCommonsAssetMock = vi.fn(async (metadata: CommonsAssetMetadata, options: { cacheDir?: string; force?: boolean } = {}) => {
    const cacheDir = options.cacheDir ?? join(paths.cacheRoot, 'commons');
    const cachePath = join(cacheDir, createCommonsCacheFileName(metadata));
    const sourcePath = getPipelineFixtureAssetPath(fixtureAssets, metadata.kind);

    await mkdir(cacheDir, { recursive: true });
    await copyFile(sourcePath, cachePath);

    return cachePath;
  });

  return {
    fetchWikipediaPageWikitext: vi.fn(async (title: string) => {
      const team = TEST_WIKI_KIT_TEAMS.find((candidate) => candidate.wikipediaTitle === title);

      if (team === undefined) {
        throw new Error(`Unexpected fixture title "${title}".`);
      }

      return {
        title,
        revisionId: 9000 + TEAM_IDS.indexOf(team.teamId),
        revisionTimestamp: '2026-06-11T09:00:00Z',
        content: readWikiKitFixture(team.teamId)
      };
    }),
    resolveBaseLayer,
    resolvePatternLayer,
    downloadCommonsAsset: downloadCommonsAssetMock,
    renderKitPng: vi.fn(renderKitPng),
    paths,
    logger: createSilentLogger()
  };
}

type PipelineFixtureAssets = {
  base: Record<KitLayerPart, string>;
  patterns: Record<KitLayerPart, string>;
};

async function createPipelineFixtureAssets(assetRoot: string): Promise<PipelineFixtureAssets> {
  const parts: KitLayerPart[] = ['leftArm', 'body', 'rightArm', 'shorts'];
  const base = {} as Record<KitLayerPart, string>;
  const patterns = {} as Record<KitLayerPart, string>;

  await mkdir(assetRoot, { recursive: true });

  for (const part of parts) {
    base[part] = join(assetRoot, `${part}-base.svg`);
    patterns[part] = join(assetRoot, `${part}-pattern.png`);

    await writeFile(base[part], createFullRectMaskSvg(), 'utf8');
    await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 4,
        background: getPipelinePatternColor(part)
      }
    })
      .png()
      .toFile(patterns[part]);
  }

  return {
    base,
    patterns
  };
}

function getPipelineFixtureAssetPath(assets: PipelineFixtureAssets, kind: CommonsAssetMetadata['kind']): string {
  switch (kind) {
    case 'base-left-arm':
      return assets.base.leftArm;
    case 'base-body':
      return assets.base.body;
    case 'base-right-arm':
      return assets.base.rightArm;
    case 'base-shorts':
      return assets.base.shorts;
    case 'pattern-left-arm':
      return assets.patterns.leftArm;
    case 'pattern-body':
      return assets.patterns.body;
    case 'pattern-right-arm':
      return assets.patterns.rightArm;
    case 'pattern-shorts':
      return assets.patterns.shorts;
  }
}

function getTestPatternAssetKind(part: KitLayerPart): CommonsAssetMetadata['kind'] {
  switch (part) {
    case 'leftArm':
      return 'pattern-left-arm';
    case 'body':
      return 'pattern-body';
    case 'rightArm':
      return 'pattern-right-arm';
    case 'shorts':
      return 'pattern-shorts';
  }
}

function getPipelinePatternColor(part: KitLayerPart): string {
  switch (part) {
    case 'leftArm':
      return '#FF00FF';
    case 'body':
      return '#00FFFF';
    case 'rightArm':
      return '#FFFF00';
    case 'shorts':
      return '#00FF66';
  }
}

function createJsonResponse(data: unknown, options: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(data)
  } as unknown as Response;
}

function getTestBaseAssetKind(part: string): CommonsAssetMetadata['kind'] {
  switch (part) {
    case 'leftArm':
      return 'base-left-arm';
    case 'body':
      return 'base-body';
    case 'rightArm':
      return 'base-right-arm';
    case 'shorts':
      return 'base-shorts';
    default:
      throw new Error(`Unexpected test part "${part}".`);
  }
}

function createBinaryResponse(content: string): Response {
  const bytes = Buffer.from(content, 'utf8');

  return {
    ok: true,
    status: 200,
    arrayBuffer: vi.fn().mockResolvedValue(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
  } as unknown as Response;
}

function createCommonsAssetMetadata(
  resolvedTitle: string,
  sourceUrl = 'https://upload.wikimedia.org/Kit_body_pol24h.png',
  kind: CommonsAssetMetadata['kind'] = 'pattern-body'
): CommonsAssetMetadata {
  return {
    kind,
    requestedTitle: resolvedTitle,
    resolvedTitle,
    sourceUrl,
    descriptionUrl: `https://commons.wikimedia.org/wiki/${resolvedTitle.replace(/ /g, '_')}`
  };
}

function readWikiKitFixture(teamId: string): string {
  return readFileSync(join(process.cwd(), 'src', 'tests', 'fixtures', 'wiki-kits', `${teamId}.wikitext.txt`), 'utf8');
}

async function createRendererFixtureAssets(tempDir: string, includeBodyPattern = false): Promise<ResolvedKitAssets> {
  const maskPaths = {
    leftArm: join(tempDir, 'left-arm.svg'),
    body: join(tempDir, 'body.svg'),
    rightArm: join(tempDir, 'right-arm.svg'),
    shorts: join(tempDir, 'shorts.svg')
  };

  await Promise.all(Object.values(maskPaths).map((path) => writeFile(path, createFullRectMaskSvg(), 'utf8')));

  const patterns: ResolvedKitAssets['patterns'] = {};

  if (includeBodyPattern) {
    const bodyPatternPath = join(tempDir, 'body-pattern.png');

    await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 4,
        background: '#FF00FF'
      }
    })
      .png()
      .toFile(bodyPatternPath);

    patterns.body = bodyPatternPath;
  }

  return {
    base: maskPaths,
    patterns
  };
}

function createFullRectMaskSvg(): string {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="black"/></svg>';
}

function createRendererParams(): WikipediaKitParams {
  return {
    leftArmColor: 'FFFFFF',
    bodyColor: '123456',
    rightArmColor: 'ABCDEF',
    shortsColor: 'F00018',
    ignoredSocksColor: '000000',
    ignoredSocksPattern: 'ignored-socks'
  };
}

function createPipelineParams(patternToken: string): WikipediaKitParams {
  return {
    leftArmColor: 'FFFFFF',
    bodyColor: 'FFFFFF',
    rightArmColor: 'FFFFFF',
    shortsColor: 'FFFFFF',
    patternLeftArm: patternToken,
    patternBody: patternToken,
    patternRightArm: patternToken,
    patternShorts: patternToken
  };
}

function createSilentLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };
}

async function readPixel(path: string, x: number, y: number): Promise<[number, number, number, number]> {
  const image = sharp(path).ensureAlpha();
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const data = await image.raw().toBuffer();
  const offset = (y * width + x) * 4;

  return [data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0, data[offset + 3] ?? 0];
}

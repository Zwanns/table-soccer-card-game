import { afterEach, describe, expect, it } from 'vitest';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type Phaser from 'phaser';
import sharp from 'sharp';
import { ACTIVE_TEAM_FLAG_CODES } from '../data/activeTeams';
import { NATIONAL_TEAMS, getFlagAssetKey } from '../data/nationalTeams';
import { normalizeFlagCode } from '../data/flagCodes';
import { AVAILABLE_TEAM_LOGO_FLAG_CODES } from '../data/generated/availableTeamLogoFlagCodes';
import { getRegisteredTeamLogosToLoad, getTeamIdentityAssetKey, getTeamLogoAssetKey, getTeamLogoAssetPath, hasTeamLogo, resolveTeamIdentityVisual } from '../assets/teamIdentity';
import { createTeamIdentityImage } from '../ui/teamIdentityImage';
import { collectAvailableTeamLogoFlagCodes, syncLogoRegistry } from '../../scripts/sync-logo-registry';
import { validateTeamLogos } from '../../scripts/validate-logos';
import { createTournamentHubLayout, getTournamentHubCupXlPlayoffGeometry } from '../ui/tournamentHubLayout';

const fixtures: string[] = [];
const activeCodes = new Set<string>(ACTIVE_TEAM_FLAG_CODES);
function fixture(files: string[] = []): string {
  const root = mkdtempSync(join(tmpdir(), 'soccer-logo-tests-'));
  fixtures.push(root);
  mkdirSync(join(root, 'public', 'logos'), { recursive: true });
  for (const name of files) copyFileSync('public/logos/ar.webp', join(root, 'public', 'logos', name));
  return root;
}
afterEach(() => {
  for (const root of fixtures.splice(0)) {
    const target = resolve(root);
    if (!target.startsWith(join(resolve(tmpdir()), 'soccer-logo-tests-'))) throw new Error('Unsafe fixture cleanup path.');
    rmSync(target, { recursive: true, force: true });
  }
});

describe('team logo registry and identity resolver', () => {
  it('discovers all actual files, including inactive teams, in deterministic canonical order', () => {
    const actual = collectAvailableTeamLogoFlagCodes(process.cwd());
    expect([...AVAILABLE_TEAM_LOGO_FLAG_CODES]).toEqual(actual);
    expect(actual).toEqual([...actual].sort());
    expect(new Set(actual).size).toBe(actual.length);
    expect(actual.every((code) => code === code.toLowerCase() && normalizeFlagCode(code) === code)).toBe(true);
    expect(actual.every((code) => NATIONAL_TEAMS.some((team) => team.flagCode === code))).toBe(true);
    expect(ACTIVE_TEAM_FLAG_CODES).toHaveLength(32);
    expect(ACTIVE_TEAM_FLAG_CODES.every((code) => actual.includes(code))).toBe(true);
    const inactive = actual.find((code) => !activeCodes.has(code));
    expect(inactive).toBeDefined();
    expect(getTeamIdentityAssetKey(inactive!)).toBe(getTeamLogoAssetKey(inactive!));
    expect(syncLogoRegistry({ write: false }).content).toBe(readFileSync('src/data/generated/availableTeamLogoFlagCodes.ts', 'utf8'));
  });

  it.each(['ar', 'eng', 'ua', 'de', 'py'])('prefers the canonical logo for %s', (code) => {
    expect(hasTeamLogo(code)).toBe(true);
    expect(getTeamIdentityAssetKey(code)).toBe(`team-logo-${code}`);
    expect(getTeamLogoAssetPath(code)).toBe(`logos/${code}.webp`);
  });

  it.each([['gb-eng', 'eng'], ['gb-sct', 'sct'], ['gb-wls', 'wls']])('normalizes legacy %s to %s without legacy keys', (legacy, canonical) => {
    expect(hasTeamLogo(legacy)).toBe(true);
    expect(getTeamIdentityAssetKey(legacy)).toBe(`team-logo-${canonical}`);
    expect(getTeamLogoAssetKey(legacy)).toBe(`team-logo-${canonical}`);
    expect(getTeamLogoAssetPath(legacy)).toBe(`logos/${canonical}.webp`);
  });

  it('uses py for Paraguay and never aliases Panama to Paraguay', () => {
    expect(NATIONAL_TEAMS.find((team) => team.name === 'Paraguay')?.flagCode).toBe('py');
    expect(getTeamIdentityAssetKey('py')).toBe('team-logo-py');
    expect(hasTeamLogo('pa')).toBe(false);
    expect(getTeamIdentityAssetKey('pa')).toBe(getFlagAssetKey('pa'));
  });

  it('falls back for a known inactive team without a logo and for a failed logo load', () => {
    const inactive = NATIONAL_TEAMS.find((team) => !activeCodes.has(team.flagCode) && !hasTeamLogo(team.flagCode));
    expect(inactive).toBeDefined();
    expect(getTeamIdentityAssetKey(inactive!.flagCode)).toBe(getFlagAssetKey(inactive!.flagCode));
    expect(getTeamIdentityAssetKey('ar', () => false)).toBe('flag-ar');
    expect(getTeamIdentityAssetKey('gb-eng', () => false)).toBe('flag-eng');
  });

  it('preloads only discovered canonical files and keeps fallback flags loaded', () => {
    const preload = getRegisteredTeamLogosToLoad();
    expect(preload.map((asset) => asset.flagCode)).toEqual([...AVAILABLE_TEAM_LOGO_FLAG_CODES]);
    for (const asset of preload) {
      expect(existsSync(join('public', asset.path))).toBe(true);
      expect(asset.assetKey).toBe(`team-logo-${asset.flagCode}`);
    }
    const boot = readFileSync('src/scenes/BootScene.ts', 'utf8');
    expect(boot).toContain('getRegisteredTeamLogosToLoad()');
    expect(boot).toContain('this.load.image(logo.assetKey, logo.path)');
    expect(boot).toContain('this.load.svg(getFlagAssetKey(team.flagCode)');
  });

  it('shows logos at the previous flag height and preserves flag fallback proportions', () => {
    for (const [width, height] of [[32, 24], [50, 38], [64, 48]]) {
      expect(resolveTeamIdentityVisual('ar', width, height)).toEqual({ key: 'team-logo-ar', width: height, height });
      expect(resolveTeamIdentityVisual('ar', width, height, () => false)).toEqual({ key: 'flag-ar', width, height });
    }
  });

  it.each([true, false])('creates a usable UI image when the logo is loaded=%s', (loaded) => {
    const calls: unknown[][] = [];
    const image = { setDisplaySize: (width: number, height: number) => { calls.push([width, height]); return image; } };
    const scene = { textures: { exists: (key: string) => key === 'team-logo-ar' && loaded },
      add: { image: (...args: unknown[]) => { calls.push(args); return image; } } };
    expect(createTeamIdentityImage(scene as unknown as Phaser.Scene, 10, 20, 'ar', 32, 24)).toBe(image);
    expect(calls).toEqual([[10, 20, loaded ? 'team-logo-ar' : 'flag-ar'], [loaded ? 24 : 32, 24]]);
  });

  it.each([
    'scenes/TeamSelectScene.ts', 'scenes/TournamentSetupScene.ts', 'scenes/TournamentHubScene.ts',
    'scenes/TournamentCompleteScene.ts', 'scenes/ResultScene.ts', 'scenes/SquadSelectScene.ts',
    'scenes/SquadEditorScene.ts', 'ui/ScoreView.ts', 'ui/PenaltyPauseStatsPanel.ts'
  ])('%s routes every team badge through the preferred identity helper', (file) => {
    const source = readFileSync(join('src', file), 'utf8');
    expect(source).toContain('createTeamIdentityImage(');
    expect(source).not.toContain('getFlagAssetKey');
    expect(source).not.toMatch(/\.setDisplaySize\((?:flagWidth|.*flagWidth|.*FLAG_WIDTH),/);
  });

  it('syncs the logo registry on dev/build/test startup', () => {
    expect(readFileSync('vite.config.ts', 'utf8')).toContain('createLogoRegistrySyncPlugin()');
    expect(JSON.parse(readFileSync('package.json', 'utf8')).scripts.pretest).toContain('npm run sync:logos');
  });

  it.each([false, true])('preserves exact Cup XL geometry after square logo integration (mobile=%s)', (mobile) => {
    const layout = createTournamentHubLayout(mobile);
    const geometry = getTournamentHubCupXlPlayoffGeometry(layout);
    expect(geometry).toMatchObject(mobile
      ? { cardWidth: 182, columnGap: 28, centerGap: 40, contentWidth: 1466 }
      : { cardWidth: 168, columnGap: 20, centerGap: 36, contentWidth: 1328 });
    expect(layout.playoff.width).toBe(mobile ? 1536 : 1344);
    expect(Math.max(0, geometry.contentWidth - layout.playoff.width)).toBe(0);
    expect(geometry.finalX + geometry.cardWidth / 2).toBe(layout.playoff.width / 2);
  });
});

describe('logo validator failure contracts', () => {
  it('validates real assets as exact 64x64 WebP images with full active coverage', async () => {
    expect((await validateTeamLogos()).errors).toEqual([]);
  });

  it.each([
    ['zzz.webp', 'unknown logo code: zzz'],
    ['AR.webp', 'Non-canonical logo filename'],
    ['ar.WEBP', 'Expected .webp logo filename'],
    ['ar.png', 'Expected .webp logo filename'],
    ['gb-eng.webp', 'Non-canonical logo filename']
  ])('rejects %s with a clear error', async (filename, error) => {
    const root = fixture([filename]);
    expect(() => syncLogoRegistry({ projectRoot: root })).toThrow(error);
    expect((await validateTeamLogos({ projectRoot: root, activeCodes: [] })).errors.join('\n')).toContain(error);
    expect(existsSync(join(root, 'src/data/generated/availableTeamLogoFlagCodes.ts'))).toBe(false);
  });

  it('rejects duplicate logical codes across canonical/legacy filenames', () => {
    expect(() => collectAvailableTeamLogoFlagCodes(fixture(['eng.webp', 'gb-eng.webp']))).toThrow('Duplicate logical logo code: eng');
  });

  it('fails missing active coverage while allowing missing inactive logos', async () => {
    const root = fixture(['ar.webp']);
    expect((await validateTeamLogos({ projectRoot: root, activeCodes: ['ar', 'ua'] })).errors).toContain('Missing active team logo: public/logos/ua.webp.');
    expect((await validateTeamLogos({ projectRoot: root, activeCodes: ['ar'] })).errors).toEqual([]);
  });

  it('fails wrong dimensions without resizing the supplied asset', async () => {
    const root = fixture();
    const filename = join(root, 'public/logos/ar.webp');
    await sharp({ create: { width: 63, height: 64, channels: 4, background: '#fff' } }).webp().toFile(filename);
    const before = readFileSync(filename);
    expect((await validateTeamLogos({ projectRoot: root, activeCodes: [] })).errors).toContain('Expected 64x64 logo for "ar", found 63x64.');
    expect(readFileSync(filename)).toEqual(before);
  });

  it('rejects a PNG disguised as WebP and unreadable files', async () => {
    const root = fixture();
    const filename = join(root, 'public/logos/ar.webp');
    await sharp({ create: { width: 64, height: 64, channels: 4, background: '#fff' } }).png().toFile(filename);
    expect((await validateTeamLogos({ projectRoot: root, activeCodes: [] })).errors).toContain('Expected WebP logo for "ar", found png.');
    writeFileSync(filename, 'invalid image');
    expect((await validateTeamLogos({ projectRoot: root, activeCodes: [] })).errors.join('\n')).toContain('Cannot read logo "ar"');
  });
});

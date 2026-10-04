import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import {
  AVAILABLE_AWAY_KIT_FLAG_CODES, AWAY_KIT_METADATA, TEAM_KIT_STYLES,
  getTeamKitAssetDescriptors, getTeamKitStyle, hasManualTeamKit,
  validateTeamKitStylesAgainstNationalTeams, type TeamKitStyle
} from '../data/teamKits';
import { getTournamentKitCandidates, scoreKitConflict, selectTournamentKits } from '../game/tournamentKitSelection';
import { resolveTeamKitAsset } from '../game/kitAssetResolver';
import { getRegisteredKitAssetsToLoad } from '../scenes/bootKitAssets';
import { prepareKitCardFace } from '../ui/kitCardFaceModel';
import source from './fixtures/team-kit-metadata-32.json';
import preservedHome from './fixtures/preserved-home-kit-metadata.json';

const color = (value: string): string | undefined => value === 'undefined' ? undefined : value.toUpperCase();
const sourceCodes = source.rows.map((row) => row[2]);
const colorFields = ['primaryColor', 'secondaryColor', 'shirtNumberColor', 'shirtNumberStrokeColor'] as const;
const kitColors = (values: string[]) => Object.fromEntries(colorFields.map((field, index) => [field, color(values[index])]));

describe('KIT.METADATA.32 source contract', () => {
  it('contains only 32 unique source codes from Teams rows 3–34 with matching team names', () => {
    expect(source.range).toBe('Teams!A3:K34');
    expect(source.rows).toHaveLength(32);
    expect(new Set(sourceCodes).size).toBe(32);
    const normalizedName = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (const row of source.rows) {
      expect(row[2]).not.toBe('');
      const team = NATIONAL_TEAMS.find((team) => team.flagCode === row[2]);
      expect(team).toBeDefined();
      expect(normalizedName(team!.name)).toBe(normalizedName(row[1]));
      expect(getTeamKitStyle(row[2])).toBeDefined();
      row.slice(3).forEach((value, index) => {
        if (index % 4 === 3 && value === 'undefined') return;
        expect(value).toMatch(/^#[0-9a-f]{6}$/i);
      });
    }
    expect(source.rows.find((row) => row[1] === 'Paraguay')?.[2]).toBe('py');
  });

  it.each(source.rows)('matches HOME/AWAY colors for source row %s (%s)', (...row) => {
    const code = row[2];
    const home = getTeamKitStyle(code)!;
    const away = getTeamKitStyle(code, 'away')!;
    const expectedHome = kitColors(row.slice(3, 7));
    // The local USA HOME update removes the outline; retain the imported sheet snapshot.
    if (code === 'us') expectedHome.shirtNumberStrokeColor = undefined;
    // User-owned Netherlands HOME update; the imported sheet remains a historical snapshot.
    if (code === 'nl') {
      expectedHome.secondaryColor = '#FFFFFF';
      expectedHome.shirtNumberColor = '#FFFFFF';
    }
    const expectedAway = kitColors(row.slice(7, 11));
    for (const field of colorFields) {
      expect(home[field]).toBe(expectedHome[field]);
      expect(AWAY_KIT_METADATA[code][field]).toBe(expectedAway[field]);
      expect(away[field]).toBe(expectedAway[field]);
    }
    expect(away.path).toBe(`kits/images/${code}2.webp`);
  });

  it('has exactly the source codes with complete AWAY metadata', () => {
    expect(Object.keys(AWAY_KIT_METADATA).sort()).toEqual([...sourceCodes].sort());
    expect(Object.entries(AWAY_KIT_METADATA).filter(([, kit]) =>
      kit.primaryColor && kit.secondaryColor && kit.shirtNumberColor
    ).map(([code]) => code).sort()).toEqual([...sourceCodes].sort());
  });

  it('removes field accentColor and requires explicit HOME shirtNumberColor', () => {
    expectTypeOf<Extract<'accentColor', keyof TeamKitStyle>>().toEqualTypeOf<never>();
    const text = readFileSync(join(process.cwd(), 'src/data/teamKits.ts'), 'utf8');
    expect(text).not.toContain('shirtNumberColor = secondaryColor');
    for (const kit of TEAM_KIT_STYLES) {
      expect(kit).not.toHaveProperty('accentColor');
      expect(Object.hasOwn(kit, 'shirtNumberColor')).toBe(true);
      expect(kit.shirtNumberColor).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('preserves all four effective HOME fields for the other 34 teams', () => {
    expect(Object.keys(preservedHome)).toHaveLength(34);
    expect(TEAM_KIT_STYLES.filter((kit) => !sourceCodes.includes(kit.flagCode))
      .map((kit) => kit.flagCode).sort()).toEqual(Object.keys(preservedHome).sort());
    for (const [code, expected] of Object.entries(preservedHome)) {
      const home = getTeamKitStyle(code)!;
      const values = expected as Partial<Record<typeof colorFields[number], string>>;
      for (const field of colorFields) expect(home[field]).toBe(values[field]);
    }
  });

  it('renders actual AWAY numbers and clears an undefined AWAY stroke despite a HOME stroke', () => {
    expect(getTeamKitStyle('ng')?.shirtNumberStrokeColor).toBe('#FFFFFF');
    expect(getTeamKitStyle('ng', 'away')?.shirtNumberStrokeColor).toBeUndefined();
    const face = prepareKitCardFace({ rank: 'A', kitTextureKey: 'kit-ua-away',
      playerProfile: { teamId: 'ua', rank: 'A', playerName: 'Source fixture', shirtNumber: 9 } });
    expect(face.kitAsset).toEqual({ assetKey: 'kit-ua-away', numberColor: '#FFDF0D' });
    expect(resolveTeamKitAsset('ua').numberColor).toBe('#0056B6');
  });

  it('keeps metadata without an image unavailable for manual choice, preload and tournaments', () => {
    for (const code of sourceCodes.filter((code) => !AVAILABLE_AWAY_KIT_FLAG_CODES.has(code))) {
      expect(hasManualTeamKit(code, 'away')).toBe(false);
      expect(getTeamKitAssetDescriptors(code).some((asset) => asset.path.endsWith(`${code}2.webp`))).toBe(false);
      expect(getRegisteredKitAssetsToLoad().some((asset) => asset.path === `kits/images/${code}2.webp`)).toBe(false);
      const candidates = getTournamentKitCandidates(code);
      expect(candidates.away.imageAvailable).toBe(false);
      expect(selectTournamentKits(candidates, candidates)).toEqual(['home', 'home']);
    }
  });

  it('compares only primary/secondary despite different number colors and strokes', () => {
    const first = { primaryColor: '#FFFFFF', secondaryColor: '#000000',
      imageAvailable: true, shirtNumberColor: '#123456', shirtNumberStrokeColor: '#ABCDEF' };
    const second = { ...first, shirtNumberColor: '#FEDCBA', shirtNumberStrokeColor: undefined };
    expect(scoreKitConflict(first, second)).toBe(1);
    expect(selectTournamentKits({ home: first, away: second }, { home: second, away: first })).toEqual(['home', 'home']);
  });

  it('rejects unknown AWAY codes and malformed colors while allowing undefined strokes', () => {
    AWAY_KIT_METADATA.xx = { primaryColor: 'undefined' };
    try {
      expect(validateTeamKitStylesAgainstNationalTeams).toThrow('Unknown AWAY metadata flagCode "xx"');
      expect(validateTeamKitStylesAgainstNationalTeams).toThrow('primaryColor must be #RRGGBB');
    } finally {
      delete AWAY_KIT_METADATA.xx;
    }
    expect(validateTeamKitStylesAgainstNationalTeams).not.toThrow();
  });
});

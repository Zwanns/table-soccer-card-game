import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import {
  AVAILABLE_GOALKEEPER_KIT_IDS,
  AVAILABLE_MANUAL_KIT_FLAG_CODES,
  DEFAULT_KIT_IMAGE_SCALE,
  DEFAULT_SHIRT_NUMBER_STYLE,
  GOALKEEPER_KIT_STYLES,
  KIT_IMAGE_SIZE,
  SHIRT_NUMBER_ANCHOR,
  TEAM_KIT_STYLES,
  getGoalkeeperKitStyle,
  getTeamKitStyle,
  hasManualGoalkeeperKit,
  hasManualTeamKit,
  validateTeamKitStylesAgainstNationalTeams,
  type GoalkeeperKitId,
  type GoalkeeperKitStyle,
  type ShirtNumberAnchor,
  type TeamKitStyle
} from '../data/teamKits';

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

describe('team kit data contract', () => {
  it('defines the Stage 1 kit types and shared constants', () => {
    expectTypeOf<ShirtNumberAnchor>().toEqualTypeOf<{
      x: number;
      y: number;
    }>();
    expectTypeOf<TeamKitStyle>().toMatchTypeOf<{
      flagCode: string;
      assetKey: string;
      path: string;
      primaryColor: string;
      secondaryColor: string;
      shirtNumberColor: string;
      shirtNumberStrokeColor: string;
    }>();
    expectTypeOf<GoalkeeperKitId>().toEqualTypeOf<'gk-1' | 'gk-2'>();
    expectTypeOf<GoalkeeperKitStyle>().toMatchTypeOf<{
      id: GoalkeeperKitId;
      assetKey: string;
      path: string;
      primaryColor: string;
      secondaryColor: string;
      shirtNumberColor: string;
      shirtNumberStrokeColor: string;
    }>();

    expect(SHIRT_NUMBER_ANCHOR).toEqual({ x: 0.5, y: 0.31 });
    expect(KIT_IMAGE_SIZE).toEqual({ width: 384, height: 420 });
    expect(DEFAULT_KIT_IMAGE_SCALE).toBe(1);
    expect(DEFAULT_SHIRT_NUMBER_STYLE).toEqual({
      fontFamily: 'Arial Black',
      fontSize: 17,
      strokeThickness: 2
    });
  });

  it('defines exactly 64 team kit styles matching national teams', () => {
    expect(TEAM_KIT_STYLES).toHaveLength(64);
    expect(NATIONAL_TEAMS).toHaveLength(64);

    const styleFlagCodes = TEAM_KIT_STYLES.map((style) => style.flagCode).sort();
    const nationalFlagCodes = NATIONAL_TEAMS.map((team) => team.flagCode).sort();

    expect(styleFlagCodes).toEqual(nationalFlagCodes);
    expect(new Set(styleFlagCodes).size).toBe(64);
  });

  it('uses valid team kit colors, keys, and image paths', () => {
    const assetKeys = new Set<string>();
    const paths = new Set<string>();

    for (const style of TEAM_KIT_STYLES) {
      expect(style.assetKey).toBe(`kit-${style.flagCode}`);
      expect(style.path).toBe(`kits/images/${style.flagCode}.png`);
      expect(style.assetKey.startsWith('kit-')).toBe(true);
      expect(style.path.startsWith('kits/images/')).toBe(true);
      expect(style.path.endsWith('.png')).toBe(true);
      expect(style.primaryColor).toMatch(HEX_COLOR_PATTERN);
      expect(style.secondaryColor).toMatch(HEX_COLOR_PATTERN);
      expect(style.shirtNumberColor).toMatch(HEX_COLOR_PATTERN);
      expect(style.shirtNumberStrokeColor).toMatch(HEX_COLOR_PATTERN);
      expect(assetKeys.has(style.assetKey)).toBe(false);
      expect(paths.has(style.path)).toBe(false);

      assetKeys.add(style.assetKey);
      paths.add(style.path);
    }
  });

  it('provides helper lookup for required example teams', () => {
    expect(getTeamKitStyle('pl')).toMatchObject({
      flagCode: 'pl',
      assetKey: 'kit-pl',
      path: 'kits/images/pl.png'
    });
    expect(getTeamKitStyle('ua')).toMatchObject({
      flagCode: 'ua',
      assetKey: 'kit-ua',
      path: 'kits/images/ua.png'
    });
    expect(getTeamKitStyle('br')).toMatchObject({
      flagCode: 'br',
      assetKey: 'kit-br',
      path: 'kits/images/br.png'
    });
    expect(getTeamKitStyle('gb-eng')).toMatchObject({
      flagCode: 'gb-eng',
      assetKey: 'kit-gb-eng',
      path: 'kits/images/gb-eng.png'
    });
    expect(getTeamKitStyle('gb-sct')).toMatchObject({
      flagCode: 'gb-sct',
      assetKey: 'kit-gb-sct',
      path: 'kits/images/gb-sct.png'
    });
    expect(getTeamKitStyle('gb-wls')).toMatchObject({
      flagCode: 'gb-wls',
      assetKey: 'kit-gb-wls',
      path: 'kits/images/gb-wls.png'
    });
    expect(getTeamKitStyle('unknown')).toBeUndefined();
  });

  it('defines exactly two goalkeeper kit styles and no gk-3 or gk-4', () => {
    expect(GOALKEEPER_KIT_STYLES).toEqual([
      {
        id: 'gk-1',
        assetKey: 'kit-gk-1',
        path: 'kits/images/gk-1.png',
        primaryColor: '#111111',
        secondaryColor: '#3A3A3A',
        shirtNumberColor: '#FFFFFF',
        shirtNumberStrokeColor: '#111111'
      },
      {
        id: 'gk-2',
        assetKey: 'kit-gk-2',
        path: 'kits/images/gk-2.png',
        primaryColor: '#FFB81C',
        secondaryColor: '#111111',
        shirtNumberColor: '#111111',
        shirtNumberStrokeColor: '#FFFFFF'
      }
    ]);
    expect(GOALKEEPER_KIT_STYLES.map((style) => style.id)).not.toContain('gk-3');
    expect(GOALKEEPER_KIT_STYLES.map((style) => style.id)).not.toContain('gk-4');
    expect(getGoalkeeperKitStyle('gk-1')?.assetKey).toBe('kit-gk-1');
    expect(getGoalkeeperKitStyle('gk-2')?.path).toBe('kits/images/gk-2.png');
  });

  it('keeps the shirt number anchor in normalized coordinates', () => {
    expect(SHIRT_NUMBER_ANCHOR.x).toBeGreaterThanOrEqual(0);
    expect(SHIRT_NUMBER_ANCHOR.x).toBeLessThanOrEqual(1);
    expect(SHIRT_NUMBER_ANCHOR.y).toBeGreaterThanOrEqual(0);
    expect(SHIRT_NUMBER_ANCHOR.y).toBeLessThanOrEqual(1);
  });

  it('allows empty manual PNG registries', () => {
    expect(AVAILABLE_MANUAL_KIT_FLAG_CODES.size).toBe(0);
    expect(AVAILABLE_GOALKEEPER_KIT_IDS.size).toBe(0);
    expect(hasManualTeamKit('pl')).toBe(false);
    expect(hasManualGoalkeeperKit('gk-1')).toBe(false);
  });

  it('validates the complete team kit contract against national teams', () => {
    expect(() => validateTeamKitStylesAgainstNationalTeams()).not.toThrow();
  });

  it('does not import sharp in runtime kit data', () => {
    const teamKitsSource = readFileSync(join(process.cwd(), 'src', 'data', 'teamKits.ts'), 'utf8');

    expect(teamKitsSource).not.toContain("from 'sharp'");
    expect(teamKitsSource).not.toContain('from "sharp"');
    expect(teamKitsSource).not.toContain("require('sharp')");
    expect(teamKitsSource).not.toContain('require("sharp")');
  });
});

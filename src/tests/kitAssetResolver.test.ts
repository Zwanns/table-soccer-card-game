import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AVAILABLE_MANUAL_KIT_FLAG_CODES } from '../data/teamKits';
import { resolveGoalkeeperKitAsset, resolveTeamKitAsset } from '../game/kitAssetResolver';

const initialManualKitFlagCodes = new Set(AVAILABLE_MANUAL_KIT_FLAG_CODES);

describe('kit asset resolver', () => {
  beforeEach(() => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.clear();
  });

  afterEach(() => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.clear();

    for (const flagCode of initialManualKitFlagCodes) {
      AVAILABLE_MANUAL_KIT_FLAG_CODES.add(flagCode);
    }
  });

  it('resolves a registered team to its own WebP asset', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('pl');

    expect(resolveTeamKitAsset('pl')).toEqual({
      assetKey: 'kit-pl',
      numberColor: '#DC143C',
      numberStrokeColor: '#FFFFFF'
    });
  });

  it('uses explicit shirt number colors instead of always using secondary colors', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('ar');

    expect(resolveTeamKitAsset('ar')).toEqual({
      assetKey: 'kit-ar',
      numberColor: '#111111',
      numberStrokeColor: '#FFFFFF'
    });
  });

  it('uses black shirt numbers for the registered Nigeria kit', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('ng');

    expect(resolveTeamKitAsset('ng')).toEqual({
      assetKey: 'kit-ng',
      numberColor: '#000000',
      numberStrokeColor: '#FFFFFF'
    });
  });

  it('uses a blue shirt number with a white outline for Chile', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('cl');

    expect(resolveTeamKitAsset('cl')).toEqual({
      assetKey: 'kit-cl',
      numberColor: '#0039A6',
      numberStrokeColor: '#FFFFFF'
    });
  });

  it('uses the default blue shirt number without an outline for Ukraine', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('ua');

    expect(resolveTeamKitAsset('ua')).toEqual({
      assetKey: 'kit-ua',
      numberColor: '#0057B8'
    });
  });

  it('resolves the registered Canada kit without an outline', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('ca');

    expect(resolveTeamKitAsset('ca')).toEqual({
      assetKey: 'kit-ca',
      numberColor: '#FFFFFF'
    });
  });

  it('resolves the registered Paraguay kit with explicit shirt number colors', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('py');

    expect(resolveTeamKitAsset('py')).toEqual({
      assetKey: 'kit-py',
      numberColor: '#0038A8',
      numberStrokeColor: '#FFFFFF'
    });
  });

  it('resolves newly registered team WebP assets by flagCode', () => {
    for (const flagCode of ['fr', 'es', 'gb-eng', 'nir'] as const) {
      AVAILABLE_MANUAL_KIT_FLAG_CODES.add(flagCode);

      expect(resolveTeamKitAsset(flagCode).assetKey).toBe(`kit-${flagCode}`);
    }
  });

  it('resolves an unregistered known team to none.webp with team number colors', () => {
    expect(resolveTeamKitAsset('br')).toEqual({
      assetKey: 'kit-none',
      numberColor: '#009C3B',
      numberStrokeColor: '#FFFFFF'
    });
    expect(resolveTeamKitAsset('ar')).toEqual({
      assetKey: 'kit-none',
      numberColor: '#111111',
      numberStrokeColor: '#FFFFFF'
    });
  });

  it('resolves an unknown flagCode to none.webp with safe number colors', () => {
    expect(resolveTeamKitAsset('unknown')).toEqual({
      assetKey: 'kit-none',
      numberColor: '#111111'
    });
  });

  it('resolves gk1 and gk2 to mandatory goalkeeper WebP assets', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('gk1');
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('gk2');

    expect(resolveTeamKitAsset('gk1')).toEqual({
      assetKey: 'kit-none',
      numberColor: '#111111'
    });
    expect(resolveGoalkeeperKitAsset('gk1')).toEqual({
      assetKey: 'kit-gk1',
      numberColor: '#3A3A3A',
      numberStrokeColor: '#111111'
    });
    expect(resolveGoalkeeperKitAsset('gk2')).toEqual({
      assetKey: 'kit-gk2',
      numberColor: '#111111',
      numberStrokeColor: '#111111'
    });
  });

  it('does not expose graphics fallback fields from the resolver model', () => {
    const resolved = resolveTeamKitAsset('unknown') as Record<string, unknown>;

    expect(resolved.type).toBeUndefined();
    expect(resolved.primaryColor).toBeUndefined();
    expect(resolved.secondaryColor).toBeUndefined();
  });

  it('does not import sharp or use runtime filesystem/network APIs', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'game', 'kitAssetResolver.ts'), 'utf8');

    expect(source).not.toContain('.png');
    expect(source).not.toContain('public/kits/imported');
    expect(source).not.toContain('kits/imported');
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

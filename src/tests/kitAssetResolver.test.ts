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
      shirtNumberColor: '#DC143C',
      shirtNumberStrokeColor: '#FFFFFF'
    });
  });

  it('resolves an unregistered known team to none.webp with team number colors', () => {
    expect(resolveTeamKitAsset('br')).toEqual({
      assetKey: 'kit-none',
      shirtNumberColor: '#002776',
      shirtNumberStrokeColor: '#FFFFFF'
    });
  });

  it('resolves an unknown flagCode to none.webp with safe number colors', () => {
    expect(resolveTeamKitAsset('unknown')).toEqual({
      assetKey: 'kit-none',
      shirtNumberColor: '#111111',
      shirtNumberStrokeColor: '#FFFFFF'
    });
  });

  it('resolves gk1 and gk2 to mandatory goalkeeper WebP assets', () => {
    expect(resolveGoalkeeperKitAsset('gk1')).toEqual({
      assetKey: 'kit-gk1',
      shirtNumberColor: '#FFFFFF',
      shirtNumberStrokeColor: '#111111'
    });
    expect(resolveGoalkeeperKitAsset('gk2')).toEqual({
      assetKey: 'kit-gk2',
      shirtNumberColor: '#111111',
      shirtNumberStrokeColor: '#FFFFFF'
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

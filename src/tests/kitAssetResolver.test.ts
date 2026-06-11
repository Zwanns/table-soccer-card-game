import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AVAILABLE_GOALKEEPER_KIT_IDS,
  AVAILABLE_MANUAL_KIT_FLAG_CODES
} from '../data/teamKits';
import {
  resolveGoalkeeperKitAsset,
  resolveTeamKitAsset
} from '../game/kitAssetResolver';

const initialManualKitFlagCodes = new Set(AVAILABLE_MANUAL_KIT_FLAG_CODES);
const initialGoalkeeperKitIds = new Set(AVAILABLE_GOALKEEPER_KIT_IDS);

describe('kit asset resolver', () => {
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

  it('resolves a registered team PNG as an image asset', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('pl');

    expect(resolveTeamKitAsset('pl')).toEqual({
      type: 'image',
      assetKey: 'kit-pl',
      shirtNumberColor: '#DC143C',
      shirtNumberStrokeColor: '#FFFFFF'
    });
  });

  it('resolves an unregistered known team as a style fallback', () => {
    expect(resolveTeamKitAsset('br')).toEqual({
      type: 'fallback',
      primaryColor: '#FFDF00',
      secondaryColor: '#009C3B',
      shirtNumberColor: '#002776',
      shirtNumberStrokeColor: '#FFFFFF'
    });
  });

  it('resolves an unknown flagCode as a safe fallback', () => {
    expect(resolveTeamKitAsset('unknown')).toEqual({
      type: 'fallback',
      primaryColor: '#FFFFFF',
      secondaryColor: '#111111',
      shirtNumberColor: '#111111',
      shirtNumberStrokeColor: '#FFFFFF'
    });
  });

  it('resolves gk-1 as an image asset when registered', () => {
    AVAILABLE_GOALKEEPER_KIT_IDS.add('gk-1');

    expect(resolveGoalkeeperKitAsset('gk-1')).toEqual({
      type: 'image',
      assetKey: 'kit-gk-1',
      shirtNumberColor: '#FFFFFF',
      shirtNumberStrokeColor: '#111111'
    });
  });

  it('resolves gk-1 as a fallback when not registered', () => {
    expect(resolveGoalkeeperKitAsset('gk-1')).toEqual({
      type: 'fallback',
      primaryColor: '#111111',
      secondaryColor: '#3A3A3A',
      shirtNumberColor: '#FFFFFF',
      shirtNumberStrokeColor: '#111111'
    });
  });

  it('resolves gk-2 as a fallback with the empty registry', () => {
    expect(resolveGoalkeeperKitAsset('gk-2')).toEqual({
      type: 'fallback',
      primaryColor: '#FFB81C',
      secondaryColor: '#111111',
      shirtNumberColor: '#111111',
      shirtNumberStrokeColor: '#FFFFFF'
    });
  });

  it('does not import sharp or use runtime filesystem/network APIs', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'game', 'kitAssetResolver.ts'), 'utf8');

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

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  AVAILABLE_MANUAL_KIT_FLAG_CODES, AWAY_KIT_METADATA, getTeamKitAssetKey,
  getTeamKitAssetPath, getTeamKitStyle, hasManualTeamKit
} from '../data/teamKits';
import { resolveTeamKitAsset } from '../game/kitAssetResolver';
import {
  getTournamentKitCandidates, KIT_CONFLICT_THRESHOLD, scoreKitConflict,
  selectTournamentKits, type KitCandidate, type TeamKitCandidates
} from '../game/tournamentKitSelection';
import { getRegisteredKitAssetsToLoad } from '../scenes/bootKitAssets';
import { prepareKitCardFace } from '../ui/kitCardFaceModel';
import { GameEngine } from '../game/GameEngine';

const white: KitCandidate = { imageAvailable: true, primaryColor: '#FFFFFF', secondaryColor: '#DDDDDD' };
const black: KitCandidate = { imageAvailable: true, primaryColor: '#000000', secondaryColor: '#222222' };
const missing: KitCandidate = { imageAvailable: false };
const team = (home = white, away = missing): TeamKitCandidates => ({ home, away });
const colors = (primaryColor: string, secondaryColor: string) => ({ primaryColor, secondaryColor });

describe('two field kit resources', () => {
  const originalMetadata = { ...AWAY_KIT_METADATA.de };
  afterEach(() => { AWAY_KIT_METADATA.de = { ...originalMetadata }; });

  it('loads the two German images independently of AWAY colors', () => {
    expect(hasManualTeamKit('de', 'away')).toBe(true);
    expect(getTeamKitAssetPath('de')).toBe('kits/images/de1.webp');
    expect(getTeamKitAssetPath('de', 'away')).toBe('kits/images/de2.webp');
    expect(getTeamKitAssetKey('de', 'away')).not.toBe(getTeamKitAssetKey('de'));
    AWAY_KIT_METADATA.de = {};
    expect(getTeamKitStyle('de', 'away')?.primaryColor).toBeUndefined();
    expect(getTeamKitStyle('de', 'away')?.secondaryColor).toBeUndefined();
    const candidates = getTournamentKitCandidates('de');
    expect(candidates.away).toEqual({ imageAvailable: true, primaryColor: undefined, secondaryColor: undefined });
    expect(selectTournamentKits(candidates, candidates)).toEqual(['home', 'home']);
    expect(resolveTeamKitAsset('de', 'away')).toEqual({ ...resolveTeamKitAsset('de'), assetKey: 'kit-de-away' });
  });

  it('falls back AWAY to HOME to none without requiring all away files', () => {
    expect(hasManualTeamKit('fr', 'away')).toBe(false);
    expect(getTeamKitAssetPath('fr', 'away')).toBe('kits/images/fr1.webp');
    expect(getTeamKitAssetPath('unknown', 'away')).toBe('kits/images/none.webp');
    expect(getTeamKitAssetPath('unknown')).toBe('kits/images/none.webp');
  });

  it('keeps AWAY available when its HOME image is absent', () => {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.delete('de');
    try {
      expect(getTeamKitAssetPath('de')).toBe('kits/images/none.webp');
      expect(getTeamKitAssetPath('de', 'away')).toBe('kits/images/de2.webp');
      expect(resolveTeamKitAsset('de', 'away').assetKey).toBe('kit-de-away');
      expect(getRegisteredKitAssetsToLoad()).toContainEqual({ assetKey: 'kit-de-away', path: 'kits/images/de2.webp' });
    } finally { AVAILABLE_MANUAL_KIT_FLAG_CODES.add('de'); }
  });

  it('queues existing files once and keeps goalkeeper assets unchanged', () => {
    const assets = getRegisteredKitAssetsToLoad();
    expect(new Set(assets.map((asset) => asset.assetKey)).size).toBe(assets.length);
    expect(new Set(assets.map((asset) => asset.path)).size).toBe(assets.length);
    for (const asset of assets) expect(existsSync(join(process.cwd(), 'public', asset.path))).toBe(true);
    for (const id of ['gk1', 'gk2']) expect(assets).toContainEqual({ assetKey: `kit-${id}`, path: `kits/images/${id}.webp` });
  });

  it('resolves explicit AWAY texture and number styling before profile HOME fallback', () => {
    // Synthetic number-style fixtures, restored after the test.
    AWAY_KIT_METADATA.de = { shirtNumberColor: '#123456', shirtNumberStrokeColor: null };
    const face = prepareKitCardFace({ rank: 'A', kitTextureKey: 'kit-de-away',
      playerProfile: { teamId: 'de', rank: 'A', playerName: 'Fixture', shirtNumber: 9 } });
    expect(face.shirtNumber).toBe(9);
    expect(face.kitAsset).toEqual({ assetKey: 'kit-de-away', numberColor: '#123456' });
    expect(getTeamKitStyle('de')?.shirtNumberColor).toBe('#111111');
    AWAY_KIT_METADATA.de.shirtNumberStrokeColor = '#ABCDEF';
    expect(prepareKitCardFace({ rank: 'A', kitTextureKey: 'kit-de-away' }).kitAsset?.numberStrokeColor).toBe('#ABCDEF');
  });

  it('stores independent match selections without putting them in squads', () => {
    const state = new GameEngine().startNewGame({ player1FlagCode: 'de', player1FieldKit: 'away', seed: 'kits' });
    expect(state.matchSetups.PLAYER_1.fieldKit).toBe('away');
    expect(state.matchSetups.PLAYER_2.fieldKit).toBe('home');
    expect(state.matchSetups.PLAYER_1.squad).not.toHaveProperty('fieldKit');
  });

  it.each([['us', undefined], ['ng', '#FFFFFF']] as const)('uses %s HOME stroke only for an absent field in incomplete compatibility metadata', (code, homeStroke) => {
    const original = AWAY_KIT_METADATA[code];
    try {
      AWAY_KIT_METADATA[code] = {};
      expect(getTeamKitStyle(code, 'away')?.shirtNumberStrokeColor).toBe(homeStroke);
      AWAY_KIT_METADATA[code] = { shirtNumberStrokeColor: undefined };
      expect(getTeamKitStyle(code, 'away')?.shirtNumberStrokeColor).toBeUndefined();
      AWAY_KIT_METADATA[code] = { shirtNumberStrokeColor: null };
      expect(getTeamKitStyle(code, 'away')?.shirtNumberStrokeColor).toBeUndefined();
    } finally { AWAY_KIT_METADATA[code] = original; }
  });
});

describe('tournament kit selection with synthetic colors', () => {
  it('keeps nonconflicting HOME/HOME', () => {
    expect(selectTournamentKits(team(white, black), team(black, white))).toEqual(['home', 'home']);
  });
  it('tries second AWAY first even when first AWAY would also work', () => {
    expect(selectTournamentKits(team(white, black), team(white, black))).toEqual(['home', 'away']);
  });
  it('uses first AWAY when second AWAY does not solve the conflict', () => {
    expect(selectTournamentKits(team(white, black), team(white, white))).toEqual(['away', 'home']);
  });
  it('tries all four combinations when both HOME kits clash with both alternatives', () => {
    const home = { imageAvailable: true, ...colors('#BBBBBB', '#000000') };
    const firstAway = { imageAvailable: true, ...colors('#999999', '#000000') };
    const secondAway = { imageAvailable: true, ...colors('#DDDDDD', '#000000') };
    expect(scoreKitConflict(home, firstAway)).toBeGreaterThan(KIT_CONFLICT_THRESHOLD);
    expect(scoreKitConflict(home, secondAway)).toBeGreaterThan(KIT_CONFLICT_THRESHOLD);
    expect(selectTournamentKits(team(home, firstAway), team(home, secondAway))).toEqual(['away', 'away']);
  });
  it('uses AWAY/AWAY when it is the only eligible nonconflicting pair', () => {
    expect(selectTournamentKits(team(missing, white), team(missing, black))).toEqual(['away', 'away']);
  });
  it('chooses the least conflict if none clears the threshold', () => {
    const gray = { ...white, primaryColor: '#E0E0E0' };
    expect(scoreKitConflict(white as Required<typeof white>, gray as Required<typeof gray>)).toBeGreaterThan(KIT_CONFLICT_THRESHOLD);
    expect(selectTournamentKits(team(white, gray), team(white, white))).toEqual(['away', 'home']);
  });
  it('breaks equal scores by first HOME then second HOME', () => {
    for (let i = 0; i < 10; i++) expect(selectTournamentKits(team(white, white), team(white, white))).toEqual(['home', 'home']);
  });
  it('uses HOME/HOME when only HOME exists or no candidate can be compared', () => {
    expect(selectTournamentKits(team(), team())).toEqual(['home', 'home']);
    expect(selectTournamentKits(team(missing), team(missing))).toEqual(['home', 'home']);
  });
  it.each([
    { imageAvailable: true },
    { imageAvailable: true, primaryColor: '#000000' },
    { imageAvailable: true, primaryColor: 'invalid', secondaryColor: '#222222' },
    { ...black, imageAvailable: false }
  ])('excludes unavailable or incomplete AWAY: %j', (away) => {
    expect(selectTournamentKits(team(), team(white, away))).toEqual(['home', 'home']);
  });
  it('admits a candidate as soon as both colors and its image are available', () => {
    const away: KitCandidate = { imageAvailable: true, primaryColor: '#000000' };
    expect(selectTournamentKits(team(), team(white, away))).toEqual(['home', 'home']);
    away.secondaryColor = '#222222';
    expect(selectTournamentKits(team(), team(white, away))).toEqual(['home', 'away']);
    expect(getTournamentKitCandidates('de').away).toEqual({ imageAvailable: true, primaryColor: '#006400', secondaryColor: '#FFFFFF' });
  });
  it('compares both colors, weights primary more, and recognizes reversed pairs', () => {
    const a = colors('#FFFFFF', '#000000');
    expect(scoreKitConflict(a, a)).toBe(1);
    expect(scoreKitConflict(a, colors('#FAFAFA', '#000000'))).toBeGreaterThan(KIT_CONFLICT_THRESHOLD);
    const secondaryOnly = scoreKitConflict(a, colors('#FF0000', '#000000'));
    const primaryOnly = scoreKitConflict(a, colors('#FFFFFF', '#FF0000'));
    expect(secondaryOnly).toBeLessThan(KIT_CONFLICT_THRESHOLD);
    expect(primaryOnly).toBeGreaterThan(secondaryOnly);
    expect(primaryOnly).toBeLessThan(1);
    expect(scoreKitConflict(a, colors('#000000', '#FFFFFF'))).toBeGreaterThan(KIT_CONFLICT_THRESHOLD);
    expect(scoreKitConflict(a, colors('#FF0000', '#000000'))).toBe(scoreKitConflict(colors('#FF0000', '#000000'), a));
  });
});

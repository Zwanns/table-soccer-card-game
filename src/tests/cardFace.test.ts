import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  AVAILABLE_MANUAL_KIT_FLAG_CODES,
  SHIRT_NUMBER_ANCHOR
} from '../data/teamKits';
import { getCardTooltipText, getFieldCardPlayerProfile } from '../ui/cardPlayerProfile';
import { getFallbackKitColors } from '../ui/kitFallback';
import {
  getShirtNumberLayout,
  prepareKitCardFace
} from '../ui/kitCardFaceModel';

const initialManualKitFlagCodes = new Set(AVAILABLE_MANUAL_KIT_FLAG_CODES);

function restoreManualKitRegistry(): void {
  AVAILABLE_MANUAL_KIT_FLAG_CODES.clear();

  for (const flagCode of initialManualKitFlagCodes) {
    AVAILABLE_MANUAL_KIT_FLAG_CODES.add(flagCode);
  }
}

describe('card face profile resolver', () => {
  afterEach(() => {
    restoreManualKitRegistry();
  });

  it('resolves a field card profile from the real squad by team id and rank', () => {
    expect(getFieldCardPlayerProfile('pl', '9')).toEqual({
      teamId: 'pl',
      rank: '9',
      playerName: 'Urbanski',
      shirtNumber: 9
    });
  });

  it('resolves JOKER with the real static shirt number', () => {
    expect(getFieldCardPlayerProfile('pl', 'JOKER')).toEqual({
      teamId: 'pl',
      rank: 'JOKER',
      playerName: 'Kozlowski',
      shirtNumber: 18
    });
  });

  it('formats tooltip text without exposing data on closed cards', () => {
    expect(getCardTooltipText(getFieldCardPlayerProfile('pl', 'A'))).toBe('Buksa\n№17\nНоминал: A');
  });
});

describe('kit card face rendering contracts', () => {
  afterEach(() => {
    restoreManualKitRegistry();
  });

  it('defines readable fallback colors for both current team colors', () => {
    expect(getFallbackKitColors('RED')).toMatchObject({
      shirt: expect.any(Number),
      shorts: expect.any(Number),
      socks: expect.any(Number),
      number: '#ffffff'
    });
    expect(getFallbackKitColors('BLACK')).toMatchObject({
      shirt: expect.any(Number),
      shorts: expect.any(Number),
      socks: expect.any(Number),
      number: '#1f2a2e'
    });
  });

  it('uses the kit card face and tooltip in CardView', () => {
    const cardViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'CardView.ts'), 'utf8');
    const tooltipSource = readFileSync(join(process.cwd(), 'src', 'ui', 'CardTooltipView.ts'), 'utf8');

    expect(cardViewSource).toContain('KitCardFaceView');
    expect(cardViewSource).toContain('CardTooltipView');
    expect(cardViewSource).toContain('options.faceDown === true');
    expect(cardViewSource).toContain('playerProfile');
    expect(cardViewSource).toContain('raiseAboveSiblingCards');
    expect(cardViewSource).toContain('bringToTop');
    expect(cardViewSource).toContain('getWorldTransformMatrix');
    expect(cardViewSource).not.toContain('this.add(this.tooltip)');
    expect(tooltipSource).toContain('TOOLTIP_PADDING_X');
    expect(tooltipSource).toContain('setDepth(10000)');
    expect(tooltipSource).not.toContain('setStrokeStyle');
  });

  it('renders a white card face with top-left rank and fallback kit geometry', () => {
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');

    expect(kitFaceSource).toContain('0xffffff');
    expect(kitFaceSource).toContain('-CARD_WIDTH / 2 + 9');
    expect(kitFaceSource).toContain('-CARD_HEIGHT / 2 + 8');
    expect(kitFaceSource).toContain('fillRoundedRect');
    expect(kitFaceSource).toContain('fillTriangle');
    expect(kitFaceSource).toContain('createFallbackKitGraphics');
    expect(kitFaceSource).not.toContain('fillRoundedRect(-22');
    expect(kitFaceSource).not.toContain('fillRoundedRect(8, 56');
    expect(kitFaceSource).not.toContain('socks');
    expect(kitFaceSource).not.toContain('suit');
  });

  it('prepares team kit assets from the resolver', () => {
    const profile = getFieldCardPlayerProfile('pl', '9');

    AVAILABLE_MANUAL_KIT_FLAG_CODES.clear();

    expect(prepareKitCardFace({ rank: '9', playerProfile: profile })).toMatchObject({
      rank: '9',
      shirtNumber: 9,
      kitAsset: {
        assetKey: 'kit-none',
        shirtNumberColor: '#DC143C',
        shirtNumberStrokeColor: '#FFFFFF'
      }
    });

    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('pl');

    expect(prepareKitCardFace({ rank: '9', playerProfile: profile })).toMatchObject({
      rank: '9',
      shirtNumber: 9,
      kitAsset: {
        assetKey: 'kit-pl',
        shirtNumberColor: '#DC143C',
        shirtNumberStrokeColor: '#FFFFFF'
      }
    });
  });

  it('positions the shirt number with the shared anchor and omits missing numbers', () => {
    const layout = getShirtNumberLayout();

    expect(SHIRT_NUMBER_ANCHOR).toEqual({ x: 0.5, y: 0.31 });
    expect(layout.x).toBe(0);
    expect(layout.y).toBeCloseTo(-28.215);
    expect(prepareKitCardFace({ rank: '9' })).toEqual({
      rank: '9',
      shirtNumber: undefined,
      kitAsset: null
    });
  });

  it('keeps rank singular, suitless, and player names out of the permanent card face', () => {
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');
    const cardViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'CardView.ts'), 'utf8');

    expect(kitFaceSource.match(/addRank/g)?.length).toBe(2);
    expect(kitFaceSource).not.toContain('CARD_HEIGHT / 2 -');
    expect(kitFaceSource).not.toContain('playerName');
    expect(cardViewSource).not.toContain('playerName');
    expect(cardViewSource).not.toContain('options.suit');
  });

  it('passes player profiles to field cards and active attack cards without changing game rules', () => {
    const fieldViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'FieldView.ts'), 'utf8');
    const deckViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'DeckView.ts'), 'utf8');
    const gameSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');
    const bootSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'BootScene.ts'), 'utf8');
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');

    expect(fieldViewSource).toContain('state.matchSetups[player.id]');
    expect(fieldViewSource).toContain("position.positionId === 'goalkeeper'");
    expect(fieldViewSource).toContain('getTeamKitAssetKey(setup.flagCode)');
    expect(fieldViewSource).toContain('getGoalkeeperKitAssetKey(setup.goalkeeperKitId)');
    expect(deckViewSource).toContain('attackCardPlayerProfile');
    expect(deckViewSource).toContain('attackCardKitTextureKey');
    expect(gameSceneSource).toContain('resolveFieldCardProfile(state, player, state.attackCard)');
    expect(gameSceneSource).toContain('resolveFieldKitTextureKey(state, player)');
    expect(gameSceneSource).toContain('getTeamKitAssetKey(setup.flagCode)');
    expect(bootSceneSource).toContain('getRegisteredKitAssetsToLoad()');
    expect(kitFaceSource).toContain('scene.textures.exists(options.kitTextureKey)');
    expect(kitFaceSource).toContain('this.add(image)');
  });
});

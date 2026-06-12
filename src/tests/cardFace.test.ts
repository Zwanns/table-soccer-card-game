import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AVAILABLE_MANUAL_KIT_FLAG_CODES } from '../data/teamKits';
import { getCardTooltipText, getFieldCardPlayerProfile } from '../ui/cardPlayerProfile';
import { getFallbackKitColors } from '../ui/kitFallback';
import {
  getKitImageLayout,
  getShirtNumberLayout,
  KIT_CARD_FACE_HEIGHT,
  KIT_CARD_FACE_WIDTH,
  KIT_CARD_LAYOUT,
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
    expect(getCardTooltipText(getFieldCardPlayerProfile('pl', 'A'))).toBe('Buksa');
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

  it('renders a layered white card face with top-left black rank and image kit layout', () => {
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');

    expect(kitFaceSource).toContain('0xffffff');
    expect(kitFaceSource).toContain('-CARD_WIDTH / 2 + KIT_CARD_LAYOUT.rankOffsetLeft');
    expect(kitFaceSource).toContain('-CARD_HEIGHT / 2 + KIT_CARD_LAYOUT.rankOffsetTop');
    expect(kitFaceSource).toContain('KIT_CARD_LAYOUT.rankColor');
    expect(kitFaceSource).toContain('KIT_CARD_LAYOUT.rankFontFamily');
    expect(kitFaceSource).toContain("fontSize: options.rank.length > 2 ? '26px' : '42px'");
    expect(kitFaceSource).toContain('getKitImageLayout()');
    expect(kitFaceSource).toContain('setOrigin(layout.originX, layout.originY)');
    expect(kitFaceSource).toContain('setDisplaySize(layout.width, layout.height)');
    expect(kitFaceSource).toContain('createRoundedCardBackground');
    expect(kitFaceSource).toContain('KIT_CARD_LAYOUT.cardCornerRadius');
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

  it('places the compact kit in the padded bottom-right corner', () => {
    expect(KIT_CARD_LAYOUT).toEqual({
      kitWidth: 76,
      kitHeight: 88,
      kitAnchorX: 1,
      kitAnchorY: 1,
      kitOffsetRight: 6,
      kitOffsetBottom: 6,
      shirtNumberX: 0.5,
      shirtNumberY: 0.33,
      rankOffsetLeft: 10,
      rankOffsetTop: 8,
      rankColor: '#000000',
      rankFontFamily: 'Anton, Arial, sans-serif',
      shirtNumberFontFamily: 'Oswald, Arial, sans-serif',
      cardCornerRadius: 8,
      deckCornerRadius: 8
    });

    expect(getKitImageLayout()).toEqual({
      x: KIT_CARD_FACE_WIDTH / 2 - 6,
      y: KIT_CARD_FACE_HEIGHT / 2 - 6,
      width: 76,
      height: 88,
      originX: 1,
      originY: 1
    });
  });

  it('positions the shirt number in the centered upper third of the kit and omits missing numbers', () => {
    const layout = getShirtNumberLayout();
    const kitLayout = getKitImageLayout();

    expect(layout.x).toBeCloseTo(kitLayout.x - kitLayout.width * 0.5);
    expect(layout.y).toBeCloseTo(kitLayout.y - kitLayout.height * 0.67);
    expect(layout.y).toBeLessThan(kitLayout.y - kitLayout.height / 2);
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
    expect(kitFaceSource.match(/const rank = scene\.add/g)?.length).toBe(1);
    expect(kitFaceSource).not.toContain('CARD_HEIGHT / 2 -');
    expect(kitFaceSource).not.toContain('playerName');
    expect(cardViewSource).not.toContain('playerName');
    expect(cardViewSource).not.toContain('options.suit');
  });

  it('uses resolver number colors and keeps closed cards unchanged', () => {
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');
    const cardViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'CardView.ts'), 'utf8');
    const deckViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'DeckView.ts'), 'utf8');

    expect(kitFaceSource).toContain('options.kitAsset?.shirtNumberColor');
    expect(kitFaceSource).toContain('options.kitAsset?.shirtNumberStrokeColor');
    expect(kitFaceSource).toContain('getGoalkeeperNumberColor(options.kitTextureKey)');
    expect(kitFaceSource).toContain("kitTextureKey === 'kit-gk1' || kitTextureKey === 'kit-gk2'");
    expect(kitFaceSource).toContain("'#FFFFFF'");
    expect(kitFaceSource).toContain('KIT_CARD_LAYOUT.shirtNumberFontFamily');
    expect(kitFaceSource).toContain("fontStyle: '600'");
    expect(kitFaceSource).toContain('strokeThickness: 2');
    expect(deckViewSource).toContain('createRoundedDeckCard');
    expect(deckViewSource).toContain('createRoundedDeckBorder');
    expect(deckViewSource).toContain('KIT_CARD_LAYOUT.deckCornerRadius');
    expect(cardViewSource).toContain('options.faceDown === true');
    expect(cardViewSource).toContain('0x214f6b');
    expect(cardViewSource).toContain('0x7bb8d8');
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

  it('loads card fonts locally through Fontsource', () => {
    const mainSource = readFileSync(join(process.cwd(), 'src', 'main.ts'), 'utf8');

    expect(mainSource).toContain("@fontsource/anton/400.css");
    expect(mainSource).toContain("@fontsource/oswald/600.css");
  });
});

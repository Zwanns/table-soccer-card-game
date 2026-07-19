import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AVAILABLE_MANUAL_KIT_FLAG_CODES } from '../data/teamKits';
import { getCardTooltipText, getFieldCardPlayerProfile } from '../ui/cardPlayerProfile';
import { getFallbackKitColors } from '../ui/kitFallback';
import {
  CARD_FACE_VISUAL_TUNING,
  getCardRankDisplayLabel,
  getCardRankFontSize,
  getCardRankSuffixFontSize,
  getCardRankVisualLabel,
  getCardRankY,
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
      playerName: 'Kaczmarek',
      shirtNumber: 9
    });
  });

  it('resolves JOKER with the real static shirt number', () => {
    expect(getFieldCardPlayerProfile('pl', 'JOKER')).toEqual({
      teamId: 'pl',
      rank: 'JOKER',
      playerName: 'Warszawski',
      shirtNumber: 18
    });
  });

  it('formats tooltip text without exposing data on closed cards', () => {
    expect(getCardTooltipText(getFieldCardPlayerProfile('pl', 'A'))).toBe('Krakowski');
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
    expect(kitFaceSource).toContain('px(-CARD_WIDTH / 2 + KIT_CARD_LAYOUT.rankOffsetLeft)');
    expect(kitFaceSource).toContain('private rankBaseY = getCardRankY()');
    expect(kitFaceSource).toContain('KIT_CARD_LAYOUT.rankColor');
    expect(kitFaceSource).toContain('KIT_CARD_LAYOUT.rankFontFamily');
    expect(kitFaceSource).toContain('fontSize: `${getCardRankFontSize(getCardRankVisualLabel(options.rank).main)}px`');
    expect(kitFaceSource).toContain('resolution: SHARP_TEXT_RESOLUTION');
    expect(kitFaceSource).toContain('public setDisplayRank(rank: string): void');
    expect(kitFaceSource).toContain('public animateRankRoll(targetRank: string');
    expect(kitFaceSource).not.toContain('kitLayoutVariant');
    expect(kitFaceSource).toContain('getKitImageLayout()');
    expect(kitFaceSource).toContain('getShirtNumberLayout(kitLayout)');
    expect(kitFaceSource).toContain('setOrigin(layout.originX, layout.originY)');
    expect(kitFaceSource).toContain("import { fitImageContain } from '../assets/teamCover'");
    expect(kitFaceSource).toContain('fitImageContain(image, { width: layout.width, height: layout.height })');
    expect(kitFaceSource).toContain('createRenderedKitLayout(layout, image.width, image.height, scale)');
    expect(kitFaceSource).toContain('1.12 * CARD_FACE_VISUAL_TUNING.kitScale');
    expect(kitFaceSource).not.toContain('addFlag');
    expect(kitFaceSource).not.toContain('flagTextureKey');
    expect(kitFaceSource).not.toContain('getCardFlagLayout');
    expect(kitFaceSource).not.toContain('image.setDisplaySize(layout.width, layout.height)');
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
        numberColor: '#DC143C'
      }
    });

    AVAILABLE_MANUAL_KIT_FLAG_CODES.add('pl');

    expect(prepareKitCardFace({ rank: '9', playerProfile: profile })).toMatchObject({
      rank: '9',
      shirtNumber: 9,
      kitAsset: {
        assetKey: 'kit-pl',
        numberColor: '#DC143C'
      }
    });
  });

  it('uses one shared kit layout for match and Teams preview cards', () => {
    expect(KIT_CARD_LAYOUT).toEqual({
      kitWidth: 76,
      kitHeight: 88,
      kitAnchorX: 1,
      kitAnchorY: 1,
      kitOffsetRight: 6,
      kitOffsetBottom: 6,
      shirtNumberX: 0.5,
      shirtNumberY: 0.3,
      rankOffsetLeft: 10,
      rankOffsetTop: 8,
      rankColor: '#000000',
      rankFontFamily: 'Anton, Arial, sans-serif',
      rankFontSize: 42,
      longRankFontSize: 26,
      kitRankSafetyGap: 1,
      shirtNumberFontFamily: 'Oswald, Arial, sans-serif',
      shirtNumberFontSize: 16,
      shirtNumberScaleY: 0.88,
      shirtNumberStrokeThickness: 2,
      cardCornerRadius: 8,
      deckCornerRadius: 8
    });

    expect(getKitImageLayout()).toMatchObject({
      width: 76 * CARD_FACE_VISUAL_TUNING.kitScale,
      height: 88 * CARD_FACE_VISUAL_TUNING.kitScale,
      originX: 1,
      originY: 1
    });

    const sharedKitLayout = getKitImageLayout();
    const rankSafeBottom = getCardRankY() + getCardRankFontSize('A');
    const baseCenter = {
      x: KIT_CARD_FACE_WIDTH / 2 - 6 - 76 / 2,
      y: Math.round(KIT_CARD_FACE_HEIGHT / 2 - 6) - 88 / 2
    };
    const previousDefaultX = Math.round(KIT_CARD_FACE_WIDTH / 2 - 6) + (76 * 1.15 - 76) / 2;

    expect(sharedKitLayout.x - sharedKitLayout.width / 2).toBeCloseTo(
      baseCenter.x + CARD_FACE_VISUAL_TUNING.kitOffsetX,
      0
    );
    expect(sharedKitLayout.y).toBeLessThan(74.25);
    expect(sharedKitLayout.x).toBeLessThan(previousDefaultX);
    expect(sharedKitLayout.y - sharedKitLayout.height).toBeGreaterThanOrEqual(rankSafeBottom);
    expect(sharedKitLayout.y).toBeLessThanOrEqual(KIT_CARD_FACE_HEIGHT / 2);

    const squadPreviewSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'SquadSelectScene.ts'), 'utf8');
    expect(squadPreviewSource).not.toContain('kitLayoutVariant');
  });

  it('positions the shirt number in the centered upper third of the kit and omits missing numbers', () => {
    const layout = getShirtNumberLayout();
    const kitLayout = getKitImageLayout();
    const previewKitLayout = getKitImageLayout();
    const previewRenderedLayout = {
      ...previewKitLayout,
      width: 60,
      height: 88
    };
    const previewNumberLayout = getShirtNumberLayout(previewRenderedLayout);

    expect(layout.x).toBeCloseTo(Math.round(kitLayout.x - kitLayout.width * 0.5));
    expect(layout.y).toBeCloseTo(Math.round(kitLayout.y - kitLayout.height * 0.7));
    expect(layout.y).toBeLessThan(Math.round(kitLayout.y - kitLayout.height * 0.67));
    expect(layout.y).toBeLessThan(kitLayout.y - kitLayout.height / 2);
    expect(previewNumberLayout.x).toBeCloseTo(
      Math.round(previewRenderedLayout.x - previewRenderedLayout.width * 0.5)
    );
    expect(previewNumberLayout.y).toBeCloseTo(
      Math.round(previewRenderedLayout.y - previewRenderedLayout.height * 0.7)
    );
    expect(previewNumberLayout.y).toBeLessThan(previewRenderedLayout.y - previewRenderedLayout.height / 2);
    expect(previewNumberLayout.x).toBeGreaterThan(layout.x);
    expect(Number.isInteger(layout.x)).toBe(true);
    expect(Number.isInteger(layout.y)).toBe(true);
    expect(KIT_CARD_LAYOUT.shirtNumberFontSize).toBe(16);
    expect(KIT_CARD_LAYOUT.shirtNumberScaleY).toBe(0.88);
    expect(prepareKitCardFace({ rank: '9' })).toEqual({
      rank: '9',
      displayRank: '9',
      rankSuffix: '',
      shirtNumber: undefined,
      kitAsset: null
    });
  });

  it('keeps rank singular, suitless, and player names out of the permanent card face', () => {
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');
    const cardViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'CardView.ts'), 'utf8');

    expect(kitFaceSource.match(/addRank/g)?.length).toBe(2);
    expect(kitFaceSource).toContain('private rankText: Phaser.GameObjects.Text | null = null');
    expect(kitFaceSource).toContain('this.rankText = scene.add');
    expect(kitFaceSource).not.toContain('CARD_HEIGHT / 2 -');
    expect(kitFaceSource).not.toContain('playerName');
    expect(cardViewSource).not.toContain('playerName');
    expect(cardViewSource).not.toContain('options.suit');
  });

  it('exposes a rank-only roll animation without changing closed card rendering', () => {
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');
    const cardViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'CardView.ts'), 'utf8');

    expect(kitFaceSource).toContain('export interface RankRollOptions');
    expect(kitFaceSource).toContain('this.rankText.setText(label.main)');
    expect(kitFaceSource).toContain('this.rankText.setFontSize(getCardRankFontSize(label.main))');
    expect(kitFaceSource).not.toContain('this.rankText.setScale');
    expect(kitFaceSource).toContain('steps?: readonly string[]');
    expect(kitFaceSource).toContain('this.scene.tweens.add({');
    expect(kitFaceSource).toContain('this.setDisplayRank(targetRank)');
    expect(cardViewSource).toContain('private faceView: KitCardFaceView | null = null');
    expect(cardViewSource).toContain('public setDisplayRank(rank: string): void');
    expect(cardViewSource).toContain('public animateDisplayRankRoll(targetRank: string');
    expect(cardViewSource).toContain('this.faceView?.animateRankRoll(targetRank, options) ?? Promise.resolve()');
    expect(cardViewSource).toContain('options.faceDown === true');
  });

  it('maps only visible Jack and Joker labels while preserving internal ranks', () => {
    expect(getCardRankDisplayLabel('J')).toBe('V');
    expect(getCardRankDisplayLabel('JOKER')).toBe('J');
    expect(getCardRankDisplayLabel('Q')).toBe('Q');
    expect(getCardRankDisplayLabel('10')).toBe('10');
    expect(prepareKitCardFace({ rank: 'J' })).toMatchObject({ rank: 'J', displayRank: 'V' });
    expect(prepareKitCardFace({ rank: 'JOKER' })).toMatchObject({ rank: 'JOKER', displayRank: 'J' });
  });

  it('composes expanded special-rank labels while leaving numeric ranks suffixless', () => {
    expect(getCardRankVisualLabel('JOKER')).toEqual({ main: 'J', suffix: 'oker' });
    expect(getCardRankVisualLabel('A')).toEqual({ main: 'A', suffix: 'ce' });
    expect(getCardRankVisualLabel('K')).toEqual({ main: 'K', suffix: 'ing' });
    expect(getCardRankVisualLabel('J')).toEqual({ main: 'V', suffix: 'alet' });
    expect(getCardRankVisualLabel('Q')).toEqual({ main: 'Q', suffix: 'ueen' });
    expect(getCardRankVisualLabel('10')).toEqual({ main: '10', suffix: '' });
    expect(prepareKitCardFace({ rank: 'J' })).toMatchObject({ rank: 'J', displayRank: 'V', rankSuffix: 'alet' });
    expect(prepareKitCardFace({ rank: 'JOKER' })).toMatchObject({ rank: 'JOKER', displayRank: 'J', rankSuffix: 'oker' });
  });

  it('uses shared smaller top-aligned suffix typography inside the card and above the kit', () => {
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');
    const labelStartX = -KIT_CARD_FACE_WIDTH / 2 + KIT_CARD_LAYOUT.rankOffsetLeft;
    const kitTop = getKitImageLayout().y - getKitImageLayout().height;

    expect(CARD_FACE_VISUAL_TUNING.rankSuffixScale).toBe(0.4);
    expect(CARD_FACE_VISUAL_TUNING.rankSuffixGap).toBe(3);
    expect(CARD_FACE_VISUAL_TUNING.rankSuffixOffsetY).toBe(0);
    expect(getCardRankSuffixFontSize('Q')).toBeLessThan(getCardRankFontSize('Q'));
    expect(labelStartX).toBeGreaterThanOrEqual(-KIT_CARD_FACE_WIDTH / 2);
    expect(getCardRankY() + getCardRankSuffixFontSize('Q')).toBeLessThan(kitTop);
    expect(kitFaceSource).toContain('px(this.rankText.width + CARD_FACE_VISUAL_TUNING.rankSuffixGap)');
    expect(kitFaceSource).toContain('px(CARD_FACE_VISUAL_TUNING.rankSuffixOffsetY)');
    expect(kitFaceSource).toContain('.setOrigin(0, 0)');
    expect(kitFaceSource).toContain('this.rankLabelContainer.add(suffixText)');
  });

  it('uses one visual scale contract for every normal and Joker rank', () => {
    const previousRankFontSize = 42;
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', 'JOKER'];

    expect(CARD_FACE_VISUAL_TUNING.rankScale).toBe(0.8);
    expect(CARD_FACE_VISUAL_TUNING.rankOffsetY).toBe(-5);
    expect(CARD_FACE_VISUAL_TUNING.rankSuffixScale).toBe(0.4);
    expect(CARD_FACE_VISUAL_TUNING.kitScale).toBe(1.2);
    expect(CARD_FACE_VISUAL_TUNING.kitOffsetX).toBe(-4);
    expect(CARD_FACE_VISUAL_TUNING.kitOffsetY).toBe(-5);
    expect(getCardRankFontSize('A')).toBe(previousRankFontSize * 0.8);
    const previousRankY = Math.round(-KIT_CARD_FACE_HEIGHT / 2 + KIT_CARD_LAYOUT.rankOffsetTop);
    expect(getCardRankY()).toBe(previousRankY + CARD_FACE_VISUAL_TUNING.rankOffsetY);
    expect(getCardRankY()).toBeGreaterThan(-KIT_CARD_FACE_HEIGHT / 2);
    for (const rank of ranks) {
      const label = getCardRankDisplayLabel(rank);
      expect(getCardRankFontSize(label)).toBe(previousRankFontSize * CARD_FACE_VISUAL_TUNING.rankScale);
    }
  });

  it('scales the shared kit layout uniformly without changing its aspect ratio', () => {
    const base = { width: 76, height: 88, centerX: 10, centerY: 24 };
    const layout = getKitImageLayout();

    expect(layout.width).toBeCloseTo(base.width * CARD_FACE_VISUAL_TUNING.kitScale, 0);
    expect(layout.height).toBeCloseTo(base.height * CARD_FACE_VISUAL_TUNING.kitScale, 0);
    expect(layout.width / layout.height).toBeCloseTo(base.width / base.height, 2);
    expect(layout.x - layout.width * layout.originX + layout.width / 2).toBeCloseTo(
      base.centerX + CARD_FACE_VISUAL_TUNING.kitOffsetX,
      0
    );
    expect(layout.y - layout.height * layout.originY + layout.height / 2).toBeLessThan(base.centerY);
  });

  it('removes the decorative inner frame for normal and Joker face cards', () => {
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');
    const faceModelSource = readFileSync(join(process.cwd(), 'src', 'ui', 'kitCardFaceModel.ts'), 'utf8');

    expect(kitFaceSource).not.toContain('createSegmentedInnerFrame');
    expect(kitFaceSource).not.toContain('CARD_INNER_FRAME');
    expect(kitFaceSource).not.toContain('HexStringToColor');
    expect(faceModelSource).not.toContain('CARD_INNER_FRAME');
    expect(faceModelSource).not.toContain('#818894');
    expect(faceModelSource).not.toContain('#F0C95A');
  });

  it('does not derive or render card-face flags while other team UI retains flag support', () => {
    const fieldFace = prepareKitCardFace({ rank: 'JOKER', playerProfile: getFieldCardPlayerProfile('pl', 'JOKER') });
    const goalkeeperFace = prepareKitCardFace({
      rank: 'A',
      playerProfile: {
        role: 'goalkeeper',
        teamId: 'ua',
        goalkeeperRank: 'A',
        playerName: 'Goalkeeper',
        shirtNumber: 1
      }
    });

    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');
    const modelSource = readFileSync(join(process.cwd(), 'src', 'ui', 'kitCardFaceModel.ts'), 'utf8');
    const scoreSource = readFileSync(join(process.cwd(), 'src', 'ui', 'ScoreView.ts'), 'utf8');

    expect(fieldFace).not.toHaveProperty('flagTextureKey');
    expect(goalkeeperFace).not.toHaveProperty('flagTextureKey');
    expect(kitFaceSource).not.toContain('flagTextureKey');
    expect(kitFaceSource).not.toContain('outline.fillRect');
    expect(modelSource).not.toContain('getFlagAssetKey');
    expect(scoreSource).toContain('flagCode');
  });

  it('uses resolver number colors and outlines while keeping closed cards unchanged', () => {
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');
    const cardViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'CardView.ts'), 'utf8');
    const deckViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'DeckView.ts'), 'utf8');

    expect(kitFaceSource).toContain('options.kitAsset?.numberColor');
    expect(kitFaceSource).toContain('options.kitAsset?.numberStrokeColor');
    expect(kitFaceSource).not.toContain('options.kitAsset?.shirtNumberColor');
    expect(kitFaceSource).not.toContain('options.kitAsset?.shirtNumberStrokeColor');
    expect(kitFaceSource).toContain('getGoalkeeperNumberColor(options.kitTextureKey)');
    expect(kitFaceSource).toContain("kitTextureKey === 'kit-gk1' || kitTextureKey === 'kit-gk2'");
    expect(kitFaceSource).toContain("'#FFFFFF'");
    expect(kitFaceSource).toContain('KIT_CARD_LAYOUT.shirtNumberFontFamily');
    expect(kitFaceSource).toContain('fontSize: `${KIT_CARD_LAYOUT.shirtNumberFontSize}px`');
    expect(kitFaceSource).toContain("fontStyle: '600'");
    expect(kitFaceSource).toContain('.setScale(1, KIT_CARD_LAYOUT.shirtNumberScaleY)');
    expect(kitFaceSource).not.toContain('this.rankText.setScale');
    expect(kitFaceSource).not.toContain('image.setScale(1, KIT_CARD_LAYOUT.shirtNumberScaleY)');
    expect(kitFaceSource).toContain('stroke,');
    expect(kitFaceSource).toContain(
      'strokeThickness: stroke === undefined ? 0 : KIT_CARD_LAYOUT.shirtNumberStrokeThickness'
    );
    expect(deckViewSource).toContain('createRoundedDeckCard');
    expect(deckViewSource).toContain('createRoundedDeckBorder');
    expect(deckViewSource).toContain('KIT_CARD_LAYOUT.deckCornerRadius');
    expect(cardViewSource).toContain('options.faceDown === true');
    expect(cardViewSource).toContain('coverTextureKey');
    expect(cardViewSource).toContain('fitImageContain');
    expect(cardViewSource).not.toContain('kitLayoutVariant');
    expect(cardViewSource).not.toContain('flagTextureKey');
    expect(cardViewSource).toContain('createRoundedCardBack');
    expect(cardViewSource).toContain('createRoundedCardBorder');
    expect(cardViewSource).toContain('KIT_CARD_LAYOUT.cardCornerRadius');
    expect(cardViewSource).toContain("faceDownVariant?: 'deck' | 'preview' | 'squad-preview'");
    expect(cardViewSource).toContain("options.faceDownVariant ?? 'deck'");
    expect(cardViewSource).toContain("faceDownVariant === 'preview'");
    expect(cardViewSource).toContain("faceDownVariant === 'squad-preview'");
    expect(cardViewSource).toContain('usesNeutralPreviewBorder ? 0x1f2a2e : 0x7bb8d8');
    expect(cardViewSource).toContain('isPreview ? 0xffffff : 0x214f6b');
    expect(cardViewSource).toContain('createRoundedCardBack(scene, 0x17384c, 0x1f2a2e, 2, -10, 10)');
    expect(cardViewSource).toContain('const coverInset = isSquadPreview ? 0 : 8');
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

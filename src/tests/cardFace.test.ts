import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDefaultSquad } from '../data/defaultSquads';
import { saveSquad } from '../services/squadStorage';
import { getCardTooltipText, getFieldCardPlayerProfile } from '../ui/cardPlayerProfile';
import { getFallbackKitColors } from '../ui/kitFallback';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  public get length(): number {
    return this.values.size;
  }

  public clear(): void {
    this.values.clear();
  }

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const originalLocalStorage = globalThis.localStorage;

describe('card face profile resolver', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage()
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage
    });
  });

  it('resolves a field card profile from the default squad by team id and rank', () => {
    expect(getFieldCardPlayerProfile('pl', '9')).toEqual({
      teamId: 'pl',
      rank: '9',
      playerName: 'Игрок 9',
      shirtNumber: 9
    });
  });

  it('resolves a field card profile from a saved squad', () => {
    const squad = createDefaultSquad('pl');
    squad.fieldPlayers.Q.name = 'Custom Q';
    squad.fieldPlayers.Q.shirtNumber = 21;
    saveSquad(squad);

    expect(getFieldCardPlayerProfile('pl', 'Q')).toEqual({
      teamId: 'pl',
      rank: 'Q',
      playerName: 'Custom Q',
      shirtNumber: 21
    });
  });

  it('formats tooltip text without exposing data on closed cards', () => {
    expect(getCardTooltipText(getFieldCardPlayerProfile('pl', 'A'))).toBe('Игрок A\n№17\nНоминал: A');
  });
});

describe('kit card face rendering contracts', () => {
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

    expect(cardViewSource).toContain('KitCardFaceView');
    expect(cardViewSource).toContain('CardTooltipView');
    expect(cardViewSource).toContain('options.faceDown === true');
    expect(cardViewSource).toContain('playerProfile');
  });

  it('renders a white card face with top-left rank and fallback kit geometry', () => {
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');

    expect(kitFaceSource).toContain('0xffffff');
    expect(kitFaceSource).toContain('-CARD_WIDTH / 2 + 9');
    expect(kitFaceSource).toContain('-CARD_HEIGHT / 2 + 8');
    expect(kitFaceSource).toContain('fillRoundedRect');
    expect(kitFaceSource).toContain('fillTriangle');
    expect(kitFaceSource).not.toContain('suit');
  });

  it('passes player profiles to field cards and active attack cards without changing game rules', () => {
    const fieldViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'FieldView.ts'), 'utf8');
    const deckViewSource = readFileSync(join(process.cwd(), 'src', 'ui', 'DeckView.ts'), 'utf8');
    const gameSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'GameScene.ts'), 'utf8');
    const bootSceneSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'BootScene.ts'), 'utf8');
    const kitFaceSource = readFileSync(join(process.cwd(), 'src', 'ui', 'KitCardFaceView.ts'), 'utf8');

    expect(fieldViewSource).toContain('state.matchSetups[player.id]');
    expect(fieldViewSource).toContain("position.positionId === 'goalkeeper'");
    expect(fieldViewSource).toContain('getTeamKitAssetKey(setup.teamId, setup.fieldKit)');
    expect(fieldViewSource).toContain('getGoalkeeperKitAssetKey(setup.goalkeeperKitId)');
    expect(deckViewSource).toContain('attackCardPlayerProfile');
    expect(deckViewSource).toContain('attackCardKitTextureKey');
    expect(gameSceneSource).toContain('resolveFieldCardProfile(state, player, state.attackCard)');
    expect(gameSceneSource).toContain('resolveFieldKitTextureKey(state, player)');
    expect(gameSceneSource).toContain('getTeamKitAssetKey(setup.teamId, setup.fieldKit)');
    expect(bootSceneSource).toContain('loadAvailableKitTextures(this)');
    expect(kitFaceSource).toContain('scene.textures.exists(options.kitTextureKey)');
    expect(kitFaceSource).toContain('this.add(image)');
  });
});

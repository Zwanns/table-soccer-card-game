import { EventEmitter } from 'node:events';
import type Phaser from 'phaser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CardView, CARD_HEIGHT, CARD_WIDTH } from '../ui/CardView';
import { CardTooltipView } from '../ui/CardTooltipView';
import { fitPlayerTooltipText, getPlayerTooltipLayout, getPlayerTooltipSize, PLAYER_TOOLTIP_CARD_GAP,
  PLAYER_TOOLTIP_FONT_SIZE, PLAYER_TOOLTIP_MIN_HEIGHT, PLAYER_TOOLTIP_VIEWPORT_INSET,
  TOOLTIP_PADDING_X, TOOLTIP_PADDING_Y } from '../ui/cardTooltipLayout';
import { MATCH_TOOLTIP_VIEWPORT } from '../ui/matchScreenLayout';

const ui = vi.hoisted(() => ({ mobile: false }));
vi.mock('../ui/mobileLayout', () => ({ isMobileLandscapeLayout: () => ui.mobile }));
beforeEach(() => { ui.mobile = false; });

vi.mock('phaser', () => ({ default: { GameObjects: { Container: class extends EventEmitter {
  list: any[] = [];
  scaleX = 1;
  scaleY = 1;
  input = undefined;
  depth = 0;
  width = 0;
  height = 0;
  destroyed = false;
  constructor(public scene: unknown, public x: number, public y: number) { super(); }
  add(objects: unknown | unknown[]) { this.list.push(...[objects].flat()); return this; }
  setDepth(depth: number) { this.depth = depth; return this; }
  setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
  setSize(width: number, height: number) { this.width = width; this.height = height; return this; }
  getWorldTransformMatrix() {
    return { transformPoint: (x: number, y: number) => ({ x: this.x + x * this.scaleX, y: this.y + y * this.scaleY }) };
  }
  destroy() { this.destroyed = true; }
} } } }));
vi.mock('../ui/KitCardFaceView', () => ({ KitCardFaceView: class {} }));

const viewport = { x: 0, y: 0, width: 1600, height: 720 };
const size = { width: 240, height: 56 };
const profile = { teamId: 'pl', rank: 'A' as const, playerName: 'Jan Kowalski', shirtNumber: 10 };

describe('player tooltip geometry', () => {
  it.each([132.84, 215, 325.75, 500])('touches the mobile card top at %s without covering the card', (y) => {
    const card = { x: 740, y, width: 120, height: 166 };
    const layout = getPlayerTooltipLayout(card, size, viewport, true);
    expect(layout.placement).toBe('above');
    expect(card.y - (layout.y + layout.height)).toBeGreaterThanOrEqual(0);
    expect(card.y - (layout.y + layout.height)).toBeLessThan(1);
    expect(layout.x + layout.width / 2).toBe(card.x + card.width / 2);
    expect(layout.y).toBeGreaterThanOrEqual(PLAYER_TOOLTIP_VIEWPORT_INSET);
  });

  it('keeps a mobile top-edge tooltip within the screen without covering its card', () => {
    const card = { x: 740, y: 18, width: 120, height: 166 };
    const layout = getPlayerTooltipLayout(card, size, viewport, true);
    expect(layout.placement).toBe('below');
    expect(layout.y).toBe(card.y + card.height);
    expect(layout.y).toBeGreaterThanOrEqual(PLAYER_TOOLTIP_VIEWPORT_INSET);
  });

  it('centers above a normal card using its bounds, with a 24px gap', () => {
    const card = { x: 740, y: 320, width: 120, height: 166 };
    const layout = getPlayerTooltipLayout(card, size, viewport);
    expect(layout).toEqual({ x: 680, y: 240, ...size, placement: 'above' });
    expect(layout.x + layout.width / 2).toBe(card.x + card.width / 2);
    expect(card.y - (layout.y + layout.height)).toBe(PLAYER_TOOLTIP_CARD_GAP);
  });

  it.each([0, 1480])('clamps a card at horizontal edge %s inside the viewport', (x) => {
    const layout = getPlayerTooltipLayout({ x, y: 320, width: 120, height: 166 }, size, viewport);
    expect(layout.x).toBe(x === 0 ? 12 : 1348);
    expect(layout.x).toBeGreaterThanOrEqual(12);
    expect(layout.x + layout.width).toBeLessThanOrEqual(1588);
    expect(layout.placement).toBe('above');
  });

  it('falls below a top-edge card and leaves the entire card clear', () => {
    const card = { x: 740, y: 18, width: 120, height: 166 };
    const layout = getPlayerTooltipLayout(card, size, viewport);
    expect(layout.placement).toBe('below');
    expect(layout.y).toBe(card.y + card.height + 24);
  });

  it('avoids the match header for the top midfielder row', () => {
    const card = { x: 535, y: 215 - CARD_HEIGHT * 1.12 / 2, width: CARD_WIDTH * 1.12, height: CARD_HEIGHT * 1.12 };
    const layout = getPlayerTooltipLayout(card, size, MATCH_TOOLTIP_VIEWPORT);
    expect(layout.placement).toBe('below');
    expect(layout.y).toBeGreaterThan(card.y + card.height);
    expect(layout.y).toBeGreaterThan(MATCH_TOOLTIP_VIEWPORT.y);
  });

  it.each([viewport, { x: 240, y: 104, width: 1120, height: 596 }, { x: 25, y: 110, width: 260, height: 180 }])(
    'keeps sized tooltips inside viewport %j, including fractional and edge cards', (view) => {
      const dimensions = getPlayerTooltipSize(2000, 33, view);
      for (const x of [view.x, view.x + 40.3, view.x + view.width - 108]) {
        for (const y of [view.y, view.y + 90.7, view.y + view.height - 166]) {
          const layout = getPlayerTooltipLayout({ x, y, width: 108, height: 166 }, dimensions, view);
          expect(layout.x).toBeGreaterThanOrEqual(view.x + PLAYER_TOOLTIP_VIEWPORT_INSET);
          expect(layout.y).toBeGreaterThanOrEqual(view.y + PLAYER_TOOLTIP_VIEWPORT_INSET);
          expect(layout.x + layout.width).toBeLessThanOrEqual(view.x + view.width - PLAYER_TOOLTIP_VIEWPORT_INSET);
          expect(layout.y + layout.height).toBeLessThanOrEqual(view.y + view.height - PLAYER_TOOLTIP_VIEWPORT_INSET);
          expect(Number.isInteger(layout.x) && Number.isInteger(layout.y)).toBe(true);
        }
      }
    });

  it('increases readability and constrains natural name widths without scaling', () => {
    expect(PLAYER_TOOLTIP_FONT_SIZE).toBeGreaterThan(14);
    expect(TOOLTIP_PADDING_X).toBeGreaterThan(12);
    expect(TOOLTIP_PADDING_Y).toBeGreaterThan(8);
    expect(PLAYER_TOOLTIP_MIN_HEIGHT).toBeGreaterThan(14 + 8 * 2);
    expect(getPlayerTooltipSize(30, 32, viewport)).toEqual({ width: 140, height: 56 });
    expect(getPlayerTooltipSize(181.5, 33, viewport)).toEqual({ width: 222, height: 57 });
    expect(getPlayerTooltipSize(900, 32, viewport)).toEqual({ width: 400, height: 56 });
  });

  it('preserves fitting names and ellipsizes long Unicode names using measured glyphs', () => {
    const measure = (text: string) => Array.from(text).reduce((width, char) => width + (char === 'W' ? 30 : 10), 0);
    expect(fitPlayerTooltipText('Kowalski', 100, measure)).toBe('Kowalski');
    expect(fitPlayerTooltipText('WWWWW', 80, measure)).toBe('WW…');
    expect(fitPlayerTooltipText('😀😀😀😀😀😀😀😀', 50, measure)).toBe('😀😀😀😀…');
  });
});

function sceneMock() {
  const tooltips: CardTooltipView[] = [];
  const node = (x: number, y: number, text = '', font = 28) => Object.assign(new EventEmitter(), {
    x, y, text, width: text.length * font * 0.6, height: font + 4, input: undefined as unknown,
    context: { measureText: (value: string) => ({ width: value.length * font * 0.6 }) },
    originX: 0.5, originY: 0.5,
    setText(value: string) { this.text = value; this.width = value.length * font * 0.6; return this; },
    setOrigin(x: number, y = x) { this.originX = x; this.originY = y; return this; },
    setInteractive() { this.input = { enabled: true }; return this; }
  });
  const scene = { cameras: { main: { worldView: viewport } }, add: {
    text: (x: number, y: number, text: string, style: { fontSize: string }) => node(x, y, text, parseInt(style.fontSize)),
    rectangle: (x: number, y: number, width: number, height: number) => Object.assign(node(x, y), { width, height }),
    existing: (object: unknown) => { if (object instanceof CardTooltipView) tooltips.push(object); }
  } } as unknown as Phaser.Scene;
  return { scene, tooltips };
}

describe('player tooltip integration and input', () => {
  it.each(['A', 'GK'])('keeps the mobile %s tooltip directly above transformed top-row cards', (label) => {
    ui.mobile = true;
    const { scene, tooltips } = sceneMock();
    const card = new CardView(scene, 800, 215, { rank: 'A', label, playerProfile: profile,
      tooltipViewport: MATCH_TOOLTIP_VIEWPORT });
    card.scaleX = card.scaleY = 1.12;
    card.list.at(-1)!.emit('pointerover');
    const tip = tooltips[0];
    const cardTop = 215 - CARD_HEIGHT * 1.12 / 2;
    expect(cardTop - (tip.y + tip.height)).toBeGreaterThanOrEqual(0);
    expect(cardTop - (tip.y + tip.height)).toBeLessThan(1);
    expect(tip.y).toBeGreaterThanOrEqual(PLAYER_TOOLTIP_VIEWPORT_INSET);
    expect(Math.abs(tip.x + tip.width / 2 - 800)).toBeLessThanOrEqual(0.5);
  });

  it('uses transformed card corners and stays at scene scale rather than card scale', () => {
    const { scene, tooltips } = sceneMock();
    const card = new CardView(scene, 800, 400, { rank: 'A', playerProfile: profile });
    card.scaleX = card.scaleY = 1.12;
    card.list.at(-1)!.emit('pointerover', { worldX: 20, worldY: 30 });
    const tooltip = tooltips[0];
    expect(Math.abs(tooltip.x + tooltip.width / 2 - 800)).toBeLessThanOrEqual(0.5);
    expect(tooltip.y + tooltip.height).toBeLessThanOrEqual(400 - CARD_HEIGHT * 1.12 / 2 - 24);
    expect([tooltip.scaleX, tooltip.scaleY]).toEqual([1, 1]);
    expect(tooltip.input).toBeUndefined();
    expect(tooltip.list.every(child => child.input === undefined)).toBe(true);
    expect(tooltip.parentContainer).toBeUndefined();
  });

  it.each(['pointerout', 'pointerup', 'pointerupoutside'])('preserves hover/hold and dismisses on %s without consuming a click', (event) => {
    const { scene, tooltips } = sceneMock();
    const click = vi.fn();
    const card = new CardView(scene, 800, 400, { rank: 'A', playerProfile: profile, onClick: click });
    const hit = card.list.at(-1)!;
    hit.emit('pointerover'); hit.emit('pointerover');
    expect(tooltips).toHaveLength(1);
    hit.emit('pointerdown');
    expect(click).toHaveBeenCalledOnce();
    hit.emit(event);
    expect(Reflect.get(tooltips[0], 'destroyed')).toBe(true);
    hit.emit('pointerover');
    expect(tooltips).toHaveLength(2);
    card.destroy();
    expect(Reflect.get(tooltips[1], 'destroyed')).toBe(true);
  });

  it('keeps tooltip opt-out and missing player identity behavior', () => {
    const { scene, tooltips } = sceneMock();
    for (const options of [{ tooltipEnabled: false, playerProfile: profile }, {}]) {
      const card = new CardView(scene, 800, 400, { rank: 'A', onClick: vi.fn(), ...options });
      card.list.at(-1)!.emit('pointerover');
    }
    expect(tooltips).toHaveLength(0);
  });

  it('renders a bounded single line even for an extremely long surname', () => {
    const { scene } = sceneMock();
    const tooltip = new CardTooltipView(scene, { x: 1480, y: 300, width: 108, height: 166 }, viewport,
      { ...profile, playerName: 'W'.repeat(100) });
    const background = tooltip.list[0] as Phaser.GameObjects.Rectangle;
    const text = tooltip.list[1] as Phaser.GameObjects.Text;
    expect(tooltip.width).toBe(400);
    expect(text.text.endsWith('…')).toBe(true);
    expect(text.width + TOOLTIP_PADDING_X * 2).toBeLessThanOrEqual(background.width);
    expect(text.text).not.toContain('\n');
    expect(tooltip.x + tooltip.width).toBe(1588);
  });
});

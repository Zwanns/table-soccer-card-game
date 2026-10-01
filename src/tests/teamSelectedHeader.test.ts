import { getMobileKitCardLayout } from '../ui/mobileKitSelectorLayout';
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { TeamSelectScene } from '../scenes/TeamSelectScene';
import { createSelectedTeamNameLayout, createSelectedTeamHeaderLayout, SELECTED_COVER_FAN_MOBILE_CARD_SCALE, createTeamScreenLayout, rectCenter, rectRight } from '../ui/teamScreenLayout';

vi.mock('phaser', () => ({ default: { Scene: class {}, GameObjects: { Container: class {} } } }));

const renderedCards = vi.hoisted(() => [] as { x: number; y: number; scale: number; angle: number; options: object }[]);
vi.mock('../ui/CardView', () => ({ CardView: class {
  scale = 1;
  angle = 0;
  constructor(_scene: unknown, public x: number, public y: number, public options: object) { renderedCards.push(this); }
  setScale(scale: number) { this.scale = scale; }
  setAngle(angle: number) { this.angle = angle; }
} }));

class DisplayObject extends EventEmitter {
  children: DisplayObject[] = [];
  width = 0;
  height = 0;
  origin: number[] = [];
  interactive = false;
  fillColor = 0;
  fillAlpha = 1;
  constructor(public x = 0, public y = 0, public text = '', public style: Record<string, unknown> = {}) { super(); }
  add(children: DisplayObject | DisplayObject[]) { this.children.push(...[children].flat()); return this; }
  setSize(width: number, height: number) { this.width = width; this.height = height; return this; }
  setOrigin(...origin: number[]) { this.origin = origin; return this; }
  setInteractive() { this.interactive = true; return this; }
  setStrokeStyle = vi.fn(() => this);
  setDepth() { return this; }
}

function renderHeader(mobileWide: boolean, mode: 'match' | 'penalty') {
  const scene = new TeamSelectScene();
  scene.init({ mode });
  const panels: DisplayObject[] = [];
  const labels: DisplayObject[] = [];
  const start = vi.fn();
  const render = vi.fn();
  Object.assign(scene, {
    textures: { exists: () => true },
    createSelectedTeamCoverFan: (x: number, y: number) => new DisplayObject(x, y),
    render,
    showMessage: vi.fn(),
    scene: { start },
    add: {
      container: (x: number, y: number) => { const panel = new DisplayObject(x, y); panels.push(panel); return panel; },
      rectangle: (x: number, y: number, w: number, h: number, fillColor: number, fillAlpha: number) =>
        Object.assign(new DisplayObject(x, y).setSize(w, h), { fillColor, fillAlpha }),
      text: (x: number, y: number, text: string, style: Record<string, unknown>) => {
        const label = new DisplayObject(x, y, text, style);
        labels.push(label);
        return label;
      }
    }
  });
  const layout = createTeamScreenLayout({ mobileWide });
  for (const slot of [1, 2] as const) {
    Reflect.get(scene, 'createSelectedPanel').call(scene,
      layout[`team${slot}SelectedCardRect`], layout[`team${slot}CoverFanRect`],
      layout[`team${slot}ControllerToggleRect`], layout, `Player ${slot}`,
      { name: slot === 1 ? 'Northern Ireland' : 'France', flagCode: slot === 1 ? 'nir' : 'fr' }, slot);
  }
  return { scene, layout, labels, panels: [panels[0], panels[2]], start, render };
}

describe.each(['match', 'penalty'] as const)('%s selected header', (mode) => {
  it.each([true, false])('renders the shared name contract and preserves desktop styling (mobile=%s)', (mobile) => {
    const { layout, panels, labels } = renderHeader(mobile, mode);
    for (const label of labels.filter(label => /^Player [12]$/.test(label.text))) {
      expect(label.style).toMatchObject({ fontSize: mobile ? '28px' : '17px', color: mobile ? '#ffffff' : '#d9eadf' });
      expect(label.origin).toEqual([mobile && label.text === 'Player 2' ? 0 : 1, 0.5]);
      const panel = layout[label.text === 'Player 1' ? 'team1SelectedCardRect' : 'team2SelectedCardRect'];
      expect(label.x).toBe(mobile && label.text === 'Player 2' ? panel.x : rectRight(panel));
      expect(label.y).toBe(panel.y - (mobile && label.text === 'Player 2' ? 28 : 16));
    }
    for (const [index, panel] of panels.entries()) {
      const slot = index === 0 ? 1 : 2;
      const rect = layout[`team${slot}SelectedCardRect`];
      const fan = layout[`team${slot}CoverFanRect`];
      const toggle = layout[`team${slot}ControllerToggleRect`];
      const name = panel.children[2];
      const header = createSelectedTeamHeaderLayout(rect, fan, slot, mobile);
      expect(panel.x + panel.children[1].x).toBe(header.fanCenter.x);
      expect(panel.y + panel.children[1].y).toBe(header.fanCenter.y);
      expect(panel.children[0]).toMatchObject({ fillColor: mobile ? 0x1c1c1c : 0x08120f, fillAlpha: 0.92 });
      expect(panel.children[0].setStrokeStyle).toHaveBeenCalledWith(slot === 1 ? 4 : 2, 0x8f9a96, 0.95);
      expect(name.style.color).toBe(mobile ? '#ffffff' : '#d9eadf');
      const contract = createSelectedTeamNameLayout(rect, fan, toggle, mobile);
      expect(name.style).toMatchObject(contract.style);
      expect(name.style).toMatchObject({ fontSize: mobile ? '34px' : '26px', fontFamily: 'Arial, sans-serif', fontStyle: '700' });
      expect(name.origin).toEqual([0, 0.5]);
      expect(name.y).toBe(0);
      expect(panel.x + name.x).toBe(mobile && slot === 2 ? rectRight(toggle) + 14 : rectRight(fan) + 18);
      if (mobile) {
        expect(name.style).toMatchObject({ wordWrap: { width: 220, useAdvancedWrap: true }, maxLines: 2, lineSpacing: -2 });
        expect(panel.x + name.x + contract.style.wordWrap.width).toBe(slot === 2 ? fan.x - 18 : toggle.x - 14);
        expect(rectCenter(rect).y).toBe(panel.y);
      } else {
        expect(contract.style).toEqual({ fontSize: '26px', wordWrap: { width: 260 } });
        expect(name.x).toBe(-68);
      }
      const badges = panel.children[3].children.filter((child) => child.text);
      expect(badges.map((badge) => badge.text)).toEqual([mobile ? 'PL' : 'Player', 'AI']);
      expect(badges.every((badge) => badge.style.fontSize === (mobile ? '26px' : '12px'))).toBe(true);
    }
    if (mobile) {
      expect(panels[0].children[3].x).toBe(206);
      expect(panels[1].children[3].x).toBe(-206);
      expect(panels[0].children[1].x).toBe(-157);
      expect(panels[1].children[1].x).toBe(157);
      expect(panels[1].children[2].x).toBe(-158);
    } else {
      expect(panels[0].children[2].x).toBe(panels[1].children[2].x);
    }
  });

  it('preserves mobile badge callbacks, independent slots, selection, and start data', () => {
    const { scene, panels, start, render } = renderHeader(true, mode);
    const event = { stopPropagation: vi.fn() };
    const badge = (side: number, ai: boolean) => panels[side].children[3].children[ai ? 1 : 0];
    for (const side of [0, 1]) {
      expect(badge(side, true)).toMatchObject({ width: 68, height: 50, interactive: true });
      expect(badge(side, false)).toMatchObject({ width: 68, height: 50, interactive: true });
      expect(badge(side, false).y).toBeLessThan(badge(side, true).y);
      expect(panels[side].x + panels[side].children[3].x).toBe(side === 0 ? 484 : 1116);
      badge(side, true).emit('pointerdown', {}, 0, 0, event);
      expect(Reflect.get(scene, `player${side + 1}ControllerType`)).toBe('AI');
    }
    badge(0, false).emit('pointerdown', {}, 0, 0, event);
    expect(Reflect.get(scene, 'player1ControllerType')).toBe('HUMAN');
    expect(Reflect.get(scene, 'player2ControllerType')).toBe('AI');
    expect(Reflect.get(scene, 'activeSlot')).toBe(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(3);
    expect(render).toHaveBeenCalledTimes(3);
    panels[1].emit('pointerdown');
    Reflect.get(scene, 'selectTeam').call(scene, 'Uzbekistan');
    expect(Reflect.get(scene, 'selectedTeamTwo')).toBe('Uzbekistan');
    Reflect.get(scene, 'selectTeam').call(scene, 'France');
    expect(Reflect.get(scene, 'selectedTeamTwo')).toBe('Uzbekistan');
    Reflect.get(scene, 'startMatch').call(scene);
    expect(start).toHaveBeenCalledWith(mode === 'match' ? 'GameScene' : 'TournamentPenaltyScene', expect.objectContaining({
      player1ControllerType: 'HUMAN', player2ControllerType: 'AI',
      ...(mode === 'match' ? { player2Name: 'Uzbekistan' } : { standalone: true, matchResult: expect.objectContaining({ awayTeamId: 'uz' }) })
    }));
  });
});


describe('KIT.SELECTOR.MOBILE.3.1 mirrored header geometry', () => {
  it.each([1, 2] as const)('keeps the enlarged three-card fan clear of the name, controls, labels and kits for slot %s', (slot) => {
    const layout = createTeamScreenLayout({ mobileWide: true });
    const panel = layout[`team${slot}SelectedCardRect`];
    const coverFan = layout[`team${slot}CoverFanRect`];
    const toggle = layout[`team${slot}ControllerToggleRect`];
    const header = createSelectedTeamHeaderLayout(panel, coverFan, slot, true);
    const name = createSelectedTeamNameLayout(panel, coverFan, toggle, true);
    expect(SELECTED_COVER_FAN_MOBILE_CARD_SCALE / 0.64).toBeCloseTo(1.09375);
    const scale = SELECTED_COVER_FAN_MOBILE_CARD_SCALE;
    for (const [index, angle] of [-9, 0, 9].entries()) {
      const radians = angle * Math.PI / 180;
      // Include the card border in rotated visual bounds.
      const halfWidth = scale * (110 * Math.cos(radians) + 150.5 * Math.abs(Math.sin(radians))) / 2;
      const halfHeight = scale * (150.5 * Math.cos(radians) + 110 * Math.abs(Math.sin(radians))) / 2;
      const x = header.fanCenter.x + [-36, 0, 36][index];
      expect(x - halfWidth).toBeGreaterThan(panel.x);
      expect(x + halfWidth).toBeLessThan(rectRight(panel));
      if (slot === 1) {
        expect(x + halfWidth).toBeLessThan(rectCenter(panel).x + name.x);
        expect(x + halfWidth).toBeLessThan(toggle.x);
      } else {
        expect(x - halfWidth).toBeGreaterThan(rectCenter(panel).x + name.x + name.style.wordWrap.width);
        expect(x - halfWidth).toBeGreaterThan(rectRight(toggle));
      }
      expect(header.fanCenter.y + halfHeight).toBeLessThan(layout.teamGridStartY);
      if (slot === 2) expect(header.fanCenter.y - halfHeight).toBeGreaterThan(header.label.y + 14);
      for (const active of [true, false]) {
        const kit = getMobileKitCardLayout(layout[`team${slot}KitPreviewRect`], slot, active);
        expect(slot === 1 ? x + halfWidth < kit.x : x - halfWidth > kit.x + kit.width).toBe(true);
      }
    }
  });

  it.each([false, true])('renders three cards with the correct scale and unchanged fan angles (mobile=%s)', (mobile) => {
    renderedCards.length = 0;
    const scene = new TeamSelectScene();
    Object.assign(scene, { add: { container: (x: number, y: number) => new DisplayObject(x, y) } });
    Reflect.get(scene, 'createSelectedTeamCoverFan').call(scene, 10, 20, 'cover-fixture', mobile);
    expect(renderedCards).toHaveLength(3);
    expect(renderedCards.map(card => card.scale)).toEqual(Array(3).fill(mobile ? 0.70 : 0.56));
    expect(renderedCards.map(card => card.x)).toEqual(mobile ? [-36, 0, 36] : [-34, 0, 34]);
    expect(renderedCards.map(card => card.angle)).toEqual([-9, 0, 9]);
    expect(renderedCards.every(card => card.y === 0)).toBe(true);
    for (const card of renderedCards) expect(card.options).toMatchObject({ faceDown: true, faceDownVariant: 'preview', coverTextureKey: 'cover-fixture' });
  });

  it('uses exact mirrored mobile coordinates while keeping Player 1 anchored', () => {
    const layout = createTeamScreenLayout({ mobileWide: true });
    expect(layout.team1SelectedCardRect).toEqual({ x: 38, y: 100, width: 480, height: 100 });
    expect(layout.team1ControllerToggleRect).toEqual({ x: 450, y: 100, width: 68, height: 100 });
    const first = createSelectedTeamHeaderLayout(layout.team1SelectedCardRect, layout.team1CoverFanRect, 1, true);
    expect(first).toEqual({ fanCenter: { x: 121, y: 147 }, label: { x: 518, y: 84, originX: 1, align: 'right' } });
    expect(layout.team2SelectedCardRect).toEqual({ x: 1082, y: 100, width: 480, height: 100 });
    expect(layout.team2ControllerToggleRect).toEqual({ x: 1082, y: 100, width: 68, height: 100 });
    const second = createSelectedTeamHeaderLayout(layout.team2SelectedCardRect, layout.team2CoverFanRect, 2, true);
    expect(second).toEqual({ fanCenter: { x: 1479, y: 147 }, label: { x: 1082, y: 72, originX: 0, align: 'left' } });
    const name = createSelectedTeamNameLayout(layout.team2SelectedCardRect, layout.team2CoverFanRect, layout.team2ControllerToggleRect, true);
    expect(rectCenter(layout.team2SelectedCardRect).x + name.x).toBe(1164);
    expect(name.style.wordWrap.width).toBe(220);
  });

  it('retains exact desktop anchors, label alignment and name geometry', () => {
    const layout = createTeamScreenLayout({ mobileWide: false });
    for (const slot of [1, 2] as const) {
      const panel = layout[`team${slot}SelectedCardRect`];
      const fan = layout[`team${slot}CoverFanRect`];
      const header = createSelectedTeamHeaderLayout(panel, fan, slot, false);
      expect(header).toEqual({ fanCenter: rectCenter(fan), label: { x: rectRight(panel), y: panel.y - 16, originX: 1, align: 'right' } });
      expect(fan).toEqual({ x: panel.x - 16, y: panel.y - 18, width: 150, height: 112 });
    }
  });
});

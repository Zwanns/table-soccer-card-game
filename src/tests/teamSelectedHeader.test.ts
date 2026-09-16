import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { TeamSelectScene } from '../scenes/TeamSelectScene';
import { createSelectedTeamNameLayout, createTeamScreenLayout, rectCenter, rectRight } from '../ui/teamScreenLayout';

vi.mock('phaser', () => ({ default: { Scene: class {}, GameObjects: { Container: class {} } } }));

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
  const start = vi.fn();
  const render = vi.fn();
  Object.assign(scene, {
    textures: { exists: () => true },
    createSelectedTeamCoverFan: () => new DisplayObject(),
    render,
    showMessage: vi.fn(),
    scene: { start },
    add: {
      container: (x: number, y: number) => { const panel = new DisplayObject(x, y); panels.push(panel); return panel; },
      rectangle: (x: number, y: number, w: number, h: number, fillColor: number, fillAlpha: number) =>
        Object.assign(new DisplayObject(x, y).setSize(w, h), { fillColor, fillAlpha }),
      text: (x: number, y: number, text: string, style: Record<string, unknown>) => new DisplayObject(x, y, text, style)
    }
  });
  const layout = createTeamScreenLayout({ mobileWide });
  for (const slot of [1, 2] as const) {
    Reflect.get(scene, 'createSelectedPanel').call(scene,
      layout[`team${slot}SelectedCardRect`], layout[`team${slot}CoverFanRect`],
      layout[`team${slot}ControllerToggleRect`], layout, `Player ${slot}`,
      { name: slot === 1 ? 'Northern Ireland' : 'France', flagCode: slot === 1 ? 'nir' : 'fr' }, slot);
  }
  return { scene, layout, panels: [panels[0], panels[2]], start, render };
}

describe.each(['match', 'penalty'] as const)('%s selected header', (mode) => {
  it.each([true, false])('renders the shared name contract and preserves desktop styling (mobile=%s)', (mobile) => {
    const { layout, panels } = renderHeader(mobile, mode);
    for (const [index, panel] of panels.entries()) {
      const slot = index === 0 ? 1 : 2;
      const rect = layout[`team${slot}SelectedCardRect`];
      const fan = layout[`team${slot}CoverFanRect`];
      const toggle = layout[`team${slot}ControllerToggleRect`];
      const name = panel.children[2];
      expect(panel.children[0]).toMatchObject({ fillColor: mobile ? 0x1c1c1c : 0x08120f, fillAlpha: 0.92 });
      expect(panel.children[0].setStrokeStyle).toHaveBeenCalledWith(slot === 1 ? 4 : 2, 0x8f9a96, 0.95);
      expect(name.style.color).toBe(mobile ? '#ffffff' : '#d9eadf');
      const contract = createSelectedTeamNameLayout(rect, fan, toggle, mobile);
      expect(name.style).toMatchObject(contract.style);
      expect(name.style).toMatchObject({ fontSize: mobile ? '34px' : '26px', fontFamily: 'Arial, sans-serif', fontStyle: '700' });
      expect(name.origin).toEqual([0, 0.5]);
      expect(name.y).toBe(0);
      expect(panel.x + name.x).toBe(rectRight(fan) + 18);
      if (mobile) {
        expect(name.style).toMatchObject({ wordWrap: { width: 248, useAdvancedWrap: true }, maxLines: 2, lineSpacing: -2 });
        expect(panel.x + name.x + contract.style.wordWrap.width).toBe(toggle.x - 14);
        expect(rectCenter(rect).y).toBe(panel.y);
      } else {
        expect(contract.style).toEqual({ fontSize: '26px', wordWrap: { width: 260 } });
        expect(name.x).toBe(-68);
      }
      const badges = panel.children[3].children.filter((child) => child.text);
      expect(badges.map((badge) => badge.text)).toEqual([mobile ? 'PL' : 'Player', 'AI']);
      expect(badges.every((badge) => badge.style.fontSize === (mobile ? '26px' : '12px'))).toBe(true);
    }
    expect(panels[0].children[2].x).toBe(panels[1].children[2].x);
  });

  it('preserves mobile badge callbacks, independent slots, selection, and start data', () => {
    const { scene, panels, start, render } = renderHeader(true, mode);
    const event = { stopPropagation: vi.fn() };
    const badge = (side: number, ai: boolean) => panels[side].children[3].children[ai ? 1 : 0];
    for (const side of [0, 1]) {
      expect(badge(side, true)).toMatchObject({ width: 68, height: 50, interactive: true });
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
    Reflect.get(scene, 'selectTeam').call(scene, 'Northern Ireland');
    expect(Reflect.get(scene, 'selectedTeamTwo')).toBe('Northern Ireland');
    Reflect.get(scene, 'selectTeam').call(scene, 'France');
    expect(Reflect.get(scene, 'selectedTeamTwo')).toBe('Northern Ireland');
    Reflect.get(scene, 'startMatch').call(scene);
    expect(start).toHaveBeenCalledWith(mode === 'match' ? 'GameScene' : 'TournamentPenaltyScene', expect.objectContaining({
      player1ControllerType: 'HUMAN', player2ControllerType: 'AI',
      ...(mode === 'match' ? { player2Name: 'Northern Ireland' } : { standalone: true, matchResult: expect.objectContaining({ awayTeamId: 'nir' }) })
    }));
  });
});

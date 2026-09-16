import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { TeamSelectScene } from '../scenes/TeamSelectScene';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import { createTeamCountryGridLayout, createTeamScreenLayout } from '../ui/teamScreenLayout';

vi.mock('phaser', () => ({ default: {
  Scene: class {},
  GameObjects: { Container: class {}, Events: { DESTROY: 'destroy' } },
  Scenes: { Events: { UPDATE: 'update' } },
  Math: { Clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)) }
} }));

class DisplayObject extends EventEmitter {
  width = 0;
  height = 0;
  scale = 1;
  children: DisplayObject[] = [];
  input = { enabled: false, hitArea: { width: 0, height: 0 } };
  mask: unknown;
  constructor(public x = 0, public y = 0, public data: unknown = undefined) { super(); }
  add(children: DisplayObject | DisplayObject[]) { this.children.push(...[children].flat()); return this; }
  setSize(width: number, height: number) { this.width = width; this.height = height; return this; }
  setDisplaySize(width: number, height: number) { return this.setSize(width, height); }
  setScale(scale: number) { this.scale = scale; return this; }
  setInteractive() { this.input = { enabled: true, hitArea: { width: this.width, height: this.height } }; return this; }
  setMask(mask: unknown) { this.mask = mask; return this; }
  setOrigin() { return this; }
  setStrokeStyle = vi.fn(() => this);
  setFillStyle = vi.fn(() => this);
  setAlpha() { return this; }
  setDepth() { return this; }
}

function renderGrid(mobile: boolean, mode: 'match' | 'penalty') {
  const scene = new TeamSelectScene();
  scene.init({ mode });
  const containers: DisplayObject[] = [];
  const fillRect = vi.fn();
  const mask = { fillStyle() { return this; }, fillRect, createGeometryMask() { return this; }, setVisible() {} };
  fillRect.mockReturnValue(mask);
  const selectTeam = vi.fn();
  Object.assign(scene, {
    selectTeam,
    events: new EventEmitter(),
    make: { graphics: () => mask },
    add: {
      container: (x: number, y: number, children: DisplayObject[] = []) => {
        const container = new DisplayObject(x, y).add(children);
        containers.push(container);
        return container;
      },
      rectangle: (x: number, y: number, width: number, height: number, color: number, alpha: number) => new DisplayObject(x, y, { color, alpha }).setSize(width, height),
      image: (x: number, y: number) => new DisplayObject(x, y),
      text: (x: number, y: number, text: string, style: unknown) => new DisplayObject(x, y, { text, style }),
      zone: (x: number, y: number, width: number, height: number) => new DisplayObject(x, y).setSize(width, height)
    }
  });
  const layout = createTeamScreenLayout({ mobileWide: mobile });
  Reflect.get(scene, 'createCountryGrid').call(scene, layout.teamGridRect, layout);
  return { content: containers[0], layout, selectTeam, fillRect };
}

describe.each([true, false])('country cards mobile=%s', (mobile) => {
  it.each(['match', 'penalty'] as const)('renders proportional %s cards with matching input bounds and no overlap', (mode) => {
    const { content, layout, fillRect } = renderGrid(mobile, mode);
    const grid = createTeamCountryGridLayout(layout, NATIONAL_TEAMS.length);
    expect(grid).toMatchObject(mobile
      ? { baseWidth: 180, baseHeight: 58, scale: 2, cardWidth: 360, cardHeight: 116, gapX: 24, gapY: 16, columns: 4, rowCount: 17, contentHeight: 2228, maxScroll: 1868, startX: 224 }
      : { baseWidth: 168, baseHeight: 58, scale: 1, cardWidth: 168, cardHeight: 58, gapX: 10, gapY: 8, columns: 8, rowCount: 9, contentHeight: 586, maxScroll: 226, startX: 177 });
    expect(fillRect).toHaveBeenCalledWith(layout.teamGridRect.x, 210, layout.teamGridRect.width, 360);
    expect(content.children).toHaveLength(66);
    for (const [index, card] of content.children.entries()) {
      expect(card.scale).toBe(1);
      expect(card.input.hitArea).toEqual({ width: grid.cardWidth, height: grid.cardHeight });
      const visuals = mobile ? card.children[0] : card;
      expect(visuals.scale).toBe(grid.scale);
      const [background, flag, name] = visuals.children;
      const selected = ['France', 'Spain'].includes(NATIONAL_TEAMS[index].name);
      expect(background.data).toEqual({ color: mobile ? 0x1c1c1c : 0x08120f, alpha: selected ? 0.98 : 0.92 });
      expect(background.setStrokeStyle).toHaveBeenCalledWith(selected ? 3 : 2, selected ? 0xf0c95a : 0x8f9a96, selected ? 1 : 0.95);
      expect(name.data).toMatchObject({ style: { color: mobile ? '#ffffff' : '#d9eadf' } });
      card.emit('pointerover');
      card.emit('pointerout');
      if (selected) {
        expect(background.setFillStyle).not.toHaveBeenCalled();
      } else {
        expect(background.setFillStyle).toHaveBeenNthCalledWith(1, mobile ? 0x1c1c1c : 0x08120f, 0.98);
        expect(background.setFillStyle).toHaveBeenNthCalledWith(2, mobile ? 0x1c1c1c : 0x08120f, 0.92);
      }
      expect(background.width * visuals.scale).toBe(grid.cardWidth);
      expect(background.height * visuals.scale).toBe(grid.cardHeight);
      expect(flag.width * visuals.scale).toBe(mobile ? 72 : 36);
      expect(flag.height * visuals.scale).toBe(mobile ? 54 : 27);
      expect(name.data).toMatchObject({ text: NATIONAL_TEAMS[index].name, style: { fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: '700' } });
      expect(16 * visuals.scale).toBe(mobile ? 32 : 16);
      expect(card.x - card.width / 2).toBeGreaterThanOrEqual(layout.teamGridRect.x);
      expect(card.x + card.width / 2).toBeLessThanOrEqual(layout.teamGridRect.x + layout.teamGridRect.width);
      if (index % grid.columns > 0) expect(card.x - content.children[index - 1].x - card.width).toBe(grid.gapX);
      if (index >= grid.columns) expect(card.y - content.children[index - grid.columns].y - card.height).toBe(grid.gapY);
    }
    expect(210 + 360).toBeLessThan(666 - 70 / 2);
    if (mobile) {
      expect(grid.cardWidth).toBe(180 * 2);
      expect(grid.cardHeight).toBe(58 * 2);
      expect((grid.columns + 1) * grid.cardWidth + grid.columns * grid.gapX).toBeGreaterThan(layout.teamGridRect.width);
    }
  });

  it.each(['match', 'penalty'] as const)('preserves %s wheel, drag and tap after scrolling to the final card', (mode) => {
    const { content, layout, selectTeam } = renderGrid(mobile, mode);
    const grid = createTeamCountryGridLayout(layout, NATIONAL_TEAMS.length);
    const first = content.children[0];
    const last = content.children.at(-1)!;
    first.emit('wheel', {}, 0, 100000);
    expect(content.y).toBe(210 - grid.maxScroll);
    expect(first.input.enabled).toBe(false);
    expect(last.input.enabled).toBe(true);
    expect(content.y + last.y + last.height / 2).toBe(570);
    const pointer = { id: 1, worldX: last.x + last.width / 2 - 1, worldY: content.y + last.y + last.height / 2 - 1 };
    last.emit('pointerdown', pointer);
    last.emit('pointerup', pointer);
    expect(selectTeam).toHaveBeenCalledWith(NATIONAL_TEAMS.at(-1)!.name);
    selectTeam.mockClear();
    first.emit('wheel', {}, 0, -100000);
    expect(content.y).toBe(210);
    const drag = { id: 2, worldX: first.x, worldY: content.y + first.y };
    first.emit('pointerdown', drag);
    first.emit('pointermove', { ...drag, worldY: drag.worldY - 60 });
    first.emit('pointerup', { ...drag, worldY: drag.worldY - 60 });
    expect(content.y).toBe(150);
    expect(selectTeam).not.toHaveBeenCalled();
    const outside = { id: 3, worldX: first.x, worldY: 600 };
    first.emit('pointerdown', outside);
    first.emit('pointerup', outside);
    expect(selectTeam).not.toHaveBeenCalled();
    const visuals = mobile ? first.children[0] : first;
    first.emit('pointerover');
    first.emit('pointerout');
    expect(visuals.children[0].setFillStyle).toHaveBeenCalledTimes(2);
  });
});

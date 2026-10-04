import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { TeamSelectScene } from '../scenes/TeamSelectScene';
import { ACTIVE_NATIONAL_TEAMS } from '../data/activeTeams';
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
  get displayWidth() { return this.width * this.scale; }
  get displayHeight() { return this.height * this.scale; }
  setX(x: number) { this.x = x; return this; }
  setScale(scale: number) { this.scale = scale; return this; }
  setInteractive() { this.input = { enabled: true, hitArea: { width: this.width, height: this.height } }; return this; }
  setMask(mask: unknown) { this.mask = mask; return this; }
  originX = 0.5;
  originY = 0.5;
  setOrigin(x: number, y = x) { this.originX = x; this.originY = y; return this; }
  clear() { return this; }
  fillStyle = vi.fn((color: number, alpha: number) => { this.data = { color, alpha }; return this; });
  lineStyle = vi.fn(() => this);
  fillRoundedRect = vi.fn((_x: number, _y: number, width: number, height: number) => { this.width = width; this.height = height; return this; });
  strokeRoundedRect = vi.fn(() => this);
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
    textures: { exists: () => true },
    make: { graphics: () => mask },
    add: {
      graphics: () => new DisplayObject(),
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
    const grid = createTeamCountryGridLayout(layout, ACTIVE_NATIONAL_TEAMS.length);
    expect(grid).toMatchObject(mobile
      ? { baseWidth: 180, baseHeight: 58, scale: 2, cardWidth: 360, cardHeight: 116, gapX: 24, gapY: 16, columns: 4, rowCount: 8, contentHeight: 1040, maxScroll: 680, startX: 224 }
      : { baseWidth: 168, baseHeight: 58, scale: 1, cardWidth: 168, cardHeight: 58, gapX: 10, gapY: 8, columns: 8, rowCount: 4, contentHeight: 256, maxScroll: 0, startX: 177 });
    expect(fillRect).toHaveBeenCalledWith(layout.teamGridRect.x, 210, layout.teamGridRect.width, 360);
    expect(content.children).toHaveLength(32);
    for (const [index, card] of content.children.entries()) {
      expect(card.scale).toBe(1);
      expect(card.input.hitArea).toEqual({ width: grid.cardWidth, height: grid.cardHeight });
      const visuals = card;
      expect(visuals.scale).toBe(1);
      const [background, flag, name] = visuals.children;
      const selected = ['France', 'Spain'].includes(ACTIVE_NATIONAL_TEAMS[index].name);
      expect(background.data).toEqual({ color: mobile ? 0x1c1c1c : 0x08120f, alpha: selected ? 0.98 : 0.92 });
      expect(background.lineStyle).toHaveBeenCalledWith((selected ? 3 : 2) * grid.scale, selected ? 0xf0c95a : 0x8f9a96, selected ? 1 : 0.95);
      expect(name.data).toMatchObject({ style: { color: mobile ? '#ffffff' : '#d9eadf' } });
      card.emit('pointerover');
      card.emit('pointerout');
      if (selected) {
        expect(background.fillStyle).toHaveBeenCalledTimes(1);
      } else {
        expect(background.fillStyle).toHaveBeenNthCalledWith(2, mobile ? 0x1c1c1c : 0x08120f, 0.98);
        expect(background.fillStyle).toHaveBeenNthCalledWith(3, mobile ? 0x1c1c1c : 0x08120f, 0.92);
      }
      expect(background.width * visuals.scale).toBe(grid.cardWidth);
      expect(background.height * visuals.scale).toBe(grid.cardHeight);
      expect(flag.displayWidth).toBe(mobile ? 64 : 28);
      expect(flag.displayHeight).toBe(flag.displayWidth);
      expect(name.data).toMatchObject({ text: ACTIVE_NATIONAL_TEAMS[index].name, style: {
        fontSize: mobile ? '32px' : '16px', fontFamily: 'Arial, sans-serif', fontStyle: '700', resolution: 2 } });
      expect(name.scale).toBe(1);
      expect([name.originX, name.originY]).toEqual([0, 0]);
      for (const child of [flag, name]) {
        expect(Number.isInteger(content.x + card.x + child.x)).toBe(true);
        expect(Number.isInteger(content.y + card.y + child.y)).toBe(true);
      }
      expect(Number.isInteger(flag.displayWidth)).toBe(true);
      expect(Number.isInteger(flag.displayHeight)).toBe(true);
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
    const grid = createTeamCountryGridLayout(layout, ACTIVE_NATIONAL_TEAMS.length);
    const first = content.children[0];
    const last = content.children.at(-1)!;
    first.emit('wheel', {}, 0, 100000);
    expect(content.y).toBe(210 - grid.maxScroll);
    expect(first.input.enabled).toBe(!mobile);
    expect(last.input.enabled).toBe(true);
    expect(content.y + last.y + last.height / 2).toBe(mobile ? 570 : 466);
    const pointer = { id: 1, worldX: last.x + last.width / 2 - 1, worldY: content.y + last.y + last.height / 2 - 1 };
    last.emit('pointerdown', pointer);
    last.emit('pointerup', pointer);
    expect(selectTeam).toHaveBeenCalledWith(ACTIVE_NATIONAL_TEAMS.at(-1)!.name);
    selectTeam.mockClear();
    first.emit('wheel', {}, 0, -100000);
    expect(content.y).toBe(210);
    const drag = { id: 2, worldX: first.x, worldY: content.y + first.y };
    first.emit('pointerdown', drag);
    first.emit('pointermove', { ...drag, worldY: drag.worldY - 60 });
    first.emit('pointerup', { ...drag, worldY: drag.worldY - 60 });
    expect(content.y).toBe(mobile ? 150 : 210);
    expect(selectTeam).not.toHaveBeenCalled();
    const outside = { id: 3, worldX: first.x, worldY: 600 };
    first.emit('pointerdown', outside);
    first.emit('pointerup', outside);
    expect(selectTeam).not.toHaveBeenCalled();
    const visuals = first;
    first.emit('pointerover');
    first.emit('pointerout');
    expect(visuals.children[0].fillStyle).toHaveBeenCalledTimes(3);
  });

  it.each(['match', 'penalty'] as const)('keeps %s final positions aligned after fractional wheel/drag input', (mode) => {
    const { content } = renderGrid(mobile, mode);
    const first = content.children[0];
    first.emit('wheel', {}, 0, 11);
    expect(Number.isInteger(content.y)).toBe(true);
    const pointer = { id: 5, worldX: first.x, worldY: content.y + first.y };
    first.emit('pointerdown', pointer);
    first.emit('pointermove', { ...pointer, worldY: pointer.worldY - 21.3 });
    first.emit('pointerup', { ...pointer, worldY: pointer.worldY - 21.3 });
    expect(Number.isInteger(content.y)).toBe(true);
    for (const card of content.children) {
      expect(card.scale).toBe(1);
      for (const child of card.children.slice(1)) {
        expect(Number.isInteger(content.y + card.y + child.y)).toBe(true);
      }
    }
  });
});

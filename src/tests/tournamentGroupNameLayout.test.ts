import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { NATIONAL_TEAMS, getTeamScoreboardCode } from '../data/nationalTeams';
import { TournamentSetupScene } from '../scenes/TournamentSetupScene';
import { createTournamentSetupLayout } from '../ui/tournamentSetupLayout';
import { fitMobileGroupName, getMobileGroupNameBounds } from '../ui/tournamentGroupNameLayout';

vi.mock('phaser', () => ({ default: { Scene: class {}, GameObjects: { Container: class {} } } }));

// Deterministic text metrics exercise fitting without a browser canvas.
class DisplayObject extends EventEmitter {
  children: DisplayObject[] = [];
  origin: number[] = [];
  width = 0;
  height = 0;
  maxLines = 0;
  wrapWidth = Infinity;
  fontSize = 34;
  attemptedSizes: number[] = [];
  constructor(public x = 0, public y = 0, public text = '', public style: Record<string, unknown> = {}) { super(); }
  add(items: DisplayObject[]) { this.children.push(...items); return this; }
  setOrigin(...origin: number[]) { this.origin = origin; return this; }
  setPosition(x: number, y: number) { this.x = x; this.y = y; return this; }
  setSize(width: number, height: number) { this.width = width; this.height = height; return this; }
  setDisplaySize = this.setSize;
  setStrokeStyle() { return this; }
  setInteractive() { return this; }
  setWordWrapWidth(width: number) { this.wrapWidth = width; return this; }
  setMaxLines(lines: number) { this.maxLines = lines; return this; }
  setFontSize(size: number) {
    this.fontSize = size;
    this.attemptedSizes.push(size);
    const lines = this.getWrappedText();
    this.width = Math.max(...lines.map(line => line.length * size * 0.6));
    this.height = lines.length * size * 1.2;
    return this;
  }
  getWrappedText() {
    const lines = [''];
    for (const word of this.text.split(' ')) {
      const last = lines.length - 1;
      const candidate = lines[last] ? `${lines[last]} ${word}` : word;
      if (lines[last] && candidate.length * this.fontSize * 0.6 > this.wrapWidth) lines.push(word);
      else lines[last] = candidate;
    }
    return lines;
  }
}

function fit(text: DisplayObject) {
  fitMobileGroupName(text as unknown as Parameters<typeof fitMobileGroupName>[0], createTournamentSetupLayout(true).groups);
}

describe('mobile tournament group names', () => {
  it.each([...new Set([...NATIONAL_TEAMS.map(team => team.name), 'Czech Republic'])])('fits the complete name %s inside two lines', (name) => {
    const text = new DisplayObject(0, 0, name);
    fit(text);
    const groups = createTournamentSetupLayout(true).groups;
    const bounds = getMobileGroupNameBounds(groups);
    expect(text.getWrappedText().join(' ')).toBe(name);
    expect(text.getWrappedText().length).toBeLessThanOrEqual(2);
    expect(text.maxLines).toBe(2);
    expect(text.fontSize).toBeGreaterThanOrEqual(24);
    expect(text.fontSize).toBeLessThanOrEqual(34);
    expect(text.width).toBeLessThanOrEqual(bounds.width);
    expect(text.height).toBeLessThanOrEqual(bounds.height);
    expect(text.origin).toEqual([0, 0.5]);
    expect(text.y - text.height / 2).toBeGreaterThanOrEqual(8);
    expect(text.y + text.height / 2).toBeLessThanOrEqual(groups.slotHeight - 8);
    expect(text.x).toBeGreaterThan(groups.slotFlagX + groups.slotFlagWidth / 2);
    expect(text.x + text.width).toBeLessThan(groups.slotWidth - groups.slotAiButtonWidth);
  });

  it('retains the base font for short names and shrinks two-line names to fit their height', () => {
    const short = new DisplayObject(0, 0, 'France');
    const long = new DisplayObject(0, 0, 'Bosnia and Herzegovina');
    fit(short);
    fit(long);
    expect(short.fontSize).toBe(34);
    expect(long.getWrappedText()).toEqual(['Bosnia and', 'Herzegovina']);
    expect(long.fontSize).toBeLessThan(34);
    expect(long.attemptedSizes.every(size => size >= 24 && size <= 34)).toBe(true);
  });

  it('measures uncapped lines before fitting and never shrinks below the minimum', () => {
    const text = new DisplayObject(0, 0, 'Oversized test label');
    text.getWrappedText = () => {
      expect(text.maxLines).toBe(0);
      return ['one', 'two', 'three'];
    };
    fit(text);
    expect(text.fontSize).toBe(24);
    expect(text.maxLines).toBe(2);
  });

  it.each([false, true])('renders full names only on mobile and preserves AI controls (mobile=%s)', (mobile) => {
    const scene = new TournamentSetupScene();
    const objects: DisplayObject[] = [];
    const make = (x: number, y: number, text = '', style = {}) => {
      const object = new DisplayObject(x, y, text, style);
      objects.push(object);
      return object;
    };
    Object.assign(scene, {
      add: {
        container: make,
        rectangle: (x: number, y: number, width: number, height: number) => make(x, y).setSize(width, height),
        text: make,
        image: (x: number, y: number, key: string) => make(x, y, key)
      }
    });
    const draft = Reflect.get(scene, 'draft');
    draft.slots[0] = 'nir';
    const layout = createTournamentSetupLayout(mobile);
    Reflect.get(scene, 'createSlot').call(scene, 0, 0, 0, layout, false);
    const label = objects.find(object => object.text === (mobile ? 'Northern Ireland' : getTeamScoreboardCode('nir')))!;
    expect(label).toBeDefined();
    expect(label.origin).toEqual([mobile ? 0 : 0.5, 0.5]);
    expect(objects.find(object => object.text === 'AI')?.style.fontSize).toBe(mobile ? '28px' : '16px');
    if (!mobile) {
      expect(label.style).toMatchObject({ fontSize: '20px', wordWrap: { width: 96 } });
      expect(label.x).toBe(90);
      expect(label.attemptedSizes).toEqual([]);
    }
    expect(layout.groups.slotFlagWidth).toBe(mobile ? 64 : 30);
    expect(layout.groups.slotFlagHeight).toBe(mobile ? 48 : 22);
    expect(layout.groups.slotFlagX - layout.groups.slotFlagWidth / 2).toBeGreaterThan(0);
    expect(layout.groups.slotFlagHeight).toBeLessThan(layout.groups.slotHeight - 16);
  });
});

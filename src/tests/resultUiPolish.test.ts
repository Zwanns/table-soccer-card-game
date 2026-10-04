import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import type { PlayerControllerType } from '../ai';
import type { PlayerMatchStats } from '../game';

vi.mock('phaser', () => ({ default: { Scene: class {}, GameObjects: { Container: class {} } } }));
import { ResultScene } from '../scenes/ResultScene';

class Node extends EventEmitter {
  children: Node[] = []; mask: unknown; width = 0; height = 0;
  constructor(public x = 0, public y = 0, public text = '', public style: any = {}) {
    super(); this.width = Math.min(text.length * 12, style.wordWrap?.width ?? Infinity);
    this.height = text ? 28 * Math.max(1, Math.ceil(text.length * 12 / (style.wordWrap?.width ?? Infinity))) : 0;
  }
  add(items: Node | Node[]) { this.children.push(...[items].flat()); return this; }
  setOrigin() { return this; } setDepth() { return this; } setInteractive() { return this; }
  setMask(mask: unknown) { this.mask = mask; return this; } setStrokeStyle() { return this; }
  setDisplaySize(w: number, h: number) { this.width = w; this.height = h; return this; }
  get displayWidth() { return this.width; } setX(x: number) { this.x = x; return this; }
  setVisible() { return this; }
}

function fixture() {
  const scene = new ResultScene();
  const nodes: Node[] = [], zones: Node[] = [], containers: Node[] = [];
  Object.assign(scene, {
    textures: { exists: () => true }, events: new EventEmitter(),
    add: { text: (x: number, y: number, text: string, style: any) => { const node = new Node(x, y, text, style); nodes.push(node); return node; },
      container: (x: number, y: number) => { const node = new Node(x, y); containers.push(node); return node; },
      image: (x: number, y: number) => new Node(x, y), rectangle: (x: number, y: number) => new Node(x, y),
      zone: (x: number, y: number) => { const node = new Node(x, y); zones.push(node); return node; },
      graphics: () => ({ fillStyle() { return this; }, fillRoundedRect() { return this; } }) },
    make: { graphics: () => ({ fillStyle() { return this; }, fillRect() { return this; }, createGeometryMask() { return this; }, setVisible() {} }) }
  });
  return { scene, nodes, zones, containers };
}

describe('result controller badges and goalscorer layout', () => {
  it.each([['HUMAN', 'AI'], ['AI', 'AI'], ['HUMAN', 'HUMAN']] as PlayerControllerType[][])(
    'aligns both team codes for %s vs %s and displays both controller badges', (left, right) => {
      const { scene, nodes } = fixture();
      for (const [i, controller] of [left, right].entries()) Reflect.get(scene, 'createResultTeamCodeBlock').call(scene, i * 300, 0, i ? 'tr' : 'ua', controller);
      const codes = nodes.filter(n => ['UKR', 'TUR'].includes(n.text));
      const badges = nodes.filter(n => ['USER', 'AI'].includes(n.text));
      expect(codes.map(n => n.y)).toEqual([-10, -10]);
      expect(badges.map(n => n.text)).toEqual([left, right].map(c => c === 'AI' ? 'AI' : 'USER'));
      expect(badges[0].y).toBe(badges[1].y);
    });

  it.each([1, 2, 20])('keeps %s goalscorers, including long surnames, separated inside the masked scroll content', count => {
    const { scene, nodes, zones, containers } = fixture();
    const stats: PlayerMatchStats = { playerId: 'PLAYER_1', goals: count, shots: count, goalkeeperSaves: 0, possession: 50, shotAccuracy: 100,
      scorers: Array.from({ length: count }, (_, i) => ({ playerName: i % 2 ? 'An Extremely Long Compound Surname For Wrapping' : 'Dovbyk',
        shirtNumber: 11, rank: 'A', teamId: 'ua', turnNumber: i + 1, matchStepNumber: (i + 1) * 3 })) };
    Reflect.get(scene, 'addStatsScrollContent').call(scene, new Node(), 800, 326, 840, 568, stats,
      { ...stats, playerId: 'PLAYER_2', scorers: [] }, 'ua', 'tr', [], { labelFontSize: '26px', valueFontSize: '30px', sectionTitleFontSize: '26px' });
    const scorers = nodes.filter(n => n.text.startsWith('#11'));
    expect(scorers).toHaveLength(count);
    for (let i = 1; i < scorers.length; i++) expect(scorers[i].y - scorers[i - 1].y - scorers[i - 1].height).toBeGreaterThanOrEqual(12);
    expect(scorers[0].style.fontSize).toBe('20px');
    expect(scorers[0].text).toBe('#11 Dovbyk (3)');
    const content = containers[0];
    expect(content.mask).toBeDefined();
    if (count === 20) {
      const initial = content.y;
      zones[0].emit('wheel', {}, 0, 10000);
      expect(content.y).toBeLessThan(initial);
      const finalScorerBottom = content.y + scorers.at(-1)!.y + scorers.at(-1)!.height;
      expect(finalScorerBottom).toBeLessThanOrEqual(-132 + 392);
    }
  });
});

import { EventEmitter } from 'node:events';
import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { getMatchRulesLayout } from '../ui/matchRulesLayout';
import { createMatchRulesOverlay, type MatchRulesContent } from '../ui/MatchRulesOverlay';
import type { GameLanguage } from '../i18n/languageStore';

const ui = vi.hoisted(() => ({ mobile: false }));
vi.mock('../ui/mobileLayout', () => ({ isMobileLandscapeLayout: () => ui.mobile }));
vi.mock('phaser', () => ({ default: { GameObjects: { Events: { DESTROY: 'destroy' } } } }));
vi.mock('../ui/matchPauseOverlay', () => ({ MATCH_OVERLAY_DEPTH: 1000 }));
vi.mock('../ui/Button', () => ({ Button: class extends EventEmitter {
  input = { enabled: true };
  constructor(_scene: unknown, public x: number, public y: number, public label: string,
    onClick: () => void, public options: { width: number; height: number; fontSize: string }) {
    super(); this.on('pointerdown', onClick);
  }
} }));

class Node extends EventEmitter {
  list: any[] = []; depth = 0; input?: { enabled: boolean }; mask?: unknown;
  height = 0; width = 0;
  constructor(public x = 0, public y = 0, public text = '', public style: any = {}) { super(); }
  add(nodes: any | any[]) { this.list.push(...[nodes].flat()); return this; }
  setDepth(value: number) { this.depth = value; return this; }
  setOrigin() { return this; }
  setInteractive() { this.input = { enabled: true }; return this; }
  setColor() { return this; }
  setMask(value: unknown) { this.mask = value; return this; }
}

function harness(mobile: boolean, language: GameLanguage) {
  ui.mobile = mobile;
  const texts: Node[] = [], zones: Node[] = [];
  const maskGraphics = { fillStyle() { return this; }, fillRect: vi.fn().mockReturnThis(),
    createGeometryMask: () => ({ sharedMask: true }), setVisible: vi.fn(), destroy: vi.fn() };
  const scene = { events: new EventEmitter(), make: { graphics: () => maskGraphics }, add: {
    container: (x: number, y: number) => new Node(x, y),
    rectangle: (x: number, y: number, width: number, height: number) => Object.assign(new Node(x, y), { width, height }),
    zone: (x: number, y: number, width: number, height: number) => {
      const node = Object.assign(new Node(x, y), { width, height }); zones.push(node); return node;
    },
    text: (x: number, y: number, text: string, style: any) => {
      const node = new Node(x, y, text, style);
      const font = parseInt(style.fontSize);
      node.width = Math.min(style.wordWrap?.width ?? Infinity, text.length * font * 0.6);
      const lines = Math.max(1, Math.ceil(text.length * font * 0.6 / (style.wordWrap?.width ?? Infinity)));
      node.height = lines * (font + 4) + (lines - 1) * (style.lineSpacing ?? 0);
      texts.push(node); return node;
    }
  } } as unknown as Phaser.Scene;
  const paragraphs = { en: 'The attacking player draws a card and attempts to beat the defending line. ',
    pl: 'Atakujący gracz dobiera kartę i próbuje pokonać linię obrony. ',
    uk: 'Гравець в атаці бере карту й намагається подолати лінію захисту. ' };
  const localizedContent = (paragraph: string): MatchRulesContent => ({
    title: 'Rules', sections: Array.from({ length: 8 }, (_, i) => ({ heading: `Section ${i}`,
      body: [paragraph.repeat(8), paragraph.repeat(3)] }))
  });
  const content: Record<GameLanguage, MatchRulesContent> = {
    en: localizedContent(paragraphs.en), pl: localizedContent(paragraphs.pl), uk: localizedContent(paragraphs.uk)
  };
  const onClose = vi.fn(), onLanguageChange = vi.fn();
  const modal = createMatchRulesOverlay({ scene, language, languages: ['en', 'pl', 'uk'], content,
    onClose, onLanguageChange }) as unknown as Node;
  const panel = modal.list[1] as Node;
  const wrapper = panel.list[5] as Node;
  return { modal, panel, wrapper, content: wrapper.list[0] as Node, zone: zones[0], texts,
    maskGraphics, onClose, onLanguageChange };
}

describe('Match Rules mobile readability', () => {
  it('preserves the complete desktop layout contract', () => {
    expect(getMatchRulesLayout(false)).toEqual({ modalWidth: 960, modalHeight: 600,
      viewport: { x: -390, y: -150, width: 780, height: 360 },
      titleFontSize: '34px', subtitleY: -214, subtitleFontSize: '20px', rulesTitleFontSize: '22px',
      headingFontSize: '19px', bodyFontSize: '16px', lineSpacing: 8,
      headingGap: 8, paragraphGap: 6, sectionGap: 12, textResolution: 1,
      languageX: 336, languageFontSize: '18px', languageStartX: -62, languageStep: 54,
      back: { y: 258, width: 190, height: 42, fontSize: '18px' } });
    const { panel, content } = harness(false, 'en');
    expect(panel.list[0]).toMatchObject({ width: 960, height: 600 });
    expect(content.list[0].style.fontSize).toBe('22px');
    expect(content.list[1].style.fontSize).toBe('16px');
  });

  it.each(['en', 'pl', 'uk'] as const)('keeps enlarged %s content clipped, scrollable, and clear of Back/languages', (language) => {
    const layout = getMatchRulesLayout(true), { viewport, back } = layout;
    const h = harness(true, language);
    expect(h.modal.depth).toBe(1000);
    expect(h.modal.list[0].input.enabled).toBe(true);
    expect(h.panel.list[3].style.fontSize).toBe('40px');
    expect(h.panel.list[4].style.fontSize).toBe('24px');
    expect(h.content.mask).toBeDefined();
    expect(h.maskGraphics.fillRect).toHaveBeenCalledWith(800 + viewport.x, 360 + viewport.y, viewport.width, viewport.height);
    expect(h.zone).toMatchObject({ width: viewport.width, height: viewport.height, input: { enabled: true } });
    expect(viewport.y + viewport.height).toBeLessThan(back.y - back.height / 2);
    expect(viewport.x + viewport.width + 19).toBeLessThan(layout.modalWidth / 2);
    expect(h.content.list[0].style.fontSize).toBe('34px');
    expect(h.content.list[3].style.fontSize).toBe('32px');
    for (const text of h.content.list) {
      expect(text.style.wordWrap.width).toBe(viewport.width);
      expect(text.style.resolution).toBe(2);
      if (!text.text.startsWith('Section')) expect(text.style.fontSize).toBe('28px');
    }
    const initialY = h.content.y;
    h.zone.emit('wheel', {}, 0, 400);
    expect(h.content.y).toBeLessThan(initialY);
    h.zone.emit('pointerdown', { id: 1, worldY: 400 });
    h.zone.emit('pointermove', { id: 1, worldY: 300 });
    expect(h.content.y).toBe(initialY - 240);
    h.zone.emit('wheel', {}, 0, -100000);
    expect(h.content.y).toBe(initialY);
    h.zone.emit('wheel', {}, 0, 1000000);
    const last = h.content.list.at(-1);
    expect(h.content.y + last.y + last.height).toBeLessThanOrEqual(viewport.y + viewport.height);
    const selector = h.panel.list[2] as Node;
    const labels = selector.list.filter(node => node.text !== '|');
    expect(labels.map(node => node.text)).toEqual(['EN', 'PL', 'UA']);
    for (const label of labels) {
      expect(label.style.fontSize).toBe('28px');
      expect(selector.x + label.x + label.width / 2).toBeLessThan(layout.modalWidth / 2);
    }
    const nextLanguage = language === 'en' ? 'pl' : 'en';
    labels.find(node => node.text === (nextLanguage === 'en' ? 'EN' : 'PL')).emit('pointerdown');
    expect(h.onLanguageChange).toHaveBeenCalledWith(nextLanguage);
    h.panel.list[1].emit('pointerdown');
    expect(h.onClose).toHaveBeenCalledOnce();
    h.wrapper.emit('destroy');
    expect(h.maskGraphics.destroy).toHaveBeenCalledOnce();
  });
});

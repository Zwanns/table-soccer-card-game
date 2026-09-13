import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getNavigationButtonLayout } from '../ui/mobileNavigationLayout';
import { MenuScene } from '../scenes/MenuScene';
import { TeamSelectScene } from '../scenes/TeamSelectScene';

const buttons = vi.hoisted(() => [] as Array<{
  x: number;
  y: number;
  caption: string;
  onClick: () => void;
  width: number;
  height: number;
  fontSize: string;
  labelOffsetY: number;
}>);

vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    GameObjects: { Container: class {} },
    Math: { Clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)) }
  }
}));
vi.mock('../ui/Button', () => ({
  Button: class {
    constructor(_scene: unknown, x: number, y: number, caption: string, onClick: () => void, options = {}) {
      buttons.push({ width: 220, height: 54, fontSize: '22px', labelOffsetY: 0, ...options, x, y, caption, onClick });
    }
  }
}));

function invoke(scene: object, method: string): void {
  Reflect.get(scene, method).call(scene);
}

function mockRendering(scene: object) {
  const start = vi.fn();
  Object.assign(scene, {
    scale: { width: 1600 },
    scene: { start },
    children: { removeAll: vi.fn() },
    add: { text: () => ({ setOrigin: vi.fn() }) }
  });
  return start;
}

beforeEach(() => {
  buttons.length = 0;
  vi.stubGlobal('innerWidth', 900);
  vi.stubGlobal('innerHeight', 400);
});
afterEach(() => vi.unstubAllGlobals());

describe.each([true, false])('navigation rendering (mobile=%s)', (mobile) => {
  beforeEach(() => vi.stubGlobal('matchMedia', () => ({ matches: mobile })));

  it.each(['match', 'penalty'] as const)('preserves the %s Menu center and callback', (mode) => {
    const scene = new TeamSelectScene();
    const start = mockRendering(scene);
    scene.init({ mode });
    for (const method of ['createTeamSelectFieldBackground', 'createSelectedPanel', 'createTeamKitPreview', 'createCountryGrid']) {
      Object.assign(scene, { [method]: vi.fn() });
    }
    scene.create();
    const menu = buttons.find(({ caption }) => caption === 'Menu')!;
    expect(menu).toMatchObject(mobile
      ? { width: 240, height: 70, fontSize: '32px', x: 158, y: 666, labelOffsetY: 0 }
      : { width: 220, height: 54, fontSize: '22px', x: 203, y: 666, labelOffsetY: 0 });
    menu.onClick();
    expect(start).toHaveBeenCalledWith('MenuScene');
    expect(buttons[1]).toMatchObject({
      caption: mode === 'penalty' ? 'Start penalties' : 'Start',
      width: mobile ? 300 : 260, height: 54, fontSize: '22px', y: 666
    });
    expect(menu.y + menu.height / 2).toBeLessThanOrEqual(720);
  });

  it('preserves Tournament actions and the Back destination with a four-pixel gap', () => {
    const scene = new MenuScene();
    mockRendering(scene);
    const openGameModes = vi.fn();
    Object.assign(scene, { openGameModes });
    invoke(scene, 'createTournamentButtons');
    const back = buttons[3];
    expect(back).toMatchObject(mobile
      ? { caption: 'Back', width: 240, height: 70, fontSize: '32px', x: 800, y: 488, labelOffsetY: 0 }
      : { caption: 'Back', width: 520, height: 62, fontSize: '24px', x: 800, y: 484, labelOffsetY: 0 });
    expect(buttons.slice(0, 3).map(({ caption, width, height, fontSize, x, y }) => ({ caption, width, height, fontSize, x, y }))).toEqual([
      { caption: 'New tournament', width: mobile ? 720 : 520, height: 62, fontSize: '24px', x: 800, y: 286 },
      { caption: 'Continue tournament', width: mobile ? 720 : 520, height: 62, fontSize: '24px', x: 800, y: 352 },
      { caption: 'Delete save', width: mobile ? 720 : 520, height: 62, fontSize: '22px', x: 800, y: 418 }
    ]);
    expect(back.y - back.height / 2 - (buttons[2].y + buttons[2].height / 2)).toBe(4);
    back.onClick();
    expect(openGameModes).toHaveBeenCalledOnce();
  });

  it.each(['rules', 'about'])('keeps the shared %s Back below content and closes the modal', (kind) => {
    const scene = new MenuScene();
    const closeAboutModal = vi.fn();
    Object.assign(scene, { activeInfoModal: kind, closeAboutModal });
    invoke(scene, 'createInfoBackButton');
    const back = buttons[0];
    expect(back).toMatchObject({
      caption: 'Back', x: 0, y: 258, width: mobile ? 240 : 190,
      height: mobile ? 70 : 42, fontSize: mobile ? '32px' : '18px', labelOffsetY: 0
    });
    // Panel origin is (800, 360); content ends at local Y=210.
    expect(back.y - back.height / 2).toBeGreaterThan(210);
    expect(back.y + back.height / 2).toBeLessThan(300);
    back.onClick();
    expect(closeAboutModal).toHaveBeenCalledOnce();
  });
});

it('preserves desktop options and does not move a mobile button that already clears content', () => {
  const layout = { x: 800, y: 600, width: 300, height: 54, fontSize: '22px', borderWidth: 0 };
  expect(getNavigationButtonLayout(layout, false, 500)).toBe(layout);
  expect(getNavigationButtonLayout(layout, true, 500)).toEqual({ ...layout, width: 240, height: 70, fontSize: '32px' });
});

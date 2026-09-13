import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMobileActionButtonLayout, getNavigationButtonLayout } from '../ui/mobileNavigationLayout';
import { MenuScene } from '../scenes/MenuScene';
import { TeamSelectScene } from '../scenes/TeamSelectScene';
import { deleteStoredTournament, hasActiveTournamentSave } from '../tournament';
import { getMainMenuButtonLayout } from '../ui/mainMenuLayout';

const buttons = vi.hoisted(() => [] as Array<{
  x: number;
  y: number;
  caption: string;
  onClick: () => void;
  width: number;
  height: number;
  fontSize: string;
  labelOffsetY: number;
  disabled?: boolean;
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
vi.mock('../tournament', async (importOriginal) => ({
  ...await importOriginal<typeof import('../tournament')>(),
  hasActiveTournamentSave: vi.fn(() => false),
  deleteStoredTournament: vi.fn(() => true)
}));

function invoke(scene: object, method: string, ...args: unknown[]): void {
  Reflect.get(scene, method).call(scene, ...args);
}

function mockRendering(scene: object) {
  const start = vi.fn();
  Object.assign(scene, {
    scale: { width: 1600 },
    scene: { start },
    children: { removeAll: vi.fn() },
    add: { text: vi.fn(() => ({ setOrigin: vi.fn() })) }
  });
  return start;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(hasActiveTournamentSave).mockReturnValue(false);
  buttons.length = 0;
  vi.stubGlobal('innerWidth', 900);
  vi.stubGlobal('innerHeight', 400);
});
afterEach(() => vi.unstubAllGlobals());

describe.each([true, false])('navigation rendering (mobile=%s)', (mobile) => {
  beforeEach(() => vi.stubGlobal('matchMedia', () => ({ matches: mobile })));

  it.each(['match', 'penalty'] as const)('lays out the %s Menu/Start pair and preserves both callbacks', (mode) => {
    const scene = new TeamSelectScene();
    const start = mockRendering(scene);
    scene.init({ mode });
    const startMatch = vi.fn();
    Object.assign(scene, { startMatch });
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
    const action = buttons[1];
    expect(action).toMatchObject(mobile
      ? { caption: 'Start', x: 1442, y: 666, width: 240, height: 70, fontSize: '32px', labelOffsetY: 0, disabled: false }
      : { caption: mode === 'penalty' ? 'Start penalties' : 'Start', x: 1377, y: 666, width: 260, height: 54, fontSize: '22px', labelOffsetY: 0, disabled: false });
    if (mobile) {
      for (const key of ['width', 'height', 'fontSize', 'y', 'labelOffsetY'] as const) {
        expect(action[key]).toBe(menu[key]);
      }
      expect(menu.x - menu.width / 2).toBe(38);
      expect(1600 - action.x - action.width / 2).toBe(38);
    }
    action.onClick();
    expect(startMatch).toHaveBeenCalledOnce();
    expect(menu.y + menu.height / 2).toBeLessThanOrEqual(720);
    expect(action.y + action.height / 2).toBeLessThanOrEqual(720);

    // The existing duplicate-team guard must survive the action styling change.
    Object.assign(scene, { selectedTeamTwo: Reflect.get(scene, 'selectedTeamOne') });
    buttons.length = 0;
    scene.create();
    expect(buttons[1].disabled).toBe(true);
  });

  it.each([false, true])('matches Tournament actions to Main Menu while preserving navigation (save=%s)', (hasSave) => {
    vi.mocked(hasActiveTournamentSave).mockReturnValue(hasSave);
    const scene = new MenuScene();
    mockRendering(scene);
    const openGameModes = vi.fn();
    const startNewTournamentSetup = vi.fn();
    const continueTournament = vi.fn();
    const deleteTournamentSave = vi.fn();
    Object.assign(scene, { openGameModes, startNewTournamentSetup, continueTournament, deleteTournamentSave });
    invoke(scene, 'createTournamentButtons');
    const back = buttons[3];
    expect(back).toMatchObject(mobile
      ? { caption: 'Back', width: 240, height: 70, fontSize: '32px', x: 158, y: 666, labelOffsetY: 0 }
      : { caption: 'Back', width: 520, height: 62, fontSize: '24px', x: 800, y: 484, labelOffsetY: 0 });
    expect(buttons.slice(0, 3).map(({ caption, width, height, fontSize, x, y }) => ({ caption, width, height, fontSize, x, y }))).toEqual([
      { caption: 'New tournament', width: mobile ? 720 : 520, height: mobile ? 84 : 62, fontSize: mobile ? '32px' : '24px', x: 800, y: mobile ? 297 : 286 },
      { caption: 'Continue tournament', width: mobile ? 720 : 520, height: mobile ? 84 : 62, fontSize: mobile ? '32px' : '24px', x: 800, y: mobile ? 385 : 352 },
      { caption: 'Delete save', width: mobile ? 720 : 520, height: mobile ? 84 : 62, fontSize: mobile ? '32px' : '22px', x: 800, y: mobile ? 473 : 418 }
    ]);
    expect(buttons[0].disabled).not.toBe(true);
    expect(buttons[1].disabled).toBe(!hasSave);
    expect(buttons[2].disabled).toBe(!hasSave);
    if (mobile) {
      const reference = getMainMenuButtonLayout({
        buttonFontSize: '24px', buttonHeight: 62, buttonsGap: 66,
        buttonsStartY: 286, buttonWidth: 720, centerX: 800
      }, true);
      buttons.slice(0, 3).forEach((button, index) => {
        const { width, height, fontSize, x, y } = reference[index];
        expect(button).toMatchObject({ width, height, fontSize, x, y, labelOffsetY: 0 });
        if (index > 0) {
          expect(button.y - buttons[index - 1].y).toBe(88);
          expect(button.y - buttons[index - 1].y - button.height).toBe(4);
        }
      });
    }
    expect(Reflect.get(scene, 'add').text).toHaveBeenCalledWith(800, 240, 'Tournament', expect.objectContaining({ fontSize: '24px' }));
    expect(back.y - back.height / 2 - (buttons[2].y + buttons[2].height / 2)).toBe(mobile ? 116 : 4);
    buttons[0].onClick();
    buttons[1].onClick();
    buttons[2].onClick();
    expect(startNewTournamentSetup).toHaveBeenCalledOnce();
    expect(continueTournament).toHaveBeenCalledOnce();
    expect(deleteTournamentSave).toHaveBeenCalledOnce();
    back.onClick();
    expect(openGameModes).toHaveBeenCalledOnce();
  });

  it.each([false, true])('retains the Delete save confirmation gate (confirmed=%s)', (confirmed) => {
    vi.mocked(hasActiveTournamentSave).mockReturnValue(true);
    const confirm = vi.fn(() => confirmed);
    vi.stubGlobal('window', { confirm });
    const scene = new MenuScene();
    mockRendering(scene);
    const remove = vi.fn();
    const openTournamentMenu = vi.fn();
    Object.assign(scene, { registry: { remove }, openTournamentMenu });
    invoke(scene, 'createTournamentButtons');
    buttons[2].onClick();
    expect(confirm).toHaveBeenCalledWith('Delete saved tournament?');
    expect(deleteStoredTournament).toHaveBeenCalledTimes(confirmed ? 1 : 0);
    expect(remove.mock.calls).toEqual(confirmed ? [['currentTournament']] : []);
    expect(openTournamentMenu).toHaveBeenCalledTimes(confirmed ? 1 : 0);
  });

  it.each(['rules', 'about'])('keeps the shared %s Back below content and closes the modal', (kind) => {
    const scene = new MenuScene();
    const closeAboutModal = vi.fn();
    Object.assign(scene, { activeInfoModal: kind, closeAboutModal });
    const panel = { x: 800, y: 360 };
    invoke(scene, 'createInfoBackButton', panel);
    const back = buttons[0];
    expect(back).toMatchObject({
      caption: 'Back', x: mobile ? -642 : 0, y: mobile ? 306 : 258, width: mobile ? 240 : 190,
      height: mobile ? 70 : 42, fontSize: mobile ? '32px' : '18px', labelOffsetY: 0
    });
    expect({ x: panel.x + back.x, y: panel.y + back.y }).toEqual(mobile
      ? { x: 158, y: 666 }
      : { x: 800, y: 618 });
    // Back may extend outside the panel, but remains inside the canvas and clear of content.
    expect(back.y - back.height / 2).toBeGreaterThan(210);
    expect(panel.y + back.y + back.height / 2).toBeLessThanOrEqual(720);
    expect(panel.x + back.x - back.width / 2).toBeGreaterThanOrEqual(0);
    back.onClick();
    expect(closeAboutModal).toHaveBeenCalledOnce();
  });
});

it('preserves desktop layouts and converts the mobile canvas slot into panel coordinates', () => {
  const layout = { x: 800, y: 600, width: 300, height: 54, fontSize: '22px', borderWidth: 0 };
  expect(getNavigationButtonLayout(layout, false, { x: 800, y: 360 })).toBe(layout);
  expect(getMobileActionButtonLayout(layout, false)).toBe(layout);
  expect(getNavigationButtonLayout(layout, true, { x: 800, y: 360 })).toEqual({
    ...layout, x: -642, y: 306, width: 240, height: 70, fontSize: '32px'
  });
});

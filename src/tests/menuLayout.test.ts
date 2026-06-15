import { describe, expect, it } from 'vitest';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { createMenuLayout, isMobileLandscapeMenuViewport, type MenuLayout } from '../ui/menuLayout';

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const TEST_VIEWPORTS = [
  { width: 1600, height: 720 },
  { width: 1280, height: 720 },
  { width: 1024, height: 576 },
  { width: 932, height: 430 },
  { width: 915, height: 412 },
  { width: 844, height: 390 }
] as const;

describe('menu layout helper', () => {
  it('preserves the desktop menu baseline coordinates', () => {
    const layout = createMenuLayout({ width: 1600, height: 720 });

    expect(layout.mode).toBe('desktop');
    expect(layout.scene).toMatchObject({ width: SCENE_WIDTH, height: SCENE_HEIGHT, centerX: 800, centerY: 360 });
    expect(layout.title).toMatchObject({
      y: 138,
      logoMaxWidth: 1216,
      logoMaxHeight: 201.60000000000002,
      fallbackTitleOffsetY: -18,
      fallbackSubtitleOffsetY: 54,
      fallbackTitleFontSize: '68px',
      fallbackSubtitleFontSize: '42px'
    });
    expect(layout.flags).toMatchObject({ y: 80, maxWidth: 720, maxHeight: 72 });
    expect(layout.subtitle).toMatchObject({ y: 238 });
    expect(layout.buttons).toMatchObject({
      startY: 286,
      gap: 60,
      height: 54,
      minWidth: 280,
      maxWidthRatio: 0.78,
      fallbackWidthRatio: 0.72,
      fallbackMaxWidth: 520,
      fontSize: '22px',
      submenuTitleOffsetY: -46
    });
    expect(layout.footer).toMatchObject({
      y: 702,
      margin: 24,
      disclaimerWidth: 1040,
      disclaimerFontSize: '12px',
      versionFontSize: '16px'
    });
    expect(layout.info.modal).toMatchObject({ width: 960, height: 600 });
    expect(layout.info.viewport).toMatchObject({ x: -390, y: -150, width: 780, height: 360 });
    expect(layout.info.backButton).toMatchObject({ y: 258, width: 190, height: 42, fontSize: '18px' });
  });

  it('enables compact mobile menu only for small landscape display sizes', () => {
    expect(isMobileLandscapeMenuViewport({ width: 1600, height: 720 })).toBe(false);
    expect(isMobileLandscapeMenuViewport({ width: 1280, height: 720 })).toBe(false);
    expect(isMobileLandscapeMenuViewport({ width: 1024, height: 576 })).toBe(true);
    expect(isMobileLandscapeMenuViewport({ width: 932, height: 430 })).toBe(true);
    expect(isMobileLandscapeMenuViewport({ width: 915, height: 412 })).toBe(true);
    expect(isMobileLandscapeMenuViewport({ width: 844, height: 390 })).toBe(true);
    expect(isMobileLandscapeMenuViewport({ width: 430, height: 932 })).toBe(false);
  });

  it.each(TEST_VIEWPORTS)('keeps logo, buttons and info modal inside the base canvas for $width x $height', (viewport) => {
    const layout = createMenuLayout(viewport);

    expectInsideCanvas(boundsFromCenter(layout.scene.centerX, layout.title.y, layout.title.logoMaxWidth, layout.title.logoMaxHeight));
    expectInsideCanvas(menuButtonBounds(layout, 0));
    expectInsideCanvas(menuButtonBounds(layout, 1));
    expectInsideCanvas(menuButtonBounds(layout, 2));
    expectInsideCanvas(menuButtonBounds(layout, 3));
    expectInsideCanvas(menuButtonBounds(layout, 4));
    expectInsideCanvas(boundsFromCenter(layout.scene.centerX, layout.scene.centerY, layout.info.modal.width, layout.info.modal.height));
    expectInsideCanvas(infoViewportBounds(layout));
    expectInsideCanvas(infoBackButtonBounds(layout));
  });

  it('keeps mobile landscape compact while preserving touch-size buttons', () => {
    const desktop = createMenuLayout({ width: 1600, height: 720 });
    const mobile = createMenuLayout({ width: 932, height: 430 });

    expect(mobile.mode).toBe('mobile-landscape');
    expect(mobile.scene).toEqual(desktop.scene);
    expect(mobile.title.logoMaxWidth).toBeLessThan(desktop.title.logoMaxWidth);
    expect(mobile.title.logoMaxHeight).toBeLessThan(desktop.title.logoMaxHeight);
    expect(mobile.buttons.startY).toBeLessThan(desktop.buttons.startY);
    expect(mobile.buttons.height).toBeGreaterThanOrEqual(44);
    expect(mobile.info.modal.height).toBeLessThan(desktop.info.modal.height);
    expect(mobile.info.backButton.height).toBeGreaterThanOrEqual(42);
    expect(mobile.info.languageSelector.itemGap).toBeGreaterThanOrEqual(desktop.info.languageSelector.itemGap);
  });
});

function menuButtonBounds(layout: MenuLayout, index: number): Bounds {
  const width = Math.min(layout.scene.width * layout.buttons.fallbackWidthRatio, layout.buttons.fallbackMaxWidth);

  return boundsFromCenter(
    layout.scene.centerX,
    layout.buttons.startY + layout.buttons.gap * index,
    Math.max(width, layout.buttons.minWidth),
    layout.buttons.height
  );
}

function infoViewportBounds(layout: MenuLayout): Bounds {
  return {
    left: layout.scene.centerX + layout.info.viewport.x,
    right: layout.scene.centerX + layout.info.viewport.x + layout.info.viewport.width,
    top: layout.scene.centerY + layout.info.viewport.y,
    bottom: layout.scene.centerY + layout.info.viewport.y + layout.info.viewport.height
  };
}

function infoBackButtonBounds(layout: MenuLayout): Bounds {
  return boundsFromCenter(
    layout.scene.centerX,
    layout.scene.centerY + layout.info.backButton.y,
    layout.info.backButton.width,
    layout.info.backButton.height
  );
}

function boundsFromCenter(x: number, y: number, width: number, height: number): Bounds {
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2
  };
}

function expectInsideCanvas(bounds: Bounds): void {
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(SCENE_WIDTH);
  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.bottom).toBeLessThanOrEqual(SCENE_HEIGHT);
}

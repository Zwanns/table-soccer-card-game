import { describe, expect, it } from 'vitest';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import {
  createTeamSelectLayout,
  createTeamsLayout,
  isMobileLandscapeTeamScreenViewport,
  type TeamSelectLayout,
  type TeamsLayout
} from '../ui/teamScreenLayout';

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

describe('team screen layout helper', () => {
  it('preserves TeamSelect desktop baseline coordinates', () => {
    const layout = createTeamSelectLayout({ width: 1600, height: 720 });

    expect(layout.mode).toBe('desktop');
    expect(layout.title).toMatchObject({ y: 34, fontSize: '34px' });
    expect(layout.subtitle).toMatchObject({ y: 72, fontSize: '24px' });
    expect(layout.selectedPanels).toMatchObject({
      playerOneX: 370,
      playerTwoX: 1230,
      y: 126,
      width: 440,
      height: 82,
      aiCheckboxX: 156,
      aiCheckboxY: -20
    });
    expect(layout.grid).toMatchObject({
      columns: 8,
      buttonWidth: 156,
      buttonHeight: 42,
      gapX: 12,
      gapY: 8,
      startY: 206
    });
    expect(layout.actions).toMatchObject({ backX: 258, startX: 1342, y: 666 });
  });

  it('preserves Teams desktop baseline coordinates', () => {
    const layout = createTeamsLayout({ width: 1600, height: 720 });

    expect(layout.mode).toBe('desktop');
    expect(layout.backButton).toMatchObject({ x: 146, y: 60, width: 132, height: 38 });
    expect(layout.teamList).toMatchObject({
      x: 80,
      columns: 4,
      cardWidth: 171,
      cardHeight: 30,
      gapX: 18,
      gapY: 6,
      startY: 112
    });
    expect(layout.squadPanel).toMatchObject({
      x: 840,
      y: 96,
      width: 760,
      height: 571,
      cardWidth: 380,
      tableY: 94,
      sectionRowGap: 28
    });
    expect(layout.preview).toMatchObject({
      offsetX: 190,
      colorsY: 62,
      colorRadius: 10,
      colorGap: 10,
      faceY: 190,
      backY: 432,
      cardScale: 1.45
    });
  });

  it('enables compact team screens only for small landscape display sizes', () => {
    expect(isMobileLandscapeTeamScreenViewport({ width: 1600, height: 720 })).toBe(false);
    expect(isMobileLandscapeTeamScreenViewport({ width: 1280, height: 720 })).toBe(false);
    expect(isMobileLandscapeTeamScreenViewport({ width: 1024, height: 576 })).toBe(true);
    expect(isMobileLandscapeTeamScreenViewport({ width: 932, height: 430 })).toBe(true);
    expect(isMobileLandscapeTeamScreenViewport({ width: 915, height: 412 })).toBe(true);
    expect(isMobileLandscapeTeamScreenViewport({ width: 844, height: 390 })).toBe(true);
    expect(isMobileLandscapeTeamScreenViewport({ width: 430, height: 932 })).toBe(false);
  });

  it.each(TEST_VIEWPORTS)('keeps TeamSelect controls inside canvas for $width x $height', (viewport) => {
    const layout = createTeamSelectLayout(viewport);

    expectInsideCanvas(boundsFromCenter(layout.selectedPanels.playerOneX, layout.selectedPanels.y, layout.selectedPanels.width, layout.selectedPanels.height));
    expectInsideCanvas(boundsFromCenter(layout.selectedPanels.playerTwoX, layout.selectedPanels.y, layout.selectedPanels.width, layout.selectedPanels.height));
    expectInsideCanvas(boundsFromCenter(layout.actions.backX, layout.actions.y, 220, 54));
    expectInsideCanvas(boundsFromCenter(layout.actions.startX, layout.actions.y, 220, 54));
    expectInsideCanvas(viewportBounds(layout.grid.viewport));
    expect(layout.grid.buttonHeight).toBeGreaterThanOrEqual(42);
  });

  it.each(TEST_VIEWPORTS)('keeps Teams list and preview panel inside canvas for $width x $height', (viewport) => {
    const layout = createTeamsLayout(viewport);

    expectInsideCanvas(boundsFromCenter(layout.backButton.x, layout.backButton.y, layout.backButton.width, layout.backButton.height));
    expectInsideCanvas(viewportBounds(layout.teamList.viewport));
    expectInsideCanvas(boundsFromOrigin(layout.squadPanel.x, layout.squadPanel.y, layout.squadPanel.cardWidth, layout.squadPanel.height));
    expectInsideCanvas(previewCardBounds(layout, 'face'));
    expectInsideCanvas(previewCardBounds(layout, 'back'));
    expectInsideCanvas(boundsFromCenter(previewCenterX(layout), layout.squadPanel.y + layout.preview.colorsY, 96, 28));
  });

  it('makes mobile TeamSelect and Teams more compact and scroll-friendly', () => {
    const teamSelectDesktop = createTeamSelectLayout({ width: 1600, height: 720 });
    const teamSelectMobile = createTeamSelectLayout({ width: 932, height: 430 });
    const teamsDesktop = createTeamsLayout({ width: 1600, height: 720 });
    const teamsMobile = createTeamsLayout({ width: 932, height: 430 });

    expect(teamSelectMobile.mode).toBe('mobile-landscape');
    expect(teamSelectMobile.grid.columns).toBeLessThan(teamSelectDesktop.grid.columns);
    expect(teamSelectMobile.grid.buttonWidth).toBeGreaterThan(teamSelectDesktop.grid.buttonWidth);
    expect(teamSelectMobile.grid.buttonHeight).toBeGreaterThan(teamSelectDesktop.grid.buttonHeight);
    expect(teamsMobile.mode).toBe('mobile-landscape');
    expect(teamsMobile.teamList.columns).toBeLessThan(teamsDesktop.teamList.columns);
    expect(teamsMobile.teamList.cardHeight).toBeGreaterThan(teamsDesktop.teamList.cardHeight);
    expect(teamsMobile.preview.cardScale).toBeLessThan(teamsDesktop.preview.cardScale);
  });
});

function previewCenterX(layout: TeamsLayout): number {
  return layout.squadPanel.x + layout.squadPanel.cardWidth + layout.preview.offsetX;
}

function previewCardBounds(layout: TeamsLayout, card: 'face' | 'back'): Bounds {
  const cardWidth = 108 * layout.preview.cardScale;
  const cardHeight = 148.5 * layout.preview.cardScale;
  const y = layout.squadPanel.y + (card === 'face' ? layout.preview.faceY : layout.preview.backY);

  return boundsFromCenter(previewCenterX(layout), y, cardWidth, cardHeight);
}

function viewportBounds(viewport: TeamSelectLayout['grid']['viewport']): Bounds {
  return boundsFromOrigin(viewport.x, viewport.y, viewport.width, viewport.height);
}

function boundsFromOrigin(x: number, y: number, width: number, height: number): Bounds {
  return {
    left: x,
    right: x + width,
    top: y,
    bottom: y + height
  };
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

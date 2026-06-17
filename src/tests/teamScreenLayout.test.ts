import { describe, expect, it } from 'vitest';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import {
  createTeamScreenLayout,
  rectBottom,
  rectRight,
  TEAM_SCREEN_GRID_COLUMNS,
  TEAM_SCREEN_GRID_GAP_X,
  TEAM_SCREEN_TEAM_BUTTON_HEIGHT,
  TEAM_SCREEN_TEAM_BUTTON_WIDTH
} from '../ui/teamScreenLayout';

describe('team selection screen layout', () => {
  it('aligns selected team cards and bottom buttons to the team grid edges', () => {
    const layout = createTeamScreenLayout({ mobileWide: false });
    const gridRight = rectRight(layout.teamGridRect);

    expect(layout.team1SelectedCardRect.x).toBe(layout.teamGridRect.x);
    expect(rectRight(layout.team2SelectedCardRect)).toBe(gridRight);
    expect(layout.menuButtonRect.x).toBe(layout.teamGridRect.x);
    expect(rectRight(layout.startButtonRect)).toBe(gridRight);
    expect(layout.vsPosition.x).toBe(SCENE_WIDTH / 2);
  });

  it('keeps kit previews between selected cards and VS', () => {
    const layout = createTeamScreenLayout({ mobileWide: false });

    expect(layout.team1KitPreviewRect.x).toBeGreaterThan(rectRight(layout.team1SelectedCardRect));
    expect(rectRight(layout.team1KitPreviewRect)).toBeLessThan(layout.vsPosition.x);
    expect(layout.team2KitPreviewRect.x).toBeGreaterThan(layout.vsPosition.x);
    expect(rectRight(layout.team2KitPreviewRect)).toBeLessThan(layout.team2SelectedCardRect.x);
  });

  it('uses larger readable team cards while keeping the grid inside the canvas', () => {
    const layout = createTeamScreenLayout({ mobileWide: false });
    const expectedGridWidth =
      TEAM_SCREEN_GRID_COLUMNS * TEAM_SCREEN_TEAM_BUTTON_WIDTH +
      (TEAM_SCREEN_GRID_COLUMNS - 1) * TEAM_SCREEN_GRID_GAP_X;

    expect(TEAM_SCREEN_TEAM_BUTTON_WIDTH).toBe(168);
    expect(TEAM_SCREEN_TEAM_BUTTON_HEIGHT).toBe(52);
    expect(layout.teamGridRect.width).toBe(expectedGridWidth);
    expect(layout.mobileWide).toBe(false);
    expect(layout.teamGridColumns).toBe(TEAM_SCREEN_GRID_COLUMNS);
    expect(layout.teamButtonWidth).toBe(TEAM_SCREEN_TEAM_BUTTON_WIDTH);
    expect(layout.teamButtonHeight).toBe(TEAM_SCREEN_TEAM_BUTTON_HEIGHT);
    expect(layout.controllerToggle).toMatchObject({
      orientation: 'horizontal',
      width: 90,
      height: 22,
      insetX: 8,
      insetY: 8,
      fontSize: '12px'
    });
    expect(rectRight(layout.teamGridRect)).toBeLessThanOrEqual(SCENE_WIDTH);
    expect(rectBottom(layout.teamGridRect)).toBeLessThanOrEqual(SCENE_HEIGHT);
  });

  it('keeps all desktop layout rects inside the game canvas', () => {
    const layout = createTeamScreenLayout({ mobileWide: false });
    const rects = [
      layout.teamGridRect,
      layout.team1SelectedCardRect,
      layout.team2SelectedCardRect,
      layout.menuButtonRect,
      layout.startButtonRect,
      layout.team1CoverFanRect,
      layout.team2CoverFanRect,
      layout.team1KitPreviewRect,
      layout.team2KitPreviewRect,
      layout.team1ControllerToggleRect,
      layout.team2ControllerToggleRect
    ];

    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rectRight(rect)).toBeLessThanOrEqual(SCENE_WIDTH);
      expect(rectBottom(rect)).toBeLessThanOrEqual(SCENE_HEIGHT);
    }
  });

  it('uses a wider mobile landscape grid while keeping it inside the canvas', () => {
    const desktopLayout = createTeamScreenLayout({ mobileWide: false });
    const mobileLayout = createTeamScreenLayout({ mobileWide: true });

    expect(mobileLayout.teamGridRect.width).toBeGreaterThan(desktopLayout.teamGridRect.width);
    expect(mobileLayout.mobileWide).toBe(true);
    expect(mobileLayout.teamGridRect.x).toBeLessThan(desktopLayout.teamGridRect.x);
    expect(rectRight(mobileLayout.teamGridRect)).toBeGreaterThan(rectRight(desktopLayout.teamGridRect));
    expect(mobileLayout.teamButtonWidth).toBeGreaterThan(desktopLayout.teamButtonWidth);
    expect(mobileLayout.teamGridColumns).toBe(desktopLayout.teamGridColumns);
    expect(mobileLayout.teamGridRect.x).toBeGreaterThanOrEqual(0);
    expect(rectRight(mobileLayout.teamGridRect)).toBeLessThanOrEqual(SCENE_WIDTH);
    expect(rectBottom(mobileLayout.teamGridRect)).toBeLessThanOrEqual(SCENE_HEIGHT);
  });

  it('uses a vertical mobile controller toggle while keeping desktop horizontal', () => {
    const desktopLayout = createTeamScreenLayout({ mobileWide: false });
    const mobileLayout = createTeamScreenLayout({ mobileWide: true });

    expect(desktopLayout.controllerToggle.orientation).toBe('horizontal');
    expect(mobileLayout.controllerToggle).toMatchObject({
      orientation: 'vertical',
      width: 62,
      height: 52,
      insetX: 10,
      insetY: 10,
      fontSize: '12px'
    });
    expect(mobileLayout.controllerToggle.height).toBeGreaterThan(desktopLayout.controllerToggle.height);
  });

  it('keeps mobile controller toggles inside selected cards and pinned to the right edge', () => {
    const layout = createTeamScreenLayout({ mobileWide: true });
    const toggles = [
      { card: layout.team1SelectedCardRect, toggle: layout.team1ControllerToggleRect },
      { card: layout.team2SelectedCardRect, toggle: layout.team2ControllerToggleRect }
    ];

    for (const { card, toggle } of toggles) {
      expect(toggle.x).toBeGreaterThanOrEqual(card.x);
      expect(toggle.y).toBeGreaterThanOrEqual(card.y);
      expect(rectRight(toggle)).toBe(rectRight(card) - layout.controllerToggle.insetX);
      expect(rectBottom(toggle)).toBe(rectBottom(card) - layout.controllerToggle.insetY);
      expect(rectRight(toggle)).toBeLessThanOrEqual(rectRight(card));
      expect(rectBottom(toggle)).toBeLessThanOrEqual(rectBottom(card));
    }

    expect(layout.team1ControllerToggleRect.width).toBe(layout.team2ControllerToggleRect.width);
    expect(layout.team1ControllerToggleRect.height).toBe(layout.team2ControllerToggleRect.height);
    expect(layout.team1ControllerToggleRect.x - layout.team1SelectedCardRect.x)
      .toBe(layout.team2ControllerToggleRect.x - layout.team2SelectedCardRect.x);
  });

  it('keeps mobile controller toggles clear of the central VS and kit area', () => {
    const layout = createTeamScreenLayout({ mobileWide: true });

    expect(rectRight(layout.team1ControllerToggleRect)).toBeLessThan(layout.team1KitPreviewRect.x);
    expect(layout.team2ControllerToggleRect.x).toBeGreaterThan(rectRight(layout.team2CoverFanRect));
    expect(layout.team2ControllerToggleRect.x).toBeGreaterThan(layout.vsPosition.x);
    expect(layout.team2ControllerToggleRect.x).toBeGreaterThan(rectRight(layout.team2KitPreviewRect));
  });

  it('aligns mobile landscape bottom buttons to the wider grid without overlapping the visible grid viewport', () => {
    const layout = createTeamScreenLayout({ mobileWide: true });
    const gridViewportBottom = layout.teamGridStartY + 360;

    expect(layout.menuButtonRect.x).toBe(layout.teamGridRect.x);
    expect(rectRight(layout.startButtonRect)).toBe(rectRight(layout.teamGridRect));
    expect(layout.menuButtonRect.y).toBeGreaterThanOrEqual(gridViewportBottom);
    expect(layout.startButtonRect.y).toBeGreaterThanOrEqual(gridViewportBottom);
  });

  it('keeps mobile landscape selected panels clear of VS and kit previews', () => {
    const layout = createTeamScreenLayout({ mobileWide: true });

    expect(layout.team1KitPreviewRect.x).toBeGreaterThan(rectRight(layout.team1SelectedCardRect));
    expect(rectRight(layout.team1KitPreviewRect)).toBeLessThan(layout.vsPosition.x);
    expect(layout.team2KitPreviewRect.x).toBeGreaterThan(layout.vsPosition.x);
    expect(rectRight(layout.team2KitPreviewRect)).toBeLessThan(layout.team2SelectedCardRect.x);
    expect(rectRight(layout.team1SelectedCardRect)).toBeLessThan(layout.vsPosition.x);
    expect(layout.team2SelectedCardRect.x).toBeGreaterThan(layout.vsPosition.x);
  });
});

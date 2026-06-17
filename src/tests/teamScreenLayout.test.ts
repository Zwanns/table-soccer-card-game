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
    expect(layout.teamGridColumns).toBe(TEAM_SCREEN_GRID_COLUMNS);
    expect(layout.teamButtonWidth).toBe(TEAM_SCREEN_TEAM_BUTTON_WIDTH);
    expect(layout.teamButtonHeight).toBe(TEAM_SCREEN_TEAM_BUTTON_HEIGHT);
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
      layout.team2KitPreviewRect
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
    expect(mobileLayout.teamGridRect.x).toBeLessThan(desktopLayout.teamGridRect.x);
    expect(rectRight(mobileLayout.teamGridRect)).toBeGreaterThan(rectRight(desktopLayout.teamGridRect));
    expect(mobileLayout.teamButtonWidth).toBeGreaterThan(desktopLayout.teamButtonWidth);
    expect(mobileLayout.teamGridColumns).toBe(desktopLayout.teamGridColumns);
    expect(mobileLayout.teamGridRect.x).toBeGreaterThanOrEqual(0);
    expect(rectRight(mobileLayout.teamGridRect)).toBeLessThanOrEqual(SCENE_WIDTH);
    expect(rectBottom(mobileLayout.teamGridRect)).toBeLessThanOrEqual(SCENE_HEIGHT);
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

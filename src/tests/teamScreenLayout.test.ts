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
    const layout = createTeamScreenLayout();
    const gridRight = rectRight(layout.teamGridRect);

    expect(layout.team1SelectedCardRect.x).toBe(layout.teamGridRect.x);
    expect(rectRight(layout.team2SelectedCardRect)).toBe(gridRight);
    expect(layout.menuButtonRect.x).toBe(layout.teamGridRect.x);
    expect(rectRight(layout.startButtonRect)).toBe(gridRight);
    expect(layout.vsPosition.x).toBe(SCENE_WIDTH / 2);
  });

  it('keeps kit previews between selected cards and VS', () => {
    const layout = createTeamScreenLayout();

    expect(layout.team1KitPreviewRect.x).toBeGreaterThan(rectRight(layout.team1SelectedCardRect));
    expect(rectRight(layout.team1KitPreviewRect)).toBeLessThan(layout.vsPosition.x);
    expect(layout.team2KitPreviewRect.x).toBeGreaterThan(layout.vsPosition.x);
    expect(rectRight(layout.team2KitPreviewRect)).toBeLessThan(layout.team2SelectedCardRect.x);
  });

  it('uses larger readable team cards while keeping the grid inside the canvas', () => {
    const layout = createTeamScreenLayout();
    const expectedGridWidth =
      TEAM_SCREEN_GRID_COLUMNS * TEAM_SCREEN_TEAM_BUTTON_WIDTH +
      (TEAM_SCREEN_GRID_COLUMNS - 1) * TEAM_SCREEN_GRID_GAP_X;

    expect(TEAM_SCREEN_TEAM_BUTTON_WIDTH).toBe(168);
    expect(TEAM_SCREEN_TEAM_BUTTON_HEIGHT).toBe(52);
    expect(layout.teamGridRect.width).toBe(expectedGridWidth);
    expect(rectRight(layout.teamGridRect)).toBeLessThanOrEqual(SCENE_WIDTH);
    expect(rectBottom(layout.teamGridRect)).toBeLessThanOrEqual(SCENE_HEIGHT);
  });

  it('keeps all desktop layout rects inside the game canvas', () => {
    const layout = createTeamScreenLayout();
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
});

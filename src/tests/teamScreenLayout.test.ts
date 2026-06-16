import { describe, expect, it } from 'vitest';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { createTeamScreenLayout, rectBottom, rectRight } from '../ui/teamScreenLayout';

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

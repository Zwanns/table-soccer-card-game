import { describe, expect, it } from 'vitest';
import {
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_BORDER_COLOR,
  SCOREBOARD_METAL_BORDER_COLOR,
  SCOREBOARD_TEXT_COLOR
} from '../ui/scoreboardStyle';
import { TEAM_CARD_STYLE } from '../ui/teamCardStyle';

describe('shared team card style', () => {
  it('uses the Teams menu scoreboard palette for normal, hover and selected cards', () => {
    expect(TEAM_CARD_STYLE.normal).toMatchObject({
      backgroundColor: SCOREBOARD_BACKGROUND_COLOR,
      borderColor: SCOREBOARD_METAL_BORDER_COLOR,
      textColor: SCOREBOARD_TEXT_COLOR
    });
    expect(TEAM_CARD_STYLE.hover.backgroundAlpha).toBeGreaterThan(TEAM_CARD_STYLE.normal.backgroundAlpha);
    expect(TEAM_CARD_STYLE.selected).toMatchObject({
      backgroundColor: SCOREBOARD_BACKGROUND_COLOR,
      borderColor: SCOREBOARD_BORDER_COLOR,
      borderWidth: 3,
      textColor: SCOREBOARD_TEXT_COLOR
    });
  });

  it('keeps empty slots muted but readable within the same color system', () => {
    expect(TEAM_CARD_STYLE.muted.backgroundColor).toBe(SCOREBOARD_BACKGROUND_COLOR);
    expect(TEAM_CARD_STYLE.muted.backgroundAlpha).toBeLessThan(TEAM_CARD_STYLE.normal.backgroundAlpha);
    expect(TEAM_CARD_STYLE.muted.textColor).toBe('#8fb39d');
  });
});

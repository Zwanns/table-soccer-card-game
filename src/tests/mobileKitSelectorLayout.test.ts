import { describe, expect, it } from 'vitest';
import { createTeamScreenLayout } from '../ui/teamScreenLayout';
import { getMobileKitCardLayout } from '../ui/mobileKitSelectorLayout';

describe('mobile kit selector header bounds', () => {
  it.each([1, 2] as const)('fits both cards without overlapping other header controls for slot %s', (slot) => {
    const layout = createTeamScreenLayout({ mobileWide: true });
    const preview = slot === 1 ? layout.team1KitPreviewRect : layout.team2KitPreviewRect;
    const panel = slot === 1 ? layout.team1SelectedCardRect : layout.team2SelectedCardRect;
    const front = getMobileKitCardLayout(preview, slot, true);
    const back = getMobileKitCardLayout(preview, slot, false);
    expect(back.x - front.x).toBe((slot === 1 ? 1 : -1) * front.width / 2);
    for (const card of [front, back]) {
      expect(card.y).toBeGreaterThan(51); // title bottom
      expect(card.y + card.height).toBeLessThan(layout.teamGridStartY);
      if (slot === 1) {
        expect(card.x).toBeGreaterThan(panel.x + panel.width);
        expect(card.x + card.width).toBeLessThan(layout.vsPosition.x - 30);
      } else {
        expect(card.x).toBeGreaterThan(layout.vsPosition.x + 30);
        expect(card.x + card.width).toBeLessThan(panel.x);
      }
    }
  });
});

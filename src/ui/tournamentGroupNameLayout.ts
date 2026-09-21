import type Phaser from 'phaser';
import type { TournamentSetupLayout } from './tournamentSetupLayout';

export const MOBILE_GROUP_NAME_MIN_FONT_SIZE = 24;
export const MOBILE_GROUP_NAME_MAX_LINES = 2;

export function getMobileGroupNameBounds(groups: TournamentSetupLayout['groups']) {
  const x = groups.slotFlagX + groups.slotFlagWidth / 2 + 14;
  return {
    x,
    y: groups.slotHeight / 2,
    width: groups.slotWidth - groups.slotAiButtonWidth - 12 - x,
    height: groups.slotHeight - 16
  };
}

type MeasuredText = Pick<Phaser.GameObjects.Text,
  'width' | 'height' | 'setPosition' | 'setOrigin' | 'setWordWrapWidth' |
  'setMaxLines' | 'setFontSize' | 'getWrappedText'>;

// Measure all wrapped lines before applying the two-line limit, so a clipped
// third line cannot make an oversized label appear to fit.
export function fitMobileGroupName(text: MeasuredText, groups: TournamentSetupLayout['groups']): void {
  const bounds = getMobileGroupNameBounds(groups);
  text.setPosition(bounds.x, bounds.y);
  text.setOrigin(0, 0.5);
  text.setWordWrapWidth(bounds.width, true);
  text.setMaxLines(0);
  for (let size = parseInt(groups.slotFontSize, 10); size >= MOBILE_GROUP_NAME_MIN_FONT_SIZE; size -= 1) {
    text.setFontSize(size);
    if (text.getWrappedText().length <= MOBILE_GROUP_NAME_MAX_LINES &&
        text.width <= bounds.width && text.height <= bounds.height) {
      break;
    }
  }
  text.setMaxLines(MOBILE_GROUP_NAME_MAX_LINES);
}

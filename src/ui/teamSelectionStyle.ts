import { SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_TEXT_COLOR } from './scoreboardStyle';

// Only Team Selection / Penalty teams card surfaces use this mobile palette.
// Alpha, borders and selection states remain owned by the existing renderer.
export function getTeamSelectionColors(mobileWide: boolean) {
  return {
    backgroundColor: mobileWide ? 0x1c1c1c : SCOREBOARD_BACKGROUND_COLOR,
    textColor: mobileWide ? '#ffffff' : SCOREBOARD_TEXT_COLOR
  };
}

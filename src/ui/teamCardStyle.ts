import {
  SCOREBOARD_BACKGROUND_ALPHA,
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_BORDER_ALPHA,
  SCOREBOARD_BORDER_COLOR,
  SCOREBOARD_METAL_BORDER_ALPHA,
  SCOREBOARD_METAL_BORDER_COLOR,
  SCOREBOARD_TEXT_COLOR
} from './scoreboardStyle';

export type TeamCardStyleState = 'normal' | 'hover' | 'selected' | 'muted' | 'panel';

export interface TeamCardVisualStyle {
  backgroundColor: number;
  backgroundAlpha: number;
  borderColor: number;
  borderAlpha: number;
  borderWidth: number;
  textColor: string;
}

export const TEAM_CARD_STYLE: Record<TeamCardStyleState, TeamCardVisualStyle> = {
  normal: {
    backgroundColor: SCOREBOARD_BACKGROUND_COLOR,
    backgroundAlpha: SCOREBOARD_BACKGROUND_ALPHA,
    borderColor: SCOREBOARD_METAL_BORDER_COLOR,
    borderAlpha: SCOREBOARD_METAL_BORDER_ALPHA,
    borderWidth: 2,
    textColor: SCOREBOARD_TEXT_COLOR
  },
  hover: {
    backgroundColor: SCOREBOARD_BACKGROUND_COLOR,
    backgroundAlpha: 0.98,
    borderColor: SCOREBOARD_METAL_BORDER_COLOR,
    borderAlpha: 1,
    borderWidth: 2,
    textColor: '#ffffff'
  },
  selected: {
    backgroundColor: SCOREBOARD_BACKGROUND_COLOR,
    backgroundAlpha: 0.98,
    borderColor: SCOREBOARD_BORDER_COLOR,
    borderAlpha: SCOREBOARD_BORDER_ALPHA,
    borderWidth: 3,
    textColor: SCOREBOARD_TEXT_COLOR
  },
  muted: {
    backgroundColor: SCOREBOARD_BACKGROUND_COLOR,
    backgroundAlpha: 0.72,
    borderColor: SCOREBOARD_METAL_BORDER_COLOR,
    borderAlpha: 0.62,
    borderWidth: 2,
    textColor: '#8fb39d'
  },
  panel: {
    backgroundColor: SCOREBOARD_BACKGROUND_COLOR,
    backgroundAlpha: 0.86,
    borderColor: SCOREBOARD_METAL_BORDER_COLOR,
    borderAlpha: SCOREBOARD_METAL_BORDER_ALPHA,
    borderWidth: 2,
    textColor: SCOREBOARD_TEXT_COLOR
  }
};

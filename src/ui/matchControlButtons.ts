import Phaser from 'phaser';
import { SCENE_WIDTH } from '../config';
import { Button } from './Button';
import { MATCH_ADVANTAGE_CENTER_Y, MATCH_SCOREBOARD_CENTER_X, MATCH_SCOREBOARD_CENTER_Y } from './matchScreenLayout';
import { SCORE_VIEW_HEIGHT, SCORE_VIEW_WIDTH } from './ScoreView';
import { MOBILE_ADVANTAGE_VIEW_HEIGHT } from './AdvantageView';

const SCOREBOARD_LEFT = MATCH_SCOREBOARD_CENTER_X - SCORE_VIEW_WIDTH / 2;
const SCOREBOARD_RIGHT = MATCH_SCOREBOARD_CENTER_X + SCORE_VIEW_WIDTH / 2;
const HORIZONTAL_GAP = 14;

export const MATCH_CONTROL_BUTTON_WIDTH = Math.min(SCOREBOARD_LEFT, SCENE_WIDTH - SCOREBOARD_RIGHT) - 2 * HORIZONTAL_GAP;
export const MATCH_CONTROL_BUTTON_LEFT_X = SCOREBOARD_LEFT / 2;
export const MATCH_CONTROL_BUTTON_RIGHT_X = (SCOREBOARD_RIGHT + SCENE_WIDTH) / 2;
export const MATCH_CONTROL_BUTTON_FONT_SIZE = '28px';
export const MATCH_CONTROL_BUTTON_HEIGHT = 86;
export const MATCH_CONTROL_BUTTON_CENTER_Y = MATCH_SCOREBOARD_CENTER_Y + 7;
export const MATCH_CONTROL_BUTTON_DEPTH = 100;

export function getMatchTopPanelLayout(mobile: boolean) {
  const buttonWidth = MATCH_CONTROL_BUTTON_WIDTH + (mobile ? HORIZONTAL_GAP : 0);
  const top = MATCH_CONTROL_BUTTON_CENTER_Y - MATCH_CONTROL_BUTTON_HEIGHT / 2;
  return {
    buttonWidth,
    leftX: mobile ? SCOREBOARD_LEFT - buttonWidth / 2 : MATCH_CONTROL_BUTTON_LEFT_X,
    rightX: mobile ? SCOREBOARD_RIGHT + buttonWidth / 2 : MATCH_CONTROL_BUTTON_RIGHT_X,
    scoreY: mobile ? top + SCORE_VIEW_HEIGHT / 2 : MATCH_SCOREBOARD_CENTER_Y,
    advantageY: mobile ? top + SCORE_VIEW_HEIGHT + MOBILE_ADVANTAGE_VIEW_HEIGHT / 2 : MATCH_ADVANTAGE_CENTER_Y
  };
}

export interface MatchControlButtonsConfig {
  scene: Phaser.Scene;
  onPause: () => void;
  onRules: () => void;
  disabled?: boolean;
  mobileUnified?: boolean;
  labels?: {
    pause?: string;
    rules?: string;
  };
}

export function createMatchControlButtons(config: MatchControlButtonsConfig): {
  pauseButton: Button;
  rulesButton: Button;
} {
  const layout = getMatchTopPanelLayout(config.mobileUnified === true);
  const options = {
    disabled: config.disabled,
    fontSize: MATCH_CONTROL_BUTTON_FONT_SIZE,
    height: MATCH_CONTROL_BUTTON_HEIGHT,
    width: layout.buttonWidth
  } as const;
  const pauseButton = new Button(
    config.scene,
    layout.leftX,
    MATCH_CONTROL_BUTTON_CENTER_Y,
    config.labels?.pause ?? 'Pause',
    config.onPause,
    options
  ).setDepth(MATCH_CONTROL_BUTTON_DEPTH);
  const rulesButton = new Button(
    config.scene,
    layout.rightX,
    MATCH_CONTROL_BUTTON_CENTER_Y,
    config.labels?.rules ?? 'Rules',
    config.onRules,
    options
  ).setDepth(MATCH_CONTROL_BUTTON_DEPTH);

  return { pauseButton, rulesButton };
}

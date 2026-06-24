import Phaser from 'phaser';
import { SCENE_WIDTH } from '../config';
import { Button } from './Button';
import { MATCH_FIELD_WIDTH, MATCH_SCOREBOARD_CENTER_Y } from './matchScreenLayout';
import { SCORE_VIEW_HEIGHT, SCORE_VIEW_WIDTH } from './ScoreView';

const FIELD_LEFT = (SCENE_WIDTH - MATCH_FIELD_WIDTH) / 2;
const FIELD_RIGHT = FIELD_LEFT + MATCH_FIELD_WIDTH;
const SCOREBOARD_LEFT = SCENE_WIDTH / 2 - SCORE_VIEW_WIDTH / 2;
const SCOREBOARD_RIGHT = SCENE_WIDTH / 2 + SCORE_VIEW_WIDTH / 2;
const HORIZONTAL_GAP = 14;
const LEFT_AREA_RIGHT = SCOREBOARD_LEFT - HORIZONTAL_GAP;
const RIGHT_AREA_LEFT = SCOREBOARD_RIGHT + HORIZONTAL_GAP;

export const MATCH_CONTROL_BUTTON_WIDTH = Math.min(LEFT_AREA_RIGHT - FIELD_LEFT, FIELD_RIGHT - RIGHT_AREA_LEFT);
export const MATCH_CONTROL_BUTTON_LEFT_X = FIELD_LEFT + MATCH_CONTROL_BUTTON_WIDTH / 2;
export const MATCH_CONTROL_BUTTON_RIGHT_X = FIELD_RIGHT - MATCH_CONTROL_BUTTON_WIDTH / 2;
export const MATCH_CONTROL_BUTTON_FONT_SIZE = '28px';
export const MATCH_CONTROL_BUTTON_HEIGHT = 86;
export const MATCH_CONTROL_BUTTON_CENTER_Y = MATCH_SCOREBOARD_CENTER_Y + 7;
export const MATCH_CONTROL_BUTTON_DEPTH = 100;

export interface MatchControlButtonsConfig {
  scene: Phaser.Scene;
  onPause: () => void;
  onRules: () => void;
  disabled?: boolean;
  labels?: {
    pause?: string;
    rules?: string;
  };
}

export function createMatchControlButtons(config: MatchControlButtonsConfig): {
  pauseButton: Button;
  rulesButton: Button;
} {
  const options = {
    disabled: config.disabled,
    fontSize: MATCH_CONTROL_BUTTON_FONT_SIZE,
    height: MATCH_CONTROL_BUTTON_HEIGHT,
    width: MATCH_CONTROL_BUTTON_WIDTH
  } as const;
  const pauseButton = new Button(
    config.scene,
    MATCH_CONTROL_BUTTON_LEFT_X,
    MATCH_CONTROL_BUTTON_CENTER_Y,
    config.labels?.pause ?? 'Pause',
    config.onPause,
    options
  ).setDepth(MATCH_CONTROL_BUTTON_DEPTH);
  const rulesButton = new Button(
    config.scene,
    MATCH_CONTROL_BUTTON_RIGHT_X,
    MATCH_CONTROL_BUTTON_CENTER_Y,
    config.labels?.rules ?? 'Rules',
    config.onRules,
    options
  ).setDepth(MATCH_CONTROL_BUTTON_DEPTH);

  return { pauseButton, rulesButton };
}

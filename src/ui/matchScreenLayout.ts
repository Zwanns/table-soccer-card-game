import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { FIELD_VIEW_HEIGHT, FIELD_VIEW_WIDTH } from './fieldDimensions';

export const MATCH_SCREEN_WIDTH = SCENE_WIDTH;
export const MATCH_SCREEN_HEIGHT = SCENE_HEIGHT;

export const MATCH_FIELD_WIDTH = FIELD_VIEW_WIDTH;
export const MATCH_FIELD_HEIGHT = FIELD_VIEW_HEIGHT;
export const MATCH_FIELD_CENTER_X = MATCH_SCREEN_WIDTH / 2;
export const MATCH_FIELD_CENTER_Y = 400;

export const MATCH_SCOREBOARD_CENTER_X = MATCH_SCREEN_WIDTH / 2;
export const MATCH_SCOREBOARD_CENTER_Y = 42;
export const MATCH_ADVANTAGE_CENTER_Y = 92;
export const MATCH_DECK_Y = 560;
// Keep player-name overlays below the scoreboard, advantage bar and their margin.
export const MATCH_TOOLTIP_VIEWPORT = { x: 0, y: 104, width: MATCH_SCREEN_WIDTH, height: MATCH_SCREEN_HEIGHT - 104 } as const;

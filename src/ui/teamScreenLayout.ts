import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';

export interface TeamScreenPoint {
  x: number;
  y: number;
}

export interface TeamScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TeamScreenLayout {
  teamGridRect: TeamScreenRect;
  team1SelectedCardRect: TeamScreenRect;
  team2SelectedCardRect: TeamScreenRect;
  menuButtonRect: TeamScreenRect;
  startButtonRect: TeamScreenRect;
  team1CoverFanRect: TeamScreenRect;
  team2CoverFanRect: TeamScreenRect;
  team1KitPreviewRect: TeamScreenRect;
  team2KitPreviewRect: TeamScreenRect;
  vsPosition: TeamScreenPoint;
}

export const TEAM_SCREEN_GRID_COLUMNS = 8;
export const TEAM_SCREEN_GRID_ROWS = 9;
export const TEAM_SCREEN_TEAM_BUTTON_WIDTH = 160;
export const TEAM_SCREEN_TEAM_BUTTON_HEIGHT = 50;
export const TEAM_SCREEN_GRID_GAP_X = 12;
export const TEAM_SCREEN_GRID_GAP_Y = 8;
export const TEAM_SCREEN_GRID_START_Y = 210;

const SELECTED_CARD_WIDTH = 440;
const SELECTED_CARD_HEIGHT = 100;
const SELECTED_CARD_CENTER_Y = 150;
const MENU_BUTTON_WIDTH = 220;
const START_BUTTON_WIDTH = 260;
const BOTTOM_BUTTON_HEIGHT = 54;
const BOTTOM_BUTTON_CENTER_Y = 666;
const COVER_FAN_WIDTH = 116;
const COVER_FAN_HEIGHT = 68;
const COVER_FAN_INSET_X = 18;
const KIT_PREVIEW_WIDTH = 70;
const KIT_PREVIEW_HEIGHT = 90;

export function createTeamScreenLayout(
  sceneWidth = SCENE_WIDTH,
  sceneHeight = SCENE_HEIGHT
): TeamScreenLayout {
  const gridWidth =
    TEAM_SCREEN_GRID_COLUMNS * TEAM_SCREEN_TEAM_BUTTON_WIDTH +
    (TEAM_SCREEN_GRID_COLUMNS - 1) * TEAM_SCREEN_GRID_GAP_X;
  const gridHeight =
    TEAM_SCREEN_GRID_ROWS * TEAM_SCREEN_TEAM_BUTTON_HEIGHT +
    (TEAM_SCREEN_GRID_ROWS - 1) * TEAM_SCREEN_GRID_GAP_Y;
  const gridLeft = (sceneWidth - gridWidth) / 2;
  const gridTop = TEAM_SCREEN_GRID_START_Y - TEAM_SCREEN_TEAM_BUTTON_HEIGHT / 2;
  const gridRight = gridLeft + gridWidth;
  const selectedTop = SELECTED_CARD_CENTER_Y - SELECTED_CARD_HEIGHT / 2;
  const team1SelectedCardRect = {
    x: gridLeft,
    y: selectedTop,
    width: SELECTED_CARD_WIDTH,
    height: SELECTED_CARD_HEIGHT
  };
  const team2SelectedCardRect = {
    x: gridRight - SELECTED_CARD_WIDTH,
    y: selectedTop,
    width: SELECTED_CARD_WIDTH,
    height: SELECTED_CARD_HEIGHT
  };
  const vsPosition = {
    x: sceneWidth / 2,
    y: SELECTED_CARD_CENTER_Y
  };

  return {
    teamGridRect: {
      x: gridLeft,
      y: gridTop,
      width: gridWidth,
      height: gridHeight
    },
    team1SelectedCardRect,
    team2SelectedCardRect,
    menuButtonRect: {
      x: gridLeft,
      y: BOTTOM_BUTTON_CENTER_Y - BOTTOM_BUTTON_HEIGHT / 2,
      width: MENU_BUTTON_WIDTH,
      height: BOTTOM_BUTTON_HEIGHT
    },
    startButtonRect: {
      x: gridRight - START_BUTTON_WIDTH,
      y: BOTTOM_BUTTON_CENTER_Y - BOTTOM_BUTTON_HEIGHT / 2,
      width: START_BUTTON_WIDTH,
      height: BOTTOM_BUTTON_HEIGHT
    },
    team1CoverFanRect: {
      x: team1SelectedCardRect.x + COVER_FAN_INSET_X,
      y: team1SelectedCardRect.y + (team1SelectedCardRect.height - COVER_FAN_HEIGHT) / 2,
      width: COVER_FAN_WIDTH,
      height: COVER_FAN_HEIGHT
    },
    team2CoverFanRect: {
      x: team2SelectedCardRect.x + COVER_FAN_INSET_X,
      y: team2SelectedCardRect.y + (team2SelectedCardRect.height - COVER_FAN_HEIGHT) / 2,
      width: COVER_FAN_WIDTH,
      height: COVER_FAN_HEIGHT
    },
    team1KitPreviewRect: createCenteredRect(
      (team1SelectedCardRect.x + team1SelectedCardRect.width + vsPosition.x) / 2,
      SELECTED_CARD_CENTER_Y,
      KIT_PREVIEW_WIDTH,
      KIT_PREVIEW_HEIGHT
    ),
    team2KitPreviewRect: createCenteredRect(
      (vsPosition.x + team2SelectedCardRect.x) / 2,
      SELECTED_CARD_CENTER_Y,
      KIT_PREVIEW_WIDTH,
      KIT_PREVIEW_HEIGHT
    ),
    vsPosition
  };
}

export function rectCenter(rect: TeamScreenRect): TeamScreenPoint {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

export function rectRight(rect: TeamScreenRect): number {
  return rect.x + rect.width;
}

export function rectBottom(rect: TeamScreenRect): number {
  return rect.y + rect.height;
}

function createCenteredRect(x: number, y: number, width: number, height: number): TeamScreenRect {
  return {
    x: x - width / 2,
    y: y - height / 2,
    width,
    height
  };
}

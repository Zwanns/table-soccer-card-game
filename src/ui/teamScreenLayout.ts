import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { isMobileLandscapeLayout } from './mobileLayout';

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

export type TeamScreenControllerToggleOrientation = 'horizontal' | 'vertical';

export interface TeamScreenControllerToggleLayout {
  orientation: TeamScreenControllerToggleOrientation;
  width: number;
  height: number;
  insetX: number;
  insetY: number;
  fontSize: string;
  fullHeight: boolean;
}

export interface TeamScreenLayout {
  mobileWide: boolean;
  teamGridRect: TeamScreenRect;
  teamGridColumns: number;
  teamButtonWidth: number;
  teamButtonHeight: number;
  teamGridGapX: number;
  teamGridGapY: number;
  teamGridStartY: number;
  team1SelectedCardRect: TeamScreenRect;
  team2SelectedCardRect: TeamScreenRect;
  menuButtonRect: TeamScreenRect;
  startButtonRect: TeamScreenRect;
  team1CoverFanRect: TeamScreenRect;
  team2CoverFanRect: TeamScreenRect;
  team1KitPreviewRect: TeamScreenRect;
  team2KitPreviewRect: TeamScreenRect;
  team1ControllerToggleRect: TeamScreenRect;
  team2ControllerToggleRect: TeamScreenRect;
  controllerToggle: TeamScreenControllerToggleLayout;
  vsPosition: TeamScreenPoint;
}

export const TEAM_SCREEN_GRID_COLUMNS = 8;
export const TEAM_SCREEN_GRID_ROWS = 9;
export const TEAM_SCREEN_TEAM_BUTTON_WIDTH = 168;
export const TEAM_SCREEN_TEAM_BUTTON_HEIGHT = 52;
export const TEAM_SCREEN_GRID_GAP_X = 10;
export const TEAM_SCREEN_GRID_GAP_Y = 8;
export const TEAM_SCREEN_GRID_START_Y = 210;

interface TeamSelectLayoutConfig {
  gridColumns: number;
  gridRows: number;
  teamButtonWidth: number;
  teamButtonHeight: number;
  gridGapX: number;
  gridGapY: number;
  gridStartY: number;
  selectedCardWidth: number;
  selectedCardHeight: number;
  selectedCardCenterY: number;
  menuButtonWidth: number;
  startButtonWidth: number;
  bottomButtonHeight: number;
  bottomButtonCenterY: number;
  coverFanWidth: number;
  coverFanHeight: number;
  coverFanInsetX: number;
  coverFanInsetY: number;
  kitPreviewWidth: number;
  kitPreviewHeight: number;
  controllerToggle: TeamScreenControllerToggleLayout;
}

export interface TeamScreenLayoutOptions {
  sceneWidth?: number;
  sceneHeight?: number;
  mobileWide?: boolean;
}

const DESKTOP_TEAM_SELECT_LAYOUT: TeamSelectLayoutConfig = {
  gridColumns: TEAM_SCREEN_GRID_COLUMNS,
  gridRows: TEAM_SCREEN_GRID_ROWS,
  teamButtonWidth: TEAM_SCREEN_TEAM_BUTTON_WIDTH,
  teamButtonHeight: TEAM_SCREEN_TEAM_BUTTON_HEIGHT,
  gridGapX: TEAM_SCREEN_GRID_GAP_X,
  gridGapY: TEAM_SCREEN_GRID_GAP_Y,
  gridStartY: TEAM_SCREEN_GRID_START_Y,
  selectedCardWidth: 440,
  selectedCardHeight: 100,
  selectedCardCenterY: 150,
  menuButtonWidth: 220,
  startButtonWidth: 260,
  bottomButtonHeight: 54,
  bottomButtonCenterY: 666,
  coverFanWidth: 150,
  coverFanHeight: 112,
  coverFanInsetX: -16,
  coverFanInsetY: -18,
  kitPreviewWidth: 70,
  kitPreviewHeight: 90,
  controllerToggle: {
    orientation: 'horizontal',
    width: 90,
    height: 22,
    insetX: 8,
    insetY: 8,
    fontSize: '12px',
    fullHeight: false
  }
};

const MOBILE_WIDE_TEAM_SELECT_LAYOUT: TeamSelectLayoutConfig = {
  ...DESKTOP_TEAM_SELECT_LAYOUT,
  teamButtonWidth: 180,
  gridGapX: 12,
  selectedCardWidth: 480,
  coverFanWidth: 142,
  coverFanHeight: 106,
  coverFanInsetX: -10,
  coverFanInsetY: -12,
  menuButtonWidth: 240,
  startButtonWidth: 300,
  controllerToggle: {
    orientation: 'vertical',
    width: 68,
    height: 0,
    insetX: 0,
    insetY: 0,
    fontSize: '13px',
    fullHeight: true
  }
};

export function createTeamScreenLayout(
  options: TeamScreenLayoutOptions = {}
): TeamScreenLayout {
  const sceneWidth = options.sceneWidth ?? SCENE_WIDTH;
  const sceneHeight = options.sceneHeight ?? SCENE_HEIGHT;
  const mobileWide = options.mobileWide ?? isMobileLandscapeLayout();
  const layout = mobileWide
    ? MOBILE_WIDE_TEAM_SELECT_LAYOUT
    : DESKTOP_TEAM_SELECT_LAYOUT;
  const gridWidth =
    layout.gridColumns * layout.teamButtonWidth +
    (layout.gridColumns - 1) * layout.gridGapX;
  const gridHeight =
    layout.gridRows * layout.teamButtonHeight +
    (layout.gridRows - 1) * layout.gridGapY;
  const gridLeft = (sceneWidth - gridWidth) / 2;
  const gridTop = layout.gridStartY - layout.teamButtonHeight / 2;
  const gridRight = gridLeft + gridWidth;
  const selectedTop = layout.selectedCardCenterY - layout.selectedCardHeight / 2;
  const team1SelectedCardRect = {
    x: gridLeft,
    y: selectedTop,
    width: layout.selectedCardWidth,
    height: layout.selectedCardHeight
  };
  const team2SelectedCardRect = {
    x: gridRight - layout.selectedCardWidth,
    y: selectedTop,
    width: layout.selectedCardWidth,
    height: layout.selectedCardHeight
  };
  const controllerToggle = resolveControllerToggleLayout(layout.controllerToggle, layout.selectedCardHeight);
  const vsPosition = {
    x: sceneWidth / 2,
    y: layout.selectedCardCenterY
  };

  return {
    mobileWide,
    teamGridRect: {
      x: gridLeft,
      y: gridTop,
      width: gridWidth,
      height: gridHeight
    },
    teamGridColumns: layout.gridColumns,
    teamButtonWidth: layout.teamButtonWidth,
    teamButtonHeight: layout.teamButtonHeight,
    teamGridGapX: layout.gridGapX,
    teamGridGapY: layout.gridGapY,
    teamGridStartY: layout.gridStartY,
    team1SelectedCardRect,
    team2SelectedCardRect,
    menuButtonRect: {
      x: gridLeft,
      y: layout.bottomButtonCenterY - layout.bottomButtonHeight / 2,
      width: layout.menuButtonWidth,
      height: layout.bottomButtonHeight
    },
    startButtonRect: {
      x: gridRight - layout.startButtonWidth,
      y: layout.bottomButtonCenterY - layout.bottomButtonHeight / 2,
      width: layout.startButtonWidth,
      height: layout.bottomButtonHeight
    },
    team1CoverFanRect: {
      x: team1SelectedCardRect.x + layout.coverFanInsetX,
      y: team1SelectedCardRect.y + layout.coverFanInsetY,
      width: layout.coverFanWidth,
      height: layout.coverFanHeight
    },
    team2CoverFanRect: {
      x: team2SelectedCardRect.x + layout.coverFanInsetX,
      y: team2SelectedCardRect.y + layout.coverFanInsetY,
      width: layout.coverFanWidth,
      height: layout.coverFanHeight
    },
    team1KitPreviewRect: createCenteredRect(
      (team1SelectedCardRect.x + team1SelectedCardRect.width + vsPosition.x) / 2,
      layout.selectedCardCenterY,
      layout.kitPreviewWidth,
      layout.kitPreviewHeight
    ),
    team2KitPreviewRect: createCenteredRect(
      (vsPosition.x + team2SelectedCardRect.x) / 2,
      layout.selectedCardCenterY,
      layout.kitPreviewWidth,
      layout.kitPreviewHeight
    ),
    team1ControllerToggleRect: createControllerToggleRect(team1SelectedCardRect, controllerToggle),
    team2ControllerToggleRect: createControllerToggleRect(team2SelectedCardRect, controllerToggle),
    controllerToggle,
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

function createControllerToggleRect(
  selectedCardRect: TeamScreenRect,
  toggleLayout: TeamScreenControllerToggleLayout
): TeamScreenRect {
  const height = toggleLayout.fullHeight ? selectedCardRect.height : toggleLayout.height;

  return {
    x: rectRight(selectedCardRect) - toggleLayout.insetX - toggleLayout.width,
    y: toggleLayout.fullHeight
      ? selectedCardRect.y
      : rectBottom(selectedCardRect) - toggleLayout.insetY - height,
    width: toggleLayout.width,
    height
  };
}

function resolveControllerToggleLayout(
  toggleLayout: TeamScreenControllerToggleLayout,
  selectedCardHeight: number
): TeamScreenControllerToggleLayout {
  if (!toggleLayout.fullHeight) {
    return toggleLayout;
  }

  return {
    ...toggleLayout,
    height: selectedCardHeight
  };
}

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
export const TEAM_BUTTON_VISUAL_HEIGHT_OFFSET = 6;
export const TEAM_GRID_VIEWPORT_HEIGHT = 360;
export const MOBILE_TEAM_CARD_SCALE = 2;

// Country options share this geometry in quick-match and penalty team selection.
// Keep the surrounding selected-team panels and navigation anchored to the original grid.
export function createTeamCountryGridLayout(layout: TeamScreenLayout, teamCount: number) {
  const scale = layout.mobileWide ? MOBILE_TEAM_CARD_SCALE : 1;
  const baseWidth = layout.teamButtonWidth;
  const baseHeight = layout.teamButtonHeight + TEAM_BUTTON_VISUAL_HEIGHT_OFFSET;
  const cardWidth = baseWidth * scale;
  const cardHeight = baseHeight * scale;
  const gapX = layout.teamGridGapX * scale;
  const gapY = layout.teamGridGapY * scale;
  const columns = layout.mobileWide
    ? Math.max(1, Math.floor((layout.teamGridRect.width + gapX) / (cardWidth + gapX)))
    : layout.teamGridColumns;
  const rowCount = Math.ceil(teamCount / columns);
  const rowHeight = cardHeight + gapY;
  const contentHeight = Math.max(0, rowCount * rowHeight - gapY);
  const gridWidth = columns * cardWidth + (columns - 1) * gapX;

  return {
    scale, baseWidth, baseHeight, cardWidth, cardHeight, gapX, gapY,
    columns, rowCount, rowHeight, contentHeight,
    startX: layout.teamGridRect.x + (layout.teamGridRect.width - gridWidth) / 2 + cardWidth / 2,
    maxScroll: Math.max(0, contentHeight - TEAM_GRID_VIEWPORT_HEIGHT)
  };
}

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
  coverFanWidth: 170,
  coverFanHeight: 118,
  coverFanInsetX: -10,
  coverFanInsetY: -12,
  kitPreviewWidth: 86,
  kitPreviewHeight: 110,
  menuButtonWidth: 240,
  startButtonWidth: 300,
  controllerToggle: {
    orientation: 'vertical',
    width: 68,
    height: 0,
    insetX: 0,
    insetY: 0,
    fontSize: '26px',
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
      x: mobileWide
        ? rectRight(team2SelectedCardRect) - layout.coverFanInsetX - layout.coverFanWidth
        : team2SelectedCardRect.x + layout.coverFanInsetX,
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
    team2ControllerToggleRect: createControllerToggleRect(team2SelectedCardRect, controllerToggle, mobileWide),
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

export const SELECTED_COVER_FAN_MOBILE_CARD_SCALE = 0.70;
const MOBILE_SELECTED_FAN_OFFSET_X = 8;
const SELECTED_PANEL_LABEL_OFFSET_Y = 16;
const MOBILE_RIGHT_LABEL_OFFSET_Y = 28;

// Shared by Quick Match and Penalty selection. Mobile headers mirror horizontal
// anchors and share the same label height; desktop retains its original anchors.
export function createSelectedTeamHeaderLayout(
  panel: TeamScreenRect,
  coverFan: TeamScreenRect,
  slot: 1 | 2,
  mobileWide: boolean
) {
  const fanCenter = rectCenter(coverFan);
  const leftLabel = mobileWide && slot === 2;
  return {
    fanCenter: { x: fanCenter.x + (mobileWide ? (slot === 2 ? -1 : 1) * MOBILE_SELECTED_FAN_OFFSET_X : 0), y: fanCenter.y },
    label: {
      x: leftLabel ? panel.x : rectRight(panel),
      y: panel.y - (mobileWide ? MOBILE_RIGHT_LABEL_OFFSET_Y : SELECTED_PANEL_LABEL_OFFSET_Y),
      originX: leftLabel ? 0 : 1,
      align: leftLabel ? 'left' : 'right'
    }
  };
}

// Shared selected-name contract for quick match and standalone penalties.
// Coordinates are local to the selected panel; artwork and controls stay anchored.
export function createSelectedTeamNameLayout(
  panel: TeamScreenRect,
  coverFan: TeamScreenRect,
  toggle: TeamScreenRect,
  mobileWide: boolean
) {
  const mirrored = mobileWide && toggle.x < coverFan.x;
  const left = mirrored ? rectRight(toggle) + 14 : rectRight(coverFan) + 18;
  const width = mobileWide ? (mirrored ? coverFan.x - 18 : toggle.x - 14) - left : 260;
  return {
    x: (mobileWide && !mirrored ? left + width : left) - rectCenter(panel).x,
    originX: mobileWide && !mirrored ? 1 : 0,
    y: 0,
    style: {
      align: mobileWide && !mirrored ? 'right' : 'left',
      fontSize: mobileWide ? '34px' : '26px',
      wordWrap: mobileWide ? { width, useAdvancedWrap: true } : { width },
      ...(mobileWide ? { maxLines: 2, lineSpacing: -2 } : {})
    }
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
  toggleLayout: TeamScreenControllerToggleLayout,
  leftAligned = false
): TeamScreenRect {
  const height = toggleLayout.fullHeight ? selectedCardRect.height : toggleLayout.height;

  return {
    x: leftAligned
      ? selectedCardRect.x + toggleLayout.insetX
      : rectRight(selectedCardRect) - toggleLayout.insetX - toggleLayout.width,
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

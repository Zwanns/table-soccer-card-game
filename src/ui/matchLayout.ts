import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';

export type MatchLayoutMode = 'desktop' | 'mobile-landscape';

export interface MatchViewportSize {
  width: number;
  height: number;
}

export interface MatchLayout {
  mode: MatchLayoutMode;
  scene: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  actionButtons: {
    leftX: number;
    rightX: number;
    top: number;
    width: number;
    height: number;
    gap: number;
    fontSize: string;
  };
  scoreboard: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  advantage: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  field: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
  decks: {
    playerOneX: number;
    playerTwoX: number;
    y: number;
    scale: number;
  };
  teamStats: {
    playerOneX: number;
    playerTwoX: number;
    y: number;
    scale: number;
  };
  info: {
    modal: {
      width: number;
      height: number;
    };
    viewport: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    backButton: {
      y: number;
      width: number;
      height: number;
      fontSize: string;
    };
    languageSelector: {
      x: number;
      y: number;
    };
    titleY: number;
    subtitleY: number;
    authorY: number;
  };
}

export const MATCH_FIELD_WIDTH = 1120;
export const MATCH_FIELD_HEIGHT = 600;
export const MATCH_CARD_WIDTH = 108;
export const MATCH_CARD_HEIGHT = 148.5;
export const MATCH_DECK_VISUAL_OVERHANG = 24;
export const MATCH_SCOREBOARD_WIDTH = 520;
export const MATCH_SCOREBOARD_HEIGHT = 78;
export const MATCH_ADVANTAGE_WIDTH = 520;
export const MATCH_ADVANTAGE_HEIGHT = 22;
export const MATCH_TEAM_STATS_WIDTH = 200;
export const MATCH_TEAM_STATS_HEIGHT = 288;

const DESKTOP_SCOREBOARD_CENTER_Y = 42;
const DESKTOP_ADVANTAGE_CENTER_Y = 94;
const DESKTOP_FIELD_TOP = 100;
const DESKTOP_FIELD_CENTER_Y = 400;
const DESKTOP_DECK_Y = 560;
const DESKTOP_SIDE_ACTION_BUTTON_HORIZONTAL_GAP = 14;
const DESKTOP_MATCH_ACTION_BUTTON_HEIGHT = 38;
const DESKTOP_MATCH_ACTION_BUTTON_GAP = 10;

const MOBILE_COMPACT_MAX_DISPLAY_WIDTH = 1100;
const MOBILE_COMPACT_MAX_DISPLAY_HEIGHT = 620;

export function createMatchLayout(
  viewport: MatchViewportSize,
  gameSize: MatchViewportSize = { width: SCENE_WIDTH, height: SCENE_HEIGHT }
): MatchLayout {
  return isMobileLandscapeViewport(viewport) ? createMobileLandscapeLayout(gameSize) : createDesktopMatchLayout(gameSize);
}

export function isMobileLandscapeViewport(viewport: MatchViewportSize): boolean {
  return (
    viewport.width > viewport.height &&
    (viewport.width <= MOBILE_COMPACT_MAX_DISPLAY_WIDTH || viewport.height <= MOBILE_COMPACT_MAX_DISPLAY_HEIGHT)
  );
}

function createDesktopMatchLayout(gameSize: MatchViewportSize): MatchLayout {
  const centerX = gameSize.width / 2;
  const centerY = gameSize.height / 2;
  const fieldLeft = centerX - MATCH_FIELD_WIDTH / 2;
  const fieldRight = fieldLeft + MATCH_FIELD_WIDTH;
  const scoreboardLeft = centerX - MATCH_SCOREBOARD_WIDTH / 2;
  const scoreboardRight = centerX + MATCH_SCOREBOARD_WIDTH / 2;
  const leftActionButtonsLeft = fieldLeft;
  const leftActionButtonsRight = scoreboardLeft - DESKTOP_SIDE_ACTION_BUTTON_HORIZONTAL_GAP;
  const rightActionButtonsLeft = scoreboardRight + DESKTOP_SIDE_ACTION_BUTTON_HORIZONTAL_GAP;
  const rightActionButtonsRight = fieldRight;
  const sideActionButtonWidth = Math.min(
    leftActionButtonsRight - leftActionButtonsLeft,
    rightActionButtonsRight - rightActionButtonsLeft
  );
  const actionButtonTop = DESKTOP_SCOREBOARD_CENTER_Y - MATCH_SCOREBOARD_HEIGHT / 2 + 3;

  return {
    mode: 'desktop',
    scene: {
      width: gameSize.width,
      height: gameSize.height,
      centerX,
      centerY
    },
    actionButtons: {
      leftX: leftActionButtonsLeft + sideActionButtonWidth / 2,
      rightX: rightActionButtonsRight - sideActionButtonWidth / 2,
      top: actionButtonTop,
      width: sideActionButtonWidth,
      height: DESKTOP_MATCH_ACTION_BUTTON_HEIGHT,
      gap: DESKTOP_MATCH_ACTION_BUTTON_GAP,
      fontSize: '16px'
    },
    scoreboard: {
      x: centerX,
      y: DESKTOP_SCOREBOARD_CENTER_Y,
      width: MATCH_SCOREBOARD_WIDTH,
      height: MATCH_SCOREBOARD_HEIGHT
    },
    advantage: {
      x: centerX,
      y: DESKTOP_ADVANTAGE_CENTER_Y,
      width: MATCH_ADVANTAGE_WIDTH,
      height: MATCH_ADVANTAGE_HEIGHT
    },
    field: {
      x: centerX,
      y: DESKTOP_FIELD_CENTER_Y,
      width: MATCH_FIELD_WIDTH,
      height: MATCH_FIELD_HEIGHT,
      scale: 1
    },
    decks: {
      playerOneX: 115,
      playerTwoX: 1485,
      y: DESKTOP_DECK_Y,
      scale: 1
    },
    teamStats: {
      playerOneX: 120,
      playerTwoX: 1485,
      y: DESKTOP_FIELD_TOP + MATCH_TEAM_STATS_HEIGHT / 2,
      scale: 1
    },
    info: createDesktopInfoLayout()
  };
}

function createMobileLandscapeLayout(gameSize: MatchViewportSize): MatchLayout {
  const centerX = gameSize.width / 2;
  const centerY = gameSize.height / 2;

  return {
    mode: 'mobile-landscape',
    scene: {
      width: gameSize.width,
      height: gameSize.height,
      centerX,
      centerY
    },
    actionButtons: {
      leftX: 116,
      rightX: gameSize.width - 116,
      top: 7,
      width: 192,
      height: 38,
      gap: 7,
      fontSize: '15px'
    },
    scoreboard: {
      x: centerX,
      y: 42,
      width: MATCH_SCOREBOARD_WIDTH,
      height: MATCH_SCOREBOARD_HEIGHT
    },
    advantage: {
      x: centerX,
      y: 94,
      width: MATCH_ADVANTAGE_WIDTH,
      height: MATCH_ADVANTAGE_HEIGHT
    },
    field: {
      x: centerX,
      y: 404,
      width: MATCH_FIELD_WIDTH,
      height: MATCH_FIELD_HEIGHT,
      scale: 1.04
    },
    decks: {
      playerOneX: 104,
      playerTwoX: gameSize.width - 104,
      y: 566,
      scale: 1.05
    },
    teamStats: {
      playerOneX: 116,
      playerTwoX: gameSize.width - 116,
      y: 246,
      scale: 0.94
    },
    info: createMobileInfoLayout()
  };
}

function createDesktopInfoLayout(): MatchLayout['info'] {
  return {
    modal: {
      width: 960,
      height: 600
    },
    viewport: {
      x: -390,
      y: -150,
      width: 780,
      height: 360
    },
    backButton: {
      y: 258,
      width: 190,
      height: 42,
      fontSize: '18px'
    },
    languageSelector: {
      x: 336,
      y: -258
    },
    titleY: -252,
    subtitleY: -214,
    authorY: -184
  };
}

function createMobileInfoLayout(): MatchLayout['info'] {
  return {
    modal: {
      width: 940,
      height: 560
    },
    viewport: {
      x: -372,
      y: -136,
      width: 744,
      height: 320
    },
    backButton: {
      y: 238,
      width: 190,
      height: 42,
      fontSize: '18px'
    },
    languageSelector: {
      x: 324,
      y: -238
    },
    titleY: -232,
    subtitleY: -196,
    authorY: -168
  };
}

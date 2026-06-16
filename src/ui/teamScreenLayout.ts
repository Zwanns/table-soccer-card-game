import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';

export type TeamScreenLayoutMode = 'desktop' | 'mobile-landscape';

export interface TeamScreenViewportSize {
  width: number;
  height: number;
}

export interface ScrollViewportLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TeamSelectLayout {
  mode: TeamScreenLayoutMode;
  scene: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  title: {
    y: number;
    fontSize: string;
  };
  subtitle: {
    y: number;
    fontSize: string;
  };
  selectedPanels: {
    playerOneX: number;
    playerTwoX: number;
    y: number;
    width: number;
    height: number;
    aiCheckboxX: number;
    aiCheckboxY: number;
    aiTouchWidth: number;
    aiTouchHeight: number;
  };
  versus: {
    x: number;
    y: number;
  };
  grid: {
    columns: number;
    buttonWidth: number;
    buttonHeight: number;
    gapX: number;
    gapY: number;
    startY: number;
    touchWidth: number;
    touchHeight: number;
    viewport: ScrollViewportLayout;
  };
  actions: {
    backX: number;
    startX: number;
    y: number;
    buttonWidth: number;
    buttonHeight: number;
    touchWidth: number;
    touchHeight: number;
  };
  message: {
    y: number;
  };
}

export interface TeamsLayout {
  mode: TeamScreenLayoutMode;
  scene: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  title: {
    y: number;
    fontSize: string;
  };
  subtitle: {
    y: number;
    fontSize: string;
  };
  backButton: {
    x: number;
    y: number;
    width: number;
    height: number;
    touchWidth: number;
    touchHeight: number;
  };
  teamList: {
    x: number;
    columns: number;
    cardWidth: number;
    cardHeight: number;
    gapX: number;
    gapY: number;
    startY: number;
    touchWidth: number;
    touchHeight: number;
    viewport: ScrollViewportLayout;
  };
  squadPanel: {
    x: number;
    y: number;
    width: number;
    height: number;
    cardWidth: number;
    tableY: number;
    sectionRowGap: number;
  };
  preview: {
    offsetX: number;
    colorsY: number;
    colorRadius: number;
    colorGap: number;
    faceY: number;
    backY: number;
    cardScale: number;
  };
}

const MOBILE_COMPACT_MAX_DISPLAY_WIDTH = 1100;
const MOBILE_COMPACT_MAX_DISPLAY_HEIGHT = 620;

export function createTeamSelectLayout(
  viewport: TeamScreenViewportSize,
  gameSize: TeamScreenViewportSize = { width: SCENE_WIDTH, height: SCENE_HEIGHT }
): TeamSelectLayout {
  return isMobileLandscapeTeamScreenViewport(viewport)
    ? createMobileTeamSelectLayout(gameSize)
    : createDesktopTeamSelectLayout(gameSize);
}

export function createTeamsLayout(
  viewport: TeamScreenViewportSize,
  gameSize: TeamScreenViewportSize = { width: SCENE_WIDTH, height: SCENE_HEIGHT }
): TeamsLayout {
  return isMobileLandscapeTeamScreenViewport(viewport) ? createMobileTeamsLayout(gameSize) : createDesktopTeamsLayout(gameSize);
}

export function isMobileLandscapeTeamScreenViewport(viewport: TeamScreenViewportSize): boolean {
  return (
    viewport.width > viewport.height &&
    (viewport.width <= MOBILE_COMPACT_MAX_DISPLAY_WIDTH || viewport.height <= MOBILE_COMPACT_MAX_DISPLAY_HEIGHT)
  );
}

function createDesktopTeamSelectLayout(gameSize: TeamScreenViewportSize): TeamSelectLayout {
  const centerX = gameSize.width / 2;
  const centerY = gameSize.height / 2;

  return {
    mode: 'desktop',
    scene: { width: gameSize.width, height: gameSize.height, centerX, centerY },
    title: { y: 34, fontSize: '34px' },
    subtitle: { y: 72, fontSize: '24px' },
    selectedPanels: {
      playerOneX: 370,
      playerTwoX: 1230,
      y: 126,
      width: 440,
      height: 82,
      aiCheckboxX: 156,
      aiCheckboxY: -20,
      aiTouchWidth: 72,
      aiTouchHeight: 44
    },
    versus: { x: centerX, y: 126 },
    grid: {
      columns: 8,
      buttonWidth: 156,
      buttonHeight: 42,
      gapX: 12,
      gapY: 8,
      startY: 206,
      touchWidth: 156,
      touchHeight: 44,
      viewport: {
        x: 120,
        y: 184,
        width: 1360,
        height: 450
      }
    },
    actions: {
      backX: 258,
      startX: 1342,
      y: 666,
      buttonWidth: 220,
      buttonHeight: 54,
      touchWidth: 220,
      touchHeight: 54
    },
    message: {
      y: 602
    }
  };
}

function createMobileTeamSelectLayout(gameSize: TeamScreenViewportSize): TeamSelectLayout {
  const centerX = gameSize.width / 2;
  const centerY = gameSize.height / 2;

  return {
    mode: 'mobile-landscape',
    scene: { width: gameSize.width, height: gameSize.height, centerX, centerY },
    title: { y: 30, fontSize: '30px' },
    subtitle: { y: 64, fontSize: '22px' },
    selectedPanels: {
      playerOneX: 348,
      playerTwoX: 1252,
      y: 124,
      width: 440,
      height: 82,
      aiCheckboxX: 156,
      aiCheckboxY: -20,
      aiTouchWidth: 100,
      aiTouchHeight: 72
    },
    versus: { x: centerX, y: 124 },
    grid: {
      columns: 5,
      buttonWidth: 220,
      buttonHeight: 68,
      gapX: 14,
      gapY: 12,
      startY: 210,
      touchWidth: 230,
      touchHeight: 78,
      viewport: {
        x: 210,
        y: 178,
        width: 1180,
        height: 338
      }
    },
    actions: {
      backX: 258,
      startX: 1342,
      y: 612,
      buttonWidth: 260,
      buttonHeight: 72,
      touchWidth: 280,
      touchHeight: 82
    },
    message: {
      y: 552
    }
  };
}

function createDesktopTeamsLayout(gameSize: TeamScreenViewportSize): TeamsLayout {
  const centerX = gameSize.width / 2;
  const centerY = gameSize.height / 2;
  const leftPanelX = 80;
  const rightPanelWidth = 760;

  return {
    mode: 'desktop',
    scene: { width: gameSize.width, height: gameSize.height, centerX, centerY },
    title: { y: 34, fontSize: '34px' },
    subtitle: { y: 74, fontSize: '26px' },
    backButton: {
      x: leftPanelX + 66,
      y: 60,
      width: 132,
      height: 38,
      touchWidth: 132,
      touchHeight: 44
    },
    teamList: {
      x: leftPanelX,
      columns: 4,
      cardWidth: 171,
      cardHeight: 30,
      gapX: 18,
      gapY: 6,
      startY: 112,
      touchWidth: 171,
      touchHeight: 44,
      viewport: {
        x: leftPanelX,
        y: 96,
        width: 738,
        height: 610
      }
    },
    squadPanel: {
      x: 840,
      y: 96,
      width: rightPanelWidth,
      height: 571,
      cardWidth: rightPanelWidth / 2,
      tableY: 94,
      sectionRowGap: 28
    },
    preview: {
      offsetX: 190,
      colorsY: 62,
      colorRadius: 10,
      colorGap: 10,
      faceY: 190,
      backY: 432,
      cardScale: 1.45
    }
  };
}

function createMobileTeamsLayout(gameSize: TeamScreenViewportSize): TeamsLayout {
  const centerX = gameSize.width / 2;
  const centerY = gameSize.height / 2;
  const leftPanelX = 36;
  const rightPanelWidth = 870;

  return {
    mode: 'mobile-landscape',
    scene: { width: gameSize.width, height: gameSize.height, centerX, centerY },
    title: { y: 30, fontSize: '30px' },
    subtitle: { y: 66, fontSize: '24px' },
    backButton: {
      x: leftPanelX + 66,
      y: 60,
      width: 150,
      height: 58,
      touchWidth: 172,
      touchHeight: 78
    },
    teamList: {
      x: leftPanelX,
      columns: 3,
      cardWidth: 196,
      cardHeight: 56,
      gapX: 12,
      gapY: 8,
      startY: 122,
      touchWidth: 208,
      touchHeight: 72,
      viewport: {
        x: leftPanelX,
        y: 94,
        width: 612,
        height: 548
      }
    },
    squadPanel: {
      x: 690,
      y: 96,
      width: rightPanelWidth,
      height: 532,
      cardWidth: 430,
      tableY: 92,
      sectionRowGap: 25
    },
    preview: {
      offsetX: 252,
      colorsY: 56,
      colorRadius: 10,
      colorGap: 10,
      faceY: 174,
      backY: 388,
      cardScale: 1.22
    }
  };
}

import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';

export type MenuLayoutMode = 'desktop' | 'mobile-landscape';

export interface MenuViewportSize {
  width: number;
  height: number;
}

export interface MenuLayout {
  mode: MenuLayoutMode;
  scene: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  title: {
    y: number;
    logoMaxWidth: number;
    logoMaxHeight: number;
    fallbackTitleOffsetY: number;
    fallbackSubtitleOffsetY: number;
    fallbackTitleFontSize: string;
    fallbackSubtitleFontSize: string;
  };
  subtitle: {
    y: number;
  };
  flags: {
    y: number;
    maxWidth: number;
    maxHeight: number;
  };
  buttons: {
    startY: number;
    gap: number;
    height: number;
    minWidth: number;
    maxWidthRatio: number;
    fallbackWidthRatio: number;
    fallbackMaxWidth: number;
    fontSize: string;
    submenuTitleOffsetY: number;
  };
  footer: {
    y: number;
    margin: number;
    disclaimerWidth: number;
    disclaimerFontSize: string;
    versionFontSize: string;
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
      itemGap: number;
    };
    titleY: number;
    subtitleY: number;
    authorY: number;
  };
}

const MOBILE_COMPACT_MAX_DISPLAY_WIDTH = 1100;
const MOBILE_COMPACT_MAX_DISPLAY_HEIGHT = 620;

export function createMenuLayout(
  viewport: MenuViewportSize,
  gameSize: MenuViewportSize = { width: SCENE_WIDTH, height: SCENE_HEIGHT }
): MenuLayout {
  return isMobileLandscapeMenuViewport(viewport) ? createMobileLandscapeMenuLayout(gameSize) : createDesktopMenuLayout(gameSize);
}

export function isMobileLandscapeMenuViewport(viewport: MenuViewportSize): boolean {
  return (
    viewport.width > viewport.height &&
    (viewport.width <= MOBILE_COMPACT_MAX_DISPLAY_WIDTH || viewport.height <= MOBILE_COMPACT_MAX_DISPLAY_HEIGHT)
  );
}

function createDesktopMenuLayout(gameSize: MenuViewportSize): MenuLayout {
  const centerX = gameSize.width / 2;
  const centerY = gameSize.height / 2;

  return {
    mode: 'desktop',
    scene: {
      width: gameSize.width,
      height: gameSize.height,
      centerX,
      centerY
    },
    title: {
      y: 138,
      logoMaxWidth: gameSize.width * 0.76,
      logoMaxHeight: gameSize.height * 0.28,
      fallbackTitleOffsetY: -18,
      fallbackSubtitleOffsetY: 54,
      fallbackTitleFontSize: '68px',
      fallbackSubtitleFontSize: '42px'
    },
    subtitle: {
      y: 238
    },
    flags: {
      y: 80,
      maxWidth: 720,
      maxHeight: 72
    },
    buttons: {
      startY: 286,
      gap: 60,
      height: 54,
      minWidth: 280,
      maxWidthRatio: 0.78,
      fallbackWidthRatio: 0.72,
      fallbackMaxWidth: 520,
      fontSize: '22px',
      submenuTitleOffsetY: -46
    },
    footer: {
      y: gameSize.height - 18,
      margin: 24,
      disclaimerWidth: 1040,
      disclaimerFontSize: '12px',
      versionFontSize: '16px'
    },
    info: {
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
        y: -258,
        itemGap: 54
      },
      titleY: -252,
      subtitleY: -214,
      authorY: -184
    }
  };
}

function createMobileLandscapeMenuLayout(gameSize: MenuViewportSize): MenuLayout {
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
    title: {
      y: 116,
      logoMaxWidth: gameSize.width * 0.62,
      logoMaxHeight: 150,
      fallbackTitleOffsetY: -14,
      fallbackSubtitleOffsetY: 44,
      fallbackTitleFontSize: '58px',
      fallbackSubtitleFontSize: '34px'
    },
    subtitle: {
      y: 210
    },
    flags: {
      y: 56,
      maxWidth: 620,
      maxHeight: 54
    },
    buttons: {
      startY: 258,
      gap: 56,
      height: 54,
      minWidth: 320,
      maxWidthRatio: 0.62,
      fallbackWidthRatio: 0.58,
      fallbackMaxWidth: 460,
      fontSize: '21px',
      submenuTitleOffsetY: -42
    },
    footer: {
      y: gameSize.height - 14,
      margin: 20,
      disclaimerWidth: 980,
      disclaimerFontSize: '11px',
      versionFontSize: '15px'
    },
    info: {
      modal: {
        width: 920,
        height: 540
      },
      viewport: {
        x: -360,
        y: -128,
        width: 720,
        height: 300
      },
      backButton: {
        y: 228,
        width: 190,
        height: 42,
        fontSize: '18px'
      },
      languageSelector: {
        x: 318,
        y: -228,
        itemGap: 58
      },
      titleY: -224,
      subtitleY: -190,
      authorY: -162
    }
  };
}

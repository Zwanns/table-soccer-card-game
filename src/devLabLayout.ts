import { SCENE_HEIGHT, SCENE_WIDTH } from './config';
import { isMobileLandscapeLayout } from './ui/mobileLayout';

export interface DevLabLayout {
  mobileLandscape: boolean;
  preview: {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  sidePanel: {
    x: number;
    y: number;
    width: number;
    height: number;
    paddingX: number;
  };
  title: {
    y: number;
    fontSize: string;
  };
  subtitle: {
    y: number;
    fontSize: string;
  };
  buttons: {
    startY: number;
    gap: number;
    width: number;
    height: number;
    fontSize: string;
  };
  backButton: {
    y: number;
    width: number;
    height: number;
    fontSize: string;
  };
}

export const DEV_LAB_SCREEN_MARGIN = 24;
export const DEV_LAB_PANEL_GAP = 32;

export function createDevLabLayout(mobileLandscape = isMobileLandscapeLayout()): DevLabLayout {
  const sidePanelWidth = mobileLandscape ? 430 : 392;
  const sidePanelX = SCENE_WIDTH - DEV_LAB_SCREEN_MARGIN - sidePanelWidth;
  const sidePanelY = DEV_LAB_SCREEN_MARGIN;
  const sidePanelHeight = SCENE_HEIGHT - DEV_LAB_SCREEN_MARGIN * 2;
  const previewX = DEV_LAB_SCREEN_MARGIN;
  const previewY = DEV_LAB_SCREEN_MARGIN;
  const previewWidth = sidePanelX - DEV_LAB_PANEL_GAP - previewX;
  const previewHeight = SCENE_HEIGHT - DEV_LAB_SCREEN_MARGIN * 2;

  return {
    mobileLandscape,
    preview: {
      x: previewX,
      y: previewY,
      width: previewWidth,
      height: previewHeight,
      centerX: previewX + previewWidth / 2,
      centerY: previewY + previewHeight / 2
    },
    sidePanel: {
      x: sidePanelX,
      y: sidePanelY,
      width: sidePanelWidth,
      height: sidePanelHeight,
      paddingX: mobileLandscape ? 34 : 30
    },
    title: {
      y: sidePanelY + (mobileLandscape ? 42 : 48),
      fontSize: mobileLandscape ? '40px' : '42px'
    },
    subtitle: {
      y: sidePanelY + (mobileLandscape ? 82 : 94),
      fontSize: mobileLandscape ? '17px' : '18px'
    },
    buttons: {
      startY: sidePanelY + (mobileLandscape ? 140 : 154),
      gap: 44,
      width: sidePanelWidth - (mobileLandscape ? 56 : 60),
      height: mobileLandscape ? 44 : 46,
      fontSize: mobileLandscape ? '17px' : '18px'
    },
    backButton: {
      y: sidePanelY + sidePanelHeight - (mobileLandscape ? 46 : 44),
      width: mobileLandscape ? 210 : 220,
      height: mobileLandscape ? 46 : 48,
      fontSize: mobileLandscape ? '20px' : '21px'
    }
  };
}

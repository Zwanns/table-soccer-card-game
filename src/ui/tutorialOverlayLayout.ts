import { isMobileLandscapeLayout } from './mobileLayout';

export interface TutorialOverlayLayout {
  mobile: boolean;
  panelWidth: number;
  panelHeight: number;
  panelX: number;
  panelY: number;
  panelPaddingX: number;
  titleTop: number;
  titleFontSize: number;
  titleWordWrapWidth: number;
  messageTop: number;
  messageFontSize: number;
  messageLineSpacing: number;
  messageWordWrapWidth: number;
  buttonX: number;
  buttonY: number;
  buttonWidth: number;
  buttonHeight: number;
  buttonFontSize: number;
  languageSelectorX: number;
  languageSelectorY: number;
  languageStartX: number;
  languageItemSpacing: number;
  languageHitWidth: number;
  languageHitHeight: number;
  languageFontSize: number;
}

export interface TutorialPanelAvoidRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DESKTOP_PANEL_WIDTH = 840;
const DESKTOP_PANEL_HEIGHT = 230;
const DESKTOP_PANEL_BOTTOM_MARGIN = 26;
const DESKTOP_PANEL_PADDING_X = 34;
const MOBILE_PANEL_WIDTH_RATIO = 0.94;
const MOBILE_PANEL_HEIGHT = 190;
const MOBILE_PANEL_MARGIN = 16;
const MOBILE_PANEL_PADDING_X = 32;
const MOBILE_PANEL_PADDING_Y = 18;
const MOBILE_TOP_UI_SAFE_BOTTOM = 104;

export function isMobileTutorialLayout(
  width: number,
  height: number,
  mobileLandscape = isMobileLandscapeLayout()
): boolean {
  return mobileLandscape || width < 900 || width / height < 1.45;
}

export function getTutorialOverlayLayout(
  width: number,
  height: number,
  mobileLandscape = isMobileLandscapeLayout()
): TutorialOverlayLayout {
  if (!isMobileTutorialLayout(width, height, mobileLandscape)) {
    return {
      mobile: false,
      panelWidth: DESKTOP_PANEL_WIDTH,
      panelHeight: DESKTOP_PANEL_HEIGHT,
      panelX: width / 2,
      panelY: height - DESKTOP_PANEL_BOTTOM_MARGIN - DESKTOP_PANEL_HEIGHT / 2,
      panelPaddingX: DESKTOP_PANEL_PADDING_X,
      titleTop: 24,
      titleFontSize: 24,
      titleWordWrapWidth: DESKTOP_PANEL_WIDTH - 260,
      messageTop: 76,
      messageFontSize: 18,
      messageLineSpacing: 6,
      messageWordWrapWidth: DESKTOP_PANEL_WIDTH - DESKTOP_PANEL_PADDING_X * 2,
      buttonX: DESKTOP_PANEL_WIDTH / 2 - 126,
      buttonY: DESKTOP_PANEL_HEIGHT / 2 - 36,
      buttonWidth: 190,
      buttonHeight: 42,
      buttonFontSize: 18,
      languageSelectorX: DESKTOP_PANEL_WIDTH / 2 - 118,
      languageSelectorY: -DESKTOP_PANEL_HEIGHT / 2 + 34,
      languageStartX: -54,
      languageItemSpacing: 48,
      languageHitWidth: 0,
      languageHitHeight: 0,
      languageFontSize: 16
    };
  }

  const panelWidth = Math.round(width * MOBILE_PANEL_WIDTH_RATIO);
  const panelHeight = Math.min(MOBILE_PANEL_HEIGHT, height - MOBILE_PANEL_MARGIN * 2);
  const languageHitWidth = 46;
  const languageHitHeight = 34;
  const languageItemSpacing = 52;
  const languageSelectorWidth = languageHitWidth + languageItemSpacing * 2;

  return {
    mobile: true,
    panelWidth,
    panelHeight,
    panelX: width / 2,
    panelY: height - MOBILE_PANEL_MARGIN - panelHeight / 2,
    panelPaddingX: MOBILE_PANEL_PADDING_X,
    titleTop: MOBILE_PANEL_PADDING_Y,
    titleFontSize: 30,
    titleWordWrapWidth: panelWidth - MOBILE_PANEL_PADDING_X * 2 - languageSelectorWidth - 24,
    messageTop: 58,
    messageFontSize: 26,
    messageLineSpacing: 4,
    messageWordWrapWidth: panelWidth - MOBILE_PANEL_PADDING_X * 2,
    buttonX: 0,
    buttonY: panelHeight / 2 - MOBILE_PANEL_PADDING_Y - 22,
    buttonWidth: Math.min(Math.round(panelWidth * 0.42), 260),
    buttonHeight: 44,
    buttonFontSize: 24,
    languageSelectorX: panelWidth / 2 - MOBILE_PANEL_PADDING_X - languageSelectorWidth / 2,
    languageSelectorY: -panelHeight / 2 + MOBILE_PANEL_PADDING_Y + languageHitHeight / 2,
    languageStartX: -languageItemSpacing,
    languageItemSpacing,
    languageHitWidth,
    languageHitHeight,
    languageFontSize: 22
  };
}

export function formatTutorialOverlayMessage(message: string, mobile: boolean): string {
  return mobile ? message.replace(/\s*\n\s*/g, ' ') : message;
}

export function resolveTutorialPanelY(
  layout: TutorialOverlayLayout,
  highlightRects: readonly TutorialPanelAvoidRect[]
): number {
  if (!layout.mobile || highlightRects.length === 0) {
    return layout.panelY;
  }

  const bottomY = layout.panelY;
  const topY = MOBILE_TOP_UI_SAFE_BOTTOM + layout.panelHeight / 2;
  const bottomOverlap = getPanelOverlapArea(layout, bottomY, highlightRects);
  const topOverlap = getPanelOverlapArea(layout, topY, highlightRects);

  return topOverlap < bottomOverlap ? topY : bottomY;
}

function getPanelOverlapArea(
  layout: TutorialOverlayLayout,
  panelY: number,
  rects: readonly TutorialPanelAvoidRect[]
): number {
  const panelLeft = layout.panelX - layout.panelWidth / 2;
  const panelRight = layout.panelX + layout.panelWidth / 2;
  const panelTop = panelY - layout.panelHeight / 2;
  const panelBottom = panelY + layout.panelHeight / 2;

  return rects.reduce((total, rect) => {
    const overlapWidth = Math.max(
      0,
      Math.min(panelRight, rect.x + rect.width / 2) - Math.max(panelLeft, rect.x - rect.width / 2)
    );
    const overlapHeight = Math.max(
      0,
      Math.min(panelBottom, rect.y + rect.height / 2) - Math.max(panelTop, rect.y - rect.height / 2)
    );

    return total + overlapWidth * overlapHeight;
  }, 0);
}

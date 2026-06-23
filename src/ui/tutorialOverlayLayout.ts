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

export interface TutorialOverlayLayoutContent {
  hasContinueButton: boolean;
  title: string;
  message: string;
}

const DESKTOP_PANEL_WIDTH = 840;
const DESKTOP_PANEL_HEIGHT = 230;
const DESKTOP_PANEL_BOTTOM_MARGIN = 26;
const DESKTOP_PANEL_PADDING_X = 34;
const MOBILE_PANEL_HEIGHT = 190;
const MOBILE_PANEL_PADDING_X = 32;
const MOBILE_PANEL_PADDING_Y = 18;
const MOBILE_MIN_HEIGHT_WITHOUT_BUTTON = 110;
const MOBILE_MAX_HEIGHT_WITHOUT_BUTTON = 180;
const MOBILE_MIN_HEIGHT_WITH_BUTTON = 180;
const MOBILE_MAX_HEIGHT_WITH_BUTTON = 220;
const MOBILE_TITLE_FONT_SIZE = 30;
const MOBILE_TITLE_LINE_HEIGHT = 36;
const MOBILE_MESSAGE_FONT_SIZE = 26;
const MOBILE_MESSAGE_LINE_HEIGHT = 34;
const MOBILE_TITLE_MESSAGE_GAP = 4;
const MOBILE_MESSAGE_BUTTON_GAP = 10;
const MOBILE_BUTTON_HEIGHT = 44;

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
  mobileLandscape = isMobileLandscapeLayout(),
  content?: TutorialOverlayLayoutContent
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

  const panelWidth = width;
  const languageHitWidth = 46;
  const languageHitHeight = 34;
  const languageItemSpacing = 52;
  const languageSelectorWidth = languageHitWidth + languageItemSpacing * 2;
  const titleWordWrapWidth = panelWidth - MOBILE_PANEL_PADDING_X * 2 - languageSelectorWidth - 24;
  const messageWordWrapWidth = panelWidth - MOBILE_PANEL_PADDING_X * 2;
  const titleLines = estimateWrappedLineCount(content?.title ?? '', titleWordWrapWidth, MOBILE_TITLE_FONT_SIZE);
  const messageLines = estimateWrappedLineCount(
    formatTutorialOverlayMessage(content?.message ?? '', true),
    messageWordWrapWidth,
    MOBILE_MESSAGE_FONT_SIZE
  );
  const messageTop = MOBILE_PANEL_PADDING_Y + titleLines * MOBILE_TITLE_LINE_HEIGHT + MOBILE_TITLE_MESSAGE_GAP;
  const panelHeight = getMobilePanelHeight(content, messageTop, messageLines, height);

  return {
    mobile: true,
    panelWidth,
    panelHeight,
    panelX: width / 2,
    panelY: panelHeight / 2,
    panelPaddingX: MOBILE_PANEL_PADDING_X,
    titleTop: MOBILE_PANEL_PADDING_Y,
    titleFontSize: MOBILE_TITLE_FONT_SIZE,
    titleWordWrapWidth,
    messageTop,
    messageFontSize: MOBILE_MESSAGE_FONT_SIZE,
    messageLineSpacing: 4,
    messageWordWrapWidth,
    buttonX: 0,
    buttonY: panelHeight / 2 - MOBILE_PANEL_PADDING_Y - 22,
    buttonWidth: Math.min(Math.round(panelWidth * 0.32), 280),
    buttonHeight: MOBILE_BUTTON_HEIGHT,
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

function getMobilePanelHeight(
  content: TutorialOverlayLayoutContent | undefined,
  messageTop: number,
  messageLines: number,
  canvasHeight: number
): number {
  if (content === undefined) {
    return Math.min(MOBILE_PANEL_HEIGHT, canvasHeight);
  }

  const messageBottom = messageTop + messageLines * MOBILE_MESSAGE_LINE_HEIGHT;
  const desiredHeight = content.hasContinueButton
    ? messageBottom + MOBILE_MESSAGE_BUTTON_GAP + MOBILE_BUTTON_HEIGHT + MOBILE_PANEL_PADDING_Y
    : messageBottom + MOBILE_PANEL_PADDING_Y;
  const minHeight = content.hasContinueButton
    ? MOBILE_MIN_HEIGHT_WITH_BUTTON
    : MOBILE_MIN_HEIGHT_WITHOUT_BUTTON;
  const maxHeight = content.hasContinueButton
    ? MOBILE_MAX_HEIGHT_WITH_BUTTON
    : MOBILE_MAX_HEIGHT_WITHOUT_BUTTON;

  return Math.min(clamp(desiredHeight, minHeight, maxHeight), canvasHeight);
}

function estimateWrappedLineCount(text: string, maxWidth: number, fontSize: number): number {
  if (text.trim().length === 0 || maxWidth <= 0) {
    return 1;
  }

  const averageCharacterWidth = fontSize * 0.54;
  const maxCharactersPerLine = Math.max(1, Math.floor(maxWidth / averageCharacterWidth));

  return text.split('\n').reduce((total, paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      return total + 1;
    }

    let lines = 1;
    let currentLineLength = 0;

    for (const word of words) {
      const nextLength = currentLineLength === 0 ? word.length : currentLineLength + 1 + word.length;

      if (nextLength <= maxCharactersPerLine) {
        currentLineLength = nextLength;
      } else {
        lines += Math.max(1, Math.ceil(word.length / maxCharactersPerLine));
        currentLineLength = word.length % maxCharactersPerLine;
      }
    }

    return total + lines;
  }, 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

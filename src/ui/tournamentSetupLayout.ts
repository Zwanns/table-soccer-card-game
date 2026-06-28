import { isMobileLandscapeLayout } from './mobileLayout';

export interface TournamentSetupButtonLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: string;
}

export interface TournamentSetupLayout {
  mobileLandscape: boolean;
  title: { y: number; fontSize: string };
  format: { startX: number; gapX: number; y: number; width: number; height: number; fontSize: string };
  groups: {
    columns: number | null;
    startX: number;
    startY: number;
    panelWidth: number;
    panelHeight: number;
    gapX: number;
    gapY: number;
    viewportWidth: number | null;
    viewportHeight: number | null;
    titleX: number;
    titleY: number;
    titleFontSize: string;
    slotX: number;
    slotStartY: number;
    slotStepY: number;
    slotWidth: number;
    slotHeight: number;
    slotFlagX: number;
    slotCodeX: number;
    slotAiButtonWidth: number;
    slotFontSize: string;
    emptyFontSize: string;
  };
  teams: {
    columns: number;
    buttonWidth: number;
    buttonHeight: number;
    gapX: number;
    gapY: number;
    startX: number;
    viewportTop: number;
    viewportHeight: number;
    viewportPadding: number;
    flagX: number;
    codeX: number;
    codeFontSize: string;
    flagWidth: number;
    flagHeight: number;
  };
  bottomButtons: readonly TournamentSetupButtonLayout[];
  messageY: number;
}

const DESKTOP_BOTTOM_BUTTONS: readonly TournamentSetupButtonLayout[] = [
  { x: 298, y: 674, width: 340, height: 64, fontSize: '18px' },
  { x: 800, y: 674, width: 340, height: 64, fontSize: '18px' },
  { x: 1302, y: 674, width: 340, height: 64, fontSize: '18px' }
];

const MOBILE_BOTTOM_BUTTONS: readonly TournamentSetupButtonLayout[] = [
  { x: 227, y: 674, width: 390, height: 68, fontSize: '20px' },
  { x: 800, y: 674, width: 390, height: 68, fontSize: '20px' },
  { x: 1373, y: 674, width: 390, height: 68, fontSize: '20px' }
];

export function createTournamentSetupLayout(
  mobileLandscape = isMobileLandscapeLayout()
): TournamentSetupLayout {
  if (mobileLandscape) {
    return {
      mobileLandscape: true,
      title: { y: 28, fontSize: '26px' },
      format: { startX: 32, gapX: 0, y: 86, width: 512, height: 58, fontSize: '21px' },
      groups: {
        columns: 2,
        startX: 40,
        startY: 150,
        panelWidth: 475,
        panelHeight: 330,
        gapX: 22,
        gapY: 18,
        viewportWidth: 1010,
        viewportHeight: 350,
        titleX: 16,
        titleY: 24,
        titleFontSize: '24px',
        slotX: 12,
        slotStartY: 52,
        slotStepY: 66,
        slotWidth: 451,
        slotHeight: 62,
        slotFlagX: 42,
        slotCodeX: 205,
        slotAiButtonWidth: 64,
        slotFontSize: '24px',
        emptyFontSize: '18px'
      },
      teams: {
        columns: 2,
        buttonWidth: 220,
        buttonHeight: 56,
        gapX: 12,
        gapY: 8,
        startX: 1192,
        viewportTop: 150,
        viewportHeight: 350,
        viewportPadding: 8,
        flagX: -72,
        codeX: 32,
        codeFontSize: '24px',
        flagWidth: 36,
        flagHeight: 27
      },
      bottomButtons: MOBILE_BOTTOM_BUTTONS,
      messageY: 684
    };
  }

  return {
    mobileLandscape: false,
    title: { y: 68, fontSize: '24px' },
    format: { startX: 128, gapX: 0, y: 116, width: 448, height: 54, fontSize: '20px' },
    groups: {
      columns: null,
      startX: 54,
      startY: 166,
      panelWidth: 220,
      panelHeight: 196,
      gapX: 14,
      gapY: 16,
      viewportWidth: null,
      viewportHeight: null,
      titleX: 14,
      titleY: 16,
      titleFontSize: '17px',
      slotX: 10,
      slotStartY: 44,
      slotStepY: 36,
      slotWidth: 200,
      slotHeight: 38,
      slotFlagX: 32,
      slotCodeX: 94,
      slotAiButtonWidth: 44,
      slotFontSize: '18px',
      emptyFontSize: '14px'
    },
    teams: {
      columns: 3,
      buttonWidth: 154,
      buttonHeight: 42,
      gapX: 12,
      gapY: 8,
      startX: 1076,
      viewportTop: 164,
      viewportHeight: 464,
      viewportPadding: 8,
      flagX: -44,
      codeX: 24,
      codeFontSize: '22px',
      flagWidth: 30,
      flagHeight: 22
    },
    bottomButtons: DESKTOP_BOTTOM_BUTTONS,
    messageY: 620
  };
}

export function getTournamentSetupGroupMaxScroll(
  groupCount: number,
  layout: TournamentSetupLayout
): number {
  const columns = layout.groups.columns;
  const viewportHeight = layout.groups.viewportHeight;

  if (columns === null || viewportHeight === null) {
    return 0;
  }

  const rowCount = Math.ceil(groupCount / columns);
  const contentHeight =
    rowCount * layout.groups.panelHeight +
    Math.max(0, rowCount - 1) * layout.groups.gapY;

  return Math.max(0, contentHeight - viewportHeight);
}

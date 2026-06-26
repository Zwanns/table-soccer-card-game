import { isMobileLandscapeLayout } from './mobileLayout';

export interface TournamentHubLayout {
  mobileLandscape: boolean;
  header: {
    showGameTitle: boolean;
    gameTitleY: number;
    gameTitleFontSize: string;
    tournamentTitleY: number;
    tournamentTitleFontSize: string;
  };
  tabs: {
    startX: number;
    y: number;
    width: number;
    height: number;
    gap: number;
    fontSize: string;
  };
  matches: {
    x: number;
    y: number;
    columns: number;
    columnGap: number;
    rowGap: number;
    cardWidth: number;
    cardHeight: number;
    viewportHeight: number | null;
    teamFontSize: string;
    scoreFontSize: string;
    labelFontSize: string;
    controllerFontSize: string;
    actionFontSize: string;
    actionHeight: number;
    actionWidth: number;
    actionGap: number;
    actionRightMargin: number;
    scoreX: number;
    homeTeamX: number;
    awayTeamX: number;
    teamBlockWidth: number;
    teamCodeOffsetX: number;
    flagWidth: number;
    flagHeight: number;
  };
  groupStage: {
    x: number;
    y: number;
    columns: number;
    columnGap: number;
    rowGap: number;
    cardWidth: number;
    cardHeight: number;
    viewportHeight: number | null;
    titleFontSize: string;
    headerFontSize: string;
    teamFontSize: string;
    valueFontSize: string;
    flagWidth: number;
    flagHeight: number;
    cornerRadius: number;
    formIndicatorRadius: number;
  };
  footer: {
    y: number;
    buttonWidth: number;
    buttonHeight: number;
    fontSize: string;
    menuX: number;
    backX: number;
    pageX: number;
    nextX: number;
  };
}

export function createTournamentHubLayout(
  mobileLandscape = isMobileLandscapeLayout()
): TournamentHubLayout {
  if (mobileLandscape) {
    return {
      mobileLandscape: true,
      header: {
        showGameTitle: false,
        gameTitleY: 30,
        gameTitleFontSize: '30px',
        tournamentTitleY: 28,
        tournamentTitleFontSize: '26px'
      },
      tabs: {
        startX: 32,
        y: 86,
        width: 384,
        height: 58,
        gap: 0,
        fontSize: '24px'
      },
      matches: {
        x: 32,
        y: 126,
        columns: 1,
        columnGap: 0,
        rowGap: 104,
        cardWidth: 1536,
        cardHeight: 92,
        viewportHeight: 476,
        teamFontSize: '28px',
        scoreFontSize: '36px',
        labelFontSize: '24px',
        controllerFontSize: '12px',
        actionFontSize: '24px',
        actionHeight: 92,
        actionWidth: 142,
        actionGap: 0,
        actionRightMargin: 0,
        scoreX: 768,
        homeTeamX: 608,
        awayTeamX: 856,
        teamBlockWidth: 136,
        teamCodeOffsetX: 48,
        flagWidth: 64,
        flagHeight: 48
      },
      groupStage: {
        x: 32,
        y: 166,
        columns: 2,
        columnGap: 24,
        rowGap: 24,
        cardWidth: 756,
        cardHeight: 430,
        viewportHeight: 470,
        titleFontSize: '24px',
        headerFontSize: '16px',
        teamFontSize: '18px',
        valueFontSize: '17px',
        flagWidth: 36,
        flagHeight: 27,
        cornerRadius: 8,
        formIndicatorRadius: 9
      },
      footer: {
        y: 674,
        buttonWidth: 260,
        buttonHeight: 54,
        fontSize: '19px',
        menuX: 170,
        backX: 500,
        pageX: 800,
        nextX: 1100
      }
    };
  }

  return {
    mobileLandscape: false,
    header: {
      showGameTitle: true,
      gameTitleY: 30,
      gameTitleFontSize: '30px',
      tournamentTitleY: 68,
      tournamentTitleFontSize: '24px'
    },
    tabs: {
      startX: 800 - (3 * 212) / 2 - 95,
      y: 116,
      width: 190,
      height: 46,
      gap: 22,
      fontSize: '20px'
    },
    matches: {
      x: 128,
      y: 168,
      columns: 1,
      columnGap: 0,
      rowGap: 82,
      cardWidth: 1344,
      cardHeight: 72,
      viewportHeight: 450,
      teamFontSize: '20px',
      scoreFontSize: '28px',
      labelFontSize: '18px',
      controllerFontSize: '10px',
      actionFontSize: '18px',
      actionHeight: 72,
      actionWidth: 110,
      actionGap: 0,
      actionRightMargin: 0,
      scoreX: 672,
      homeTeamX: 472,
      awayTeamX: 800,
      teamBlockWidth: 120,
      teamCodeOffsetX: 38,
      flagWidth: 48,
      flagHeight: 36
    },
    groupStage: {
      x: 32,
      y: 166,
      columns: 2,
      columnGap: 24,
      rowGap: 24,
      cardWidth: 756,
      cardHeight: 430,
      viewportHeight: 470,
      titleFontSize: '24px',
      headerFontSize: '16px',
      teamFontSize: '18px',
      valueFontSize: '17px',
      flagWidth: 36,
      flagHeight: 27,
      cornerRadius: 8,
      formIndicatorRadius: 9
    },
    footer: {
      y: 666,
      buttonWidth: 170,
      buttonHeight: 54,
      fontSize: '18px',
      menuX: 132,
      backX: 600,
      pageX: 800,
      nextX: 1000
    }
  };
}

export function getTournamentHubMatchMaxScroll(
  matchCount: number,
  layout: TournamentHubLayout
): number {
  const viewportHeight = layout.matches.viewportHeight;

  if (viewportHeight === null || matchCount <= 0) {
    return 0;
  }

  const rowCount = Math.ceil(matchCount / layout.matches.columns);
  const contentHeight =
    layout.matches.cardHeight +
    Math.max(0, rowCount - 1) * layout.matches.rowGap;

  return Math.max(0, contentHeight - viewportHeight);
}

export function getTournamentHubGroupStageMaxScroll(
  groupCount: number,
  layout: TournamentHubLayout
): number {
  const viewportHeight = layout.groupStage.viewportHeight;

  if (viewportHeight === null || groupCount <= 0) {
    return 0;
  }

  const rowCount = Math.ceil(groupCount / layout.groupStage.columns);
  const contentHeight =
    rowCount * layout.groupStage.cardHeight +
    Math.max(0, rowCount - 1) * layout.groupStage.rowGap;

  return Math.max(0, contentHeight - viewportHeight);
}

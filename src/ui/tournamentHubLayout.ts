import { isMobileLandscapeLayout } from './mobileLayout';

export interface TournamentHubLayout {
  mobileLandscape: boolean;
  contentLeft: number;
  contentWidth: number;
  contentRight: number;
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
    cardRadius: number;
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
    cardPadding: number;
    viewportHeight: number | null;
    titleFontSize: string;
    headerFontSize: string;
    teamFontSize: string;
    valueFontSize: string;
    teamHeaderX: number;
    flagX: number;
    teamCodeX: number;
    playedX: number;
    winsX: number;
    drawsX: number;
    lossesX: number;
    goalsForX: number;
    goalsAgainstX: number;
    pointsX: number;
    formX: number;
    formIndicatorGap: number;
    flagWidth: number;
    flagHeight: number;
    cornerRadius: number;
    formIndicatorRadius: number;
  };
  playoff: {
    x: number;
    y: number;
    width: number;
    right: number;
    viewportHeight: number;
    cardWidth: number;
    cardHeight: number;
    cardRadius: number;
    rowGap: number;
    maxColumnGap: number;
    titleFontSize: string;
    teamFontSize: string;
    scoreFontSize: string;
    flagWidth: number;
    flagHeight: number;
  };
  stats: {
    x: number;
    y: number;
    width: number;
    right: number;
    tableX: number;
    tableWidth: number;
    rankingX: number;
    rankingWidth: number;
  };
  footer: {
    left: number;
    y: number;
    right: number;
    buttonWidth: number;
    buttonHeight: number;
    buttonRadius: number;
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
    const contentLeft = 32;
    const contentWidth = 1536;
    const contentRight = contentLeft + contentWidth;
    const footerButtonWidth = 300;

    return {
      mobileLandscape: true,
      contentLeft,
      contentWidth,
      contentRight,
      header: {
        showGameTitle: false,
        gameTitleY: 30,
        gameTitleFontSize: '30px',
        tournamentTitleY: 28,
        tournamentTitleFontSize: '26px'
      },
      tabs: {
        startX: contentLeft,
        y: 86,
        width: contentWidth / 4,
        height: 58,
        gap: 0,
        fontSize: '24px'
      },
      matches: {
        x: contentLeft,
        y: 126,
        columns: 1,
        columnGap: 0,
        rowGap: 104,
        cardWidth: contentWidth,
        cardHeight: 92,
        cardRadius: 8,
        viewportHeight: 500,
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
        x: contentLeft,
        y: 166,
        columns: 2,
        columnGap: 24,
        rowGap: 24,
        cardWidth: 756,
        cardHeight: 430,
        cardPadding: 18,
        viewportHeight: 470,
        titleFontSize: '24px',
        headerFontSize: '16px',
        teamFontSize: '18px',
        valueFontSize: '17px',
        teamHeaderX: 18,
        flagX: 35,
        teamCodeX: 64,
        playedX: 252,
        winsX: 302,
        drawsX: 352,
        lossesX: 402,
        goalsForX: 462,
        goalsAgainstX: 522,
        pointsX: 590,
        formX: 642,
        formIndicatorGap: 23,
        flagWidth: 36,
        flagHeight: 27,
        cornerRadius: 8,
        formIndicatorRadius: 9
      },
      playoff: {
        x: contentLeft,
        y: 126,
        width: contentWidth,
        right: contentRight,
        viewportHeight: 500,
        cardWidth: 400,
        cardHeight: 92,
        cardRadius: 8,
        rowGap: 116,
        maxColumnGap: 220,
        titleFontSize: '24px',
        teamFontSize: '20px',
        scoreFontSize: '20px',
        flagWidth: 32,
        flagHeight: 24
      },
      stats: {
        x: contentLeft,
        y: 166,
        width: contentWidth,
        right: contentRight,
        tableX: contentLeft,
        tableWidth: 780,
        rankingX: contentLeft + 812,
        rankingWidth: contentWidth - 812
      },
      footer: {
        left: contentLeft,
        y: 668,
        right: contentRight,
        buttonWidth: footerButtonWidth,
        buttonHeight: 64,
        buttonRadius: 8,
        fontSize: '21px',
        menuX: contentLeft + footerButtonWidth / 2,
        backX: 500,
        pageX: 800,
        nextX: contentRight - footerButtonWidth / 2
      }
    };
  }

  const contentLeft = 128;
  const contentWidth = 1344;
  const contentRight = contentLeft + contentWidth;
  const footerButtonWidth = 210;

  return {
    mobileLandscape: false,
    contentLeft,
    contentWidth,
    contentRight,
    header: {
      showGameTitle: true,
      gameTitleY: 30,
      gameTitleFontSize: '30px',
      tournamentTitleY: 68,
      tournamentTitleFontSize: '24px'
    },
    tabs: {
      startX: contentLeft,
      y: 116,
      width: contentWidth / 4,
      height: 54,
      gap: 0,
      fontSize: '22px'
    },
    matches: {
      x: contentLeft,
      y: 168,
      columns: 1,
      columnGap: 0,
      rowGap: 82,
      cardWidth: contentWidth,
      cardHeight: 72,
      cardRadius: 8,
      viewportHeight: 462,
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
      x: contentLeft,
      y: 166,
      columns: 2,
      columnGap: 24,
      rowGap: 24,
      cardWidth: 660,
      cardHeight: 430,
      cardPadding: 18,
      viewportHeight: 470,
      titleFontSize: '24px',
      headerFontSize: '16px',
      teamFontSize: '18px',
      valueFontSize: '17px',
      teamHeaderX: 18,
      flagX: 35,
      teamCodeX: 64,
      playedX: 218,
      winsX: 264,
      drawsX: 310,
      lossesX: 356,
      goalsForX: 410,
      goalsAgainstX: 464,
      pointsX: 526,
      formX: 593,
      formIndicatorGap: 20,
      flagWidth: 36,
      flagHeight: 27,
      cornerRadius: 8,
      formIndicatorRadius: 9
    },
    playoff: {
      x: contentLeft,
      y: 166,
      width: contentWidth,
      right: contentRight,
      viewportHeight: 462,
      cardWidth: 360,
      cardHeight: 86,
      cardRadius: 8,
      rowGap: 104,
      maxColumnGap: 190,
      titleFontSize: '22px',
      teamFontSize: '17px',
      scoreFontSize: '18px',
      flagWidth: 28,
      flagHeight: 21
    },
    stats: {
      x: contentLeft,
      y: 166,
      width: contentWidth,
      right: contentRight,
      tableX: contentLeft,
      tableWidth: 780,
      rankingX: contentLeft + 812,
      rankingWidth: contentWidth - 812
    },
    footer: {
      left: contentLeft,
      y: 666,
      right: contentRight,
      buttonWidth: footerButtonWidth,
      buttonHeight: 60,
      buttonRadius: 8,
      fontSize: '20px',
      menuX: contentLeft + footerButtonWidth / 2,
      backX: 600,
      pageX: 800,
      nextX: contentRight - footerButtonWidth / 2
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

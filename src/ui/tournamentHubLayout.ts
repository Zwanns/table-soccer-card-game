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
    headerY: number;
    rowStartY: number;
    rowHeight: number;
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
    tableHeight: number;
    tableHeaderFontSize: string;
    tableTeamFontSize: string;
    tableValueFontSize: string;
    tableTeamHeaderX: number;
    tableFlagX: number;
    tableTeamCodeX: number;
    tableColumns: {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
      shots: number;
      goalkeeperSaves: number;
    };
    rankingX: number;
    rankingWidth: number;
    rankingCardWidth: number;
    rankingCardHeight: number;
    rankingTitleFontSize: string;
    rankingEntryFontSize: string;
    rankingValueFontSize: string;
    rankingFlagWidth: number;
    rankingFlagHeight: number;
    rankingRowGap: number;
    rankingColumnGap: number;
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
        headerY: 74,
        rowStartY: 122,
        rowHeight: 72,
        titleFontSize: '28px',
        headerFontSize: '19px',
        teamFontSize: '22px',
        valueFontSize: '20px',
        teamHeaderX: 22,
        flagX: 40,
        teamCodeX: 76,
        playedX: 260,
        winsX: 312,
        drawsX: 364,
        lossesX: 416,
        goalsForX: 478,
        goalsAgainstX: 540,
        pointsX: 608,
        formX: 668,
        formIndicatorGap: 26,
        flagWidth: 44,
        flagHeight: 33,
        cornerRadius: 8,
        formIndicatorRadius: 11
      },
      playoff: {
        x: contentLeft,
        y: 126,
        width: contentWidth,
        right: contentRight,
        viewportHeight: 500,
        cardWidth: 320,
        cardHeight: 92,
        cardRadius: 8,
        rowGap: 116,
        maxColumnGap: 150,
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
        tableWidth: 620,
        tableHeight: 462,
        tableHeaderFontSize: '16px',
        tableTeamFontSize: '18px',
        tableValueFontSize: '17px',
        tableTeamHeaderX: 16,
        tableFlagX: 28,
        tableTeamCodeX: 54,
        tableColumns: {
          played: 202,
          wins: 248,
          draws: 294,
          losses: 340,
          goalsFor: 388,
          goalsAgainst: 436,
          goalDifference: 488,
          shots: 540,
          goalkeeperSaves: 588
        },
        rankingX: contentLeft + 652,
        rankingWidth: contentWidth - 652,
        rankingCardWidth: 300,
        rankingCardHeight: 102,
        rankingTitleFontSize: '22px',
        rankingEntryFontSize: '16px',
        rankingValueFontSize: '17px',
        rankingFlagWidth: 28,
        rankingFlagHeight: 21,
        rankingRowGap: 156,
        rankingColumnGap: 32
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
      headerY: 74,
      rowStartY: 122,
      rowHeight: 72,
      titleFontSize: '28px',
      headerFontSize: '19px',
      teamFontSize: '22px',
      valueFontSize: '20px',
      teamHeaderX: 22,
      flagX: 40,
      teamCodeX: 76,
      playedX: 222,
      winsX: 268,
      drawsX: 314,
      lossesX: 360,
      goalsForX: 414,
      goalsAgainstX: 468,
      pointsX: 526,
      formX: 584,
      formIndicatorGap: 22,
      flagWidth: 44,
      flagHeight: 33,
      cornerRadius: 8,
      formIndicatorRadius: 11
    },
    playoff: {
      x: contentLeft,
      y: 166,
      width: contentWidth,
      right: contentRight,
      viewportHeight: 462,
      cardWidth: 300,
      cardHeight: 86,
      cardRadius: 8,
      rowGap: 104,
      maxColumnGap: 128,
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
      tableWidth: 620,
      tableHeight: 462,
      tableHeaderFontSize: '16px',
      tableTeamFontSize: '18px',
      tableValueFontSize: '17px',
      tableTeamHeaderX: 16,
      tableFlagX: 28,
      tableTeamCodeX: 54,
      tableColumns: {
        played: 202,
        wins: 248,
        draws: 294,
        losses: 340,
        goalsFor: 388,
        goalsAgainst: 436,
        goalDifference: 488,
        shots: 540,
        goalkeeperSaves: 588
      },
      rankingX: contentLeft + 652,
      rankingWidth: contentWidth - 652,
      rankingCardWidth: 300,
      rankingCardHeight: 102,
      rankingTitleFontSize: '22px',
      rankingEntryFontSize: '16px',
      rankingValueFontSize: '17px',
      rankingFlagWidth: 28,
      rankingFlagHeight: 21,
      rankingRowGap: 156,
      rankingColumnGap: 32
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

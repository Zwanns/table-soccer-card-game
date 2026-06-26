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
        fontSize: '22px'
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
        controllerFontSize: '16px',
        actionFontSize: '20px',
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
      columns: 2,
      columnGap: 40,
      rowGap: 45,
      cardWidth: 652,
      cardHeight: 38,
      viewportHeight: null,
      teamFontSize: '15px',
      scoreFontSize: '18px',
      labelFontSize: '14px',
      controllerFontSize: '9px',
      actionFontSize: '14px',
      actionHeight: 30,
      actionWidth: 70,
      actionGap: 8,
      actionRightMargin: 0,
      scoreX: 306,
      homeTeamX: 122,
      awayTeamX: 356,
      teamBlockWidth: 0,
      teamCodeOffsetX: 28,
      flagWidth: 26,
      flagHeight: 19
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

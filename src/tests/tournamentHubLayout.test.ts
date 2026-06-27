import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createTournamentHubLayout,
  getTournamentHubGroupStageMaxScroll,
  getTournamentHubMatchMaxScroll
} from '../ui/tournamentHubLayout';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function getTabBarWidth(layout: ReturnType<typeof createTournamentHubLayout>): number {
  return layout.tabs.width * 4 + layout.tabs.gap * 3;
}

function getGroupStageViewportWidth(layout: ReturnType<typeof createTournamentHubLayout>): number {
  return layout.groupStage.cardWidth * layout.groupStage.columns + layout.groupStage.columnGap * (layout.groupStage.columns - 1);
}

function getGroupStageFormRight(layout: ReturnType<typeof createTournamentHubLayout>, formCount = 3): number {
  return (
    layout.groupStage.formX +
    Math.max(0, formCount - 1) * layout.groupStage.formIndicatorGap +
    layout.groupStage.formIndicatorRadius
  );
}

function getGroupStageFormIndicatorAirGap(layout: ReturnType<typeof createTournamentHubLayout>): number {
  return layout.groupStage.formIndicatorGap - layout.groupStage.formIndicatorRadius * 2;
}

function getStatsRankingContentHeight(layout: ReturnType<typeof createTournamentHubLayout>, cardCount = 3): number {
  const columnCount = Math.floor(
    (layout.stats.rankingWidth + layout.stats.rankingColumnGap) /
      (layout.stats.rankingCardWidth + layout.stats.rankingColumnGap)
  );
  const rowCount = Math.ceil(cardCount / columnCount);

  return (rowCount - 1) * layout.stats.rankingRowGap + 28 + layout.stats.rankingCardHeight;
}

function getStatsRankingColumnCount(layout: ReturnType<typeof createTournamentHubLayout>): number {
  return Math.max(
    1,
    Math.min(
      3,
      Math.floor(
        (layout.stats.rankingWidth + layout.stats.rankingColumnGap) /
          (layout.stats.rankingCardWidth + layout.stats.rankingColumnGap)
      )
    )
  );
}

function getStatsRankingMaxScroll(layout: ReturnType<typeof createTournamentHubLayout>, cardCount = 3): number {
  return Math.max(0, getStatsRankingContentHeight(layout, cardCount) - 462);
}

function getStatsRankingRowYs(layout: ReturnType<typeof createTournamentHubLayout>, rowCount = 3): number[] {
  return Array.from(
    { length: rowCount },
    (_value, index) =>
      layout.stats.rankingCardHeight / 2 +
      (index - (rowCount - 1) / 2) * layout.stats.rankingEntryRowGap
  );
}

describe('Tournament Hub responsive layout', () => {
  it('keeps the desktop header, tabs and footer while using larger card layouts', () => {
    const layout = createTournamentHubLayout(false);

    expect(layout.contentLeft).toBe(128);
    expect(layout.contentWidth).toBe(1344);
    expect(layout.contentRight).toBe(1472);
    expect(layout.header).toEqual({
      showGameTitle: true,
      gameTitleY: 30,
      gameTitleFontSize: '30px',
      tournamentTitleY: 68,
      tournamentTitleFontSize: '24px'
    });
    expect(layout.tabs).toEqual({
      startX: 128,
      y: 116,
      width: 336,
      height: 54,
      gap: 0,
      fontSize: '22px'
    });
    expect(layout.matches).toMatchObject({
      x: 128,
      y: 168,
      columns: 1,
      columnGap: 0,
      rowGap: 82,
      cardWidth: 1344,
      cardHeight: 72,
      cardRadius: 8,
      viewportHeight: 520
    });
    expect(layout.groupStage).toMatchObject({
      x: 128,
      y: 166,
      columns: 2,
      cardWidth: 660,
      cardHeight: 430,
      cardPadding: 18,
      viewportHeight: 470,
      headerY: 74,
      rowStartY: 122,
      rowHeight: 72,
      titleFontSize: '30px',
      headerFontSize: '20px',
      teamFontSize: '23px',
      valueFontSize: '21px',
      cornerRadius: 8,
      formIndicatorRadius: 12
    });
    expect(layout.playoff).toMatchObject({
      x: 128,
      y: 166,
      width: 1344,
      right: 1472,
      viewportHeight: 462,
      cardWidth: 200,
      cardHeight: 86,
      cardRadius: 8
    });
    expect(layout.stats).toMatchObject({
      tableWidth: 620,
      rankingCardWidth: 300,
      rankingCardHeight: 102,
      rankingEntryFontSize: '16px',
      rankingValueFontSize: '17px'
    });
    expect(layout.footer).toMatchObject({
      left: 128,
      y: 674,
      right: 1472,
      buttonWidth: 340,
      buttonHeight: 64,
      buttonRadius: 8,
      fontSize: '18px',
      menuX: 298,
      backX: 600,
      pageX: 800,
      nextX: 1302
    });
  });

  it('uses a contiguous desktop tab bar stretched across the main content width', () => {
    const layout = createTournamentHubLayout(false);

    expect(layout.tabs.startX).toBe(layout.contentLeft);
    expect(layout.tabs.gap).toBe(0);
    expect(getTabBarWidth(layout)).toBe(layout.contentWidth);
    expect(layout.tabs.startX + getTabBarWidth(layout)).toBe(layout.contentRight);
    expect(layout.matches.x).toBe(layout.contentLeft);
    expect(layout.matches.cardWidth).toBe(layout.contentWidth);
    expect(layout.tabs.height).toBeGreaterThan(46);
    expect(layout.tabs.fontSize).toBe('22px');
  });

  it('uses a compact title and contiguous full-width tab bar in mobile landscape', () => {
    const layout = createTournamentHubLayout(true);

    expect(layout.header.showGameTitle).toBe(false);
    expect(layout.header.tournamentTitleY).toBe(28);
    expect(layout.contentLeft).toBe(32);
    expect(layout.contentWidth).toBe(1536);
    expect(layout.contentRight).toBe(1568);
    expect(layout.tabs.startX).toBe(layout.contentLeft);
    expect(layout.tabs.gap).toBe(0);
    expect(layout.tabs.height).toBeGreaterThan(createTournamentHubLayout(false).tabs.height);
    expect(getTabBarWidth(layout)).toBe(layout.contentWidth);
    expect(layout.tabs.startX + getTabBarWidth(layout)).toBe(layout.contentRight);
    expect(layout.tabs.fontSize).toBe(layout.matches.actionFontSize);
  });

  it('uses one full-width tall match card column with touch-sized actions', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(mobile.matches.columns).toBe(1);
    expect(mobile.matches.cardWidth).toBe(1536);
    expect(mobile.matches.cardHeight).toBeGreaterThan(desktop.matches.cardHeight);
    expect(mobile.matches.cardRadius).toBe(8);
    expect(mobile.matches.actionHeight).toBe(mobile.matches.cardHeight);
    expect(mobile.matches.actionFontSize).toBe('24px');
    expect(mobile.matches.actionWidth).toBeGreaterThan(desktop.matches.actionWidth);
    expect(mobile.matches.scoreX).toBe(mobile.matches.cardWidth / 2);
    expect(mobile.matches.scoreFontSize).toBe('36px');
    expect(mobile.matches.labelFontSize).toBe(mobile.matches.actionFontSize);
    expect(mobile.matches.teamFontSize).toBe('28px');
  });

  it('keeps team blocks symmetric around the centered score and uses equal action buttons', () => {
    const mobile = createTournamentHubLayout(true);
    const homeBlockRight =
      mobile.matches.homeTeamX -
      mobile.matches.flagWidth / 2 +
      mobile.matches.teamBlockWidth;
    const awayBlockLeft = mobile.matches.awayTeamX - mobile.matches.flagWidth / 2;

    expect(mobile.matches.scoreX - homeBlockRight).toBe(awayBlockLeft - mobile.matches.scoreX);
    expect(mobile.matches.actionWidth).toBe(142);
    expect(mobile.matches.actionGap).toBe(0);
    expect(mobile.matches.actionRightMargin).toBe(0);
  });

  it('scrolls the full match list without relying on pagination pages', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(getTournamentHubMatchMaxScroll(4, mobile)).toBe(0);
    expect(getTournamentHubMatchMaxScroll(20, mobile)).toBeGreaterThan(0);
    expect(getTournamentHubMatchMaxScroll(4, desktop)).toBe(0);
    expect(getTournamentHubMatchMaxScroll(20, desktop)).toBeGreaterThan(0);
  });

  it('uses desktop match cards that stay smaller than mobile but no longer use dense rows', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(desktop.matches.columns).toBe(1);
    expect(desktop.matches.cardWidth).toBeLessThan(mobile.matches.cardWidth);
    expect(desktop.matches.cardHeight).toBeGreaterThan(38);
    expect(desktop.matches.cardRadius).toBe(8);
    expect(desktop.matches.actionHeight).toBe(desktop.matches.cardHeight);
    expect(desktop.matches.actionWidth).toBeGreaterThan(70);
    expect(desktop.matches.actionGap).toBe(0);
    expect(desktop.matches.flagWidth).toBeGreaterThan(26);
    expect(desktop.matches.teamFontSize).toBe('20px');
  });

  it('keeps footer geometry for other tabs while the match viewport reaches into the freed footer space', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);
    const desktopFooterTop = desktop.footer.y - desktop.footer.buttonHeight / 2;
    const mobileFooterTop = mobile.footer.y - mobile.footer.buttonHeight / 2;

    expect(desktop.footer.buttonWidth).toBeGreaterThan(170);
    expect(desktop.footer.buttonHeight).toBeGreaterThan(54);
    expect(desktop.footer.buttonRadius).toBe(8);
    expect(desktop.matches.y + desktop.matches.viewportHeight!).toBeGreaterThan(desktopFooterTop);
    expect(desktop.groupStage.y + desktop.groupStage.viewportHeight!).toBeLessThanOrEqual(desktopFooterTop + 8);
    expect(mobile.footer.buttonWidth).toBeGreaterThan(260);
    expect(mobile.footer.buttonHeight).toBeGreaterThan(54);
    expect(mobile.footer.buttonRadius).toBe(8);
    expect(mobile.matches.y + mobile.matches.viewportHeight!).toBeGreaterThan(mobileFooterTop);
    expect(mobile.groupStage.y + mobile.groupStage.viewportHeight!).toBeLessThanOrEqual(mobileFooterTop + 10);
  });

  it('keeps every Tournament Hub content area inside the tab-bar width contract', () => {
    [createTournamentHubLayout(false), createTournamentHubLayout(true)].forEach((layout) => {
      const tabBarLeft = layout.tabs.startX;
      const tabBarRight = layout.tabs.startX + getTabBarWidth(layout);
      const matchRight = layout.matches.x + layout.matches.cardWidth;
      const groupRight = layout.groupStage.x + getGroupStageViewportWidth(layout);
      const footerLeft = layout.footer.menuX - layout.footer.buttonWidth / 2;
      const footerRight = layout.footer.nextX + layout.footer.buttonWidth / 2;
      const statsTableRight = layout.stats.tableX + layout.stats.tableWidth;
      const statsRankingRight = layout.stats.rankingX + layout.stats.rankingWidth;

      expect(tabBarLeft).toBe(layout.contentLeft);
      expect(getTabBarWidth(layout)).toBe(layout.contentWidth);
      expect(tabBarRight).toBe(layout.contentRight);
      expect(layout.matches.x).toBeGreaterThanOrEqual(layout.contentLeft);
      expect(matchRight).toBeLessThanOrEqual(layout.contentRight);
      expect(layout.groupStage.x).toBeGreaterThanOrEqual(layout.contentLeft);
      expect(groupRight).toBeLessThanOrEqual(layout.contentRight);
      expect(layout.playoff.x).toBe(layout.contentLeft);
      expect(layout.playoff.width).toBe(layout.contentWidth);
      expect(layout.playoff.right).toBe(layout.contentRight);
      expect(layout.playoff.cardWidth).toBeGreaterThanOrEqual(200);
      expect(layout.playoff.cardHeight).toBeGreaterThan(58);
      expect(layout.stats.x).toBe(layout.contentLeft);
      expect(layout.stats.width).toBe(layout.contentWidth);
      expect(layout.stats.right).toBe(layout.contentRight);
      expect(layout.stats.tableX).toBeGreaterThanOrEqual(layout.contentLeft);
      expect(statsTableRight).toBeLessThanOrEqual(layout.contentRight);
      expect(layout.stats.rankingX).toBeGreaterThanOrEqual(layout.contentLeft);
      expect(statsRankingRight).toBeLessThanOrEqual(layout.contentRight);
      expect(layout.footer.left).toBe(layout.contentLeft);
      expect(layout.footer.right).toBe(layout.contentRight);
      expect(footerLeft).toBe(layout.contentLeft);
      expect(footerRight).toBe(layout.contentRight);
    });
  });

  it('uses two large group cards per row in mobile landscape and scrolls extra group rows', () => {
    const mobile = createTournamentHubLayout(true);

    expect(mobile.groupStage.columns).toBe(2);
    expect(mobile.groupStage.cardWidth).toBe(756);
    expect(mobile.groupStage.cardHeight).toBe(430);
    expect(mobile.groupStage.titleFontSize).toBe('30px');
    expect(mobile.groupStage.headerFontSize).toBe('20px');
    expect(mobile.groupStage.teamFontSize).toBe('24px');
    expect(mobile.groupStage.valueFontSize).toBe('22px');
    expect(mobile.groupStage.flagWidth).toBe(50);
    expect(mobile.groupStage.flagHeight).toBe(38);
    expect(mobile.groupStage.playedX).toBe(236);
    expect(mobile.groupStage.formX).toBe(654);
    expect(mobile.groupStage.formIndicatorGap).toBe(35);
    expect(mobile.groupStage.viewportHeight).toBe(470);
    expect(mobile.groupStage.cornerRadius).toBe(8);
    expect(mobile.groupStage.formIndicatorRadius).toBe(12);
    expect(getTournamentHubGroupStageMaxScroll(2, mobile)).toBe(0);
    expect(getTournamentHubGroupStageMaxScroll(4, mobile)).toBeGreaterThan(0);
    expect(getTournamentHubGroupStageMaxScroll(8, mobile)).toBeGreaterThan(
      getTournamentHubGroupStageMaxScroll(4, mobile)
    );
  });

  it('keeps enlarged desktop and mobile group-card content inside the card', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(desktop.groupStage.cardWidth).toBe(660);
    expect(desktop.groupStage.playedX).toBe(206);
    expect(desktop.groupStage.formX).toBe(566);
    expect(desktop.groupStage.formIndicatorGap).toBe(32);
    expect(desktop.groupStage.titleFontSize).toBe('30px');
    expect(desktop.groupStage.headerFontSize).toBe('20px');
    expect(desktop.groupStage.teamFontSize).toBe('23px');
    expect(desktop.groupStage.valueFontSize).toBe('21px');
    expect(desktop.groupStage.flagWidth).toBe(48);
    expect(desktop.groupStage.flagHeight).toBe(36);
    expect(getGroupStageFormRight(desktop)).toBeLessThanOrEqual(
      desktop.groupStage.cardWidth - desktop.groupStage.cardPadding
    );
    expect(getGroupStageFormRight(mobile)).toBeLessThanOrEqual(
      mobile.groupStage.cardWidth - mobile.groupStage.cardPadding
    );
    expect(mobile.groupStage.playedX).toBe(236);
    expect(mobile.groupStage.formX).toBe(654);
    expect(mobile.groupStage.formIndicatorGap).toBe(35);
  });

  it('compacts the team column and gives Form indicators non-overlapping space', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(desktop.groupStage.playedX - desktop.groupStage.teamCodeX).toBeLessThan(222 - 76);
    expect(mobile.groupStage.playedX - mobile.groupStage.teamCodeX).toBeLessThan(260 - 76);
    expect(getGroupStageFormIndicatorAirGap(desktop)).toBeGreaterThanOrEqual(8);
    expect(getGroupStageFormIndicatorAirGap(mobile)).toBeGreaterThanOrEqual(11);
    expect(getGroupStageFormRight(desktop)).toBeLessThanOrEqual(
      desktop.groupStage.cardWidth - desktop.groupStage.cardPadding
    );
    expect(getGroupStageFormRight(mobile)).toBeLessThanOrEqual(
      mobile.groupStage.cardWidth - mobile.groupStage.cardPadding
    );
    expect(desktop.groupStage.formX + desktop.groupStage.formIndicatorGap).toBe(598);
    expect(mobile.groupStage.formX + mobile.groupStage.formIndicatorGap).toBe(689);
  });

  it('keeps Playoff narrower, masked and scroll-ready within the shared content contract', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);
    const cupLDesktopBracketWidth = desktop.playoff.cardWidth * 3 + desktop.playoff.maxColumnGap * 2;
    const cupLMobileBracketWidth = mobile.playoff.cardWidth * 3 + mobile.playoff.maxColumnGap * 2;

    expect(desktop.playoff.width).toBe(desktop.contentWidth);
    expect(mobile.playoff.width).toBe(mobile.contentWidth);
    expect(desktop.playoff.cardWidth).toBe(200);
    expect(desktop.playoff.cardHeight).toBe(86);
    expect(mobile.playoff.cardWidth).toBe(214);
    expect(mobile.playoff.cardHeight).toBe(92);
    expect(desktop.playoff.cardWidth).toBeLessThanOrEqual(300 * 2 / 3);
    expect(mobile.playoff.cardWidth).toBeLessThanOrEqual(Math.ceil(320 * 2 / 3));
    expect(desktop.playoff.maxColumnGap).toBe(128);
    expect(mobile.playoff.maxColumnGap).toBe(150);
    expect(desktop.playoff.width - cupLDesktopBracketWidth).toBeGreaterThanOrEqual(480);
    expect(mobile.playoff.width - cupLMobileBracketWidth).toBeGreaterThanOrEqual(590);
    expect(desktop.playoff.viewportHeight).toBe(462);
    expect(mobile.playoff.viewportHeight).toBe(500);
    expect(desktop.playoff.viewportHeight).toBeLessThan(desktop.matches.viewportHeight!);
    expect(mobile.playoff.viewportHeight).toBeLessThan(mobile.matches.viewportHeight!);
  });

  it('gives Cup XL enough bracket width for two mirrored branches and a centered final', () => {
    [createTournamentHubLayout(false), createTournamentHubLayout(true)].forEach((layout) => {
      const centerGap = Math.max(96, layout.playoff.maxColumnGap);
      const branchWidth = layout.playoff.cardWidth * 3 + layout.playoff.maxColumnGap * 2;
      const xlContentWidth = branchWidth * 2 + layout.playoff.cardWidth + centerGap * 2;
      const finalX = branchWidth + centerGap;

      expect(xlContentWidth).toBeGreaterThan(layout.playoff.width);
      expect(finalX).toBeGreaterThan(branchWidth);
      expect(finalX + layout.playoff.cardWidth).toBeLessThan(xlContentWidth - branchWidth);
      expect(layout.playoff.cardHeight + 3 * layout.playoff.rowGap).toBeLessThanOrEqual(layout.playoff.viewportHeight);
    });
  });

  it('makes Stats compact on the left and larger on the right without leaving the content contract', () => {
    [createTournamentHubLayout(false), createTournamentHubLayout(true)].forEach((layout) => {
      const statsRight = layout.stats.rankingX + layout.stats.rankingWidth;
      const tableRight = layout.stats.tableX + layout.stats.tableWidth;
      const cardRowWidth = layout.stats.rankingCardWidth * 2 + layout.stats.rankingColumnGap;
      const oneColumnRanking = layout.stats.rankingCardWidth > (layout.stats.rankingWidth - layout.stats.rankingColumnGap) / 2;

      expect(layout.stats.tableWidth).toBeLessThan(780);
      expect(tableRight).toBeLessThan(layout.stats.rankingX);
      expect(statsRight).toBe(layout.contentRight);
      if (layout.mobileLandscape) {
        expect(layout.stats.tableWidth / layout.contentWidth).toBeGreaterThan(0.48);
        expect(layout.stats.tableWidth / layout.contentWidth).toBeLessThan(0.52);
        expect(oneColumnRanking).toBe(true);
        expect(layout.stats.tableHeaderFontSize).toBe('19px');
        expect(layout.stats.tableTeamFontSize).toBe('21px');
        expect(layout.stats.tableValueFontSize).toBe('20px');
        expect(layout.stats.rankingValueFontSize).toBe('21px');
      } else {
        expect(cardRowWidth).toBeLessThanOrEqual(layout.stats.rankingWidth);
        expect(layout.stats.tableHeaderFontSize).toBe('16px');
        expect(layout.stats.tableTeamFontSize).toBe('18px');
        expect(layout.stats.tableValueFontSize).toBe('17px');
        expect(layout.stats.rankingValueFontSize).toBe('17px');
      }
      expect(layout.stats.rankingCardWidth).toBeGreaterThan(196);
      expect(layout.stats.rankingCardHeight).toBeGreaterThan(72);
      expect(layout.stats.rankingRowGap).toBeLessThanOrEqual(156);
    });
  });

  it('fits the enlarged Stats individual cards vertically without requiring a scrollbar', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(desktop.stats.rankingCardWidth).toBe(300);
    expect(desktop.stats.rankingCardHeight).toBe(102);
    expect(desktop.stats.rankingEntryRowGap).toBe(25);
    expect(desktop.stats.rankingRowGap).toBe(156);
    expect(getStatsRankingColumnCount(desktop)).toBe(2);
    expect(getStatsRankingContentHeight(desktop, 3)).toBeLessThanOrEqual(462);
    const mobileRowYs = getStatsRankingRowYs(mobile);

    expect(mobile.stats.rankingCardWidth).toBe(mobile.stats.rankingWidth);
    expect(getStatsRankingColumnCount(mobile)).toBe(1);
    expect(mobile.stats.rankingCardHeight).toBe(120);
    expect(mobile.stats.rankingTitleFontSize).toBe('26px');
    expect(mobile.stats.rankingEntryFontSize).toBe('20px');
    expect(mobile.stats.rankingValueFontSize).toBe('21px');
    expect(mobile.stats.rankingEntryRowGap).toBe(32);
    expect(getStatsRankingContentHeight(mobile, 3)).toBeLessThanOrEqual(462);
    expect(getStatsRankingMaxScroll(mobile, 3)).toBe(0);
    expect(mobileRowYs).toEqual([28, 60, 92]);
    expect(mobileRowYs[0]).toBeGreaterThan(mobile.stats.rankingFlagHeight / 2);
    expect(mobileRowYs[2]).toBeLessThan(
      mobile.stats.rankingCardHeight - mobile.stats.rankingFlagHeight / 2
    );
    expect(mobileRowYs[0]! + mobile.stats.rankingEntryRowGap / 2).toBeLessThan(mobile.stats.rankingCardHeight);
  });

  it('keeps the expanded group-card model inside the shared content width on desktop and mobile', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(desktop.groupStage.columns).toBe(2);
    expect(desktop.groupStage.cardHeight).toBe(mobile.groupStage.cardHeight);
    expect(desktop.groupStage.titleFontSize).toBe(mobile.groupStage.titleFontSize);
    expect(desktop.groupStage.formIndicatorRadius).toBe(mobile.groupStage.formIndicatorRadius);
    expect(desktop.groupStage.rowStartY + 3 * desktop.groupStage.rowHeight + desktop.groupStage.flagHeight / 2).toBeLessThan(
      desktop.groupStage.cardHeight - desktop.groupStage.cardPadding
    );
    expect(mobile.groupStage.rowStartY + 3 * mobile.groupStage.rowHeight + mobile.groupStage.flagHeight / 2).toBeLessThan(
      mobile.groupStage.cardHeight - mobile.groupStage.cardPadding
    );
    expect(getGroupStageViewportWidth(desktop)).toBe(desktop.contentWidth);
    expect(getGroupStageViewportWidth(mobile)).toBe(mobile.contentWidth);
    expect(getTournamentHubGroupStageMaxScroll(2, desktop)).toBe(0);
    expect(getTournamentHubGroupStageMaxScroll(4, desktop)).toBeGreaterThan(0);
    expect(getTournamentHubGroupStageMaxScroll(8, desktop)).toBeGreaterThan(
      getTournamentHubGroupStageMaxScroll(4, desktop)
    );
  });

  it('wires match-card scrolling and tap-safe Sim and Play actions without changing their handlers', () => {
    const source = readSource('src/scenes/TournamentHubScene.ts');

    expect(source).toContain('const HUB_INPUT_GUARD_MS = 220');
    expect(source).toContain('this.guardedInputAvailableAt = this.time.now + HUB_INPUT_GUARD_MS');
    expect(source).toContain('private runGuardedInputAction(action: () => void): void');
    expect(source).toContain('private canRunGuardedInputAction(): boolean');
    expect(source).toContain("import { TEAM_CARD_STYLE } from '../ui/teamCardStyle'");
    expect(source).toContain('const layout = createTournamentHubLayout()');
    expect(source).toContain('if (layout.matches.viewportHeight !== null) {');
    expect(source).toContain('this.createMobileMatchesList(tournament, matches, layout)');
    expect(source).toContain('content.setMask(mask)');
    expect(source).toContain('dragScroll.bindDragTarget(scrollZone)');
    expect(source).toContain('dragScroll.bindScrollableTapTarget(zone, action.onTap)');
    expect(source).toContain('onTap: () => this.runGuardedInputAction(() => this.simulateTournamentMatch(tournament, match))');
    expect(source).toContain('onTap: () => this.runGuardedInputAction(() => this.startTournamentMatch(tournament, match))');
    expect(source).toContain('if (!this.canRunGuardedInputAction()) {\n      return;\n    }\n\n    if (match.homeTeamId === undefined');
    expect(source).toContain('this.matchScrollY = 0');
    expect(source).toContain('layout.matches.actionWidth');
    expect(source).toContain('layout.matches.actionGap');
    expect(source).toContain('layout.matches.scoreX');
    expect(source).toContain('layout.matches.cardRadius');
    expect(source).toContain('borderRadius: layout.footer.buttonRadius');
    expect(source).toContain('statsLayout.rankingWidth');
    expect(source).toContain('playoffLayout.width');
    expect(source).toContain("const isAi = teamId !== undefined && getTournamentTeamControllerType(tournament, teamId) === 'AI'");
    expect(source).toContain('this.addMobileAiBadge(row, teamCodeX, flagBottomY, layout)');
    expect(source).toContain('fillRoundedRect(');
    expect(source).toContain('.fillStyle(0xf0c95a, 1)');
    expect(source).toContain("color: '#1f2a2e'");
    expect(source).toContain('MOBILE_MATCH_AI_TEAM_CODE_OFFSET_Y = -10');
    expect(source).not.toContain("getTournamentTeamControllerType(tournament, teamId),");
  });

  it('omits the Matches tab footer navigation while keeping the shared footer available elsewhere', () => {
    const source = readSource('src/scenes/TournamentHubScene.ts');
    const matchesStart = source.indexOf('private createMatchesTab');
    const matchesEnd = source.indexOf('private createMobileMatchesList');
    const matchesBlock = source.slice(matchesStart, matchesEnd);

    expect(matchesBlock).toContain('const matches = tournament.matches');
    expect(matchesBlock).toContain('this.createMobileMatchesList(tournament, matches, layout)');
    expect(matchesBlock).not.toContain('layout.footer.backX');
    expect(matchesBlock).not.toContain('layout.footer.pageX');
    expect(matchesBlock).not.toContain('layout.footer.nextX');
    expect(matchesBlock).not.toContain('changeMatchPage');
    expect(source).not.toContain('MATCHES_PER_PAGE');
    expect(source).toContain("if (this.activeTab !== 'matches') {");
    expect(source).toContain("new Button(this, layout.footer.menuX, layout.footer.y, 'Exit to Main Menu'");
    expect(source).toContain('borderWidth: 0');
    expect(source).toContain("this.activeTab === 'tables'");
    expect(source).toContain("this.activeTab === 'bracket'");
  });

  it('wires group-stage cards with expanded standings, form indicators and score tooltips', () => {
    const source = readSource('src/scenes/TournamentHubScene.ts');

    expect(source).toContain('if (layout.groupStage.viewportHeight !== null) {');
    expect(source).toContain('this.createMobileGroupStage(tournament, layout)');
    expect(source).toContain('getTournamentHubGroupStageMaxScroll(tournament.groups.length, layout)');
    expect(source).toContain('content.setMask(mask)');
    expect(source).toContain('dragScroll.bindDragTarget(scrollZone)');
    expect(source).toContain('this.createMobileGroupTable(tournament, group, x, y, layout)');
    expect(source).toContain("'P', 'Played'");
    expect(source).toContain("'W', 'Wins'");
    expect(source).toContain("'D', 'Draws'");
    expect(source).toContain("'L', 'Losses'");
    expect(source).toContain("'GF', 'Goals for'");
    expect(source).toContain("'GA', 'Goals against'");
    expect(source).toContain("'Pts', 'Points'");
    expect(source).toContain("'Form', 'Recent form'");
    expect(source).toContain('groupLayout.playedX');
    expect(source).toContain('groupLayout.formX');
    expect(source).toContain('groupLayout.rowStartY + index * groupLayout.rowHeight');
    expect(source).toContain('groupLayout.headerY');
    expect(source).toContain('layout.groupStage.formIndicatorGap');
    expect(source).toContain('TEAM_CARD_STYLE.panel.borderColor');
    expect(source).toContain('this.addMobileGroupFormIndicators(');
    expect(source).toContain('this.addMobileGroupRowSeparator(panel, rowY + groupLayout.rowHeight / 2, layout)');
    expect(source).toContain('if (index < standings.length - 1) {');
    expect(source).toContain('GROUP_ROW_SEPARATOR_COLOR');
    expect(source).toContain('getTeamGroupForm(tournament, group, teamId)');
    expect(source).toContain('match.result?.homeTeamId ?? match.homeTeamId');
    expect(source).toContain('match.result?.awayTeamId ?? match.awayTeamId');
    expect(source).toContain('0x71e48b');
    expect(source).toContain('0x9fc5ad');
    expect(source).toContain('0xff788a');
    expect(source).toContain('GROUP_FORM_INACTIVE_COLOR');
    expect(source).toContain('GROUP_FORM_INACTIVE_STROKE_COLOR');
    expect(source).toContain('fillAlpha: 0');
    expect(source).toContain('strokeAlpha: 0.72');
    expect(source).toContain('indicator.setStrokeStyle(2, entry.strokeColor, entry.strokeAlpha)');
    expect(source).toContain('this.showStatsTooltip(indicator, entry.tooltip)');
    expect(source).toContain('`vs ${opponent === undefined ? opponentId : getTeamScoreboardCode(opponent.flagCode)}`');
    expect(source).toContain('`vs ${opponent === undefined ? opponentId : opponent.name}\\n${goalsFor}:${goalsAgainst}`');
  });

  it('renders the Tournament Hub version label from the shared game version source', () => {
    const source = readSource('src/scenes/TournamentHubScene.ts');

    expect(source).toContain("import { GAME_TITLE, GAME_VERSION, SCENE_HEIGHT, SCENE_WIDTH } from '../config'");
    expect(source).toContain('private createVersionLabel(layout: TournamentHubLayout): void');
    expect(source).toContain('this.createVersionLabel(layout)');
    expect(source).toContain('`${GAME_TITLE} | v${GAME_VERSION}`');
    expect(source).toContain('SCENE_WIDTH - 32');
    expect(source).toContain('SCENE_HEIGHT - 10');
    expect(source).toContain("fontSize: layout.mobileLandscape ? '14px' : '16px'");
  });

  it('wires Tournament Hub tabs, Playoff and Stats to the shared tournament panel style', () => {
    const source = readSource('src/scenes/TournamentHubScene.ts');

    expect(source).toContain('selected ? TEAM_CARD_STYLE.selected : TEAM_CARD_STYLE.normal');
    expect(source).toContain('TEAM_CARD_STYLE.hover.backgroundColor');
    expect(source).toContain('statsLayout.rankingWidth');
    expect(source).toContain('const sortedStats = sortTeamStatsForStatsTab(stats, this.statsSort)');
    expect(source).toContain('this.createTeamStatsTable(sortedStats.slice(0, 12), layout)');
    expect(source).toContain("{ title: 'Top scorers', entries: createPlayerRankingEntries(playerStats, 'goals') }");
    expect(source).toContain("{ title: 'Top assists', entries: createPlayerRankingEntries(playerStats, 'assists') }");
    expect(source).toContain("{ title: 'GK saves', entries: createPlayerRankingEntries(playerStats, 'goalkeeperSaves') }");
    expect(source).not.toContain("{ title: 'Goals'");
    expect(source).not.toContain("{ title: 'Shots'");
    expect(source).toContain("const STATS_TABLE_HEADER_COLOR = '#c4d0ca'");
    expect(source).toContain('color: STATS_TABLE_HEADER_COLOR');
    expect(source).toContain('this.addStatsRowSeparator(rows, rowY + STATS_TABLE_ROW_GAP / 2, width)');
    expect(source).toContain('this.addStatsRankingRowSeparator(panel, rowY + statsLayout.rankingEntryRowGap / 2, statsLayout.rankingCardWidth)');
    expect(source).toContain('if (index < stats.length - 1)');
    expect(source).toContain('if (index < visibleEntries.length - 1)');
    expect(source).toContain('lineBetween(18, y, width - 18, y)');
    expect(source).toContain('lineBetween(14, y, width - 14, y)');
    expect(source).toContain('private addSortableStatsHeader(');
    expect(source).toContain("header.on('pointerdown', () => this.changeStatsSort(column))");
    expect(source).toContain("this.statsSort?.column === column && this.statsSort.direction === 'desc' ? 'asc' : 'desc'");
    expect(source).toContain("column === 'team' ? 'asc' : 'desc'");
    expect(source).toContain('const sortedStats = [...stats]');
    expect(source).toContain('return sortedStats.sort((first, second) => {');
    expect(source).toContain("if (sort.column === 'team')");
    expect(source).toContain('const numericDifference = firstValue - secondValue');
    expect(source).toContain('directionMultiplier * numericDifference');
    expect(source).toContain('statsLayout.rankingCardHeight / 2 +');
    expect(source).toContain('(index - (visibleEntries.length - 1) / 2) * statsLayout.rankingEntryRowGap');
    expect(source).toContain('const entryTextX = flagX + statsLayout.rankingFlagWidth + 18');
    expect(source).toContain('this.bindTwoAxisPlayoffScroll(scrollZone, setScroll, maxScrollX, maxScrollY)');
    expect(source).toContain('maxScrollX');
    expect(source).toContain('maxScrollY');
    expect(source).toContain('content.setMask(mask)');
    expect(source).toContain('layout.playoff.cardWidth');
    expect(source).toContain('layout.playoff.cardHeight');
    expect(source).toContain('TEAM_CARD_STYLE.panel.backgroundColor');
    expect(source).toContain('TEAM_CARD_STYLE.panel.borderColor');
    expect(source).toContain('PLAYOFF_CONNECTOR_NEUTRAL_ALPHA');
    expect(source).toContain('PLAYOFF_WINNER_CONNECTOR_COLOR');
    expect(source).toContain('PLAYOFF_WINNER_CONNECTOR_ALPHA');
    expect(source).toContain("if (format.id === 'cup-xl')");
    expect(source).toContain('private createCupXlBracketTab');
    expect(source).toContain('this.drawBracketConnectors(connectorGraphics, startX, columnGap, cardWidth, roundCenters, rounds)');
    expect(source).toContain('this.drawMirroredBracketConnectors(connectorGraphics, rightColumnXs, cardWidth, branchCenters, rightRounds)');
    expect(source).toContain('this.drawCupXlFinalConnectors(');
    expect(source).toContain('graphics.lineStyle(4, PLAYOFF_WINNER_CONNECTOR_COLOR, PLAYOFF_WINNER_CONNECTOR_ALPHA)');
    expect(source).toContain('if (!hasCompletedWinner(sourceMatch))');
    expect(source).toContain('if (!isWinnerSeededIntoMatch(sourceMatch, targetMatch))');
    expect(source).toContain("sourceMatch?.status !== 'completed'");
    expect(source).toContain('targetMatch.homeTeamId === winnerTeamId || targetMatch.awayTeamId === winnerTeamId');
    expect(source).toContain('const startX = 0');
    expect(source).toContain('getBracketTeamLabel(teamId)');
    expect(source).toContain('const flagX = x + 12');
    expect(source).toContain('const teamLabelX = x + layout.playoff.flagWidth + 26');
    expect(source).toContain('const scoreX = layout.playoff.cardWidth - 24');
    expect(source).toContain('fillRoundedRect(0, 0, width, statsLayout.tableHeight, 8)');
    expect(source).toContain('fillRoundedRect(0, 0, statsLayout.rankingCardWidth, statsLayout.rankingCardHeight, 8)');
    expect(source).toContain('getTeamScoreboardCode(team.flagCode)');
    expect(source).not.toContain('.text(x + 26, y, getTeamName(teamId)');
    expect(source).not.toContain('team?.name ?? teamStats.teamId');
  });

  it('keeps all four tab actions and hides only the mobile game title', () => {
    const source = readSource('src/scenes/TournamentHubScene.ts');

    expect(source).toContain("matches: 'Matches'");
    expect(source).toContain("tables: 'Group Stage'");
    expect(source).toContain("bracket: 'Playoff'");
    expect(source).toContain("stats: 'Stats'");
    expect(source).toContain('if (layout.header.showGameTitle)');
    expect(source).toContain('this.runGuardedInputAction(() => {\n          this.activeTab = tab');
    expect(source).toContain('this.activeTab = tab');
  });
});

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

function getStatsRankingContentHeight(layout: ReturnType<typeof createTournamentHubLayout>, cardCount = 5): number {
  const columnCount = Math.floor(
    (layout.stats.rankingWidth + layout.stats.rankingColumnGap) /
      (layout.stats.rankingCardWidth + layout.stats.rankingColumnGap)
  );
  const rowCount = Math.ceil(cardCount / columnCount);

  return (rowCount - 1) * layout.stats.rankingRowGap + 28 + layout.stats.rankingCardHeight;
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
      viewportHeight: 462
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
      titleFontSize: '28px',
      headerFontSize: '19px',
      teamFontSize: '22px',
      valueFontSize: '20px',
      cornerRadius: 8,
      formIndicatorRadius: 11
    });
    expect(layout.playoff).toMatchObject({
      x: 128,
      y: 166,
      width: 1344,
      right: 1472,
      viewportHeight: 462,
      cardWidth: 300,
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
      y: 666,
      right: 1472,
      buttonWidth: 210,
      buttonHeight: 60,
      buttonRadius: 8,
      fontSize: '20px',
      menuX: 233,
      backX: 600,
      pageX: 800,
      nextX: 1367
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

  it('scrolls only the mobile match viewport and keeps pagination pages intact', () => {
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

  it('uses larger rounded footer buttons close to the match viewport on desktop and mobile', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(desktop.footer.buttonWidth).toBeGreaterThan(170);
    expect(desktop.footer.buttonHeight).toBeGreaterThan(54);
    expect(desktop.footer.buttonRadius).toBe(8);
    expect(desktop.footer.y - desktop.footer.buttonHeight / 2 - (desktop.matches.y + desktop.matches.viewportHeight!)).toBeLessThanOrEqual(8);
    expect(mobile.footer.buttonWidth).toBeGreaterThan(260);
    expect(mobile.footer.buttonHeight).toBeGreaterThan(54);
    expect(mobile.footer.buttonRadius).toBe(8);
    expect(mobile.footer.y - mobile.footer.buttonHeight / 2 - (mobile.matches.y + mobile.matches.viewportHeight!)).toBeLessThanOrEqual(10);
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
      expect(layout.playoff.cardWidth).toBeGreaterThan(210);
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
    expect(mobile.groupStage.titleFontSize).toBe('28px');
    expect(mobile.groupStage.headerFontSize).toBe('19px');
    expect(mobile.groupStage.teamFontSize).toBe('22px');
    expect(mobile.groupStage.valueFontSize).toBe('20px');
    expect(mobile.groupStage.flagWidth).toBe(44);
    expect(mobile.groupStage.flagHeight).toBe(33);
    expect(mobile.groupStage.playedX).toBe(260);
    expect(mobile.groupStage.formX).toBe(668);
    expect(mobile.groupStage.formIndicatorGap).toBe(26);
    expect(mobile.groupStage.viewportHeight).toBe(470);
    expect(mobile.groupStage.cornerRadius).toBe(8);
    expect(mobile.groupStage.formIndicatorRadius).toBe(11);
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
    expect(desktop.groupStage.playedX).toBe(222);
    expect(desktop.groupStage.formX).toBe(584);
    expect(desktop.groupStage.formIndicatorGap).toBe(22);
    expect(desktop.groupStage.titleFontSize).toBe('28px');
    expect(desktop.groupStage.headerFontSize).toBe('19px');
    expect(desktop.groupStage.teamFontSize).toBe('22px');
    expect(desktop.groupStage.valueFontSize).toBe('20px');
    expect(desktop.groupStage.flagWidth).toBe(44);
    expect(desktop.groupStage.flagHeight).toBe(33);
    expect(getGroupStageFormRight(desktop)).toBeLessThanOrEqual(
      desktop.groupStage.cardWidth - desktop.groupStage.cardPadding
    );
    expect(getGroupStageFormRight(mobile)).toBeLessThanOrEqual(
      mobile.groupStage.cardWidth - mobile.groupStage.cardPadding
    );
    expect(mobile.groupStage.playedX).toBe(260);
    expect(mobile.groupStage.formX).toBe(668);
    expect(mobile.groupStage.formIndicatorGap).toBe(26);
  });

  it('keeps Playoff narrower, masked and scroll-ready within the shared content contract', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);
    const cupLDesktopBracketWidth = desktop.playoff.cardWidth * 3 + desktop.playoff.maxColumnGap * 2;
    const cupLMobileBracketWidth = mobile.playoff.cardWidth * 3 + mobile.playoff.maxColumnGap * 2;

    expect(desktop.playoff.width).toBe(desktop.contentWidth);
    expect(mobile.playoff.width).toBe(mobile.contentWidth);
    expect(desktop.playoff.cardWidth).toBe(300);
    expect(desktop.playoff.cardHeight).toBe(86);
    expect(mobile.playoff.cardWidth).toBe(320);
    expect(mobile.playoff.cardHeight).toBe(92);
    expect(desktop.playoff.cardWidth).toBeLessThan(360);
    expect(mobile.playoff.cardWidth).toBeLessThan(400);
    expect(desktop.playoff.maxColumnGap).toBe(128);
    expect(mobile.playoff.maxColumnGap).toBe(150);
    expect(desktop.playoff.width - cupLDesktopBracketWidth).toBeGreaterThanOrEqual(180);
    expect(mobile.playoff.width - cupLMobileBracketWidth).toBeGreaterThanOrEqual(270);
    expect(desktop.playoff.viewportHeight).toBe(desktop.matches.viewportHeight);
    expect(mobile.playoff.viewportHeight).toBe(mobile.matches.viewportHeight);
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

      expect(layout.stats.tableWidth).toBeLessThan(780);
      expect(tableRight).toBeLessThan(layout.stats.rankingX);
      expect(statsRight).toBe(layout.contentRight);
      expect(cardRowWidth).toBeLessThanOrEqual(layout.stats.rankingWidth);
      expect(layout.stats.tableHeaderFontSize).toBe('16px');
      expect(layout.stats.tableTeamFontSize).toBe('18px');
      expect(layout.stats.tableValueFontSize).toBe('17px');
      expect(layout.stats.rankingCardWidth).toBeGreaterThan(196);
      expect(layout.stats.rankingCardHeight).toBeGreaterThan(72);
      expect(layout.stats.rankingRowGap).toBeLessThanOrEqual(156);
      expect(layout.stats.rankingValueFontSize).toBe('17px');
    });
  });

  it('fits the enlarged Stats individual cards vertically without requiring a scrollbar', () => {
    [createTournamentHubLayout(false), createTournamentHubLayout(true)].forEach((layout) => {
      expect(layout.stats.rankingCardWidth).toBe(300);
      expect(layout.stats.rankingCardHeight).toBe(102);
      expect(layout.stats.rankingRowGap).toBe(156);
      expect(getStatsRankingContentHeight(layout)).toBeLessThanOrEqual(462);
    });
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

    expect(source).toContain("import { TEAM_CARD_STYLE } from '../ui/teamCardStyle'");
    expect(source).toContain('const layout = createTournamentHubLayout()');
    expect(source).toContain('if (layout.matches.viewportHeight !== null) {');
    expect(source).toContain('this.createMobileMatchesList(tournament, pageMatches, layout)');
    expect(source).toContain('content.setMask(mask)');
    expect(source).toContain('dragScroll.bindDragTarget(scrollZone)');
    expect(source).toContain('dragScroll.bindScrollableTapTarget(zone, action.onTap)');
    expect(source).toContain('onTap: () => this.simulateTournamentMatch(tournament, match)');
    expect(source).toContain('onTap: () => this.startTournamentMatch(tournament, match)');
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
    expect(source).toContain('getTeamGroupForm(tournament, group, teamId)');
    expect(source).toContain('0x71e48b');
    expect(source).toContain('0x9fc5ad');
    expect(source).toContain('0xff788a');
    expect(source).toContain('this.showStatsTooltip(indicator, entry.tooltip)');
    expect(source).toContain('`vs ${opponent === undefined ? opponentId : opponent.name}\\n${goalsFor}:${goalsAgainst}`');
  });

  it('wires Tournament Hub tabs, Playoff and Stats to the shared tournament panel style', () => {
    const source = readSource('src/scenes/TournamentHubScene.ts');

    expect(source).toContain('selected ? TEAM_CARD_STYLE.selected : TEAM_CARD_STYLE.normal');
    expect(source).toContain('TEAM_CARD_STYLE.hover.backgroundColor');
    expect(source).toContain('statsLayout.rankingWidth');
    expect(source).toContain('this.bindTwoAxisPlayoffScroll(scrollZone, setScroll, maxScrollX, maxScrollY)');
    expect(source).toContain('maxScrollX');
    expect(source).toContain('maxScrollY');
    expect(source).toContain('content.setMask(mask)');
    expect(source).toContain('layout.playoff.cardWidth');
    expect(source).toContain('layout.playoff.cardHeight');
    expect(source).toContain("if (format.id === 'cup-xl')");
    expect(source).toContain('private createCupXlBracketTab');
    expect(source).toContain('this.drawMirroredBracketConnectors');
    expect(source).toContain('const startX = 0');
    expect(source).toContain('getBracketTeamLabel(teamId)');
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
    expect(source).toContain('this.activeTab = tab');
  });
});

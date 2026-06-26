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

describe('Tournament Hub responsive layout', () => {
  it('keeps the desktop header, tabs and footer while using larger card layouts', () => {
    const layout = createTournamentHubLayout(false);

    expect(layout.header).toEqual({
      showGameTitle: true,
      gameTitleY: 30,
      gameTitleFontSize: '30px',
      tournamentTitleY: 68,
      tournamentTitleFontSize: '24px'
    });
    expect(layout.tabs).toEqual({
      startX: 387,
      y: 116,
      width: 190,
      height: 46,
      gap: 22,
      fontSize: '20px'
    });
    expect(layout.matches).toMatchObject({
      x: 128,
      y: 168,
      columns: 1,
      columnGap: 0,
      rowGap: 82,
      cardWidth: 1344,
      cardHeight: 72,
      viewportHeight: 450
    });
    expect(layout.groupStage).toMatchObject({
      x: 32,
      y: 166,
      columns: 2,
      cardWidth: 756,
      cardHeight: 430,
      viewportHeight: 470,
      cornerRadius: 8,
      formIndicatorRadius: 9
    });
    expect(layout.footer).toMatchObject({
      y: 666,
      buttonWidth: 170,
      menuX: 132,
      backX: 600,
      pageX: 800,
      nextX: 1000
    });
  });

  it('uses a compact title and contiguous full-width tab bar in mobile landscape', () => {
    const layout = createTournamentHubLayout(true);

    expect(layout.header.showGameTitle).toBe(false);
    expect(layout.header.tournamentTitleY).toBe(28);
    expect(layout.tabs.startX).toBe(32);
    expect(layout.tabs.gap).toBe(0);
    expect(layout.tabs.height).toBeGreaterThan(createTournamentHubLayout(false).tabs.height);
    expect(layout.tabs.width * 4).toBe(1536);
    expect(layout.tabs.fontSize).toBe(layout.matches.actionFontSize);
  });

  it('uses one full-width tall match card column with touch-sized actions', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(mobile.matches.columns).toBe(1);
    expect(mobile.matches.cardWidth).toBe(1536);
    expect(mobile.matches.cardHeight).toBeGreaterThan(desktop.matches.cardHeight);
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
    expect(desktop.matches.actionHeight).toBe(desktop.matches.cardHeight);
    expect(desktop.matches.actionWidth).toBeGreaterThan(70);
    expect(desktop.matches.actionGap).toBe(0);
    expect(desktop.matches.flagWidth).toBeGreaterThan(26);
    expect(desktop.matches.teamFontSize).toBe('20px');
  });

  it('uses two large group cards per row in mobile landscape and scrolls extra group rows', () => {
    const mobile = createTournamentHubLayout(true);

    expect(mobile.groupStage.columns).toBe(2);
    expect(mobile.groupStage.cardWidth).toBe(756);
    expect(mobile.groupStage.cardHeight).toBe(430);
    expect(mobile.groupStage.viewportHeight).toBe(470);
    expect(mobile.groupStage.cornerRadius).toBe(8);
    expect(mobile.groupStage.formIndicatorRadius).toBe(9);
    expect(getTournamentHubGroupStageMaxScroll(2, mobile)).toBe(0);
    expect(getTournamentHubGroupStageMaxScroll(4, mobile)).toBeGreaterThan(0);
    expect(getTournamentHubGroupStageMaxScroll(8, mobile)).toBeGreaterThan(
      getTournamentHubGroupStageMaxScroll(4, mobile)
    );
  });

  it('uses the same expanded group-card model on desktop without changing mobile geometry', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(desktop.groupStage.columns).toBe(2);
    expect(desktop.groupStage.cardWidth).toBe(mobile.groupStage.cardWidth);
    expect(desktop.groupStage.cardHeight).toBe(mobile.groupStage.cardHeight);
    expect(desktop.groupStage.titleFontSize).toBe(mobile.groupStage.titleFontSize);
    expect(desktop.groupStage.formIndicatorRadius).toBe(mobile.groupStage.formIndicatorRadius);
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
    expect(source).toContain('this.addMobileGroupFormIndicators(');
    expect(source).toContain('getTeamGroupForm(tournament, group, teamId)');
    expect(source).toContain('0x71e48b');
    expect(source).toContain('0x9fc5ad');
    expect(source).toContain('0xff788a');
    expect(source).toContain('this.showStatsTooltip(indicator, entry.tooltip)');
    expect(source).toContain('`vs ${opponent === undefined ? opponentId : opponent.name}\\n${goalsFor}:${goalsAgainst}`');
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

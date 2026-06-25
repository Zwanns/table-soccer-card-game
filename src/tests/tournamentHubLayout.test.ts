import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createTournamentHubLayout,
  getTournamentHubMatchMaxScroll
} from '../ui/tournamentHubLayout';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('Tournament Hub responsive layout', () => {
  it('preserves the desktop header, tabs, match grid and footer geometry', () => {
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
      columns: 2,
      columnGap: 40,
      rowGap: 45,
      cardWidth: 652,
      cardHeight: 38,
      viewportHeight: null
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
  });

  it('uses one full-width tall match card column with touch-sized actions', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(mobile.matches.columns).toBe(1);
    expect(mobile.matches.cardWidth).toBe(1536);
    expect(mobile.matches.cardHeight).toBeGreaterThan(desktop.matches.cardHeight * 2);
    expect(mobile.matches.actionHeight).toBeGreaterThanOrEqual(44);
    expect(mobile.matches.actionFontSize).toBe('20px');
    expect(mobile.matches.actionWidth).toBeGreaterThan(desktop.matches.actionWidth);
    expect(mobile.matches.flagHeight).toBeCloseTo(mobile.matches.actionHeight, -1);
    expect(mobile.matches.scoreX).toBe(mobile.matches.cardWidth / 2);
    expect(mobile.matches.scoreFontSize).toBe('36px');
    expect(mobile.matches.labelFontSize).toBe('22px');
    expect(mobile.matches.teamFontSize).toBe('28px');
  });

  it('keeps team blocks symmetric around the centered score and uses equal action buttons', () => {
    const mobile = createTournamentHubLayout(true);
    const homeDistance =
      mobile.matches.scoreX -
      (mobile.matches.homeTeamX + mobile.matches.controllerOffsetX);
    const awayDistance = mobile.matches.awayTeamX - mobile.matches.scoreX;

    expect(homeDistance).toBe(awayDistance);
    expect(mobile.matches.actionWidth).toBe(142);
    expect(mobile.matches.actionGap).toBe(14);
    expect(mobile.matches.controllerOffsetX).toBeGreaterThan(mobile.matches.teamCodeOffsetX);
  });

  it('scrolls only the mobile match viewport and keeps pagination pages intact', () => {
    const desktop = createTournamentHubLayout(false);
    const mobile = createTournamentHubLayout(true);

    expect(getTournamentHubMatchMaxScroll(4, mobile)).toBe(0);
    expect(getTournamentHubMatchMaxScroll(20, mobile)).toBeGreaterThan(0);
    expect(getTournamentHubMatchMaxScroll(20, desktop)).toBe(0);
  });

  it('wires mobile match scrolling and tap-safe Sim and Play actions without changing their handlers', () => {
    const source = readSource('src/scenes/TournamentHubScene.ts');

    expect(source).toContain("import { TEAM_CARD_STYLE } from '../ui/teamCardStyle'");
    expect(source).toContain('const layout = createTournamentHubLayout()');
    expect(source).toContain('if (layout.mobileLandscape) {');
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
    expect(source).toContain('layout.matches.controllerOffsetX');
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

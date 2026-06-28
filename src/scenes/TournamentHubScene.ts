import Phaser from 'phaser';
import { GAME_TITLE, GAME_VERSION, SCENE_HEIGHT, SCENE_WIDTH, TOURNAMENT_ASSETS } from '../config';
import { getFlagAssetKey, getTeamScoreboardCode, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import {
  getTournamentFormat,
  getTournamentGroupStandings,
  getTournamentTeamControllerType,
  getTournamentPlayerStats,
  getTournamentPlayerStatsRanking,
  getTournamentTeamStats,
  getTournamentTeamStatsRanking,
  type TournamentGroup,
  type TournamentMatch,
  type TournamentStage,
  type TournamentState,
  type TournamentTeamId,
  type TournamentPlayerStats,
  type TournamentPlayerStatsRankingKey,
  type TournamentTeamStats
} from '../tournament';
import { Button } from '../ui/Button';
import { TEAM_CARD_STYLE } from '../ui/teamCardStyle';
import { createTournamentBackground } from '../ui/tournamentBackground';
import {
  createTournamentHubLayout,
  getTournamentHubCupXlPlayoffGeometry,
  getTournamentHubGroupStageMaxScroll,
  getTournamentHubMatchMaxScroll,
  type TournamentHubLayout
} from '../ui/tournamentHubLayout';
import { createDragScrollArea, TOUCH_SCROLL_WHEEL_FACTOR, clampScroll } from '../ui/touchInput';
import { createSimulatedTournamentGameState } from './tournamentMatchSimulation';

type TournamentHubTab = 'matches' | 'tables' | 'bracket' | 'stats';

interface TournamentHubSceneData {
  initialTab?: TournamentHubTab;
}

type StatsRankingEntry = {
  teamId: TournamentTeamId;
  label: string;
  value: number;
};

type StatsRankingCardDefinition = {
  title: string;
  entries: StatsRankingEntry[];
};

type GroupFormEntry = {
  color: number;
  fillAlpha: number;
  strokeAlpha: number;
  strokeColor: number;
  tooltip: string;
};

type PlayoffRenderRound = {
  matches: readonly TournamentMatch[];
};

const TAB_LABELS: Record<TournamentHubTab, string> = {
  matches: 'Matches',
  tables: 'Group Stage',
  bracket: 'Playoff',
  stats: 'Stats'
};

const STAGE_LABELS: Record<TournamentStage, string> = {
  group: 'Group Stage',
  'round-of-16': 'Round of 16',
  'quarter-final': 'Quarter-final',
  'semi-final': 'Semi-final',
  final: 'Final',
  complete: 'Complete'
};

const MOBILE_MATCH_AI_BADGE_WIDTH = 34;
const MOBILE_MATCH_AI_BADGE_HEIGHT = 16;
const MOBILE_MATCH_AI_BADGE_RADIUS = 4;
const MOBILE_MATCH_AI_TEAM_CODE_OFFSET_Y = -10;
const HUB_INPUT_GUARD_MS = 220;
const GROUP_FORM_PLAYED_STROKE_COLOR = 0x10291f;
const GROUP_FORM_INACTIVE_COLOR = 0xd7ddd9;
const GROUP_FORM_INACTIVE_STROKE_COLOR = 0xb8c2bc;
const GROUP_ROW_SEPARATOR_COLOR = 0xb8c2bc;
const PLAYOFF_CONNECTOR_NEUTRAL_ALPHA = 0.74;
const PLAYOFF_WINNER_CONNECTOR_COLOR = 0xf0c95a;
const PLAYOFF_WINNER_CONNECTOR_ALPHA = 0.96;
const PLAYOFF_TEAM_ROW_X = 18;
const PLAYOFF_FLAG_OFFSET_X = 12;
const PLAYOFF_FLAG_TEXT_GAP = 18;
const PLAYOFF_SCORE_RIGHT_PADDING = 24;
const PLAYOFF_TBD_FLAG_PLACEHOLDER_STROKE_ALPHA = 0.54;
const MATCH_GRID = {
  x: 128,
  y: 168,
  columns: 2,
  columnGap: 40,
  rowGap: 45,
  cardWidth: 652,
  cardHeight: 38
} as const;
const MATCH_CARD_SCORE_X = 306;
const MATCH_CARD_HOME_TEAM_X = 122;
const MATCH_CARD_HOME_TEAM_WIDTH = 136;
const MATCH_CARD_AWAY_TEAM_X = 356;
const MATCH_CARD_AWAY_TEAM_WIDTH = 132;
const GROUP_TABLE_COLUMNS = {
  played: 164,
  points: 202,
  goalDifference: 240,
  goals: 286
} as const;
const STATS_TABLE_ROW_GAP = 30;
const STATS_TABLE_VIEWPORT_Y = 46;
const STATS_TABLE_VIEWPORT_HEIGHT = 400;
const STATS_RANKING_VIEWPORT_HEIGHT = 462;
const STATS_RANKING_CARD_Y = 28;
const STATS_RANKING_MAX_COLUMNS = 3;
const STATS_TABLE_HEADER_COLOR = '#c4d0ca';
const STATS_TOOLTIP_DEPTH = 10000;
const STATS_TOOLTIP_PADDING_X = 12;
const STATS_TOOLTIP_PADDING_Y = 8;
const STATS_TABLE_COLUMNS = {
  played: 292,
  wins: 334,
  draws: 376,
  losses: 418,
  goalsFor: 464,
  goalsAgainst: 510,
  goalDifference: 556,
  shots: 606,
  goalkeeperSaves: 656
} as const;

type StatsSortColumn = 'team' | keyof typeof STATS_TABLE_COLUMNS;
type StatsSortDirection = 'asc' | 'desc';

type StatsSortState = {
  column: StatsSortColumn;
  direction: StatsSortDirection;
};

export class TournamentHubScene extends Phaser.Scene {
  private activeTab: TournamentHubTab = 'matches';
  private matchScrollY = 0;
  private groupStageScrollY = 0;
  private playoffScrollX = 0;
  private playoffScrollY = 0;
  private statsRankingScrollY = 0;
  private statsTeamScrollY = 0;
  private statsSort: StatsSortState | null = null;
  private mobileLandscapeLayout = false;
  private guardedInputAvailableAt = 0;

  public constructor() {
    super('TournamentHubScene');
  }

  public init(data: TournamentHubSceneData = {}): void {
    this.activeTab = data.initialTab ?? this.activeTab;
  }

  public create(): void {
    this.mobileLandscapeLayout = createTournamentHubLayout().mobileLandscape;
    this.guardedInputAvailableAt = this.time.now + HUB_INPUT_GUARD_MS;
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleScaleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleScaleResize, this);
    });
    this.render();
  }

  private handleScaleResize(): void {
    const mobileLandscapeLayout = createTournamentHubLayout().mobileLandscape;

    if (mobileLandscapeLayout === this.mobileLandscapeLayout) {
      return;
    }

    this.mobileLandscapeLayout = mobileLandscapeLayout;
    this.matchScrollY = 0;
    this.groupStageScrollY = 0;
    this.playoffScrollX = 0;
    this.playoffScrollY = 0;
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);

    const tournament = this.getTournament();
    const layout = createTournamentHubLayout();

    createTournamentBackground(this, this.getBackgroundAssetKey());

    if (tournament === null) {
      this.renderMissingTournament();
      return;
    }

    this.createHeader(tournament, layout);
    this.createTabs(layout);

    if (this.activeTab === 'matches') {
      this.createMatchesTab(tournament, layout);
    } else if (this.activeTab === 'tables') {
      this.createTablesTab(tournament, layout);
    } else if (this.activeTab === 'bracket') {
      this.createBracketTab(tournament, layout);
    } else {
      this.createStatsTab(tournament, layout);
    }

    new Button(this, layout.footer.menuX, layout.footer.y, 'Exit to Main Menu', () => this.runGuardedInputAction(() => this.scene.start('MenuScene')), {
      borderWidth: 0,
      borderRadius: layout.footer.buttonRadius,
      fontSize: layout.footer.fontSize,
      height: layout.footer.buttonHeight,
      width: layout.footer.buttonWidth
    });

    this.createVersionLabel(layout);
  }

  private renderMissingTournament(): void {
    this.add
      .text(SCENE_WIDTH / 2, 220, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '38px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    this.add
      .text(SCENE_WIDTH / 2, 320, 'Tournament not found', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    new Button(this, SCENE_WIDTH / 2, 430, 'Create tournament', () => this.runGuardedInputAction(() => this.scene.start('TournamentSetupScene')), {
      width: 260
    });
    new Button(this, SCENE_WIDTH / 2, 500, 'Menu', () => this.runGuardedInputAction(() => this.scene.start('MenuScene')), {
      width: 260
    });
  }

  private getBackgroundAssetKey(): string {
    return this.activeTab === 'stats' ? TOURNAMENT_ASSETS.statsBackground : TOURNAMENT_ASSETS.background;
  }

  private createVersionLabel(layout: TournamentHubLayout): void {
    this.add
      .text(SCENE_WIDTH - 32, SCENE_HEIGHT - 10, `${GAME_TITLE} | v${GAME_VERSION}`, {
        align: 'right',
        color: '#b8d2c1',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.mobileLandscape ? '14px' : '16px',
        fontStyle: '700'
      })
      .setOrigin(1, 1)
      .setDepth(STATS_TOOLTIP_DEPTH - 1);
  }

  private createHeader(tournament: TournamentState, layout: TournamentHubLayout): void {
    const format = getTournamentFormat(tournament.formatId);
    const completedMatches = tournament.matches.filter((match) => match.status === 'completed').length;

    if (layout.header.showGameTitle) {
      this.add
        .text(SCENE_WIDTH / 2, layout.header.gameTitleY, GAME_TITLE, {
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.header.gameTitleFontSize,
          fontStyle: '700'
        })
        .setOrigin(0.5);
    }
    this.add
      .text(
        SCENE_WIDTH / 2,
        layout.header.tournamentTitleY,
        `${format.name} | ${completedMatches}/${tournament.matches.length} matches`,
        {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.header.tournamentTitleFontSize,
        fontStyle: '700'
        }
      )
      .setOrigin(0.5);
  }

  private createTabs(layout: TournamentHubLayout): void {
    const tabs = Object.keys(TAB_LABELS) as TournamentHubTab[];

    tabs.forEach((tab, index) => {
      const selected = this.activeTab === tab;
      const x =
        layout.tabs.startX +
        layout.tabs.width / 2 +
        index * (layout.tabs.width + layout.tabs.gap);
      const button = this.add.container(x, layout.tabs.y);
      const style = selected ? TEAM_CARD_STYLE.selected : TEAM_CARD_STYLE.normal;
      const background = this.add.rectangle(
        0,
        0,
        layout.tabs.width,
        layout.tabs.height,
        style.backgroundColor,
        style.backgroundAlpha
      );
      background.setStrokeStyle(style.borderWidth, style.borderColor, style.borderAlpha);
      const label = this.add
        .text(0, 0, TAB_LABELS[tab], {
          color: style.textColor,
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.tabs.fontSize,
          fontStyle: '700'
        })
        .setOrigin(0.5);

      button.add([background, label]);
      button.setSize(layout.tabs.width, layout.tabs.height);
      button.setInteractive({ useHandCursor: true });
      button.on('pointerover', () => {
        if (!selected) {
          background.setFillStyle(TEAM_CARD_STYLE.hover.backgroundColor, TEAM_CARD_STYLE.hover.backgroundAlpha);
          background.setStrokeStyle(
            TEAM_CARD_STYLE.hover.borderWidth,
            TEAM_CARD_STYLE.hover.borderColor,
            TEAM_CARD_STYLE.hover.borderAlpha
          );
          label.setColor(TEAM_CARD_STYLE.hover.textColor);
        }
      });
      button.on('pointerout', () => {
        if (!selected) {
          background.setFillStyle(TEAM_CARD_STYLE.normal.backgroundColor, TEAM_CARD_STYLE.normal.backgroundAlpha);
          background.setStrokeStyle(
            TEAM_CARD_STYLE.normal.borderWidth,
            TEAM_CARD_STYLE.normal.borderColor,
            TEAM_CARD_STYLE.normal.borderAlpha
          );
          label.setColor(TEAM_CARD_STYLE.normal.textColor);
        }
      });
      button.on('pointerdown', () => {
        this.runGuardedInputAction(() => {
          this.activeTab = tab;
          this.matchScrollY = 0;
          this.groupStageScrollY = 0;
          this.playoffScrollX = 0;
          this.playoffScrollY = 0;
          this.render();
        });
      });
    });
  }

  private createMatchesTab(tournament: TournamentState, layout: TournamentHubLayout): void {
    const matches = tournament.matches;

    if (layout.matches.viewportHeight !== null) {
      this.createMobileMatchesList(tournament, matches, layout);
    } else {
      matches.forEach((match, index) => {
        const column = index % MATCH_GRID.columns;
        const row = Math.floor(index / MATCH_GRID.columns);
        const x = MATCH_GRID.x + column * (MATCH_GRID.cardWidth + MATCH_GRID.columnGap);
        const y = MATCH_GRID.y + row * MATCH_GRID.rowGap;

        this.createMatchRow(tournament, match, x, y);
      });
    }
  }

  private createMobileMatchesList(
    tournament: TournamentState,
    matches: readonly TournamentMatch[],
    layout: TournamentHubLayout
  ): void {
    const viewportHeight = layout.matches.viewportHeight ?? 0;
    const content = this.add.container(0, layout.matches.y);
    const actionTargets: Phaser.GameObjects.Zone[] = [];
    const maxScroll = getTournamentHubMatchMaxScroll(matches.length, layout);
    let refreshInputs = (): void => {};
    const setScroll = (value: number): void => {
      this.matchScrollY = clampScroll(value, maxScroll);
      content.y = layout.matches.y - this.matchScrollY;
      refreshInputs();
    };
    const dragScroll = createDragScrollArea({
      scene: this,
      viewport: {
        x: layout.matches.x,
        y: layout.matches.y,
        width: layout.matches.cardWidth,
        height: viewportHeight
      },
      maxScroll,
      getScroll: () => this.matchScrollY,
      setScroll
    });

    matches.forEach((match, index) => {
      const rowY = index * layout.matches.rowGap;
      const row = this.createMobileMatchRow(tournament, match, layout);

      row.setPosition(layout.matches.x, rowY);
      content.add(row);

      if (match.status === 'available' && match.homeTeamId !== undefined && match.awayTeamId !== undefined) {
        const playX =
          layout.matches.cardWidth -
          layout.matches.actionRightMargin -
          layout.matches.actionWidth / 2;
        const simX =
          playX -
          layout.matches.actionWidth -
          layout.matches.actionGap;
        const actions = [
          {
            x: simX,
            width: layout.matches.actionWidth,
            onTap: () => this.runGuardedInputAction(() => this.simulateTournamentMatch(tournament, match))
          },
          {
            x: playX,
            width: layout.matches.actionWidth,
            onTap: () => this.runGuardedInputAction(() => this.startTournamentMatch(tournament, match))
          }
        ];

        actions.forEach((action) => {
          const zone = this.add
            .zone(
              layout.matches.x + action.x,
              rowY + layout.matches.cardHeight / 2,
              action.width,
              layout.matches.actionHeight
            )
            .setInteractive({ useHandCursor: true });

          zone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
            setScroll(this.matchScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
          });
          dragScroll.bindScrollableTapTarget(zone, action.onTap);
          actionTargets.push(zone);
          content.add(zone);
        });
      }
    });

    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(layout.matches.x, layout.matches.y, layout.matches.cardWidth, viewportHeight)
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZone = this.add
      .zone(
        layout.matches.x + layout.matches.cardWidth / 2,
        layout.matches.y + viewportHeight / 2,
        layout.matches.cardWidth,
        viewportHeight
      )
      .setInteractive({ useHandCursor: maxScroll > 0 })
      .setDepth(-10);

    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(this.matchScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    dragScroll.bindDragTarget(scrollZone);
    refreshInputs = () => dragScroll.updateScrollableItemInputs(content, actionTargets);
    this.matchScrollY = clampScroll(this.matchScrollY, maxScroll);
    setScroll(this.matchScrollY);

    if (maxScroll > 0) {
      this.createScrollbar(
        this.add.container(0, 0),
        layout.matches.x + layout.matches.cardWidth + 10,
        layout.matches.y,
        viewportHeight,
        maxScroll,
        () => this.matchScrollY
      );
    }
  }

  private createMobileMatchRow(
    tournament: TournamentState,
    match: TournamentMatch,
    layout: TournamentHubLayout
  ): Phaser.GameObjects.Container {
    const row = this.add.container(0, 0);
    const borderStyle = match.status === 'completed' ? TEAM_CARD_STYLE.selected : TEAM_CARD_STYLE.panel;
    const background = this.add.graphics();
    background.fillStyle(TEAM_CARD_STYLE.panel.backgroundColor, TEAM_CARD_STYLE.panel.backgroundAlpha);
    background.fillRoundedRect(0, 0, layout.matches.cardWidth, layout.matches.cardHeight, layout.matches.cardRadius);
    background.lineStyle(borderStyle.borderWidth, borderStyle.borderColor, borderStyle.borderAlpha);
    background.strokeRoundedRect(0, 0, layout.matches.cardWidth, layout.matches.cardHeight, layout.matches.cardRadius);
    row.add(background);

    row.add(
      this.add
        .text(20, layout.matches.cardHeight / 2, formatMatchLabel(match), {
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.matches.labelFontSize,
          fontStyle: '700'
        })
        .setOrigin(0, 0.5)
    );

    this.addMobileMatchTeam(
      row,
      tournament,
      match.homeTeamId,
      layout.matches.homeTeamX,
      layout.matches.cardHeight / 2,
      layout
    );
    row.add(
      this.add
        .text(layout.matches.scoreX, layout.matches.cardHeight / 2, formatMatchScore(match), {
          align: 'center',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.matches.scoreFontSize,
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );
    this.addMobileMatchTeam(
      row,
      tournament,
      match.awayTeamId,
      layout.matches.awayTeamX,
      layout.matches.cardHeight / 2,
      layout
    );

    if (match.status === 'available' && match.homeTeamId !== undefined && match.awayTeamId !== undefined) {
      const playX =
        layout.matches.cardWidth -
        layout.matches.actionRightMargin -
        layout.matches.actionWidth / 2;
      const simX =
        playX -
        layout.matches.actionWidth -
        layout.matches.actionGap;
      row.add(
        this.createMobileMatchActionVisual(
          simX,
          layout.matches.cardHeight / 2,
          'Sim',
          layout.matches.actionWidth,
          layout
        )
      );
      row.add(
        this.createMobileMatchActionVisual(
          playX,
          layout.matches.cardHeight / 2,
          'Play',
          layout.matches.actionWidth,
          layout
        )
      );
    } else {
      row.add(
        this.add
          .text(layout.matches.cardWidth - 24, layout.matches.cardHeight / 2, formatMatchStatus(match), {
            align: 'right',
            color: match.status === 'completed' ? '#f0c95a' : '#8fb39d',
            fontFamily: 'Arial, sans-serif',
            fontSize: layout.matches.labelFontSize,
            fontStyle: '700'
          })
          .setOrigin(1, 0.5)
      );
    }

    return row;
  }

  private addMobileMatchTeam(
    row: Phaser.GameObjects.Container,
    tournament: TournamentState,
    teamId: TournamentTeamId | undefined,
    x: number,
    y: number,
    layout: TournamentHubLayout
  ): void {
    const team = teamId === undefined ? undefined : findTeam(teamId);
    const isAi = teamId !== undefined && getTournamentTeamControllerType(tournament, teamId) === 'AI';
    const teamCodeX = x + layout.matches.teamCodeOffsetX;
    const teamCodeY = isAi ? y + MOBILE_MATCH_AI_TEAM_CODE_OFFSET_Y : y;
    const flagBottomY = y + layout.matches.flagHeight / 2;

    if (team !== undefined) {
      const flag = this.add.image(x, y, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(layout.matches.flagWidth, layout.matches.flagHeight);
      row.add(flag);
    }

    row.add(
      this.add
        .text(teamCodeX, teamCodeY, team === undefined ? 'TBD' : getTeamScoreboardCode(team.flagCode), {
          color: team === undefined ? '#8fb39d' : TEAM_CARD_STYLE.normal.textColor,
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.matches.teamFontSize,
          fontStyle: '700'
        })
        .setOrigin(0, 0.5)
    );

    if (isAi) {
      this.addMobileAiBadge(row, teamCodeX, flagBottomY, layout);
    }
  }

  private addMobileAiBadge(
    row: Phaser.GameObjects.Container,
    x: number,
    bottomY: number,
    layout: TournamentHubLayout
  ): void {
    const y = bottomY - MOBILE_MATCH_AI_BADGE_HEIGHT;
    const badge = this.add.graphics();

    badge
      .fillStyle(0xf0c95a, 1)
      .fillRoundedRect(
        x,
        y,
        MOBILE_MATCH_AI_BADGE_WIDTH,
        MOBILE_MATCH_AI_BADGE_HEIGHT,
        MOBILE_MATCH_AI_BADGE_RADIUS
      );
    row.add(badge);
    row.add(
      this.add
        .text(x + MOBILE_MATCH_AI_BADGE_WIDTH / 2, y + MOBILE_MATCH_AI_BADGE_HEIGHT / 2, 'AI', {
          color: '#1f2a2e',
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.matches.controllerFontSize,
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );
  }

  private createMobileMatchActionVisual(
    x: number,
    y: number,
    label: string,
    width: number,
    layout: TournamentHubLayout
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, width, layout.matches.actionHeight, 0xf0c95a, 1);
    background.setStrokeStyle(2, 0x2d382f, 0.95);
    const text = this.add
      .text(0, 0, label, {
        color: '#1f2a2e',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.matches.actionFontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);

    button.add([background, text]);
    return button;
  }

  private createMatchRow(tournament: TournamentState, match: TournamentMatch, x: number, y: number): void {
    const row = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, MATCH_GRID.cardWidth, MATCH_GRID.cardHeight, 0x0b2118, 0.86);
    background.setOrigin(0);
    background.setStrokeStyle(1, match.status === 'completed' ? 0x9dd2a7 : 0x5f9572, 0.86);
    const label = this.add
      .text(18, 19, formatMatchLabel(match), {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);

    row.add([background, label]);
    this.addTeamCell(
      row,
      MATCH_CARD_HOME_TEAM_X,
      19,
      match.homeTeamId,
      MATCH_CARD_HOME_TEAM_WIDTH,
      26,
      19,
      '15px',
      match.homeTeamId !== undefined && getTournamentTeamControllerType(tournament, match.homeTeamId) === 'AI'
    );
    row.add(
      this.add
        .text(MATCH_CARD_SCORE_X, 19, formatMatchScore(match), {
          align: 'center',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );
    this.addTeamCell(
      row,
      MATCH_CARD_AWAY_TEAM_X,
      19,
      match.awayTeamId,
      MATCH_CARD_AWAY_TEAM_WIDTH,
      26,
      19,
      '15px',
      match.awayTeamId !== undefined && getTournamentTeamControllerType(tournament, match.awayTeamId) === 'AI'
    );

    if (match.status !== 'available') {
      row.add(
        this.add
          .text(626, 19, formatMatchStatus(match), {
            align: 'right',
            color: match.status === 'completed' ? '#9dd2a7' : '#8fb39d',
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            fontStyle: '700'
          })
          .setOrigin(1, 0.5)
      );
    }

    if (match.status === 'available' && match.homeTeamId !== undefined && match.awayTeamId !== undefined) {
      row.add(
        new Button(this, 548, 19, 'Sim', () => this.simulateTournamentMatch(tournament, match), {
          fontSize: '14px',
          height: 30,
          width: 58
        })
      );
      row.add(
        new Button(this, 614, 19, 'Play', () => this.startTournamentMatch(tournament, match), {
          fontSize: '14px',
          height: 30,
          width: 70
        })
      );
    }
  }

  private createTablesTab(tournament: TournamentState, layout: TournamentHubLayout): void {
    if (layout.groupStage.viewportHeight !== null) {
      this.createMobileGroupStage(tournament, layout);
      return;
    }

    const columns = tournament.groups.length <= 4 ? tournament.groups.length : 4;

    tournament.groups.forEach((group, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = 74 + column * 368;
      const y = 168 + row * 218;

      this.createGroupTable(tournament, group, x, y);
    });
  }

  private createMobileGroupStage(tournament: TournamentState, layout: TournamentHubLayout): void {
    const groupLayout = layout.groupStage;
    const viewportHeight = groupLayout.viewportHeight ?? 0;
    const content = this.add.container(groupLayout.x, groupLayout.y);
    const maxScroll = getTournamentHubGroupStageMaxScroll(tournament.groups.length, layout);
    const setScroll = (value: number): void => {
      this.groupStageScrollY = clampScroll(value, maxScroll);
      content.y = groupLayout.y - this.groupStageScrollY;
    };
    const dragScroll = createDragScrollArea({
      scene: this,
      viewport: {
        x: groupLayout.x,
        y: groupLayout.y,
        width: groupLayout.cardWidth * groupLayout.columns + groupLayout.columnGap,
        height: viewportHeight
      },
      maxScroll,
      getScroll: () => this.groupStageScrollY,
      setScroll
    });

    tournament.groups.forEach((group, index) => {
      const column = index % groupLayout.columns;
      const row = Math.floor(index / groupLayout.columns);
      const x = column * (groupLayout.cardWidth + groupLayout.columnGap);
      const y = row * (groupLayout.cardHeight + groupLayout.rowGap);

      content.add(this.createMobileGroupTable(tournament, group, x, y, layout));
    });

    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(
        groupLayout.x,
        groupLayout.y,
        groupLayout.cardWidth * groupLayout.columns + groupLayout.columnGap,
        viewportHeight
      )
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZone = this.add
      .zone(
        groupLayout.x + (groupLayout.cardWidth * groupLayout.columns + groupLayout.columnGap) / 2,
        groupLayout.y + viewportHeight / 2,
        groupLayout.cardWidth * groupLayout.columns + groupLayout.columnGap,
        viewportHeight
      )
      .setInteractive({ useHandCursor: maxScroll > 0 })
      .setDepth(-10);

    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(this.groupStageScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    dragScroll.bindDragTarget(scrollZone);
    this.groupStageScrollY = clampScroll(this.groupStageScrollY, maxScroll);
    setScroll(this.groupStageScrollY);

    if (maxScroll > 0) {
      this.createScrollbar(
        this.add.container(0, 0),
        groupLayout.x + groupLayout.cardWidth * groupLayout.columns + groupLayout.columnGap + 10,
        groupLayout.y,
        viewportHeight,
        maxScroll,
        () => this.groupStageScrollY
      );
    }
  }

  private createMobileGroupTable(
    tournament: TournamentState,
    group: TournamentGroup,
    x: number,
    y: number,
    layout: TournamentHubLayout
  ): Phaser.GameObjects.Container {
    const groupLayout = layout.groupStage;
    const panel = this.add.container(x, y);
    const background = this.add.graphics();

    background
      .fillStyle(TEAM_CARD_STYLE.panel.backgroundColor, TEAM_CARD_STYLE.panel.backgroundAlpha)
      .fillRoundedRect(0, 0, groupLayout.cardWidth, groupLayout.cardHeight, groupLayout.cornerRadius)
      .lineStyle(TEAM_CARD_STYLE.panel.borderWidth, TEAM_CARD_STYLE.panel.borderColor, TEAM_CARD_STYLE.panel.borderAlpha)
      .strokeRoundedRect(0, 0, groupLayout.cardWidth, groupLayout.cardHeight, groupLayout.cornerRadius);
    panel.add(background);
    panel.add(
      this.add
        .text(18, 34, `Group ${group.id}`, {
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: groupLayout.titleFontSize,
          fontStyle: '700'
        })
        .setOrigin(0, 0.5)
    );
    this.createMobileGroupTableHeader(panel, layout);

    const standings = getTournamentGroupStandings(group, tournament.matches, tournament.drawOrder);

    standings.forEach((standing, index) => {
      const rowY = groupLayout.rowStartY + index * groupLayout.rowHeight;
      const team = findTeam(standing.teamId);

      if (team !== undefined) {
        const flag = this.add.image(groupLayout.flagX, rowY, getFlagAssetKey(team.flagCode));
        flag.setDisplaySize(groupLayout.flagWidth, groupLayout.flagHeight);
        panel.add(flag);
      }

      panel.add(
        this.add
          .text(groupLayout.teamCodeX, rowY, team === undefined ? standing.teamId : getTeamScoreboardCode(team.flagCode), {
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontSize: groupLayout.teamFontSize,
            fontStyle: '700'
          })
          .setOrigin(0, 0.5)
      );
      panel.add(this.createMobileGroupTableValue(groupLayout.playedX, rowY, standing.played, layout));
      panel.add(this.createMobileGroupTableValue(groupLayout.winsX, rowY, standing.wins, layout));
      panel.add(this.createMobileGroupTableValue(groupLayout.drawsX, rowY, standing.draws, layout));
      panel.add(this.createMobileGroupTableValue(groupLayout.lossesX, rowY, standing.losses, layout));
      panel.add(this.createMobileGroupTableValue(groupLayout.goalsForX, rowY, standing.goalsFor, layout));
      panel.add(this.createMobileGroupTableValue(groupLayout.goalsAgainstX, rowY, standing.goalsAgainst, layout));
      panel.add(this.createMobileGroupTableValue(groupLayout.pointsX, rowY, standing.points, layout));
      this.addMobileGroupFormIndicators(panel, tournament, group, standing.teamId, groupLayout.formX, rowY, layout);

      if (index < standings.length - 1) {
        this.addMobileGroupRowSeparator(panel, rowY + groupLayout.rowHeight / 2, layout);
      }
    });

    return panel;
  }

  private addMobileGroupRowSeparator(
    panel: Phaser.GameObjects.Container,
    y: number,
    layout: TournamentHubLayout
  ): void {
    const groupLayout = layout.groupStage;
    const separator = this.add.graphics();

    separator
      .lineStyle(1, GROUP_ROW_SEPARATOR_COLOR, 0.24)
      .lineBetween(groupLayout.cardPadding, y, groupLayout.cardWidth - groupLayout.cardPadding, y);
    panel.add(separator);
  }

  private createMobileGroupTableHeader(
    panel: Phaser.GameObjects.Container,
    layout: TournamentHubLayout
  ): void {
    const groupLayout = layout.groupStage;

    panel.add(
      this.add
        .text(groupLayout.teamHeaderX, groupLayout.headerY, 'Team', {
          color: '#9fc5ad',
          fontFamily: 'Arial, sans-serif',
          fontSize: groupLayout.headerFontSize,
          fontStyle: '700'
        })
        .setOrigin(0, 0.5)
    );

    const headers: Array<[number, string, string]> = [
      [groupLayout.playedX, 'P', 'Played'],
      [groupLayout.winsX, 'W', 'Wins'],
      [groupLayout.drawsX, 'D', 'Draws'],
      [groupLayout.lossesX, 'L', 'Losses'],
      [groupLayout.goalsForX, 'GF', 'Goals for'],
      [groupLayout.goalsAgainstX, 'GA', 'Goals against'],
      [groupLayout.pointsX, 'Pts', 'Points'],
      [groupLayout.formX + groupLayout.formIndicatorGap, 'Form', 'Recent form']
    ];

    headers.forEach(([x, label, tooltip]) => {
      const header = this.add
        .text(x, groupLayout.headerY, label, {
          align: 'center',
          color: '#9fc5ad',
          fontFamily: 'Arial, sans-serif',
          fontSize: groupLayout.headerFontSize,
          fontStyle: '700'
        })
        .setOrigin(0.5);

      this.addStatsHeaderTooltip(header, tooltip);
      panel.add(header);
    });
  }

  private createMobileGroupTableValue(
    x: number,
    y: number,
    value: number | string,
    layout: TournamentHubLayout
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, String(value), {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.groupStage.valueFontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private addMobileGroupFormIndicators(
    panel: Phaser.GameObjects.Container,
    tournament: TournamentState,
    group: TournamentGroup,
    teamId: TournamentTeamId,
    x: number,
    y: number,
    layout: TournamentHubLayout
  ): void {
    const form = getTeamGroupForm(tournament, group, teamId);
    const radius = layout.groupStage.formIndicatorRadius;
    const gap = layout.groupStage.formIndicatorGap;

    form.forEach((entry, index) => {
      const indicator = this.add.circle(x + index * gap, y, radius, entry.color, entry.fillAlpha);

      indicator.setStrokeStyle(2, entry.strokeColor, entry.strokeAlpha);
      indicator.setInteractive({ useHandCursor: true });
      indicator.on('pointerover', () => this.showStatsTooltip(indicator, entry.tooltip));
      indicator.on('pointerout', () => this.hideStatsTooltip());
      indicator.on('pointerdown', () => this.showStatsTooltip(indicator, entry.tooltip));
      panel.add(indicator);
    });
  }

  private createGroupTable(tournament: TournamentState, group: TournamentGroup, x: number, y: number): void {
    const panel = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, 340, 190, 0x0b2118, 0.86);
    background.setOrigin(0);
    background.setStrokeStyle(2, 0x5f9572, 0.92);
    const title = this.add
      .text(16, 18, `Group ${group.id}`, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);

    panel.add([background, title]);
    this.createGroupTableHeader(panel, 44);

    const standings = getTournamentGroupStandings(group, tournament.matches, tournament.drawOrder);

    standings.forEach((standing, index) => {
      const team = findTeam(standing.teamId);
      const rowY = 72 + index * 27;

      if (team !== undefined) {
        const flag = this.add.image(28, rowY, getFlagAssetKey(team.flagCode));
        flag.setDisplaySize(24, 18);
        panel.add(flag);
      }

      panel.add(
        this.add
          .text(48, rowY, team?.name ?? standing.teamId, {
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontStyle: '700',
            wordWrap: { width: 100 }
          })
          .setOrigin(0, 0.5)
      );
      panel.add(this.createTableValue(GROUP_TABLE_COLUMNS.played, rowY, standing.played));
      panel.add(this.createTableValue(GROUP_TABLE_COLUMNS.points, rowY, standing.points));
      panel.add(this.createTableValue(GROUP_TABLE_COLUMNS.goalDifference, rowY, standing.goalDifference));
      panel.add(this.createTableValue(GROUP_TABLE_COLUMNS.goals, rowY, `${standing.goalsFor}:${standing.goalsAgainst}`));
    });
  }

  private createGroupTableHeader(panel: Phaser.GameObjects.Container, y: number): void {
    panel.add(
      this.add
        .text(16, y, 'Team', {
          color: '#9fc5ad',
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: '700'
        })
        .setOrigin(0, 0.5)
    );

    const headers: Array<[keyof typeof GROUP_TABLE_COLUMNS, string]> = [
      ['played', 'P'],
      ['points', 'Pts'],
      ['goalDifference', 'GD'],
      ['goals', 'G']
    ];

    headers.forEach(([column, label]) => {
      const header = this.add
        .text(GROUP_TABLE_COLUMNS[column], y, label, {
          align: 'center',
          color: '#9fc5ad',
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: '700'
        })
        .setOrigin(0.5);

      this.addStatsHeaderTooltip(header, getGroupTableHeaderTooltip(column));
      panel.add(header);
    });
  }

  private createTableValue(x: number, y: number, value: number | string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, String(value), {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createStatsTab(tournament: TournamentState, layout: TournamentHubLayout): void {
    const stats = getTournamentTeamStats(tournament);
    const playerStats = getTournamentPlayerStats(tournament);
    const sortedStats = sortTeamStatsForStatsTab(stats, this.statsSort);

    this.createTeamStatsTable(sortedStats.slice(0, 12), layout);

    const rankingCards: StatsRankingCardDefinition[] = [
      { title: 'Top scorers', entries: createPlayerRankingEntries(playerStats, 'goals') },
      { title: 'Top assists', entries: createPlayerRankingEntries(playerStats, 'assists') },
      { title: 'GK saves', entries: createPlayerRankingEntries(playerStats, 'goalkeeperSaves') }
    ];

    this.createStatsRankingList(rankingCards, layout);
  }

  private createTeamStatsTable(stats: readonly TournamentTeamStats[], layout: TournamentHubLayout): void {
    const statsLayout = layout.stats;
    const x = statsLayout.tableX;
    const y = statsLayout.y;
    const width = statsLayout.tableWidth;
    const panel = this.add.container(x, y);
    const background = this.add.graphics();

    background
      .fillStyle(TEAM_CARD_STYLE.panel.backgroundColor, TEAM_CARD_STYLE.panel.backgroundAlpha)
      .fillRoundedRect(0, 0, width, statsLayout.tableHeight, 8)
      .lineStyle(TEAM_CARD_STYLE.panel.borderWidth, TEAM_CARD_STYLE.panel.borderColor, TEAM_CARD_STYLE.panel.borderAlpha)
      .strokeRoundedRect(0, 0, width, statsLayout.tableHeight, 8);

    panel.add(background);
    this.createStatsTableHeader(panel, 24, layout);

    const rows = this.add.container(0, STATS_TABLE_VIEWPORT_Y);

    stats.forEach((teamStats, index) => {
      const rowY = index * STATS_TABLE_ROW_GAP + 12;
      const team = findTeam(teamStats.teamId);

      if (team !== undefined) {
        const flag = this.add.image(statsLayout.tableFlagX, rowY, getFlagAssetKey(team.flagCode));
        flag.setDisplaySize(24, 18);
        rows.add(flag);
      }

      rows.add(
        this.add
          .text(statsLayout.tableTeamCodeX, rowY, team === undefined ? teamStats.teamId : getTeamScoreboardCode(team.flagCode), {
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontSize: statsLayout.tableTeamFontSize,
            fontStyle: '700',
            wordWrap: { width: 116 }
          })
          .setOrigin(0, 0.5)
      );
      rows.add(this.createStatsTableValue(statsLayout.tableColumns.played, rowY, teamStats.played, statsLayout.tableValueFontSize));
      rows.add(this.createStatsTableValue(statsLayout.tableColumns.wins, rowY, teamStats.wins, statsLayout.tableValueFontSize));
      rows.add(this.createStatsTableValue(statsLayout.tableColumns.draws, rowY, teamStats.draws, statsLayout.tableValueFontSize));
      rows.add(this.createStatsTableValue(statsLayout.tableColumns.losses, rowY, teamStats.losses, statsLayout.tableValueFontSize));
      rows.add(this.createStatsTableValue(statsLayout.tableColumns.goalsFor, rowY, teamStats.goalsFor, statsLayout.tableValueFontSize));
      rows.add(this.createStatsTableValue(statsLayout.tableColumns.goalsAgainst, rowY, teamStats.goalsAgainst, statsLayout.tableValueFontSize));
      rows.add(this.createStatsTableValue(statsLayout.tableColumns.goalDifference, rowY, teamStats.goalDifference, statsLayout.tableValueFontSize));
      rows.add(this.createStatsTableValue(statsLayout.tableColumns.shots, rowY, teamStats.shots, statsLayout.tableValueFontSize));
      rows.add(this.createStatsTableValue(statsLayout.tableColumns.goalkeeperSaves, rowY, teamStats.goalkeeperSaves, statsLayout.tableValueFontSize));

      if (index < stats.length - 1) {
        this.addStatsRowSeparator(rows, rowY + STATS_TABLE_ROW_GAP / 2, width);
      }
    });

    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(x, y + STATS_TABLE_VIEWPORT_Y, width, STATS_TABLE_VIEWPORT_HEIGHT)
      .createGeometryMask();
    maskGraphics.setVisible(false);
    rows.setMask(mask);
    panel.add(rows);

    const contentHeight = stats.length * STATS_TABLE_ROW_GAP + 24;
    const maxScroll = Math.max(0, contentHeight - STATS_TABLE_VIEWPORT_HEIGHT);
    const scrollZone = this.add
      .zone(
        width / 2,
        STATS_TABLE_VIEWPORT_Y + STATS_TABLE_VIEWPORT_HEIGHT / 2,
        width,
        STATS_TABLE_VIEWPORT_HEIGHT
      )
      .setInteractive();
    panel.add(scrollZone);

    this.statsTeamScrollY = Phaser.Math.Clamp(this.statsTeamScrollY, 0, maxScroll);
    const setScroll = (value: number): void => {
      this.statsTeamScrollY = clampScroll(value, maxScroll);
      rows.y = STATS_TABLE_VIEWPORT_Y - this.statsTeamScrollY;
    };
    const dragScroll = createDragScrollArea({
      scene: this,
      viewport: {
        x,
        y: y + STATS_TABLE_VIEWPORT_Y,
        width,
        height: STATS_TABLE_VIEWPORT_HEIGHT
      },
      maxScroll,
      getScroll: () => this.statsTeamScrollY,
      setScroll
    });

    setScroll(this.statsTeamScrollY);
    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(this.statsTeamScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    dragScroll.bindDragTarget(scrollZone);

    if (maxScroll > 0) {
      this.createScrollbar(panel, width + 12, STATS_TABLE_VIEWPORT_Y, STATS_TABLE_VIEWPORT_HEIGHT, maxScroll, () =>
        this.statsTeamScrollY
      );
    }
  }

  private addStatsRowSeparator(
    container: Phaser.GameObjects.Container,
    y: number,
    width: number
  ): void {
    const separator = this.add.graphics();

    separator
      .lineStyle(1, GROUP_ROW_SEPARATOR_COLOR, 0.24)
      .lineBetween(18, y, width - 18, y);
    container.add(separator);
  }

  private createStatsTableHeader(panel: Phaser.GameObjects.Container, y: number, layout: TournamentHubLayout): void {
    const statsLayout = layout.stats;

    const teamHeader = this.add
      .text(statsLayout.tableTeamHeaderX, y, 'Team', {
        color: STATS_TABLE_HEADER_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: statsLayout.tableHeaderFontSize,
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);

    this.addSortableStatsHeader(panel, teamHeader, 'team', 'Team', statsLayout.tableTeamHeaderX + 44, y);

    const headers: Array<[keyof typeof STATS_TABLE_COLUMNS, string]> = [
      ['played', 'P'],
      ['wins', 'W'],
      ['draws', 'D'],
      ['losses', 'L'],
      ['goalsFor', 'GF'],
      ['goalsAgainst', 'GA'],
      ['goalDifference', 'GD'],
      ['shots', 'Sh'],
      ['goalkeeperSaves', 'Sv']
    ];

    headers.forEach(([column, label]) => {
      const header = this.add
        .text(statsLayout.tableColumns[column], y, label, {
          align: 'center',
          color: STATS_TABLE_HEADER_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: statsLayout.tableHeaderFontSize,
          fontStyle: '700'
        })
        .setOrigin(0.5);

      this.addSortableStatsHeader(panel, header, column, getStatsTableHeaderTooltip(column), statsLayout.tableColumns[column] + 15, y);
    });
  }

  private addSortableStatsHeader(
    panel: Phaser.GameObjects.Container,
    header: Phaser.GameObjects.Text,
    column: StatsSortColumn,
    tooltipText: string,
    indicatorX: number,
    y: number
  ): void {
    this.addStatsHeaderTooltip(header, tooltipText);
    header.on('pointerdown', () => this.changeStatsSort(column));
    panel.add(header);

    if (this.statsSort?.column !== column) {
      return;
    }

    panel.add(
      this.add
        .text(indicatorX, y, this.statsSort.direction === 'asc' ? '^' : 'v', {
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );
  }

  private changeStatsSort(column: StatsSortColumn): void {
    const nextDirection: StatsSortDirection =
      this.statsSort?.column === column && this.statsSort.direction === 'desc' ? 'asc' : 'desc';

    this.statsSort = {
      column,
      direction: this.statsSort?.column === column ? nextDirection : column === 'team' ? 'asc' : 'desc'
    };
    this.statsTeamScrollY = 0;
    this.render();
  }

  private addStatsHeaderTooltip(header: Phaser.GameObjects.Text, tooltipText: string): void {
    header.setInteractive({ useHandCursor: true });
    header.on('pointerover', () => this.showStatsTooltip(header, tooltipText));
    header.on('pointerout', () => this.hideStatsTooltip());
  }

  private showStatsTooltip(target: Phaser.GameObjects.Components.GetBounds, text: string): void {
    this.hideStatsTooltip();

    const bounds = target.getBounds();
    const label = this.add
      .text(STATS_TOOLTIP_PADDING_X, STATS_TOOLTIP_PADDING_Y, text, {
        color: '#1f2a2e',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700'
      })
      .setOrigin(0);
    const width = label.width + STATS_TOOLTIP_PADDING_X * 2;
    const height = label.height + STATS_TOOLTIP_PADDING_Y * 2;
    const x = Phaser.Math.Clamp(bounds.centerX - width / 2, 16, SCENE_WIDTH - width - 16);
    const y = Math.max(16, bounds.top - height - 10);
    const tooltip = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, width, height, 0xf0c95a, 1);

    background.setOrigin(0);
    background.setStrokeStyle(2, 0x2d382f, 0.95);
    tooltip.add([background, label]);
    tooltip.setDepth(STATS_TOOLTIP_DEPTH);
    tooltip.setName('stats-header-tooltip');
  }

  private hideStatsTooltip(): void {
    this.children.getByName('stats-header-tooltip')?.destroy();
  }

  private createStatsRankingList(
    rankingCards: readonly StatsRankingCardDefinition[],
    layout: TournamentHubLayout
  ): void {
    const statsLayout = layout.stats;
    const x = statsLayout.rankingX;
    const y = statsLayout.y;
    const availableWidth = statsLayout.rankingWidth;
    const content = this.add.container(x, y);
    const columnCount = Phaser.Math.Clamp(
      Math.floor((availableWidth + statsLayout.rankingColumnGap) / (statsLayout.rankingCardWidth + statsLayout.rankingColumnGap)),
      1,
      STATS_RANKING_MAX_COLUMNS
    );
    const rowCount = Math.ceil(rankingCards.length / columnCount);
    const contentHeight =
      rowCount * statsLayout.rankingRowGap -
      (statsLayout.rankingRowGap - STATS_RANKING_CARD_Y - statsLayout.rankingCardHeight);
    const contentWidth =
      statsLayout.rankingCardWidth * columnCount + statsLayout.rankingColumnGap * Math.max(0, columnCount - 1);
    const maxScroll = Math.max(0, contentHeight - STATS_RANKING_VIEWPORT_HEIGHT);

    rankingCards.forEach((ranking, index) => {
      const column = index % columnCount;
      const row = Math.floor(index / columnCount);
      const cardX = column * (statsLayout.rankingCardWidth + statsLayout.rankingColumnGap);
      const cardY = row * statsLayout.rankingRowGap;
      content.add(this.createStatsRankingCard(ranking.title, ranking.entries, cardX, cardY, layout));
    });

    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(x, y, contentWidth, STATS_RANKING_VIEWPORT_HEIGHT)
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZone = this.add
      .zone(x + contentWidth / 2, y + STATS_RANKING_VIEWPORT_HEIGHT / 2, contentWidth, STATS_RANKING_VIEWPORT_HEIGHT)
      .setInteractive();

    this.statsRankingScrollY = clampScroll(this.statsRankingScrollY, maxScroll);
    const setScroll = (value: number): void => {
      this.statsRankingScrollY = clampScroll(value, maxScroll);
      content.y = y - this.statsRankingScrollY;
    };
    const dragScroll = createDragScrollArea({
      scene: this,
      viewport: {
        x,
        y,
        width: contentWidth,
        height: STATS_RANKING_VIEWPORT_HEIGHT
      },
      maxScroll,
      getScroll: () => this.statsRankingScrollY,
      setScroll
    });

    setScroll(this.statsRankingScrollY);
    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(this.statsRankingScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    dragScroll.bindDragTarget(scrollZone);

    if (maxScroll > 0) {
      this.createScrollbar(
        this.add.container(x, y),
        contentWidth + 12,
        0,
        STATS_RANKING_VIEWPORT_HEIGHT,
        maxScroll,
        () => this.statsRankingScrollY
      );
    }
  }

  private createStatsRankingCard(
    title: string,
    entries: readonly StatsRankingEntry[],
    x: number,
    y: number,
    layout: TournamentHubLayout
  ): Phaser.GameObjects.Container {
    const statsLayout = layout.stats;
    const container = this.add.container(x, y);
    container.add(
      this.add
        .text(0, 0, title, {
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: statsLayout.rankingTitleFontSize,
          fontStyle: '700'
        })
        .setOrigin(0, 0)
    );

    const panel = this.add.container(0, STATS_RANKING_CARD_Y);
    const background = this.add.graphics();

    background
      .fillStyle(TEAM_CARD_STYLE.panel.backgroundColor, TEAM_CARD_STYLE.panel.backgroundAlpha)
      .fillRoundedRect(0, 0, statsLayout.rankingCardWidth, statsLayout.rankingCardHeight, 8)
      .lineStyle(TEAM_CARD_STYLE.panel.borderWidth, TEAM_CARD_STYLE.panel.borderColor, TEAM_CARD_STYLE.panel.borderAlpha)
      .strokeRoundedRect(0, 0, statsLayout.rankingCardWidth, statsLayout.rankingCardHeight, 8);

    panel.add(background);

    const visibleEntries = entries.slice(0, 3);

    visibleEntries.forEach((entry, index) => {
      const team = findTeam(entry.teamId);
      const rowY =
        statsLayout.rankingCardHeight / 2 +
        (index - (visibleEntries.length - 1) / 2) * statsLayout.rankingEntryRowGap;
      const flagX = 30;
      const entryTextX = flagX + statsLayout.rankingFlagWidth + 18;

      if (team !== undefined) {
        const flag = this.add.image(flagX, rowY, getFlagAssetKey(team.flagCode));
        flag.setDisplaySize(statsLayout.rankingFlagWidth, statsLayout.rankingFlagHeight);
        panel.add(flag);
      }

      panel.add(
        this.add
          .text(entryTextX, rowY, `${index + 1}. ${entry.label}`, {
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontSize: statsLayout.rankingEntryFontSize,
            fontStyle: '700',
            wordWrap: { width: statsLayout.rankingCardWidth - entryTextX - 62 }
          })
          .setOrigin(0, 0.5)
      );
      panel.add(this.createStatsTableValue(statsLayout.rankingCardWidth - 14, rowY, entry.value, statsLayout.rankingValueFontSize));

      if (index < visibleEntries.length - 1) {
        this.addStatsRankingRowSeparator(panel, rowY + statsLayout.rankingEntryRowGap / 2, statsLayout.rankingCardWidth);
      }
    });

    container.add(panel);
    return container;
  }

  private addStatsRankingRowSeparator(
    container: Phaser.GameObjects.Container,
    y: number,
    width: number
  ): void {
    const separator = this.add.graphics();

    separator
      .lineStyle(1, GROUP_ROW_SEPARATOR_COLOR, 0.24)
      .lineBetween(14, y, width - 14, y);
    container.add(separator);
  }

  private createStatsTableValue(
    x: number,
    y: number,
    value: number | string,
    fontSize = '14px'
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, String(value), {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createScrollbar(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    height: number,
    maxScroll: number,
    getScrollY: () => number
  ): void {
    const track = this.add.rectangle(x, y + height / 2, 4, height, 0x5f9572, 0.28);
    const thumbHeight = Math.max(28, (height / (height + maxScroll)) * height);
    const thumb = this.add.rectangle(x, y + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);
    const updateThumb = (): void => {
      thumb.y = y + thumbHeight / 2 + (getScrollY() / maxScroll) * (height - thumbHeight);
    };

    this.events.on(Phaser.Scenes.Events.UPDATE, updateThumb);
    container.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.events.off(Phaser.Scenes.Events.UPDATE, updateThumb);
    });
    container.add([track, thumb]);
  }

  private createBracketTab(tournament: TournamentState, layout: TournamentHubLayout): void {
    const format = getTournamentFormat(tournament.formatId);
    const playoffLayout = layout.playoff;

    if (format.id === 'cup-xl') {
      this.createCupXlBracketTab(tournament, layout);
      return;
    }

    const cardWidth = playoffLayout.cardWidth;
    const rounds = format.knockoutRounds.map((round) => ({
      stage: round.stage,
      matches: tournament.matches.filter((match) => match.stage === round.stage)
    }));
    const columnGap = getBracketColumnGap(rounds.length, cardWidth, playoffLayout.width, playoffLayout.maxColumnGap);
    const totalWidth = rounds.length * cardWidth + Math.max(0, rounds.length - 1) * columnGap;
    const startX = 0;
    const roundCenters = getBracketRoundCenters(
      rounds[0]?.matches.length ?? 0,
      rounds.length,
      playoffLayout.cardHeight,
      playoffLayout.rowGap
    );
    const contentHeight = getBracketContentHeight(roundCenters, playoffLayout.cardHeight);
    const contentWidth = Math.max(playoffLayout.width, totalWidth);
    const maxScrollX = Math.max(0, contentWidth - playoffLayout.width);
    const maxScrollY = Math.max(0, contentHeight - playoffLayout.viewportHeight);
    const content = this.add.container(playoffLayout.x, playoffLayout.y);
    const connectorGraphics = this.add.graphics();

    this.drawBracketConnectors(connectorGraphics, startX, columnGap, cardWidth, roundCenters, rounds);
    content.add(connectorGraphics);

    rounds.forEach((round, roundIndex) => {
      const x = startX + roundIndex * (cardWidth + columnGap);
      const centers = roundCenters[roundIndex] ?? [];
      const labelY = Math.min(...centers) - playoffLayout.cardHeight / 2 - 24;

      content.add(this.createBracketColumnLabel(STAGE_LABELS[round.stage], x, labelY, layout));
      round.matches.forEach((match, index) => {
        content.add(this.createBracketMatch(match, x, centers[index] - playoffLayout.cardHeight / 2, layout));
      });
    });

    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(playoffLayout.x, playoffLayout.y, playoffLayout.width, playoffLayout.viewportHeight)
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const setScroll = (x: number, y: number): void => {
      this.playoffScrollX = clampScroll(x, maxScrollX);
      this.playoffScrollY = clampScroll(y, maxScrollY);
      content.x = playoffLayout.x - this.playoffScrollX;
      content.y = playoffLayout.y - this.playoffScrollY;
    };
    const scrollZone = this.add
      .zone(
        playoffLayout.x + playoffLayout.width / 2,
        playoffLayout.y + playoffLayout.viewportHeight / 2,
        playoffLayout.width,
        playoffLayout.viewportHeight
      )
      .setInteractive({ useHandCursor: maxScrollX > 0 || maxScrollY > 0 })
      .setDepth(-10);

    this.bindTwoAxisPlayoffScroll(scrollZone, setScroll, maxScrollX, maxScrollY);
    this.playoffScrollX = clampScroll(this.playoffScrollX, maxScrollX);
    this.playoffScrollY = clampScroll(this.playoffScrollY, maxScrollY);
    setScroll(this.playoffScrollX, this.playoffScrollY);

    if (maxScrollY > 0) {
      this.createScrollbar(
        this.add.container(0, 0),
        playoffLayout.x + playoffLayout.width + 10,
        playoffLayout.y,
        playoffLayout.viewportHeight,
        maxScrollY,
        () => this.playoffScrollY
      );
    }
  }

  private createCupXlBracketTab(tournament: TournamentState, layout: TournamentHubLayout): void {
    const geometry = getTournamentHubCupXlPlayoffGeometry(layout);
    const playoffLayout = {
      ...layout.playoff,
      cardWidth: geometry.cardWidth,
      teamFontSize: layout.mobileLandscape ? layout.playoff.teamFontSize : '16px',
      scoreFontSize: layout.mobileLandscape ? layout.playoff.scoreFontSize : '17px'
    };
    const renderLayout: TournamentHubLayout = {
      ...layout,
      playoff: playoffLayout
    };
    const cardWidth = playoffLayout.cardWidth;
    const roundOf16Matches = tournament.matches
      .filter((match) => match.stage === 'round-of-16')
      .sort(compareBracketMatches);
    const quarterFinalMatches = tournament.matches
      .filter((match) => match.stage === 'quarter-final')
      .sort(compareBracketMatches);
    const semiFinalMatches = tournament.matches
      .filter((match) => match.stage === 'semi-final')
      .sort(compareBracketMatches);
    const finalMatch = tournament.matches.find((match) => match.stage === 'final');
    const branchCenters = getBracketRoundCenters(4, 3, playoffLayout.cardHeight, playoffLayout.rowGap);
    const finalCenterY = branchCenters[2]?.[0] ?? playoffLayout.cardHeight / 2 + 44;
    const contentHeight = getBracketContentHeight(branchCenters, playoffLayout.cardHeight);
    const leftColumnXs = geometry.leftColumnXs;
    const finalX = geometry.finalX;
    const rightSemiFinalX = geometry.rightColumnXs[2];
    const rightColumnXs = geometry.rightColumnXs;
    const contentWidth = Math.max(layout.playoff.width, geometry.contentWidth);
    const maxScrollX = Math.max(0, contentWidth - playoffLayout.width);
    const maxScrollY = Math.max(0, contentHeight - playoffLayout.viewportHeight);
    const content = this.add.container(playoffLayout.x, playoffLayout.y);
    const connectorGraphics = this.add.graphics();
    const leftRounds = [
      { stage: 'round-of-16' as const, matches: roundOf16Matches.slice(0, 4), x: leftColumnXs[0] },
      { stage: 'quarter-final' as const, matches: quarterFinalMatches.slice(0, 2), x: leftColumnXs[1] },
      { stage: 'semi-final' as const, matches: semiFinalMatches.slice(0, 1), x: leftColumnXs[2] }
    ];
    const rightRounds = [
      { stage: 'round-of-16' as const, matches: roundOf16Matches.slice(4, 8), x: rightColumnXs[0] },
      { stage: 'quarter-final' as const, matches: quarterFinalMatches.slice(2, 4), x: rightColumnXs[1] },
      { stage: 'semi-final' as const, matches: semiFinalMatches.slice(1, 2), x: rightColumnXs[2] }
    ];
    const labelY = (branchCenters[0]?.[0] ?? 0) - playoffLayout.cardHeight / 2 - 24;

    this.drawBracketConnectors(connectorGraphics, leftColumnXs[0], geometry.columnGap, cardWidth, branchCenters, leftRounds);
    this.drawMirroredBracketConnectors(connectorGraphics, rightColumnXs, cardWidth, branchCenters, rightRounds);
    this.drawCupXlFinalConnectors(
      connectorGraphics,
      leftColumnXs[2] + cardWidth,
      finalX,
      rightSemiFinalX,
      cardWidth,
      finalCenterY,
      semiFinalMatches[0],
      semiFinalMatches[1],
      finalMatch
    );
    content.add(connectorGraphics);

    [...leftRounds, ...rightRounds].forEach((round, roundIndex) => {
      const centers = branchCenters[roundIndex % 3] ?? [];

      content.add(this.createBracketColumnLabel(STAGE_LABELS[round.stage], round.x, labelY, renderLayout));
      round.matches.forEach((match, index) => {
        const center = centers[index];

        if (center !== undefined) {
          content.add(this.createBracketMatch(match, round.x, center - playoffLayout.cardHeight / 2, renderLayout));
        }
      });
    });

    if (finalMatch !== undefined) {
      content.add(this.createBracketColumnLabel(STAGE_LABELS.final, finalX, labelY, renderLayout));
      content.add(this.createBracketMatch(finalMatch, finalX, finalCenterY - playoffLayout.cardHeight / 2, renderLayout));
    }

    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(playoffLayout.x, playoffLayout.y, playoffLayout.width, playoffLayout.viewportHeight)
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const setScroll = (x: number, y: number): void => {
      this.playoffScrollX = clampScroll(x, maxScrollX);
      this.playoffScrollY = clampScroll(y, maxScrollY);
      content.x = playoffLayout.x - this.playoffScrollX;
      content.y = playoffLayout.y - this.playoffScrollY;
    };
    const scrollZone = this.add
      .zone(
        playoffLayout.x + playoffLayout.width / 2,
        playoffLayout.y + playoffLayout.viewportHeight / 2,
        playoffLayout.width,
        playoffLayout.viewportHeight
      )
      .setInteractive({ useHandCursor: maxScrollX > 0 || maxScrollY > 0 })
      .setDepth(-10);

    this.bindTwoAxisPlayoffScroll(scrollZone, setScroll, maxScrollX, maxScrollY);
    if (this.playoffScrollX === 0 && maxScrollX > 0) {
      this.playoffScrollX = clampScroll(finalX + cardWidth / 2 - playoffLayout.width / 2, maxScrollX);
    } else {
      this.playoffScrollX = clampScroll(this.playoffScrollX, maxScrollX);
    }
    this.playoffScrollY = clampScroll(this.playoffScrollY, maxScrollY);
    setScroll(this.playoffScrollX, this.playoffScrollY);

    if (maxScrollY > 0) {
      this.createScrollbar(
        this.add.container(0, 0),
        playoffLayout.x + playoffLayout.width + 10,
        playoffLayout.y,
        playoffLayout.viewportHeight,
        maxScrollY,
        () => this.playoffScrollY
      );
    }
  }

  private bindTwoAxisPlayoffScroll(
    target: Phaser.GameObjects.Zone,
    setScroll: (x: number, y: number) => void,
    maxScrollX: number,
    maxScrollY: number
  ): void {
    let activePointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startScrollX = 0;
    let startScrollY = 0;

    target.on('wheel', (_pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number) => {
      setScroll(
        this.playoffScrollX + deltaX * TOUCH_SCROLL_WHEEL_FACTOR,
        this.playoffScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR
      );
    });
    target.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      activePointerId = pointer.id;
      startX = pointer.worldX;
      startY = pointer.worldY;
      startScrollX = this.playoffScrollX;
      startScrollY = this.playoffScrollY;
    });
    target.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (activePointerId !== pointer.id || (maxScrollX <= 0 && maxScrollY <= 0)) {
        return;
      }

      setScroll(startScrollX - (pointer.worldX - startX), startScrollY - (pointer.worldY - startY));
    });
    const finish = (pointer: Phaser.Input.Pointer): void => {
      if (activePointerId === pointer.id) {
        activePointerId = null;
      }
    };

    target.on('pointerup', finish);
    target.on('pointerupoutside', finish);
  }

  private drawBracketConnectors(
    graphics: Phaser.GameObjects.Graphics,
    startX: number,
    columnGap: number,
    cardWidth: number,
    roundCenters: readonly (readonly number[])[],
    rounds: readonly PlayoffRenderRound[]
  ): void {
    graphics.lineStyle(3, TEAM_CARD_STYLE.panel.borderColor, PLAYOFF_CONNECTOR_NEUTRAL_ALPHA);

    for (let roundIndex = 1; roundIndex < roundCenters.length; roundIndex += 1) {
      const previousCenters = roundCenters[roundIndex - 1] ?? [];
      const centers = roundCenters[roundIndex] ?? [];
      const previousMatches = rounds[roundIndex - 1]?.matches ?? [];
      const targetMatches = rounds[roundIndex]?.matches ?? [];
      const previousX = startX + (roundIndex - 1) * (cardWidth + columnGap) + cardWidth;
      const currentX = startX + roundIndex * (cardWidth + columnGap);
      const jointX = previousX + (currentX - previousX) / 2;

      centers.forEach((centerY, index) => {
        const firstY = previousCenters[index * 2];
        const secondY = previousCenters[index * 2 + 1];

        if (firstY === undefined || secondY === undefined) {
          return;
        }

        graphics.lineBetween(previousX, firstY, jointX, firstY);
        graphics.lineBetween(previousX, secondY, jointX, secondY);
        graphics.lineBetween(jointX, firstY, jointX, secondY);
        graphics.lineBetween(jointX, centerY, currentX, centerY);
      });

      graphics.lineStyle(4, PLAYOFF_WINNER_CONNECTOR_COLOR, PLAYOFF_WINNER_CONNECTOR_ALPHA);
      centers.forEach((centerY, index) => {
        const firstY = previousCenters[index * 2];
        const secondY = previousCenters[index * 2 + 1];
        const targetMatch = targetMatches[index];

        if (firstY !== undefined) {
          this.drawBracketAdvancePath(graphics, previousMatches[index * 2], targetMatch, previousX, firstY, jointX, centerY, currentX);
        }

        if (secondY !== undefined) {
          this.drawBracketAdvancePath(graphics, previousMatches[index * 2 + 1], targetMatch, previousX, secondY, jointX, centerY, currentX);
        }
      });
      graphics.lineStyle(3, TEAM_CARD_STYLE.panel.borderColor, PLAYOFF_CONNECTOR_NEUTRAL_ALPHA);
    }
  }

  private drawBracketAdvancePath(
    graphics: Phaser.GameObjects.Graphics,
    sourceMatch: TournamentMatch | undefined,
    targetMatch: TournamentMatch | undefined,
    sourceX: number,
    sourceY: number,
    jointX: number,
    targetY: number,
    targetX: number
  ): void {
    if (!hasCompletedWinner(sourceMatch)) {
      return;
    }

    graphics.lineBetween(sourceX, sourceY, jointX, sourceY);

    if (!isWinnerSeededIntoMatch(sourceMatch, targetMatch)) {
      return;
    }

    graphics.lineBetween(jointX, sourceY, jointX, targetY);
    graphics.lineBetween(jointX, targetY, targetX, targetY);
  }

  private createBracketColumnLabel(
    text: string,
    x: number,
    y: number,
    layout: TournamentHubLayout
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.playoff.titleFontSize,
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
  }

  private drawMirroredBracketConnectors(
    graphics: Phaser.GameObjects.Graphics,
    roundXs: readonly number[],
    cardWidth: number,
    roundCenters: readonly (readonly number[])[],
    rounds: readonly PlayoffRenderRound[]
  ): void {
    graphics.lineStyle(3, TEAM_CARD_STYLE.panel.borderColor, PLAYOFF_CONNECTOR_NEUTRAL_ALPHA);

    for (let roundIndex = 1; roundIndex < roundCenters.length; roundIndex += 1) {
      const previousCenters = roundCenters[roundIndex - 1] ?? [];
      const centers = roundCenters[roundIndex] ?? [];
      const previousMatches = rounds[roundIndex - 1]?.matches ?? [];
      const targetMatches = rounds[roundIndex]?.matches ?? [];
      const previousX = roundXs[roundIndex - 1];
      const currentX = (roundXs[roundIndex] ?? 0) + cardWidth;

      if (previousX === undefined) {
        continue;
      }

      const jointX = currentX + (previousX - currentX) / 2;

      centers.forEach((centerY, index) => {
        const firstY = previousCenters[index * 2];
        const secondY = previousCenters[index * 2 + 1];

        if (firstY === undefined || secondY === undefined) {
          return;
        }

        graphics.lineBetween(previousX, firstY, jointX, firstY);
        graphics.lineBetween(previousX, secondY, jointX, secondY);
        graphics.lineBetween(jointX, firstY, jointX, secondY);
        graphics.lineBetween(jointX, centerY, currentX, centerY);
      });

      graphics.lineStyle(4, PLAYOFF_WINNER_CONNECTOR_COLOR, PLAYOFF_WINNER_CONNECTOR_ALPHA);
      centers.forEach((centerY, index) => {
        const firstY = previousCenters[index * 2];
        const secondY = previousCenters[index * 2 + 1];
        const targetMatch = targetMatches[index];

        if (firstY !== undefined) {
          this.drawMirroredBracketAdvancePath(graphics, previousMatches[index * 2], targetMatch, previousX, firstY, jointX, centerY, currentX);
        }

        if (secondY !== undefined) {
          this.drawMirroredBracketAdvancePath(graphics, previousMatches[index * 2 + 1], targetMatch, previousX, secondY, jointX, centerY, currentX);
        }
      });
      graphics.lineStyle(3, TEAM_CARD_STYLE.panel.borderColor, PLAYOFF_CONNECTOR_NEUTRAL_ALPHA);
    }
  }

  private drawMirroredBracketAdvancePath(
    graphics: Phaser.GameObjects.Graphics,
    sourceMatch: TournamentMatch | undefined,
    targetMatch: TournamentMatch | undefined,
    sourceX: number,
    sourceY: number,
    jointX: number,
    targetY: number,
    targetX: number
  ): void {
    if (!hasCompletedWinner(sourceMatch)) {
      return;
    }

    graphics.lineBetween(sourceX, sourceY, jointX, sourceY);

    if (!isWinnerSeededIntoMatch(sourceMatch, targetMatch)) {
      return;
    }

    graphics.lineBetween(jointX, sourceY, jointX, targetY);
    graphics.lineBetween(jointX, targetY, targetX, targetY);
  }

  private drawCupXlFinalConnectors(
    graphics: Phaser.GameObjects.Graphics,
    leftSemiFinalRightX: number,
    finalX: number,
    rightSemiFinalX: number,
    cardWidth: number,
    finalCenterY: number,
    leftSemiFinal: TournamentMatch | undefined,
    rightSemiFinal: TournamentMatch | undefined,
    finalMatch: TournamentMatch | undefined
  ): void {
    graphics.lineStyle(3, TEAM_CARD_STYLE.panel.borderColor, PLAYOFF_CONNECTOR_NEUTRAL_ALPHA);
    graphics.lineBetween(leftSemiFinalRightX, finalCenterY, finalX, finalCenterY);
    graphics.lineBetween(finalX + cardWidth, finalCenterY, rightSemiFinalX, finalCenterY);

    graphics.lineStyle(4, PLAYOFF_WINNER_CONNECTOR_COLOR, PLAYOFF_WINNER_CONNECTOR_ALPHA);

    if (isWinnerSeededIntoMatch(leftSemiFinal, finalMatch)) {
      graphics.lineBetween(leftSemiFinalRightX, finalCenterY, finalX, finalCenterY);
    }

    if (isWinnerSeededIntoMatch(rightSemiFinal, finalMatch)) {
      graphics.lineBetween(finalX + cardWidth, finalCenterY, rightSemiFinalX, finalCenterY);
    }
  }

  private createBracketMatch(match: TournamentMatch, x: number, y: number, layout: TournamentHubLayout): Phaser.GameObjects.Container {
    const width = layout.playoff.cardWidth;
    const height = layout.playoff.cardHeight;
    const panel = this.add.container(x, y);
    const background = this.add.graphics();

    background
      .fillStyle(TEAM_CARD_STYLE.panel.backgroundColor, TEAM_CARD_STYLE.panel.backgroundAlpha)
      .fillRoundedRect(0, 0, width, height, layout.playoff.cardRadius)
      .lineStyle(
        TEAM_CARD_STYLE.panel.borderWidth,
        match.status === 'locked' ? TEAM_CARD_STYLE.muted.borderColor : TEAM_CARD_STYLE.panel.borderColor,
        match.status === 'locked' ? TEAM_CARD_STYLE.muted.borderAlpha : TEAM_CARD_STYLE.panel.borderAlpha
      )
      .strokeRoundedRect(0, 0, width, height, layout.playoff.cardRadius);

    panel.add(background);
    this.addBracketTeamRow(
      panel,
      match.homeTeamId,
      getMatchTeamScore(match, 'home'),
      PLAYOFF_TEAM_ROW_X,
      height * 0.36,
      match.status === 'locked',
      layout
    );
    this.addBracketTeamRow(
      panel,
      match.awayTeamId,
      getMatchTeamScore(match, 'away'),
      PLAYOFF_TEAM_ROW_X,
      height * 0.68,
      match.status === 'locked',
      layout
    );

    return panel;
  }

  private addBracketTeamRow(
    panel: Phaser.GameObjects.Container,
    teamId: TournamentTeamId | undefined,
    score: string,
    x: number,
    y: number,
    muted: boolean,
    layout: TournamentHubLayout
  ): void {
    const team = teamId === undefined ? undefined : findTeam(teamId);
    const scoreX = layout.playoff.cardWidth - PLAYOFF_SCORE_RIGHT_PADDING;
    const flagX = x + PLAYOFF_FLAG_OFFSET_X;
    const teamLabelX = flagX + layout.playoff.flagWidth / 2 + PLAYOFF_FLAG_TEXT_GAP;

    if (team !== undefined) {
      const flag = this.add.image(flagX, y, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(layout.playoff.flagWidth, layout.playoff.flagHeight);
      panel.add(flag);
    } else {
      const placeholder = this.add.rectangle(flagX, y, layout.playoff.flagWidth, layout.playoff.flagHeight, 0xffffff, 0);
      placeholder.setStrokeStyle(1, TEAM_CARD_STYLE.panel.borderColor, PLAYOFF_TBD_FLAG_PLACEHOLDER_STROKE_ALPHA);
      panel.add(placeholder);
    }

    panel.add(
      this.add
        .text(teamLabelX, y, getBracketTeamLabel(teamId), {
          color: muted ? '#8fb39d' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.playoff.teamFontSize,
          fontStyle: '700',
          wordWrap: { width: scoreX - teamLabelX - 12 }
        })
        .setOrigin(0, 0.5)
    );
    panel.add(
      this.add
        .text(scoreX, y, score, {
          align: 'right',
          color: muted ? '#8fb39d' : '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.playoff.scoreFontSize,
          fontStyle: '700'
        })
        .setOrigin(1, 0.5)
    );
  }

  private addTeamCell(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    teamId: TournamentTeamId | undefined,
    width = 230,
    flagWidth = 30,
    flagHeight = 22,
    fontSize = '16px',
    isAi = false
  ): void {
    const team = teamId === undefined ? undefined : findTeam(teamId);

    if (team !== undefined) {
      const flag = this.add.image(x, y, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(flagWidth, flagHeight);
      container.add(flag);

      if (isAi) {
        container.add(this.createAiMarker(x, y + flagHeight / 2 + 4));
      }
    }

    container.add(
      this.add
        .text(x + 28, y, team?.name ?? 'TBD', {
          color: team === undefined ? '#8fb39d' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize,
          fontStyle: '700',
          wordWrap: { width }
        })
        .setOrigin(0, 0.5)
    );
  }

  private createAiMarker(x: number, y: number): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, 'AI', {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private startTournamentMatch(tournament: TournamentState, match: TournamentMatch): void {
    if (!this.canRunGuardedInputAction()) {
      return;
    }

    if (match.homeTeamId === undefined || match.awayTeamId === undefined) {
      return;
    }

    const homeTeam = findTeam(match.homeTeamId);
    const awayTeam = findTeam(match.awayTeamId);

    if (homeTeam === undefined || awayTeam === undefined) {
      return;
    }

    this.scene.start('GameScene', {
      player1Name: homeTeam.name,
      player2Name: awayTeam.name,
      player1FlagCode: homeTeam.flagCode,
      player2FlagCode: awayTeam.flagCode,
      player1ControllerType: getTournamentTeamControllerType(tournament, homeTeam.flagCode),
      player2ControllerType: getTournamentTeamControllerType(tournament, awayTeam.flagCode),
      launchContext: {
        mode: 'tournament',
        tournamentId: tournament.id,
        tournamentMatchId: match.id
      }
    });
  }

  private simulateTournamentMatch(tournament: TournamentState, match: TournamentMatch): void {
    if (!this.canRunGuardedInputAction()) {
      return;
    }

    if (match.homeTeamId === undefined || match.awayTeamId === undefined) {
      return;
    }

    const homeTeam = findTeam(match.homeTeamId);
    const awayTeam = findTeam(match.awayTeamId);

    if (homeTeam === undefined || awayTeam === undefined) {
      return;
    }

    this.scene.start('ResultScene', {
      state: createSimulatedTournamentGameState({
        match,
        homeTeam,
        awayTeam,
        tournamentSeed: tournament.seed,
        homeControllerType: getTournamentTeamControllerType(tournament, homeTeam.flagCode),
        awayControllerType: getTournamentTeamControllerType(tournament, awayTeam.flagCode)
      }),
      launchContext: {
        mode: 'tournament',
        tournamentId: tournament.id,
        tournamentMatchId: match.id
      }
    });
  }

  private getTournament(): TournamentState | null {
    const value = this.registry.get('currentTournament') as TournamentState | undefined;

    return value ?? null;
  }

  private runGuardedInputAction(action: () => void): void {
    if (!this.canRunGuardedInputAction()) {
      return;
    }

    action();
  }

  private canRunGuardedInputAction(): boolean {
    return this.time.now >= this.guardedInputAvailableAt;
  }
}

function formatMatchLabel(match: TournamentMatch): string {
  return match.groupId === undefined ? STAGE_LABELS[match.stage] : `Group ${match.groupId}`;
}

function formatMatchScore(match: TournamentMatch): string {
  if (match.result === undefined) {
    return '- : -';
  }

  return `${match.result.homeGoals} : ${match.result.awayGoals}`;
}

function formatMatchStatus(match: TournamentMatch): string {
  if (match.status === 'completed') {
    return 'Played';
  }

  if (match.status === 'available') {
    return 'Available';
  }

  return 'Locked';
}

function findTeam(teamId: TournamentTeamId): NationalTeam | undefined {
  return NATIONAL_TEAMS.find((team) => team.flagCode === teamId);
}

function getBracketTeamLabel(teamId: TournamentTeamId | undefined): string {
  const team = teamId === undefined ? undefined : findTeam(teamId);

  if (teamId === undefined) {
    return 'TBD';
  }

  return team === undefined ? teamId : getTeamScoreboardCode(team.flagCode);
}

function hasCompletedWinner(match: TournamentMatch | undefined): boolean {
  return match?.status === 'completed' && match.result?.winnerTeamId !== undefined;
}

function isWinnerSeededIntoMatch(
  sourceMatch: TournamentMatch | undefined,
  targetMatch: TournamentMatch | undefined
): boolean {
  const winnerTeamId = sourceMatch?.result?.winnerTeamId;

  if (sourceMatch?.status !== 'completed' || winnerTeamId === undefined || targetMatch === undefined) {
    return false;
  }

  return targetMatch.homeTeamId === winnerTeamId || targetMatch.awayTeamId === winnerTeamId;
}

function compareBracketMatches(first: TournamentMatch, second: TournamentMatch): number {
  return first.roundIndex - second.roundIndex || first.orderIndex - second.orderIndex || first.id.localeCompare(second.id);
}

function getMatchTeamScore(match: TournamentMatch, team: 'home' | 'away'): string {
  if (match.result === undefined) {
    return '-';
  }

  const mainGoals = team === 'home' ? match.result.homeGoals : match.result.awayGoals;

  if (match.result.penaltyShootout === undefined) {
    return String(mainGoals);
  }

  const penaltyGoals = team === 'home' ? match.result.penaltyShootout.homeGoals : match.result.penaltyShootout.awayGoals;

  return `${mainGoals} (${penaltyGoals})`;
}

function getTeamGroupForm(
  tournament: TournamentState,
  group: TournamentGroup,
  teamId: TournamentTeamId
): GroupFormEntry[] {
  return tournament.matches
    .filter((match) => {
      const homeTeamId = match.result?.homeTeamId ?? match.homeTeamId;
      const awayTeamId = match.result?.awayTeamId ?? match.awayTeamId;

      return (
        match.groupId === group.id &&
        homeTeamId !== undefined &&
        awayTeamId !== undefined &&
        (homeTeamId === teamId || awayTeamId === teamId)
      );
    })
    .sort((first, second) => first.roundIndex - second.roundIndex || first.orderIndex - second.orderIndex)
    .map((match) => {
      const homeTeamId = match.result?.homeTeamId ?? match.homeTeamId;
      const awayTeamId = match.result?.awayTeamId ?? match.awayTeamId;
      const result = match.result;

      if (homeTeamId === undefined || awayTeamId === undefined) {
        return null;
      }

      if (result === undefined) {
        const isHome = homeTeamId === teamId;
        const opponentId = isHome ? awayTeamId : homeTeamId;
        const opponent = findTeam(opponentId);

        return {
          color: GROUP_FORM_INACTIVE_COLOR,
          fillAlpha: 0,
          strokeAlpha: 0.72,
          strokeColor: GROUP_FORM_INACTIVE_STROKE_COLOR,
          tooltip: `vs ${opponent === undefined ? opponentId : getTeamScoreboardCode(opponent.flagCode)}`
        };
      }

      const isHome = result.homeTeamId === teamId;
      const goalsFor = isHome ? result.homeGoals : result.awayGoals;
      const goalsAgainst = isHome ? result.awayGoals : result.homeGoals;
      const opponentId = isHome ? result.awayTeamId : result.homeTeamId;
      const opponent = findTeam(opponentId);
      const color = goalsFor > goalsAgainst ? 0x71e48b : goalsFor === goalsAgainst ? 0x9fc5ad : 0xff788a;

      return {
        color,
        fillAlpha: 0.95,
        strokeAlpha: 0.8,
        strokeColor: GROUP_FORM_PLAYED_STROKE_COLOR,
        tooltip: `vs ${opponent === undefined ? opponentId : opponent.name}\n${goalsFor}:${goalsAgainst}`
      };
    })
    .filter((entry): entry is GroupFormEntry => entry !== null);
}

function createPlayerRankingEntries(
  stats: readonly TournamentPlayerStats[],
  key: TournamentPlayerStatsRankingKey
): StatsRankingEntry[] {
  return getTournamentPlayerStatsRanking(stats, key, 3).map((playerStats) => ({
    teamId: playerStats.teamId,
    label: `${playerStats.playerName} #${playerStats.shirtNumber}`,
    value: playerStats[key]
  }));
}

function sortTeamStatsForStatsTab(
  stats: readonly TournamentTeamStats[],
  sort: StatsSortState | null
): TournamentTeamStats[] {
  const sortedStats = [...stats];

  if (sort === null) {
    return sortedStats;
  }

  const directionMultiplier = sort.direction === 'asc' ? 1 : -1;

  return sortedStats.sort((first, second) => {
    if (sort.column === 'team') {
      return directionMultiplier * getStatsTeamCode(first.teamId).localeCompare(getStatsTeamCode(second.teamId));
    }

    const firstValue = first[sort.column];
    const secondValue = second[sort.column];
    const numericDifference = firstValue - secondValue;

    if (numericDifference !== 0) {
      return directionMultiplier * numericDifference;
    }

    return getStatsTeamCode(first.teamId).localeCompare(getStatsTeamCode(second.teamId));
  });
}

function getStatsTeamCode(teamId: TournamentTeamId): string {
  const team = findTeam(teamId);

  return team === undefined ? teamId : getTeamScoreboardCode(team.flagCode);
}

function getStatsTableHeaderTooltip(column: keyof typeof STATS_TABLE_COLUMNS): string {
  const tooltips: Record<keyof typeof STATS_TABLE_COLUMNS, string> = {
    played: 'Played',
    wins: 'Wins',
    draws: 'Draws',
    losses: 'Losses',
    goalsFor: 'Goals for',
    goalsAgainst: 'Goals against',
    goalDifference: 'Goal difference',
    shots: 'Shots',
    goalkeeperSaves: 'Goalkeeper saves'
  };

  return tooltips[column];
}

function getGroupTableHeaderTooltip(column: keyof typeof GROUP_TABLE_COLUMNS): string {
  const tooltips: Record<keyof typeof GROUP_TABLE_COLUMNS, string> = {
    played: 'Played',
    points: 'Points',
    goalDifference: 'Goal difference',
    goals: 'Goals for:against'
  };

  return tooltips[column];
}

function getBracketColumnGap(
  columnCount: number,
  cardWidth: number,
  availableWidth: number,
  maxColumnGap: number
): number {
  if (columnCount <= 1) {
    return 0;
  }

  const usableGapWidth = availableWidth - columnCount * cardWidth;

  return Math.max(0, Math.min(maxColumnGap, usableGapWidth / (columnCount - 1)));
}

function getBracketContentHeight(roundCenters: readonly (readonly number[])[], cardHeight: number): number {
  const centers = roundCenters.flat();

  if (centers.length === 0) {
    return cardHeight;
  }

  return Math.max(...centers) + cardHeight / 2 + 12;
}

function getBracketRoundCenters(
  firstRoundMatchCount: number,
  roundCount: number,
  cardHeight: number,
  rowGap: number
): number[][] {
  if (firstRoundMatchCount <= 0 || roundCount <= 0) {
    return [];
  }

  const firstRoundCenters = getFirstRoundCenters(firstRoundMatchCount, cardHeight, rowGap);
  const rounds: number[][] = [firstRoundCenters];

  for (let roundIndex = 1; roundIndex < roundCount; roundIndex += 1) {
    const previousCenters = rounds[roundIndex - 1] ?? [];
    const centers: number[] = [];

    for (let index = 0; index < previousCenters.length; index += 2) {
      const firstY = previousCenters[index];
      const secondY = previousCenters[index + 1];

      if (firstY !== undefined && secondY !== undefined) {
        centers.push((firstY + secondY) / 2);
      }
    }

    rounds.push(centers);
  }

  return rounds;
}

function getFirstRoundCenters(matchCount: number, cardHeight: number, rowGap: number): number[] {
  const firstY = cardHeight / 2 + 44;

  return Array.from({ length: matchCount }, (_value, index) => firstY + index * rowGap);
}

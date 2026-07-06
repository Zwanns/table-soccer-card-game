import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH, TOURNAMENT_ASSETS } from '../config';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import {
  deleteStoredTournament,
  getTournamentPlayerStats,
  getTournamentPlayerStatsRanking,
  type TournamentMatch,
  type TournamentPlayerStats,
  type TournamentState,
  type TournamentTeamId
} from '../tournament';
import { Button, type ButtonCornerRadius } from '../ui/Button';
import { isMobileLandscapeLayout } from '../ui/mobileLayout';
import {
  RESULT_ACTION_BUTTON_FONT_SIZE,
  RESULT_ACTION_BUTTON_HEIGHT,
  RESULT_ACTION_BUTTON_RADIUS
} from '../ui/resultActionButtons';
import {
  CONFETTI_EFFECT_MODE,
  CONFETTI_REPEAT_INTERVAL_MS,
  FULL_SCENE_CONFETTI_VIEWPORT,
  createConfettiEffect,
  type ConfettiEffectHandle
} from '../ui/confettiEffect';
import {
  SCOREBOARD_BACKGROUND_ALPHA,
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_BORDER_ALPHA,
  SCOREBOARD_BORDER_COLOR,
  SCOREBOARD_TEXT_COLOR
} from '../ui/scoreboardStyle';
import { createTournamentBackground } from '../ui/tournamentBackground';

const COMPLETE_ACTION_BUTTON_Y = 644;
const COMPLETE_PANEL_BOTTOM_Y = COMPLETE_ACTION_BUTTON_Y - RESULT_ACTION_BUTTON_HEIGHT / 2;
const COMPLETE_PANEL_RADIUS = 8;
const COMPLETE_ROW_RADIUS = 6;
const COMPLETE_SCROLLBAR_WIDTH = 6;
const COMPLETE_SCROLLBAR_MIN_THUMB_HEIGHT = 34;
const COMPLETE_CONFETTI_DEPTH = 1;
const COMPLETE_CONTENT_DEPTH = 2;
export const TOURNAMENT_COMPLETE_CONFETTI_COLORS = ['#F7D56A', '#F0B93A', '#FFF2A6', '#D69A24', '#FFFFFF'] as const;

type LeaderCardDefinition = {
  title: string;
  statLabel: string;
  player: TournamentPlayerStats | undefined;
};

interface TournamentCompleteSceneData {
  devMockTournament?: TournamentState;
  devMockReturnScene?: string;
}

interface TournamentCompleteLayout {
  mobileLandscape: boolean;
  header: {
    titleY: number;
    titleFontSize: string;
    championY: number;
    championFontSize: string;
    flagWidth: number;
    flagHeight: number;
  };
  panel: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  path: {
    titleX: number;
    titleY: number;
    viewportX: number;
    viewportY: number;
    viewportWidth: number;
    viewportHeight: number;
    rowHeight: number;
    rowGap: number;
    stageX: number;
    homeX: number;
    scoreX: number;
    awayX: number;
    teamWidth: number;
    headingFontSize: string;
    rowFontSize: string;
    scoreFontSize: string;
    teamFlagWidth: number;
    teamFlagHeight: number;
  };
  leaders: {
    titleX: number;
    titleY: number;
    cardX: number;
    startY: number;
    gapY: number;
    width: number;
    height: number;
    headingFontSize: string;
    titleFontSize: string;
    playerFontSize: string;
    valueFontSize: string;
    flagWidth: number;
    flagHeight: number;
  };
  actions: {
    y: number;
    width: number;
    height: number;
    fontSize: string;
  };
}

export class TournamentCompleteScene extends Phaser.Scene {
  private devMockTournament: TournamentState | null = null;
  private devMockReturnScene: string | null = null;
  private confettiEffect: ConfettiEffectHandle | null = null;

  public constructor() {
    super('TournamentCompleteScene');
  }

  public init(data: TournamentCompleteSceneData = {}): void {
    this.devMockTournament = data.devMockTournament ?? null;
    this.devMockReturnScene = data.devMockReturnScene ?? null;
  }

  public create(): void {
    const tournament = this.devMockTournament ?? (this.registry.get('currentTournament') as TournamentState | undefined);

    createTournamentBackground(this, TOURNAMENT_ASSETS.winnerBackground);

    if (tournament === undefined || tournament.stage !== 'complete') {
      this.renderMissingTournament();
      return;
    }

    const finalMatch = getFinalMatch(tournament);
    const championTeamId = finalMatch?.result?.winnerTeamId;

    if (finalMatch === undefined || championTeamId === undefined) {
      this.renderMissingTournament();
      return;
    }

    const layout = createTournamentCompleteLayout();

    this.createChampionConfetti();
    this.createHeader(championTeamId, layout);
    this.createSummaryPanel(tournament, championTeamId, layout);
    this.createActions(layout);
  }

  private createChampionConfetti(): void {
    this.confettiEffect = createConfettiEffect(this, {
      colors: TOURNAMENT_COMPLETE_CONFETTI_COLORS,
      depth: COMPLETE_CONFETTI_DEPTH,
      mode: CONFETTI_EFFECT_MODE,
      repeatIntervalMs: CONFETTI_REPEAT_INTERVAL_MS,
      viewport: FULL_SCENE_CONFETTI_VIEWPORT
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyChampionConfetti, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.destroyChampionConfetti, this);
  }

  private destroyChampionConfetti(): void {
    this.confettiEffect?.destroy();
    this.confettiEffect = null;
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroyChampionConfetti, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.destroyChampionConfetti, this);
  }

  private renderMissingTournament(): void {
    this.add
      .text(SCENE_WIDTH / 2, 220, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '42px',
        fontStyle: '700'
      })
      .setOrigin(0.5)
      .setDepth(COMPLETE_CONTENT_DEPTH);
    this.add
      .text(SCENE_WIDTH / 2, 320, 'Completed tournament was not found', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5)
      .setDepth(COMPLETE_CONTENT_DEPTH);

    new Button(this, SCENE_WIDTH / 2, 430, 'Menu', () => this.scene.start('MenuScene'), {
      width: 260
    }).setDepth(COMPLETE_CONTENT_DEPTH);
  }

  private createHeader(championTeamId: TournamentTeamId, layout: TournamentCompleteLayout): void {
    const champion = findTeam(championTeamId);

    this.add
      .text(SCENE_WIDTH / 2, layout.header.titleY, 'Congratulations to the champion!', {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.header.titleFontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5)
      .setDepth(COMPLETE_CONTENT_DEPTH);

    const championRow = this.add.container(SCENE_WIDTH / 2, layout.header.championY).setDepth(COMPLETE_CONTENT_DEPTH);
    const championName = champion?.name ?? championTeamId;
    const championLabel = this.add
      .text(0, 0, championName, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.header.championFontSize,
        fontStyle: '700',
        wordWrap: { width: 520 }
      })
      .setOrigin(0, 0.5);
    const flagGap = champion === undefined ? 0 : 16;
    const totalWidth = (champion === undefined ? 0 : layout.header.flagWidth) + flagGap + championLabel.width;
    let labelX = -totalWidth / 2;

    if (champion !== undefined) {
      const flag = this.add.image(labelX + layout.header.flagWidth / 2, 0, getFlagAssetKey(champion.flagCode));
      flag.setDisplaySize(layout.header.flagWidth, layout.header.flagHeight);
      championRow.add(flag);
      labelX += layout.header.flagWidth + flagGap;
    }

    championLabel.setX(labelX);
    championRow.add(championLabel);
  }

  private createSummaryPanel(
    tournament: TournamentState,
    championTeamId: TournamentTeamId,
    layout: TournamentCompleteLayout
  ): void {
    const panel = this.add.container(layout.panel.x, layout.panel.y).setDepth(COMPLETE_CONTENT_DEPTH);
    const background = this.add.graphics();

    background
      .fillStyle(SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA)
      .fillRoundedRect(
        -layout.panel.width / 2,
        -layout.panel.height / 2,
        layout.panel.width,
        layout.panel.height,
        COMPLETE_PANEL_RADIUS
      )
      .lineStyle(2, SCOREBOARD_BORDER_COLOR, SCOREBOARD_BORDER_ALPHA)
      .strokeRoundedRect(
        -layout.panel.width / 2,
        -layout.panel.height / 2,
        layout.panel.width,
        layout.panel.height,
        COMPLETE_PANEL_RADIUS
      );
    panel.add(background);

    panel.add(this.createSectionTitle(layout.path.titleX, layout.path.titleY, 'Champion path', layout.path.headingFontSize));
    this.createChampionPath(panel, tournament, championTeamId, layout);

    panel.add(this.createSectionTitle(layout.leaders.titleX, layout.leaders.titleY, 'Tournament leaders', layout.leaders.headingFontSize));
    this.createLeaderCards(panel, tournament, layout);
  }

  private createChampionPath(
    panel: Phaser.GameObjects.Container,
    tournament: TournamentState,
    championTeamId: TournamentTeamId,
    layout: TournamentCompleteLayout
  ): void {
    const content = this.add.container(layout.path.viewportX, layout.path.viewportY);
    const matchOrder = new Map(tournament.matches.map((match, index) => [match.id, index]));
    const championMatches = tournament.matches
      .filter(
        (match) =>
          match.status === 'completed' &&
          match.result !== undefined &&
          (match.result.homeTeamId === championTeamId || match.result.awayTeamId === championTeamId)
      )
      .sort((first, second) => (matchOrder.get(first.id) ?? 0) - (matchOrder.get(second.id) ?? 0));

    championMatches.forEach((match, index) => {
      const row = this.createPathRow(match, 0, layout.path.rowHeight / 2 + index * layout.path.rowGap, layout);
      content.add(row);
    });

    if (championMatches.length === 0) {
      content.add(
        this.add
          .text(0, 18, 'No completed matches found.', {
            color: '#8fb39d',
            fontFamily: 'Arial, sans-serif',
            fontSize: layout.path.rowFontSize,
            fontStyle: '700'
          })
          .setOrigin(0, 0.5)
      );
    }

    const contentHeight = Math.max(layout.path.rowHeight, championMatches.length * layout.path.rowGap);
    const maxScroll = Math.max(0, contentHeight - layout.path.viewportHeight);
    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(
        layout.panel.x + layout.path.viewportX,
        layout.panel.y + layout.path.viewportY,
        layout.path.viewportWidth,
        layout.path.viewportHeight
      )
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZoneWidth = layout.path.viewportWidth + 34;
    const scrollZone = this.add
      .zone(
        layout.path.viewportX + scrollZoneWidth / 2,
        layout.path.viewportY + layout.path.viewportHeight / 2,
        scrollZoneWidth,
        layout.path.viewportHeight
      )
      .setInteractive();

    panel.add([content, scrollZone]);

    if (maxScroll > 0) {
      const track = this.add
        .rectangle(
          layout.path.viewportX + layout.path.viewportWidth + 16,
          layout.path.viewportY,
          COMPLETE_SCROLLBAR_WIDTH,
          layout.path.viewportHeight,
          0x5f9572,
          0.28
        )
        .setOrigin(0.5, 0);
      const thumbHeight = Math.max(
        COMPLETE_SCROLLBAR_MIN_THUMB_HEIGHT,
        layout.path.viewportHeight * (layout.path.viewportHeight / contentHeight)
      );
      const maxThumbOffset = layout.path.viewportHeight - thumbHeight;
      const thumb = this.add
        .rectangle(
          layout.path.viewportX + layout.path.viewportWidth + 16,
          layout.path.viewportY,
          COMPLETE_SCROLLBAR_WIDTH,
          thumbHeight,
          0xf0c95a,
          0.95
        )
        .setOrigin(0.5, 0);
      let scrollY = 0;
      const updateScroll = (): void => {
        content.y = layout.path.viewportY - scrollY;
        thumb.y = layout.path.viewportY + (scrollY / maxScroll) * maxThumbOffset;
      };

      panel.add([track, thumb]);

      scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
        scrollY = Phaser.Math.Clamp(scrollY + deltaY * 0.35, 0, maxScroll);
        updateScroll();
      });
    }
  }

  private createPathRow(
    match: TournamentMatch,
    x: number,
    y: number,
    layout: TournamentCompleteLayout
  ): Phaser.GameObjects.Container {
    const row = this.add.container(x, y);
    const background = this.add.graphics();
    background
      .fillStyle(SCOREBOARD_BACKGROUND_COLOR, 0.22)
      .fillRoundedRect(0, -layout.path.rowHeight / 2, layout.path.viewportWidth, layout.path.rowHeight, COMPLETE_ROW_RADIUS)
      .lineStyle(1, SCOREBOARD_BORDER_COLOR, 0.24)
      .strokeRoundedRect(0, -layout.path.rowHeight / 2, layout.path.viewportWidth, layout.path.rowHeight, COMPLETE_ROW_RADIUS);
    const label = this.add
      .text(layout.path.stageX, 0, formatMatchStage(match), {
        color: '#9fc5ad',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.path.rowFontSize,
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
    const home = this.addTeamLabel(
      layout.path.homeX,
      0,
      match.homeTeamId,
      layout.path.teamWidth,
      layout.path.teamFlagWidth,
      layout.path.teamFlagHeight,
      layout.path.rowFontSize
    );
    const score = this.add
      .text(layout.path.scoreX, 0, formatMatchScore(match), {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.path.scoreFontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const away = this.addTeamLabel(
      layout.path.awayX,
      0,
      match.awayTeamId,
      layout.path.teamWidth,
      layout.path.teamFlagWidth,
      layout.path.teamFlagHeight,
      layout.path.rowFontSize
    );

    row.add([background, label, home, score, away]);
    return row;
  }

  private createLeaderCards(
    panel: Phaser.GameObjects.Container,
    tournament: TournamentState,
    layout: TournamentCompleteLayout
  ): void {
    const playerStats = getTournamentPlayerStats(tournament);
    const leaders: LeaderCardDefinition[] = [
      {
        title: 'Top scorer',
        statLabel: 'goals',
        player: getTournamentPlayerStatsRanking(playerStats, 'goals', 1)[0]
      },
      {
        title: 'Top assist',
        statLabel: 'assists',
        player: getTournamentPlayerStatsRanking(playerStats, 'assists', 1)[0]
      },
      {
        title: 'Top goalkeeper',
        statLabel: 'saves',
        player: getTournamentPlayerStatsRanking(playerStats, 'goalkeeperSaves', 1)[0]
      }
    ];

    leaders.forEach((leader, index) => {
      panel.add(
        this.createLeaderCard(layout.leaders.cardX, layout.leaders.startY + index * layout.leaders.gapY, leader, layout)
      );
    });
  }

  private createLeaderCard(
    x: number,
    y: number,
    leader: LeaderCardDefinition,
    layout: TournamentCompleteLayout
  ): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    const background = this.add.graphics();
    background
      .fillStyle(SCOREBOARD_BACKGROUND_COLOR, 0.24)
      .fillRoundedRect(
        -layout.leaders.width / 2,
        -layout.leaders.height / 2,
        layout.leaders.width,
        layout.leaders.height,
        COMPLETE_PANEL_RADIUS
      )
      .lineStyle(1, SCOREBOARD_BORDER_COLOR, 0.28)
      .strokeRoundedRect(
        -layout.leaders.width / 2,
        -layout.leaders.height / 2,
        layout.leaders.width,
        layout.leaders.height,
        COMPLETE_PANEL_RADIUS
      );
    card.add(background);
    card.add(
      this.add
        .text(-layout.leaders.width / 2 + 22, -layout.leaders.height / 2 + 28, leader.title, {
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.leaders.titleFontSize,
          fontStyle: '700'
        })
        .setOrigin(0, 0.5)
    );

    if (leader.player === undefined) {
      card.add(
        this.add
          .text(-layout.leaders.width / 2 + 22, 24, 'No data', {
            color: '#8fb39d',
            fontFamily: 'Arial, sans-serif',
            fontSize: layout.leaders.playerFontSize,
            fontStyle: '700'
          })
          .setOrigin(0, 0.5)
      );
      return card;
    }

    const team = findTeam(leader.player.teamId);

    if (team !== undefined) {
      const flag = this.add.image(-layout.leaders.width / 2 + 40, 22, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(layout.leaders.flagWidth, layout.leaders.flagHeight);
      card.add(flag);
    }

    const value = getLeaderValue(leader);
    card.add(
      this.add
        .text(-layout.leaders.width / 2 + 66, 22, `${leader.player.playerName} #${leader.player.shirtNumber}`, {
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.leaders.playerFontSize,
          fontStyle: '700',
          wordWrap: { width: layout.leaders.width - 178 }
        })
        .setOrigin(0, 0.5)
    );
    card.add(
      this.add
        .text(layout.leaders.width / 2 - 24, 22, `${value} ${leader.statLabel}`, {
          align: 'right',
          color: SCOREBOARD_TEXT_COLOR,
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.leaders.valueFontSize,
          fontStyle: '700'
        })
        .setOrigin(1, 0.5)
    );

    return card;
  }

  private createSectionTitle(x: number, y: number, text: string, fontSize: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize,
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
  }

  private addTeamLabel(
    x: number,
    y: number,
    teamId: TournamentTeamId | undefined,
    width = 210,
    flagWidth = 30,
    flagHeight = 22,
    fontSize = '16px'
  ): Phaser.GameObjects.Container {
    const team = teamId === undefined ? undefined : findTeam(teamId);
    const label = this.add.container(x, y);

    if (team !== undefined) {
      const flag = this.add.image(0, 0, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(flagWidth, flagHeight);
      label.add(flag);
    }

    label.add(
      this.add
        .text(24, 0, team?.name ?? 'TBD', {
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize,
          fontStyle: '700',
          wordWrap: { width }
        })
        .setOrigin(0, 0.5)
    );

    return label;
  }

  private createActions(layout: TournamentCompleteLayout): void {
    if (this.devMockReturnScene !== null) {
      new Button(this, SCENE_WIDTH / 2, layout.actions.y, 'Back', () => this.scene.start(this.devMockReturnScene!), {
        borderRadius: RESULT_ACTION_BUTTON_RADIUS,
        borderWidth: 0,
        fontSize: layout.actions.fontSize,
        height: layout.actions.height,
        width: 360
      }).setDepth(COMPLETE_CONTENT_DEPTH);
      return;
    }

    const actions = [
      { label: 'Menu', onClick: () => this.scene.start('MenuScene') },
      {
        label: 'View stats',
        onClick: () =>
          this.scene.start('TournamentHubScene', {
            initialTab: 'stats'
          })
      },
      { label: 'New tournament', onClick: () => this.startNewTournament() }
    ];
    const buttonWidth = layout.actions.width / actions.length;
    const firstButtonX = SCENE_WIDTH / 2 - layout.actions.width / 2 + buttonWidth / 2;

    actions.forEach((action, index) => {
      new Button(this, firstButtonX + index * buttonWidth, layout.actions.y, action.label, action.onClick, {
        borderRadius: getCompleteActionButtonRadius(index, actions.length),
        borderWidth: 0,
        fontSize: layout.actions.fontSize,
        height: layout.actions.height,
        width: buttonWidth
      }).setDepth(COMPLETE_CONTENT_DEPTH);
    });
  }

  private startNewTournament(): void {
    deleteStoredTournament();
    this.registry.remove('currentTournament');
    this.scene.start('TournamentSetupScene');
  }
}

function createTournamentCompleteLayout(
  mobileLandscape = isMobileLandscapeLayout()
): TournamentCompleteLayout {
  const panelWidth = mobileLandscape ? 1280 : 1120;
  const panelTop = mobileLandscape ? 132 : 150;
  const panelHeight = COMPLETE_PANEL_BOTTOM_Y - panelTop;
  const panelX = SCENE_WIDTH / 2;
  const panelY = panelTop + panelHeight / 2;
  const pathViewportWidth = mobileLandscape ? 660 : 580;
  const leaderWidth = mobileLandscape ? 430 : 390;
  const panelLeft = -panelWidth / 2;
  const panelRight = panelWidth / 2;
  const contentPaddingX = mobileLandscape ? 50 : 44;
  const titleY = -panelHeight / 2 + 42;
  const pathViewportY = titleY + 36;
  const pathViewportHeight = panelHeight - (pathViewportY + panelHeight / 2) - 40;
  const leaderCardX = panelRight - contentPaddingX - leaderWidth / 2;

  return {
    mobileLandscape,
    header: {
      titleY: mobileLandscape ? 38 : 50,
      titleFontSize: mobileLandscape ? '30px' : '32px',
      championY: mobileLandscape ? 92 : 108,
      championFontSize: mobileLandscape ? '38px' : '36px',
      flagWidth: mobileLandscape ? 76 : 72,
      flagHeight: mobileLandscape ? 54 : 52
    },
    panel: {
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight
    },
    path: {
      titleX: panelLeft + contentPaddingX,
      titleY,
      viewportX: panelLeft + contentPaddingX,
      viewportY: pathViewportY,
      viewportWidth: pathViewportWidth,
      viewportHeight: pathViewportHeight,
      rowHeight: mobileLandscape ? 42 : 40,
      rowGap: mobileLandscape ? 48 : 46,
      stageX: 14,
      homeX: mobileLandscape ? 150 : 132,
      scoreX: mobileLandscape ? 374 : 326,
      awayX: mobileLandscape ? 448 : 390,
      teamWidth: mobileLandscape ? 174 : 150,
      headingFontSize: mobileLandscape ? '25px' : '24px',
      rowFontSize: mobileLandscape ? '19px' : '18px',
      scoreFontSize: mobileLandscape ? '24px' : '22px',
      teamFlagWidth: mobileLandscape ? 38 : 34,
      teamFlagHeight: mobileLandscape ? 28 : 25
    },
    leaders: {
      titleX: leaderCardX - leaderWidth / 2,
      titleY,
      cardX: leaderCardX,
      startY: titleY + (mobileLandscape ? 84 : 80),
      gapY: mobileLandscape ? 118 : 112,
      width: leaderWidth,
      height: mobileLandscape ? 104 : 96,
      headingFontSize: mobileLandscape ? '25px' : '24px',
      titleFontSize: mobileLandscape ? '21px' : '20px',
      playerFontSize: mobileLandscape ? '18px' : '17px',
      valueFontSize: mobileLandscape ? '22px' : '20px',
      flagWidth: mobileLandscape ? 38 : 34,
      flagHeight: mobileLandscape ? 28 : 25
    },
    actions: {
      y: COMPLETE_ACTION_BUTTON_Y,
      width: panelWidth,
      height: RESULT_ACTION_BUTTON_HEIGHT,
      fontSize: mobileLandscape ? RESULT_ACTION_BUTTON_FONT_SIZE : '22px'
    }
  };
}

function getCompleteActionButtonRadius(index: number, actionCount: number): ButtonCornerRadius {
  const isFirst = index === 0;
  const isLast = index === actionCount - 1;

  return {
    topLeft: 0,
    topRight: 0,
    bottomRight: isLast ? RESULT_ACTION_BUTTON_RADIUS : 0,
    bottomLeft: isFirst ? RESULT_ACTION_BUTTON_RADIUS : 0
  };
}

function getFinalMatch(tournament: TournamentState): TournamentMatch | undefined {
  return tournament.matches.find((match) => match.id === 'final-1');
}

function findTeam(teamId: TournamentTeamId): NationalTeam | undefined {
  return NATIONAL_TEAMS.find((team) => team.flagCode === teamId);
}

function formatMatchScore(match: TournamentMatch): string {
  if (match.result === undefined) {
    return '- : -';
  }

  const score = `${match.result.homeGoals} : ${match.result.awayGoals}`;

  if (match.result.penaltyShootout === undefined) {
    return score;
  }

  return `${score} (${match.result.penaltyShootout.homeGoals}:${match.result.penaltyShootout.awayGoals})`;
}

function formatMatchStage(match: TournamentMatch): string {
  if (match.groupId !== undefined) {
    return `Group ${match.groupId}`;
  }

  switch (match.stage) {
    case 'round-of-16':
      return 'Round of 16';
    case 'quarter-final':
      return 'Quarter-final';
    case 'semi-final':
      return 'Semi-final';
    case 'final':
      return 'Final';
    case 'group':
      return 'Group';
    case 'complete':
      return 'Complete';
  }
}

function getLeaderValue(leader: LeaderCardDefinition): number {
  if (leader.player === undefined) {
    return 0;
  }

  if (leader.statLabel === 'goals') {
    return leader.player.goals;
  }

  if (leader.statLabel === 'assists') {
    return leader.player.assists;
  }

  return leader.player.goalkeeperSaves;
}

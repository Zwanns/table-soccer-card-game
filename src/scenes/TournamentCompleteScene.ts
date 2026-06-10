import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
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
import { Button } from '../ui/Button';

const SUMMARY_PANEL = {
  x: SCENE_WIDTH / 2,
  y: 380,
  width: 1120,
  height: 398
} as const;

// Reduced width for champion path (half of previous) to avoid overlap with leader cards
const CHAMPION_PATH_VIEWPORT = {
  x: -494,
  y: -30,
  width: 494,
  height: 148
} as const;

type LeaderCardDefinition = {
  title: string;
  statLabel: string;
  player: TournamentPlayerStats | undefined;
};

export class TournamentCompleteScene extends Phaser.Scene {
  public constructor() {
    super('TournamentCompleteScene');
  }

  public create(): void {
    const tournament = this.registry.get('currentTournament') as TournamentState | undefined;

    this.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a);

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

    this.createHeader(tournament, championTeamId);
    this.createSummaryPanel(tournament, championTeamId, finalMatch);
    this.createActions();
  }

  private renderMissingTournament(): void {
    this.add
      .text(SCENE_WIDTH / 2, 220, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '42px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    this.add
      .text(SCENE_WIDTH / 2, 320, 'Completed tournament was not found', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    new Button(this, SCENE_WIDTH / 2, 430, 'Menu', () => this.scene.start('MenuScene'), {
      width: 260
    });
  }

  private createHeader(tournament: TournamentState, championTeamId: TournamentTeamId): void {
    const champion = findTeam(championTeamId);

    this.add
      .text(SCENE_WIDTH / 2, 42, GAME_TITLE, {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    this.add
      .text(SCENE_WIDTH / 2, 84, 'Tournament complete', {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const championRow = this.add.container(SCENE_WIDTH / 2, 142);

    if (champion !== undefined) {
      const flag = this.add.image(-152, 0, getFlagAssetKey(champion.flagCode));
      flag.setDisplaySize(68, 48);
      championRow.add(flag);
    }

    championRow.add(
      this.add
        .text(-96, 0, `Champion: ${champion?.name ?? championTeamId}`, {
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '34px',
          fontStyle: '700',
          wordWrap: { width: 520 }
        })
        .setOrigin(0, 0.5)
    );

    const completedMatches = tournament.matches.filter((match) => match.status === 'completed').length;
    this.add
      .text(SCENE_WIDTH / 2, 192, `${completedMatches}/${tournament.matches.length} matches played`, {
        align: 'center',
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createSummaryPanel(
    tournament: TournamentState,
    championTeamId: TournamentTeamId,
    finalMatch: TournamentMatch
  ): void {
    const panel = this.add.container(SUMMARY_PANEL.x, SUMMARY_PANEL.y);
    const background = this.add.rectangle(0, 0, SUMMARY_PANEL.width, SUMMARY_PANEL.height, 0x0b2118, 0.88);
    background.setStrokeStyle(2, 0x5f9572, 0.95);
    panel.add(background);

    panel.add(this.createSectionTitle(-488, -168, 'Final'));
    panel.add(this.createFinalLine(finalMatch, -488, -126));
    panel.add(this.createSectionTitle(-488, -72, 'Champion path'));
    this.createChampionPath(panel, tournament, championTeamId);

    panel.add(this.createSectionTitle(160, -168, 'Tournament leaders'));
    this.createLeaderCards(panel, tournament);
  }

  private createFinalLine(finalMatch: TournamentMatch, x: number, y: number): Phaser.GameObjects.Container {
    const line = this.add.container(x, y);
    const homeText = this.addTeamLabel(0, 0, finalMatch.homeTeamId);
    const score = this.add
      .text(322, 0, formatMatchScore(finalMatch), {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const awayText = this.addTeamLabel(390, 0, finalMatch.awayTeamId);

    line.add([homeText, score, awayText]);
    return line;
  }

  private createChampionPath(
    panel: Phaser.GameObjects.Container,
    tournament: TournamentState,
    championTeamId: TournamentTeamId
  ): void {
    const content = this.add.container(CHAMPION_PATH_VIEWPORT.x, CHAMPION_PATH_VIEWPORT.y);
    const championMatches = tournament.matches
      .filter(
        (match) =>
          match.status === 'completed' &&
          match.result !== undefined &&
          (match.homeTeamId === championTeamId || match.awayTeamId === championTeamId)
      )
      .sort((first, second) => first.roundIndex - second.roundIndex || first.orderIndex - second.orderIndex);

    championMatches.forEach((match, index) => {
      const row = this.createPathRow(match, 0, 14 + index * 28);
      content.add(row);
    });

    if (championMatches.length === 0) {
      content.add(
        this.add
          .text(0, 18, 'No completed matches found.', {
            color: '#8fb39d',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            fontStyle: '700'
          })
          .setOrigin(0, 0.5)
      );
    }

    const contentHeight = championMatches.length * 28 + 28;
    const maxScroll = Math.max(0, contentHeight - CHAMPION_PATH_VIEWPORT.height);
    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(
        SUMMARY_PANEL.x + CHAMPION_PATH_VIEWPORT.x,
        SUMMARY_PANEL.y + CHAMPION_PATH_VIEWPORT.y,
        CHAMPION_PATH_VIEWPORT.width,
        CHAMPION_PATH_VIEWPORT.height
      )
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZone = this.add
      .zone(
        CHAMPION_PATH_VIEWPORT.x + CHAMPION_PATH_VIEWPORT.width / 2,
        CHAMPION_PATH_VIEWPORT.y + CHAMPION_PATH_VIEWPORT.height / 2,
        CHAMPION_PATH_VIEWPORT.width,
        CHAMPION_PATH_VIEWPORT.height
      )
      .setInteractive();

    panel.add([content, scrollZone]);

    if (maxScroll > 0) {
      let scrollY = 0;
      scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
        scrollY = Phaser.Math.Clamp(scrollY + deltaY * 0.35, 0, maxScroll);
        content.y = CHAMPION_PATH_VIEWPORT.y - scrollY;
      });
    }
  }

  private createPathRow(match: TournamentMatch, x: number, y: number): Phaser.GameObjects.Container {
    const row = this.add.container(x, y);
    const label = this.add
      .text(0, 0, formatMatchStage(match), {
        color: '#9fc5ad',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
    // Compact layout for narrower champion path viewport
    const home = this.addTeamLabel(120, 0, match.homeTeamId, 120);
    const score = this.add
      .text(240, 0, formatMatchScore(match), {
        align: 'center',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const away = this.addTeamLabel(360, 0, match.awayTeamId, 120);

    row.add([label, home, score, away]);
    return row;
  }

  private createLeaderCards(panel: Phaser.GameObjects.Container, tournament: TournamentState): void {
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

    // Position leader cards further right to avoid overlapping the (now narrower) champion path
    leaders.forEach((leader, index) => {
      panel.add(this.createLeaderCard(420 + index * 240, -112, leader));
    });
  }

  private createLeaderCard(x: number, y: number, leader: LeaderCardDefinition): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, 220, 150, 0x123b2a, 0.9);
    background.setStrokeStyle(2, 0x5f9572, 0.94);
    card.add(background);
    card.add(
      this.add
        .text(0, -50, leader.title, {
          align: 'center',
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );

    if (leader.player === undefined) {
      card.add(
        this.add
          .text(0, 14, 'No data', {
            align: 'center',
            color: '#8fb39d',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            fontStyle: '700'
          })
          .setOrigin(0.5)
      );
      return card;
    }

    const team = findTeam(leader.player.teamId);

    if (team !== undefined) {
      const flag = this.add.image(-74, -14, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(34, 24);
      card.add(flag);
    }

    const value = getLeaderValue(leader);
    card.add(
      this.add
        .text(-46, -14, `${leader.player.playerName} #${leader.player.shirtNumber}`, {
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          fontStyle: '700',
          wordWrap: { width: 124 }
        })
        .setOrigin(0, 0.5)
    );
    card.add(
      this.add
        .text(0, 42, `${value} ${leader.statLabel}`, {
          color: '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );

    return card;
  }

  private createSectionTitle(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
  }

  private addTeamLabel(
    x: number,
    y: number,
    teamId: TournamentTeamId | undefined,
    width = 210
  ): Phaser.GameObjects.Container {
    const team = teamId === undefined ? undefined : findTeam(teamId);
    const label = this.add.container(x, y);

    if (team !== undefined) {
      const flag = this.add.image(0, 0, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(30, 22);
      label.add(flag);
    }

    label.add(
      this.add
        .text(24, 0, team?.name ?? 'TBD', {
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          fontStyle: '700',
          wordWrap: { width }
        })
        .setOrigin(0, 0.5)
    );

    return label;
  }

  private createActions(): void {
    new Button(this, 468, 666, 'Menu', () => this.scene.start('MenuScene'), {
      fontSize: '18px',
      width: 190
    });
    new Button(
      this,
      800,
      666,
      'View stats',
      () =>
        this.scene.start('TournamentHubScene', {
          initialTab: 'stats'
        }),
      {
        fontSize: '18px',
        width: 220
      }
    );
    new Button(this, 1132, 666, 'New tournament', () => this.startNewTournament(), {
      fontSize: '18px',
      width: 250
    });
  }

  private startNewTournament(): void {
    deleteStoredTournament();
    this.registry.remove('currentTournament');
    this.scene.start('TournamentSetupScene');
  }
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

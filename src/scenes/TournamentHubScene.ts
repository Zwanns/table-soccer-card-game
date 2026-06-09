import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import {
  getTournamentFormat,
  getTournamentGroupStandings,
  type TournamentGroup,
  type TournamentMatch,
  type TournamentStage,
  type TournamentState,
  type TournamentTeamId
} from '../tournament';
import { Button } from '../ui/Button';
import { createSimulatedTournamentGameState } from './tournamentMatchSimulation';

type TournamentHubTab = 'matches' | 'tables' | 'bracket';

const TAB_LABELS: Record<TournamentHubTab, string> = {
  matches: 'Matches',
  tables: 'Group Stage',
  bracket: 'Playoff'
};

const STAGE_LABELS: Record<TournamentStage, string> = {
  group: 'Group Stage',
  'round-of-16': 'Round of 16',
  'quarter-final': 'Quarter-final',
  'semi-final': 'Semi-final',
  final: 'Final',
  complete: 'Complete'
};

const MATCHES_PER_PAGE = 10;
const BRACKET_CARD_HEIGHT = 58;
const BRACKET_CENTER_Y = 395;
const BRACKET_MAX_ROW_GAP = 106;
const BRACKET_TOP = 185;
const BRACKET_BOTTOM = 610;
const BRACKET_SIDE_MARGIN = 84;
const BRACKET_MAX_COLUMN_GAP = 180;

export class TournamentHubScene extends Phaser.Scene {
  private activeTab: TournamentHubTab = 'matches';
  private matchPage = 0;

  public constructor() {
    super('TournamentHubScene');
  }

  public create(): void {
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);

    const tournament = this.getTournament();

    this.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a);

    if (tournament === null) {
      this.renderMissingTournament();
      return;
    }

    this.createHeader(tournament);
    this.createTabs();

    if (this.activeTab === 'matches') {
      this.createMatchesTab(tournament);
    } else if (this.activeTab === 'tables') {
      this.createTablesTab(tournament);
    } else {
      this.createBracketTab(tournament);
    }

    new Button(this, 132, 666, 'Menu', () => this.scene.start('MenuScene'), {
      fontSize: '18px',
      width: 170
    });
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

    new Button(this, SCENE_WIDTH / 2, 430, 'Create tournament', () => this.scene.start('TournamentSetupScene'), {
      width: 260
    });
    new Button(this, SCENE_WIDTH / 2, 500, 'Menu', () => this.scene.start('MenuScene'), {
      width: 260
    });
  }

  private createHeader(tournament: TournamentState): void {
    const format = getTournamentFormat(tournament.formatId);
    const completedMatches = tournament.matches.filter((match) => match.status === 'completed').length;

    this.add
      .text(SCENE_WIDTH / 2, 30, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    this.add
      .text(SCENE_WIDTH / 2, 68, `${format.name} | ${completedMatches}/${tournament.matches.length} matches`, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createTabs(): void {
    (Object.keys(TAB_LABELS) as TournamentHubTab[]).forEach((tab, index) => {
      const selected = this.activeTab === tab;
      const x = SCENE_WIDTH / 2 - 250 + index * 250;
      const button = this.add.container(x, 116);
      const background = this.add.rectangle(0, 0, 210, 46, selected ? 0xf0c95a : 0x143f2c, selected ? 1 : 0.94);
      background.setStrokeStyle(2, selected ? 0x2d382f : 0x5f9572, 0.95);
      const label = this.add
        .text(0, 0, TAB_LABELS[tab], {
          color: selected ? '#1f2a2e' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          fontStyle: '700'
        })
        .setOrigin(0.5);

      button.add([background, label]);
      button.setSize(210, 46);
      button.setInteractive({ useHandCursor: true });
      button.on('pointerover', () => {
        if (!selected) {
          background.setFillStyle(0x1d5b3f, 0.96);
        }
      });
      button.on('pointerout', () => {
        if (!selected) {
          background.setFillStyle(0x143f2c, 0.94);
        }
      });
      button.on('pointerdown', () => {
        this.activeTab = tab;
        this.render();
      });
    });
  }

  private createMatchesTab(tournament: TournamentState): void {
    const maxPage = Math.max(0, Math.ceil(tournament.matches.length / MATCHES_PER_PAGE) - 1);
    const pageMatches = tournament.matches.slice(
      this.matchPage * MATCHES_PER_PAGE,
      this.matchPage * MATCHES_PER_PAGE + MATCHES_PER_PAGE
    );

    pageMatches.forEach((match, index) => {
      this.createMatchRow(tournament, match, 128, 168 + index * 45);
    });

    new Button(this, 600, 666, 'Back', () => this.changeMatchPage(-1, maxPage), {
      disabled: this.matchPage === 0,
      fontSize: '18px',
      width: 170
    });
    this.add
      .text(800, 666, `${this.matchPage + 1} / ${maxPage + 1}`, {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    new Button(this, 1000, 666, 'Next', () => this.changeMatchPage(1, maxPage), {
      disabled: this.matchPage === maxPage,
      fontSize: '18px',
      width: 170
    });
  }

  private createMatchRow(tournament: TournamentState, match: TournamentMatch, x: number, y: number): void {
    const row = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, 1344, 38, 0x0b2118, 0.86);
    background.setOrigin(0);
    background.setStrokeStyle(1, match.status === 'completed' ? 0x9dd2a7 : 0x5f9572, 0.86);
    const label = this.add
      .text(18, 19, formatMatchLabel(match), {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);

    row.add([background, label]);
    this.addTeamCell(row, 210, 19, match.homeTeamId);
    row.add(
      this.add
        .text(560, 19, formatMatchScore(match), {
          align: 'center',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: '700'
        })
        .setOrigin(0.5)
    );
    this.addTeamCell(row, 640, 19, match.awayTeamId);

    const statusText = this.add
      .text(1030, 19, formatMatchStatus(match), {
        color: match.status === 'available' ? '#d9eadf' : match.status === 'completed' ? '#9dd2a7' : '#8fb39d',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
    row.add(statusText);

    if (match.status === 'available' && match.homeTeamId !== undefined && match.awayTeamId !== undefined) {
      row.add(
        new Button(this, 1168, 19, 'Sim', () => this.simulateTournamentMatch(tournament, match), {
          fontSize: '16px',
          height: 30,
          width: 84
        })
      );
      row.add(
        new Button(this, 1282, 19, 'Play', () => this.startTournamentMatch(tournament, match), {
          fontSize: '16px',
          height: 30,
          width: 120
        })
      );
    }
  }

  private createTablesTab(tournament: TournamentState): void {
    const columns = tournament.groups.length <= 4 ? tournament.groups.length : 4;

    tournament.groups.forEach((group, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = 74 + column * 368;
      const y = 168 + row * 218;

      this.createGroupTable(tournament, group, x, y);
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
    panel.add(this.createTableHeader(16, 44));

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
      panel.add(this.createTableValue(164, rowY, standing.played));
      panel.add(this.createTableValue(202, rowY, standing.points));
      panel.add(this.createTableValue(240, rowY, standing.goalDifference));
      panel.add(this.createTableValue(286, rowY, `${standing.goalsFor}:${standing.goalsAgainst}`));
    });
  }

  private createTableHeader(x: number, y: number): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, 'Team                              P   Pts   GD   G', {
        color: '#9fc5ad',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
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

  private createBracketTab(tournament: TournamentState): void {
    const format = getTournamentFormat(tournament.formatId);
    const cardWidth = getBracketCardWidth(tournament.formatId);
    const rounds = format.knockoutRounds.map((round) => ({
      stage: round.stage,
      matches: tournament.matches.filter((match) => match.stage === round.stage)
    }));
    const columnGap = getBracketColumnGap(rounds.length, cardWidth);
    const totalWidth = rounds.length * cardWidth + Math.max(0, rounds.length - 1) * columnGap;
    const startX = (SCENE_WIDTH - totalWidth) / 2;
    const roundCenters = getBracketRoundCenters(rounds[0]?.matches.length ?? 0, rounds.length);
    const connectorGraphics = this.add.graphics();

    connectorGraphics.lineStyle(2, 0x5f9572, 0.72);
    this.drawBracketConnectors(connectorGraphics, startX, columnGap, cardWidth, roundCenters);

    rounds.forEach((round, roundIndex) => {
      const x = startX + roundIndex * (cardWidth + columnGap);
      const centers = roundCenters[roundIndex] ?? [];
      const labelY = Math.min(...centers) - BRACKET_CARD_HEIGHT / 2 - 28;

      this.createBracketColumnLabel(STAGE_LABELS[round.stage], x, labelY);
      round.matches.forEach((match, index) => {
        this.createBracketMatch(match, x, centers[index] - BRACKET_CARD_HEIGHT / 2, cardWidth);
      });
    });
  }

  private drawBracketConnectors(
    graphics: Phaser.GameObjects.Graphics,
    startX: number,
    columnGap: number,
    cardWidth: number,
    roundCenters: readonly (readonly number[])[]
  ): void {
    for (let roundIndex = 1; roundIndex < roundCenters.length; roundIndex += 1) {
      const previousCenters = roundCenters[roundIndex - 1] ?? [];
      const centers = roundCenters[roundIndex] ?? [];
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
    }
  }

  private createBracketColumnLabel(text: string, x: number, y: number): void {
    this.add
      .text(x, y, text, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
  }

  private createBracketMatch(match: TournamentMatch, x: number, y: number, width: number): void {
    const panel = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, width, BRACKET_CARD_HEIGHT, 0x0b2118, 0.86);
    background.setOrigin(0);
    background.setStrokeStyle(2, match.status === 'locked' ? 0x3f6b50 : 0x5f9572, 0.92);

    panel.add(background);
    this.addBracketTeamRow(panel, match.homeTeamId, getMatchTeamScore(match, 'home'), 14, 21, match.status === 'locked', width);
    this.addBracketTeamRow(panel, match.awayTeamId, getMatchTeamScore(match, 'away'), 14, 39, match.status === 'locked', width);
  }

  private addBracketTeamRow(
    panel: Phaser.GameObjects.Container,
    teamId: TournamentTeamId | undefined,
    score: string,
    x: number,
    y: number,
    muted: boolean,
    width: number
  ): void {
    const team = teamId === undefined ? undefined : findTeam(teamId);
    const scoreX = width - 42;

    if (team !== undefined) {
      const flag = this.add.image(x + 10, y, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(20, 14);
      panel.add(flag);
    }

    panel.add(
      this.add
        .text(x + 26, y, getTeamName(teamId), {
          color: muted ? '#8fb39d' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: '700',
          wordWrap: { width: scoreX - x - 40 }
        })
        .setOrigin(0, 0.5)
    );
    panel.add(
      this.add
        .text(scoreX, y, score, {
          align: 'right',
          color: muted ? '#8fb39d' : '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: '700'
        })
        .setOrigin(1, 0.5)
    );
  }

  private addTeamCell(container: Phaser.GameObjects.Container, x: number, y: number, teamId: TournamentTeamId | undefined): void {
    const team = teamId === undefined ? undefined : findTeam(teamId);

    if (team !== undefined) {
      const flag = this.add.image(x, y, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(30, 22);
      container.add(flag);
    }

    container.add(
      this.add
        .text(x + 28, y, team?.name ?? 'TBD', {
          color: team === undefined ? '#8fb39d' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          fontStyle: '700',
          wordWrap: { width: 230 }
        })
        .setOrigin(0, 0.5)
    );
  }

  private startTournamentMatch(tournament: TournamentState, match: TournamentMatch): void {
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
      launchContext: {
        mode: 'tournament',
        tournamentId: tournament.id,
        tournamentMatchId: match.id
      }
    });
  }

  private simulateTournamentMatch(tournament: TournamentState, match: TournamentMatch): void {
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
        tournamentSeed: tournament.seed
      }),
      launchContext: {
        mode: 'tournament',
        tournamentId: tournament.id,
        tournamentMatchId: match.id
      }
    });
  }

  private changeMatchPage(direction: -1 | 1, maxPage: number): void {
    this.matchPage = Phaser.Math.Clamp(this.matchPage + direction, 0, maxPage);
    this.render();
  }

  private getTournament(): TournamentState | null {
    const value = this.registry.get('currentTournament') as TournamentState | undefined;

    return value ?? null;
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

function getTeamName(teamId: TournamentTeamId | undefined): string {
  return teamId === undefined ? 'TBD' : findTeam(teamId)?.name ?? teamId;
}

function getMatchTeamScore(match: TournamentMatch, team: 'home' | 'away'): string {
  if (match.result === undefined) {
    return '-';
  }

  return String(team === 'home' ? match.result.homeGoals : match.result.awayGoals);
}

function getBracketCardWidth(formatId: TournamentState['formatId']): number {
  return formatId === 'cup-xl' ? 200 : 210;
}

function getBracketColumnGap(columnCount: number, cardWidth: number): number {
  if (columnCount <= 1) {
    return 0;
  }

  const usableGapWidth = SCENE_WIDTH - BRACKET_SIDE_MARGIN * 2 - columnCount * cardWidth;

  return Math.min(BRACKET_MAX_COLUMN_GAP, usableGapWidth / (columnCount - 1));
}

function getBracketRoundCenters(firstRoundMatchCount: number, roundCount: number): number[][] {
  if (firstRoundMatchCount <= 0 || roundCount <= 0) {
    return [];
  }

  const firstRoundCenters = getFirstRoundCenters(firstRoundMatchCount);
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

function getFirstRoundCenters(matchCount: number): number[] {
  if (matchCount === 1) {
    return [BRACKET_CENTER_Y];
  }

  const availableGap = (BRACKET_BOTTOM - BRACKET_TOP) / Math.max(1, matchCount - 1);
  const rowGap = Math.min(BRACKET_MAX_ROW_GAP, availableGap);
  const firstY = BRACKET_CENTER_Y - ((matchCount - 1) * rowGap) / 2;

  return Array.from({ length: matchCount }, (_value, index) => firstY + index * rowGap);
}

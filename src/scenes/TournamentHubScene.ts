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

type TournamentHubTab = 'matches' | 'tables' | 'bracket';

const TAB_LABELS: Record<TournamentHubTab, string> = {
  matches: 'Матчи',
  tables: 'Таблицы',
  bracket: 'Сетка'
};

const STAGE_LABELS: Record<TournamentStage, string> = {
  group: 'Группа',
  'round-of-16': '1/8 финала',
  'quarter-final': '1/4 финала',
  'semi-final': '1/2 финала',
  final: 'Финал',
  complete: 'Завершено'
};

const MATCHES_PER_PAGE = 10;

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

    new Button(this, 132, 666, 'В меню', () => this.scene.start('MenuScene'), {
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
      .text(SCENE_WIDTH / 2, 320, 'Турнир не найден', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    new Button(this, SCENE_WIDTH / 2, 430, 'Создать турнир', () => this.scene.start('TournamentSetupScene'), {
      width: 260
    });
    new Button(this, SCENE_WIDTH / 2, 500, 'В меню', () => this.scene.start('MenuScene'), {
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
      .text(SCENE_WIDTH / 2, 68, `${format.name} | ${completedMatches}/${tournament.matches.length} матчей`, {
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

    new Button(this, 600, 666, 'Назад', () => this.changeMatchPage(-1, maxPage), {
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
    new Button(this, 1000, 666, 'Дальше', () => this.changeMatchPage(1, maxPage), {
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
        new Button(this, 1240, 19, 'Играть', () => this.startTournamentMatch(tournament, match), {
          fontSize: '16px',
          height: 30,
          width: 150
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
      .text(16, 18, `Группа ${group.id}`, {
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
      .text(x, y, 'Команда                         И    О    РГ    Г', {
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
    const columnGap = 342;
    const startX = 96;

    format.knockoutRounds.forEach((round, column) => {
      const roundMatches = tournament.matches.filter((match) => match.stage === round.stage);
      const x = startX + column * columnGap;

      this.add
        .text(x, 158, STAGE_LABELS[round.stage], {
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: '700'
        })
        .setOrigin(0, 0.5);

      roundMatches.forEach((match, index) => {
        this.createBracketMatch(match, x, 184 + index * 58, index + 1);
      });
    });
  }

  private createBracketMatch(match: TournamentMatch, x: number, y: number, matchNumber: number): void {
    const panel = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, 306, 50, 0x0b2118, 0.86);
    background.setOrigin(0);
    background.setStrokeStyle(2, match.status === 'locked' ? 0x3f6b50 : 0x5f9572, 0.92);
    const title = this.add
      .text(14, 14, `${STAGE_LABELS[match.stage]} ${matchNumber}`, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
    const fixture = this.add
      .text(14, 34, `${getTeamName(match.homeTeamId)} ${formatMatchScore(match)} ${getTeamName(match.awayTeamId)}`, {
        color: match.status === 'locked' ? '#8fb39d' : '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700',
        wordWrap: { width: 278 }
      })
      .setOrigin(0, 0.5);

    panel.add([background, title, fixture]);
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
  return match.groupId === undefined ? STAGE_LABELS[match.stage] : `Группа ${match.groupId}`;
}

function formatMatchScore(match: TournamentMatch): string {
  if (match.result === undefined) {
    return '- : -';
  }

  return `${match.result.homeGoals} : ${match.result.awayGoals}`;
}

function formatMatchStatus(match: TournamentMatch): string {
  if (match.status === 'completed') {
    return 'Сыгран';
  }

  if (match.status === 'available') {
    return 'Доступен';
  }

  return 'Закрыт';
}

function findTeam(teamId: TournamentTeamId): NationalTeam | undefined {
  return NATIONAL_TEAMS.find((team) => team.flagCode === teamId);
}

function getTeamName(teamId: TournamentTeamId | undefined): string {
  return teamId === undefined ? 'TBD' : findTeam(teamId)?.name ?? teamId;
}

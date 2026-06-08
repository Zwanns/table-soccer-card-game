import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import { Button } from '../ui/Button';

const TEAMS_PER_PAGE = 32;
const GRID_COLUMNS = 4;
const CARD_WIDTH = 342;
const CARD_HEIGHT = 58;
const GRID_GAP_X = 18;
const GRID_GAP_Y = 10;
const GRID_START_Y = 122;

export class SquadSelectScene extends Phaser.Scene {
  private page = 0;

  public constructor() {
    super('SquadSelectScene');
  }

  public create(): void {
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);

    const centerX = SCENE_WIDTH / 2;
    const maxPage = getMaxPage();

    this.add.rectangle(centerX, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a);
    this.add
      .text(centerX, 34, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    this.add
      .text(centerX, 74, 'Составы сборных', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createTeamGrid();

    new Button(this, 258, 666, 'Назад', () => this.scene.start('MenuScene'));
    new Button(this, 620, 666, 'Назад', () => this.changePage(-1), { disabled: this.page === 0 });
    this.add
      .text(centerX, 666, `${this.page + 1} / ${maxPage + 1}`, {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    new Button(this, 980, 666, 'Дальше', () => this.changePage(1), { disabled: this.page === maxPage });
  }

  private createTeamGrid(): void {
    const pageTeams = NATIONAL_TEAMS.slice(this.page * TEAMS_PER_PAGE, (this.page + 1) * TEAMS_PER_PAGE);
    const gridWidth = GRID_COLUMNS * CARD_WIDTH + (GRID_COLUMNS - 1) * GRID_GAP_X;
    const startX = (SCENE_WIDTH - gridWidth) / 2 + CARD_WIDTH / 2;

    pageTeams.forEach((team, index) => {
      const column = index % GRID_COLUMNS;
      const row = Math.floor(index / GRID_COLUMNS);
      this.createTeamOption(
        startX + column * (CARD_WIDTH + GRID_GAP_X),
        GRID_START_Y + row * (CARD_HEIGHT + GRID_GAP_Y),
        team
      );
    });
  }

  private createTeamOption(x: number, y: number, team: NationalTeam): void {
    const option = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0x143f2c, 0.92);
    background.setStrokeStyle(2, 0x5f9572, 0.95);

    const flag = this.add.image(-CARD_WIDTH / 2 + 32, 0, getFlagAssetKey(team.flagCode));
    flag.setDisplaySize(42, 30);
    const rankText = this.add
      .text(-CARD_WIDTH / 2 + 62, -13, String(team.rank), {
        color: '#9fc5ad',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
    const nameText = this.add
      .text(-CARD_WIDTH / 2 + 62, 11, team.name, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700',
        wordWrap: { width: 160 }
      })
      .setOrigin(0, 0.5);
    const editText = this.add
      .text(CARD_WIDTH / 2 - 18, 0, 'Редактировать', {
        align: 'right',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: '700'
      })
      .setOrigin(1, 0.5);

    option.add([background, flag, rankText, nameText, editText]);
    option.setSize(CARD_WIDTH, CARD_HEIGHT);
    option.setInteractive({ useHandCursor: true });
    option.on('pointerover', () => background.setFillStyle(0x1d5b3f, 0.95));
    option.on('pointerout', () => background.setFillStyle(0x143f2c, 0.92));
    option.on('pointerdown', () => this.scene.start('SquadEditorScene', { teamId: team.flagCode }));
  }

  private changePage(direction: -1 | 1): void {
    this.page = Phaser.Math.Clamp(this.page + direction, 0, getMaxPage());
    this.render();
  }
}

function getMaxPage(): number {
  return Math.ceil(NATIONAL_TEAMS.length / TEAMS_PER_PAGE) - 1;
}

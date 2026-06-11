import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import type { NationalTeamSquad } from '../data/squadTypes';
import { loadSquad } from '../services/squadStorage';
import { Button } from '../ui/Button';

type SquadEditorSceneData = {
  teamId?: string;
};

const FIELD_TABLE = {
  x: 332,
  y: 178,
  rankX: -196,
  nameX: -88,
  numberX: 232,
  rowGap: 28
} as const;

const GK_TABLE = {
  x: 1014,
  y: 178,
  roleX: -132,
  nameX: -34,
  numberX: 180
} as const;

// Read-only squad viewer. Editing was removed intentionally.
export class SquadEditorScene extends Phaser.Scene {
  private teamId = 'fr';
  private squad: NationalTeamSquad = loadSquad(this.teamId);

  public constructor() {
    super('SquadEditorScene');
  }

  public init(data: SquadEditorSceneData): void {
    this.teamId = data.teamId ?? 'fr';
    this.squad = loadSquad(this.teamId);
  }

  public create(): void {
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);

    const centerX = SCENE_WIDTH / 2;
    const team = getTeam(this.teamId);

    this.add.rectangle(centerX, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a);
    this.add
      .text(centerX, 30, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createHeader(team);
    this.createFieldPlayersTable();
    this.createGoalkeeperTable();

    new Button(this, centerX, 666, 'Назад', () => this.scene.start('SquadSelectScene'), { width: 210 });
  }

  private createHeader(team: NationalTeam): void {
    const header = this.add.container(SCENE_WIDTH / 2, 78);
    const flag = this.add.image(-220, 0, getFlagAssetKey(team.flagCode));
    flag.setDisplaySize(58, 42);
    const title = this.add
      .text(-174, -10, team.name, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
    const subtitle = this.add
      .text(-174, 22, 'Состав сборной', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);

    header.add([flag, title, subtitle]);
  }

  private createFieldPlayersTable(): void {
    const table = this.add.container(FIELD_TABLE.x, FIELD_TABLE.y);
    table.add(this.createSectionTitle(-8, -40, 'Полевые игроки'));
    table.add(this.createHeaderText(FIELD_TABLE.rankX, 0, 'Номинал', 'left'));
    table.add(this.createHeaderText(FIELD_TABLE.nameX, 0, 'Игрок', 'left'));
    table.add(this.createHeaderText(FIELD_TABLE.numberX, 0, 'Номер', 'right'));
    table.add(this.add.rectangle(22, 18, 540, 2, 0x5f9572, 0.9));

    FIELD_SQUAD_RANKS.forEach((rank, index) => {
      const player = this.squad.fieldPlayers[rank];
      const y = 42 + index * FIELD_TABLE.rowGap;

      table.add(this.createCellText(FIELD_TABLE.rankX, y, rank, 'left', '#f0c95a'));
      table.add(this.createCellText(FIELD_TABLE.nameX, y, player.name, 'left', '#ffffff'));
      table.add(this.createCellText(FIELD_TABLE.numberX, y, String(player.shirtNumber), 'right', '#d9eadf'));
    });
  }

  private createGoalkeeperTable(): void {
    const table = this.add.container(GK_TABLE.x, GK_TABLE.y);
    const goalkeeper = this.squad.goalkeeper;

    table.add(this.createSectionTitle(14, -40, 'Вратарь'));
    table.add(this.createHeaderText(GK_TABLE.roleX, 0, 'Роль', 'left'));
    table.add(this.createHeaderText(GK_TABLE.nameX, 0, 'Игрок', 'left'));
    table.add(this.createHeaderText(GK_TABLE.numberX, 0, 'Номер', 'right'));
    table.add(this.add.rectangle(24, 18, 360, 2, 0x5f9572, 0.9));
    table.add(this.createCellText(GK_TABLE.roleX, 42, 'GK', 'left', '#f0c95a'));
    table.add(this.createCellText(GK_TABLE.nameX, 42, goalkeeper.name, 'left', '#ffffff'));
    table.add(this.createCellText(GK_TABLE.numberX, 42, String(goalkeeper.shirtNumber), 'right', '#d9eadf'));
  }

  private createSectionTitle(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createHeaderText(
    x: number,
    y: number,
    text: string,
    align: 'left' | 'right'
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        align,
        color: '#9fc5ad',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700'
      })
      .setOrigin(align === 'left' ? 0 : 1, 0.5);
  }

  private createCellText(
    x: number,
    y: number,
    text: string,
    align: 'left' | 'right',
    color: string
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        align,
        color,
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontStyle: '700'
      })
      .setOrigin(align === 'left' ? 0 : 1, 0.5);
  }
}

function getTeam(teamId: string): NationalTeam {
  return NATIONAL_TEAMS.find((team) => team.flagCode === teamId) ?? NATIONAL_TEAMS[0];
}

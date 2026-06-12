import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import { FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import { loadSquad } from '../services/squadStorage';
import type { NationalTeamSquad } from '../data/squadTypes';

const GRID_COLUMNS = 4;
const CARD_WIDTH = 171;
const CARD_HEIGHT = 30;
const GRID_GAP_X = 18;
const GRID_GAP_Y = 6;
const GRID_START_Y = 112;
const LEFT_PANEL_X = 80;
const RIGHT_PANEL_X = 840;
const RIGHT_PANEL_WIDTH = 760;
const RIGHT_PANEL_HEIGHT = 584;
const SQUAD_SECTION_ROW_GAP = 28;

export class SquadSelectScene extends Phaser.Scene {
  private selectedTeamId = NATIONAL_TEAMS[0].flagCode;
  private squad: NationalTeamSquad = loadSquad(this.selectedTeamId);

  public constructor() {
    super('SquadSelectScene');
  }

  public create(): void {
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);

    const centerX = SCENE_WIDTH / 2;
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
      .text(centerX, 74, 'Teams', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const leftGridX = LEFT_PANEL_X;
    this.createBackButton(leftGridX + 22, 60, () => this.scene.start('MenuScene'));
    this.createTeamGrid(leftGridX);
    this.createSquadPanel(RIGHT_PANEL_X, 96);
  }

  private createBackButton(x: number, y: number, onClick: () => void): void {
    const button = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, 44, 38, 0xf0c95a, 1);
    background.setStrokeStyle(2, 0x2d382f);
    const arrow = this.add
      .text(0, -1, '<', {
        align: 'center',
        color: '#1f2a2e',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    button.add([background, arrow]);
    button.setSize(44, 38);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => background.setFillStyle(0xffd978));
    button.on('pointerout', () => background.setFillStyle(0xf0c95a));
    button.on('pointerdown', onClick);
  }

  private createTeamGrid(leftGridX: number): void {
    const startX = leftGridX + CARD_WIDTH / 2;

    NATIONAL_TEAMS.forEach((team, index) => {
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
    const isSelected = team.flagCode === this.selectedTeamId;
    const option = this.add.container(x, y);
    const background = this.add.rectangle(
      0,
      0,
      CARD_WIDTH,
      CARD_HEIGHT,
      isSelected ? 0x1d5b3f : 0x143f2c,
      0.92
    );
    background.setStrokeStyle(2, isSelected ? 0xf0c95a : 0x5f9572, 0.95);

    const flag = this.add.image(-CARD_WIDTH / 2 + 20, 0, getFlagAssetKey(team.flagCode));
    flag.setDisplaySize(28, 20);
    const nameText = this.add
      .text(-CARD_WIDTH / 2 + 44, 0, team.name, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700',
        wordWrap: { width: 110 }
      })
      .setOrigin(0, 0.5);

    option.add([background, flag, nameText]);
    option.setSize(CARD_WIDTH, CARD_HEIGHT);
    option.setInteractive({ useHandCursor: true });
    option.on('pointerover', () => {
      if (!isSelected) {
        background.setFillStyle(0x1d5b3f, 0.95);
      }
    });
    option.on('pointerout', () => {
      if (!isSelected) {
        background.setFillStyle(0x143f2c, 0.92);
      }
    });
    option.on('pointerdown', () => {
      this.selectedTeamId = team.flagCode;
      this.squad = loadSquad(this.selectedTeamId);
      this.render();
    });
  }

  private createSquadPanel(panelX: number, panelY: number): void {
    const panel = this.add.container(panelX, panelY);
    const background = this.add.rectangle(0, 0, RIGHT_PANEL_WIDTH, RIGHT_PANEL_HEIGHT, 0x143f2c, 0.92).setOrigin(0);
    background.setStrokeStyle(2, 0x5f9572, 0.95);

    const team = getTeam(this.selectedTeamId);
    const header = this.add.container(28, 32);
    const flag = this.add.image(0, 0, getFlagAssetKey(team.flagCode));
    flag.setDisplaySize(56, 44);
    flag.setOrigin(0, 0.5);
    const title = this.add
      .text(92, -10, team.name, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
    const subtitle = this.add
      .text(92, 18, 'Team squad', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
    header.add([flag, title, subtitle]);

    const squadTable = this.add.container(28, 110);
    squadTable.add(this.createHeaderText(0, 0, 'Rank', 'left'));
    squadTable.add(this.createHeaderText(92, 0, 'Player', 'left'));
    squadTable.add(this.createHeaderText(RIGHT_PANEL_WIDTH - 84, 0, 'Number', 'right'));
    squadTable.add(this.add.rectangle(0, 24, RIGHT_PANEL_WIDTH - 56, 2, 0x5f9572, 0.9).setOrigin(0, 0));

    const goalkeeperY = 48;
    squadTable.add(this.createCellText(0, goalkeeperY, 'GK', 'left', '#f0c95a'));
    squadTable.add(this.createCellText(92, goalkeeperY, this.squad.goalkeeper.name, 'left', '#ffffff'));
    squadTable.add(this.createCellText(RIGHT_PANEL_WIDTH - 84, goalkeeperY, String(this.squad.goalkeeper.shirtNumber), 'right', '#d9eadf'));

    FIELD_SQUAD_RANKS.forEach((rank, index) => {
      const player = this.squad.fieldPlayers[rank];
      const y = 84 + index * SQUAD_SECTION_ROW_GAP;
      squadTable.add(this.createCellText(0, y, rank, 'left', '#f0c95a'));
      squadTable.add(this.createCellText(92, y, player.name, 'left', '#ffffff'));
      squadTable.add(this.createCellText(RIGHT_PANEL_WIDTH - 84, y, String(player.shirtNumber), 'right', '#d9eadf'));
    });

    panel.add([background, header, squadTable]);
  }

  private createSectionTitle(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createHeaderText(x: number, y: number, text: string, align: 'left' | 'right'): Phaser.GameObjects.Text {
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

  private createCellText(x: number, y: number, text: string, align: 'left' | 'right', color: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        align,
        color,
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700'
      })
      .setOrigin(align === 'left' ? 0 : 1, 0.5);
  }
}

function getTeam(teamId: string): NationalTeam {
  return NATIONAL_TEAMS.find((team) => team.flagCode === teamId) ?? NATIONAL_TEAMS[0];
}

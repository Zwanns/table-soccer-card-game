import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import { Button } from '../ui/Button';

const GRID_COLUMNS = 4;
const CARD_WIDTH = 342;
const CARD_HEIGHT = 30;
const GRID_GAP_X = 18;
const GRID_GAP_Y = 6;
const GRID_START_Y = 112;

export class SquadSelectScene extends Phaser.Scene {
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
      .text(centerX, 74, 'Составы', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createTeamGrid();

    new Button(this, centerX, 674, 'Назад', () => this.scene.start('MenuScene'));
  }

  private createTeamGrid(): void {
    const gridWidth = GRID_COLUMNS * CARD_WIDTH + (GRID_COLUMNS - 1) * GRID_GAP_X;
    const startX = (SCENE_WIDTH - gridWidth) / 2 + CARD_WIDTH / 2;

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
    const option = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0x143f2c, 0.92);
    background.setStrokeStyle(2, 0x5f9572, 0.95);

    const flag = this.add.image(-CARD_WIDTH / 2 + 24, 0, getFlagAssetKey(team.flagCode));
    flag.setDisplaySize(28, 20);
    const nameText = this.add
      .text(-CARD_WIDTH / 2 + 48, 0, team.name, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700',
        wordWrap: { width: 200 }
      })
      .setOrigin(0, 0.5);
    const editText = this.add
      .text(CARD_WIDTH / 2 - 14, 0, 'Открыть', {
        align: 'right',
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: '700'
      })
      .setOrigin(1, 0.5);
    option.add([background, flag, nameText, editText]);
    option.setSize(CARD_WIDTH, CARD_HEIGHT);
    option.setInteractive({ useHandCursor: true });
    option.on('pointerover', () => background.setFillStyle(0x1d5b3f, 0.95));
    option.on('pointerout', () => background.setFillStyle(0x143f2c, 0.92));
    option.on('pointerdown', () => this.scene.start('SquadEditorScene', { teamId: team.flagCode }));
  }
}

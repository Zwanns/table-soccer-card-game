import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import { Button } from '../ui/Button';

type TeamSlot = 1 | 2;

const TEAMS_PER_PAGE = 32;
const DEFAULT_TEAM_ONE = 'France';
const DEFAULT_TEAM_TWO = 'Spain';

export interface TeamSelectionData {
  player1Name: string;
  player2Name: string;
  player1FlagCode: string;
  player2FlagCode: string;
}

export class TeamSelectScene extends Phaser.Scene {
  private selectedTeamOne = DEFAULT_TEAM_ONE;
  private selectedTeamTwo = DEFAULT_TEAM_TWO;
  private activeSlot: TeamSlot = 1;
  private page = 0;
  private message: Phaser.GameObjects.Text | null = null;

  public constructor() {
    super('TeamSelectScene');
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
      .text(centerX, 72, 'Team selection', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createSelectedPanel(370, 126, 'Team 1', this.getSelectedTeam(1), 1);
    this.createSelectedPanel(1230, 126, 'Team 2', this.getSelectedTeam(2), 2);

    this.add
      .text(centerX, 126, 'VS', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createCountryGrid();

    new Button(this, 258, 666, 'Menu', () => this.scene.start('MenuScene'));
    new Button(this, 620, 666, '←', () => this.changePage(-1), { disabled: this.page === 0 });
    this.add
      .text(centerX, 666, `${this.page + 1} / ${maxPage + 1}`, {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    new Button(this, 980, 666, '→', () => this.changePage(1), { disabled: this.page === maxPage });
    new Button(this, 1342, 666, 'Start', () => this.startMatch(), {
      disabled: this.selectedTeamOne === this.selectedTeamTwo
    });
  }

  private createSelectedPanel(x: number, y: number, title: string, team: NationalTeam, slot: TeamSlot): void {
    const isActive = this.activeSlot === slot;
    const panel = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, 440, 82, 0x0b2118, 0.82);
    background.setStrokeStyle(isActive ? 4 : 2, isActive ? 0xf0c95a : 0x5f9572, 0.95);
      const flag = this.add.image(-164, 0, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(64, 46);

    const titleText = this.add
      .text(-116, -20, title, {
        align: 'left',
        color: '#b9d5c3',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
      const teamText = this.add
        .text(-116 + 62, 0, team.name, {
          align: 'left',
          color: slot === 1 ? '#f1d4d6' : '#d9eadf',
          fontFamily: 'Arial, sans-serif',
          fontSize: '26px',
          fontStyle: '700',
          wordWrap: { width: 300 }
        })
        .setOrigin(0, 0.5);

    panel.add([background, flag, titleText, teamText]);
    panel.setSize(440, 82);
    panel.setInteractive({ useHandCursor: true });
    panel.on('pointerdown', () => {
      this.activeSlot = slot;
      this.render();
    });
  }

  private createCountryGrid(): void {
    const pageTeams = NATIONAL_TEAMS.slice(this.page * TEAMS_PER_PAGE, (this.page + 1) * TEAMS_PER_PAGE);
    const columns = 8;
    const buttonWidth = 156;
    const buttonHeight = 58;
    const gapX = 12;
    const gapY = 12;
    const startX = (SCENE_WIDTH - columns * buttonWidth - (columns - 1) * gapX) / 2 + buttonWidth / 2;
    const startY = 216;

    pageTeams.forEach((team, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      this.createCountryOption(
        startX + column * (buttonWidth + gapX),
        startY + row * (buttonHeight + gapY),
        buttonWidth,
        buttonHeight,
        team
      );
    });
  }

  private createCountryOption(x: number, y: number, width: number, height: number, team: NationalTeam): void {
    const isTeamOne = this.selectedTeamOne === team.name;
    const isTeamTwo = this.selectedTeamTwo === team.name;
    const isSelected = isTeamOne || isTeamTwo;
    const option = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, width, height, isSelected ? 0xf0c95a : 0x143f2c, isSelected ? 0.96 : 0.9);
    const strokeColor = isTeamOne ? 0xc43845 : isTeamTwo ? 0xd9eadf : 0x5f9572;
    background.setStrokeStyle(isSelected ? 3 : 2, strokeColor, 0.95);
      const flag = this.add.image(-width / 2 + 18, 0, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(38, 28);

    // Remove ordinal rank numbers from the country option list (UI change)
      const teamText = this.add
        .text(-width / 2 + 48, 0, team.name, {
          align: 'left',
          color: isSelected ? '#1f2a2e' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '17px',
          fontStyle: '700',
          wordWrap: { width: width - 64 }
        })
        .setOrigin(0, 0.5);

    option.add([background, flag, teamText]);
    option.setSize(width, height);
    option.setInteractive({ useHandCursor: true });
    option.on('pointerover', () => {
      if (!isSelected) {
        background.setFillStyle(0x1d5b3f, 0.95);
      }
    });
    option.on('pointerout', () => {
      if (!isSelected) {
        background.setFillStyle(0x143f2c, 0.9);
      }
    });
    option.on('pointerdown', () => this.selectTeam(team.name));
  }

  private selectTeam(teamName: string): void {
    if (this.activeSlot === 1 && teamName === this.selectedTeamTwo) {
      this.showMessage('This team is already selected for Team 2');
      return;
    }

    if (this.activeSlot === 2 && teamName === this.selectedTeamOne) {
      this.showMessage('This team is already selected for Team 1');
      return;
    }

    if (this.activeSlot === 1) {
      this.selectedTeamOne = teamName;
      this.activeSlot = 2;
    } else {
      this.selectedTeamTwo = teamName;
      this.activeSlot = 1;
    }

    this.render();
  }

  private changePage(direction: -1 | 1): void {
    this.page = Phaser.Math.Clamp(this.page + direction, 0, getMaxPage());
    this.render();
  }

  private startMatch(): void {
    const data: TeamSelectionData = {
      player1Name: this.selectedTeamOne,
      player2Name: this.selectedTeamTwo,
      player1FlagCode: this.getSelectedTeam(1).flagCode,
      player2FlagCode: this.getSelectedTeam(2).flagCode
    };

    this.scene.start('GameScene', data);
  }

  private showMessage(text: string): void {
    this.message?.destroy();
    this.message = this.add
      .text(SCENE_WIDTH / 2, 602, text, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700',
        stroke: '#123b2a',
        strokeThickness: 4
      })
      .setOrigin(0.5);

    this.time.delayedCall(1200, () => {
      this.message?.destroy();
      this.message = null;
    });
  }

  private getSelectedTeam(slot: TeamSlot): NationalTeam {
    const teamName = slot === 1 ? this.selectedTeamOne : this.selectedTeamTwo;
    return NATIONAL_TEAMS.find((team) => team.name === teamName) ?? NATIONAL_TEAMS[0];
  }
}

function getMaxPage(): number {
  return Math.ceil(NATIONAL_TEAMS.length / TEAMS_PER_PAGE) - 1;
}

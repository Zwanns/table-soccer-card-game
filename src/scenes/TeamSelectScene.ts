import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import type { TournamentMatchResult } from '../tournament';
import { Button } from '../ui/Button';

type TeamSlot = 1 | 2;

const DEFAULT_TEAM_ONE = 'France';
const DEFAULT_TEAM_TWO = 'Spain';
const TEAM_GRID_COLUMNS = 8;
const TEAM_BUTTON_WIDTH = 156;
const TEAM_BUTTON_HEIGHT = 42;
const TEAM_GRID_GAP_X = 12;
const TEAM_GRID_GAP_Y = 8;
const TEAM_GRID_START_Y = 206;

export interface TeamSelectionData {
  player1Name: string;
  player2Name: string;
  player1FlagCode: string;
  player2FlagCode: string;
}

interface TeamSelectSceneData {
  mode?: 'match' | 'penalty';
}

export class TeamSelectScene extends Phaser.Scene {
  private selectedTeamOne = DEFAULT_TEAM_ONE;
  private selectedTeamTwo = DEFAULT_TEAM_TWO;
  private activeSlot: TeamSlot = 1;
  private message: Phaser.GameObjects.Text | null = null;
  private mode: TeamSelectSceneData['mode'] = 'match';

  public constructor() {
    super('TeamSelectScene');
  }

  public init(data: TeamSelectSceneData = {}): void {
    this.mode = data.mode ?? 'match';
    this.selectedTeamOne = DEFAULT_TEAM_ONE;
    this.selectedTeamTwo = DEFAULT_TEAM_TWO;
    this.activeSlot = 1;
    this.message = null;
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
      .text(centerX, 72, this.mode === 'penalty' ? 'Penalty teams' : 'Team selection', {
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
    new Button(this, 1342, 666, this.mode === 'penalty' ? 'Start penalties' : 'Start', () => this.startMatch(), {
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
    const startX =
      (SCENE_WIDTH - TEAM_GRID_COLUMNS * TEAM_BUTTON_WIDTH - (TEAM_GRID_COLUMNS - 1) * TEAM_GRID_GAP_X) / 2 +
      TEAM_BUTTON_WIDTH / 2;

    NATIONAL_TEAMS.forEach((team, index) => {
      const column = index % TEAM_GRID_COLUMNS;
      const row = Math.floor(index / TEAM_GRID_COLUMNS);
      this.createCountryOption(
        startX + column * (TEAM_BUTTON_WIDTH + TEAM_GRID_GAP_X),
        TEAM_GRID_START_Y + row * (TEAM_BUTTON_HEIGHT + TEAM_GRID_GAP_Y),
        TEAM_BUTTON_WIDTH,
        TEAM_BUTTON_HEIGHT,
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
      flag.setDisplaySize(32, 24);

    // Remove ordinal rank numbers from the country option list (UI change)
      const teamText = this.add
        .text(-width / 2 + 48, 0, team.name, {
          align: 'left',
          color: isSelected ? '#1f2a2e' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
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

  private startMatch(): void {
    const data: TeamSelectionData = {
      player1Name: this.selectedTeamOne,
      player2Name: this.selectedTeamTwo,
      player1FlagCode: this.getSelectedTeam(1).flagCode,
      player2FlagCode: this.getSelectedTeam(2).flagCode
    };

    if (this.mode === 'penalty') {
      this.scene.start('TournamentPenaltyScene', {
        standalone: true,
        matchResult: createStandalonePenaltyMatchResult(data)
      });
      return;
    }

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

function createStandalonePenaltyMatchResult(selection: TeamSelectionData): TournamentMatchResult {
  return {
    matchId: `standalone-penalty-${selection.player1FlagCode}-${selection.player2FlagCode}`,
    homeTeamId: selection.player1FlagCode,
    awayTeamId: selection.player2FlagCode,
    homeGoals: 0,
    awayGoals: 0,
    teamStats: {
      home: {
        teamId: selection.player1FlagCode,
        goals: 0,
        shots: 0,
        goalkeeperSaves: 0
      },
      away: {
        teamId: selection.player2FlagCode,
        goals: 0,
        shots: 0,
        goalkeeperSaves: 0
      }
    },
    playerStats: []
  };
}

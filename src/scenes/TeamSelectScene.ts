import Phaser from 'phaser';
import type { PlayerControllerType } from '../ai';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import type { TournamentMatchResult } from '../tournament';
import { Button } from '../ui/Button';
import { createTeamSelectLayout, type TeamSelectLayout } from '../ui/teamScreenLayout';
import { setTouchFriendlyInteractive } from '../ui/touchInput';

type TeamSlot = 1 | 2;

const DEFAULT_TEAM_ONE = 'France';
const DEFAULT_TEAM_TWO = 'Spain';
export const DEFAULT_QUICK_MATCH_CONTROLLER_TYPE: PlayerControllerType = 'HUMAN';

export function toggleQuickMatchControllerType(controllerType: PlayerControllerType): PlayerControllerType {
  return controllerType === 'AI' ? 'HUMAN' : 'AI';
}

export interface TeamSelectionData {
  player1Name: string;
  player2Name: string;
  player1FlagCode: string;
  player2FlagCode: string;
  player1ControllerType: PlayerControllerType;
  player2ControllerType: PlayerControllerType;
}

interface TeamSelectSceneData {
  mode?: 'match' | 'penalty';
}

export class TeamSelectScene extends Phaser.Scene {
  private selectedTeamOne = DEFAULT_TEAM_ONE;
  private selectedTeamTwo = DEFAULT_TEAM_TWO;
  private player1ControllerType: PlayerControllerType = DEFAULT_QUICK_MATCH_CONTROLLER_TYPE;
  private player2ControllerType: PlayerControllerType = DEFAULT_QUICK_MATCH_CONTROLLER_TYPE;
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
    this.player1ControllerType = DEFAULT_QUICK_MATCH_CONTROLLER_TYPE;
    this.player2ControllerType = DEFAULT_QUICK_MATCH_CONTROLLER_TYPE;
    this.activeSlot = 1;
    this.message = null;
  }

  public create(): void {
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);

    const layout = this.getTeamSelectLayout();

    this.add.rectangle(layout.scene.centerX, layout.scene.centerY, SCENE_WIDTH, SCENE_HEIGHT, 0x123b2a);
    this.add
      .text(layout.scene.centerX, layout.title.y, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.title.fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add
      .text(layout.scene.centerX, layout.subtitle.y, this.mode === 'penalty' ? 'Penalty teams' : 'Team selection', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.subtitle.fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createSelectedPanel(layout.selectedPanels.playerOneX, layout.selectedPanels.y, 'Team 1', this.getSelectedTeam(1), 1, layout);
    this.createSelectedPanel(layout.selectedPanels.playerTwoX, layout.selectedPanels.y, 'Team 2', this.getSelectedTeam(2), 2, layout);

    this.add
      .text(layout.versus.x, layout.versus.y, 'VS', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createCountryGrid(layout);

    new Button(this, layout.actions.backX, layout.actions.y, 'Menu', () => this.scene.start('MenuScene'));
    new Button(this, layout.actions.startX, layout.actions.y, this.mode === 'penalty' ? 'Start penalties' : 'Start', () => this.startMatch(), {
      disabled: this.selectedTeamOne === this.selectedTeamTwo
    });
  }

  private getTeamSelectLayout(): TeamSelectLayout {
    return createTeamSelectLayout({
      width: this.scale.displaySize.width || this.scale.width,
      height: this.scale.displaySize.height || this.scale.height
    });
  }

  private createSelectedPanel(
    x: number,
    y: number,
    title: string,
    team: NationalTeam,
    slot: TeamSlot,
    layout: TeamSelectLayout
  ): void {
    const isActive = this.activeSlot === slot;
    const panel = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, layout.selectedPanels.width, layout.selectedPanels.height, 0x0b2118, 0.82);
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
    this.addAiCheckbox(panel, layout.selectedPanels.aiCheckboxX, layout.selectedPanels.aiCheckboxY, slot);
    panel.setSize(layout.selectedPanels.width, layout.selectedPanels.height);
    setTouchFriendlyInteractive(panel, layout.selectedPanels.width, layout.selectedPanels.height);
    panel.on('pointerdown', () => {
      this.activeSlot = slot;
      this.render();
    });
  }

  private createCountryGrid(layout: TeamSelectLayout): void {
    const { grid } = layout;
    const content = this.add.container(0, 0);
    const contentWidth = grid.columns * grid.buttonWidth + (grid.columns - 1) * grid.gapX;
    const startX = (SCENE_WIDTH - contentWidth) / 2 + grid.buttonWidth / 2;
    const rowCount = Math.ceil(NATIONAL_TEAMS.length / grid.columns);
    const contentBottom = grid.startY + (rowCount - 1) * (grid.buttonHeight + grid.gapY) + grid.buttonHeight / 2;
    const maxScroll = Math.max(0, contentBottom - (grid.viewport.y + grid.viewport.height));
    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(grid.viewport.x, grid.viewport.y, grid.viewport.width, grid.viewport.height)
      .createGeometryMask();
    let scrollY = 0;
    let dragPointerId: number | null = null;
    let lastDragY = 0;
    let dragDistance = 0;

    const setScroll = (value: number): void => {
      scrollY = Phaser.Math.Clamp(value, 0, maxScroll);
      content.y = -scrollY;
    };
    const beginDrag = (pointer: Phaser.Input.Pointer): void => {
      dragPointerId = pointer.id;
      lastDragY = pointer.y;
      dragDistance = 0;
    };
    const updateDrag = (pointer: Phaser.Input.Pointer): void => {
      if (dragPointerId !== pointer.id || !pointer.isDown || maxScroll <= 0) {
        return;
      }

      const deltaY = lastDragY - pointer.y;
      dragDistance += Math.abs(deltaY);
      setScroll(scrollY + deltaY);
      lastDragY = pointer.y;
    };
    const finishDrag = (pointer: Phaser.Input.Pointer, onTap?: () => void): void => {
      if (dragPointerId !== pointer.id) {
        return;
      }

      const shouldTap = dragDistance < 8;
      dragPointerId = null;
      dragDistance = 0;

      if (shouldTap) {
        onTap?.();
      }
    };

    maskGraphics.setVisible(false);
    content.setMask(mask);
    content.once(Phaser.GameObjects.Events.DESTROY, () => maskGraphics.destroy());

    NATIONAL_TEAMS.forEach((team, index) => {
      const column = index % grid.columns;
      const row = Math.floor(index / grid.columns);
      content.add(
        this.createCountryOption(
          startX + column * (grid.buttonWidth + grid.gapX),
          grid.startY + row * (grid.buttonHeight + grid.gapY),
          grid.buttonWidth,
          grid.buttonHeight,
          team,
          {
            onPointerDown: beginDrag,
            onPointerMove: updateDrag,
            onPointerUp: (pointer) => finishDrag(pointer, () => this.selectTeam(team.name)),
            onWheel: (deltaY) => setScroll(scrollY + deltaY * 0.35)
          }
        )
      );
    });

    const scrollZone = this.add
      .zone(
        grid.viewport.x + grid.viewport.width / 2,
        grid.viewport.y + grid.viewport.height / 2,
        grid.viewport.width,
        grid.viewport.height
      )
      .setInteractive();
    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => setScroll(scrollY + deltaY * 0.35));
    scrollZone.on('pointerdown', beginDrag);
    scrollZone.on('pointermove', updateDrag);
    scrollZone.on('pointerup', (pointer: Phaser.Input.Pointer) => finishDrag(pointer));
    scrollZone.on('pointerout', (pointer: Phaser.Input.Pointer) => finishDrag(pointer));
    scrollZone.setDepth(-1);
  }

  private createCountryOption(
    x: number,
    y: number,
    width: number,
    height: number,
    team: NationalTeam,
    handlers: {
      onPointerDown: (pointer: Phaser.Input.Pointer) => void;
      onPointerMove: (pointer: Phaser.Input.Pointer) => void;
      onPointerUp: (pointer: Phaser.Input.Pointer) => void;
      onWheel: (deltaY: number) => void;
    }
  ): Phaser.GameObjects.Container {
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
    setTouchFriendlyInteractive(option, width, height);
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
    option.on('pointerdown', (pointer: Phaser.Input.Pointer) => handlers.onPointerDown(pointer));
    option.on('pointermove', (pointer: Phaser.Input.Pointer) => handlers.onPointerMove(pointer));
    option.on('pointerup', (pointer: Phaser.Input.Pointer) => handlers.onPointerUp(pointer));
    option.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => handlers.onWheel(deltaY));

    return option;
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

  private addAiCheckbox(parent: Phaser.GameObjects.Container, x: number, y: number, slot: TeamSlot): void {
    const controllerType = this.getControllerType(slot);
    const isAi = controllerType === 'AI';
    const checkbox = this.add.container(x, y);
    const box = this.add.rectangle(0, 0, 20, 20, isAi ? 0xf0c95a : 0x143f2c, isAi ? 1 : 0.92);
    box.setStrokeStyle(2, isAi ? 0xf0c95a : 0x5f9572, 0.98);

    const check = this.add
      .text(0, -1, isAi ? 'X' : '', {
        align: 'center',
        color: '#123b2a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const label = this.add
      .text(18, 0, 'AI', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);

    checkbox.add([box, check, label]);
    checkbox.setSize(58, 28);
    setTouchFriendlyInteractive(checkbox, 58, 28);
    checkbox.on(
      'pointerdown',
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();
        this.toggleControllerType(slot);
      }
    );
    checkbox.on('pointerover', () => {
      box.setStrokeStyle(2, 0xffd978, 1);
    });
    checkbox.on('pointerout', () => {
      box.setStrokeStyle(2, isAi ? 0xf0c95a : 0x5f9572, 0.98);
    });

    parent.add(checkbox);
  }

  private toggleControllerType(slot: TeamSlot): void {
    if (slot === 1) {
      this.player1ControllerType = toggleQuickMatchControllerType(this.player1ControllerType);
    } else {
      this.player2ControllerType = toggleQuickMatchControllerType(this.player2ControllerType);
    }

    this.render();
  }

  private getControllerType(slot: TeamSlot): PlayerControllerType {
    return slot === 1 ? this.player1ControllerType : this.player2ControllerType;
  }

  private startMatch(): void {
    const data: TeamSelectionData = {
      player1Name: this.selectedTeamOne,
      player2Name: this.selectedTeamTwo,
      player1FlagCode: this.getSelectedTeam(1).flagCode,
      player2FlagCode: this.getSelectedTeam(2).flagCode,
      player1ControllerType: this.player1ControllerType,
      player2ControllerType: this.player2ControllerType
    };

    if (this.mode === 'penalty') {
      this.scene.start('TournamentPenaltyScene', {
        standalone: true,
        matchResult: createStandalonePenaltyMatchResult(data),
        player1ControllerType: data.player1ControllerType,
        player2ControllerType: data.player2ControllerType
      });
      return;
    }

    this.scene.start('GameScene', data);
  }

  private showMessage(text: string): void {
    this.message?.destroy();
    this.message = this.add
      .text(SCENE_WIDTH / 2, this.getTeamSelectLayout().message.y, text, {
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

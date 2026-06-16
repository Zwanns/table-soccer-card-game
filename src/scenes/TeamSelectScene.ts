import Phaser from 'phaser';
import { resolveTeamCoverLoadResult } from '../assets/teamCover';
import type { PlayerControllerType } from '../ai';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { FALLBACK_TEAM_KIT_ASSET, getTeamKitAssetKey } from '../data/teamKits';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import type { TournamentMatchResult } from '../tournament';
import { Button } from '../ui/Button';
import { CardView } from '../ui/CardView';
import {
  createTeamScreenLayout,
  rectCenter,
  type TeamScreenRect,
  TEAM_SCREEN_GRID_COLUMNS,
  TEAM_SCREEN_GRID_GAP_X,
  TEAM_SCREEN_GRID_GAP_Y,
  TEAM_SCREEN_GRID_START_Y,
  TEAM_SCREEN_TEAM_BUTTON_HEIGHT,
  TEAM_SCREEN_TEAM_BUTTON_WIDTH
} from '../ui/teamScreenLayout';

type TeamSlot = 1 | 2;

const DEFAULT_TEAM_ONE = 'France';
const DEFAULT_TEAM_TWO = 'Spain';
const TEAM_GRID_COLUMNS = TEAM_SCREEN_GRID_COLUMNS;
const TEAM_BUTTON_WIDTH = TEAM_SCREEN_TEAM_BUTTON_WIDTH;
const TEAM_BUTTON_HEIGHT = TEAM_SCREEN_TEAM_BUTTON_HEIGHT;
const TEAM_GRID_GAP_X = TEAM_SCREEN_GRID_GAP_X;
const TEAM_GRID_GAP_Y = TEAM_SCREEN_GRID_GAP_Y;
const TEAM_GRID_START_Y = TEAM_SCREEN_GRID_START_Y;
const SELECTED_COVER_FAN_CARD_COUNT = 3;
const SELECTED_COVER_FAN_CARD_SCALE = 0.36;
const SELECTED_COVER_FAN_OFFSETS = [-22, 0, 22] as const;
const SELECTED_COVER_FAN_ANGLES = [-9, 0, 9] as const;
const SELECTED_PANEL_LABEL_OFFSET_Y = 16;
const CONTROLLER_TOGGLE_WIDTH = 90;
const CONTROLLER_TOGGLE_HEIGHT = 22;
const CONTROLLER_TOGGLE_INSET_X = 8;
const CONTROLLER_TOGGLE_INSET_Y = 8;
const TEAM_GRID_VIEWPORT_TOP = 210;
const TEAM_GRID_VIEWPORT_HEIGHT = 360;export const DEFAULT_QUICK_MATCH_CONTROLLER_TYPE: PlayerControllerType = 'HUMAN';

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

    const centerX = SCENE_WIDTH / 2;
    const layout = createTeamScreenLayout();

    this.createTeamSelectFieldBackground();

    this.add
      .text(centerX, 34, this.mode === 'penalty' ? 'Penalty teams' : 'Team selection', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createSelectedPanel(layout.team1SelectedCardRect, layout.team1CoverFanRect, 'Team 1', this.getSelectedTeam(1), 1);
    this.createSelectedPanel(layout.team2SelectedCardRect, layout.team2CoverFanRect, 'Team 2', this.getSelectedTeam(2), 2);
    this.createTeamKitPreview(layout.team1KitPreviewRect, this.getSelectedTeam(1));
    this.createTeamKitPreview(layout.team2KitPreviewRect, this.getSelectedTeam(2));

    this.add
      .text(layout.vsPosition.x, layout.vsPosition.y, 'VS', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createCountryGrid(layout.teamGridRect);

    const menuCenter = rectCenter(layout.menuButtonRect);
    const startCenter = rectCenter(layout.startButtonRect);
    new Button(this, menuCenter.x, menuCenter.y, 'Menu', () => this.scene.start('MenuScene'), {
      width: layout.menuButtonRect.width,
      height: layout.menuButtonRect.height
    });
    new Button(
      this,
      startCenter.x,
      startCenter.y,
      this.mode === 'penalty' ? 'Start penalties' : 'Start',
      () => this.startMatch(),
      {
        disabled: this.selectedTeamOne === this.selectedTeamTwo,
        width: layout.startButtonRect.width,
        height: layout.startButtonRect.height
      }
    );
  }

  private createSelectedPanel(
    rect: TeamScreenRect,
    coverFanRect: TeamScreenRect,
    title: string,
    team: NationalTeam,
    slot: TeamSlot
  ): void {
    const isActive = this.activeSlot === slot;
    const center = rectCenter(rect);
    const coverFanCenter = rectCenter(coverFanRect);
    const coverTextureKey = resolveTeamCoverLoadResult(this.textures, team.flagCode).textureKey;
    const panel = this.add.container(center.x, center.y);
    const background = this.add.rectangle(0, 0, rect.width, rect.height, 0x0b2118, 0.82);
    background.setStrokeStyle(isActive ? 4 : 2, isActive ? 0xf0c95a : 0x5f9572, 0.95);
    const fan = this.createSelectedTeamCoverFan(coverFanCenter.x - center.x, coverFanCenter.y - center.y, coverTextureKey);
    const textX = coverFanRect.x + coverFanRect.width - center.x + 18;

    const slotLabel = this.add
      .text(rect.x, rect.y - SELECTED_PANEL_LABEL_OFFSET_Y, title, {
        align: 'left',
        color: '#b9d5c3',
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
    const teamText = this.add
      .text(textX, 0, team.name, {
        align: 'left',
        color: slot === 1 ? '#f1d4d6' : '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        fontStyle: '700',
        wordWrap: { width: 260 }
      })
      .setOrigin(0, 0.5);

    panel.add([background, fan, teamText]);
    slotLabel.setDepth(1);
    this.addControllerToggle(
      panel,
      rect.width / 2 - CONTROLLER_TOGGLE_WIDTH / 2 - CONTROLLER_TOGGLE_INSET_X,
      rect.height / 2 - CONTROLLER_TOGGLE_HEIGHT / 2 - CONTROLLER_TOGGLE_INSET_Y,
      slot
    );
    panel.setSize(rect.width, rect.height);
    panel.setInteractive({ useHandCursor: true });
    panel.on('pointerdown', () => {
      this.activeSlot = slot;
      this.render();
    });
  }

  private createSelectedTeamCoverFan(x: number, y: number, coverTextureKey: string): Phaser.GameObjects.Container {
    const fan = this.add.container(x, y);

    for (let index = 0; index < SELECTED_COVER_FAN_CARD_COUNT; index += 1) {
      const card = new CardView(this, SELECTED_COVER_FAN_OFFSETS[index], 0, {
        faceDown: true,
        faceDownVariant: 'preview',
        rank: '',
        coverTextureKey,
        tooltipEnabled: false
      });
      card.setScale(SELECTED_COVER_FAN_CARD_SCALE);
      card.setAngle(SELECTED_COVER_FAN_ANGLES[index]);
      fan.add(card);
    }

    return fan;
  }

  private createTeamKitPreview(rect: TeamScreenRect, team: NationalTeam): void {
    const center = rectCenter(rect);
    const textureKey = getTeamKitAssetKey(team.flagCode);
    const fallbackTextureKey = FALLBACK_TEAM_KIT_ASSET.assetKey;
    const kitTextureKey = this.textures.exists(textureKey) ? textureKey : fallbackTextureKey;
    const background = this.add.graphics();

    background.fillStyle(0xffffff, 0.96);
    background.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 8);
    background.lineStyle(2, 0x1f2a2e, 0.8);
    background.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 8);

    if (this.textures.exists(kitTextureKey)) {
      const kit = this.add.image(center.x, center.y, kitTextureKey);
      kit.setDisplaySize(rect.width - 14, rect.height - 10);
    }
  }

  private createCountryGrid(gridRect: TeamScreenRect): void {
    const content = this.add.container(0, TEAM_GRID_VIEWPORT_TOP);
    const viewportLeft = gridRect.x;
    const viewportWidth = gridRect.width;
    const rowHeight = TEAM_BUTTON_HEIGHT + TEAM_GRID_GAP_Y;
    const rowCount = Math.ceil(NATIONAL_TEAMS.length / TEAM_GRID_COLUMNS);
    const contentHeight = rowCount * rowHeight - TEAM_GRID_GAP_Y;
    const maxScroll = Math.max(0, contentHeight - TEAM_GRID_VIEWPORT_HEIGHT);
    let teamGridScrollY = 0;

    const setScroll = (value: number): void => {
      teamGridScrollY = Phaser.Math.Clamp(value, 0, maxScroll);
      content.y = TEAM_GRID_VIEWPORT_TOP - teamGridScrollY;
    };

    const startX = gridRect.x + TEAM_BUTTON_WIDTH / 2;

    NATIONAL_TEAMS.forEach((team, index) => {
      const column = index % TEAM_GRID_COLUMNS;
      const row = Math.floor(index / TEAM_GRID_COLUMNS);
      const option = this.createCountryOption(
        startX + column * (TEAM_BUTTON_WIDTH + TEAM_GRID_GAP_X),
        TEAM_BUTTON_HEIGHT / 2 + row * rowHeight,
        TEAM_BUTTON_WIDTH,
        TEAM_BUTTON_HEIGHT,
        team
      );

      option.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
        setScroll(teamGridScrollY + deltaY * 0.35);
      });
      content.add(option);
    });

    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(viewportLeft, TEAM_GRID_VIEWPORT_TOP, viewportWidth, TEAM_GRID_VIEWPORT_HEIGHT)
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZone = this.add
      .zone(viewportLeft + viewportWidth / 2, TEAM_GRID_VIEWPORT_TOP + TEAM_GRID_VIEWPORT_HEIGHT / 2, viewportWidth, TEAM_GRID_VIEWPORT_HEIGHT)
      .setInteractive({ useHandCursor: maxScroll > 0 })
      .setDepth(-10);

    setScroll(teamGridScrollY);
    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(teamGridScrollY + deltaY * 0.35);
    });

    if (maxScroll > 0) {
      const trackX = viewportLeft + viewportWidth + 12;
      const track = this.add.rectangle(trackX, TEAM_GRID_VIEWPORT_TOP + TEAM_GRID_VIEWPORT_HEIGHT / 2, 4, TEAM_GRID_VIEWPORT_HEIGHT, 0x5f9572, 0.28);
      const thumbHeight = Math.max(28, (TEAM_GRID_VIEWPORT_HEIGHT / contentHeight) * TEAM_GRID_VIEWPORT_HEIGHT);
      const thumb = this.add.rectangle(trackX, TEAM_GRID_VIEWPORT_TOP + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);

      const updateThumb = (): void => {
        thumb.y = TEAM_GRID_VIEWPORT_TOP + thumbHeight / 2 + (teamGridScrollY / maxScroll) * (TEAM_GRID_VIEWPORT_HEIGHT - thumbHeight);
      };

      updateThumb();
      this.events.on(Phaser.Scenes.Events.UPDATE, updateThumb);
      content.once(Phaser.GameObjects.Events.DESTROY, () => {
        this.events.off(Phaser.Scenes.Events.UPDATE, updateThumb);
      });
    }
  }

  private createCountryOption(x: number, y: number, width: number, height: number, team: NationalTeam): Phaser.GameObjects.Container {
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

  private addControllerToggle(parent: Phaser.GameObjects.Container, x: number, y: number, slot: TeamSlot): void {
    const controllerType = this.getControllerType(slot);
    const isAi = controllerType === 'AI';
    const toggle = this.add.container(x, y);
    const width = CONTROLLER_TOGGLE_WIDTH;
    const height = CONTROLLER_TOGGLE_HEIGHT;
    const segmentWidth = width / 2;
    const background = this.add.rectangle(0, 0, width, height, 0x143f2c, 0.92);
    const activeSegment = this.add.rectangle(isAi ? segmentWidth / 2 : -segmentWidth / 2, 0, segmentWidth - 4, height - 4, 0xf0c95a, 1);
    const playerLabel = this.add
      .text(-segmentWidth / 2, 0, 'Player', {
        align: 'center',
        color: isAi ? '#d9eadf' : '#1f2a2e',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const aiLabel = this.add
      .text(segmentWidth / 2, 0, 'AI', {
        align: 'center',
        color: isAi ? '#1f2a2e' : '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    background.setStrokeStyle(2, isAi ? 0xf0c95a : 0x5f9572, 0.98);
    toggle.add([background, activeSegment, playerLabel, aiLabel]);
    toggle.setSize(width, height);
    toggle.setInteractive({ useHandCursor: true });
    toggle.on(
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
    toggle.on('pointerover', () => {
      background.setStrokeStyle(2, 0xffd978, 1);
    });
    toggle.on('pointerout', () => {
      background.setStrokeStyle(2, isAi ? 0xf0c95a : 0x5f9572, 0.98);
    });

    parent.add(toggle);
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

  private createTeamSelectFieldBackground(): void {
    const graphics = this.add.graphics();
    const stripeCount = 14;
    const stripeWidth = SCENE_WIDTH / stripeCount;
    const lineColor = 0xe5fff0;

    graphics.fillStyle(0x0f3425, 1);
    graphics.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);

    for (let index = 0; index < stripeCount; index += 1) {
      graphics.fillStyle(index % 2 === 0 ? 0x123b2a : 0x174530, 1);
      graphics.fillRect(index * stripeWidth, 0, stripeWidth + 1, SCENE_HEIGHT);
    }

    graphics.lineStyle(3, lineColor, 0.24);
    graphics.strokeRect(56, 94, SCENE_WIDTH - 112, SCENE_HEIGHT - 158);
    graphics.lineBetween(SCENE_WIDTH / 2, 94, SCENE_WIDTH / 2, SCENE_HEIGHT - 64);
    graphics.strokeCircle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2 + 20, 120);
    graphics.strokeCircle(SCENE_WIDTH / 2, SCENE_HEIGHT / 2 + 20, 5);
    graphics.strokeRect(56, 212, 166, 250);
    graphics.strokeRect(SCENE_WIDTH - 222, 212, 166, 250);
    graphics.strokeRect(56, 272, 66, 130);
    graphics.strokeRect(SCENE_WIDTH - 122, 272, 66, 130);
    graphics.setDepth(-20);
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

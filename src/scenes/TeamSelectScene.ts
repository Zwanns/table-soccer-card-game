import Phaser from 'phaser';
import { resolveTeamCoverLoadResult } from '../assets/teamCover';
import type { PlayerControllerType } from '../ai';
import { MENU_ASSETS, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { FALLBACK_TEAM_KIT_ASSET, getTeamKitAssetKey } from '../data/teamKits';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import type { TournamentMatchResult } from '../tournament';
import { Button } from '../ui/Button';
import { CardView } from '../ui/CardView';
import {
  SCOREBOARD_BACKGROUND_ALPHA,
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_BORDER_COLOR,
  SCOREBOARD_TEXT_COLOR
} from '../ui/scoreboardStyle';
import { createTeamFieldBackground } from '../ui/teamFieldBackground';
import { createDragScrollArea, TOUCH_SCROLL_WHEEL_FACTOR, clampScroll } from '../ui/touchInput';
import {
  createTeamScreenLayout,
  rectCenter,
  type TeamScreenControllerToggleLayout,
  type TeamScreenLayout,
  type TeamScreenRect
} from '../ui/teamScreenLayout';

type TeamSlot = 1 | 2;

const DEFAULT_TEAM_ONE = 'France';
const DEFAULT_TEAM_TWO = 'Spain';
const TEAM_BUTTON_VISUAL_HEIGHT_OFFSET = 6;
const SELECTED_COVER_FAN_CARD_COUNT = 3;
const SELECTED_COVER_FAN_CARD_SCALE = 0.56;
const SELECTED_COVER_FAN_MOBILE_CARD_SCALE = 0.5;
const SELECTED_COVER_FAN_OFFSETS = [-34, 0, 34] as const;
const SELECTED_COVER_FAN_MOBILE_OFFSETS = [-30, 0, 30] as const;
const SELECTED_COVER_FAN_ANGLES = [-9, 0, 9] as const;
const SELECTED_PANEL_LABEL_OFFSET_Y = 16;
const TEAM_GRID_VIEWPORT_TOP = 210;
const TEAM_GRID_VIEWPORT_HEIGHT = 360;
const TEAM_SELECTION_METAL_BORDER_COLOR = 0x8f9a96;
const TEAM_SELECTION_METAL_BORDER_ALPHA = 0.95;
const TEAM_SELECTION_TOGGLE_ACTIVE_COLOR = SCOREBOARD_BORDER_COLOR;
const TEAM_SELECTION_TOGGLE_ACTIVE_TEXT_COLOR = '#1f2a2e';
const TEAM_OPTION_BACKGROUND_ALPHA = SCOREBOARD_BACKGROUND_ALPHA;
const TEAM_OPTION_ACTIVE_BACKGROUND_ALPHA = 0.98;
const TEAM_OPTION_FLAG_WIDTH = 36;
const TEAM_OPTION_FLAG_HEIGHT = 27;
const TEAM_OPTION_FLAG_PADDING_X = 11;
const TEAM_OPTION_TEXT_GAP_X = 12;
const TEAM_OPTION_TEXT_RIGHT_PADDING_X = 8;

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

    this.createSelectedPanel(
      layout.team1SelectedCardRect,
      layout.team1CoverFanRect,
      layout.team1ControllerToggleRect,
      layout,
      'Player 1',
      this.getSelectedTeam(1),
      1
    );
    this.createSelectedPanel(
      layout.team2SelectedCardRect,
      layout.team2CoverFanRect,
      layout.team2ControllerToggleRect,
      layout,
      'Player 2',
      this.getSelectedTeam(2),
      2
    );
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

    this.createCountryGrid(layout.teamGridRect, layout);

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
    controllerToggleRect: TeamScreenRect,
    layout: TeamScreenLayout,
    title: string,
    team: NationalTeam,
    slot: TeamSlot
  ): void {
    const isActive = this.activeSlot === slot;
    const center = rectCenter(rect);
    const coverFanCenter = rectCenter(coverFanRect);
    const coverTextureKey = resolveTeamCoverLoadResult(this.textures, team.flagCode).textureKey;
    const panel = this.add.container(center.x, center.y);
    const background = this.add.rectangle(0, 0, rect.width, rect.height, SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA);
    background.setStrokeStyle(isActive ? 4 : 2, TEAM_SELECTION_METAL_BORDER_COLOR, TEAM_SELECTION_METAL_BORDER_ALPHA);
    const fan = this.createSelectedTeamCoverFan(
      coverFanCenter.x - center.x,
      coverFanCenter.y - center.y,
      coverTextureKey,
      layout.mobileWide
    );
    const textX = coverFanRect.x + coverFanRect.width - center.x + 18;
    const textWidth = layout.mobileWide
      ? Math.max(160, controllerToggleRect.x - (center.x + textX) - 14)
      : 260;
    const controllerToggleCenter = rectCenter(controllerToggleRect);

    const slotLabel = this.add
      .text(rect.x + rect.width, rect.y - SELECTED_PANEL_LABEL_OFFSET_Y, title, {
        align: 'right',
        color: SCOREBOARD_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontStyle: '700'
      })
      .setOrigin(1, 0.5);
    const teamText = this.add
      .text(textX, 0, team.name, {
        align: 'left',
        color: SCOREBOARD_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        fontStyle: '700',
        wordWrap: { width: textWidth }
      })
      .setOrigin(0, 0.5);

    panel.add([background, fan, teamText]);
    slotLabel.setDepth(1);
    this.addControllerToggle(
      panel,
      controllerToggleCenter.x - center.x,
      controllerToggleCenter.y - center.y,
      slot,
      layout.controllerToggle
    );
    panel.setSize(rect.width, rect.height);
    panel.setInteractive({ useHandCursor: true });
    panel.on('pointerdown', () => {
      this.activeSlot = slot;
      this.render();
    });
  }

  private createSelectedTeamCoverFan(
    x: number,
    y: number,
    coverTextureKey: string,
    mobileWide: boolean
  ): Phaser.GameObjects.Container {
    const fan = this.add.container(x, y);
    const cardScale = mobileWide ? SELECTED_COVER_FAN_MOBILE_CARD_SCALE : SELECTED_COVER_FAN_CARD_SCALE;
    const cardOffsets = mobileWide ? SELECTED_COVER_FAN_MOBILE_OFFSETS : SELECTED_COVER_FAN_OFFSETS;

    for (let index = 0; index < SELECTED_COVER_FAN_CARD_COUNT; index += 1) {
      const card = new CardView(this, cardOffsets[index], 0, {
        faceDown: true,
        faceDownVariant: 'preview',
        rank: '',
        coverTextureKey,
        tooltipEnabled: false
      });
      card.setScale(cardScale);
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

  private createCountryGrid(gridRect: TeamScreenRect, layout: TeamScreenLayout): void {
    const viewportTop = layout.teamGridStartY;
    const teamButtonHeight = layout.teamButtonHeight + TEAM_BUTTON_VISUAL_HEIGHT_OFFSET;
    const content = this.add.container(0, viewportTop);
    const viewportLeft = gridRect.x;
    const viewportWidth = gridRect.width;
    const rowHeight = teamButtonHeight + layout.teamGridGapY;
    const rowCount = Math.ceil(NATIONAL_TEAMS.length / layout.teamGridColumns);
    const contentHeight = rowCount * rowHeight - layout.teamGridGapY;
    const maxScroll = Math.max(0, contentHeight - TEAM_GRID_VIEWPORT_HEIGHT);
    const teamOptions: Phaser.GameObjects.Container[] = [];
    let teamGridScrollY = 0;

    const setScroll = (value: number): void => {
      teamGridScrollY = clampScroll(value, maxScroll);
      content.y = viewportTop - teamGridScrollY;
    };

    const startX = gridRect.x + layout.teamButtonWidth / 2;

    NATIONAL_TEAMS.forEach((team, index) => {
      const column = index % layout.teamGridColumns;
      const row = Math.floor(index / layout.teamGridColumns);
      const option = this.createCountryOption(
        startX + column * (layout.teamButtonWidth + layout.teamGridGapX),
        teamButtonHeight / 2 + row * rowHeight,
        layout.teamButtonWidth,
        teamButtonHeight,
        team
      );

      option.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
        setScroll(teamGridScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
      });
      teamOptions.push(option);
      content.add(option);
    });

    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(viewportLeft, viewportTop, viewportWidth, TEAM_GRID_VIEWPORT_HEIGHT)
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZone = this.add
      .zone(viewportLeft + viewportWidth / 2, viewportTop + TEAM_GRID_VIEWPORT_HEIGHT / 2, viewportWidth, TEAM_GRID_VIEWPORT_HEIGHT)
      .setInteractive({ useHandCursor: maxScroll > 0 })
      .setDepth(-10);
    const dragScroll = createDragScrollArea({
      scene: this,
      viewport: {
        x: viewportLeft,
        y: viewportTop,
        width: viewportWidth,
        height: TEAM_GRID_VIEWPORT_HEIGHT
      },
      maxScroll,
      getScroll: () => teamGridScrollY,
      setScroll
    });

    setScroll(teamGridScrollY);
    dragScroll.updateScrollableItemInputs(content, teamOptions);
    teamOptions.forEach((option, index) => {
      const team = NATIONAL_TEAMS[index];

      if (team !== undefined) {
        dragScroll.bindScrollableTapTarget(option, () => this.selectTeam(team.name));
      }
    });
    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(teamGridScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    dragScroll.bindDragTarget(scrollZone);

    if (maxScroll > 0) {
      const trackX = viewportLeft + viewportWidth + 12;
      const track = this.add.rectangle(trackX, viewportTop + TEAM_GRID_VIEWPORT_HEIGHT / 2, 4, TEAM_GRID_VIEWPORT_HEIGHT, 0x5f9572, 0.28);
      const thumbHeight = Math.max(28, (TEAM_GRID_VIEWPORT_HEIGHT / contentHeight) * TEAM_GRID_VIEWPORT_HEIGHT);
      const thumb = this.add.rectangle(trackX, viewportTop + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);

      const updateThumb = (): void => {
        thumb.y = viewportTop + thumbHeight / 2 + (teamGridScrollY / maxScroll) * (TEAM_GRID_VIEWPORT_HEIGHT - thumbHeight);
        dragScroll.updateScrollableItemInputs(content, teamOptions);
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
    const background = this.add.rectangle(
      0,
      0,
      width,
      height,
      SCOREBOARD_BACKGROUND_COLOR,
      isSelected ? TEAM_OPTION_ACTIVE_BACKGROUND_ALPHA : TEAM_OPTION_BACKGROUND_ALPHA
    );
    background.setStrokeStyle(
      isSelected ? 3 : 2,
      isSelected ? SCOREBOARD_BORDER_COLOR : TEAM_SELECTION_METAL_BORDER_COLOR,
      isSelected ? 1 : TEAM_SELECTION_METAL_BORDER_ALPHA
    );
    const flagX = -width / 2 + TEAM_OPTION_FLAG_PADDING_X + TEAM_OPTION_FLAG_WIDTH / 2;
    const textX = -width / 2 + TEAM_OPTION_FLAG_PADDING_X + TEAM_OPTION_FLAG_WIDTH + TEAM_OPTION_TEXT_GAP_X;
    const flag = this.add.image(flagX, 0, getFlagAssetKey(team.flagCode));
    flag.setDisplaySize(TEAM_OPTION_FLAG_WIDTH, TEAM_OPTION_FLAG_HEIGHT);

    // Remove ordinal rank numbers from the country option list (UI change)
    const teamText = this.add
      .text(textX, 0, team.name, {
        align: 'left',
        color: SCOREBOARD_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        wordWrap: { width: width - (textX + width / 2) - TEAM_OPTION_TEXT_RIGHT_PADDING_X }
      })
      .setOrigin(0, 0.5);

    option.add([background, flag, teamText]);
    option.setSize(width, height);
    option.setInteractive({ useHandCursor: true });
    option.on('pointerover', () => {
      if (!isSelected) {
        background.setFillStyle(SCOREBOARD_BACKGROUND_COLOR, TEAM_OPTION_ACTIVE_BACKGROUND_ALPHA);
      }
    });
    option.on('pointerout', () => {
      if (!isSelected) {
        background.setFillStyle(SCOREBOARD_BACKGROUND_COLOR, TEAM_OPTION_BACKGROUND_ALPHA);
      }
    });
    return option;
  }

  private selectTeam(teamName: string): void {
    if (this.activeSlot === 1 && teamName === this.selectedTeamTwo) {
      this.showMessage('This team is already selected for Player 2');
      return;
    }

    if (this.activeSlot === 2 && teamName === this.selectedTeamOne) {
      this.showMessage('This team is already selected for Player 1');
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

  private addControllerToggle(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    slot: TeamSlot,
    toggleLayout: TeamScreenControllerToggleLayout
  ): void {
    const controllerType = this.getControllerType(slot);
    const isAi = controllerType === 'AI';
    const toggle = this.add.container(x, y);
    const width = toggleLayout.width;
    const height = toggleLayout.height;

    if (toggleLayout.orientation === 'vertical') {
      this.addVerticalControllerToggle(parent, toggle, width, height, toggleLayout.fontSize, slot, isAi);
      return;
    }

    const segmentWidth = width / 2;
    const background = this.add.rectangle(0, 0, width, height, SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA);
    const activeSegment = this.add.rectangle(
      isAi ? segmentWidth / 2 : -segmentWidth / 2,
      0,
      segmentWidth - 4,
      height - 4,
      TEAM_SELECTION_TOGGLE_ACTIVE_COLOR,
      1
    );
    const playerLabel = this.add
      .text(-segmentWidth / 2, 0, 'Player', {
        align: 'center',
        color: isAi ? SCOREBOARD_TEXT_COLOR : TEAM_SELECTION_TOGGLE_ACTIVE_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: toggleLayout.fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const aiLabel = this.add
      .text(segmentWidth / 2, 0, 'AI', {
        align: 'center',
        color: isAi ? TEAM_SELECTION_TOGGLE_ACTIVE_TEXT_COLOR : SCOREBOARD_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: toggleLayout.fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);

    background.setStrokeStyle(2, TEAM_SELECTION_METAL_BORDER_COLOR, TEAM_SELECTION_METAL_BORDER_ALPHA);
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
      background.setStrokeStyle(2, SCOREBOARD_BORDER_COLOR, 1);
    });
    toggle.on('pointerout', () => {
      background.setStrokeStyle(2, TEAM_SELECTION_METAL_BORDER_COLOR, TEAM_SELECTION_METAL_BORDER_ALPHA);
    });

    parent.add(toggle);
  }

  private addVerticalControllerToggle(
    parent: Phaser.GameObjects.Container,
    toggle: Phaser.GameObjects.Container,
    width: number,
    height: number,
    fontSize: string,
    slot: TeamSlot,
    isAi: boolean
  ): void {
    const segmentHeight = height / 2;
    const playerSegment = this.add.rectangle(
      0,
      -segmentHeight / 2,
      width,
      segmentHeight,
      isAi ? SCOREBOARD_BACKGROUND_COLOR : TEAM_SELECTION_TOGGLE_ACTIVE_COLOR,
      isAi ? SCOREBOARD_BACKGROUND_ALPHA : 1
    );
    const aiSegment = this.add.rectangle(
      0,
      segmentHeight / 2,
      width,
      segmentHeight,
      isAi ? TEAM_SELECTION_TOGGLE_ACTIVE_COLOR : SCOREBOARD_BACKGROUND_COLOR,
      isAi ? 1 : SCOREBOARD_BACKGROUND_ALPHA
    );
    const border = this.add.rectangle(0, 0, width, height, SCOREBOARD_BACKGROUND_COLOR, 0);
    const playerLabel = this.add
      .text(0, -segmentHeight / 2, 'Player', {
        align: 'center',
        color: isAi ? SCOREBOARD_TEXT_COLOR : TEAM_SELECTION_TOGGLE_ACTIVE_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const aiLabel = this.add
      .text(0, segmentHeight / 2, 'AI', {
        align: 'center',
        color: isAi ? TEAM_SELECTION_TOGGLE_ACTIVE_TEXT_COLOR : SCOREBOARD_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);

    border.setStrokeStyle(2, TEAM_SELECTION_METAL_BORDER_COLOR, TEAM_SELECTION_METAL_BORDER_ALPHA);
    playerSegment.setInteractive({ useHandCursor: true });
    aiSegment.setInteractive({ useHandCursor: true });
    playerSegment.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.setControllerType(slot, 'HUMAN');
    });
    aiSegment.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.setControllerType(slot, 'AI');
    });
    playerSegment.on('pointerover', () => border.setStrokeStyle(2, SCOREBOARD_BORDER_COLOR, 1));
    aiSegment.on('pointerover', () => border.setStrokeStyle(2, SCOREBOARD_BORDER_COLOR, 1));
    playerSegment.on('pointerout', () => border.setStrokeStyle(2, TEAM_SELECTION_METAL_BORDER_COLOR, TEAM_SELECTION_METAL_BORDER_ALPHA));
    aiSegment.on('pointerout', () => border.setStrokeStyle(2, TEAM_SELECTION_METAL_BORDER_COLOR, TEAM_SELECTION_METAL_BORDER_ALPHA));

    toggle.add([playerSegment, aiSegment, border, playerLabel, aiLabel]);
    toggle.setSize(width, height);
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

  private setControllerType(slot: TeamSlot, controllerType: PlayerControllerType): void {
    if (slot === 1) {
      this.player1ControllerType = controllerType;
    } else {
      this.player2ControllerType = controllerType;
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
    if (this.textures.exists(MENU_ASSETS.teamSelectBackground)) {
      const background = this.add.image(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, MENU_ASSETS.teamSelectBackground);
      background.setDisplaySize(SCENE_WIDTH, SCENE_HEIGHT);
      background.setDepth(-20);
      return;
    }

    createTeamFieldBackground(this);
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

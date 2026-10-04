import { createTeamIdentityImage } from '../ui/teamIdentityImage';
import { ACTIVE_NATIONAL_TEAMS } from '../data/activeTeams';
import { getMobileKitCardLayout } from '../ui/mobileKitSelectorLayout';
import Phaser from 'phaser';
import { fitImageContain, resolveTeamCoverLoadResult } from '../assets/teamCover';
import type { PlayerControllerType } from '../ai';
import { MENU_ASSETS, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { FALLBACK_TEAM_KIT_ASSET, getTeamKitAssetKey, getTeamKitStyle, hasManualTeamKit, type FieldKitVariant } from '../data/teamKits';
import { type NationalTeam } from '../data/nationalTeams';
import type { TournamentMatchResult } from '../tournament';
import { Button } from '../ui/Button';
import { getMobileActionButtonLayout, getNavigationButtonLayout } from '../ui/mobileNavigationLayout';
import { CardView } from '../ui/CardView';
import {
  SCOREBOARD_BACKGROUND_ALPHA,
  SCOREBOARD_BACKGROUND_COLOR,
  SCOREBOARD_BORDER_COLOR,
  SCOREBOARD_METAL_BORDER_ALPHA,
  SCOREBOARD_METAL_BORDER_COLOR,
  SCOREBOARD_TEXT_COLOR
} from '../ui/scoreboardStyle';
import { createTeamFieldBackground } from '../ui/teamFieldBackground';
import { getTeamSelectionColors } from '../ui/teamSelectionStyle';
import { createDragScrollArea, TOUCH_SCROLL_WHEEL_FACTOR, clampScroll } from '../ui/touchInput';
import {
  createTeamScreenLayout,
  createTeamCountryGridLayout,
  createSelectedTeamNameLayout,
  createSelectedTeamHeaderLayout,
  SELECTED_COVER_FAN_MOBILE_CARD_SCALE,
  TEAM_GRID_VIEWPORT_HEIGHT,
  rectCenter,
  type TeamScreenControllerToggleLayout,
  type TeamScreenLayout,
  type TeamScreenRect
} from '../ui/teamScreenLayout';
import { updateScrollableItemEdgeAlphas } from '../ui/scrollEdgeFade';
import { px, SHARP_TEXT_RESOLUTION } from '../ui/textRendering';

type TeamSlot = 1 | 2;

const DEFAULT_TEAM_ONE = 'France';
const DEFAULT_TEAM_TWO = 'Spain';
const SELECTED_COVER_FAN_CARD_COUNT = 3;
const SELECTED_COVER_FAN_CARD_SCALE = 0.56;
const SELECTED_COVER_FAN_OFFSETS = [-34, 0, 34] as const;
const SELECTED_COVER_FAN_MOBILE_OFFSETS = [-36, 0, 36] as const;
const SELECTED_COVER_FAN_ANGLES = [-9, 0, 9] as const;
const TEAM_GRID_VIEWPORT_TOP = 210;
const TEAM_SELECTION_METAL_BORDER_COLOR = SCOREBOARD_METAL_BORDER_COLOR;
const TEAM_SELECTION_METAL_BORDER_ALPHA = SCOREBOARD_METAL_BORDER_ALPHA;
const TEAM_SELECTION_TOGGLE_ACTIVE_COLOR = SCOREBOARD_BORDER_COLOR;
const TEAM_SELECTION_TOGGLE_ACTIVE_TEXT_COLOR = '#1f2a2e';
const TEAM_OPTION_BACKGROUND_ALPHA = SCOREBOARD_BACKGROUND_ALPHA;
const TEAM_OPTION_ACTIVE_BACKGROUND_ALPHA = 0.98;
const TEAM_OPTION_FLAG_WIDTH = 40;
const TEAM_OPTION_FLAG_HEIGHT = 32;
const TEAM_OPTION_FLAG_PADDING_X = 11;
const TEAM_OPTION_TEXT_GAP_X = 12;
const TEAM_OPTION_TEXT_RIGHT_PADDING_X = 8;

export const DEFAULT_QUICK_MATCH_CONTROLLER_TYPE: PlayerControllerType = 'HUMAN';

export function toggleQuickMatchControllerType(controllerType: PlayerControllerType): PlayerControllerType {
  return controllerType === 'AI' ? 'HUMAN' : 'AI';
}

export interface TeamSelectionData {
  player1FieldKit?: FieldKitVariant;
  player2FieldKit?: FieldKitVariant;
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
  private fieldKits: Record<TeamSlot, FieldKitVariant> = { 1: 'home', 2: 'home' };
  private teamGridScrollY = 0;
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
    this.fieldKits = { 1: 'home', 2: 'home' };
    this.teamGridScrollY = 0;
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
    this.createTeamKitPreview(layout.team1KitPreviewRect, this.getSelectedTeam(1), 1, layout.mobileWide);
    this.createTeamKitPreview(layout.team2KitPreviewRect, this.getSelectedTeam(2), 2, layout.mobileWide);

    this.add
      .text(layout.vsPosition.x, layout.vsPosition.y, 'VS', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createCountryGrid(layout.teamGridRect, layout);

    const menuButton = getNavigationButtonLayout({
      ...rectCenter(layout.menuButtonRect),
      width: layout.menuButtonRect.width,
      height: layout.menuButtonRect.height,
      fontSize: '22px'
    }, layout.mobileWide);
    const startButton = getMobileActionButtonLayout({
      ...rectCenter(layout.startButtonRect),
      width: layout.startButtonRect.width,
      height: layout.startButtonRect.height,
      fontSize: '22px'
    }, layout.mobileWide);
    new Button(this, menuButton.x, menuButton.y, 'Menu', () => this.scene.start('MenuScene'), menuButton);
    new Button(
      this,
      startButton.x,
      startButton.y,
      layout.mobileWide ? 'Start' : this.mode === 'penalty' ? 'Start penalties' : 'Start',
      () => this.startMatch(),
      {
        ...startButton,
        disabled: this.selectedTeamOne === this.selectedTeamTwo
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
    const headerLayout = createSelectedTeamHeaderLayout(rect, coverFanRect, slot, layout.mobileWide);
    const coverFanCenter = headerLayout.fanCenter;
    const coverTextureKey = resolveTeamCoverLoadResult(this.textures, team.flagCode).textureKey;
    const panel = this.add.container(center.x, center.y);
    const colors = getTeamSelectionColors(layout.mobileWide);
    const background = this.add.graphics();
    const radius = layout.mobileWide ? 14 : 0;
    background.fillStyle(colors.backgroundColor, SCOREBOARD_BACKGROUND_ALPHA)
      .fillRoundedRect(-rect.width / 2, -rect.height / 2, rect.width, rect.height, radius)
      .lineStyle(isActive ? 4 : 2, TEAM_SELECTION_METAL_BORDER_COLOR, TEAM_SELECTION_METAL_BORDER_ALPHA)
      .strokeRoundedRect(-rect.width / 2, -rect.height / 2, rect.width, rect.height, radius);
    const fan = this.createSelectedTeamCoverFan(
      coverFanCenter.x - center.x,
      coverFanCenter.y - center.y,
      coverTextureKey,
      layout.mobileWide
    );
    const nameLayout = createSelectedTeamNameLayout(rect, coverFanRect, controllerToggleRect, layout.mobileWide);
    const controllerToggleCenter = rectCenter(controllerToggleRect);

    const slotLabel = this.add
      .text(headerLayout.label.x, headerLayout.label.y, title, {
        align: headerLayout.label.align,
        color: layout.mobileWide ? '#ffffff' : SCOREBOARD_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.mobileWide ? '28px' : '17px',
        fontStyle: '700'
      })
      .setOrigin(headerLayout.label.originX, 0.5);
    const teamText = this.add
      .text(nameLayout.x, nameLayout.y, team.name, {
        color: colors.textColor,
        fontFamily: 'Arial, sans-serif',
        fontStyle: '700',
        ...nameLayout.style
      })
      .setOrigin(nameLayout.originX, 0.5);

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

  private createTeamKitPreview(rect: TeamScreenRect, team: NationalTeam, slot: TeamSlot, mobileWide = false): void {
    if (mobileWide) {
      this.createMobileKitSelector(rect, team, slot);
      return;
    }
    const center = rectCenter(rect);
    const textureKey = getTeamKitAssetKey(team.flagCode, this.fieldKits[slot]);
    for (const [index, variant] of (['home', 'away'] as const).entries()) {
      new Button(this, center.x + (index === 0 ? -30 : 30), center.y - 76, variant.toUpperCase(), () => {
        this.fieldKits[slot] = variant;
        this.render();
      }, {
        width: 56, height: 40, fontSize: '12px',
        disabled: variant === 'away' && !hasManualTeamKit(team.flagCode, 'away'),
        borderWidth: this.fieldKits[slot] === variant ? 4 : 1,
        borderColor: this.fieldKits[slot] === variant ? 0xffffff : 0x1f2a2e
      });
    }
    const fallbackTextureKey = FALLBACK_TEAM_KIT_ASSET.assetKey;
    const kitTextureKey = this.textures.exists(textureKey) ? textureKey : fallbackTextureKey;
    const background = this.add.graphics();

    background.fillStyle(0xffffff, 0.96);
    background.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 8);
    background.lineStyle(2, 0x1f2a2e, 0.8);
    background.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 8);

    if (this.textures.exists(kitTextureKey)) {
      const kit = this.add.image(center.x, center.y, kitTextureKey);
      fitImageContain(kit, {
        width: rect.width - 14,
        height: rect.height - 10
      });
    }
  }

  private createMobileKitSelector(rect: TeamScreenRect, team: NationalTeam, slot: TeamSlot): void {
    const awayStyle = getTeamKitStyle(team.flagCode, 'away');
    const awayAvailable = hasManualTeamKit(team.flagCode, 'away') && awayStyle !== undefined
      && this.textures.exists(awayStyle.assetKey);
    if (!awayAvailable) this.fieldKits[slot] = 'home';
    const selected = this.fieldKits[slot];
    const alternate: FieldKitVariant = selected === 'home' ? 'away' : 'home';

    // Back first, front last: both drawing and pointer priority follow selection.
    for (const variant of [alternate, selected] as const) {
      const active = variant === selected;
      const available = variant === 'home' || awayAvailable;
      const cardRect = getMobileKitCardLayout(rect, slot, active);
      const center = rectCenter(cardRect);
      const card = this.add.container(center.x, center.y);
      const background = this.add.graphics();
      background.fillStyle(0xffffff, 1);
      background.fillRoundedRect(-cardRect.width / 2, -cardRect.height / 2, cardRect.width, cardRect.height, 8);
      background.lineStyle(active ? 4 : 2, active ? SCOREBOARD_BORDER_COLOR : 0x8a9691, 1);
      background.strokeRoundedRect(-cardRect.width / 2, -cardRect.height / 2, cardRect.width, cardRect.height, 8);
      card.add(background);

      const requestedKey = available ? getTeamKitAssetKey(team.flagCode, variant) : FALLBACK_TEAM_KIT_ASSET.assetKey;
      const textureKey = this.textures.exists(requestedKey) ? requestedKey : FALLBACK_TEAM_KIT_ASSET.assetKey;
      if (this.textures.exists(textureKey)) {
        const image = this.add.image(0, 0, textureKey);
        fitImageContain(image, { width: cardRect.width - 14, height: cardRect.height - 12 });
        card.add(image);
      }
      card.setAlpha(available ? 1 : 0.55);
      card.setSize(cardRect.width, cardRect.height);
      // Even inactive placeholders consume taps, so they cannot select a team behind them.
      card.setInteractive({ useHandCursor: available && !active });
      card.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        if (!available || active) return;
        this.fieldKits[slot] = variant;
        this.render();
      });
    }
  }

  private createCountryGrid(gridRect: TeamScreenRect, layout: TeamScreenLayout): void {
    const viewportTop = layout.teamGridStartY;
    const grid = createTeamCountryGridLayout(layout, ACTIVE_NATIONAL_TEAMS.length);
    const content = this.add.container(0, viewportTop);
    const viewportLeft = gridRect.x;
    const viewportWidth = gridRect.width;
    const { contentHeight, maxScroll } = grid;
    const teamOptions: Phaser.GameObjects.Container[] = [];
    let teamGridScrollY = this.teamGridScrollY;
    let refreshTeamGridItems = (): void => {};

    const setScroll = (value: number): void => {
      teamGridScrollY = px(clampScroll(value, maxScroll));
      this.teamGridScrollY = teamGridScrollY;
      content.y = viewportTop - teamGridScrollY;
      refreshTeamGridItems();
    };

    ACTIVE_NATIONAL_TEAMS.forEach((team, index) => {
      const column = index % grid.columns;
      const row = Math.floor(index / grid.columns);
      const option = this.createCountryOption(
        grid.startX + column * (grid.cardWidth + grid.gapX),
        grid.cardHeight / 2 + row * grid.rowHeight,
        grid.baseWidth,
        grid.baseHeight,
        team,
        grid.scale,
        layout.mobileWide
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

    refreshTeamGridItems = () => {
      dragScroll.updateScrollableItemInputs(content, teamOptions);
      updateScrollableItemEdgeAlphas({
        content,
        items: teamOptions,
        viewportTop,
        viewportHeight: TEAM_GRID_VIEWPORT_HEIGHT,
        scrollY: teamGridScrollY,
        maxScroll
      });
    };
    setScroll(teamGridScrollY);
    teamOptions.forEach((option, index) => {
      const team = ACTIVE_NATIONAL_TEAMS[index];

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
        refreshTeamGridItems();
      };

      updateThumb();
      this.events.on(Phaser.Scenes.Events.UPDATE, updateThumb);
      content.once(Phaser.GameObjects.Events.DESTROY, () => {
        this.events.off(Phaser.Scenes.Events.UPDATE, updateThumb);
      });
    }
  }

  private createCountryOption(x: number, y: number, width: number, height: number, team: NationalTeam, scale = 1, mobileWide = false): Phaser.GameObjects.Container {
    // Size geometry before creation: scaling a 16px Text texture to 32px blurs mobile labels.
    width = px(width * scale);
    height = px(height * scale);
    const isTeamOne = this.selectedTeamOne === team.name;
    const isTeamTwo = this.selectedTeamTwo === team.name;
    const isSelected = isTeamOne || isTeamTwo;
    const colors = getTeamSelectionColors(mobileWide);
    const option = this.add.container(px(x), px(y));
    const background = this.add.graphics();
    const drawBackground = (alpha: number): void => {
      background.clear().fillStyle(colors.backgroundColor, alpha)
        .fillRoundedRect(-width / 2, -height / 2, width, height, mobileWide ? 7 * scale : 0)
        .lineStyle((isSelected ? 3 : 2) * scale, isSelected ? SCOREBOARD_BORDER_COLOR : TEAM_SELECTION_METAL_BORDER_COLOR,
          isSelected ? 1 : TEAM_SELECTION_METAL_BORDER_ALPHA)
        .strokeRoundedRect(-width / 2, -height / 2, width, height, mobileWide ? 7 * scale : 0);
    };
    drawBackground(isSelected ? TEAM_OPTION_ACTIVE_BACKGROUND_ALPHA : TEAM_OPTION_BACKGROUND_ALPHA);
    const flagWidth = px((mobileWide ? TEAM_OPTION_FLAG_WIDTH : 36) * scale);
    const flagHeight = px((mobileWide ? TEAM_OPTION_FLAG_HEIGHT : 28) * scale);
    const flagX = px(-width / 2 + TEAM_OPTION_FLAG_PADDING_X * scale + flagWidth / 2);
    const flag = createTeamIdentityImage(this, flagX, 0, team.flagCode, flagWidth, flagHeight);
    flag.setX(px(-width / 2 + TEAM_OPTION_FLAG_PADDING_X * scale + flag.displayWidth / 2));
    const textX = px(flag.x + flag.displayWidth / 2 + TEAM_OPTION_TEXT_GAP_X * scale);

    // Remove ordinal rank numbers from the country option list (UI change)
    const teamText = this.add
      .text(textX, 0, team.name, {
        align: 'left',
        color: colors.textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: `${16 * scale}px`,
        fontStyle: '700',
        resolution: SHARP_TEXT_RESOLUTION,
        wordWrap: { width: width - (textX + width / 2) - TEAM_OPTION_TEXT_RIGHT_PADDING_X * scale }
      })
      .setOrigin(0, 0);
    teamText.y = -px(teamText.height / 2);

    option.add([background, flag, teamText]);
    option.setSize(width, height);
    option.setInteractive({ useHandCursor: true });
    option.on('pointerover', () => {
      if (!isSelected) {
        drawBackground(TEAM_OPTION_ACTIVE_BACKGROUND_ALPHA);
      }
    });
    option.on('pointerout', () => {
      if (!isSelected) {
        drawBackground(TEAM_OPTION_BACKGROUND_ALPHA);
      }
    });
    return option;
  }

  private selectTeam(teamName: string): void {
    if (!ACTIVE_NATIONAL_TEAMS.some((team) => team.name === teamName)) return;
    if (this.activeSlot === 1 && teamName === this.selectedTeamTwo) {
      this.showMessage('This team is already selected for Player 2');
      return;
    }

    if (this.activeSlot === 2 && teamName === this.selectedTeamOne) {
      this.showMessage('This team is already selected for Player 1');
      return;
    }

    if (this.activeSlot === 1) {
      if (this.selectedTeamOne !== teamName) this.fieldKits[1] = 'home';
      this.selectedTeamOne = teamName;
    } else {
      if (this.selectedTeamTwo !== teamName) this.fieldKits[2] = 'home';
      this.selectedTeamTwo = teamName;
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
      .text(0, -segmentHeight / 2, 'PL', {
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
      player1FieldKit: this.fieldKits[1],
      player2FieldKit: this.fieldKits[2],
      player1Name: this.selectedTeamOne,
      player2Name: this.selectedTeamTwo,
      player1FlagCode: this.getSelectedTeam(1).flagCode,
      player2FlagCode: this.getSelectedTeam(2).flagCode,
      player1ControllerType: this.player1ControllerType,
      player2ControllerType: this.player2ControllerType
    };

    if (this.mode === 'penalty') {
      this.scene.start('TournamentPenaltyScene', {
        fieldKits: { [data.player1FlagCode]: this.fieldKits[1], [data.player2FlagCode]: this.fieldKits[2] },
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
    return ACTIVE_NATIONAL_TEAMS.find((team) => team.name === teamName) ?? ACTIVE_NATIONAL_TEAMS[0];
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

import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getFlagAssetKey, getTeamScoreboardCode, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import { Button } from '../ui/Button';
import { TEAM_CARD_STYLE, type TeamCardVisualStyle } from '../ui/teamCardStyle';
import { createTournamentBackground } from '../ui/tournamentBackground';
import {
  createTournamentSetupLayout,
  getTournamentSetupGroupMaxScroll,
  type TournamentSetupLayout
} from '../ui/tournamentSetupLayout';
import { createDragScrollArea, TOUCH_SCROLL_WHEEL_FACTOR, clampScroll } from '../ui/touchInput';
import {
  changeTournamentSetupFormat,
  clearTournamentSetupDraft,
  createTournamentFromSetupDraft,
  createTournamentSetupDraft,
  fillEmptyTournamentSetupSlots,
  fillTournamentSetupRandom,
  getSelectedTournamentTeamIds,
  isTournamentSetupComplete,
  selectTournamentSetupTeam,
  shuffleTournamentSetupGroups,
  toggleTournamentSetupTeamControllerType,
  type TournamentSetupDraft
} from './tournamentSetupDraft';
import {
  getTournamentFormat,
  getTournamentMatchCount,
  saveTournament,
  type TournamentFormatId,
  type TournamentTeamId
} from '../tournament';

const TEAM_TOOLTIP_DEPTH = 1000;
const SLOT_AI_BUTTON_FONT_SIZE = '16px';
const SLOT_AI_BUTTON_ACTIVE_BACKGROUND_COLOR = 0xf0c95a;
const SLOT_AI_BUTTON_ACTIVE_BORDER_COLOR = 0xf7e08a;
const SLOT_AI_BUTTON_ACTIVE_TEXT_COLOR = '#10291f';
const SLOT_AI_BUTTON_OFF_BACKGROUND_COLOR = TEAM_CARD_STYLE.normal.backgroundColor;
const SLOT_AI_BUTTON_OFF_BORDER_COLOR = 0x9f8952;
const SLOT_AI_BUTTON_OFF_TEXT_COLOR = '#b9ad7a';
const FORMAT_IDS: readonly TournamentFormatId[] = ['cup-m', 'cup-l', 'cup-xl'];
const FORMAT_LABELS: Record<TournamentFormatId, string> = {
  'cup-m': 'Cup M',
  'cup-l': 'Cup L',
  'cup-xl': 'Cup XL'
};

export class TournamentSetupScene extends Phaser.Scene {
  private draft: TournamentSetupDraft = createTournamentSetupDraft('cup-m');
  private activeSlotIndex = 0;
  private groupScrollY = 0;
  private teamGridScrollY = 0;
  private seed = 'tournament-setup';
  private randomActionIndex = 0;
  private message: Phaser.GameObjects.Text | null = null;
  private teamTooltip: Phaser.GameObjects.Container | null = null;
  private mobileLandscapeLayout = false;

  public constructor() {
    super('TournamentSetupScene');
  }

  public create(): void {
    this.draft = createTournamentSetupDraft('cup-m');
    this.activeSlotIndex = 0;
    this.groupScrollY = 0;
    this.teamGridScrollY = 0;
    this.seed = `tournament-${Date.now().toString(36)}`;
    this.mobileLandscapeLayout = createTournamentSetupLayout().mobileLandscape;
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleScaleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleScaleResize, this);
    });
    this.render();
  }

  private handleScaleResize(): void {
    const mobileLandscapeLayout = createTournamentSetupLayout().mobileLandscape;

    if (mobileLandscapeLayout === this.mobileLandscapeLayout) {
      return;
    }

    this.mobileLandscapeLayout = mobileLandscapeLayout;
    this.groupScrollY = 0;
    this.teamGridScrollY = 0;
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);
    this.message = null;

    const centerX = SCENE_WIDTH / 2;
    const selectedCount = getSelectedTournamentTeamIds(this.draft).length;
    const totalCount = this.draft.slots.length;
    const layout = createTournamentSetupLayout();

    createTournamentBackground(this);
    this.add
      .text(centerX, layout.title.y, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.title.fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);
    this.add
      .text(centerX, layout.subtitle.y, 'Tournament', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.subtitle.fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createFormatButtons(layout);
    this.createSummary(selectedCount, totalCount, layout);
    this.createGroupSlots(layout);
    this.createTeamGrid(layout);
    this.createBottomButtons(layout);
  }

  private createFormatButtons(layout: TournamentSetupLayout): void {
    FORMAT_IDS.forEach((formatId, index) => {
      const selected = this.draft.formatId === formatId;
      const style = selected ? TEAM_CARD_STYLE.selected : TEAM_CARD_STYLE.normal;
      const x = layout.format.startX + index * layout.format.gapX;
      const button = this.add.container(x, layout.format.y);
      const background = this.add.rectangle(
        0,
        0,
        layout.format.width,
        layout.format.height,
        style.backgroundColor,
        style.backgroundAlpha
      );
      background.setStrokeStyle(style.borderWidth, style.borderColor, style.borderAlpha);
      const label = this.add
        .text(0, 0, FORMAT_LABELS[formatId], {
          align: 'center',
          color: style.textColor,
          fontFamily: 'Arial, sans-serif',
          fontSize: layout.format.fontSize,
          fontStyle: '700'
        })
        .setOrigin(0.5);
      const format = getTournamentFormat(formatId);
      // Do not show team count in the format button (removed per UI request)
      button.add([background, label]);
      button.setSize(layout.format.width, layout.format.height);
      button.setInteractive({ useHandCursor: true });
      button.on('pointerover', () => {
        if (!selected) {
          this.applyTeamCardStyle(background, TEAM_CARD_STYLE.hover);
          label.setColor(TEAM_CARD_STYLE.hover.textColor);
        }
      });
      button.on('pointerout', () => {
        if (!selected) {
          this.applyTeamCardStyle(background, TEAM_CARD_STYLE.normal);
          label.setColor(TEAM_CARD_STYLE.normal.textColor);
        }
      });
      button.on('pointerdown', () => this.changeFormat(formatId));
    });
  }

  private createSummary(selectedCount: number, totalCount: number, layout: TournamentSetupLayout): void {
    const matchesCount = getTournamentMatchCount(this.draft.formatId);

    this.add
      .text(layout.summary.participantsX, layout.summary.y, `Participants ${selectedCount}/${totalCount}`, {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.summary.fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);
    this.add
      .text(layout.summary.matchesX, layout.summary.y, `${matchesCount} matches`, {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.summary.fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createGroupSlots(layout: TournamentSetupLayout): void {
    if (layout.mobileLandscape) {
      this.createMobileGroupSlots(layout);
      return;
    }

    const format = getTournamentFormat(this.draft.formatId);
    const columns = layout.groups.columns ?? (format.groupCount <= 4 ? format.groupCount : 4);

    for (let groupIndex = 0; groupIndex < format.groupCount; groupIndex += 1) {
      const column = groupIndex % columns;
      const row = Math.floor(groupIndex / columns);
      const x = layout.groups.startX + column * (layout.groups.panelWidth + layout.groups.gapX);
      const y = layout.groups.startY + row * (layout.groups.panelHeight + layout.groups.gapY);

      this.createGroupPanel(x, y, format.groupIds[groupIndex], groupIndex, layout, true);
    }
  }

  private createMobileGroupSlots(layout: TournamentSetupLayout): void {
    const format = getTournamentFormat(this.draft.formatId);
    const columns = layout.groups.columns ?? 2;
    const viewportWidth = layout.groups.viewportWidth ?? 0;
    const viewportHeight = layout.groups.viewportHeight ?? 0;
    const rowCount = Math.ceil(format.groupCount / columns);
    const contentHeight = rowCount * layout.groups.panelHeight + Math.max(0, rowCount - 1) * layout.groups.gapY;
    const maxScroll = getTournamentSetupGroupMaxScroll(format.groupCount, layout);
    const content = this.add.container(0, layout.groups.startY);
    const tapTargets: Phaser.GameObjects.Zone[] = [];
    let refreshInputs = (): void => {};
    const setScroll = (value: number): void => {
      this.groupScrollY = clampScroll(value, maxScroll);
      content.y = layout.groups.startY - this.groupScrollY;
      refreshInputs();
    };
    const dragScroll = createDragScrollArea({
      scene: this,
      viewport: {
        x: layout.groups.startX,
        y: layout.groups.startY,
        width: viewportWidth,
        height: viewportHeight
      },
      maxScroll,
      getScroll: () => this.groupScrollY,
      setScroll
    });

    for (let groupIndex = 0; groupIndex < format.groupCount; groupIndex += 1) {
      const column = groupIndex % columns;
      const row = Math.floor(groupIndex / columns);
      const x = layout.groups.startX + column * (layout.groups.panelWidth + layout.groups.gapX);
      const y = row * (layout.groups.panelHeight + layout.groups.gapY);
      const panel = this.createGroupPanel(x, y, format.groupIds[groupIndex], groupIndex, layout, false);

      content.add(panel);

      for (let slotOffset = 0; slotOffset < 4; slotOffset += 1) {
        const slotIndex = groupIndex * 4 + slotOffset;
        const slotY = y + layout.groups.slotStartY + slotOffset * layout.groups.slotStepY;
        const hasTeam = this.draft.slots[slotIndex] !== null;
        const selectionWidth =
          layout.groups.slotWidth - (hasTeam ? layout.groups.slotAiButtonWidth : 0);
        const selectionZone = this.add
          .zone(
            x + layout.groups.slotX + selectionWidth / 2,
            slotY + layout.groups.slotHeight / 2,
            selectionWidth,
            layout.groups.slotHeight
          )
          .setInteractive({ useHandCursor: true });

        selectionZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
          setScroll(this.groupScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
        });
        dragScroll.bindScrollableTapTarget(selectionZone, () => {
          this.activeSlotIndex = slotIndex;
          this.render();
        });
        tapTargets.push(selectionZone);
        content.add(selectionZone);

        if (hasTeam) {
          const aiZone = this.add
            .zone(
              x + layout.groups.slotX + layout.groups.slotWidth - layout.groups.slotAiButtonWidth / 2,
              slotY + layout.groups.slotHeight / 2,
              layout.groups.slotAiButtonWidth,
              layout.groups.slotHeight
            )
            .setInteractive({ useHandCursor: true });

          aiZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
            setScroll(this.groupScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
          });
          dragScroll.bindScrollableTapTarget(aiZone, () => this.toggleTeamControllerType(slotIndex));
          tapTargets.push(aiZone);
          content.add(aiZone);
        }
      }
    }

    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(layout.groups.startX, layout.groups.startY, viewportWidth, viewportHeight)
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZone = this.add
      .zone(
        layout.groups.startX + viewportWidth / 2,
        layout.groups.startY + viewportHeight / 2,
        viewportWidth,
        viewportHeight
      )
      .setInteractive({ useHandCursor: maxScroll > 0 })
      .setDepth(-10);

    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(this.groupScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    dragScroll.bindDragTarget(scrollZone);
    refreshInputs = () => dragScroll.updateScrollableItemInputs(content, tapTargets);
    this.groupScrollY = clampScroll(this.groupScrollY, maxScroll);
    setScroll(this.groupScrollY);

    if (maxScroll > 0) {
      this.createScrollIndicator(
        layout.groups.startX + viewportWidth + 8,
        layout.groups.startY,
        viewportHeight,
        contentHeight,
        maxScroll,
        () => this.groupScrollY,
        content,
        refreshInputs
      );
    }
  }

  private createGroupPanel(
    x: number,
    y: number,
    groupId: string,
    groupIndex: number,
    layout: TournamentSetupLayout,
    interactive: boolean
  ): Phaser.GameObjects.Container {
    const panel = this.add.container(x, y);
    const background = this.add.rectangle(
      0,
      0,
      layout.groups.panelWidth,
      layout.groups.panelHeight,
      TEAM_CARD_STYLE.panel.backgroundColor,
      TEAM_CARD_STYLE.panel.backgroundAlpha
    );
    background.setOrigin(0);
    background.setStrokeStyle(
      TEAM_CARD_STYLE.panel.borderWidth,
      TEAM_CARD_STYLE.panel.borderColor,
      TEAM_CARD_STYLE.panel.borderAlpha
    );
    const title = this.add
      .text(layout.groups.titleX, layout.groups.titleY, `Group ${groupId}`, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.groups.titleFontSize,
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);

    panel.add([background, title]);

    for (let slotOffset = 0; slotOffset < 4; slotOffset += 1) {
      const slotIndex = groupIndex * 4 + slotOffset;

      panel.add(
        this.createSlot(
          layout.groups.slotX,
          layout.groups.slotStartY + slotOffset * layout.groups.slotStepY,
          slotIndex,
          layout,
          interactive
        )
      );
    }

    return panel;
  }

  private createSlot(
    x: number,
    y: number,
    slotIndex: number,
    layout: TournamentSetupLayout,
    interactive: boolean
  ): Phaser.GameObjects.Container {
    const teamId = this.draft.slots[slotIndex];
    const team = teamId === null ? undefined : findTeam(teamId);
    const selected = this.activeSlotIndex === slotIndex;
    const style = selected ? TEAM_CARD_STYLE.selected : team === undefined ? TEAM_CARD_STYLE.muted : TEAM_CARD_STYLE.normal;
    const slot = this.add.container(x, y);
    const background = this.add.rectangle(
      0,
      0,
      layout.groups.slotWidth,
      layout.groups.slotHeight,
      style.backgroundColor,
      style.backgroundAlpha
    );
    background.setOrigin(0);
    background.setStrokeStyle(style.borderWidth, style.borderColor, style.borderAlpha);
    if (interactive) {
      background.setInteractive({ useHandCursor: true });
    }
    if (team !== undefined && interactive) {
      background.on('pointerover', (pointer: Phaser.Input.Pointer) => this.showTeamTooltip(team.name, pointer.x, pointer.y));
      background.on('pointermove', (pointer: Phaser.Input.Pointer) => this.moveTeamTooltip(pointer.x, pointer.y));
      background.on('pointerout', () => this.hideTeamTooltip());
    }
    if (interactive) {
      background.on('pointerdown', () => {
        this.activeSlotIndex = slotIndex;
        this.render();
      });
    }

    const label = team === undefined ? 'Empty' : getTeamScoreboardCode(team.flagCode);
    const name = this.add
      .text(team === undefined ? 12 : layout.groups.slotCodeX, layout.groups.slotHeight / 2, label, {
        color: style.textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: team === undefined ? layout.groups.emptyFontSize : layout.groups.slotFontSize,
        fontStyle: '700',
        wordWrap: { width: team === undefined ? layout.groups.slotWidth - 24 : 96 }
      })
      .setOrigin(team === undefined ? 0 : 0.5, 0.5);

    slot.add([background, name]);

    if (team !== undefined) {
      const flag = this.add.image(layout.groups.slotFlagX, layout.groups.slotHeight / 2, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(layout.mobileLandscape ? 34 : 24, layout.mobileLandscape ? 26 : 18);
      const aiButton = this.createAiButton(
        layout.groups.slotWidth - layout.groups.slotAiButtonWidth / 2,
        layout.groups.slotHeight / 2,
        slotIndex,
        layout,
        interactive
      );
      slot.add([flag, aiButton]);
    }

    slot.setSize(layout.groups.slotWidth, layout.groups.slotHeight);

    return slot;
  }

  private createAiButton(
    x: number,
    y: number,
    slotIndex: number,
    layout: TournamentSetupLayout,
    interactive: boolean
  ): Phaser.GameObjects.Container {
    const isAi = this.draft.controllerTypes[slotIndex] === 'AI';
    const button = this.add.container(x, y);
    const background = this.add.rectangle(
      0,
      0,
      layout.groups.slotAiButtonWidth,
      layout.groups.slotHeight,
      isAi ? SLOT_AI_BUTTON_ACTIVE_BACKGROUND_COLOR : SLOT_AI_BUTTON_OFF_BACKGROUND_COLOR,
      isAi ? 1 : 0.82
    );
    background.setStrokeStyle(
      2,
      isAi ? SLOT_AI_BUTTON_ACTIVE_BORDER_COLOR : SLOT_AI_BUTTON_OFF_BORDER_COLOR,
      isAi ? 0.95 : 0.72
    );
    const label = this.add
      .text(0, 0, 'AI', {
        align: 'center',
        color: isAi ? SLOT_AI_BUTTON_ACTIVE_TEXT_COLOR : SLOT_AI_BUTTON_OFF_TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: SLOT_AI_BUTTON_FONT_SIZE,
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const hitArea = this.add.rectangle(
      0,
      0,
      layout.groups.slotAiButtonWidth,
      layout.groups.slotHeight,
      0x000000,
      0.01
    );

    if (interactive) {
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.toggleTeamControllerType(slotIndex);
      });
    }
    button.add([background, label, hitArea]);

    return button;
  }

  private createTeamGrid(layout: TournamentSetupLayout): void {
    const teamLayout = layout.teams;
    const content = this.add.container(0, teamLayout.viewportTop);
    const viewportLeft = teamLayout.startX - teamLayout.buttonWidth / 2 - teamLayout.viewportPadding;
    const viewportWidth =
      teamLayout.columns * teamLayout.buttonWidth +
      (teamLayout.columns - 1) * teamLayout.gapX +
      teamLayout.viewportPadding * 2;
    const rowHeight = teamLayout.buttonHeight + teamLayout.gapY;
    const rowCount = Math.ceil(NATIONAL_TEAMS.length / teamLayout.columns);
    const contentHeight = rowCount * rowHeight - teamLayout.gapY;
    const maxScroll = Math.max(0, contentHeight - teamLayout.viewportHeight);
    const teamOptions: Phaser.GameObjects.Container[] = [];
    let refreshItemInputs = (): void => {};
    const setScroll = (value: number): void => {
      this.teamGridScrollY = clampScroll(value, maxScroll);
      content.y = teamLayout.viewportTop - this.teamGridScrollY;
      refreshItemInputs();
    };

    NATIONAL_TEAMS.forEach((team, index) => {
      const column = index % teamLayout.columns;
      const row = Math.floor(index / teamLayout.columns);
      const option = this.createTeamOption(
        teamLayout.startX + column * (teamLayout.buttonWidth + teamLayout.gapX),
        teamLayout.buttonHeight / 2 + row * rowHeight,
        team,
        layout
      );

      option.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
        setScroll(this.teamGridScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
      });
      teamOptions.push(option);
      content.add(option);
    });

    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(viewportLeft, teamLayout.viewportTop, viewportWidth, teamLayout.viewportHeight)
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZone = this.add
      .zone(
        viewportLeft + viewportWidth / 2,
        teamLayout.viewportTop + teamLayout.viewportHeight / 2,
        viewportWidth,
        teamLayout.viewportHeight
      )
      .setInteractive({ useHandCursor: maxScroll > 0 })
      .setDepth(-10);
    const dragScroll = createDragScrollArea({
      scene: this,
      viewport: {
        x: viewportLeft,
        y: teamLayout.viewportTop,
        width: viewportWidth,
        height: teamLayout.viewportHeight
      },
      maxScroll,
      getScroll: () => this.teamGridScrollY,
      setScroll
    });

    refreshItemInputs = () => dragScroll.updateScrollableItemInputs(content, teamOptions);
    this.teamGridScrollY = clampScroll(this.teamGridScrollY, maxScroll);
    setScroll(this.teamGridScrollY);
    teamOptions.forEach((option, index) => {
      const team = NATIONAL_TEAMS[index];
      const isSelected = team !== undefined && this.draft.slots.includes(team.flagCode);

      if (team !== undefined) {
        dragScroll.bindScrollableTapTarget(option, () => {
          if (!isSelected) {
            this.selectTeam(team.flagCode);
          }
        });
      }
    });
    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(this.teamGridScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    dragScroll.bindDragTarget(scrollZone);

    if (maxScroll > 0) {
      this.createScrollIndicator(
        viewportLeft + viewportWidth + 12,
        teamLayout.viewportTop,
        teamLayout.viewportHeight,
        contentHeight,
        maxScroll,
        () => this.teamGridScrollY,
        content,
        refreshItemInputs
      );
    }
  }

  private createTeamOption(
    x: number,
    y: number,
    team: NationalTeam,
    layout: TournamentSetupLayout
  ): Phaser.GameObjects.Container {
    const teamLayout = layout.teams;
    const selectedSlotIndex = this.draft.slots.findIndex((teamId) => teamId === team.flagCode);
    const isSelected = selectedSlotIndex !== -1;
    const style = isSelected ? TEAM_CARD_STYLE.selected : TEAM_CARD_STYLE.normal;
    const option = this.add.container(x, y);
    const background = this.add.rectangle(
      0,
      0,
      teamLayout.buttonWidth,
      teamLayout.buttonHeight,
      style.backgroundColor,
      style.backgroundAlpha
    );
    background.setStrokeStyle(style.borderWidth, style.borderColor, style.borderAlpha);
    const flag = this.add.image(teamLayout.flagX, 0, getFlagAssetKey(team.flagCode));
    flag.setDisplaySize(teamLayout.flagWidth, teamLayout.flagHeight);
    const teamCode = getTeamScoreboardCode(team.flagCode);
    const name = this.add
      .text(teamLayout.codeX, 0, teamCode, {
        align: 'center',
        color: style.textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: teamLayout.codeFontSize,
        fontStyle: '700',
        wordWrap: { width: 72 }
      })
      .setOrigin(0.5);

    option.add([background, flag, name]);
    option.setSize(teamLayout.buttonWidth, teamLayout.buttonHeight);
    option.setAlpha(isSelected ? 0.48 : 1);
    option.setInteractive({ useHandCursor: !isSelected });
    option.on('pointerover', () => {
      if (!isSelected) {
        this.applyTeamCardStyle(background, TEAM_CARD_STYLE.hover);
        name.setColor(TEAM_CARD_STYLE.hover.textColor);
      }
    });
    if (!layout.mobileLandscape) {
      option.on('pointerover', (pointer: Phaser.Input.Pointer) => this.showTeamTooltip(team.name, pointer.x, pointer.y));
      option.on('pointermove', (pointer: Phaser.Input.Pointer) => this.moveTeamTooltip(pointer.x, pointer.y));
    }
    option.on('pointerout', () => {
      if (!isSelected) {
        this.applyTeamCardStyle(background, TEAM_CARD_STYLE.normal);
        name.setColor(TEAM_CARD_STYLE.normal.textColor);
      }
      this.hideTeamTooltip();
    });
    return option;
  }

  private createScrollIndicator(
    x: number,
    top: number,
    viewportHeight: number,
    contentHeight: number,
    maxScroll: number,
    getScroll: () => number,
    content: Phaser.GameObjects.Container,
    refreshInputs: () => void
  ): void {
    this.add.rectangle(x, top + viewportHeight / 2, 4, viewportHeight, 0x5f9572, 0.28);
    const thumbHeight = Math.max(28, (viewportHeight / contentHeight) * viewportHeight);
    const thumb = this.add.rectangle(x, top + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);
    const updateThumb = (): void => {
      thumb.y = top + thumbHeight / 2 + (getScroll() / maxScroll) * (viewportHeight - thumbHeight);
      refreshInputs();
    };

    updateThumb();
    this.events.on(Phaser.Scenes.Events.UPDATE, updateThumb);
    content.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.events.off(Phaser.Scenes.Events.UPDATE, updateThumb);
    });
  }

  private showTeamTooltip(text: string, pointerX: number, pointerY: number): void {
    this.hideTeamTooltip();

    const label = this.add
      .text(0, 0, text, {
        color: '#f7f0c6',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0);
    const bounds = label.getBounds();
    const background = this.add.rectangle(0, 0, bounds.width + 2, bounds.height + 2, 0x10291f, 0.96);
    background.setOrigin(0);
    background.setStrokeStyle(1, 0xf0c95a, 0.9);

    this.teamTooltip = this.add.container(0, 0, [background, label]).setDepth(TEAM_TOOLTIP_DEPTH);
    this.moveTeamTooltip(pointerX, pointerY);
  }

  private moveTeamTooltip(pointerX: number, pointerY: number): void {
    if (this.teamTooltip === null) {
      return;
    }

    const tooltipWidth = this.teamTooltip.getBounds().width;
    const tooltipHeight = this.teamTooltip.getBounds().height;
    const x = Phaser.Math.Clamp(pointerX + 14, 8, SCENE_WIDTH - tooltipWidth - 8);
    const y = Phaser.Math.Clamp(pointerY + 16, 8, SCENE_HEIGHT - tooltipHeight - 8);

    this.teamTooltip.setPosition(x, y);
  }

  private hideTeamTooltip(): void {
    this.teamTooltip?.destroy();
    this.teamTooltip = null;
  }

  private applyTeamCardStyle(
    background: Phaser.GameObjects.Rectangle,
    style: TeamCardVisualStyle
  ): void {
    background.setFillStyle(style.backgroundColor, style.backgroundAlpha);
    background.setStrokeStyle(style.borderWidth, style.borderColor, style.borderAlpha);
  }

  private createBottomButtons(layout: TournamentSetupLayout): void {
    const complete = isTournamentSetupComplete(this.draft);
    const definitions = [
      { label: 'Menu', onClick: () => this.scene.start('MenuScene'), disabled: false },
      { label: 'Clear', onClick: () => this.clear(), disabled: false },
      { label: 'Fill randomly', onClick: () => this.fillRandom(), disabled: false },
      { label: 'Fill empty slots', onClick: () => this.fillEmpty(), disabled: false },
      { label: 'Shuffle groups', onClick: () => this.shuffleGroups(), disabled: !complete },
      { label: 'Start tournament', onClick: () => this.startTournament(), disabled: !complete }
    ] as const;

    definitions.forEach((definition, index) => {
      const buttonLayout = layout.bottomButtons[index];

      if (buttonLayout === undefined) {
        return;
      }

      new Button(this, buttonLayout.x, buttonLayout.y, definition.label, definition.onClick, {
        disabled: definition.disabled,
        fontSize: buttonLayout.fontSize,
        width: buttonLayout.width,
        height: buttonLayout.height
      });
    });
  }

  private changeFormat(formatId: TournamentFormatId): void {
    this.draft = changeTournamentSetupFormat(this.draft, formatId);
    this.activeSlotIndex = Math.min(this.activeSlotIndex, this.draft.slots.length - 1);
    this.groupScrollY = 0;
    this.teamGridScrollY = 0;
    this.render();
  }

  private selectTeam(teamId: TournamentTeamId): void {
    try {
      this.draft = selectTournamentSetupTeam(this.draft, this.activeSlotIndex, teamId);
      this.render();
    } catch (error) {
      this.showMessage(error instanceof Error ? error.message : 'Could not select team.', '#f7a6a6');
    }
  }

  private toggleTeamControllerType(slotIndex: number): void {
    this.draft = toggleTournamentSetupTeamControllerType(this.draft, slotIndex);
    this.activeSlotIndex = slotIndex;
    this.render();
  }

  private clear(): void {
    this.draft = clearTournamentSetupDraft(this.draft);
    this.activeSlotIndex = 0;
    this.render();
  }

  private fillRandom(): void {
    this.draft = fillTournamentSetupRandom(this.draft, this.nextSeed('random'));
    this.activeSlotIndex = 0;
    this.render();
  }

  private fillEmpty(): void {
    this.draft = fillEmptyTournamentSetupSlots(this.draft, this.nextSeed('empty'));
    this.activeSlotIndex = this.draft.slots.findIndex((teamId) => teamId === null);

    if (this.activeSlotIndex === -1) {
      this.activeSlotIndex = 0;
    }

    this.render();
  }

  private shuffleGroups(): void {
    try {
      this.draft = shuffleTournamentSetupGroups(this.draft, this.nextSeed('shuffle'));
      this.activeSlotIndex = 0;
      this.render();
    } catch (error) {
      this.showMessage(error instanceof Error ? error.message : 'Could not shuffle groups.', '#f7a6a6');
    }
  }

  private startTournament(): void {
    try {
      const tournament = createTournamentFromSetupDraft(this.draft, this.nextSeed('start'));
      this.registry.set('currentTournament', tournament);
      saveTournament(tournament);
      this.scene.start('TournamentHubScene');
    } catch (error) {
      this.showMessage(error instanceof Error ? error.message : 'Could not start tournament.', '#f7a6a6');
    }
  }

  private showMessage(text: string, color: string): void {
    this.message?.destroy();
    const layout = createTournamentSetupLayout();
    this.message = this.add
      .text(SCENE_WIDTH / 2, layout.messageY, text, {
        align: 'center',
        color,
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700',
        stroke: '#123b2a',
        strokeThickness: 4,
        wordWrap: { width: 760 }
      })
      .setOrigin(0.5);

    this.time.delayedCall(1800, () => {
      this.message?.destroy();
      this.message = null;
    });
  }

  private nextSeed(action: string): string {
    this.randomActionIndex += 1;

    return `${this.seed}:${action}:${this.randomActionIndex}`;
  }
}

function findTeam(teamId: TournamentTeamId): NationalTeam | undefined {
  return NATIONAL_TEAMS.find((team) => team.flagCode === teamId);
}

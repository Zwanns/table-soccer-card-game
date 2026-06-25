import Phaser from 'phaser';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getFlagAssetKey, getTeamScoreboardCode, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import { Button } from '../ui/Button';
import { TEAM_CARD_STYLE, type TeamCardVisualStyle } from '../ui/teamCardStyle';
import { createTournamentBackground } from '../ui/tournamentBackground';
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
  removeTournamentSetupTeam,
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

const TEAM_GRID_COLUMNS = 3;
const TEAM_BUTTON_WIDTH = 154;
const TEAM_BUTTON_HEIGHT = 42;
const TEAM_GRID_GAP_X = 12;
const TEAM_GRID_GAP_Y = 8;
const TEAM_GRID_START_X = 1076;
const TEAM_GRID_VIEWPORT_TOP = 164;
const TEAM_GRID_VIEWPORT_HEIGHT = 464;
const TEAM_GRID_VIEWPORT_PADDING = 8;
const SLOT_WIDTH = 200;
const SLOT_HEIGHT = 38;
const GROUP_PANEL_WIDTH = 220;
const GROUP_PANEL_HEIGHT = 196;
const GROUP_GAP_X = 14;
const GROUP_GAP_Y = 16;
const GROUPS_START_X = 54;
const GROUPS_START_Y = 166;
const TEAM_TOOLTIP_DEPTH = 1000;
const TEAM_OPTION_FLAG_X = -TEAM_BUTTON_WIDTH / 2 + 33;
const TEAM_OPTION_CODE_X = 24;
const SLOT_FLAG_X = 32;
const SLOT_CODE_X = 94;
const FORMAT_IDS: readonly TournamentFormatId[] = ['cup-m', 'cup-l', 'cup-xl'];
const FORMAT_LABELS: Record<TournamentFormatId, string> = {
  'cup-m': 'Cup M',
  'cup-l': 'Cup L',
  'cup-xl': 'Cup XL'
};

export class TournamentSetupScene extends Phaser.Scene {
  private draft: TournamentSetupDraft = createTournamentSetupDraft('cup-m');
  private activeSlotIndex = 0;
  private teamGridScrollY = 0;
  private seed = 'tournament-setup';
  private randomActionIndex = 0;
  private message: Phaser.GameObjects.Text | null = null;
  private teamTooltip: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('TournamentSetupScene');
  }

  public create(): void {
    this.draft = createTournamentSetupDraft('cup-m');
    this.activeSlotIndex = 0;
    this.teamGridScrollY = 0;
    this.seed = `tournament-${Date.now().toString(36)}`;
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);
    this.message = null;

    const centerX = SCENE_WIDTH / 2;
    const selectedCount = getSelectedTournamentTeamIds(this.draft).length;
    const totalCount = this.draft.slots.length;

    createTournamentBackground(this);
    this.add
      .text(centerX, 30, GAME_TITLE, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    this.add
      .text(centerX, 68, 'Tournament', {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createFormatButtons();
    this.createSummary(selectedCount, totalCount);
    this.createGroupSlots();
    this.createTeamGrid();
    this.createBottomButtons();
  }

  private createFormatButtons(): void {
    FORMAT_IDS.forEach((formatId, index) => {
      const selected = this.draft.formatId === formatId;
      const style = selected ? TEAM_CARD_STYLE.selected : TEAM_CARD_STYLE.normal;
      const x = SCENE_WIDTH / 2 - 250 + index * 250;
      const button = this.add.container(x, 112);
      const background = this.add.rectangle(0, 0, 210, 48, style.backgroundColor, style.backgroundAlpha);
      background.setStrokeStyle(style.borderWidth, style.borderColor, style.borderAlpha);
      const label = this.add
        .text(0, 0, FORMAT_LABELS[formatId], {
          align: 'center',
          color: style.textColor,
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          fontStyle: '700'
        })
        .setOrigin(0.5);
      const format = getTournamentFormat(formatId);
      // Do not show team count in the format button (removed per UI request)
      button.add([background, label]);
      button.setSize(210, 48);
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

  private createSummary(selectedCount: number, totalCount: number): void {
    const matchesCount = getTournamentMatchCount(this.draft.formatId);

    this.add
      .text(352, 124, `Participants ${selectedCount}/${totalCount}`, {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    this.add
      .text(1244, 124, `${matchesCount} matches`, {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
  }

  private createGroupSlots(): void {
    const format = getTournamentFormat(this.draft.formatId);
    const columns = format.groupCount <= 4 ? format.groupCount : 4;

    for (let groupIndex = 0; groupIndex < format.groupCount; groupIndex += 1) {
      const column = groupIndex % columns;
      const row = Math.floor(groupIndex / columns);
      const x = GROUPS_START_X + column * (GROUP_PANEL_WIDTH + GROUP_GAP_X);
      const y = GROUPS_START_Y + row * (GROUP_PANEL_HEIGHT + GROUP_GAP_Y);

      this.createGroupPanel(x, y, format.groupIds[groupIndex], groupIndex);
    }
  }

  private createGroupPanel(x: number, y: number, groupId: string, groupIndex: number): void {
    const panel = this.add.container(x, y);
    const background = this.add.rectangle(
      0,
      0,
      GROUP_PANEL_WIDTH,
      GROUP_PANEL_HEIGHT,
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
      .text(14, 16, `Group ${groupId}`, {
        color: '#f0c95a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);

    panel.add([background, title]);

    for (let slotOffset = 0; slotOffset < 4; slotOffset += 1) {
      const slotIndex = groupIndex * 4 + slotOffset;

      panel.add(this.createSlot(10, 44 + slotOffset * 36, slotIndex));
    }
  }

  private createSlot(x: number, y: number, slotIndex: number): Phaser.GameObjects.Container {
    const teamId = this.draft.slots[slotIndex];
    const team = teamId === null ? undefined : findTeam(teamId);
    const selected = this.activeSlotIndex === slotIndex;
    const style = selected ? TEAM_CARD_STYLE.selected : team === undefined ? TEAM_CARD_STYLE.muted : TEAM_CARD_STYLE.normal;
    const slot = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, SLOT_WIDTH, SLOT_HEIGHT, style.backgroundColor, style.backgroundAlpha);
    background.setOrigin(0);
    background.setStrokeStyle(style.borderWidth, style.borderColor, style.borderAlpha);
    background.setInteractive({ useHandCursor: true });
    if (team !== undefined) {
      background.on('pointerover', (pointer: Phaser.Input.Pointer) => this.showTeamTooltip(team.name, pointer.x, pointer.y));
      background.on('pointermove', (pointer: Phaser.Input.Pointer) => this.moveTeamTooltip(pointer.x, pointer.y));
      background.on('pointerout', () => this.hideTeamTooltip());
    }
    background.on('pointerdown', () => {
      this.activeSlotIndex = slotIndex;
      this.render();
    });

    const label = team === undefined ? 'Empty' : getTeamScoreboardCode(team.flagCode);
    const name = this.add
      .text(team === undefined ? 12 : SLOT_CODE_X, SLOT_HEIGHT / 2, label, {
        color: style.textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: team === undefined ? '14px' : '18px',
        fontStyle: '700',
        wordWrap: { width: team === undefined ? 170 : 72 }
      })
      .setOrigin(team === undefined ? 0 : 0.5, 0.5);

    slot.add([background, name]);

    if (team !== undefined) {
      const flag = this.add.image(SLOT_FLAG_X, SLOT_HEIGHT / 2, getFlagAssetKey(team.flagCode));
      flag.setDisplaySize(24, 18);
      const aiCheckbox = this.createAiCheckbox(154, SLOT_HEIGHT / 2, slotIndex);
      const remove = this.add
        .text(188, SLOT_HEIGHT / 2, 'x', {
          align: 'center',
          color: '#f0c95a',
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          fontStyle: '700'
        })
        .setOrigin(0.5);
      const removeHitArea = this.add.rectangle(188, SLOT_HEIGHT / 2, 22, 26, 0x000000, 0.01);
      removeHitArea.setInteractive({ useHandCursor: true });
      removeHitArea.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.removeTeam(slotIndex);
      });
      slot.add([flag, aiCheckbox, remove, removeHitArea]);
    }

    slot.setSize(SLOT_WIDTH, SLOT_HEIGHT);

    return slot;
  }

  private createAiCheckbox(
    x: number,
    y: number,
    slotIndex: number
  ): Phaser.GameObjects.Container {
    const isAi = this.draft.controllerTypes[slotIndex] === 'AI';
    const checkbox = this.add.container(x, y);
    const box = this.add.rectangle(-12, 0, 12, 12, isAi ? 0xf0c95a : 0x0b2118, 1);
    box.setStrokeStyle(2, 0xf0c95a, 0.95);
    const mark = this.add
      .text(-12, 0, isAi ? '✓' : '', {
        align: 'center',
        color: '#1f2a2e',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: '700'
      })
      .setOrigin(0.5);
    const label = this.add
      .text(-1, 0, 'AI', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: '700'
      })
      .setOrigin(0, 0.5);
    const hitArea = this.add.rectangle(0, 0, 42, 24, 0x000000, 0.01);

    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.toggleTeamControllerType(slotIndex);
    });
    checkbox.add([box, mark, label, hitArea]);

    return checkbox;
  }

  private createTeamGrid(): void {
    const content = this.add.container(0, TEAM_GRID_VIEWPORT_TOP);
    const viewportLeft = TEAM_GRID_START_X - TEAM_BUTTON_WIDTH / 2 - TEAM_GRID_VIEWPORT_PADDING;
    const viewportWidth =
      TEAM_GRID_COLUMNS * TEAM_BUTTON_WIDTH + (TEAM_GRID_COLUMNS - 1) * TEAM_GRID_GAP_X + TEAM_GRID_VIEWPORT_PADDING * 2;
    const rowHeight = TEAM_BUTTON_HEIGHT + TEAM_GRID_GAP_Y;
    const rowCount = Math.ceil(NATIONAL_TEAMS.length / TEAM_GRID_COLUMNS);
    const contentHeight = rowCount * rowHeight - TEAM_GRID_GAP_Y;
    const maxScroll = Math.max(0, contentHeight - TEAM_GRID_VIEWPORT_HEIGHT);
    const teamOptions: Phaser.GameObjects.Container[] = [];
    let refreshItemInputs = (): void => {};
    const setScroll = (value: number): void => {
      this.teamGridScrollY = clampScroll(value, maxScroll);
      content.y = TEAM_GRID_VIEWPORT_TOP - this.teamGridScrollY;
      refreshItemInputs();
    };

    NATIONAL_TEAMS.forEach((team, index) => {
      const column = index % TEAM_GRID_COLUMNS;
      const row = Math.floor(index / TEAM_GRID_COLUMNS);
      const option = this.createTeamOption(
        TEAM_GRID_START_X + column * (TEAM_BUTTON_WIDTH + TEAM_GRID_GAP_X),
        TEAM_BUTTON_HEIGHT / 2 + row * rowHeight,
        team
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
      .fillRect(viewportLeft, TEAM_GRID_VIEWPORT_TOP, viewportWidth, TEAM_GRID_VIEWPORT_HEIGHT)
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZone = this.add
      .zone(
        viewportLeft + viewportWidth / 2,
        TEAM_GRID_VIEWPORT_TOP + TEAM_GRID_VIEWPORT_HEIGHT / 2,
        viewportWidth,
        TEAM_GRID_VIEWPORT_HEIGHT
      )
      .setInteractive({ useHandCursor: maxScroll > 0 })
      .setDepth(-10);
    const dragScroll = createDragScrollArea({
      scene: this,
      viewport: {
        x: viewportLeft,
        y: TEAM_GRID_VIEWPORT_TOP,
        width: viewportWidth,
        height: TEAM_GRID_VIEWPORT_HEIGHT
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

      if (team !== undefined) {
        dragScroll.bindScrollableTapTarget(option, () => this.selectTeam(team.flagCode));
      }
    });
    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(this.teamGridScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    dragScroll.bindDragTarget(scrollZone);

    if (maxScroll > 0) {
      const trackX = viewportLeft + viewportWidth + 12;
      const track = this.add.rectangle(trackX, TEAM_GRID_VIEWPORT_TOP + TEAM_GRID_VIEWPORT_HEIGHT / 2, 4, TEAM_GRID_VIEWPORT_HEIGHT, 0x5f9572, 0.28);
      const thumbHeight = Math.max(28, (TEAM_GRID_VIEWPORT_HEIGHT / contentHeight) * TEAM_GRID_VIEWPORT_HEIGHT);
      const thumb = this.add.rectangle(trackX, TEAM_GRID_VIEWPORT_TOP + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);
      const updateThumb = (): void => {
        thumb.y =
          TEAM_GRID_VIEWPORT_TOP +
          thumbHeight / 2 +
          (this.teamGridScrollY / maxScroll) * (TEAM_GRID_VIEWPORT_HEIGHT - thumbHeight);
        refreshItemInputs();
      };

      updateThumb();
      this.events.on(Phaser.Scenes.Events.UPDATE, updateThumb);
      content.once(Phaser.GameObjects.Events.DESTROY, () => {
        this.events.off(Phaser.Scenes.Events.UPDATE, updateThumb);
      });
    }
  }

  private createTeamOption(x: number, y: number, team: NationalTeam): Phaser.GameObjects.Container {
    const selectedSlotIndex = this.draft.slots.findIndex((teamId) => teamId === team.flagCode);
    const isSelected = selectedSlotIndex !== -1;
    const style = isSelected ? TEAM_CARD_STYLE.selected : TEAM_CARD_STYLE.normal;
    const option = this.add.container(x, y);
    const background = this.add.rectangle(
      0,
      0,
      TEAM_BUTTON_WIDTH,
      TEAM_BUTTON_HEIGHT,
      style.backgroundColor,
      style.backgroundAlpha
    );
    background.setStrokeStyle(style.borderWidth, style.borderColor, style.borderAlpha);
    const flag = this.add.image(TEAM_OPTION_FLAG_X, 0, getFlagAssetKey(team.flagCode));
    flag.setDisplaySize(30, 22);
    const teamCode = getTeamScoreboardCode(team.flagCode);
    const name = this.add
      .text(TEAM_OPTION_CODE_X, 0, teamCode, {
        align: 'center',
        color: style.textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '700',
        wordWrap: { width: 72 }
      })
      .setOrigin(0.5);

    option.add([background, flag, name]);
    option.setSize(TEAM_BUTTON_WIDTH, TEAM_BUTTON_HEIGHT);
    option.setInteractive({ useHandCursor: true });
    option.on('pointerover', () => {
      if (!isSelected) {
        this.applyTeamCardStyle(background, TEAM_CARD_STYLE.hover);
        name.setColor(TEAM_CARD_STYLE.hover.textColor);
      }
    });
    option.on('pointerover', (pointer: Phaser.Input.Pointer) => this.showTeamTooltip(team.name, pointer.x, pointer.y));
    option.on('pointermove', (pointer: Phaser.Input.Pointer) => this.moveTeamTooltip(pointer.x, pointer.y));
    option.on('pointerout', () => {
      if (!isSelected) {
        this.applyTeamCardStyle(background, TEAM_CARD_STYLE.normal);
        name.setColor(TEAM_CARD_STYLE.normal.textColor);
      }
      this.hideTeamTooltip();
    });
    return option;
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

  private createBottomButtons(): void {
    const complete = isTournamentSetupComplete(this.draft);

    new Button(this, 130, 666, 'Menu', () => this.scene.start('MenuScene'), {
      fontSize: '18px',
      width: 170
    });
    new Button(this, 342, 666, 'Clear', () => this.clear(), {
      fontSize: '18px',
      width: 170
    });
    new Button(this, 574, 666, 'Fill randomly', () => this.fillRandom(), {
      fontSize: '17px',
      width: 220
    });
    new Button(this, 832, 666, 'Fill empty slots', () => this.fillEmpty(), {
      fontSize: '17px',
      width: 220
    });
    new Button(this, 1090, 666, 'Shuffle groups', () => this.shuffleGroups(), {
      disabled: !complete,
      fontSize: '17px',
      width: 230
    });
    new Button(this, 1360, 666, 'Start tournament', () => this.startTournament(), {
      disabled: !complete,
      fontSize: '18px',
      width: 230
    });
  }

  private changeFormat(formatId: TournamentFormatId): void {
    this.draft = changeTournamentSetupFormat(this.draft, formatId);
    this.activeSlotIndex = Math.min(this.activeSlotIndex, this.draft.slots.length - 1);
    this.teamGridScrollY = 0;
    this.render();
  }

  private selectTeam(teamId: TournamentTeamId): void {
    try {
      this.draft = selectTournamentSetupTeam(this.draft, this.activeSlotIndex, teamId);
      this.activeSlotIndex = Math.min(this.activeSlotIndex + 1, this.draft.slots.length - 1);
      this.render();
    } catch (error) {
      this.showMessage(error instanceof Error ? error.message : 'Could not select team.', '#f7a6a6');
    }
  }

  private removeTeam(slotIndex: number): void {
    this.draft = removeTournamentSetupTeam(this.draft, slotIndex);
    this.activeSlotIndex = slotIndex;
    this.render();
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
    this.message = this.add
      .text(SCENE_WIDTH / 2, 620, text, {
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

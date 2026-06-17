import Phaser from 'phaser';
import { resolveTeamCoverLoadResult } from '../assets/teamCover';
import { SCENE_WIDTH } from '../config';
import { getTeamKitAssetKey, getTeamKitStyle } from '../data/teamKits';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import { FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import { loadSquad } from '../services/squadStorage';
import type { NationalTeamSquad } from '../data/squadTypes';
import { CardView } from '../ui/CardView';
import { createTeamFieldBackground } from '../ui/teamFieldBackground';
import { buildTeamColorSwatches } from '../ui/teamColorSwatches';
import { createDragScrollArea, TOUCH_SCROLL_WHEEL_FACTOR, clampScroll } from '../ui/touchInput';

const GRID_COLUMNS = 4;
const CARD_WIDTH = 171;
const CARD_HEIGHT = 42;
const GRID_GAP_X = 18;
const GRID_GAP_Y = 8;
const GRID_VIEWPORT_TOP = 108;
const GRID_VIEWPORT_HEIGHT = 520;
const LEFT_PANEL_X = 80;
const RIGHT_PANEL_X = 840;
const RIGHT_PANEL_WIDTH = 760;
const RIGHT_PANEL_HEIGHT = 571;
const SQUAD_CARD_WIDTH = RIGHT_PANEL_WIDTH / 2;
const SQUAD_TABLE_Y = 94;
const TEAM_PREVIEW_OFFSET_X = 190;
const TEAM_COLORS_SWATCH_Y = 62;
const TEAM_COLOR_SWATCH_RADIUS = 10;
const TEAM_COLOR_SWATCH_GAP = 10;
const TEAM_PREVIEW_FACE_Y = 190;
const TEAM_PREVIEW_BACK_Y = 432;
const TEAM_PREVIEW_CARD_SCALE = 1.45;
const TEAM_PREVIEW_DISPLAY_RANK = 'N';
const SQUAD_SECTION_ROW_GAP = 28;
const TRANSLUCENT_CARD_BACKGROUND = 0x000000;
const TEAM_OPTION_BACKGROUND_ALPHA = 0.36;
const TEAM_OPTION_ACTIVE_BACKGROUND_ALPHA = 0.52;
const SQUAD_PANEL_BACKGROUND_ALPHA = 0.42;

export class SquadSelectScene extends Phaser.Scene {
  private selectedTeamId = NATIONAL_TEAMS[0].flagCode;
  private squad: NationalTeamSquad = loadSquad(this.selectedTeamId);
  private teamGridScrollY = 0;

  public constructor() {
    super('SquadSelectScene');
  }

  public create(): void {
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);

    const centerX = SCENE_WIDTH / 2;
    createTeamFieldBackground(this);
    this.add
      .text(centerX, 34, 'Teams', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    const leftGridX = LEFT_PANEL_X;
    this.createBackButton(leftGridX + 66, 60, () => this.scene.start('MenuScene'));
    this.createTeamGrid(leftGridX);
    this.createSquadPanel(RIGHT_PANEL_X, 96);
  }

  private createBackButton(x: number, y: number, onClick: () => void): void {
    const button = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, 132, 38, 0xf0c95a, 1);
    background.setStrokeStyle(2, 0x2d382f);
    const label = this.add
      .text(0, -1, 'Back', {
        align: 'center',
        color: '#1f2a2e',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    button.add([background, label]);
    button.setSize(132, 38);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => background.setFillStyle(0xffd978));
    button.on('pointerout', () => background.setFillStyle(0xf0c95a));
    button.on('pointerdown', onClick);
  }

  private createTeamGrid(leftGridX: number): void {
    const content = this.add.container(0, GRID_VIEWPORT_TOP);
    const startX = leftGridX + CARD_WIDTH / 2;
    const viewportWidth = GRID_COLUMNS * CARD_WIDTH + (GRID_COLUMNS - 1) * GRID_GAP_X;
    const rowHeight = CARD_HEIGHT + GRID_GAP_Y;
    const rowCount = Math.ceil(NATIONAL_TEAMS.length / GRID_COLUMNS);
    const contentHeight = rowCount * rowHeight - GRID_GAP_Y;
    const maxScroll = Math.max(0, contentHeight - GRID_VIEWPORT_HEIGHT);
    const teamOptions: Phaser.GameObjects.Container[] = [];
    let refreshItemInputs = (): void => {};

    const setScroll = (value: number): void => {
      this.teamGridScrollY = clampScroll(value, maxScroll);
      content.y = GRID_VIEWPORT_TOP - this.teamGridScrollY;
      refreshItemInputs();
    };

    NATIONAL_TEAMS.forEach((team, index) => {
      const column = index % GRID_COLUMNS;
      const row = Math.floor(index / GRID_COLUMNS);
      const option = this.createTeamOption(
        startX + column * (CARD_WIDTH + GRID_GAP_X),
        CARD_HEIGHT / 2 + row * rowHeight,
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
      .fillRect(leftGridX, GRID_VIEWPORT_TOP, viewportWidth, GRID_VIEWPORT_HEIGHT)
      .createGeometryMask();
    maskGraphics.setVisible(false);
    content.setMask(mask);

    const scrollZone = this.add
      .zone(leftGridX + viewportWidth / 2, GRID_VIEWPORT_TOP + GRID_VIEWPORT_HEIGHT / 2, viewportWidth, GRID_VIEWPORT_HEIGHT)
      .setInteractive({ useHandCursor: maxScroll > 0 })
      .setDepth(-10);
    const dragScroll = createDragScrollArea({
      scene: this,
      viewport: {
        x: leftGridX,
        y: GRID_VIEWPORT_TOP,
        width: viewportWidth,
        height: GRID_VIEWPORT_HEIGHT
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
        dragScroll.bindScrollableTapTarget(option, () => this.selectTeam(team));
      }
    });
    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => {
      setScroll(this.teamGridScrollY + deltaY * TOUCH_SCROLL_WHEEL_FACTOR);
    });
    dragScroll.bindDragTarget(scrollZone);

    if (maxScroll > 0) {
      const trackX = leftGridX + viewportWidth + 12;
      const track = this.add.rectangle(trackX, GRID_VIEWPORT_TOP + GRID_VIEWPORT_HEIGHT / 2, 4, GRID_VIEWPORT_HEIGHT, 0x5f9572, 0.28);
      const thumbHeight = Math.max(28, (GRID_VIEWPORT_HEIGHT / contentHeight) * GRID_VIEWPORT_HEIGHT);
      const thumb = this.add.rectangle(trackX, GRID_VIEWPORT_TOP + thumbHeight / 2, 6, thumbHeight, 0xf0c95a, 0.88);
      const updateThumb = (): void => {
        thumb.y = GRID_VIEWPORT_TOP + thumbHeight / 2 + (this.teamGridScrollY / maxScroll) * (GRID_VIEWPORT_HEIGHT - thumbHeight);
        refreshItemInputs();
      };

      updateThumb();
      this.events.on(Phaser.Scenes.Events.UPDATE, updateThumb);
      content.once(Phaser.GameObjects.Events.DESTROY, () => {
        this.events.off(Phaser.Scenes.Events.UPDATE, updateThumb);
        maskGraphics.destroy();
      });
    } else {
      content.once(Phaser.GameObjects.Events.DESTROY, () => maskGraphics.destroy());
    }
  }

  private createTeamOption(x: number, y: number, team: NationalTeam): Phaser.GameObjects.Container {
    const isSelected = team.flagCode === this.selectedTeamId;
    const option = this.add.container(x, y);
    const background = this.add.rectangle(
      0,
      0,
      CARD_WIDTH,
      CARD_HEIGHT,
      TRANSLUCENT_CARD_BACKGROUND,
      isSelected ? TEAM_OPTION_ACTIVE_BACKGROUND_ALPHA : TEAM_OPTION_BACKGROUND_ALPHA
    );
    background.setStrokeStyle(2, isSelected ? 0xf0c95a : 0x5f9572, 0.95);

    const flag = this.add.image(-CARD_WIDTH / 2 + 22, 0, getFlagAssetKey(team.flagCode));
    flag.setDisplaySize(32, 24);
    const nameText = this.add
      .text(-CARD_WIDTH / 2 + 50, 0, team.name, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: '700',
        wordWrap: { width: 108 }
      })
      .setOrigin(0, 0.5);

    option.add([background, flag, nameText]);
    option.setSize(CARD_WIDTH, CARD_HEIGHT);
    option.setInteractive({ useHandCursor: true });
    option.on('pointerover', () => {
      if (!isSelected) {
        background.setFillStyle(TRANSLUCENT_CARD_BACKGROUND, TEAM_OPTION_ACTIVE_BACKGROUND_ALPHA);
      }
    });
    option.on('pointerout', () => {
      if (!isSelected) {
        background.setFillStyle(TRANSLUCENT_CARD_BACKGROUND, TEAM_OPTION_BACKGROUND_ALPHA);
      }
    });

    return option;
  }

  private selectTeam(team: NationalTeam): void {
    this.selectedTeamId = team.flagCode;
    this.squad = loadSquad(this.selectedTeamId);
    this.render();
  }

  private createSquadPanel(panelX: number, panelY: number): void {
    const panel = this.add.container(panelX, panelY);
    const background = this.add
      .rectangle(0, 0, SQUAD_CARD_WIDTH, RIGHT_PANEL_HEIGHT, TRANSLUCENT_CARD_BACKGROUND, SQUAD_PANEL_BACKGROUND_ALPHA)
      .setOrigin(0);
    background.setStrokeStyle(2, 0xf0c95a, 0.95);

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
        fontStyle: '700',
        wordWrap: { width: SQUAD_CARD_WIDTH - 120 }
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

    const squadTable = this.add.container(28, SQUAD_TABLE_Y);
    squadTable.add(this.createHeaderText(0, 0, 'Rank', 'left'));
    squadTable.add(this.createHeaderText(92, 0, 'Player', 'left'));
    squadTable.add(this.createHeaderText(SQUAD_CARD_WIDTH - 84, 0, 'Number', 'right'));
    squadTable.add(this.add.rectangle(0, 24, SQUAD_CARD_WIDTH - 56, 2, 0x5f9572, 0.9).setOrigin(0, 0));

    const goalkeeperY = 48;
    squadTable.add(this.createCellText(0, goalkeeperY, 'GK', 'left', '#f0c95a'));
    squadTable.add(this.createCellText(92, goalkeeperY, this.squad.goalkeeper.name, 'left', '#ffffff'));
    squadTable.add(this.createCellText(SQUAD_CARD_WIDTH - 84, goalkeeperY, String(this.squad.goalkeeper.shirtNumber), 'right', '#d9eadf'));

    FIELD_SQUAD_RANKS.forEach((rank, index) => {
      const player = this.squad.fieldPlayers[rank];
      const y = 84 + index * SQUAD_SECTION_ROW_GAP;
      squadTable.add(this.createCellText(0, y, rank, 'left', '#f0c95a'));
      squadTable.add(this.createCellText(92, y, player.name, 'left', '#ffffff'));
      squadTable.add(this.createCellText(SQUAD_CARD_WIDTH - 84, y, String(player.shirtNumber), 'right', '#d9eadf'));
    });

    const teamPreview = this.createTeamCardPreview(team);

    panel.add([background, header, squadTable, teamPreview]);
  }

  private createTeamCardPreview(team: NationalTeam): Phaser.GameObjects.Container {
    const preview = this.add.container(SQUAD_CARD_WIDTH + TEAM_PREVIEW_OFFSET_X, 0);
    const teamKitAssetKey = getTeamKitAssetKey(team.flagCode);
    const coverTextureKey = resolveTeamCoverLoadResult(this.textures, team.flagCode).textureKey;
    const faceCard = new CardView(this, 0, TEAM_PREVIEW_FACE_Y, {
      rank: TEAM_PREVIEW_DISPLAY_RANK,
      kitTextureKey: teamKitAssetKey,
      tooltipEnabled: false
    });
    const deckBack = new CardView(this, 0, TEAM_PREVIEW_BACK_Y, {
      rank: TEAM_PREVIEW_DISPLAY_RANK,
      faceDown: true,
      coverTextureKey,
      faceDownVariant: 'squad-preview',
      tooltipEnabled: false
    });

    faceCard.setScale(TEAM_PREVIEW_CARD_SCALE);
    deckBack.setScale(TEAM_PREVIEW_CARD_SCALE);
    preview.add([faceCard, deckBack, this.createTeamColorSwatches(team.flagCode)]);

    return preview;
  }

  private createTeamColorSwatches(flagCode: string): Phaser.GameObjects.Container {
    const swatches = this.add.container(0, 0);
    const style = getTeamKitStyle(flagCode);
    const layout = buildTeamColorSwatches(style, {
      swatchY: TEAM_COLORS_SWATCH_Y,
      radius: TEAM_COLOR_SWATCH_RADIUS,
      gap: TEAM_COLOR_SWATCH_GAP
    });

    if (layout.length === 0) {
      return swatches;
    }

    for (const swatch of layout) {
      const graphics = this.add.graphics();
      graphics.setPosition(swatch.x, swatch.y);
      graphics.setDepth(20);
      graphics.lineStyle(2, swatch.strokeColor, 1);
      graphics.fillStyle(swatch.fillColor, 1);
      graphics.fillCircle(0, 0, swatch.radius);
      graphics.strokeCircle(0, 0, swatch.radius);
      swatches.add(graphics);
    }

    return swatches;
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

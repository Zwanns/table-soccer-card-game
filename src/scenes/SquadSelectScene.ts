import Phaser from 'phaser';
import { resolveTeamCoverLoadResult } from '../assets/teamCover';
import { GAME_TITLE, SCENE_HEIGHT, SCENE_WIDTH } from '../config';
import { getTeamKitAssetKey, getTeamKitStyle } from '../data/teamKits';
import { getFlagAssetKey, NATIONAL_TEAMS, type NationalTeam } from '../data/nationalTeams';
import { FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import { loadSquad } from '../services/squadStorage';
import type { NationalTeamSquad } from '../data/squadTypes';
import { CardView } from '../ui/CardView';
import { buildTeamColorSwatches } from '../ui/teamColorSwatches';
import { createTeamsLayout, type TeamsLayout } from '../ui/teamScreenLayout';
import { setTouchFriendlyInteractive } from '../ui/touchInput';

const TEAM_PREVIEW_DISPLAY_RANK = 'N';

export class SquadSelectScene extends Phaser.Scene {
  private selectedTeamId = NATIONAL_TEAMS[0].flagCode;
  private squad: NationalTeamSquad = loadSquad(this.selectedTeamId);

  public constructor() {
    super('SquadSelectScene');
  }

  public create(): void {
    this.render();
  }

  private render(): void {
    this.children.removeAll(true);

    const layout = this.getTeamsLayout();
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
      .text(layout.scene.centerX, layout.subtitle.y, 'Teams', {
        color: '#d9eadf',
        fontFamily: 'Arial, sans-serif',
        fontSize: layout.subtitle.fontSize,
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.createBackButton(layout.backButton.x, layout.backButton.y, layout, () => this.scene.start('MenuScene'));
    this.createTeamGrid(layout);
    this.createSquadPanel(layout);
  }

  private getTeamsLayout(): TeamsLayout {
    return createTeamsLayout({
      width: this.scale.displaySize.width || this.scale.width,
      height: this.scale.displaySize.height || this.scale.height
    });
  }

  private createBackButton(x: number, y: number, layout: TeamsLayout, onClick: () => void): void {
    const button = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, layout.backButton.width, layout.backButton.height, 0xf0c95a, 1);
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
    button.setSize(layout.backButton.width, layout.backButton.height);
    setTouchFriendlyInteractive(button, layout.backButton.width, layout.backButton.height, {
      minHeight: layout.backButton.touchHeight,
      minWidth: layout.backButton.touchWidth
    });
    button.on('pointerover', () => background.setFillStyle(0xffd978));
    button.on('pointerout', () => background.setFillStyle(0xf0c95a));
    button.on('pointerdown', onClick);
  }

  private createTeamGrid(layout: TeamsLayout): void {
    const { teamList } = layout;
    const content = this.add.container(0, 0);
    const startX = teamList.x + teamList.cardWidth / 2;
    const rowCount = Math.ceil(NATIONAL_TEAMS.length / teamList.columns);
    const contentBottom = teamList.startY + (rowCount - 1) * (teamList.cardHeight + teamList.gapY) + teamList.cardHeight / 2;
    const maxScroll = Math.max(0, contentBottom - (teamList.viewport.y + teamList.viewport.height));
    const maskGraphics = this.make.graphics();
    const mask = maskGraphics
      .fillStyle(0xffffff)
      .fillRect(teamList.viewport.x, teamList.viewport.y, teamList.viewport.width, teamList.viewport.height)
      .createGeometryMask();
    const options: Array<{ baseY: number; option: Phaser.GameObjects.Container }> = [];
    let scrollY = 0;
    let dragPointerId: number | null = null;
    let lastDragY = 0;
    let dragDistance = 0;

    const setScroll = (value: number): void => {
      scrollY = Phaser.Math.Clamp(value, 0, maxScroll);
      content.y = -scrollY;
      updateOptionInput();
    };
    const updateOptionInput = (): void => {
      const viewportTop = teamList.viewport.y;
      const viewportBottom = teamList.viewport.y + teamList.viewport.height;

      for (const entry of options) {
        const optionY = entry.baseY - scrollY;
        const isTouchable =
          optionY + teamList.touchHeight / 2 >= viewportTop && optionY - teamList.touchHeight / 2 <= viewportBottom;

        if (entry.option.input != null) {
          entry.option.input.enabled = isTouchable;
        }
      }
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
      const column = index % teamList.columns;
      const row = Math.floor(index / teamList.columns);
      const y = teamList.startY + row * (teamList.cardHeight + teamList.gapY);
      const option = this.createTeamOption(startX + column * (teamList.cardWidth + teamList.gapX), y, team, layout, {
        onPointerDown: beginDrag,
        onPointerMove: updateDrag,
        onPointerUp: (pointer) =>
          finishDrag(pointer, () => {
            this.selectedTeamId = team.flagCode;
            this.squad = loadSquad(this.selectedTeamId);
            this.render();
          }),
        onWheel: (deltaY) => setScroll(scrollY + deltaY * 0.35)
      });

      options.push({ baseY: y, option });
      content.add(option);
    });

    const scrollZone = this.add
      .zone(
        teamList.viewport.x + teamList.viewport.width / 2,
        teamList.viewport.y + teamList.viewport.height / 2,
        teamList.viewport.width,
        teamList.viewport.height
      )
      .setInteractive();
    scrollZone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => setScroll(scrollY + deltaY * 0.35));
    scrollZone.on('pointerdown', beginDrag);
    scrollZone.on('pointermove', updateDrag);
    scrollZone.on('pointerup', (pointer: Phaser.Input.Pointer) => finishDrag(pointer));
    scrollZone.on('pointerout', (pointer: Phaser.Input.Pointer) => finishDrag(pointer));
    scrollZone.setDepth(-1);
    updateOptionInput();
  }

  private createTeamOption(
    x: number,
    y: number,
    team: NationalTeam,
    layout: TeamsLayout,
    handlers: {
      onPointerDown: (pointer: Phaser.Input.Pointer) => void;
      onPointerMove: (pointer: Phaser.Input.Pointer) => void;
      onPointerUp: (pointer: Phaser.Input.Pointer) => void;
      onWheel: (deltaY: number) => void;
    }
  ): Phaser.GameObjects.Container {
    const isSelected = team.flagCode === this.selectedTeamId;
    const { teamList } = layout;
    const option = this.add.container(x, y);
    const background = this.add.rectangle(
      0,
      0,
      teamList.cardWidth,
      teamList.cardHeight,
      isSelected ? 0x1d5b3f : 0x143f2c,
      0.92
    );
    background.setStrokeStyle(2, isSelected ? 0xf0c95a : 0x5f9572, 0.95);

    const flag = this.add.image(-teamList.cardWidth / 2 + 20, 0, getFlagAssetKey(team.flagCode));
    flag.setDisplaySize(28, 20);
    const nameText = this.add
      .text(-teamList.cardWidth / 2 + 44, 0, team.name, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700',
        wordWrap: { width: teamList.cardWidth - 58 }
      })
      .setOrigin(0, 0.5);

    option.add([background, flag, nameText]);
    option.setSize(teamList.cardWidth, teamList.cardHeight);
    setTouchFriendlyInteractive(option, teamList.cardWidth, teamList.cardHeight, {
      minHeight: teamList.touchHeight,
      minWidth: teamList.touchWidth
    });
    option.on('pointerover', () => {
      if (!isSelected) {
        background.setFillStyle(0x1d5b3f, 0.95);
      }
    });
    option.on('pointerout', () => {
      if (!isSelected) {
        background.setFillStyle(0x143f2c, 0.92);
      }
    });
    option.on('pointerdown', (pointer: Phaser.Input.Pointer) => handlers.onPointerDown(pointer));
    option.on('pointermove', (pointer: Phaser.Input.Pointer) => handlers.onPointerMove(pointer));
    option.on('pointerup', (pointer: Phaser.Input.Pointer) => handlers.onPointerUp(pointer));
    option.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number) => handlers.onWheel(deltaY));

    return option;
  }

  private createSquadPanel(layout: TeamsLayout): void {
    const panel = this.add.container(layout.squadPanel.x, layout.squadPanel.y);
    const background = this.add.rectangle(0, 0, layout.squadPanel.cardWidth, layout.squadPanel.height, 0x143f2c, 0.92).setOrigin(0);

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
        wordWrap: { width: layout.squadPanel.cardWidth - 120 }
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

    const squadTable = this.add.container(28, layout.squadPanel.tableY);
    squadTable.add(this.createHeaderText(0, 0, 'Rank', 'left'));
    squadTable.add(this.createHeaderText(92, 0, 'Player', 'left'));
    squadTable.add(this.createHeaderText(layout.squadPanel.cardWidth - 84, 0, 'Number', 'right'));
    squadTable.add(this.add.rectangle(0, 24, layout.squadPanel.cardWidth - 56, 2, 0x5f9572, 0.9).setOrigin(0, 0));

    const goalkeeperY = 48;
    squadTable.add(this.createCellText(0, goalkeeperY, 'GK', 'left', '#f0c95a'));
    squadTable.add(this.createCellText(92, goalkeeperY, this.squad.goalkeeper.name, 'left', '#ffffff'));
    squadTable.add(this.createCellText(layout.squadPanel.cardWidth - 84, goalkeeperY, String(this.squad.goalkeeper.shirtNumber), 'right', '#d9eadf'));

    FIELD_SQUAD_RANKS.forEach((rank, index) => {
      const player = this.squad.fieldPlayers[rank];
      const y = 84 + index * layout.squadPanel.sectionRowGap;
      squadTable.add(this.createCellText(0, y, rank, 'left', '#f0c95a'));
      squadTable.add(this.createCellText(92, y, player.name, 'left', '#ffffff'));
      squadTable.add(this.createCellText(layout.squadPanel.cardWidth - 84, y, String(player.shirtNumber), 'right', '#d9eadf'));
    });

    const teamPreview = this.createTeamCardPreview(team, layout);

    panel.add([background, header, squadTable, teamPreview]);
  }

  private createTeamCardPreview(team: NationalTeam, layout: TeamsLayout): Phaser.GameObjects.Container {
    const preview = this.add.container(layout.squadPanel.cardWidth + layout.preview.offsetX, 0);
    const teamKitAssetKey = getTeamKitAssetKey(team.flagCode);
    const coverTextureKey = resolveTeamCoverLoadResult(this.textures, team.flagCode).textureKey;
    const faceCard = new CardView(this, 0, layout.preview.faceY, {
      rank: TEAM_PREVIEW_DISPLAY_RANK,
      kitTextureKey: teamKitAssetKey,
      tooltipEnabled: false
    });
    const deckBack = new CardView(this, 0, layout.preview.backY, {
      rank: TEAM_PREVIEW_DISPLAY_RANK,
      faceDown: true,
      coverTextureKey,
      faceDownVariant: 'squad-preview',
      tooltipEnabled: false
    });

    faceCard.setScale(layout.preview.cardScale);
    deckBack.setScale(layout.preview.cardScale);
    preview.add([faceCard, deckBack, this.createTeamColorSwatches(team.flagCode, layout)]);

    return preview;
  }

  private createTeamColorSwatches(flagCode: string, layout: TeamsLayout): Phaser.GameObjects.Container {
    const swatches = this.add.container(0, 0);
    const style = getTeamKitStyle(flagCode);
    const swatchLayout = buildTeamColorSwatches(style, {
      swatchY: layout.preview.colorsY,
      radius: layout.preview.colorRadius,
      gap: layout.preview.colorGap
    });

    if (swatchLayout.length === 0) {
      return swatches;
    }

    for (const swatch of swatchLayout) {
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

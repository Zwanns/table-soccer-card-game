import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import { NATIONAL_TEAMS } from '../data/nationalTeams';
import { getTeamKitStyle } from '../data/teamKits';
import { buildTeamColorSwatches } from '../ui/teamColorSwatches';

describe('read-only squad scenes', () => {
  it('registers squad scenes and keeps the menu button for squads', () => {
    const mainSource = readSource('src/main.ts');
    const menuSource = readSource('src/scenes/MenuScene.ts');

    expect(mainSource).toContain('SquadSelectScene');
    expect(mainSource).toContain('SquadEditorScene');
    expect(menuSource).toContain('Teams');
    expect(menuSource).toContain("this.scene.start('SquadSelectScene')");
  });

  it('shows all national teams in the squad selector', () => {
    const selectSource = readSource('src/scenes/SquadSelectScene.ts');

    expect(NATIONAL_TEAMS).toHaveLength(65);
    expect(selectSource).toContain('const CARD_WIDTH = 180');
    expect(selectSource).toContain('const CARD_HEIGHT = 48');
    expect(selectSource).toContain('const GRID_GAP_X = 12');
    expect(selectSource).toContain('const LEFT_PANEL_X = 60');
    expect(selectSource).toContain("import { MENU_ASSETS, SCENE_HEIGHT, SCENE_WIDTH } from '../config'");
    expect(selectSource).toContain("import { createTeamFieldBackground } from '../ui/teamFieldBackground'");
    expect(selectSource).toContain('private createTeamsBackground');
    expect(selectSource).toContain('this.textures.exists(MENU_ASSETS.teamsBackground)');
    expect(selectSource).toContain('this.add.image(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, MENU_ASSETS.teamsBackground)');
    expect(selectSource).toContain('background.setDisplaySize(SCENE_WIDTH, SCENE_HEIGHT)');
    expect(selectSource).toContain('createTeamFieldBackground(this)');
    expect(selectSource).not.toContain('GAME_TITLE');
    expect(selectSource).toContain('NATIONAL_TEAMS.forEach');
    expect(selectSource).toContain('getFlagAssetKey(team.flagCode)');
    expect(selectSource).toContain('team.name');
    expect(selectSource).toContain('flag.setDisplaySize(36, 27)');
    expect(selectSource).toContain("fontSize: '16px'");
    expect(selectSource).toContain('wordWrap: { width: 118 }');
    expect(selectSource).toContain('this.createBackButton');
    expect(selectSource).toContain("this.scene.start('MenuScene')");
    expect(selectSource).not.toContain('TEAMS_PER_PAGE');
  });

  it('uses a Back text button on the Teams screen without the old arrow label', () => {
    const selectSource = readSource('src/scenes/SquadSelectScene.ts');

    expect(selectSource).toContain('const teamSelectionLayout = createTeamScreenLayout()');
    expect(selectSource).toContain('const backButtonRect = {');
    expect(selectSource).toContain('...teamSelectionLayout.menuButtonRect');
    expect(selectSource).toContain('x: leftGridX');
    expect(selectSource).toContain("this.createBackButton(backButtonRect, () => this.scene.start('MenuScene'))");
    expect(selectSource).toContain("new Button(this, center.x, center.y, 'Back', onClick");
    expect(selectSource).toContain('width: rect.width');
    expect(selectSource).toContain('height: rect.height');
    expect(selectSource).not.toContain(".text(0, -1, '<'");
  });

  it('renders the squad screen as a read-only Phaser view', () => {
    const editorSource = readSource('src/scenes/SquadEditorScene.ts');

    expect(editorSource).toContain('Read-only squad viewer');
    expect(editorSource).toContain('Состав сборной');
    expect(editorSource).toContain('Полевые игроки');
    expect(editorSource).toContain('Вратарь');
    expect(editorSource).toContain('GK');
    expect(editorSource).toContain('Назад');
    expect(editorSource).toContain('FIELD_SQUAD_RANKS.forEach');
    expect(editorSource).toContain('this.squad.goalkeeper');
  });

  it('does not include editing controls or DOM form plumbing', () => {
    const editorSource = readSource('src/scenes/SquadEditorScene.ts');

    expect(editorSource).not.toContain('document.createElement');
    expect(editorSource).not.toContain('add.dom');
    expect(editorSource).not.toContain('HTMLFormElement');
    expect(editorSource).not.toContain('input');
    expect(editorSource).not.toContain('radio');
    expect(editorSource).not.toContain('Сохранить');
    expect(editorSource).not.toContain('Сбросить состав');
    expect(editorSource).not.toContain('saveSquad');
    expect(editorSource).not.toContain('resetSquad');
    expect(editorSource).not.toContain('validateSquad');
  });

  it('removed the draft helper that only served editing', () => {
    expect(existsSync(join(process.cwd(), 'src', 'scenes', 'squadEditorDraft.ts'))).toBe(false);
  });

  it('keeps the read-only table aligned with the 14 field ranks', () => {
    expect(FIELD_SQUAD_RANKS).toHaveLength(14);
    expect(FIELD_SQUAD_RANKS).toContain('JOKER');
  });

  it('shows selected team preview cards beside a compact squad card styled like team cards', () => {
    const selectSource = readSource('src/scenes/SquadSelectScene.ts');

    expect(selectSource).toContain('const SQUAD_CARD_WIDTH = RIGHT_PANEL_WIDTH / 2');
    expect(selectSource).toContain('const RIGHT_PANEL_HEIGHT = 571');
    expect(selectSource).toContain('const SQUAD_TABLE_Y = 94');
    expect(selectSource).toContain("import { TEAM_CARD_STYLE } from '../ui/teamCardStyle'");
    expect(selectSource).toContain('const SQUAD_PANEL_COLORS = {');
    expect(selectSource).toContain('background: 0x11161a');
    expect(selectSource).toContain('border: 0xc7cfd6');
    expect(selectSource).toContain('divider: 0x9aa4ad');
    expect(selectSource).toContain('header: \'#bfc7ce\'');
    expect(selectSource).toContain(
      '.rectangle(0, 0, SQUAD_CARD_WIDTH, RIGHT_PANEL_HEIGHT, SQUAD_PANEL_COLORS.background, SQUAD_PANEL_COLORS.backgroundAlpha)'
    );
    expect(selectSource).toContain('background.setStrokeStyle(2, SQUAD_PANEL_COLORS.border, SQUAD_PANEL_COLORS.borderAlpha)');
    expect(selectSource).toContain(
      'const style = isSelected ? TEAM_CARD_STYLE.selected : TEAM_CARD_STYLE.normal'
    );
    expect(selectSource).toContain('style.backgroundColor');
    expect(selectSource).toContain('style.borderColor');
    expect(selectSource).toContain('TEAM_CARD_STYLE.hover.backgroundAlpha');
    expect(selectSource).toContain('const TEAM_PREVIEW_OFFSET_X = 190');
    expect(selectSource).toContain('const TEAM_COLORS_SWATCH_Y = 62');
    expect(selectSource).toContain('const TEAM_COLOR_SWATCH_RADIUS = 10');
    expect(selectSource).toContain('const TEAM_PREVIEW_CARD_SCALE = 1.45');
    expect(selectSource).toContain("const TEAM_PREVIEW_DISPLAY_RANK = 'N'");
    expect(selectSource).not.toContain('TEAM_PREVIEW_KIT_DISPLAY_SCALE_MULTIPLIER');
    expect(selectSource).toContain('createTeamCardPreview');
    expect(selectSource).toContain('this.createTeamColorSwatches(team.flagCode)');
    expect(selectSource).toContain("import { createCardPlayerProfile, type CardPlayerProfile } from '../ui/cardPlayerProfile'");
    expect(selectSource).toContain('private getPreviewFieldPlayerProfile(team: NationalTeam): CardPlayerProfile | undefined');
    expect(selectSource).toContain('for (const rank of FIELD_SQUAD_RANKS)');
    expect(selectSource).toContain('const player = this.squad.fieldPlayers[rank]');
    expect(selectSource).toContain('return createCardPlayerProfile(team.flagCode, player)');
    expect(selectSource).toContain('return undefined');
    expect(selectSource).toContain('const previewPlayerProfile = this.getPreviewFieldPlayerProfile(team)');
    expect(selectSource).toContain('new CardView(this, 0, TEAM_PREVIEW_FACE_Y');
    expect(selectSource).toContain('rank: TEAM_PREVIEW_DISPLAY_RANK');
    expect(selectSource).toContain('getTeamKitAssetKey(team.flagCode)');
    expect(selectSource).toContain("kitLayoutVariant: 'teams-preview'");
    expect(selectSource).toContain('playerProfile: previewPlayerProfile');
    expect(readSource('src/ui/KitCardFaceView.ts')).toContain('.setScale(1, KIT_CARD_LAYOUT.shirtNumberScaleY)');
    expect(selectSource).toContain('new CardView(this, 0, TEAM_PREVIEW_BACK_Y');
    expect(selectSource).toContain('faceDown: true');
    expect(selectSource).toContain("faceDownVariant: 'squad-preview'");
    expect(selectSource).toContain('resolveTeamCoverLoadResult(this.textures, team.flagCode).textureKey');
    expect(selectSource).toContain('SQUAD_CARD_WIDTH + TEAM_PREVIEW_OFFSET_X');
    expect(selectSource).toContain('faceCard.setScale(TEAM_PREVIEW_CARD_SCALE)');
    expect(selectSource).toContain('deckBack.setScale(TEAM_PREVIEW_CARD_SCALE)');
    expect(selectSource).toContain('preview.add([faceCard, deckBack, this.createTeamColorSwatches(team.flagCode)])');
    expect(selectSource).not.toContain('TEAM_PREVIEW_BACK_SCALE');
    expect(selectSource).not.toContain('createTeamKitPreview');
    expect(selectSource).not.toContain('kit.setDisplaySize');
    expect(selectSource).not.toContain("color: '#9fc5ad'");
    expect(selectSource).not.toContain('0x5f9572, 0.9');
  });

  it('fades team list cards themselves near the viewport edges without dark overlays', () => {
    const selectSource = readSource('src/scenes/SquadSelectScene.ts');

    expect(selectSource).toContain('const TEAM_LIST_FADE_HEIGHT = 52');
    expect(selectSource).toContain('const TEAM_LIST_FADE_MIN_ALPHA = 0.22');
    expect(selectSource).toContain('const TEAM_LIST_SCROLL_EDGE_EPSILON = 0.5');
    expect(selectSource).toContain('this.updateTeamListItemAlphas(content, teamOptions, maxScroll)');
    expect(selectSource).toContain(
      'teamOptions: readonly Phaser.GameObjects.Container[],'
    );
    expect(selectSource).toContain('maxScroll: number');
    expect(selectSource).toContain('const viewportBottom = GRID_VIEWPORT_TOP + GRID_VIEWPORT_HEIGHT');
    expect(selectSource).toContain('const shouldFadeTop = this.teamGridScrollY > TEAM_LIST_SCROLL_EDGE_EPSILON');
    expect(selectSource).toContain('const shouldFadeBottom = this.teamGridScrollY < maxScroll - TEAM_LIST_SCROLL_EDGE_EPSILON');
    expect(selectSource).toContain('const itemCenterY = content.y + option.y');
    expect(selectSource).toContain('if (shouldFadeTop)');
    expect(selectSource).toContain('const distanceToTopEdge = itemCenterY - GRID_VIEWPORT_TOP');
    expect(selectSource).toContain('if (shouldFadeBottom)');
    expect(selectSource).toContain('const distanceToBottomEdge = viewportBottom - itemCenterY');
    expect(selectSource).toContain('option.setAlpha(alpha)');
    expect(selectSource).not.toContain('private createTeamListFade');
    expect(selectSource).not.toContain('TEAM_LIST_FADE_MAX_ALPHA');
    expect(selectSource).not.toContain('fade.fillRect');
  });

  it('shows selected team colors from teamKits above the squad preview cards', () => {
    const selectSource = readSource('src/scenes/SquadSelectScene.ts');
    const armeniaStyle = getTeamKitStyle('am');
    const northernIrelandStyle = getTeamKitStyle('nir');
    const franceStyle = getTeamKitStyle('fr');
    const spainStyle = getTeamKitStyle('es');

    expect(armeniaStyle).toMatchObject({
      primaryColor: '#D90012',
      secondaryColor: '#0033A0',
      shirtNumberColor: '#FFFFFF',
      shirtNumberStrokeColor: '#111111'
    });
    expect(northernIrelandStyle?.primaryColor).toBe('#006A3A');
    expect(franceStyle?.primaryColor).toBe('#002654');
    expect(spainStyle?.primaryColor).toBe('#AA151B');

    expect(selectSource).toContain("import { getTeamKitAssetKey, getTeamKitStyle } from '../data/teamKits'");
    expect(selectSource).toContain("import { buildTeamColorSwatches } from '../ui/teamColorSwatches'");
    expect(selectSource).toContain('const style = getTeamKitStyle(flagCode)');
    expect(selectSource).toContain('const layout = buildTeamColorSwatches(style');
    expect(selectSource).toContain('graphics.setPosition(swatch.x, swatch.y)');
    expect(selectSource).toContain('graphics.setDepth(20)');
    expect(selectSource).toContain('graphics.lineStyle(2, swatch.strokeColor, 1)');
    expect(selectSource).toContain('graphics.fillStyle(swatch.fillColor, 1)');
    expect(selectSource).toContain('graphics.fillCircle(0, 0, swatch.radius)');
    expect(selectSource).toContain('graphics.strokeCircle(0, 0, swatch.radius)');
    expect(selectSource).not.toContain("'Colors'");
    expect(buildTeamColorSwatches(getTeamKitStyle('ua'), {
      swatchY: 62,
      radius: 10,
      gap: 10
    }).map((swatch) => swatch.color)).toEqual(['#FFD700', '#0057B8']);
    expect(buildTeamColorSwatches(getTeamKitStyle('br'), {
      swatchY: 62,
      radius: 10,
      gap: 10
    }).map((swatch) => swatch.role)).toEqual(['primary', 'secondary', 'accent']);
  });

  it('refreshes team preview cards when the selected squad changes', () => {
    const selectSource = readSource('src/scenes/SquadSelectScene.ts');

    expect(selectSource).toContain('this.selectedTeamId = team.flagCode');
    expect(selectSource).toContain('this.squad = loadSquad(this.selectedTeamId)');
    expect(selectSource).toContain('this.render()');
    expect(selectSource).toContain('const team = getTeam(this.selectedTeamId)');
    expect(selectSource).toContain('const teamPreview = this.createTeamCardPreview(team)');
    expect(selectSource).toContain('panel.add([background, header, squadTable, teamPreview])');
  });
});

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

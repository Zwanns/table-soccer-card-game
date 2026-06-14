import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FIELD_SQUAD_RANKS } from '../data/defaultSquads';
import { NATIONAL_TEAMS } from '../data/nationalTeams';

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

    expect(NATIONAL_TEAMS).toHaveLength(64);
    expect(selectSource).toContain('NATIONAL_TEAMS.forEach');
    expect(selectSource).toContain('getFlagAssetKey(team.flagCode)');
    expect(selectSource).toContain('team.name');
    expect(selectSource).toContain('this.createBackButton');
    expect(selectSource).toContain("this.scene.start('MenuScene')");
    expect(selectSource).not.toContain('TEAMS_PER_PAGE');
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

  it('shows selected team preview cards beside a compact borderless squad card', () => {
    const selectSource = readSource('src/scenes/SquadSelectScene.ts');

    expect(selectSource).toContain('const SQUAD_CARD_WIDTH = RIGHT_PANEL_WIDTH / 2');
    expect(selectSource).toContain('const RIGHT_PANEL_HEIGHT = 571');
    expect(selectSource).toContain('const SQUAD_TABLE_Y = 94');
    expect(selectSource).toContain('const TEAM_PREVIEW_OFFSET_X = 190');
    expect(selectSource).toContain('const TEAM_PREVIEW_CARD_SCALE = 1.45');
    expect(selectSource).toContain("const TEAM_PREVIEW_DISPLAY_RANK = 'N'");
    expect(selectSource).toContain('createTeamCardPreview');
    expect(selectSource).toContain('new CardView(this, 0, TEAM_PREVIEW_FACE_Y');
    expect(selectSource).toContain('rank: TEAM_PREVIEW_DISPLAY_RANK');
    expect(selectSource).toContain('getTeamKitAssetKey(team.flagCode)');
    expect(selectSource).toContain('new CardView(this, 0, TEAM_PREVIEW_BACK_Y');
    expect(selectSource).toContain('faceDown: true');
    expect(selectSource).toContain("faceDownVariant: 'squad-preview'");
    expect(selectSource).toContain('resolveTeamCoverLoadResult(this.textures, team.flagCode).textureKey');
    expect(selectSource).toContain('SQUAD_CARD_WIDTH + TEAM_PREVIEW_OFFSET_X');
    expect(selectSource).toContain('faceCard.setScale(TEAM_PREVIEW_CARD_SCALE)');
    expect(selectSource).toContain('deckBack.setScale(TEAM_PREVIEW_CARD_SCALE)');
    expect(selectSource).not.toContain('TEAM_PREVIEW_BACK_SCALE');
    expect(selectSource).not.toContain('createTeamKitPreview');
    expect(selectSource).not.toContain('kit.setDisplaySize');
    expect(selectSource).not.toContain('background.setStrokeStyle(2, 0x5f9572, 0.95);');
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

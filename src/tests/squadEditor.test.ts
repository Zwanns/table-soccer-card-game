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

  it('shows the selected team kit beside a compact borderless squad card', () => {
    const selectSource = readSource('src/scenes/SquadSelectScene.ts');

    expect(selectSource).toContain('const SQUAD_CARD_WIDTH = RIGHT_PANEL_WIDTH / 2');
    expect(selectSource).toContain('const RIGHT_PANEL_HEIGHT = 571');
    expect(selectSource).toContain('const SQUAD_TABLE_Y = 94');
    expect(selectSource).toContain('const KIT_PREVIEW_OFFSET_X = 190');
    expect(selectSource).toContain('createTeamKitPreview');
    expect(selectSource).toContain('getTeamKitAssetKey(team.flagCode)');
    expect(selectSource).toContain('FALLBACK_TEAM_KIT_ASSET.assetKey');
    expect(selectSource).toContain('kit.setDisplaySize(KIT_PREVIEW_WIDTH, KIT_PREVIEW_HEIGHT)');
    expect(selectSource).toContain('SQUAD_CARD_WIDTH + KIT_PREVIEW_OFFSET_X');
    expect(selectSource).not.toContain('background.setStrokeStyle(2, 0x5f9572, 0.95);');
  });
});

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

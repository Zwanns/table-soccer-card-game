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
    expect(menuSource).toContain('Составы');
    expect(menuSource).toContain("this.scene.start('SquadSelectScene')");
  });

  it('shows all national teams in the squad selector', () => {
    const selectSource = readSource('src/scenes/SquadSelectScene.ts');

    expect(NATIONAL_TEAMS).toHaveLength(64);
    expect(selectSource).toContain('NATIONAL_TEAMS.forEach');
    expect(selectSource).toContain('getFlagAssetKey(team.flagCode)');
    expect(selectSource).toContain('team.name');
    expect(selectSource).toContain('Открыть');
    expect(selectSource).toContain('Назад');
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
});

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

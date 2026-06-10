import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDefaultSquad } from '../data/defaultSquads';
import {
  createDraftSquadFromValues,
  validateSquadEditorValues,
  type SquadEditorValues
} from '../scenes/squadEditorDraft';

describe('squad editor scene integration', () => {
  it('registers squad scenes and enables Phaser DOM support', () => {
    const mainSource = readFileSync(join(process.cwd(), 'src', 'main.ts'), 'utf8');

    expect(mainSource).toContain('SquadSelectScene');
    expect(mainSource).toContain('SquadEditorScene');
    expect(mainSource).toContain('createContainer: true');
  });

  it('adds a main menu button for squads', () => {
    const menuSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'MenuScene.ts'), 'utf8');

    expect(menuSource).toContain('Squads');
    expect(menuSource).toContain("this.scene.start('SquadSelectScene')");
  });

  it('keeps editor DOM cleanup explicit and does not use prompt', () => {
    const editorSource = readFileSync(join(process.cwd(), 'src', 'scenes', 'SquadEditorScene.ts'), 'utf8');

    expect(editorSource).toContain('cleanupDom');
    expect(editorSource).not.toContain('prompt(');
  });
});

describe('squad editor draft helpers', () => {
  it('trims names and builds a draft squad from editor values', () => {
    const values = createValues();
    const draft = createDraftSquadFromValues(values);

    expect(draft.teamId).toBe('pl');
    expect(draft.fieldPlayers['9']).toEqual({
      rank: '9',
      name: 'Lewandowski',
      shirtNumber: 19
    });
    expect(draft.goalkeepers[1]).toEqual({
      id: 'pl-gk-2',
      name: 'Second keeper',
      shirtNumber: 12
    });
    expect(draft.defaultStartingGoalkeeperId).toBe('pl-gk-2');
  });

  it('validates draft editor values through squad validation', () => {
    const validValues = createValues();
    const invalidValues = createValues();
    invalidValues.fieldPlayers = invalidValues.fieldPlayers.map((player) =>
      player.rank === '9' ? { ...player, name: '   ' } : player
    );

    expect(validateSquadEditorValues(validValues)).toEqual({ ok: true, issues: [] });
    expect(validateSquadEditorValues(invalidValues)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: 'INVALID_PLAYER_NAME' })])
    });
  });

  it('marks empty and fractional shirt numbers invalid', () => {
    const emptyNumberValues = createValues();
    emptyNumberValues.fieldPlayers = emptyNumberValues.fieldPlayers.map((player) =>
      player.rank === '9' ? { ...player, shirtNumber: '' } : player
    );
    const fractionalNumberValues = createValues();
    fractionalNumberValues.fieldPlayers = fractionalNumberValues.fieldPlayers.map((player) =>
      player.rank === '9' ? { ...player, shirtNumber: '9.5' } : player
    );

    expect(validateSquadEditorValues(emptyNumberValues)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: 'INVALID_SHIRT_NUMBER' })])
    });
    expect(validateSquadEditorValues(fractionalNumberValues)).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: 'INVALID_SHIRT_NUMBER' })])
    });
  });
});

function createValues(): SquadEditorValues {
  const squad = createDefaultSquad('pl');

  return {
    teamId: squad.teamId,
    fieldPlayers: Object.values(squad.fieldPlayers).map((player) => ({
      rank: player.rank,
      name: player.rank === '9' ? '  Lewandowski  ' : player.name,
      shirtNumber: player.rank === '9' ? '19' : String(player.shirtNumber)
    })),
    goalkeepers: [
      {
        id: squad.goalkeepers[0].id,
        name: squad.goalkeepers[0].name,
        shirtNumber: String(squad.goalkeepers[0].shirtNumber),
        isStarting: false
      },
      {
        id: squad.goalkeepers[1].id,
        name: '  Second keeper  ',
        shirtNumber: String(squad.goalkeepers[1].shirtNumber),
        isStarting: true
      }
    ]
  };
}

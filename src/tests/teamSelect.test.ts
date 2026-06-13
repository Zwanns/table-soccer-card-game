import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readTeamSelectSource(): string {
  return readFileSync(join(process.cwd(), 'src', 'scenes', 'TeamSelectScene.ts'), 'utf8');
}

describe('quick match team selection AI controls', () => {
  it('uses HUMAN as the default quick match controller type', () => {
    const source = readTeamSelectSource();

    expect(source).toContain("export const DEFAULT_QUICK_MATCH_CONTROLLER_TYPE: PlayerControllerType = 'HUMAN'");
    expect(source).toContain("return controllerType === 'AI' ? 'HUMAN' : 'AI'");
  });

  it('stores independent controller types for both selected teams', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('private player1ControllerType: PlayerControllerType');
    expect(source).toContain('private player2ControllerType: PlayerControllerType');
    expect(source).toContain('this.player1ControllerType = toggleQuickMatchControllerType(this.player1ControllerType)');
    expect(source).toContain('this.player2ControllerType = toggleQuickMatchControllerType(this.player2ControllerType)');
  });

  it('resets both AI checkboxes when the scene is initialized again', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('this.player1ControllerType = DEFAULT_QUICK_MATCH_CONTROLLER_TYPE');
    expect(source).toContain('this.player2ControllerType = DEFAULT_QUICK_MATCH_CONTROLLER_TYPE');
  });

  it('passes quick match controller types to GameScene on match start', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('player1ControllerType: this.player1ControllerType');
    expect(source).toContain('player2ControllerType: this.player2ControllerType');
    expect(source).toContain("this.scene.start('GameScene', data)");
  });

  it('passes standalone penalty controller types to the penalty scene', () => {
    const source = readTeamSelectSource();

    expect(source).toContain("this.scene.start('TournamentPenaltyScene'");
    expect(source).toContain('matchResult: createStandalonePenaltyMatchResult(data)');
    expect(source).toContain('player1ControllerType: data.player1ControllerType');
    expect(source).toContain('player2ControllerType: data.player2ControllerType');
  });

  it('uses the same default-off independent AI checkboxes for standalone penalties without a separate settings screen', () => {
    const source = readTeamSelectSource();

    expect(source).toContain("this.mode === 'penalty' ? 'Penalty teams' : 'Team selection'");
    expect(source).toContain("this.mode === 'penalty' ? 'Start penalties' : 'Start'");
    expect(source).toContain('this.createSelectedPanel(370, 126');
    expect(source).toContain('this.createSelectedPanel(1230, 126');
    expect(source).toContain('this.addAiCheckbox(panel, 156, -20, slot)');
    expect(source).toContain("export const DEFAULT_QUICK_MATCH_CONTROLLER_TYPE: PlayerControllerType = 'HUMAN'");
    expect(source).not.toContain('PenaltyAiSettings');
    expect(source).not.toContain('AI settings');
  });

  it('keeps the AI checkbox hit area separate from the selected team panel', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('this.addAiCheckbox(panel, 156, -20, slot)');
    expect(source).toContain('event.stopPropagation()');
    expect(source).toContain('checkbox.setSize(58, 28)');
  });

  it('keeps the 8x8 country grid layout on one page', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('const TEAM_GRID_COLUMNS = 8');
    expect(source).not.toContain('page + 1');
    expect(source).not.toContain('1 / 2');
  });
});

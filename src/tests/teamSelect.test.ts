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

  it('resets both controller toggles to Player when the scene is initialized again', () => {
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

  it('uses the same default-player independent controller toggles for standalone penalties without a separate settings screen', () => {
    const source = readTeamSelectSource();

    expect(source).toContain("this.mode === 'penalty' ? 'Penalty teams' : 'Team selection'");
    expect(source).toContain('.text(centerX, 34');
    expect(source).not.toContain('GAME_TITLE');
    expect(source).toContain("this.mode === 'penalty' ? 'Start penalties' : 'Start'");
    expect(source).toContain('this.createSelectedPanel(layout.team1SelectedCardRect');
    expect(source).toContain('this.createSelectedPanel(layout.team2SelectedCardRect');
    expect(source).toContain('this.addControllerToggle(panel');
    expect(source).toContain("'Player'");
    expect(source).toContain("'AI'");
    expect(source).toContain("export const DEFAULT_QUICK_MATCH_CONTROLLER_TYPE: PlayerControllerType = 'HUMAN'");
    expect(source).not.toContain('PenaltyAiSettings');
    expect(source).not.toContain('AI settings');
  });

  it('keeps the Player AI toggle hit area separate from the selected team panel', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('private addControllerToggle');
    expect(source).toContain('event.stopPropagation()');
    expect(source).toContain('toggle.setSize(width, height)');
    expect(source).toContain('this.toggleControllerType(slot)');
  });

  it('places selected team labels above panels aligned to panel left edges', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('const SELECTED_PANEL_LABEL_OFFSET_Y = 16');
    expect(source).toContain('.text(rect.x, rect.y - SELECTED_PANEL_LABEL_OFFSET_Y, title');
    expect(source).toContain('slotLabel.setDepth(1)');
  });

  it('keeps the 8-column country grid layout on one page', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('const TEAM_GRID_COLUMNS = TEAM_SCREEN_GRID_COLUMNS');
    expect(source).not.toContain('page + 1');
    expect(source).not.toContain('1 / 2');
  });

  it('uses selected team cover fans and kit previews in both match modes', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('createTeamScreenLayout()');
    expect(source).toContain('resolveTeamCoverLoadResult(this.textures, team.flagCode).textureKey');
    expect(source).toContain('private createSelectedTeamCoverFan');
    expect(source).toContain('const SELECTED_COVER_FAN_CARD_COUNT = 3');
    expect(source).toContain("faceDownVariant: 'preview'");
    expect(source).toContain('private createTeamKitPreview');
    expect(source).toContain('getTeamKitAssetKey(team.flagCode)');
    expect(source).toContain('FALLBACK_TEAM_KIT_ASSET.assetKey');
  });

  it('draws a football field background without global scale or input changes', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('private createTeamSelectFieldBackground');
    expect(source).toContain('const stripeCount = 14');
    expect(source).toContain('graphics.lineBetween(SCENE_WIDTH / 2');
    expect(source).toContain('graphics.strokeCircle(SCENE_WIDTH / 2');
    expect(source).toContain('graphics.setDepth(-20)');
  });
});

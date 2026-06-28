import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readTeamSelectSource(): string {
  return readFileSync(join(process.cwd(), 'src', 'scenes', 'TeamSelectScene.ts'), 'utf8');
}

function readScrollEdgeFadeSource(): string {
  return readFileSync(join(process.cwd(), 'src', 'ui', 'scrollEdgeFade.ts'), 'utf8');
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
    const startMatchBlock = source.slice(source.indexOf('private startMatch(): void'));

    expect(source).toContain("private mode: TeamSelectSceneData['mode'] = 'match'");
    expect(source).toContain("this.mode = data.mode ?? 'match'");
    expect(source).toContain('player1ControllerType: this.player1ControllerType');
    expect(source).toContain('player2ControllerType: this.player2ControllerType');
    expect(startMatchBlock).toContain("if (this.mode === 'penalty') {");
    expect(startMatchBlock).toContain("this.scene.start('GameScene', data)");
    expect(startMatchBlock.indexOf("this.scene.start('GameScene', data)")).toBeGreaterThan(
      startMatchBlock.indexOf("if (this.mode === 'penalty') {")
    );
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
    expect(source).toContain('layout.team1SelectedCardRect');
    expect(source).toContain('layout.team2SelectedCardRect');
    expect(source).toContain('this.addControllerToggle(');
    expect(source).toContain("'Player'");
    expect(source).toContain("'AI'");
    expect(source).toContain("export const DEFAULT_QUICK_MATCH_CONTROLLER_TYPE: PlayerControllerType = 'HUMAN'");
    expect(source).not.toContain('PenaltyAiSettings');
    expect(source).not.toContain('AI settings');
  });

  it('keeps the Player AI toggle hit area separate from the selected team panel', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('private addControllerToggle');
    expect(source).toContain('private addVerticalControllerToggle');
    expect(source).toContain('event.stopPropagation()');
    expect(source).toContain('toggle.setSize(width, height)');
    expect(source).toContain('this.toggleControllerType(slot)');
    expect(source).toContain("this.setControllerType(slot, 'HUMAN')");
    expect(source).toContain("this.setControllerType(slot, 'AI')");
  });

  it('keeps the active player selected until the user switches panels manually', () => {
    const source = readTeamSelectSource();
    const selectTeamBlock = source.slice(source.indexOf('private selectTeam(teamName: string): void'));

    expect(source).toContain('private activeSlot: TeamSlot = 1');
    expect(source).toContain("panel.on('pointerdown', () => {");
    expect(source).toContain('this.activeSlot = slot;');
    expect(selectTeamBlock).toContain('if (this.activeSlot === 1) {');
    expect(selectTeamBlock).toContain('this.selectedTeamOne = teamName;');
    expect(selectTeamBlock).toContain('this.selectedTeamTwo = teamName;');
    expect(selectTeamBlock).not.toContain('this.activeSlot = 2');
    expect(selectTeamBlock).not.toContain('this.activeSlot = 1;');
  });

  it('uses mobile layout toggle geometry without changing the desktop toggle branch', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('layout.team1ControllerToggleRect');
    expect(source).toContain('layout.team2ControllerToggleRect');
    expect(source).toContain('layout.controllerToggle');
    expect(source).toContain("if (toggleLayout.orientation === 'vertical')");
    expect(source).toContain('const textWidth = layout.mobileWide');
    expect(source).toContain('const segmentWidth = width / 2');
    expect(source).toContain('const segmentHeight = height / 2');
    expect(source).toContain('const playerSegment = this.add.rectangle(');
    expect(source).toContain('-segmentHeight / 2');
    expect(source).toContain('const aiSegment = this.add.rectangle(');
    expect(source).toContain('segmentHeight / 2');
  });

  it('places player labels above panels aligned to panel right edges', () => {
    const source = readTeamSelectSource();

    expect(source).toContain("'Player 1'");
    expect(source).toContain("'Player 2'");
    expect(source).not.toContain("'Team 1'");
    expect(source).not.toContain("'Team 2'");
    expect(source).toContain('const SELECTED_PANEL_LABEL_OFFSET_Y = 16');
    expect(source).toContain('.text(rect.x + rect.width, rect.y - SELECTED_PANEL_LABEL_OFFSET_Y, title');
    expect(source).toContain("align: 'right'");
    expect(source).toContain('.setOrigin(1, 0.5)');
    expect(source).toContain('slotLabel.setDepth(1)');
  });

  it('keeps the 8-column country grid layout on one page', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('layout.teamGridColumns');
    expect(source).toContain('Math.ceil(NATIONAL_TEAMS.length / layout.teamGridColumns)');
    expect(source).not.toContain('page + 1');
    expect(source).not.toContain('1 / 2');
  });

  it('uses scoreboard-style team cards with padded flags in the country grid', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('SCOREBOARD_BACKGROUND_COLOR');
    expect(source).toContain('SCOREBOARD_BACKGROUND_ALPHA');
    expect(source).toContain('SCOREBOARD_BORDER_COLOR');
    expect(source).toContain('SCOREBOARD_TEXT_COLOR');
    expect(source).toContain('SCOREBOARD_METAL_BORDER_COLOR');
    expect(source).toContain('SCOREBOARD_METAL_BORDER_ALPHA');
    expect(source).toContain('const TEAM_SELECTION_METAL_BORDER_COLOR = SCOREBOARD_METAL_BORDER_COLOR');
    expect(source).toContain('const TEAM_SELECTION_METAL_BORDER_ALPHA = SCOREBOARD_METAL_BORDER_ALPHA');
    expect(source).toContain('const TEAM_BUTTON_VISUAL_HEIGHT_OFFSET = 6');
    expect(source).toContain('const teamButtonHeight = layout.teamButtonHeight + TEAM_BUTTON_VISUAL_HEIGHT_OFFSET');
    expect(source).toContain('layout.teamButtonWidth');
    expect(source).toContain('const TEAM_OPTION_BACKGROUND_ALPHA = SCOREBOARD_BACKGROUND_ALPHA');
    expect(source).toContain('const TEAM_OPTION_ACTIVE_BACKGROUND_ALPHA = 0.98');
    expect(source).toContain('const TEAM_OPTION_FLAG_WIDTH = 36');
    expect(source).toContain('const TEAM_OPTION_FLAG_HEIGHT = 27');
    expect(source).toContain('const TEAM_OPTION_FLAG_PADDING_X = 11');
    expect(source).toContain('SCOREBOARD_BACKGROUND_COLOR');
    expect(source).toContain('isSelected ? TEAM_OPTION_ACTIVE_BACKGROUND_ALPHA : TEAM_OPTION_BACKGROUND_ALPHA');
    expect(source).toContain('isSelected ? SCOREBOARD_BORDER_COLOR : TEAM_SELECTION_METAL_BORDER_COLOR');
    expect(source).toContain('isSelected ? 1 : TEAM_SELECTION_METAL_BORDER_ALPHA');
    expect(source).toContain('const flagX = -width / 2 + TEAM_OPTION_FLAG_PADDING_X + TEAM_OPTION_FLAG_WIDTH / 2');
    expect(source).toContain('flag.setDisplaySize(TEAM_OPTION_FLAG_WIDTH, TEAM_OPTION_FLAG_HEIGHT)');
    expect(source).toContain("fontSize: '16px'");
    expect(source).toContain('color: SCOREBOARD_TEXT_COLOR');
    expect(source).not.toContain('isSelected ? 0xf0c95a : 0x143f2c');
    expect(source).not.toContain("color: isSelected ? '#1f2a2e' : '#ffffff'");
    expect(source).not.toContain('const TRANSLUCENT_CARD_BACKGROUND = 0x000000');
  });

  it('fades country grid cards at overflowing viewport edges without dark overlays', () => {
    const source = readTeamSelectSource();
    const fadeSource = readScrollEdgeFadeSource();

    expect(source).toContain("import { updateScrollableItemEdgeAlphas } from '../ui/scrollEdgeFade'");
    expect(fadeSource).toContain('export const SCROLL_EDGE_FADE_HEIGHT = 52');
    expect(fadeSource).toContain('export const SCROLL_EDGE_FADE_MIN_ALPHA = 0.22');
    expect(fadeSource).toContain('export const SCROLL_EDGE_FADE_EPSILON = 0.5');
    expect(source).toContain('let refreshTeamGridItems = (): void => {}');
    expect(source).toContain('updateScrollableItemEdgeAlphas({');
    expect(source).toContain('viewportHeight: TEAM_GRID_VIEWPORT_HEIGHT');
    expect(source).toContain('scrollY: teamGridScrollY');
    expect(fadeSource).toContain('const viewportBottom = options.viewportTop + options.viewportHeight');
    expect(fadeSource).toContain('const shouldFadeTop = options.scrollY > SCROLL_EDGE_FADE_EPSILON');
    expect(fadeSource).toContain('const shouldFadeBottom = options.scrollY < options.maxScroll - SCROLL_EDGE_FADE_EPSILON');
    expect(fadeSource).toContain('const itemCenterY = options.content.y + item.y');
    expect(fadeSource).toContain('const distanceToTopEdge = itemCenterY - options.viewportTop');
    expect(fadeSource).toContain('const distanceToBottomEdge = viewportBottom - itemCenterY');
    expect(fadeSource).toContain('item.setAlpha(alpha)');
    expect(source).not.toContain('fade.fillRect');
    expect(source).not.toContain('TEAM_GRID_EDGE_FADE_MAX_ALPHA');
  });

  it('uses scoreboard-style selected panels without switching to the scoreboard font', () => {
    const source = readTeamSelectSource();
    const scoreboardStyleSource = readFileSync(join(process.cwd(), 'src', 'ui', 'scoreboardStyle.ts'), 'utf8');

    expect(scoreboardStyleSource).toContain("export const SCOREBOARD_TEXT_COLOR = '#d9eadf'");
    expect(source).toContain('this.add.rectangle(0, 0, rect.width, rect.height, SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA)');
    expect(source).toContain('background.setStrokeStyle(isActive ? 4 : 2, TEAM_SELECTION_METAL_BORDER_COLOR, TEAM_SELECTION_METAL_BORDER_ALPHA)');
    expect(source).toContain('color: SCOREBOARD_TEXT_COLOR');
    expect(source).toContain("fontFamily: 'Arial, sans-serif'");
    expect(source).not.toContain('SCOREBOARD_FONT_FAMILY');
  });

  it('styles Player AI toggles with the selected-card color scheme', () => {
    const source = readTeamSelectSource();

    expect(source).toContain('const TEAM_SELECTION_TOGGLE_ACTIVE_COLOR = SCOREBOARD_BORDER_COLOR');
    expect(source).toContain("const TEAM_SELECTION_TOGGLE_ACTIVE_TEXT_COLOR = '#1f2a2e'");
    expect(source).toContain('const background = this.add.rectangle(0, 0, width, height, SCOREBOARD_BACKGROUND_COLOR, SCOREBOARD_BACKGROUND_ALPHA)');
    expect(source).toContain('TEAM_SELECTION_TOGGLE_ACTIVE_COLOR');
    expect(source).toContain('background.setStrokeStyle(2, TEAM_SELECTION_METAL_BORDER_COLOR, TEAM_SELECTION_METAL_BORDER_ALPHA)');
    expect(source).toContain('border.setStrokeStyle(2, TEAM_SELECTION_METAL_BORDER_COLOR, TEAM_SELECTION_METAL_BORDER_ALPHA)');
    expect(source).toContain('background.setStrokeStyle(2, SCOREBOARD_BORDER_COLOR, 1)');
    expect(source).toContain('border.setStrokeStyle(2, SCOREBOARD_BORDER_COLOR, 1)');
    expect(source).toContain('color: SCOREBOARD_TEXT_COLOR');
    expect(source).toContain('color: isAi ? SCOREBOARD_TEXT_COLOR : TEAM_SELECTION_TOGGLE_ACTIVE_TEXT_COLOR');
    expect(source).toContain('color: isAi ? TEAM_SELECTION_TOGGLE_ACTIVE_TEXT_COLOR : SCOREBOARD_TEXT_COLOR');
    expect(source).not.toContain('isAi ? 0xf0c95a : 0x5f9572');
    expect(source).not.toContain('isAi ? 0x143f2c : 0xf0c95a');
  });

  it('uses selected team cover fans and kit previews in both match modes', () => {
    const source = readTeamSelectSource();

    expect(source).toContain("import { fitImageContain, resolveTeamCoverLoadResult } from '../assets/teamCover'");
    expect(source).toContain('createTeamScreenLayout()');
    expect(source).toContain('this.createCountryGrid(layout.teamGridRect, layout)');
    expect(source).toContain('resolveTeamCoverLoadResult(this.textures, team.flagCode).textureKey');
    expect(source).toContain('private createSelectedTeamCoverFan');
    expect(source).toContain('const SELECTED_COVER_FAN_CARD_COUNT = 3');
    expect(source).toContain("faceDownVariant: 'preview'");
    expect(source).toContain('private createTeamKitPreview');
    expect(source).toContain('getTeamKitAssetKey(team.flagCode)');
    expect(source).toContain('FALLBACK_TEAM_KIT_ASSET.assetKey');
    expect(source).toContain('fitImageContain(kit, {');
    expect(source).toContain('width: rect.width - 14');
    expect(source).toContain('height: rect.height - 10');
    expect(source).not.toContain('kit.setDisplaySize(rect.width - 14, rect.height - 10)');
  });

  it('uses the team selection menu background with a football field fallback', () => {
    const source = readTeamSelectSource();
    const backgroundSource = readFileSync(join(process.cwd(), 'src', 'ui', 'teamFieldBackground.ts'), 'utf8');

    expect(source).toContain("import { MENU_ASSETS, SCENE_HEIGHT, SCENE_WIDTH } from '../config'");
    expect(source).toContain("import { createTeamFieldBackground } from '../ui/teamFieldBackground'");
    expect(source).toContain('private createTeamSelectFieldBackground');
    expect(source).toContain('this.textures.exists(MENU_ASSETS.teamSelectBackground)');
    expect(source).toContain('this.add.image(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, MENU_ASSETS.teamSelectBackground)');
    expect(source).toContain('background.setDisplaySize(SCENE_WIDTH, SCENE_HEIGHT)');
    expect(source).toContain('createTeamFieldBackground(this)');
    expect(backgroundSource).toContain('const stripeCount = 14');
    expect(backgroundSource).toContain('graphics.lineBetween(SCENE_WIDTH / 2');
    expect(backgroundSource).toContain('graphics.strokeCircle(SCENE_WIDTH / 2');
    expect(backgroundSource).toContain('graphics.setDepth(-20)');
  });
});

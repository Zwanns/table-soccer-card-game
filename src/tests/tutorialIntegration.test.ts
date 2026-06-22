import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('Tutorial Match launch and GameScene integration', () => {
  it('adds Tutorial Match as a direct GameScene launch without changing Quick Match team selection', () => {
    const menuSource = readSource('src/scenes/MenuScene.ts');

    expect(menuSource).toContain("'Quick match'");
    expect(menuSource).toContain("() => this.scene.start('TeamSelectScene')");
    expect(menuSource).toContain("'Tutorial Match'");
    expect(menuSource).toContain('...TUTORIAL_MATCH_V2_TEAMS');
    expect(menuSource).toContain("matchMode: 'tutorial'");
  });

  it('creates tutorial controller and setup preset only for matchMode tutorial', () => {
    const gameSource = readSource('src/scenes/GameScene.ts');

    expect(gameSource).toContain("private matchMode: MatchMode = 'quick'");
    expect(gameSource).toContain("this.matchMode = data.matchMode ?? 'quick'");
    expect(gameSource).toContain("this.tutorialController = this.matchMode === 'tutorial' ? new TutorialController() : null");
    expect(gameSource).toContain("setupPreset: this.matchMode === 'tutorial' ? TUTORIAL_MATCH_V2_SETUP_PRESET : undefined");
    expect(gameSource).toContain('this.refreshTutorialOverlay(state)');
  });

  it('guards tutorial card, midfielder, and open-zone clicks before they reach the engine', () => {
    const gameSource = readSource('src/scenes/GameScene.ts');
    const teamSelectSource = readSource('src/scenes/TeamSelectScene.ts');

    expect(gameSource).toContain('if (!this.allowTutorialAction(drawAction))');
    expect(gameSource).toContain('if (!this.allowTutorialAction(targetAction))');
    expect(gameSource).toContain('if (!this.allowTutorialAction(midfielderAction))');
    expect(gameSource).toContain('if (!this.allowTutorialAction(gapAction))');
    expect(gameSource).toContain('this.tutorialController?.recordAction(action)');
    expect(gameSource).toContain('this.tutorialController?.recordEvents(state.log.slice(previousLogLength))');
    expect(gameSource).toContain('createTutorialCommitMidfielderAction');
    expect(gameSource).toContain('createTutorialMidfieldGapAction');
    expect(teamSelectSource).toContain("this.scene.start('GameScene', data)");
    expect(teamSelectSource).not.toContain("matchMode: 'tutorial'");
  });

  it('keeps overlay rendering isolated in TutorialOverlay', () => {
    const overlaySource = readSource('src/ui/TutorialOverlay.ts');

    expect(overlaySource).toContain('export class TutorialOverlay');
    expect(overlaySource).toContain('const PANEL_WIDTH = 840');
    expect(overlaySource).toContain('const PANEL_HEIGHT = 230');
    expect(overlaySource).toContain('0x06130e, 0.48');
    expect(overlaySource).toContain('0xf0c95a');
    expect(overlaySource).not.toContain('background.setStrokeStyle');
    expect(overlaySource).toContain('const TITLE_WORD_WRAP_WIDTH = PANEL_WIDTH - 260');
    expect(overlaySource).toContain('const MESSAGE_WORD_WRAP_WIDTH = PANEL_WIDTH - PANEL_PADDING_X * 2');
    expect(overlaySource).toContain('fixedWidth: TITLE_WORD_WRAP_WIDTH');
    expect(overlaySource).toContain('fixedWidth: MESSAGE_WORD_WRAP_WIDTH');
    expect(overlaySource).toContain("getTutorialText(options.language, 'tutorial.button.continue')");
    expect(overlaySource).toContain('createLanguageSelector');
    expect(overlaySource).toContain('LANGUAGE_SELECTOR_RIGHT');
    expect(overlaySource).toContain('GAME_LANGUAGES');
    expect(overlaySource).toContain('highlightRects');
  });

  it('adds highlight targets for own midfielders, opponent midfielders, and open zones', () => {
    const gameSource = readSource('src/scenes/GameScene.ts');
    const fieldViewSource = readSource('src/ui/FieldView.ts');
    const tutorialTypesSource = readSource('src/tutorial/tutorialTypes.ts');

    expect(tutorialTypesSource).toContain("{ type: 'own-midfielder'; slot: TutorialMidfielderSlot");
    expect(tutorialTypesSource).toContain("{ type: 'opponent-midfielder'; slot: TutorialMidfielderSlot");
    expect(tutorialTypesSource).toContain("{ type: 'open-zone'; owner: 'active' | 'opponent'; slot: TutorialMidfielderSlot");
    expect(gameSource).toContain("target.type === 'own-midfielder' || target.type === 'opponent-midfielder'");
    expect(gameSource).toContain("if (target.type === 'open-zone')");
    expect(fieldViewSource).toContain('onOwnMidfielderSelect?: MidfielderCommitHandler');
    expect(fieldViewSource).toContain('tutorialSelectableOwnMidfielder');
  });

  it('shares language state between Rules and Tutorial without resetting the current step', () => {
    const gameSource = readSource('src/scenes/GameScene.ts');
    const menuSource = readSource('src/scenes/MenuScene.ts');
    const overlaySource = readSource('src/ui/TutorialOverlay.ts');

    expect(menuSource).toContain('getPreferredLanguage()');
    expect(menuSource).toContain('setPreferredLanguage(language)');
    expect(gameSource).toContain('private infoLanguage: AboutLanguage = getPreferredLanguage()');
    expect(gameSource).toContain('setPreferredLanguage(language)');
    expect(gameSource).toContain('onLanguageChange: (language) => this.switchTutorialLanguage(language)');
    expect(gameSource).toContain('this.refreshTutorialOverlay(this.engine.getState())');
    expect(gameSource).not.toContain('new TutorialController() : null;\n    this.infoLanguage');
    expect(overlaySource).toContain('options.onLanguageChange(language)');
  });
});

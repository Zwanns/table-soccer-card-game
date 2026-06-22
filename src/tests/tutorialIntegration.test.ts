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
    expect(overlaySource).toContain('0x06130e, 0.48');
    expect(overlaySource).toContain('0xf0c95a');
    expect(overlaySource).toContain("'Continue'");
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
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GameEngine } from '../game';
import {
  TUTORIAL_MATCH_V2_SETUP_PRESET,
  TUTORIAL_MATCH_V2_TEAMS
} from '../tutorial/tutorialScenario';

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('Tutorial Match launch and GameScene integration', () => {
  it('starts Tutorial Match with every Germany midfield slot filled', () => {
    const engine = new GameEngine();
    const state = engine.startNewGame({
      ...TUTORIAL_MATCH_V2_TEAMS,
      setupPreset: TUTORIAL_MATCH_V2_SETUP_PRESET
    });
    const germany = state.players[1];

    expect([
      germany.field['midfielder-1']?.rank,
      germany.field['midfielder-2']?.rank,
      germany.field['midfielder-3']?.rank
    ]).toEqual(['7', 'A', '5']);
  });

  it('keeps the regular Quick Match initial midfield setup unaffected', () => {
    const engine = new GameEngine();
    const state = engine.startNewGame({ seed: 'quick-match-initial-midfield' });

    for (const player of state.players) {
      expect([
        player.field['midfielder-1'],
        player.field['midfielder-2'],
        player.field['midfielder-3']
      ]).not.toContain(null);
    }
  });

  it('adds Tutorial Match as a direct GameScene launch without changing Quick Match team selection', () => {
    const menuSource = readSource('src/scenes/MenuScene.ts');
    const quickMatchRoute = menuSource.slice(
      menuSource.indexOf("'Quick match'"),
      menuSource.indexOf('buttonIndex += 1;', menuSource.indexOf("'Quick match'"))
    );

    expect(menuSource).toContain("'Quick match'");
    expect(quickMatchRoute).toContain("this.scene.start('TeamSelectScene', { mode: 'match' })");
    expect(quickMatchRoute).not.toContain("mode: 'penalty'");
    expect(quickMatchRoute).not.toContain('TournamentPenaltyScene');
    expect(menuSource).toContain("'Tutorial Match'");
    expect(menuSource).toContain('...TUTORIAL_MATCH_V2_TEAMS');
    expect(menuSource).toContain("matchMode: 'tutorial'");
  });

  it('places Tutorial Match after Penalty shootout without changing either launch action', () => {
    const menuSource = readSource('src/scenes/MenuScene.ts');
    const gameModesSource = menuSource.slice(
      menuSource.indexOf('private createGameModeButtons(): void'),
      menuSource.indexOf('private getMenuButtonWidth(): number')
    );

    expect(gameModesSource.indexOf("'Penalty shootout'")).toBeLessThan(
      gameModesSource.indexOf("'Tutorial Match'")
    );
    expect(gameModesSource).toContain("this.scene.start('TeamSelectScene', { mode: 'match' })");
    expect(gameModesSource).toContain("this.scene.start('TeamSelectScene', { mode: 'penalty' })");
    expect(gameModesSource).toContain("this.scene.start('GameScene', {");
    expect(gameModesSource).toContain('...TUTORIAL_MATCH_V2_TEAMS');
    expect(gameModesSource).toContain("matchMode: 'tutorial'");
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

  it('starts the shared goal effect before advancing the tutorial goal step', () => {
    const gameSource = readSource('src/scenes/GameScene.ts');
    const selectTargetBlock = gameSource.slice(
      gameSource.indexOf('private selectTarget('),
      gameSource.indexOf('private handleSelectedTargetState(')
    );
    const impactBlock = gameSource.slice(
      gameSource.indexOf('private finishGoalkeeperShotBallImpact('),
      gameSource.indexOf('private animateGoalkeeperShotGoalDisappear(')
    );

    expect(selectTargetBlock).toContain("animationOutcome === 'goal'");
    expect(selectTargetBlock).toContain('!this.tutorialController.isComplete()');
    expect(selectTargetBlock).toContain('if (!deferTutorialGoalEvent)');
    expect(selectTargetBlock).toContain('this.recordTutorialEvents(state, previousLogLength);');
    expect(selectTargetBlock).toContain('this.refreshTutorialOverlay(state);');
    expect(impactBlock.indexOf('this.playSceneEffectSound(shotEffect);')).toBeLessThan(
      impactBlock.indexOf('this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);')
    );
    expect(impactBlock.indexOf('this.showFlyingMessage(shotEffect.flyingMessage, shotEffect.flyingMessageTone);')).toBeLessThan(
      impactBlock.indexOf('onEffectStarted?.();')
    );
  });

  it('uses one shared goal sound path and marks the event handled before fallback processing', () => {
    const gameSource = readSource('src/scenes/GameScene.ts');
    const impactBlock = gameSource.slice(
      gameSource.indexOf('private finishGoalkeeperShotBallImpact('),
      gameSource.indexOf('private animateGoalkeeperShotGoalDisappear(')
    );

    expect(impactBlock).toContain('const shotEffect = getGoalkeeperShotSceneEffect(outcome);');
    expect(impactBlock).toContain('this.playSceneEffectSound(shotEffect);');
    expect(impactBlock).toContain('const shotEventIndex = getGoalkeeperShotEventIndex(this.requireEngine().getState().log, outcome);');
    expect(impactBlock).toContain('claimGoalkeeperShotImpactEvent(');
    expect(impactBlock).toContain('this.handledGoalkeeperShotEventIndexes');
    expect(gameSource).not.toContain("this.matchMode === 'tutorial' ? 'sound-goal'");
    expect(gameSource).not.toContain("playSound('sound-goal'");
  });

  it('blocks Rules and Pause logically while a tutorial step is active', () => {
    const gameSource = readSource('src/scenes/GameScene.ts');
    const pauseHandler = gameSource.slice(
      gameSource.indexOf('private openPauseModal('),
      gameSource.indexOf('private closePauseModal(')
    );
    const infoHandler = gameSource.slice(
      gameSource.indexOf('private openMatchInfoModal('),
      gameSource.indexOf('private closeMatchInfoModal(')
    );

    expect(gameSource).toContain('private isTutorialBlockingSystemUi(): boolean');
    expect(gameSource).toContain("this.matchMode === 'tutorial'");
    expect(gameSource).toContain('this.tutorialController !== null');
    expect(gameSource).toContain('!this.tutorialController.isComplete()');
    expect(pauseHandler).toContain('this.isTutorialBlockingSystemUi()');
    expect(infoHandler).toContain("kind === 'rules' && this.isTutorialBlockingSystemUi()");
  });

  it('keeps Quick Match and completed-tutorial system UI paths available', () => {
    const gameSource = readSource('src/scenes/GameScene.ts');
    const guard = gameSource.slice(
      gameSource.indexOf('private isTutorialBlockingSystemUi(): boolean'),
      gameSource.indexOf('private getPlayableCardDepletionFinish(')
    );

    expect(guard).toContain("this.matchMode === 'tutorial'");
    expect(guard).toContain('!this.tutorialController.isComplete()');
    expect(guard).not.toContain("this.matchMode === 'quick'");
    expect(gameSource).toContain('onPause: () => this.openPauseModal(state)');
    expect(gameSource).toContain("onRules: () => this.openMatchInfoModal('rules')");
  });

  it('keeps overlay rendering isolated in TutorialOverlay', () => {
    const overlaySource = readSource('src/ui/TutorialOverlay.ts');
    const layoutSource = readSource('src/ui/tutorialOverlayLayout.ts');

    expect(overlaySource).toContain('export class TutorialOverlay');
    expect(overlaySource).toContain('getTutorialOverlayLayout(SCENE_WIDTH, SCENE_HEIGHT, undefined, {');
    expect(overlaySource).toContain("hasContinueButton: options.step.waitFor === 'next'");
    expect(layoutSource).toContain("import { FIELD_VIEW_WIDTH } from './fieldDimensions'");
    expect(layoutSource).toContain('const panelWidth = FIELD_VIEW_WIDTH');
    expect(layoutSource).toContain('getDesktopPanelHeight(content, messageTop, messageLines, height)');
    expect(overlaySource).toContain('layout.mobile ? 0.26 : 0.48');
    expect(overlaySource).toContain('0xf0c95a');
    expect(overlaySource).not.toContain('panelBackground.setStrokeStyle');
    expect(overlaySource).toContain('fixedWidth: layout.titleWordWrapWidth');
    expect(overlaySource).toContain('fixedWidth: layout.messageWordWrapWidth');
    expect(overlaySource).toContain("getTutorialText(options.language, 'tutorial.button.continue')");
    expect(overlaySource).toContain('createLanguageSelector');
    expect(overlaySource).toContain('layout.languageHitWidth');
    expect(overlaySource).toContain('GAME_LANGUAGES');
    expect(overlaySource).toContain('highlightRects');
    expect(overlaySource).toContain('panelBackground.setInteractive()');
    expect(overlaySource).not.toContain('dim.setInteractive()');
    expect(overlaySource).toContain('scene.add.container(layout.panelX, layout.panelY)');
    expect(layoutSource).not.toContain('resolveTutorialPanelY');
    expect(layoutSource).not.toContain('getPanelOverlapArea');
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

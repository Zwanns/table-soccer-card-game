import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { getMatchExitConfirmationContent } from '../i18n/matchExitConfirmation';
import {
  handleGameSceneAndroidBackButton,
  type GameSceneAndroidBackHandler
} from '../scenes/gameSceneAndroidBack';

interface BackHandlerHarness {
  handler: GameSceneAndroidBackHandler;
  isExitConfirmOpen: () => boolean;
  openExitConfirm: ReturnType<typeof vi.fn>;
  closeExitConfirm: ReturnType<typeof vi.fn>;
  openPause: ReturnType<typeof vi.fn>;
  closePause: ReturnType<typeof vi.fn>;
}

function createBackHandlerHarness(options: {
  tutorialActive?: boolean;
  exitConfirmOpen?: boolean;
  pauseOpen?: boolean;
  canHandleBack?: boolean;
  canOpenExitConfirm?: boolean;
  canOpenPause?: boolean;
} = {}): BackHandlerHarness {
  let exitConfirmOpen = options.exitConfirmOpen ?? false;
  let pauseOpen = options.pauseOpen ?? false;
  const openExitConfirm = vi.fn(() => {
    exitConfirmOpen = true;
  });
  const closeExitConfirm = vi.fn(() => {
    exitConfirmOpen = false;
  });
  const openPause = vi.fn(() => {
    pauseOpen = true;
  });
  const closePause = vi.fn(() => {
    pauseOpen = false;
  });

  return {
    handler: {
      canHandleBack: () => options.canHandleBack ?? true,
      isTutorialActive: () => options.tutorialActive ?? false,
      isExitConfirmOpen: () => exitConfirmOpen,
      canOpenExitConfirm: () => options.canOpenExitConfirm ?? true,
      openExitConfirm,
      closeExitConfirm,
      isPauseOpen: () => pauseOpen,
      canOpenPause: () => options.canOpenPause ?? true,
      openPause,
      closePause
    },
    isExitConfirmOpen: () => exitConfirmOpen,
    openExitConfirm,
    closeExitConfirm,
    openPause,
    closePause
  };
}

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('GameScene Android Back priority', () => {
  it('opens Exit confirmation instead of Pause without advancing the active tutorial step', () => {
    const harness = createBackHandlerHarness({ tutorialActive: true });
    const currentTutorialStep = 7;
    const continueTutorial = vi.fn();
    const recordTutorialAction = vi.fn();

    handleGameSceneAndroidBackButton(harness.handler);

    expect(harness.isExitConfirmOpen()).toBe(true);
    expect(harness.openExitConfirm).toHaveBeenCalledOnce();
    expect(harness.openPause).not.toHaveBeenCalled();
    expect(currentTutorialStep).toBe(7);
    expect(continueTutorial).not.toHaveBeenCalled();
    expect(recordTutorialAction).not.toHaveBeenCalled();
  });

  it('closes an open Tutorial Exit confirmation without leaving or advancing the tutorial', () => {
    const harness = createBackHandlerHarness({ tutorialActive: true, exitConfirmOpen: true });
    const currentTutorialStep = 7;

    handleGameSceneAndroidBackButton(harness.handler);

    expect(harness.isExitConfirmOpen()).toBe(false);
    expect(harness.closeExitConfirm).toHaveBeenCalledOnce();
    expect(harness.openExitConfirm).not.toHaveBeenCalled();
    expect(harness.openPause).not.toHaveBeenCalled();
    expect(currentTutorialStep).toBe(7);
  });

  it('toggles one Tutorial Exit confirmation across repeated Back presses without duplicates', () => {
    const harness = createBackHandlerHarness({ tutorialActive: true });

    handleGameSceneAndroidBackButton(harness.handler);
    handleGameSceneAndroidBackButton(harness.handler);
    handleGameSceneAndroidBackButton(harness.handler);
    handleGameSceneAndroidBackButton(harness.handler);

    expect(harness.isExitConfirmOpen()).toBe(false);
    expect(harness.openExitConfirm).toHaveBeenCalledTimes(2);
    expect(harness.closeExitConfirm).toHaveBeenCalledTimes(2);
    expect(harness.openPause).not.toHaveBeenCalled();
  });

  it('does not open confirmation during shutdown, navigation, or another blocking modal state', () => {
    const stoppedHarness = createBackHandlerHarness({ tutorialActive: true, canHandleBack: false });
    const blockedHarness = createBackHandlerHarness({ tutorialActive: true, canOpenExitConfirm: false });

    handleGameSceneAndroidBackButton(stoppedHarness.handler);
    handleGameSceneAndroidBackButton(blockedHarness.handler);

    expect(stoppedHarness.openExitConfirm).not.toHaveBeenCalled();
    expect(blockedHarness.openExitConfirm).not.toHaveBeenCalled();
  });

  it('keeps Quick Match Back toggling the existing Pause flow', () => {
    const harness = createBackHandlerHarness({ tutorialActive: false });

    handleGameSceneAndroidBackButton(harness.handler);
    handleGameSceneAndroidBackButton(harness.handler);

    expect(harness.openPause).toHaveBeenCalledOnce();
    expect(harness.closePause).toHaveBeenCalledOnce();
    expect(harness.openExitConfirm).not.toHaveBeenCalled();
  });

  it('keeps Tournament Match Back opening the existing Pause flow', () => {
    const harness = createBackHandlerHarness({ tutorialActive: false });

    handleGameSceneAndroidBackButton(harness.handler);

    expect(harness.openPause).toHaveBeenCalledOnce();
    expect(harness.openExitConfirm).not.toHaveBeenCalled();
  });
});

describe('Tutorial Exit confirmation integration', () => {
  it('uses localized Tutorial content for all supported languages', () => {
    expect(getMatchExitConfirmationContent('en', 'tutorial')).toEqual({
      title: 'Exit Tutorial?',
      body: 'Your tutorial progress will be lost.',
      confirmLabel: 'Exit',
      cancelLabel: 'Cancel'
    });
    expect(getMatchExitConfirmationContent('pl', 'tutorial')).toEqual({
      title: 'Wyjść z samouczka?',
      body: 'Postęp samouczka zostanie utracony.',
      confirmLabel: 'Wyjdź',
      cancelLabel: 'Anuluj'
    });
    expect(getMatchExitConfirmationContent('uk', 'tutorial')).toEqual({
      title: 'Вийти з навчання?',
      body: 'Прогрес навчання буде втрачено.',
      confirmLabel: 'Вийти',
      cancelLabel: 'Скасувати'
    });
  });

  it('reuses the existing modal callbacks for Cancel and the safe exit-to-menu flow for Confirm', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const modalBlock = source.slice(
      source.indexOf('private openExitConfirmModal()'),
      source.indexOf('private closeExitConfirmModal(')
    );
    const exitBlock = source.slice(
      source.indexOf('private exitToMainMenu(): void'),
      source.indexOf('private handlePlayableMatchFinished(')
    );

    expect(modalBlock).toContain('content.confirmLabel, () => this.exitToMainMenu()');
    expect(modalBlock).toContain('const refreshGameplayOnDismiss = !isTutorialActive;');
    expect(modalBlock).toContain('this.closeExitConfirmModal({ refreshGameplay: refreshGameplayOnDismiss })');
    expect(exitBlock).toContain('this.prepareToLeaveMatchScene();');
    expect(exitBlock).toContain("this.scene.start('MenuScene');");
  });

  it('keeps TutorialOverlay alive on dismiss and only destroys it while leaving or shutting down', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const closeBlock = source.slice(
      source.indexOf('private closeExitConfirmModal('),
      source.indexOf('private canOpenExitConfirmModal(')
    );
    const leaveBlock = source.slice(
      source.indexOf('private prepareToLeaveMatchScene()'),
      source.indexOf('private exitToMainMenu()')
    );
    const shutdownBlock = source.slice(
      source.indexOf('private handleSceneShutdown()'),
      source.indexOf('private getPendingRestoreAnimationEntries(')
    );

    expect(closeBlock).not.toContain('tutorialOverlay');
    expect(closeBlock).not.toContain('tutorialController');
    expect(closeBlock).not.toContain('.continue()');
    expect(closeBlock).not.toContain('recordAction');
    expect(leaveBlock).toContain('this.tutorialOverlay?.destroy();');
    expect(shutdownBlock).toContain('this.tutorialOverlay?.destroy();');
    expect(shutdownBlock).toContain('this.tutorialController = null;');
    expect(shutdownBlock).toContain('this.removeAndroidBackButtonListener();');
  });

  it('blocks gameplay and TutorialOverlay controls under the confirmation', () => {
    const source = readSource('src/scenes/GameScene.ts');
    const gameplayGuard = source.slice(
      source.indexOf('private canAcceptGameplayInput()'),
      source.indexOf('private canRunSceneSetup()')
    );
    const modalBlock = source.slice(
      source.indexOf('private openExitConfirmModal()'),
      source.indexOf('private closeExitConfirmModal(')
    );
    const androidBackBlock = source.slice(
      source.indexOf('private handleAndroidBackButton()'),
      source.indexOf('private openMatchInfoModal(')
    );

    expect(gameplayGuard).toContain('this.exitConfirmModal === null');
    expect(modalBlock).toContain('overlay.setInteractive();');
    expect(modalBlock).toContain('.setDepth(EXIT_CONFIRM_MODAL_DEPTH)');
    expect(androidBackBlock).toContain('closeExitConfirm: () => this.closeExitConfirmModal()');
    expect(source).toContain('const EXIT_CONFIRM_MODAL_DEPTH = 6000;');
  });

  it('keeps Main Menu and the Android foundation free of app exit/minimize calls', () => {
    const gameSource = readSource('src/scenes/GameScene.ts');
    const androidBackSource = readSource('src/platform/androidBackButton.ts');
    const menuSource = readSource('src/scenes/MenuScene.ts');

    expect(gameSource).not.toContain('App.exitApp');
    expect(gameSource).not.toContain('App.minimizeApp');
    expect(androidBackSource).not.toContain('App.exitApp');
    expect(androidBackSource).not.toContain('App.minimizeApp');
    expect(menuSource).not.toContain('registerAndroidBackButtonListener');
  });
});

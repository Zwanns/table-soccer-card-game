import {
  handleAndroidMatchBackButton,
  type AndroidMatchBackHandler
} from '../platform/androidBackButton';

export interface GameSceneAndroidBackHandler extends AndroidMatchBackHandler {
  isTutorialActive(): boolean;
  isExitConfirmOpen(): boolean;
  canOpenExitConfirm(): boolean;
  openExitConfirm(): void;
  closeExitConfirm(): void;
}

export function handleGameSceneAndroidBackButton(handler: GameSceneAndroidBackHandler): void {
  if (!handler.isTutorialActive()) {
    handleAndroidMatchBackButton(handler);
    return;
  }

  if (!handler.canHandleBack()) {
    return;
  }

  if (handler.isExitConfirmOpen()) {
    handler.closeExitConfirm();
    return;
  }

  if (handler.canOpenExitConfirm()) {
    handler.openExitConfirm();
  }
}

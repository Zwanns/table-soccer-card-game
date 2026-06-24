import Phaser from 'phaser';
import { Button } from './Button';

export const RESULT_ACTION_PANEL_WIDTH = 840;
export const RESULT_ACTION_BUTTON_GAP = 24;
export const RESULT_ACTION_BUTTON_WIDTH = (RESULT_ACTION_PANEL_WIDTH - RESULT_ACTION_BUTTON_GAP * 2) / 3;
export const RESULT_ACTION_BUTTON_HEIGHT = 68;
export const RESULT_ACTION_BUTTON_FONT_SIZE = '26px';
export const RESULT_ACTION_BUTTON_Y = 650;

export interface ResultActionButtonConfig {
  label: string;
  onClick: () => void;
}

export interface ResultActionButtonsOptions {
  totalWidth?: number;
}

export function createResultActionButtons(
  scene: Phaser.Scene,
  centerX: number,
  actions: readonly [ResultActionButtonConfig, ResultActionButtonConfig, ResultActionButtonConfig],
  options: ResultActionButtonsOptions = {}
): [Button, Button, Button] {
  const totalWidth = options.totalWidth ?? RESULT_ACTION_PANEL_WIDTH;
  const buttonWidth = (totalWidth - RESULT_ACTION_BUTTON_GAP * 2) / 3;
  const firstButtonX = centerX - totalWidth / 2 + buttonWidth / 2;
  const buttonOptions = {
    fontSize: RESULT_ACTION_BUTTON_FONT_SIZE,
    height: RESULT_ACTION_BUTTON_HEIGHT,
    width: buttonWidth
  } as const;

  return actions.map((action, index) =>
    new Button(
      scene,
      firstButtonX + index * (buttonWidth + RESULT_ACTION_BUTTON_GAP),
      RESULT_ACTION_BUTTON_Y,
      action.label,
      action.onClick,
      buttonOptions
    )
  ) as [Button, Button, Button];
}

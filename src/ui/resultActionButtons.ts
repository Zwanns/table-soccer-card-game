import Phaser from 'phaser';
import { Button } from './Button';

export const RESULT_ACTION_PANEL_WIDTH = 840;
export const RESULT_ACTION_BUTTON_GAP = 24;
export const RESULT_ACTION_BUTTON_WIDTH = (RESULT_ACTION_PANEL_WIDTH - RESULT_ACTION_BUTTON_GAP * 2) / 3;
export const RESULT_ACTION_BUTTON_HEIGHT = 62;
export const RESULT_ACTION_BUTTON_Y = 650;

export interface ResultActionButtonConfig {
  label: string;
  onClick: () => void;
}

export function createResultActionButtons(
  scene: Phaser.Scene,
  centerX: number,
  actions: readonly [ResultActionButtonConfig, ResultActionButtonConfig, ResultActionButtonConfig]
): [Button, Button, Button] {
  const firstButtonX = centerX - RESULT_ACTION_PANEL_WIDTH / 2 + RESULT_ACTION_BUTTON_WIDTH / 2;
  const buttonOptions = {
    fontSize: '24px',
    height: RESULT_ACTION_BUTTON_HEIGHT,
    width: RESULT_ACTION_BUTTON_WIDTH
  } as const;

  return actions.map((action, index) =>
    new Button(
      scene,
      firstButtonX + index * (RESULT_ACTION_BUTTON_WIDTH + RESULT_ACTION_BUTTON_GAP),
      RESULT_ACTION_BUTTON_Y,
      action.label,
      action.onClick,
      buttonOptions
    )
  ) as [Button, Button, Button];
}

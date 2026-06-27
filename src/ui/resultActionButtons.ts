import Phaser from 'phaser';
import { Button, type ButtonCornerRadius } from './Button';

export const RESULT_ACTION_PANEL_WIDTH = 840;
export const RESULT_ACTION_BUTTON_GAP = 0;
export const RESULT_ACTION_BUTTON_WIDTH = RESULT_ACTION_PANEL_WIDTH / 2;
export const RESULT_ACTION_BUTTON_HEIGHT = 68;
export const RESULT_ACTION_BUTTON_FONT_SIZE = '24px';
export const RESULT_ACTION_BUTTON_Y = 644;
export const RESULT_ACTION_BUTTON_RADIUS = 8;

export interface ResultActionButtonConfig {
  label: string;
  onClick: () => void;
}

export interface ResultActionButtonsOptions {
  attachedToPanel?: boolean;
  totalWidth?: number;
}

export function createResultActionButtons(
  scene: Phaser.Scene,
  centerX: number,
  actions: readonly ResultActionButtonConfig[],
  options: ResultActionButtonsOptions = {}
): Button[] {
  const totalWidth = options.totalWidth ?? RESULT_ACTION_PANEL_WIDTH;
  const buttonWidth = (totalWidth - RESULT_ACTION_BUTTON_GAP * Math.max(0, actions.length - 1)) / actions.length;
  const firstButtonX = centerX - totalWidth / 2 + buttonWidth / 2;

  return actions.map((action, index) =>
    new Button(
      scene,
      firstButtonX + index * (buttonWidth + RESULT_ACTION_BUTTON_GAP),
      RESULT_ACTION_BUTTON_Y,
      action.label,
      action.onClick,
      {
        borderRadius: getResultActionButtonRadius(index, actions.length, options.attachedToPanel === true),
        fontSize: RESULT_ACTION_BUTTON_FONT_SIZE,
        height: RESULT_ACTION_BUTTON_HEIGHT,
        width: buttonWidth
      }
    )
  );
}

function getResultActionButtonRadius(index: number, actionCount: number, attachedToPanel: boolean): number | ButtonCornerRadius {
  if (!attachedToPanel) {
    return RESULT_ACTION_BUTTON_RADIUS;
  }

  const isFirst = index === 0;
  const isLast = index === actionCount - 1;

  return {
    topLeft: 0,
    topRight: 0,
    bottomRight: isLast ? RESULT_ACTION_BUTTON_RADIUS : 0,
    bottomLeft: isFirst ? RESULT_ACTION_BUTTON_RADIUS : 0
  };
}

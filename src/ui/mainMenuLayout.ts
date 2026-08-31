export type MainMenuAction = 'gameModes' | 'teams' | 'rules' | 'about';

export interface MainMenuLayoutConfig {
  buttonFontSize: string;
  buttonHeight: number;
  buttonsGap: number;
  buttonsStartY: number;
  buttonWidth: number;
  centerX: number;
}

export interface MainMenuButtonLayout {
  action: MainMenuAction;
  fontSize: string;
  height: number;
  label: string;
  width: number;
  x: number;
  y: number;
}

export const MOBILE_MAIN_MENU_BUTTON_HEIGHT = 84;
export const MOBILE_MAIN_MENU_BUTTON_FONT_SIZE = '32px';

const MAIN_MENU_ACTIONS: ReadonlyArray<Pick<MainMenuButtonLayout, 'action' | 'label'>> = [
  { action: 'gameModes', label: 'Game modes' },
  { action: 'teams', label: 'Teams' },
  { action: 'rules', label: 'Rules' },
  { action: 'about', label: 'About' }
];

export function getMainMenuButtonLayout(config: MainMenuLayoutConfig, mobile: boolean): MainMenuButtonLayout[] {
  if (!mobile) {
    return MAIN_MENU_ACTIONS.map(({ action, label }, index) => ({
      action,
      fontSize: config.buttonFontSize,
      height: config.buttonHeight,
      label,
      width: config.buttonWidth,
      x: config.centerX,
      y: config.buttonsStartY + config.buttonsGap * index
    }));
  }

  const actions = MAIN_MENU_ACTIONS.filter(({ action }) => action !== 'teams');
  const desktopGroupCenterY = config.buttonsStartY + config.buttonsGap * (MAIN_MENU_ACTIONS.length - 1) / 2;
  const visualGap = config.buttonsGap - config.buttonHeight;
  const step = MOBILE_MAIN_MENU_BUTTON_HEIGHT + visualGap;
  const startY = desktopGroupCenterY - step * (actions.length - 1) / 2;

  return actions.map(({ action, label }, index) => ({
    action,
    fontSize: MOBILE_MAIN_MENU_BUTTON_FONT_SIZE,
    height: MOBILE_MAIN_MENU_BUTTON_HEIGHT,
    label,
    width: config.buttonWidth,
    x: config.centerX,
    y: startY + step * index
  }));
}

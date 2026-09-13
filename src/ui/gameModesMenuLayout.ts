import { MOBILE_MAIN_MENU_BUTTON_FONT_SIZE, MOBILE_MAIN_MENU_BUTTON_HEIGHT } from './mainMenuLayout';
import {
  MOBILE_NAV_BUTTON_CENTER_X, MOBILE_NAV_BUTTON_CENTER_Y,
  MOBILE_NAV_BUTTON_FONT_SIZE, MOBILE_NAV_BUTTON_HEIGHT, MOBILE_NAV_BUTTON_WIDTH
} from './mobileNavigationLayout';

export type GameModesMenuAction = 'quickMatch' | 'tournament' | 'penaltyShootout' | 'tutorialMatch' | 'devLab' | 'back';

export interface GameModesMenuLayoutConfig {
  buttonFontSize: string;
  buttonHeight: number;
  buttonsGap: number;
  buttonsStartY: number;
  buttonWidth: number;
  centerX: number;
  titleFontSize: string;
  titleY: number;
}

export interface GameModesMenuButtonLayout {
  action: GameModesMenuAction;
  fontSize: string;
  height: number;
  label: string;
  labelOffsetY: number;
  width: number;
  x: number;
  y: number;
}

export interface GameModesMenuLayout {
  backButton: GameModesMenuButtonLayout;
  devLabButton: GameModesMenuButtonLayout | null;
  mainButtons: GameModesMenuButtonLayout[];
  title: {
    fontSize: string;
    label: 'Game modes';
    x: number;
    y: number;
  };
}

export const MOBILE_GAME_MODES_STACK_CENTER_Y = 429;
// Keep the approved Team selection navigation center and arrow's optical offset.
export const MOBILE_GAME_MODES_BACK = {
  fontSize: MOBILE_NAV_BUTTON_FONT_SIZE,
  height: MOBILE_NAV_BUTTON_HEIGHT,
  label: '← Back',
  labelOffsetY: -2,
  width: MOBILE_NAV_BUTTON_WIDTH,
  x: MOBILE_NAV_BUTTON_CENTER_X,
  y: MOBILE_NAV_BUTTON_CENTER_Y
} as const;

const MAIN_MODE_ACTIONS: ReadonlyArray<Pick<GameModesMenuButtonLayout, 'action' | 'label'>> = [
  { action: 'quickMatch', label: 'Quick match' },
  { action: 'tournament', label: 'Tournament' },
  { action: 'penaltyShootout', label: 'Penalty shootout' },
  { action: 'tutorialMatch', label: 'Tutorial Match' }
];

export function getGameModesMenuLayout(
  config: GameModesMenuLayoutConfig,
  mobile: boolean,
  includeDevLab = false
): GameModesMenuLayout {
  const title = {
    fontSize: config.titleFontSize,
    label: 'Game modes' as const,
    x: config.centerX,
    y: config.titleY
  };

  if (!mobile) {
    const mainButtons = MAIN_MODE_ACTIONS.map((action, index) =>
      createDesktopButton(config, action, index)
    );
    const devLabButton = includeDevLab
      ? createDesktopButton(config, { action: 'devLab', label: 'Dev Lab' }, mainButtons.length)
      : null;
    const backIndex = mainButtons.length + (devLabButton === null ? 0 : 1);

    return {
      backButton: createDesktopButton(config, { action: 'back', label: 'Back' }, backIndex),
      devLabButton,
      mainButtons,
      title
    };
  }

  const visualGap = config.buttonsGap - config.buttonHeight;
  const step = MOBILE_MAIN_MENU_BUTTON_HEIGHT + visualGap;
  const startY = MOBILE_GAME_MODES_STACK_CENTER_Y - step * (MAIN_MODE_ACTIONS.length - 1) / 2;
  const mainButtons = MAIN_MODE_ACTIONS.map(({ action, label }, index) => ({
    action,
    fontSize: MOBILE_MAIN_MENU_BUTTON_FONT_SIZE,
    height: MOBILE_MAIN_MENU_BUTTON_HEIGHT,
    label,
    labelOffsetY: 0,
    width: config.buttonWidth,
    x: config.centerX,
    y: startY + step * index
  }));

  return {
    backButton: {
      action: 'back',
      ...MOBILE_GAME_MODES_BACK
    },
    devLabButton: null,
    mainButtons,
    title
  };
}

function createDesktopButton(
  config: GameModesMenuLayoutConfig,
  { action, label }: Pick<GameModesMenuButtonLayout, 'action' | 'label'>,
  index: number
): GameModesMenuButtonLayout {
  return {
    action,
    fontSize: config.buttonFontSize,
    height: config.buttonHeight,
    label,
    labelOffsetY: 0,
    width: config.buttonWidth,
    x: config.centerX,
    y: config.buttonsStartY + config.buttonsGap * index
  };
}

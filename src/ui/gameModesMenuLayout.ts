import { MOBILE_MAIN_MENU_BUTTON_FONT_SIZE, MOBILE_MAIN_MENU_BUTTON_HEIGHT } from './mainMenuLayout';

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
// Match the mobile TeamSelectScene Menu width and center from createTeamScreenLayout:
// menuButtonRect = { x: 38, y: 639, width: 240, height: 54 } on the 1600px canvas.
// Keep Back's taller geometry and optical label offset independent.
export const MOBILE_GAME_MODES_BACK = {
  fontSize: '30px',
  height: 70,
  label: '← BACK',
  labelOffsetY: -2,
  width: 240,
  x: 158,
  y: 666
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

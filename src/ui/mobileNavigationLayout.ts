import { SCENE_WIDTH } from '../config';

export const MOBILE_NAV_BUTTON_WIDTH = 240;
export const MOBILE_NAV_BUTTON_HEIGHT = 70;
export const MOBILE_NAV_BUTTON_FONT_SIZE = '32px';
export const MOBILE_NAV_BUTTON_CENTER_X = 158;
export const MOBILE_NAV_BUTTON_CENTER_Y = 666;
export const MOBILE_ACTION_BUTTON_CENTER_X = SCENE_WIDTH - MOBILE_NAV_BUTTON_CENTER_X;

interface NavigationButtonLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: string;
}

// Explicit opt-in for navigation buttons; desktop and other actions retain their layout.
export function getNavigationButtonLayout<T extends NavigationButtonLayout>(
  layout: T,
  mobile: boolean,
  parentPosition: { x: number; y: number } = { x: 0, y: 0 }
): T {
  if (!mobile) {
    return layout;
  }

  return {
    ...layout,
    width: MOBILE_NAV_BUTTON_WIDTH,
    height: MOBILE_NAV_BUTTON_HEIGHT,
    fontSize: MOBILE_NAV_BUTTON_FONT_SIZE,
    // Convert the canvas slot into local coordinates for translated modal panels.
    x: MOBILE_NAV_BUTTON_CENTER_X - parentPosition.x,
    y: MOBILE_NAV_BUTTON_CENTER_Y - parentPosition.y
  };
}

export function getMobileActionButtonLayout<T extends NavigationButtonLayout>(layout: T, mobile: boolean): T {
  if (!mobile) {
    return layout;
  }

  return {
    ...getNavigationButtonLayout(layout, true),
    x: MOBILE_ACTION_BUTTON_CENTER_X
  };
}

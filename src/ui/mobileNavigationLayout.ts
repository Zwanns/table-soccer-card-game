export const MOBILE_NAV_BUTTON_WIDTH = 240;
export const MOBILE_NAV_BUTTON_HEIGHT = 70;
export const MOBILE_NAV_BUTTON_FONT_SIZE = '32px';

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
  minimumTop?: number
): T {
  if (!mobile) {
    return layout;
  }

  return {
    ...layout,
    width: MOBILE_NAV_BUTTON_WIDTH,
    height: MOBILE_NAV_BUTTON_HEIGHT,
    fontSize: MOBILE_NAV_BUTTON_FONT_SIZE,
    // Preserve the existing gap when a taller button would reach its neighbour.
    y: minimumTop === undefined
      ? layout.y
      : Math.max(layout.y, minimumTop + MOBILE_NAV_BUTTON_HEIGHT / 2)
  };
}

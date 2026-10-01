import { rectCenter, type TeamScreenRect } from './teamScreenLayout';

export const MOBILE_KIT_CARD_WIDTH = 120;
export const MOBILE_KIT_CARD_HEIGHT = 140;
const MOBILE_KIT_STACK_OFFSET_Y = 10;
const MOBILE_KIT_STACK_RAISE_Y = 24;

/** Active card is in front; the back card exposes half its width toward the specified side. */
export function getMobileKitCardLayout(preview: TeamScreenRect, slot: 1 | 2, active: boolean): TeamScreenRect {
  const center = rectCenter(preview);
  const direction = slot === 1 ? 1 : -1;
  const offset = MOBILE_KIT_CARD_WIDTH / 2;
  return {
    x: center.x - MOBILE_KIT_CARD_WIDTH / 2 + direction * (active ? -offset / 2 : offset / 2),
    y: center.y - MOBILE_KIT_STACK_RAISE_Y - MOBILE_KIT_CARD_HEIGHT / 2 + (active ? 0 : MOBILE_KIT_STACK_OFFSET_Y),
    width: MOBILE_KIT_CARD_WIDTH,
    height: MOBILE_KIT_CARD_HEIGHT
  };
}

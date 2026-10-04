export interface TooltipRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PLAYER_TOOLTIP_FONT_SIZE = 28;
export const TOOLTIP_PADDING_X = 20;
export const TOOLTIP_PADDING_Y = 12;
export const PLAYER_TOOLTIP_MIN_WIDTH = 140;
export const PLAYER_TOOLTIP_MAX_WIDTH = 400;
export const PLAYER_TOOLTIP_MIN_HEIGHT = 56;
export const PLAYER_TOOLTIP_CARD_GAP = 24;
export const PLAYER_TOOLTIP_MOBILE_CARD_GAP = 0;
export const PLAYER_TOOLTIP_VIEWPORT_INSET = 12;

export function getPlayerTooltipSize(textWidth: number, textHeight: number, viewport: TooltipRect) {
  return {
    width: Math.min(Math.max(PLAYER_TOOLTIP_MIN_WIDTH, Math.ceil(textWidth) + TOOLTIP_PADDING_X * 2),
      PLAYER_TOOLTIP_MAX_WIDTH, Math.floor(viewport.width - PLAYER_TOOLTIP_VIEWPORT_INSET * 2)),
    height: Math.min(Math.max(PLAYER_TOOLTIP_MIN_HEIGHT, Math.ceil(textHeight) + TOOLTIP_PADDING_Y * 2),
      Math.floor(viewport.height - PLAYER_TOOLTIP_VIEWPORT_INSET * 2))
  };
}

/** Fits a single line by measured glyph width, without scaling or changing the stored name. */
export function fitPlayerTooltipText(name: string, maxWidth: number, measure: (text: string) => number): string {
  if (measure(name) <= maxWidth) return name;
  const characters = Array.from(name);
  while (characters.length > 0) {
    characters.pop();
    const candidate = `${characters.join('')}…`;
    if (measure(candidate) <= maxWidth) return candidate;
  }
  return measure('…') <= maxWidth ? '…' : '';
}

export function getPlayerTooltipLayout(card: TooltipRect, size: { width: number; height: number }, viewport: TooltipRect,
  mobileLandscape = false) {
  const gap = mobileLandscape ? PLAYER_TOOLTIP_MOBILE_CARD_GAP : PLAYER_TOOLTIP_CARD_GAP;
  const left = Math.ceil(viewport.x + PLAYER_TOOLTIP_VIEWPORT_INSET);
  const top = Math.ceil(viewport.y + PLAYER_TOOLTIP_VIEWPORT_INSET);
  const right = Math.floor(viewport.x + viewport.width - PLAYER_TOOLTIP_VIEWPORT_INSET - size.width);
  const bottom = Math.floor(viewport.y + viewport.height - PLAYER_TOOLTIP_VIEWPORT_INSET - size.height);
  const above = Math.floor(card.y - gap - size.height);
  const placement = above >= top ? 'above' : 'below';
  return {
    x: Math.max(left, Math.min(Math.round(card.x + card.width / 2 - size.width / 2), right)),
    y: Math.max(top, Math.min(placement === 'above' ? above : Math.ceil(card.y + card.height + gap), bottom)),
    ...size,
    placement
  };
}

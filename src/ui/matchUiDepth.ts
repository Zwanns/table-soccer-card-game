// Modal dim and content are children of the same root, so both cover gameplay tooltips.
export const MATCH_OVERLAY_DEPTH = 1000;
export const PLAYER_TOOLTIP_DEPTH = MATCH_OVERLAY_DEPTH - 1;
export const CARD_HOVER_DEPTH = PLAYER_TOOLTIP_DEPTH - 1;
export const MATCH_RESTART_CONFIRMATION_DEPTH = MATCH_OVERLAY_DEPTH + 1;
export const MATCH_FINISHED_MODAL_DEPTH = 1100;
export const MATCH_EXIT_CONFIRMATION_DEPTH = 6000;

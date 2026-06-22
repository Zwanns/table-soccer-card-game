import type { CardRank } from '../cards';
import type { GameEvent, TargetLine } from '../game';
import type { TutorialTextKey } from './tutorialTexts';

export type MatchMode = 'quick' | 'tutorial';
export type TutorialMidfielderSlot = 'left' | 'center' | 'right';

export type TutorialWaitFor = 'next' | 'action' | 'engine-event' | 'line-reached';

export type TutorialAction =
  | { type: 'draw-attack-card'; rank?: CardRank }
  | { type: 'select-target'; positionId: string; rank?: CardRank }
  | { type: 'commit-midfielder'; positionId: string; slot?: TutorialMidfielderSlot; rank?: CardRank }
  | { type: 'use-midfield-gap'; positionId: string; slot?: TutorialMidfielderSlot };

export type TutorialAllowedAction =
  | { type: 'draw-attack-card'; rank?: CardRank }
  | { type: 'select-target'; positionId?: string; rank?: CardRank }
  | { type: 'commit-midfielder'; positionId?: string; slot?: TutorialMidfielderSlot; rank?: CardRank }
  | { type: 'use-midfield-gap'; positionId?: string; slot?: TutorialMidfielderSlot };

export type TutorialHighlightTarget =
  | { type: 'active-deck' }
  | { type: 'attack-card' }
  | { type: 'field-card'; owner: 'active' | 'opponent'; positionId: string; rank?: CardRank }
  | { type: 'own-midfielder'; slot: TutorialMidfielderSlot; rank?: CardRank }
  | { type: 'opponent-midfielder'; slot: TutorialMidfielderSlot; rank?: CardRank }
  | { type: 'open-zone'; owner: 'active' | 'opponent'; slot: TutorialMidfielderSlot };

export interface TutorialStep {
  id: string;
  titleKey?: TutorialTextKey;
  messageKey: TutorialTextKey;
  waitFor: TutorialWaitFor;
  highlight?: readonly TutorialHighlightTarget[];
  allowedAction?: TutorialAllowedAction;
  blockedMessageKey?: TutorialTextKey;
  expectedEventType?: GameEvent['type'];
  expectedLine?: TargetLine;
}

export interface TutorialBlockedAction {
  allowed: false;
  messageKey: TutorialTextKey;
}

export interface TutorialAllowedActionResult {
  allowed: true;
}

export type TutorialActionResult = TutorialAllowedActionResult | TutorialBlockedAction;

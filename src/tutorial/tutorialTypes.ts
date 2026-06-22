import type { CardRank } from '../cards';
import type { GameEvent, TargetLine } from '../game';

export type MatchMode = 'quick' | 'tutorial';

export type TutorialWaitFor = 'next' | 'action' | 'engine-event' | 'line-reached';

export type TutorialAction =
  | { type: 'draw-attack-card'; rank?: CardRank }
  | { type: 'select-target'; positionId: string; rank?: CardRank };

export type TutorialAllowedAction =
  | { type: 'draw-attack-card'; rank?: CardRank }
  | { type: 'select-target'; positionId?: string; rank?: CardRank };

export type TutorialHighlightTarget =
  | { type: 'active-deck' }
  | { type: 'attack-card' }
  | { type: 'field-card'; owner: 'active' | 'opponent'; positionId: string; rank?: CardRank };

export interface TutorialStep {
  id: string;
  title?: string;
  message: string;
  waitFor: TutorialWaitFor;
  highlight?: readonly TutorialHighlightTarget[];
  allowedAction?: TutorialAllowedAction;
  expectedEventType?: GameEvent['type'];
  expectedLine?: TargetLine;
}

export interface TutorialBlockedAction {
  allowed: false;
  message: string;
}

export interface TutorialAllowedActionResult {
  allowed: true;
}

export type TutorialActionResult = TutorialAllowedActionResult | TutorialBlockedAction;

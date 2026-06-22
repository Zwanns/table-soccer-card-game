import { createGoalkeeperCards, createPlayerDecks, type Card, type CardRank, type GoalkeeperCard } from '../cards';
import type { GameSetupPreset } from '../game';
import type { TutorialStep } from './tutorialTypes';

export const TUTORIAL_MATCH_V2_TEAMS = {
  player1Name: 'Brazil',
  player2Name: 'Germany',
  player1FlagCode: 'br',
  player2FlagCode: 'de',
  player1ControllerType: 'HUMAN',
  player2ControllerType: 'HUMAN'
} as const;

export const TUTORIAL_MATCH_V2_SETUP_PRESET: GameSetupPreset = {
  activePlayerId: 'PLAYER_1',
  player1Deck: createTutorialPlayerDeck('RED', [
    'K',
    'Q',
    'J',
    '10',
    '8',
    '9',
    '6',
    '10',
    'J',
    'Q'
  ]),
  player2Deck: createTutorialPlayerDeck('BLACK', [
    '3',
    '4',
    '7',
    'A',
    '5',
    '2',
    '6',
    'A',
    '9',
    '10',
    '3'
  ]),
  player1GoalkeeperDeck: createTutorialGoalkeeperDeck(['A']),
  player2GoalkeeperDeck: createTutorialGoalkeeperDeck(['5']),
  player2Field: {
    'midfielder-3': null
  }
};

export const TUTORIAL_MATCH_V2_STEPS: readonly TutorialStep[] = [
  {
    id: 'welcome',
    titleKey: 'tutorial.welcome.title',
    messageKey: 'tutorial.welcome.message',
    waitFor: 'next'
  },
  {
    id: 'basic-rule',
    titleKey: 'tutorial.basicRule.title',
    messageKey: 'tutorial.basicRule.message',
    waitFor: 'next'
  },
  {
    id: 'draw-nine',
    messageKey: 'tutorial.drawNine.message',
    waitFor: 'action',
    highlight: [{ type: 'active-deck' }],
    allowedAction: { type: 'draw-attack-card', rank: '9' }
  },
  {
    id: 'beat-seven',
    messageKey: 'tutorial.beatSeven.message',
    waitFor: 'action',
    highlight: [
      { type: 'attack-card' },
      { type: 'field-card', owner: 'opponent', positionId: 'midfielder-1', rank: '7' }
    ],
    allowedAction: { type: 'select-target', positionId: 'midfielder-1', rank: '7' }
  },
  {
    id: 'turnover-rule',
    titleKey: 'tutorial.turnoverRule.title',
    messageKey: 'tutorial.turnoverRule.message',
    waitFor: 'next'
  },
  {
    id: 'special-rule',
    titleKey: 'tutorial.specialRule.title',
    messageKey: 'tutorial.specialRule.message',
    waitFor: 'next'
  },
  {
    id: 'draw-six',
    messageKey: 'tutorial.drawSix.message',
    waitFor: 'action',
    highlight: [{ type: 'active-deck' }],
    allowedAction: { type: 'draw-attack-card', rank: '6' }
  },
  {
    id: 'beat-ace',
    messageKey: 'tutorial.beatAce.message',
    waitFor: 'action',
    highlight: [
      { type: 'attack-card' },
      { type: 'field-card', owner: 'opponent', positionId: 'midfielder-2', rank: 'A' }
    ],
    allowedAction: { type: 'select-target', positionId: 'midfielder-2', rank: 'A' }
  },
  {
    id: 'clear-defense',
    titleKey: 'tutorial.clearDefense.title',
    messageKey: 'tutorial.clearDefense.message',
    waitFor: 'line-reached',
    expectedLine: 'GOALKEEPER'
  },
  {
    id: 'goalkeeper',
    titleKey: 'tutorial.goalkeeper.title',
    messageKey: 'tutorial.goalkeeper.message',
    waitFor: 'next',
    highlight: [{ type: 'field-card', owner: 'opponent', positionId: 'goalkeeper', rank: '5' }]
  },
  {
    id: 'draw-shot',
    messageKey: 'tutorial.drawShot.message',
    waitFor: 'action',
    highlight: [{ type: 'active-deck' }],
    allowedAction: { type: 'draw-attack-card', rank: 'Q' }
  },
  {
    id: 'take-shot',
    messageKey: 'tutorial.takeShot.message',
    waitFor: 'engine-event',
    highlight: [
      { type: 'attack-card' },
      { type: 'field-card', owner: 'opponent', positionId: 'goalkeeper', rank: '5' }
    ],
    allowedAction: { type: 'select-target', positionId: 'goalkeeper', rank: '5' },
    expectedEventType: 'GOAL_SCORED'
  },
  {
    id: 'turnover-after-goal',
    titleKey: 'tutorial.turnoverAfterGoal.title',
    messageKey: 'tutorial.turnoverAfterGoal.message',
    waitFor: 'next'
  },
  {
    id: 'midfield-support-intro',
    titleKey: 'tutorial.midfieldSupport.title',
    messageKey: 'tutorial.midfieldSupport.message',
    waitFor: 'next'
  },
  {
    id: 'select-left-midfielder',
    messageKey: 'tutorial.selectLeftMidfielder.message',
    waitFor: 'action',
    highlight: [{ type: 'own-midfielder', slot: 'left', rank: 'A' }],
    allowedAction: { type: 'commit-midfielder', slot: 'left', rank: 'A' },
    blockedMessageKey: 'tutorial.guard.tryMidfielder'
  },
  {
    id: 'opposite-midfielder-beaten',
    titleKey: 'tutorial.oppositeMidfielderBeaten.title',
    messageKey: 'tutorial.oppositeMidfielderBeaten.message',
    waitFor: 'next',
    highlight: [{ type: 'opponent-midfielder', slot: 'left' }]
  },
  {
    id: 'opposite-slot-rule',
    titleKey: 'tutorial.oppositeSlotRule.title',
    messageKey: 'tutorial.oppositeSlotRule.message',
    waitFor: 'next'
  },
  {
    id: 'empty-slot',
    titleKey: 'tutorial.emptySlot.title',
    messageKey: 'tutorial.emptySlot.message',
    waitFor: 'next',
    highlight: [{ type: 'open-zone', owner: 'active', slot: 'left' }]
  },
  {
    id: 'draw-low-after-midfielder',
    messageKey: 'tutorial.drawLowAfterMidfielder.message',
    waitFor: 'action',
    highlight: [{ type: 'active-deck' }],
    allowedAction: { type: 'draw-attack-card', rank: '3' }
  },
  {
    id: 'lose-after-midfielder',
    messageKey: 'tutorial.loseAfterMidfielder.message',
    waitFor: 'engine-event',
    highlight: [
      { type: 'attack-card' },
      { type: 'opponent-midfielder', slot: 'center', rank: '10' }
    ],
    allowedAction: { type: 'select-target', positionId: 'midfielder-2', rank: '10' },
    blockedMessageKey: 'tutorial.guard.useOppositeLane',
    expectedEventType: 'ATTACK_MISSED'
  },
  {
    id: 'open-zone',
    titleKey: 'tutorial.openZone.title',
    messageKey: 'tutorial.openZone.message',
    waitFor: 'next',
    highlight: [{ type: 'open-zone', owner: 'opponent', slot: 'left' }]
  },
  {
    id: 'draw-counterattack-card',
    messageKey: 'tutorial.drawCounterattackCard.message',
    waitFor: 'action',
    highlight: [{ type: 'active-deck' }],
    allowedAction: { type: 'draw-attack-card', rank: '3' }
  },
  {
    id: 'pass-through-open-zone',
    titleKey: 'tutorial.passThroughOpenZone.title',
    messageKey: 'tutorial.passThroughOpenZone.message',
    waitFor: 'action',
    highlight: [{ type: 'open-zone', owner: 'opponent', slot: 'left' }],
    allowedAction: { type: 'use-midfield-gap', slot: 'left' },
    blockedMessageKey: 'tutorial.guard.passOpenZone'
  },
  {
    id: 'ready',
    titleKey: 'tutorial.ready.title',
    messageKey: 'tutorial.ready.message',
    waitFor: 'next'
  }
];

export const TUTORIAL_MATCH_V1_TEAMS = TUTORIAL_MATCH_V2_TEAMS;
export const TUTORIAL_MATCH_V1_SETUP_PRESET = TUTORIAL_MATCH_V2_SETUP_PRESET;
export const TUTORIAL_MATCH_V1_STEPS = TUTORIAL_MATCH_V2_STEPS;

function createTutorialPlayerDeck(color: 'RED' | 'BLACK', preferredRanks: readonly CardRank[]): Card[] {
  const deckIndex = color === 'RED' ? 0 : 1;
  const deck = createPlayerDecks()[deckIndex].cards.map((card) => ({ ...card }));
  const orderedCards = preferredRanks.map((rank) => takeCardByRank(deck, rank));

  return [...orderedCards, ...deck];
}

function createTutorialGoalkeeperDeck(preferredRanks: readonly GoalkeeperCard['rank'][]): GoalkeeperCard[] {
  const deck = createGoalkeeperCards();
  const orderedCards = preferredRanks.map((rank) => takeGoalkeeperCardByRank(deck, rank));

  return [...orderedCards, ...deck];
}

function takeCardByRank(deck: Card[], rank: CardRank): Card {
  const index = deck.findIndex((card) => card.rank === rank);

  if (index < 0) {
    throw new Error(`Tutorial card rank "${rank}" is not available.`);
  }

  const [card] = deck.splice(index, 1);

  return card!;
}

function takeGoalkeeperCardByRank(deck: GoalkeeperCard[], rank: GoalkeeperCard['rank']): GoalkeeperCard {
  const index = deck.findIndex((card) => card.rank === rank);

  if (index < 0) {
    throw new Error(`Tutorial goalkeeper rank "${rank}" is not available.`);
  }

  const [card] = deck.splice(index, 1);

  return card!;
}

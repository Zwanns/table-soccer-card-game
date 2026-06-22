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
    title: 'Tutorial Match',
    message: 'Build an attack by beating opponent cards line by line. Reach the goalkeeper to take a shot.',
    waitFor: 'next'
  },
  {
    id: 'basic-rule',
    title: 'Basic rule',
    message: 'Your card can beat an opponent card if its rank is equal or higher.',
    waitFor: 'next'
  },
  {
    id: 'draw-nine',
    message: 'Draw your 9.',
    waitFor: 'action',
    highlight: [{ type: 'active-deck' }],
    allowedAction: { type: 'draw-attack-card', rank: '9' }
  },
  {
    id: 'beat-seven',
    message: "Now beat the opponent's 7.",
    waitFor: 'action',
    highlight: [
      { type: 'attack-card' },
      { type: 'field-card', owner: 'opponent', positionId: 'midfielder-1', rank: '7' }
    ],
    allowedAction: { type: 'select-target', positionId: 'midfielder-1', rank: '7' }
  },
  {
    id: 'turnover-rule',
    title: 'Turnover',
    message: 'If your card cannot beat a target, the attack ends and the other team gets the ball.',
    waitFor: 'next'
  },
  {
    id: 'special-rule',
    title: 'Special rule',
    message: 'Some cards beat stronger ranks. For example, 6 can beat Ace.',
    waitFor: 'next'
  },
  {
    id: 'draw-six',
    message: 'Draw your 6.',
    waitFor: 'action',
    highlight: [{ type: 'active-deck' }],
    allowedAction: { type: 'draw-attack-card', rank: '6' }
  },
  {
    id: 'beat-ace',
    message: 'Use your 6 against Ace.',
    waitFor: 'action',
    highlight: [
      { type: 'attack-card' },
      { type: 'field-card', owner: 'opponent', positionId: 'midfielder-2', rank: 'A' }
    ],
    allowedAction: { type: 'select-target', positionId: 'midfielder-2', rank: 'A' }
  },
  {
    id: 'clear-defense',
    title: 'Keep going',
    message: 'Clear the defense line, then you will reach the goalkeeper.',
    waitFor: 'line-reached',
    expectedLine: 'GOALKEEPER'
  },
  {
    id: 'goalkeeper',
    title: 'Goalkeeper',
    message: 'You reached the goalkeeper. Beat the goalkeeper card to score.',
    waitFor: 'next',
    highlight: [{ type: 'field-card', owner: 'opponent', positionId: 'goalkeeper', rank: '5' }]
  },
  {
    id: 'draw-shot',
    message: 'Draw a shot card.',
    waitFor: 'action',
    highlight: [{ type: 'active-deck' }],
    allowedAction: { type: 'draw-attack-card', rank: 'Q' }
  },
  {
    id: 'take-shot',
    message: 'Take the shot!',
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
    title: 'Turnover',
    message: 'After an attack ends, the other team gets the ball. Now you defend.',
    waitFor: 'next'
  },
  {
    id: 'midfield-support-intro',
    title: 'Midfield support',
    message: 'During the midfield line, your midfielders can help the attack. They can only play against the opposite slot.',
    waitFor: 'next'
  },
  {
    id: 'select-left-midfielder',
    message: 'Select your left midfielder.',
    waitFor: 'action',
    highlight: [{ type: 'own-midfielder', slot: 'left', rank: 'A' }],
    allowedAction: { type: 'commit-midfielder', slot: 'left', rank: 'A' },
    blockedMessage: 'Try the highlighted midfielder.'
  },
  {
    id: 'opposite-midfielder-beaten',
    title: 'Opposite lane',
    message: 'He helps only in the same lane and beats the opposite midfielder.',
    waitFor: 'next',
    highlight: [{ type: 'opponent-midfielder', slot: 'left' }]
  },
  {
    id: 'opposite-slot-rule',
    title: 'Opposite slot only',
    message: 'A midfielder can help only in the same lane. Left vs left, center vs center, right vs right.',
    waitFor: 'next'
  },
  {
    id: 'empty-slot',
    title: 'Empty slot',
    message: 'You cannot use a midfielder against an empty slot. Open zones are passed through by the attacker.',
    waitFor: 'next',
    highlight: [{ type: 'open-zone', owner: 'active', slot: 'left' }]
  },
  {
    id: 'draw-low-after-midfielder',
    message: 'Draw a low card and see what happens after midfield support.',
    waitFor: 'action',
    highlight: [{ type: 'active-deck' }],
    allowedAction: { type: 'draw-attack-card', rank: '3' }
  },
  {
    id: 'lose-after-midfielder',
    message: "Use the 3 against Brazil's center midfielder.",
    waitFor: 'engine-event',
    highlight: [
      { type: 'attack-card' },
      { type: 'opponent-midfielder', slot: 'center', rank: '10' }
    ],
    allowedAction: { type: 'select-target', positionId: 'midfielder-2', rank: '10' },
    blockedMessage: 'Use the opposite lane.',
    expectedEventType: 'ATTACK_MISSED'
  },
  {
    id: 'open-zone',
    title: 'Open zone',
    message: 'Because a midfielder joined the attack, losing the ball leaves one open zone for the counter-attack.',
    waitFor: 'next',
    highlight: [{ type: 'open-zone', owner: 'opponent', slot: 'left' }]
  },
  {
    id: 'draw-counterattack-card',
    message: 'Draw a card for the counter-attack.',
    waitFor: 'action',
    highlight: [{ type: 'active-deck' }],
    allowedAction: { type: 'draw-attack-card', rank: '3' }
  },
  {
    id: 'pass-through-open-zone',
    title: 'Pass through',
    message: 'This is an open zone. No card is here - move through it and continue the attack.',
    waitFor: 'action',
    highlight: [{ type: 'open-zone', owner: 'opponent', slot: 'left' }],
    allowedAction: { type: 'use-midfield-gap', slot: 'left' },
    blockedMessage: 'Pass through the highlighted open zone.'
  },
  {
    id: 'ready',
    title: 'You are ready!',
    message: 'Now play the rest of the match yourself.',
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

import { createGoalkeeperCards, createPlayerDecks, type Card, type CardRank, type GoalkeeperCard } from '../cards';
import type { GameSetupPreset } from '../game';
import type { TutorialStep } from './tutorialTypes';

export const TUTORIAL_MATCH_V1_TEAMS = {
  player1Name: 'Brazil',
  player2Name: 'Germany',
  player1FlagCode: 'br',
  player2FlagCode: 'de',
  player1ControllerType: 'HUMAN',
  player2ControllerType: 'HUMAN'
} as const;

export const TUTORIAL_MATCH_V1_SETUP_PRESET: GameSetupPreset = {
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
    '5'
  ]),
  player1GoalkeeperDeck: createTutorialGoalkeeperDeck(['A']),
  player2GoalkeeperDeck: createTutorialGoalkeeperDeck(['5']),
  player2Field: {
    'midfielder-3': null
  }
};

export const TUTORIAL_MATCH_V1_STEPS: readonly TutorialStep[] = [
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
    id: 'ready',
    title: 'You are ready!',
    message: 'Now play the rest of the match yourself.',
    waitFor: 'next'
  }
];

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

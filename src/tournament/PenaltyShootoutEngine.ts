import { canBeat, GOALKEEPER_RANKS, STANDARD_RANKS, type Card, type CardRank, type GoalkeeperRank } from '../cards';
import { shuffleValues } from './tournamentRandom';
import type { PenaltyShootoutSide, PenaltyShootoutState } from './PenaltyShootoutState';
import type { PenaltyKickResult, TournamentPenaltyResult, TournamentTeamId } from './tournamentTypes';

const PENALTY_ATTACK_RANKS: readonly CardRank[] = [...STANDARD_RANKS, 'JOKER'];

export function createPenaltyShootoutState(options: {
  matchId: string;
  homeTeamId: TournamentTeamId;
  awayTeamId: TournamentTeamId;
  seed: string;
}): PenaltyShootoutState {
  const homeAttackDeck = shuffleValues(PENALTY_ATTACK_RANKS, `${options.seed}:home-attack:0`);
  const awayAttackDeck = shuffleValues(PENALTY_ATTACK_RANKS, `${options.seed}:away-attack:0`);
  const goalkeeperDeck = shuffleGoalkeeperDeck(options.seed, 0);

  return {
    matchId: options.matchId,
    homeTeamId: options.homeTeamId,
    awayTeamId: options.awayTeamId,
    seed: options.seed,
    status: 'active',
    phase: 'selecting-goalkeeper',
    nextShooter: 'home',
    currentGoalkeeperRank: null,
    revealedAttackerCardIndex: null,
    homeGoals: 0,
    awayGoals: 0,
    homeKicks: 0,
    awayKicks: 0,
    homeDeck: homeAttackDeck.slice(5),
    awayDeck: awayAttackDeck.slice(5),
    homeAvailableCards: homeAttackDeck.slice(0, 5),
    awayAvailableCards: awayAttackDeck.slice(0, 5),
    goalkeeperDeck,
    kicks: []
  };
}

export function drawPenaltyGoalkeeperCard(state: PenaltyShootoutState): PenaltyShootoutState {
  if (state.status === 'complete') {
    throw new Error('Penalty shootout is already complete.');
  }

  if (state.phase !== 'selecting-goalkeeper') {
    throw new Error('Goalkeeper card can only be drawn before the attacker reveals a card.');
  }

  return drawNextGoalkeeperCard(state);
}

export function revealPenaltyAttackCard(state: PenaltyShootoutState, selectedCardIndex: number): PenaltyShootoutState {
  if (state.status === 'complete') {
    throw new Error('Penalty shootout is already complete.');
  }

  if (state.phase !== 'selecting-attacker') {
    throw new Error('Penalty card can only be revealed after the goalkeeper card is drawn.');
  }

  const preparedState = ensureAvailableCards(state, state.nextShooter);
  const availableCards = getAvailableCards(preparedState, preparedState.nextShooter);

  if (availableCards[selectedCardIndex] === undefined) {
    throw new Error('Selected penalty card does not exist.');
  }

  return {
    ...preparedState,
    phase: 'ready-to-shoot',
    revealedAttackerCardIndex: selectedCardIndex
  };
}

export function takePenaltyKick(state: PenaltyShootoutState): PenaltyShootoutState {
  if (state.status === 'complete') {
    throw new Error('Penalty shootout is already complete.');
  }

  if (state.phase !== 'ready-to-shoot' || state.currentGoalkeeperRank === null || state.revealedAttackerCardIndex === null) {
    throw new Error('Penalty kick can only be taken after both cards are revealed.');
  }

  const selectedCardIndex = state.revealedAttackerCardIndex;
  const goalkeeperRank = state.currentGoalkeeperRank;
  const preparedState = ensureAvailableCards(state, state.nextShooter);
  const availableCards = getAvailableCards(preparedState, preparedState.nextShooter);
  const attackerRank = availableCards[selectedCardIndex];

  if (attackerRank === undefined) {
    throw new Error('Selected penalty card does not exist.');
  }

  const outcome = resolvePenaltyKick(attackerRank, goalkeeperRank);
  const shooterTeamId = getShooterTeamId(preparedState, preparedState.nextShooter);
  const kick: PenaltyKickResult = {
    shooterTeamId,
    attackerRank,
    goalkeeperRank,
    outcome
  };
  const nextKicks = [...preparedState.kicks, kick];
  const homeScored = preparedState.nextShooter === 'home' && outcome === 'goal';
  const awayScored = preparedState.nextShooter === 'away' && outcome === 'goal';
  const homeGoals = preparedState.homeGoals + (homeScored ? 1 : 0);
  const awayGoals = preparedState.awayGoals + (awayScored ? 1 : 0);
  const homeKicks = preparedState.homeKicks + (preparedState.nextShooter === 'home' ? 1 : 0);
  const awayKicks = preparedState.awayKicks + (preparedState.nextShooter === 'away' ? 1 : 0);
  const nextShooter = preparedState.nextShooter === 'home' ? 'away' : 'home';
  const stateAfterKick: PenaltyShootoutState = removeSelectedCard(
    {
      ...preparedState,
      homeGoals,
      awayGoals,
      homeKicks,
      awayKicks,
      nextShooter,
      kicks: nextKicks,
      revealedAttackerCardIndex: null,
      currentGoalkeeperRank: null,
      phase: 'selecting-goalkeeper'
    },
    preparedState.nextShooter,
    selectedCardIndex
  );
  const winnerTeamId = getPenaltyWinner(stateAfterKick);

  if (winnerTeamId !== undefined) {
    return {
      ...stateAfterKick,
      status: 'complete',
      winnerTeamId
    };
  }

  return ensureAvailableCards(stateAfterKick, nextShooter);
}

export function createTournamentPenaltyResult(state: PenaltyShootoutState): TournamentPenaltyResult {
  if (state.status !== 'complete' || state.winnerTeamId === undefined) {
    throw new Error('Cannot create a tournament penalty result before the shootout is complete.');
  }

  return {
    homeGoals: state.homeGoals,
    awayGoals: state.awayGoals,
    winnerTeamId: state.winnerTeamId,
    kicks: state.kicks
  };
}

export function getCurrentPenaltyCards(state: PenaltyShootoutState): readonly CardRank[] {
  return getAvailableCards(state, state.nextShooter);
}

export function resolvePenaltyKick(
  attackerRank: CardRank,
  goalkeeperRank: GoalkeeperRank
): PenaltyKickResult['outcome'] {
  if (attackerRank === goalkeeperRank) {
    return 'post';
  }

  return canBeat(createPenaltyCard(attackerRank), createPenaltyCard(goalkeeperRank)) ? 'goal' : 'save';
}

function getPenaltyWinner(state: PenaltyShootoutState): TournamentTeamId | undefined {
  const homeRemaining = Math.max(0, 5 - state.homeKicks);
  const awayRemaining = Math.max(0, 5 - state.awayKicks);

  if (state.homeKicks < 5 || state.awayKicks < 5) {
    if (state.homeGoals > state.awayGoals + awayRemaining) {
      return state.homeTeamId;
    }

    if (state.awayGoals > state.homeGoals + homeRemaining) {
      return state.awayTeamId;
    }

    return undefined;
  }

  if (state.homeKicks === state.awayKicks && state.homeGoals !== state.awayGoals) {
    return state.homeGoals > state.awayGoals ? state.homeTeamId : state.awayTeamId;
  }

  return undefined;
}

function ensureAvailableCards(state: PenaltyShootoutState, side: PenaltyShootoutSide): PenaltyShootoutState {
  const availableCards = getAvailableCards(state, side);

  if (availableCards.length > 0) {
    return state;
  }

  const deckKey = side === 'home' ? 'homeDeck' : 'awayDeck';
  const availableKey = side === 'home' ? 'homeAvailableCards' : 'awayAvailableCards';
  const deck = state[deckKey].length > 0 ? state[deckKey] : shuffleValues(PENALTY_ATTACK_RANKS, `${state.seed}:${side}-attack:${state.kicks.length}`);
  const nextCard = deck[0];

  if (nextCard === undefined) {
    throw new Error('Cannot draw a penalty card.');
  }

  return {
    ...state,
    [deckKey]: deck.slice(1),
    [availableKey]: [nextCard]
  };
}

function drawNextGoalkeeperCard(state: PenaltyShootoutState): PenaltyShootoutState {
  const deck = state.goalkeeperDeck.length > 0 ? state.goalkeeperDeck : shuffleGoalkeeperDeck(state.seed, state.kicks.length);
  const currentGoalkeeperRank = requireGoalkeeperCard(deck[0]);

  return {
    ...state,
    currentGoalkeeperRank,
    goalkeeperDeck: deck.slice(1),
    phase: 'selecting-attacker',
    revealedAttackerCardIndex: null
  };
}

function removeSelectedCard(
  state: PenaltyShootoutState,
  side: PenaltyShootoutSide,
  selectedCardIndex: number
): PenaltyShootoutState {
  const key = side === 'home' ? 'homeAvailableCards' : 'awayAvailableCards';

  return {
    ...state,
    [key]: state[key].filter((_rank, index) => index !== selectedCardIndex)
  };
}

function getAvailableCards(state: PenaltyShootoutState, side: PenaltyShootoutSide): readonly CardRank[] {
  return side === 'home' ? state.homeAvailableCards : state.awayAvailableCards;
}

function getShooterTeamId(state: PenaltyShootoutState, side: PenaltyShootoutSide): TournamentTeamId {
  return side === 'home' ? state.homeTeamId : state.awayTeamId;
}

function shuffleGoalkeeperDeck(seed: string, index: number): GoalkeeperRank[] {
  return shuffleValues(GOALKEEPER_RANKS, `${seed}:goalkeeper:${index}`);
}

function requireGoalkeeperCard(rank: GoalkeeperRank | undefined): GoalkeeperRank {
  if (rank === undefined) {
    throw new Error('Cannot draw a goalkeeper card for the penalty shootout.');
  }

  return rank;
}

function createPenaltyCard(rank: CardRank): Card {
  return {
    id: `penalty-${rank}`,
    rank,
    color: rank === 'JOKER' ? 'JOKER' : 'RED',
    suit: rank === 'JOKER' ? null : 'HEARTS'
  };
}

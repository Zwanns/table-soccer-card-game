import type { CardRank, GoalkeeperRank } from '../cards';
import type { PenaltyKickResult, TournamentTeamId } from './tournamentTypes';

export type PenaltyShootoutSide = 'home' | 'away';

export type PenaltyShootoutStatus = 'active' | 'complete';

export type PenaltyShootoutPhase = 'selecting-goalkeeper' | 'selecting-attacker' | 'ready-to-shoot';

export type PenaltyShootoutState = {
  matchId: string;
  homeTeamId: TournamentTeamId;
  awayTeamId: TournamentTeamId;
  seed: string;
  status: PenaltyShootoutStatus;
  phase: PenaltyShootoutPhase;
  nextShooter: PenaltyShootoutSide;
  currentGoalkeeperRank: GoalkeeperRank | null;
  revealedAttackerCardIndex: number | null;
  homeGoals: number;
  awayGoals: number;
  homeKicks: number;
  awayKicks: number;
  homeDeck: CardRank[];
  awayDeck: CardRank[];
  homeAvailableCards: CardRank[];
  awayAvailableCards: CardRank[];
  goalkeeperDeck: GoalkeeperRank[];
  kicks: PenaltyKickResult[];
  winnerTeamId?: TournamentTeamId;
};

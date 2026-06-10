import type { CardRank, GoalkeeperRank } from '../cards';

export type TournamentFormatId = 'cup-m' | 'cup-l' | 'cup-xl';

export type TournamentStage =
  | 'group'
  | 'round-of-16'
  | 'quarter-final'
  | 'semi-final'
  | 'final'
  | 'complete';

export type TournamentMatchStatus = 'locked' | 'available' | 'completed';

export type TournamentTeamId = string;
export type TournamentGroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type TournamentGroup = {
  id: TournamentGroupId;
  teamIds: TournamentTeamId[];
};

export type TournamentMatchTeamStat = {
  teamId: TournamentTeamId;
  goals: number;
  shots: number;
  goalkeeperSaves: number;
};

export type TournamentMatchTeamStats = {
  home: TournamentMatchTeamStat;
  away: TournamentMatchTeamStat;
};

export type TournamentMatchPlayerStats = {
  teamId: TournamentTeamId;
  playerId: string;
  playerName: string;
  shirtNumber: number;
  goals: number;
  assists: number;
  goalkeeperSaves: number;
  penaltyGoals: number;
  penaltyGoalkeeperSaves: number;
};

export type PenaltyKickResult = {
  shooterTeamId: TournamentTeamId;
  attackerRank: CardRank;
  goalkeeperRank: GoalkeeperRank;
  outcome: 'goal' | 'save' | 'post';
};

export type TournamentPenaltyResult = {
  homeGoals: number;
  awayGoals: number;
  winnerTeamId: TournamentTeamId;
  kicks: PenaltyKickResult[];
};

export type TournamentMatchResult = {
  matchId: string;
  homeTeamId: TournamentTeamId;
  awayTeamId: TournamentTeamId;
  homeGoals: number;
  awayGoals: number;
  winnerTeamId?: TournamentTeamId;
  penaltyShootout?: TournamentPenaltyResult;
  teamStats: TournamentMatchTeamStats;
  playerStats: TournamentMatchPlayerStats[];
};

export type TournamentMatch = {
  id: string;
  stage: TournamentStage;
  roundIndex: number;
  orderIndex: number;
  groupId?: TournamentGroupId;
  homeTeamId?: TournamentTeamId;
  awayTeamId?: TournamentTeamId;
  status: TournamentMatchStatus;
  result?: TournamentMatchResult;
};

export type TournamentGroupStanding = {
  teamId: TournamentTeamId;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  shots: number;
  points: number;
};

export type TournamentTeamStats = {
  teamId: TournamentTeamId;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  shots: number;
  goalkeeperSaves: number;
  penaltyShootoutWins: number;
  penaltyShootoutLosses: number;
  penaltyGoals: number;
  penaltyGoalkeeperSaves: number;
};

export type TournamentPlayerStats = {
  teamId: TournamentTeamId;
  playerId: string;
  playerName: string;
  shirtNumber: number;
  goals: number;
  assists: number;
  goalkeeperSaves: number;
  penaltyGoals: number;
  penaltyGoalkeeperSaves: number;
};

export type TournamentState = {
  id: string;
  formatId: TournamentFormatId;
  seed: string;
  stage: TournamentStage;
  teamIds: TournamentTeamId[];
  groups: TournamentGroup[];
  matches: TournamentMatch[];
  drawOrder: Record<TournamentTeamId, number>;
};

export type PlayerControllerType = 'HUMAN' | 'AI';

export type MatchControllerSetup = {
  player1: PlayerControllerType;
  player2: PlayerControllerType;
};

import type { GameState } from './GameState';
import type { Player } from './Player';

export interface PlayerMatchStats {
  playerId: Player['id'];
  goals: number;
  shots: number;
  goalpostHits: number;
  goalkeeperSaves: number;
  shotAccuracy: number;
}

export function getMatchStats(state: Readonly<GameState>): [PlayerMatchStats, PlayerMatchStats] {
  const [playerOne, playerTwo] = state.players;

  return [
    createPlayerMatchStats(state, playerOne, playerTwo),
    createPlayerMatchStats(state, playerTwo, playerOne)
  ];
}

function createPlayerMatchStats(
  state: Readonly<GameState>,
  player: Readonly<Player>,
  opponent: Readonly<Player>
): PlayerMatchStats {
  const shots = state.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === player.id).length;
  const goalpostHits = state.log.filter((event) => event.type === 'GOALPOST_HIT' && event.playerId === player.id).length;
  const goalkeeperSaves = state.log.filter((event) => event.type === 'GOALKEEPER_SAVE' && event.playerId === opponent.id).length;

  return {
    playerId: player.id,
    goals: player.goals,
    shots,
    goalpostHits,
    goalkeeperSaves,
    shotAccuracy: shots === 0 ? 0 : Math.round((player.goals / shots) * 100)
  };
}

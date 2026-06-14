import type { GameState } from './GameState';
import type { FieldPositionId } from './PlayerField';
import type { Player } from './Player';
import type { ScorerSnapshot } from './GameEvent';

const POSITION_ADVANCEMENT_POINTS: Record<FieldPositionId, number> = {
  'midfielder-1': 1,
  'midfielder-2': 1,
  'midfielder-3': 1,
  'defender-1': 2,
  'defender-2': 2,
  goalkeeper: 3
};

export interface PlayerMatchStats {
  playerId: Player['id'];
  goals: number;
  scorers: GoalScorerStat[];
  shots: number;
  goalkeeperSaves: number;
  shotAccuracy: number;
  possession: number;
}

export type GoalScorerStat = ScorerSnapshot & {
  turnNumber: number;
};

export function formatGoalScorerLabel(scorer: Pick<GoalScorerStat, 'playerName' | 'shirtNumber' | 'rank'>): string {
  const playerName = scorer.playerName?.trim();
  const shirtNumber = scorer.shirtNumber;

  if (shirtNumber !== undefined && shirtNumber > 0 && playerName !== undefined && playerName.length > 0) {
    return `#${shirtNumber} ${playerName}`;
  }

  if (shirtNumber !== undefined && shirtNumber > 0) {
    return `#${shirtNumber}`;
  }

  if (playerName !== undefined && playerName.length > 0) {
    return playerName;
  }

  return `Rank ${scorer.rank}`;
}

export function getMatchStats(state: Readonly<GameState>): [PlayerMatchStats, PlayerMatchStats] {
  const [playerOne, playerTwo] = state.players;
  const [playerOnePossession, playerTwoPossession] = getMatchPossession(state);

  return [
    createPlayerMatchStats(state, playerOne, playerTwo, playerOnePossession),
    createPlayerMatchStats(state, playerTwo, playerOne, playerTwoPossession)
  ];
}

function createPlayerMatchStats(
  state: Readonly<GameState>,
  player: Readonly<Player>,
  opponent: Readonly<Player>,
  possession: number
): PlayerMatchStats {
  const shots = state.log.filter((event) => event.type === 'SHOT_ON_GOAL' && event.playerId === player.id).length;
  const goalkeeperSaves = state.log.filter((event) => event.type === 'GOALKEEPER_SAVE' && event.playerId === opponent.id).length;
  const scorers = state.log.flatMap((event) =>
    event.type === 'GOAL_SCORED' && event.playerId === player.id
      ? [
          {
            ...event.scorer,
            turnNumber: event.turnNumber
          }
        ]
      : []
  );

  return {
    playerId: player.id,
    goals: player.goals,
    scorers,
    shots,
    goalkeeperSaves,
    shotAccuracy: shots === 0 ? 0 : Math.round((player.goals / shots) * 100),
    possession
  };
}

function getMatchPossession(state: Readonly<GameState>): [number, number] {
  const [playerOne, playerTwo] = state.players;
  const playerOneTurnDepths = new Map<number, number>();
  const playerTwoTurnDepths = new Map<number, number>();

  for (const event of state.log) {
    if (event.type !== 'CARD_DEFEATED') {
      continue;
    }

    const points = POSITION_ADVANCEMENT_POINTS[event.positionId];

    if (event.playerId === playerOne.id) {
      playerOneTurnDepths.set(event.turnNumber, Math.max(playerOneTurnDepths.get(event.turnNumber) ?? 0, points));
    } else if (event.playerId === playerTwo.id) {
      playerTwoTurnDepths.set(event.turnNumber, Math.max(playerTwoTurnDepths.get(event.turnNumber) ?? 0, points));
    }
  }

  const playerOnePoints = sumMapValues(playerOneTurnDepths);
  const playerTwoPoints = sumMapValues(playerTwoTurnDepths);
  const maxPossibleDifference = Math.max(1, state.turnNumber * 3);
  const balance = clamp((playerOnePoints - playerTwoPoints) / maxPossibleDifference, -1, 1);
  const playerOnePossession = Math.round((0.5 + balance * 0.5) * 100);

  return [playerOnePossession, 100 - playerOnePossession];
}

function sumMapValues(values: ReadonlyMap<number, number>): number {
  let sum = 0;

  for (const value of values.values()) {
    sum += value;
  }

  return sum;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

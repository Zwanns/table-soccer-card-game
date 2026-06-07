import type { GameState } from './GameState';
import type { FieldPositionId } from './PlayerField';
import type { Player } from './Player';

export const ADVANTAGE_TURN_WINDOW = 5;
export const ADVANTAGE_FULL_PRESSURE_POINTS = 15;

const POSITION_ADVANCEMENT_POINTS: Record<FieldPositionId, number> = {
  'midfielder-1': 1,
  'midfielder-2': 1,
  'midfielder-3': 1,
  'defender-1': 2,
  'defender-2': 2,
  goalkeeper: 3
};

export interface TeamAdvantage {
  playerOnePoints: number;
  playerTwoPoints: number;
  difference: number;
  balance: number;
  playerOneShare: number;
  leadingPlayerId: Player['id'] | null;
  windowStartTurn: number;
  windowEndTurn: number;
}

export function getTeamAdvantage(state: Readonly<GameState>): TeamAdvantage {
  const windowEndTurn = state.turnNumber;
  const windowStartTurn = Math.max(1, windowEndTurn - ADVANTAGE_TURN_WINDOW + 1);
  const playerOneTurnDepths = new Map<number, number>();
  const playerTwoTurnDepths = new Map<number, number>();

  if (windowEndTurn > 0) {
    for (const event of state.log) {
      if (event.type !== 'CARD_DEFEATED') {
        continue;
      }

      if (event.turnNumber < windowStartTurn || event.turnNumber > windowEndTurn) {
        continue;
      }

      const points = POSITION_ADVANCEMENT_POINTS[event.positionId];

      if (event.playerId === state.players[0].id) {
        playerOneTurnDepths.set(event.turnNumber, Math.max(playerOneTurnDepths.get(event.turnNumber) ?? 0, points));
      } else if (event.playerId === state.players[1].id) {
        playerTwoTurnDepths.set(event.turnNumber, Math.max(playerTwoTurnDepths.get(event.turnNumber) ?? 0, points));
      }
    }
  }

  const playerOnePoints = sumMapValues(playerOneTurnDepths);
  const playerTwoPoints = sumMapValues(playerTwoTurnDepths);
  const difference = playerOnePoints - playerTwoPoints;
  const balance = clamp(difference / ADVANTAGE_FULL_PRESSURE_POINTS, -1, 1);

  return {
    playerOnePoints,
    playerTwoPoints,
    difference,
    balance,
    playerOneShare: 0.5 + balance * 0.5,
    leadingPlayerId:
      difference === 0 ? null : difference > 0 ? state.players[0].id : state.players[1].id,
    windowStartTurn,
    windowEndTurn
  };
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

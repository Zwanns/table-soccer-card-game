import {
  canBeat,
  canCommittedMidfielderBeat,
  createSeededRandom,
  getRankValue,
  isSpecialBeat,
  type Card
} from '../cards';
import type { GameState, MidfielderPositionId, Player } from '../game';
import { getCurrentTargetLine } from '../game';
import { MIDFIELDER_POSITION_IDS, RESTORE_ORDER, type FieldPositionId } from '../game/PlayerField';

export type SeededRandomLike = () => number;

export type SourceChoice =
  | {
      type: 'DRAW_FROM_DECK';
    }
  | {
      type: 'COMMIT_MIDFIELDER';
      positionId: MidfielderPositionId;
    };

export type TargetChoice =
  | {
      type: 'SELECT_TARGET';
      positionId: FieldPositionId;
    }
  | {
      type: 'SELECT_MIDFIELD_GAP';
      positionId: MidfielderPositionId;
    };

type MidfielderCandidate = {
  positionId: MidfielderPositionId;
  attackerCard: Card;
};

type TargetCandidate = {
  positionId: FieldPositionId;
  defenderCard: Pick<Card, 'rank'>;
};

export const MAX_MIDFIELDER_OVERPAY_STEPS = 2;

export function chooseAttackSource(
  state: Readonly<GameState>,
  playerId: Player['id'],
  random: SeededRandomLike
): SourceChoice | null {
  if (state.phase !== 'WAITING_FOR_ATTACK_CARD' || state.activePlayerId !== playerId) {
    return null;
  }

  const activePlayer = getPlayer(state, playerId);
  const opponent = getOpponent(state, playerId);

  if (activePlayer === undefined || opponent === undefined || getCurrentTargetLine(opponent.field) !== 'MIDFIELD') {
    return { type: 'DRAW_FROM_DECK' };
  }

  const successfulCandidates = getSuccessfulMidfielderCandidates(state, activePlayer, opponent);

  if (successfulCandidates.length === 0 || random() >= getMidfielderCommitProbability(activePlayer, opponent)) {
    return { type: 'DRAW_FROM_DECK' };
  }

  return {
    type: 'COMMIT_MIDFIELDER',
    positionId: pickMinimalSufficientMidfielder(successfulCandidates, random).positionId
  };
}

export function chooseTarget(
  state: Readonly<GameState>,
  playerId: Player['id'],
  random: SeededRandomLike
): TargetChoice | null {
  if (state.phase !== 'WAITING_FOR_TARGET' || state.activePlayerId !== playerId || state.attackCard === null) {
    return null;
  }

  const opponent = getOpponent(state, playerId);

  if (opponent === undefined) {
    return null;
  }

  const targetPositionIds = getLegalTargetPositionIds(state);

  if (targetPositionIds.length === 0) {
    return null;
  }

  const targetCandidates = getTargetCandidates(targetPositionIds, opponent);

  if (targetCandidates.length === 0) {
    return null;
  }

  const beatableTargets = targetCandidates.filter((candidate) => canBeat(state.attackCard as Card, candidate.defenderCard));

  if (beatableTargets.length > 0) {
    return {
      type: 'SELECT_TARGET',
      positionId: pickStrongestTarget(beatableTargets, random).positionId
    };
  }

  const gapPositionIds = getLegalMidfieldGapPositionIds(state);

  if (state.currentAttackCardSource === 'DECK' && gapPositionIds.length > 0) {
    return {
      type: 'SELECT_MIDFIELD_GAP',
      positionId: pickRandom(gapPositionIds, random)
    };
  }

  return {
    type: 'SELECT_TARGET',
    positionId: pickWeakestTarget(targetCandidates, random).positionId
  };
}

export function createAiDecisionRandom(matchSeed: string, playerId: Player['id']): SeededRandomLike {
  return createSeededRandom(hashSeed(`${matchSeed}:AI:${playerId}`));
}

function getSuccessfulMidfielderCandidates(
  state: Readonly<GameState>,
  activePlayer: Player,
  opponent: Player
): MidfielderCandidate[] {
  const legalPositionIds = state.committableMidfielderPositionIds ?? [];

  return legalPositionIds.flatMap((positionId) => {
    const attackerCard = activePlayer.field[positionId];
    const defenderCard = opponent.field[positionId];

    if (attackerCard === null || defenderCard === null || !MIDFIELDER_POSITION_IDS.includes(positionId)) {
      return [];
    }

    return canCommittedMidfielderBeat(attackerCard, defenderCard) && isEfficientMidfielderCommit(attackerCard, defenderCard)
      ? [
          {
            positionId,
            attackerCard
          }
        ]
      : [];
  });
}

function isEfficientMidfielderCommit(attackerCard: Card, defenderCard: Card): boolean {
  if (isSpecialBeat(attackerCard, defenderCard)) {
    return true;
  }

  const overpaySteps = getRankValue(attackerCard.rank) - getRankValue(defenderCard.rank);

  return overpaySteps > 0 && overpaySteps <= MAX_MIDFIELDER_OVERPAY_STEPS;
}

function getMidfielderCommitProbability(activePlayer: Player, opponent: Player): number {
  if (activePlayer.goals < opponent.goals) {
    return 0.8;
  }

  if (activePlayer.goals > opponent.goals) {
    return 0.55;
  }

  return 0.7;
}

function pickMinimalSufficientMidfielder(
  candidates: readonly MidfielderCandidate[],
  random: SeededRandomLike
): MidfielderCandidate {
  const minimalRankValue = Math.min(...candidates.map((candidate) => getRankValue(candidate.attackerCard.rank)));
  const minimalCandidates = candidates.filter(
    (candidate) => getRankValue(candidate.attackerCard.rank) === minimalRankValue
  );

  return pickRandom(minimalCandidates, random);
}

function getLegalMidfieldGapPositionIds(state: Readonly<GameState>): MidfielderPositionId[] {
  return (state.legalMidfieldGapPositionIds ?? []).filter(
    (positionId) =>
      MIDFIELDER_POSITION_IDS.includes(positionId) && positionId !== state.currentAttackingMidfielderPositionId
  );
}

function getLegalTargetPositionIds(state: Readonly<GameState>): FieldPositionId[] {
  return state.legalTargetPositionIds.filter(isFieldPositionId);
}

function getTargetCandidates(targetPositionIds: readonly FieldPositionId[], opponent: Player): TargetCandidate[] {
  return targetPositionIds.flatMap((positionId) => {
    const defenderCard = opponent.field[positionId];

    return defenderCard === null
      ? []
      : [
          {
            positionId,
            defenderCard
          }
        ];
  });
}

function pickStrongestTarget(candidates: readonly TargetCandidate[], random: SeededRandomLike): TargetCandidate {
  const strongestRankValue = Math.max(...candidates.map((candidate) => getRankValue(candidate.defenderCard.rank)));
  const strongestCandidates = candidates.filter(
    (candidate) => getRankValue(candidate.defenderCard.rank) === strongestRankValue
  );

  return pickRandom(strongestCandidates, random);
}

function pickWeakestTarget(candidates: readonly TargetCandidate[], random: SeededRandomLike): TargetCandidate {
  const weakestRankValue = Math.min(...candidates.map((candidate) => getRankValue(candidate.defenderCard.rank)));
  const weakestCandidates = candidates.filter(
    (candidate) => getRankValue(candidate.defenderCard.rank) === weakestRankValue
  );

  return pickRandom(weakestCandidates, random);
}

function pickRandom<T>(values: readonly T[], random: SeededRandomLike): T {
  return values[Math.floor(random() * values.length)] ?? values[0];
}

function getPlayer(state: Readonly<GameState>, playerId: Player['id']): Player | undefined {
  return state.players.find((player) => player.id === playerId);
}

function getOpponent(state: Readonly<GameState>, playerId: Player['id']): Player | undefined {
  return state.players.find((player) => player.id !== playerId);
}

function isFieldPositionId(positionId: string): positionId is FieldPositionId {
  return RESTORE_ORDER.includes(positionId as FieldPositionId);
}

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

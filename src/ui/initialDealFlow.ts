import type { FieldPositionId } from '../game';

export const INITIAL_DEAL_CARD_DURATION_MS = 420;

export interface InitialDealEntry {
  playerId: string;
  positionId: FieldPositionId;
}

export function createInitialDealSteps<TEntry extends InitialDealEntry>(
  entries: readonly TEntry[],
  playerIds: readonly string[]
): TEntry[][] {
  const [leftPlayerId, rightPlayerId] = playerIds;

  if (leftPlayerId === undefined || rightPlayerId === undefined) {
    return entries.map((entry) => [entry]);
  }

  const usedEntries = new Set<TEntry>();
  const steps: TEntry[][] = [];

  for (const leftEntry of entries) {
    if (leftEntry.playerId !== leftPlayerId || usedEntries.has(leftEntry)) {
      continue;
    }

    const rightEntry = entries.find(
      (candidate) =>
        !usedEntries.has(candidate) &&
        candidate.playerId === rightPlayerId &&
        candidate.positionId === leftEntry.positionId
    );
    const step = rightEntry === undefined ? [leftEntry] : [leftEntry, rightEntry];

    step.forEach((entry) => usedEntries.add(entry));
    steps.push(step);
  }

  for (const entry of entries) {
    if (!usedEntries.has(entry)) {
      usedEntries.add(entry);
      steps.push([entry]);
    }
  }

  return steps;
}

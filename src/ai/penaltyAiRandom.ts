import { createSeededRandom } from '../cards';
import type { PenaltyAiRandomSource } from './penaltyAiTypes';

export function createPenaltyAiRandom(seed: string, side: 'home' | 'away'): PenaltyAiRandomSource {
  return createSeededRandom(hashPenaltyAiSeed(`${seed}:PENALTY_AI:${side}`));
}

function hashPenaltyAiSeed(seed: string): number {
  let hash = 2166136261;

  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

import { createSeededRandom, type RandomGenerator } from '../cards';

export function hashTournamentSeed(seed: string): number {
  let hash = 2166136261;

  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createTournamentRandom(seed: string): RandomGenerator {
  return createSeededRandom(hashTournamentSeed(seed));
}

export function shuffleValues<T>(values: readonly T[], seed: string): T[] {
  const random = createTournamentRandom(seed);
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function takeRandomUnique<T>(values: readonly T[], count: number, seed: string): T[] {
  if (count > values.length) {
    throw new Error(`Cannot take ${count} unique values from a list of ${values.length}.`);
  }

  return shuffleValues(values, seed).slice(0, count);
}

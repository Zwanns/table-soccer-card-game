export type RandomGenerator = () => number;

export function createSeededRandom(seed: number): RandomGenerator {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

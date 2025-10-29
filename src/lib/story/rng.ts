import type { RNG } from "./types";

// Simple xorshift32 RNG for deterministic local randomness
export function createRNG(seed: number): RNG {
  let state = seed >>> 0;
  function nextU32() {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  }
  return {
    seed,
    next() {
      const u = nextU32();
      // map to (0,1)
      return (u + 1) / 4294967297; // 2^32+1 to avoid returning 1.0
    },
    int(min: number, max: number) {
      if (max < min) [min, max] = [max, min];
      const r = Math.floor(this.next() * (max - min + 1)) + min;
      return r;
    },
    pick<T>(arr: T[]): T {
      return arr[this.int(0, arr.length - 1)];
    },
  };
}

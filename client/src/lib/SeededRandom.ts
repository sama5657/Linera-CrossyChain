/**
 * Seeded Random Number Generator
 * 
 * Provides deterministic pseudo-random numbers based on a seed value.
 * Uses the Mulberry32 algorithm, which is simple, fast, and has good statistical properties.
 * 
 * This is critical for replay verification - the same seed will always produce
 * the same sequence of random numbers, allowing exact game state reproduction.
 */

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    // Ensure seed is a positive 32-bit integer
    this.seed = Math.abs(seed) >>> 0;
  }

  /**
   * Generate the next random number in the sequence
   * Returns a number between 0 and 1 (exclusive), similar to Math.random()
   */
  random(): number {
    // Mulberry32 algorithm
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /**
   * Generate a random integer between min (inclusive) and max (exclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  /**
   * Generate a random element from an array
   */
  randomElement<T>(array: T[]): T {
    return array[this.randomInt(0, array.length)];
  }

  /**
   * Generate a random boolean with optional probability
   * @param probability Probability of returning true (0-1), defaults to 0.5
   */
  randomBoolean(probability: number = 0.5): boolean {
    return this.random() < probability;
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   * Returns a new shuffled array, does not modify original
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Get current seed (for debugging/logging)
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Reset to a new seed
   */
  reset(newSeed: number) {
    this.seed = Math.abs(newSeed) >>> 0;
  }
}

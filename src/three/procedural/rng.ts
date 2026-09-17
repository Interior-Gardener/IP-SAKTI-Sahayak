/** Deterministic PRNG so a given plant always grows the same way. */
export function makeRng(seed: number) {
  let s = (seed >>> 0) || 1
  return {
    /** Uniform in [0, 1). */
    next() {
      // xorshift32 — fast, adequate for scattering leaves.
      s ^= s << 13
      s ^= s >>> 17
      s ^= s << 5
      return ((s >>> 0) % 100000) / 100000
    },
    /** Uniform in [min, max). */
    range(min: number, max: number) {
      return min + this.next() * (max - min)
    },
    /** Symmetric jitter in [-amount, amount]. */
    jitter(amount: number) {
      return (this.next() * 2 - 1) * amount
    },
  }
}

export type Rng = ReturnType<typeof makeRng>

/** Stable 32-bit hash of a string, used to seed a plant from its id. */
export function hashSeed(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

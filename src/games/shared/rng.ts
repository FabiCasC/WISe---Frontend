/**
 * Generador determinista (mulberry32) sembrado con el `seed` del contexto.
 * Dos partidas con la misma semilla producen exactamente la misma secuencia:
 * es lo que permite reproducir un fallo en QA, como pide el contrato.
 */
export interface Rng {
  /** [0, 1) */
  next: () => number
  /** Entero en [min, max] inclusive. */
  int: (min: number, max: number) => number
  /** Flotante en [min, max). */
  range: (min: number, max: number) => number
  pick: <T>(items: readonly T[]) => T
  chance: (p: number) => boolean
}

export function createRng(seed: string): Rng {
  // Hash FNV-1a del texto -> semilla de 32 bits.
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }

  let a = h >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const range = (min: number, max: number) => min + next() * (max - min)

  return {
    next,
    range,
    int: (min, max) => Math.floor(range(min, max + 1)),
    pick: (items) => items[Math.floor(next() * items.length)] as never,
    chance: (p) => next() < p,
  }
}

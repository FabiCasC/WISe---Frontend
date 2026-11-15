/**
 * GAME 4 · NASA Number Mission · Pure rules (no DOM, no Phaser).
 * Tested with Vitest. The scene only draws what these functions decide.
 *
 * RULES
 *  - Each level has 5 questions. Each question has ONE numeric answer.
 *  - The player guesses; the game says "higher" or "lower".
 *  - Attempts are limited, but always enough to win by halving the range.
 *  - Some questions accept a margin (tolerance), e.g. rounded measurements.
 *  - Practice mode: unlimited attempts, no score.
 */

export interface Source {
  label: string
  url: string
}

export interface Question {
  id: string
  clue: string
  /** Shown automatically after HINT_AFTER wrong guesses. */
  hint: string
  answer: number
  min: number
  max: number
  /** A guess within ±tolerance of the answer counts as correct. */
  tolerance: number
  /** How the answer is shown to the player, e.g. "Apollo 15". */
  answerText: string
  /** "Mission log": what is true, in our own words. */
  fact: string
  source: Source
}

export const HINT_AFTER = 2
export const DIRECT_HIT_BONUS = 50
export const BASE_POINTS = 100
export const MIN_POINTS = 20
/** Correct answers needed to seal a level's memory. Adjustable data. */
export const PASS_MARK = 3

/**
 * Attempts allowed. Halving the range each time always wins within this
 * number, so a player who reasons is never punished by the limit.
 */
export function attemptsFor(q: Pick<Question, 'min' | 'max' | 'tolerance'>): number {
  const options = (q.max - q.min + 1) / (2 * q.tolerance + 1)
  return Math.ceil(Math.log2(Math.max(options, 1))) + 1
}

export type Verdict = 'correct' | 'too-low' | 'too-high' | 'invalid'
export type Closeness = 'very-close' | 'warm' | 'far'

export interface GuessResult {
  verdict: Verdict
  /** Only meaningful when verdict is 'correct': was it the exact value? */
  exact: boolean
  /** Only meaningful when the guess was wrong. */
  closeness: Closeness | null
}

export function judgeGuess(q: Question, guess: number): GuessResult {
  if (!Number.isInteger(guess) || guess < q.min || guess > q.max) {
    return { verdict: 'invalid', exact: false, closeness: null }
  }
  const diff = guess - q.answer
  if (Math.abs(diff) <= q.tolerance) {
    return { verdict: 'correct', exact: diff === 0, closeness: null }
  }
  const ratio = Math.abs(diff) / (q.max - q.min)
  const closeness: Closeness = ratio <= 0.05 ? 'very-close' : ratio <= 0.15 ? 'warm' : 'far'
  return { verdict: diff > 0 ? 'too-high' : 'too-low', exact: false, closeness }
}

/** Points for a solved question. `used` counts the winning guess. */
export function pointsFor(total: number, used: number): number {
  const base = Math.max(MIN_POINTS, Math.round((BASE_POINTS * (total - used + 1)) / total))
  return used === 1 ? base + DIRECT_HIT_BONUS : base
}

export const maxPointsPerQuestion = BASE_POINTS + DIRECT_HIT_BONUS

export function levelPassed(solved: number): boolean {
  return solved >= PASS_MARK
}

export type Rank = 'Cadet' | 'Astronaut' | 'Mission Commander'

export function rankFor(score: number, questions: number): Rank {
  const ratio = score / (questions * maxPointsPerQuestion)
  return ratio >= 0.75 ? 'Mission Commander' : ratio >= 0.4 ? 'Astronaut' : 'Cadet'
}

/** Deterministic shuffle: the same seed always gives the same order. */
export function shuffledOrder<T>(items: readonly T[], seed: string): T[] {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let state = h >>> 0
  const rand = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

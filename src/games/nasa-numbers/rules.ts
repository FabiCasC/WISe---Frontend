/**
 * Find the Beacon (id nasa-numbers) · pure rules, no DOM.
 *
 * Level 1  Halving: a silent beacon hides at a whole number. Each probe says
 *          higher or lower and the range bar shrinks. Probes are limited.
 * Level 2  Margin of error: every sounding reads the true spot plus or minus
 *          a noise. The player marks an interval that must contain the truth.
 * Level 3  Echo to distance: a laser echo time becomes a distance, against a
 *          countdown. Distance = speed of light x time / 2 (there and back).
 *
 * What the game invents (not NASA data): the beacon positions, the noise and
 * the echo times of each round. The speed of light and the Moon are real.
 */
import { createRng, type Rng } from '../shared/rng'

export const LIGHT_KM_S = 299_792
export const ROUNDS = 5
export const PASS_MARK = 3

export type Level = 1 | 2 | 3

// ── Level 1 ──────────────────────────────────────────────────────────────
export interface HuntRound {
  min: number
  max: number
  secret: number
  /** Probes allowed: what halving needs, plus one spare. */
  allowed: number
}

const HUNT_SIZES = [64, 100, 200, 500, 1000]

/** Most probes halving can ever need for n numbers. */
export function halvingProbes(n: number): number {
  return Math.ceil(Math.log2(n + 1))
}

export function huntRounds(seed: string): HuntRound[] {
  const rng = createRng(seed)
  return HUNT_SIZES.map((n) => ({
    min: 1,
    max: n,
    secret: rng.int(1, n),
    allowed: halvingProbes(n) + 1,
  }))
}

export interface HuntState {
  lo: number
  hi: number
  probes: number
  found: boolean
}

export function newHunt(r: HuntRound): HuntState {
  return { lo: r.min, hi: r.max, probes: 0, found: false }
}

export interface ProbeResult {
  verdict: 'found' | 'higher' | 'lower' | 'invalid'
  /** The probe cut the remaining range so that at most 70% was left. */
  goodSplit: boolean
}

/** One probe. Mutates the state; the range only ever shrinks. */
export function probe(r: HuntRound, s: HuntState, guess: number): ProbeResult {
  if (!Number.isInteger(guess) || guess < s.lo || guess > s.hi) return { verdict: 'invalid', goodSplit: false }
  const size = s.hi - s.lo + 1
  s.probes += 1
  if (guess === r.secret) {
    s.found = true
    s.lo = s.hi = guess
    return { verdict: 'found', goodSplit: true }
  }
  const left = guess - s.lo
  const right = s.hi - guess
  const goodSplit = size <= 3 || Math.max(left, right) <= 0.7 * size
  if (guess < r.secret) {
    s.lo = guess + 1
    return { verdict: 'higher', goodSplit }
  }
  s.hi = guess - 1
  return { verdict: 'lower', goodSplit }
}

export function huntPoints(r: HuntRound, s: HuntState): number {
  if (!s.found) return 0
  const spare = r.allowed - s.probes
  return Math.max(20, 100 + spare * 15)
}

// ── Level 2 ──────────────────────────────────────────────────────────────
export interface NoiseRound {
  truth: number
  /** Each reading is the truth plus or minus up to this margin. */
  margin: number
  min: number
  max: number
  maxReadings: number
}

export function noiseRounds(seed: string): NoiseRound[] {
  const rng = createRng(seed + ':noise')
  const margins = [30, 30, 25, 20, 20]
  return margins.map((margin) => ({
    truth: rng.int(150, 850),
    margin,
    min: 0,
    max: 1000,
    maxReadings: 3,
  }))
}

export function reading(r: NoiseRound, rng: Rng): number {
  return Math.round(r.truth + (rng.next() * 2 - 1) * r.margin)
}

export interface MarkResult {
  /** The interval contains the true value. */
  contains: boolean
  /** ... and it is no wider than twice the margin (it says something). */
  tight: boolean
  correct: boolean
  width: number
}

export function judgeInterval(r: NoiseRound, lo: number, hi: number): MarkResult {
  const a = Math.min(lo, hi)
  const b = Math.max(lo, hi)
  const contains = r.truth >= a && r.truth <= b
  const width = b - a
  const tight = width <= 2 * r.margin
  return { contains, tight, correct: contains && tight, width }
}

/** The best an interval can be from the readings taken: their overlap. */
export function overlap(readings: number[], margin: number): [number, number] {
  return [Math.max(...readings) - margin, Math.min(...readings) + margin]
}

export function markPoints(m: MarkResult, r: NoiseRound): number {
  if (!m.correct) return 0
  return Math.round(60 + 60 * (1 - Math.min(1, m.width / (2 * r.margin))))
}

// ── Level 3 ──────────────────────────────────────────────────────────────
export interface EchoRound {
  /** Echo time in seconds (invented spread around the real ~2.5 s). */
  seconds: number
}

export const ECHO_TIME_S = 75

export function echoRounds(seed: string): EchoRound[] {
  const rng = createRng(seed + ':echo')
  return Array.from({ length: ROUNDS }, () => ({ seconds: Math.round(rng.range(2.3, 2.7) * 100) / 100 }))
}

/** Distance in thousands of km for an echo time. */
export function echoDistance(seconds: number): number {
  return (LIGHT_KM_S * seconds) / 2 / 1000
}

export interface EchoResult {
  correct: boolean
  /** The guess is about double the answer: the player forgot "there and back". */
  forgotHalf: boolean
  truth: number
}

export function judgeEcho(r: EchoRound, guess: number): EchoResult {
  const truth = echoDistance(r.seconds)
  const correct = Math.abs(guess - truth) <= truth * 0.03
  const forgotHalf = !correct && Math.abs(guess - truth * 2) <= truth * 2 * 0.03
  return { correct, forgotHalf, truth }
}

export function echoPoints(timeLeftS: number): number {
  return 80 + Math.round(Math.max(0, timeLeftS))
}

// ── Stars ────────────────────────────────────────────────────────────────
export interface Stars {
  concept: boolean
  efficiency: boolean
  speed: boolean
}

export function passed(solved: number): boolean {
  return solved >= PASS_MARK
}

export function stars(solved: number, efficient: boolean, fast: boolean): Stars {
  return { concept: passed(solved), efficiency: passed(solved) && efficient, speed: passed(solved) && fast }
}

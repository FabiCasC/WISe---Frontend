/**
 * PHOENIX ICE DIG - pure rules (no DOM, tested with Vitest).
 * -------------------------------------------------------------------------
 * Real facts behind the mechanic (NASA Science "Phoenix", NASA History
 * "15 Years Ago: Phoenix Mars Lander Launches", NASA NSSDCA, Photojournal
 * PIA12338):
 *   - Phoenix landed in the Martian arctic on 25 May 2008 and dug 12
 *     trenches with its robotic arm.
 *   - Three whitish clumps in a trench vanished over four days (sol 20 to
 *     sol 24): water ice sublimating, turning straight from solid to gas.
 *   - The first sample in the TEGA oven (one of eight ovens) showed no water,
 *     most likely because it had sat in the open air for several days.
 *     Later samples confirmed water ice (31 July 2008).
 *   - As summer ended there was less sunlight for the solar arrays, heaters
 *     were turned off one by one, and the last signal came on 2 November
 *     2008. In winter carbon dioxide frost covered the lander; images from
 *     orbit in 2010 showed damage, most likely from the frost's weight
 *     breaking at least one solar panel.
 *
 * Game rules: each column is a spot the arm can dig. "Energy" counts arm
 * actions per sol. Ice exposed for 2 sols or more has sublimated away from
 * the surface. Depths, budgets and the salt look-alikes are game choices.
 */

export type Chunk = 'none' | 'ice' | 'salt'
export type Label = '?' | 'ice' | 'salt'

/** Sols for an exposed ice chunk to vanish completely (real: about 4). */
export const VANISH_SOLS = 4
/** Exposed ice older than this (in sols) has sublimated from the surface. */
export const FRESH_SOLS = 1

export interface Column {
  /** Scoops of soil above the ice (level 2-3) or above the chunk (level 1). */
  depth: number
  /** Level 1 only: what bright thing sits under the soil. */
  chunk: Chunk
  dug: number
  /** Sol when ice was last exposed, or null. */
  exposedSol: number | null
  label: Label
}

export interface LevelSpec {
  name: string
  kind: 'observe' | 'sample'
  columns: { depth: number; chunk?: Chunk }[]
  /** Arm actions per sol, by sol (index 0 = sol 1). Past the end the lander goes silent. */
  budget: number[]
  ovens: number
  readingsNeeded: number
  intro: string
  goal: string
}

export const LEVELS: Record<1 | 2 | 3, LevelSpec> = {
  1: {
    name: 'Bright chunks',
    kind: 'observe',
    columns: [
      { depth: 1, chunk: 'ice' },
      { depth: 1, chunk: 'salt' },
      { depth: 1, chunk: 'none' },
      { depth: 1, chunk: 'ice' },
      { depth: 1, chunk: 'salt' },
    ],
    budget: [5, 2, 2, 2, 2, 2],
    ovens: 0,
    readingsNeeded: 0,
    intro:
      'Dig the five spots in front of Phoenix. Some hide bright chunks: water ice or salt, and they look the same! Wait a few sols and watch. Then tap each chunk to label it Ice or Salt and send your report.',
    goal: 'Label every bright chunk as ice or salt',
  },
  2: {
    name: 'A fresh sample',
    kind: 'sample',
    columns: [{ depth: 3 }, { depth: 2 }, { depth: 4 }, { depth: 2 }, { depth: 3 }, { depth: 5 }],
    budget: [4, 4, 4, 4],
    ovens: 3,
    readingsNeeded: 1,
    intro:
      'Dig down to the ice and put a scoop in the oven to find water. But exposed ice turns into gas: a sample that sat in the open for 2 sols has no water left. Phoenix’s first sample failed exactly like that.',
    goal: 'Get 1 water reading from fresh ice (3 ovens)',
  },
  3: {
    name: 'Before the winter',
    kind: 'sample',
    columns: [{ depth: 3 }, { depth: 4 }, { depth: 2 }, { depth: 5 }, { depth: 3 }, { depth: 4 }],
    budget: [6, 5, 4, 4, 3, 2, 1],
    ovens: 4,
    readingsNeeded: 3,
    intro:
      'Summer is ending. Each sol the Sun is lower and the solar panels give less energy, until Phoenix goes silent. Get 3 water readings before that. Do not waste the sunny sols!',
    goal: '3 water readings before the power runs out',
  },
}

export interface State {
  sol: number
  energy: number
  columns: Column[]
  ovensLeft: number
  readings: number
  /** Oven results, in order. */
  ovenLog: boolean[]
  silent: boolean
}

export function createState(spec: LevelSpec): State {
  return {
    sol: 1,
    energy: spec.budget[0],
    columns: spec.columns.map((c) => ({ depth: c.depth, chunk: c.chunk ?? 'none', dug: 0, exposedSol: null, label: '?' })),
    ovensLeft: spec.ovens,
    readings: 0,
    ovenLog: [],
    silent: false,
  }
}

function withColumn(s: State, i: number, col: Column): Column[] {
  return s.columns.map((c, k) => (k === i ? col : c))
}

export function iceExposed(c: Column): boolean {
  return c.dug >= c.depth && c.exposedSol !== null
}

/** 0..1 how much of a level 1 chunk is still there. Salt never fades. */
export function chunkSize(s: State, c: Column): number {
  if (c.dug < c.depth || c.chunk === 'none') return 0
  if (c.chunk === 'salt') return 1
  const age = s.sol - (c.exposedSol ?? s.sol)
  return Math.max(0, 1 - age / VANISH_SOLS)
}

export function isFresh(s: State, c: Column): boolean {
  return iceExposed(c) && s.sol - (c.exposedSol as number) <= FRESH_SOLS
}

export interface ActionResult {
  state: State
  ok: boolean
  message: string
}

/** One scoop: removes soil, or scrapes the ice to expose it fresh. */
export function dig(spec: LevelSpec, s: State, i: number, infinite = false): ActionResult {
  if (s.silent) return { state: s, ok: false, message: 'Phoenix is silent.' }
  if (!infinite && s.energy <= 0) return { state: s, ok: false, message: 'No energy left this sol. Wait for the next sol.' }
  const c = s.columns[i]
  if (spec.kind === 'observe' && c.dug >= c.depth) return { state: s, ok: false, message: 'Already dug here.' }
  const energy = infinite ? s.energy : s.energy - 1
  if (c.dug < c.depth) {
    const dug = c.dug + 1
    const hit = dug >= c.depth
    const col: Column = { ...c, dug, exposedSol: hit ? s.sol : c.exposedSol }
    const message = hit
      ? spec.kind === 'observe'
        ? c.chunk === 'none'
          ? 'Just soil here.'
          : 'A bright chunk!'
        : 'You reached the ice!'
      : 'Scoop of soil'
    return { state: { ...s, energy, columns: withColumn(s, i, col) }, ok: true, message }
  }
  // Scraping the ice table exposes fresh ice again.
  const col: Column = { ...c, exposedSol: s.sol }
  return { state: { ...s, energy, columns: withColumn(s, i, col) }, ok: true, message: 'Fresh ice scraped' }
}

/** Put a scoop from column i into an oven. Water only from fresh ice. */
export function deliver(spec: LevelSpec, s: State, i: number, infinite = false): ActionResult {
  if (s.silent) return { state: s, ok: false, message: 'Phoenix is silent.' }
  if (spec.kind !== 'sample') return { state: s, ok: false, message: 'No oven on this level.' }
  if (!infinite && s.energy <= 0) return { state: s, ok: false, message: 'No energy left this sol. Wait for the next sol.' }
  if (s.ovensLeft <= 0 && !infinite) return { state: s, ok: false, message: 'All ovens are used.' }
  const c = s.columns[i]
  if (c.dug === 0) return { state: s, ok: false, message: 'Dig here first.' }
  const water = isFresh(s, c)
  // The scoop takes the exposed ice with it.
  const col: Column = { ...c, exposedSol: null }
  const state: State = {
    ...s,
    energy: infinite ? s.energy : s.energy - 1,
    ovensLeft: infinite ? s.ovensLeft : s.ovensLeft - 1,
    readings: s.readings + (water ? 1 : 0),
    ovenLog: [...s.ovenLog, water],
    columns: withColumn(s, i, col),
  }
  const message = water
    ? 'Water found! The oven measured water from fresh ice.'
    : c.dug < c.depth
      ? 'No water: that was only soil.'
      : 'No water: the ice in that scoop had already turned to gas.'
  return { state, ok: water, message }
}

/** Advance to the next sol. Past the last sunny sol the lander goes silent. */
export function nextSol(spec: LevelSpec, s: State, infinite = false): State {
  const sol = s.sol + 1
  const budget = infinite ? spec.budget[0] : spec.budget[sol - 1]
  if (budget === undefined || budget <= 0) return { ...s, sol, energy: 0, silent: true }
  return { ...s, sol, energy: budget }
}

export function label(s: State, i: number): State {
  const c = s.columns[i]
  if (c.chunk === 'none' || c.dug < c.depth) return s
  const next: Label = c.label === '?' ? 'ice' : c.label === 'ice' ? 'salt' : '?'
  return { ...s, columns: withColumn(s, i, { ...c, label: next }) }
}

/** Level 1: chunks the player must label (dug and bright). */
export function chunksToLabel(s: State): number[] {
  return s.columns.map((c, i) => (c.chunk !== 'none' && c.dug >= c.depth ? i : -1)).filter((i) => i >= 0)
}

export function allChunksDug(s: State): boolean {
  return s.columns.every((c) => c.dug >= c.depth)
}

export function labelResults(s: State): { index: number; correct: boolean }[] {
  return chunksToLabel(s).map((i) => ({ index: i, correct: s.columns[i].label === s.columns[i].chunk }))
}

export type Outcome = 'playing' | 'won' | 'lost'

export function outcome(spec: LevelSpec, s: State): Outcome {
  if (spec.kind === 'observe') return 'playing'
  if (s.readings >= spec.readingsNeeded) return 'won'
  if (s.silent) return 'lost'
  if (s.ovensLeft <= 0) return 'lost'
  if (s.sol >= spec.budget.length && s.energy <= 0) return 'lost'
  return 'playing'
}

export function conceptFor(level: 1 | 2 | 3): string {
  return level === 1 ? 'hielo-sublima' : level === 2 ? 'muestra-fresca' : 'invierno-sin-energia'
}

export function scoreRun(spec: LevelSpec, s: State): number {
  return Math.round(400 + s.ovensLeft * 120 + Math.max(0, spec.budget.length - s.sol) * 60)
}

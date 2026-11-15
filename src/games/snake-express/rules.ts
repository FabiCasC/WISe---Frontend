/**
 * LUNAR EXPRESS - pure rules (no DOM, tested with Vitest).
 * -------------------------------------------------------------------------
 * A snake-style moonwalk: the head is the explorer, the tail is everything
 * you carry. The science is the mechanic:
 *  1. On a MARE (dark lava plain, like Apollo 11's Sea of Tranquility) the
 *     rock of the place is dark basalt: cooled lava.
 *  2. In the HIGHLANDS the oldest crust is the bright rock. Same controls,
 *     opposite answer: you must recognise rocks by what they are.
 *  3. Science packages are left on purpose: you set them down away from the
 *     lunar module and they keep working after you leave (Apollo's
 *     seismometers sent data until 1977).
 * Facts: NASA Science "Moon composition" (bright highlands are older crust,
 * dark maria are cooled lava); NSSDCA 1969-059C and 1971-063C (experiments
 * deployed and left on the surface; ALSEP shut down in 1977).
 */

export const COLS = 20
export const ROWS = 14

export interface Cell {
  x: number
  y: number
}

export type Dir = 'up' | 'down' | 'left' | 'right'
export type RockKind = 'dark' | 'bright'

export interface Rock extends Cell {
  kind: RockKind
}

/** What a tail segment is. */
export type Cargo = 'dark' | 'bright' | 'experiment'

export interface LevelSpec {
  name: string
  /** Rock the mission needs. */
  want: RockKind | 'any'
  need: number
  /** Experiment packages to deploy (level 3). */
  experiments: number
  /** Minimum distance (cells) from the LM to deploy an experiment. */
  deployMin: number
  oxygen: number
  stepMs: number
  /** How many rocks of each kind lie on the ground at once. */
  mix: Record<RockKind, number>
  intro: string
}

export const LEVELS: Record<1 | 2 | 3, LevelSpec> = {
  1: {
    name: 'Sea of Tranquility',
    want: 'dark',
    need: 5,
    experiments: 0,
    deployMin: 0,
    oxygen: 90,
    stepMs: 210,
    mix: { dark: 3, bright: 3 },
    intro:
      'You landed on a mare: a dark plain of cooled lava. Bring back 5 rocks OF THIS PLACE, then return to the lunar module. Dark rocks are basalt from the lava; bright ones are pieces of highland crust thrown here by impacts.',
  },
  2: {
    name: 'The highlands',
    want: 'bright',
    need: 5,
    experiments: 0,
    deployMin: 0,
    oxygen: 90,
    stepMs: 190,
    mix: { dark: 3, bright: 3 },
    intro:
      'Now you are in the bright highlands, the oldest crust on the Moon. Scientists want the oldest rock. Bring back 5 of them and return to the lunar module.',
  },
  3: {
    name: 'Leave science behind',
    want: 'any',
    need: 3,
    experiments: 3,
    deployMin: 5,
    oxygen: 120,
    stepMs: 180,
    mix: { dark: 2, bright: 2 },
    intro:
      'You carry 3 science packages (gold). They will stay on the Moon and keep sending data after you leave. Press Space to set one down at least 5 steps from the lunar module, then bring back 3 rocks and return.',
  },
}

/** The lunar module occupies a 2 x 2 block in the middle. */
export const LM: Cell[] = [
  { x: 9, y: 6 },
  { x: 10, y: 6 },
  { x: 9, y: 7 },
  { x: 10, y: 7 },
]

export const DELTA: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y
export const onLM = (c: Cell) => LM.some((l) => same(l, c))

/** Steps from a cell to the nearest LM cell (Manhattan). */
export function distToLM(c: Cell): number {
  return Math.min(...LM.map((l) => Math.abs(l.x - c.x) + Math.abs(l.y - c.y)))
}

export interface State {
  body: Cell[]
  cargo: Cargo[]
  dir: Dir
  queued: Dir | null
  rocks: Rock[]
  craters: Cell[]
  deployed: Cell[]
  collected: number
  oxygen: number
  phase: 'playing' | 'won' | 'lost'
  reason: string
}

export type Event =
  | { type: 'rock'; kind: RockKind; good: boolean }
  | { type: 'deploy'; ok: boolean; at: Cell }
  | { type: 'notReady' }
  | { type: 'won' }
  | { type: 'lost'; reason: string }

export function opposite(a: Dir, b: Dir) {
  return DELTA[a].x + DELTA[b].x === 0 && DELTA[a].y + DELTA[b].y === 0
}

const CRATERS: Cell[] = [
  { x: 4, y: 3 },
  { x: 15, y: 3 },
  { x: 4, y: 10 },
  { x: 15, y: 10 },
  { x: 2, y: 7 },
  { x: 17, y: 7 },
]

export function initialState(spec: LevelSpec, rand: () => number): State {
  const body = [
    { x: 9, y: 9 },
    { x: 9, y: 10 },
    { x: 9, y: 11 },
  ]
  const cargo: Cargo[] = Array.from({ length: spec.experiments }, () => 'experiment')
  // The explorer's own body is the first 3 cells; extra cargo grows the tail.
  for (let i = 0; i < cargo.length; i++) body.push({ x: 9, y: 11 })
  const s: State = {
    body,
    cargo,
    dir: 'up',
    queued: null,
    rocks: [],
    craters: CRATERS.map((c) => ({ ...c })),
    deployed: [],
    collected: 0,
    oxygen: spec.oxygen,
    phase: 'playing',
    reason: '',
  }
  refillRocks(s, spec, rand)
  return s
}

function occupied(s: State, c: Cell) {
  return (
    s.body.some((b) => same(b, c)) ||
    s.rocks.some((r) => same(r, c)) ||
    s.craters.some((k) => same(k, c)) ||
    s.deployed.some((d) => same(d, c)) ||
    onLM(c)
  )
}

export function refillRocks(s: State, spec: LevelSpec, rand: () => number) {
  for (const kind of ['dark', 'bright'] as RockKind[]) {
    while (s.rocks.filter((r) => r.kind === kind).length < spec.mix[kind]) {
      let tries = 0
      while (tries++ < 200) {
        const c = { x: 1 + Math.floor(rand() * (COLS - 2)), y: 1 + Math.floor(rand() * (ROWS - 2)) }
        // Not right next to the LM, so you have to go out and explore.
        if (!occupied(s, c) && distToLM(c) >= 2) {
          s.rocks.push({ ...c, kind })
          break
        }
      }
      if (tries >= 200) break
    }
  }
}

export function goalMet(s: State, spec: LevelSpec) {
  return s.collected >= spec.need && s.deployed.length >= spec.experiments
}

export function turn(s: State, d: Dir) {
  if (!opposite(d, s.dir)) s.queued = d
}

/** Sets down the experiment package carried right behind the head. */
export function deploy(s: State, spec: LevelSpec): Event | null {
  if (s.phase !== 'playing') return null
  const idx = s.cargo.indexOf('experiment')
  if (idx < 0) return null
  const head = s.body[0]
  const at = s.body[1] ?? head
  if (distToLM(at) < spec.deployMin) return { type: 'deploy', ok: false, at }
  if (s.deployed.some((d) => Math.abs(d.x - at.x) + Math.abs(d.y - at.y) < 3)) return { type: 'deploy', ok: false, at }
  s.cargo.splice(idx, 1)
  s.body.pop()
  s.deployed.push({ ...at })
  return { type: 'deploy', ok: true, at }
}

/** One grid step. Returns what happened. */
export function step(s: State, spec: LevelSpec, rand: () => number): Event[] {
  if (s.phase !== 'playing') return []
  if (s.queued) {
    s.dir = s.queued
    s.queued = null
  }
  const d = DELTA[s.dir]
  const head = { x: s.body[0].x + d.x, y: s.body[0].y + d.y }
  const events: Event[] = []

  const lose = (reason: string) => {
    s.phase = 'lost'
    s.reason = reason
    events.push({ type: 'lost', reason })
    return events
  }
  if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) return lose('You walked off the map, far from the lunar module.')
  if (s.craters.some((k) => same(k, head))) return lose('You fell into a crater.')
  if (s.deployed.some((k) => same(k, head))) return lose('You tripped over an experiment you had set up.')
  // The tail end moves away this step, so it is safe to step there.
  if (s.body.slice(0, -1).some((b) => same(b, head))) return lose('You tangled up in your own cable and samples.')

  if (onLM(head)) {
    if (goalMet(s, spec)) {
      s.body.unshift(head)
      s.body.pop()
      s.phase = 'won'
      events.push({ type: 'won' })
      return events
    }
    events.push({ type: 'notReady' })
  }

  s.body.unshift(head)
  const rockIdx = s.rocks.findIndex((r) => same(r, head))
  if (rockIdx >= 0) {
    const rock = s.rocks[rockIdx]
    s.rocks.splice(rockIdx, 1)
    const good = spec.want === 'any' || rock.kind === spec.want
    s.cargo.push(rock.kind)
    if (good) s.collected += 1
    events.push({ type: 'rock', kind: rock.kind, good })
    refillRocks(s, spec, rand)
    // The tail grows: you carry the rock.
  } else {
    s.body.pop()
  }
  return events
}

/** Oxygen runs down in seconds. */
export function breathe(s: State, dt: number): Event | null {
  if (s.phase !== 'playing') return null
  s.oxygen -= dt
  if (s.oxygen <= 0) {
    s.oxygen = 0
    s.phase = 'lost'
    s.reason = 'Your backpack ran low on oxygen before you were back in the lunar module.'
    return { type: 'lost', reason: s.reason }
  }
  return null
}

export function conceptFor(level: 1 | 2 | 3): string {
  return level === 1 ? 'mares-son-lava' : level === 2 ? 'tierras-altas-corteza-antigua' : 'experimentos-se-quedan'
}

export function scoreWalk(s: State, _spec: LevelSpec, wrongRocks: number): number {
  return Math.max(100, Math.round(500 + s.oxygen * 5 - wrongRocks * 60 + s.deployed.length * 50))
}

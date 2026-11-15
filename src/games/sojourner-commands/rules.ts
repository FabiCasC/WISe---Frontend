/**
 * SOJOURNER'S PLAN - pure rules (no DOM, tested with Vitest).
 * -------------------------------------------------------------------------
 * Real facts behind the mechanic (NASA NSSDCA "Mars Pathfinder Rover",
 * NASA Photojournal PIA00629 / PIA00906 / PIA01409):
 *   - Sojourner was driven by an operator on Earth using images from the
 *     rover and the lander. The radio delay was 10 to 15 minutes, so the
 *     rover needed some autonomy: a hazard-avoidance system.
 *   - All rover communications went through the lander.
 *   - Its alpha-proton-X-ray spectrometer (APXS) sat on a deployment arm at
 *     the BACK of the rover (seen from the rear camera against the rock
 *     Wedge on sol 37). Barnacle Bill was the first rock it measured, Yogi
 *     (about 5 m northwest of the lander) the second.
 *
 * Game rules: a grid of 1 m cells. The player queues commands, sends them
 * once per sol and then can only watch: the plan runs on Mars minutes
 * later. Sols and queue size are game limits.
 */

export type Dir = 0 | 1 | 2 | 3 // N E S W
export type Cmd = 'F' | 'B' | 'L' | 'R' | 'A'

export const DX = [0, 1, 0, -1]
export const DY = [-1, 0, 1, 0]
export const ROCK_NAMES: Record<string, string> = { B: 'Barnacle Bill', Y: 'Yogi', W: 'Wedge' }

export interface LevelSpec {
  name: string
  map: string[]
  startDir: Dir
  /** Goal: reach the 'G' cell, or measure this rock with the APXS. */
  goal: { kind: 'reach' } | { kind: 'measure'; rock: 'B' | 'Y' | 'W' }
  sols: number
  maxQueue: number
  delayMin: number
  /** Cells farther than this from the lander are unknown until the rover sees them. */
  landerSight: number | null
  intro: string
  goalText: string
}

/*
 * Map legend: '.' sand · '#' boulder · 'L' lander · 'S' rover start (sand)
 * 'G' goal cell (sand) · 'B' 'Y' 'W' named rocks · 'h' small rock hidden
 * from the lander camera (blocks the rover).
 */
export const LEVELS: Record<1 | 2 | 3, LevelSpec> = {
  1: {
    name: 'Ten minutes away',
    map: [
      '.........',
      '..#......',
      '.BG.##...',
      '..#.LL...',
      '..#.LL...',
      '....S....',
      '.........',
    ],
    startDir: 2,
    goal: { kind: 'reach' },
    sols: 2,
    maxQueue: 12,
    delayMin: 11,
    landerSight: null,
    intro:
      'Mars is so far away that your radio commands take about 11 minutes to arrive. You cannot steer live! Plan all the moves, send them, and watch. Drive Sojourner to the spot next to the rock Barnacle Bill. You have 2 sols (Martian days).',
    goalText: 'Reach the yellow spot next to Barnacle Bill',
  },
  2: {
    name: 'Back up to Yogi',
    map: [
      '.........',
      '.Y.......',
      '...#.....',
      '..#.LL...',
      '....LL...',
      '....S..#.',
      '.........',
    ],
    startDir: 2,
    goal: { kind: 'measure', rock: 'Y' },
    sols: 3,
    maxQueue: 12,
    delayMin: 13,
    landerSight: null,
    intro:
      'Sojourner’s chemistry tool, the APXS, is on the BACK of the rover. To measure the rock Yogi you must stop right next to it facing away, so the tool touches the rock. Then add the APXS command.',
    goalText: 'Measure Yogi with the APXS (it is on the back)',
  },
  3: {
    name: 'The rover stops itself',
    map: [
      '.......W.',
      '...#..h..',
      '.......hh',
      '.h..LL.#.',
      '....LL...',
      '....S....',
      '.........',
    ],
    startDir: 2,
    goal: { kind: 'measure', rock: 'W' },
    sols: 4,
    maxQueue: 12,
    delayMin: 15,
    landerSight: 2.6,
    intro:
      'The lander camera cannot see small rocks far away. If Sojourner finds a hidden rock in its path, its hazard sensors stop it by itself, and you plan again the next sol. Measure the rock Wedge.',
    goalText: 'Measure Wedge · hidden rocks stop the rover',
  },
}

export interface Pose {
  x: number
  y: number
  dir: Dir
}

export interface Grid {
  w: number
  h: number
  cells: string[][]
  start: Pose
  lander: { x: number; y: number }
}

export function parseLevel(spec: LevelSpec): Grid {
  const cells = spec.map.map((row) => row.split(''))
  let start: Pose = { x: 0, y: 0, dir: spec.startDir }
  let lx = 0
  let ly = 0
  let n = 0
  cells.forEach((row, y) =>
    row.forEach((ch, x) => {
      if (ch === 'S') start = { x, y, dir: spec.startDir }
      if (ch === 'L') {
        lx += x
        ly += y
        n++
      }
    })
  )
  return { w: cells[0].length, h: cells.length, cells, start, lander: { x: lx / n, y: ly / n } }
}

export function cellAt(g: Grid, x: number, y: number): string {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return '#'
  return g.cells[y][x]
}

export function passable(ch: string): boolean {
  return ch === '.' || ch === 'S' || ch === 'G'
}

/** Can the lander camera see this cell? (Level 3 hides far cells.) */
export function landerSees(spec: LevelSpec, g: Grid, x: number, y: number): boolean {
  if (spec.landerSight === null) return true
  return Math.hypot(x - g.lander.x, y - g.lander.y) <= spec.landerSight
}

export function turn(d: Dir, by: 1 | -1): Dir {
  return (((d + by) % 4) + 4) % 4 as Dir
}

export interface StepLog {
  pose: Pose
  cmd: Cmd
  /** What happened: moved, turned, blocked, measured, nothing to measure. */
  result: 'moved' | 'turned' | 'blocked' | 'hazard' | 'measured' | 'missed'
  rock?: string
}

export interface RunResult {
  steps: StepLog[]
  end: Pose
  stopped: boolean
  measured: string | null
  /** Cells the rover saw while driving. */
  seen: string[]
}

/** The cell behind the rover (where the APXS points). */
export function behind(p: Pose): { x: number; y: number } {
  return { x: p.x - DX[p.dir], y: p.y - DY[p.dir] }
}

/** Runs a queued plan on Mars. Stops by itself in front of any obstacle. */
export function runPlan(g: Grid, start: Pose, plan: Cmd[]): RunResult {
  let p = { ...start }
  const steps: StepLog[] = []
  const seen = new Set<string>()
  const look = (q: Pose) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) seen.add(q.x + dx + ',' + (q.y + dy))
  }
  look(p)
  let measured: string | null = null
  for (const cmd of plan) {
    if (cmd === 'L' || cmd === 'R') {
      p = { ...p, dir: turn(p.dir, cmd === 'R' ? 1 : -1) }
      steps.push({ pose: p, cmd, result: 'turned' })
      continue
    }
    if (cmd === 'A') {
      const b = behind(p)
      const ch = cellAt(g, b.x, b.y)
      if (ROCK_NAMES[ch]) {
        measured = measured ?? ch
        steps.push({ pose: p, cmd, result: 'measured', rock: ch })
      } else steps.push({ pose: p, cmd, result: 'missed' })
      continue
    }
    const sign = cmd === 'F' ? 1 : -1
    const nx = p.x + DX[p.dir] * sign
    const ny = p.y + DY[p.dir] * sign
    const ch = cellAt(g, nx, ny)
    if (!passable(ch)) {
      // Hazard avoidance: the rover refuses the move and waits for Earth.
      steps.push({ pose: p, cmd, result: ch === 'h' ? 'hazard' : 'blocked' })
      seen.add(nx + ',' + ny)
      return { steps, end: p, stopped: true, measured, seen: [...seen] }
    }
    p = { ...p, x: nx, y: ny }
    look(p)
    steps.push({ pose: p, cmd, result: 'moved' })
  }
  return { steps, end: p, stopped: false, measured, seen: [...seen] }
}

export function goalReached(spec: LevelSpec, g: Grid, end: Pose, measured: string | null): boolean {
  if (spec.goal.kind === 'reach') return cellAt(g, end.x, end.y) === 'G'
  return measured === spec.goal.rock
}

export function conceptFor(level: 1 | 2 | 3): string {
  return level === 1 ? 'retraso-de-senal' : level === 2 ? 'apxs-va-detras' : 'autonomia-evita-peligros'
}

export function scorePlan(solsUsed: number, sols: number, commands: number): number {
  return Math.max(100, Math.round(400 + (sols - solsUsed) * 200 + Math.max(0, 40 - commands) * 5))
}

/** Round trip shown on screen: command up + pictures back. */
export function roundTripMin(spec: LevelSpec): number {
  return spec.delayMin * 2
}

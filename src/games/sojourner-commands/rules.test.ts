import { describe, expect, it } from 'vitest'
import {
  LEVELS,
  ROCK_NAMES,
  behind,
  cellAt,
  goalReached,
  landerSees,
  parseLevel,
  passable,
  runPlan,
  turn,
  type Cmd,
  type Grid,
  type LevelSpec,
  type Pose,
} from './rules'

/** Shortest plan on a map where `known(x,y)` says what the planner believes is there. */
function solve(spec: LevelSpec, _g: Grid, start: Pose, known: (x: number, y: number) => string): Cmd[] | null {
  const key = (p: Pose) => p.x + ',' + p.y + ',' + p.dir
  const done = (p: Pose) => {
    if (spec.goal.kind === 'reach') return known(p.x, p.y) === 'G'
    const b = behind(p)
    return known(b.x, b.y) === spec.goal.rock
  }
  const queue: { p: Pose; plan: Cmd[] }[] = [{ p: start, plan: [] }]
  const seen = new Set([key(start)])
  while (queue.length) {
    const { p, plan } = queue.shift()!
    if (done(p)) return spec.goal.kind === 'measure' ? [...plan, 'A'] : plan
    const moves: [Cmd, Pose][] = [
      ['F', { ...p, x: p.x + [0, 1, 0, -1][p.dir], y: p.y + [-1, 0, 1, 0][p.dir] }],
      ['B', { ...p, x: p.x - [0, 1, 0, -1][p.dir], y: p.y - [-1, 0, 1, 0][p.dir] }],
      ['L', { ...p, dir: turn(p.dir, -1) }],
      ['R', { ...p, dir: turn(p.dir, 1) }],
    ]
    for (const [cmd, q] of moves) {
      if ((cmd === 'F' || cmd === 'B') && !passable(known(q.x, q.y))) continue
      if (seen.has(key(q))) continue
      seen.add(key(q))
      queue.push({ p: q, plan: [...plan, cmd] })
    }
  }
  return null
}

/** A player who plans the best they can with what they know, one send per sol. */
function playLevel(spec: LevelSpec) {
  const g = parseLevel(spec)
  const seen = new Set<string>()
  const known = (x: number, y: number) => {
    const ch = cellAt(g, x, y)
    if (ch === 'h' && !landerSees(spec, g, x, y) && !seen.has(x + ',' + y)) return '.'
    return ch
  }
  let pose = g.start
  for (let sol = 1; sol <= spec.sols; sol++) {
    const plan = solve(spec, g, pose, known)
    if (!plan) return { won: false, sol }
    const run = runPlan(g, pose, plan.slice(0, spec.maxQueue))
    run.seen.forEach((s) => seen.add(s))
    pose = run.end
    if (goalReached(spec, g, run.end, run.measured)) return { won: true, sol }
  }
  return { won: false, sol: spec.sols }
}

describe('every level can be solved within its sols', () => {
  for (const lvl of [1, 2, 3] as const) {
    it('level ' + lvl, () => {
      const r = playLevel(LEVELS[lvl])
      expect(r.won).toBe(true)
    })
  }
})

describe('level 1: the delay forces you to plan ahead', () => {
  const spec = LEVELS[1]
  const g = parseLevel(spec)

  it('the best route needs more moves than one or two at a time can cover in 2 sols', () => {
    const plan = solve(spec, g, g.start, (x, y) => cellAt(g, x, y))!
    expect(plan.length).toBeGreaterThan(4)
    expect(plan.length).toBeLessThanOrEqual(spec.maxQueue * spec.sols)
  })

  it('sending a single move per sol does not get there', () => {
    let pose = g.start
    const plan = solve(spec, g, g.start, (x, y) => cellAt(g, x, y))!
    for (let sol = 0; sol < spec.sols; sol++) pose = runPlan(g, pose, [plan[sol]]).end
    expect(cellAt(g, pose.x, pose.y)).not.toBe('G')
  })

  it('a boulder in the way stops the rover safely instead of crashing', () => {
    const run = runPlan(g, { x: 2, y: 5, dir: 0 }, ['F', 'F', 'F'])
    expect(run.stopped).toBe(true)
    expect(run.steps[run.steps.length - 1].result).toBe('blocked')
  })
})

describe('level 2: the APXS is on the back of the rover', () => {
  const spec = LEVELS[2]
  const g = parseLevel(spec)

  it('facing the rock and measuring misses', () => {
    // Yogi is at (1,1). Standing at (2,1) facing west, the rock is in FRONT.
    const run = runPlan(g, { x: 2, y: 1, dir: 3 }, ['A'])
    expect(run.measured).toBeNull()
    expect(run.steps[0].result).toBe('missed')
  })

  it('backing up to the rock measures it', () => {
    const run = runPlan(g, { x: 2, y: 1, dir: 1 }, ['A'])
    expect(run.measured).toBe('Y')
    expect(ROCK_NAMES.Y).toBe('Yogi')
  })
})

describe('level 3: hazard avoidance', () => {
  const spec = LEVELS[3]
  const g = parseLevel(spec)

  it('some rocks are hidden from the lander camera', () => {
    let hidden = 0
    g.cells.forEach((row, y) => row.forEach((ch, x) => ch === 'h' && !landerSees(spec, g, x, y) && hidden++))
    expect(hidden).toBeGreaterThan(0)
  })

  it('a plan made from the lander image runs into a hidden rock and the rover stops itself', () => {
    const blind = (x: number, y: number) => {
      const ch = cellAt(g, x, y)
      return ch === 'h' && !landerSees(spec, g, x, y) ? '.' : ch
    }
    const plan = solve(spec, g, g.start, blind)!
    const run = runPlan(g, g.start, plan)
    expect(run.stopped).toBe(true)
    expect(run.steps[run.steps.length - 1].result).toBe('hazard')
    expect(run.measured).toBeNull()
  })
})

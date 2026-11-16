import { describe, expect, it } from 'vitest'
import {
  BREAK_WAGONS,
  LEVELS,
  breathe,
  stars,
  LM,
  deploy,
  distToLM,
  goalMet,
  initialState,
  same,
  step,
  turn,
  type Cell,
  type Dir,
  type State,
} from './rules'
import { createRng } from '../shared/rng'

const rng = () => createRng('test').next

/** Next direction toward a target, avoiding obvious hazards (simple bot). */
function toward(s: State, t: Cell): Dir {
  const h = s.body[0]
  const options: Dir[] = []
  if (t.x > h.x) options.push('right')
  if (t.x < h.x) options.push('left')
  if (t.y > h.y) options.push('down')
  if (t.y < h.y) options.push('up')
  options.push('up', 'left', 'down', 'right')
  const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const
  for (const o of options) {
    const n = { x: h.x + d[o][0], y: h.y + d[o][1] }
    const blocked =
      n.x < 0 || n.y < 0 || n.x >= 20 || n.y >= 14 ||
      s.craters.some((k) => same(k, n)) ||
      s.deployed.some((k) => same(k, n)) ||
      s.body.slice(0, -1).some((b) => same(b, n)) ||
      (!goalMet(s, spec(s)) && LM.some((l) => same(l, n)) && false)
    const reverse = (o === 'up' && s.dir === 'down') || (o === 'down' && s.dir === 'up') || (o === 'left' && s.dir === 'right') || (o === 'right' && s.dir === 'left')
    if (!blocked && !reverse) return o
  }
  return s.dir
}
let current = LEVELS[1]
const spec = (_: State) => current

function play(level: 1 | 2 | 3) {
  current = LEVELS[level]
  const r = rng()
  const s = initialState(current, r)
  const events = []
  for (let i = 0; i < 3000 && s.phase === 'playing'; i++) {
    let target: Cell
    if (s.collected < current.need) {
      const wanted = s.rocks.filter((k) => current.want === 'any' || k.kind === current.want)
      const h = s.body[0]
      wanted.sort((a, b) => Math.abs(a.x - h.x) + Math.abs(a.y - h.y) - (Math.abs(b.x - h.x) + Math.abs(b.y - h.y)))
      target = wanted[0]
    } else target = LM[0]
    if (current.experiments && s.cargo.includes('experiment') && distToLM(s.body[1]) >= current.deployMin) {
      const ev = deploy(s, current)
      if (ev) events.push(ev)
    }
    turn(s, toward(s, target))
    events.push(...step(s, current, r))
  }
  return { s, events }
}

describe('Lunar Express', () => {
  it('level 1 (mare): dark basalt counts, bright rock does not', () => {
    const { s, events } = play(1)
    expect(s.phase).toBe('won')
    expect(events.filter((e) => e.type === 'rock' && e.good).every((e) => e.type === 'rock' && e.kind === 'dark')).toBe(true)
  })

  it('level 2 (highlands): the same rule flips, bright is the old crust', () => {
    const { s, events } = play(2)
    expect(s.phase).toBe('won')
    expect(events.filter((e) => e.type === 'rock' && e.good).every((e) => e.type === 'rock' && e.kind === 'bright')).toBe(true)
  })

  it('level 3: experiments must be set away from the LM and stay behind', () => {
    const { s } = play(3)
    expect(s.phase).toBe('won')
    expect(s.deployed).toHaveLength(3)
    for (const d of s.deployed) expect(distToLM(d)).toBeGreaterThanOrEqual(5)
  })

  it('deploying next to the LM is refused', () => {
    current = LEVELS[3]
    const s = initialState(current, rng())
    s.body[1] = { x: 9, y: 8 }
    expect(deploy(s, current)).toMatchObject({ ok: false })
    expect(s.deployed).toHaveLength(0)
  })

  it('reaching the LM before the goal does not win', () => {
    current = LEVELS[1]
    const s = initialState(current, rng())
    s.rocks = []
    s.started = true
    const evs = step(s, current, rng()) // (9,9) -> (9,8)
    expect(evs).toEqual([])
    const evs2 = step(s, current, rng()) // -> (9,7): the LM
    expect(evs2).toContainEqual({ type: 'notReady' })
    expect(s.phase).toBe('playing')
  })

  it('turning back into yourself is ignored, running into your tail loses', () => {
    current = LEVELS[1]
    const s = initialState(current, rng())
    s.started = true
    turn(s, 'down')
    expect(s.queued).toBeNull()
  })

  it('the explorer stands still until the first key or tap, and the air does not run', () => {
    current = LEVELS[1]
    const s = initialState(current, rng())
    const head = { ...s.body[0] }
    for (let i = 0; i < 50; i++) {
      expect(step(s, current, rng())).toEqual([])
      expect(breathe(s, 5)).toBeNull()
    }
    expect(s.body[0]).toEqual(head)
    expect(s.oxygen).toBe(current.oxygen)
    turn(s, 'left') // the first input may even be "backwards": it only chooses the way
    step(s, current, rng())
    expect(s.body[0]).toEqual({ x: head.x - 1, y: head.y })
  })

  it('a wrong rock breaks wagons off the train, costs air and does not come aboard', () => {
    current = LEVELS[1]
    const s = initialState(current, rng())
    s.started = true
    s.rocks = [{ x: 9, y: 8, kind: 'dark' }]
    step(s, current, rng()) // takes the good rock: (9,9) -> (9,8)
    s.rocks.push({ x: 9, y: 4, kind: 'bright' })
    s.collected = 1
    s.cargo = ['dark', 'dark', 'dark']
    s.collected = 3
    s.body = [{ x: 9, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 7 }]
    s.dir = 'up'
    const air = s.oxygen
    const evs = step(s, current, rng())
    expect(evs).toContainEqual({ type: 'rock', kind: 'bright', good: false, lost: BREAK_WAGONS })
    expect(s.cargo).toEqual(['dark'])
    expect(s.collected).toBe(1)
    expect(s.oxygen).toBeLessThan(air)
  })

  it('a bot that walks at random almost never wins', () => {
    current = LEVELS[1]
    let wins = 0
    for (let i = 0; i < 100; i++) {
      const r = createRng('rnd' + i)
      const s = initialState(current, r.next)
      const dirs: Dir[] = ['up', 'down', 'left', 'right']
      for (let t = 0; t < 600 && s.phase === 'playing'; t++) {
        turn(s, r.pick(dirs))
        step(s, current, r.next)
        breathe(s, 0.2)
      }
      if (s.phase === 'won') wins++
    }
    expect(wins).toBeLessThanOrEqual(2)
  })

  it('stars: concept needs the win, efficiency no wrong rocks, speed air left', () => {
    current = LEVELS[1]
    const s = initialState(current, rng())
    s.oxygen = current.oxygen
    expect(stars(true, 0, current, s)).toEqual({ concept: true, efficiency: true, speed: true })
    expect(stars(true, 2, current, s).efficiency).toBe(false)
    expect(stars(false, 0, current, s).concept).toBe(false)
  })
})

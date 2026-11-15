import { describe, expect, it } from 'vitest'
import {
  LEVELS,
  VANISH_SOLS,
  allChunksDug,
  chunkSize,
  createState,
  deliver,
  dig,
  label,
  labelResults,
  nextSol,
  outcome,
  type LevelSpec,
  type State,
} from './rules'

/** Digs column i down to the ice, waiting for new sols when energy runs out. */
function digToIce(spec: LevelSpec, s: State, i: number): State {
  let st = s
  while (st.columns[i].dug < st.columns[i].depth) {
    if (st.energy <= 0) st = nextSol(spec, st)
    if (st.silent) return st
    st = dig(spec, st, i).state
  }
  return st
}

describe('level 1: ice vanishes, salt stays', () => {
  const spec = LEVELS[1]

  it('ice shrinks each sol and is gone after about 4 sols; salt does not change', () => {
    let s = createState(spec)
    for (let i = 0; i < 5; i++) s = dig(spec, s, i).state
    expect(allChunksDug(s)).toBe(true)
    const ice = s.columns[0]
    const salt = s.columns[1]
    expect(chunkSize(s, ice)).toBe(1)
    expect(chunkSize(s, salt)).toBe(1)
    s = nextSol(spec, s)
    s = nextSol(spec, s)
    expect(chunkSize(s, s.columns[0])).toBeCloseTo(0.5)
    expect(chunkSize(s, s.columns[1])).toBe(1)
    for (let k = 2; k < VANISH_SOLS; k++) s = nextSol(spec, s)
    expect(chunkSize(s, s.columns[0])).toBe(0)
    expect(chunkSize(s, s.columns[1])).toBe(1)
  })

  it('a patient observer labels everything right', () => {
    let s = createState(spec)
    for (let i = 0; i < 5; i++) s = dig(spec, s, i).state
    s = nextSol(spec, s)
    s = nextSol(spec, s)
    // Label by what you see: shrinking = ice, unchanged = salt.
    s.columns.forEach((c, i) => {
      if (c.chunk === 'none') return
      const shrank = c.chunk === 'ice' // what the shrinking chunk shows on screen
      s = label(s, i) // ? -> ice
      if (!shrank) s = label(s, i) // ice -> salt
    })
    expect(labelResults(s).every((r) => r.correct)).toBe(true)
  })

  it('the dug spot with only soil needs no label', () => {
    let s = createState(spec)
    for (let i = 0; i < 5; i++) s = dig(spec, s, i).state
    expect(labelResults(s).length).toBe(4)
  })
})

describe('level 2: only fresh ice shows water', () => {
  const spec = LEVELS[2]

  it('digging to the shallowest ice and sampling at once finds water', () => {
    let s = createState(spec)
    s = digToIce(spec, s, 1) // depth 2
    const r = deliver(spec, s, 1)
    expect(r.ok).toBe(true)
    expect(outcome(spec, r.state)).toBe('won')
  })

  it('ice left in the open for 2 sols has no water left', () => {
    let s = createState(spec)
    s = digToIce(spec, s, 1)
    s = nextSol(spec, s)
    s = nextSol(spec, s)
    const r = deliver(spec, s, 1)
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/gas/)
  })

  it('scraping again exposes fresh ice', () => {
    let s = createState(spec)
    s = digToIce(spec, s, 1)
    s = nextSol(spec, s)
    s = nextSol(spec, s)
    s = dig(spec, s, 1).state
    expect(deliver(spec, s, 1).ok).toBe(true)
  })

  it('a scoop of plain soil wastes an oven', () => {
    let s = createState(spec)
    s = dig(spec, s, 0).state
    const r = deliver(spec, s, 0)
    expect(r.ok).toBe(false)
    expect(r.state.ovensLeft).toBe(spec.ovens - 1)
  })

  it('wasting every oven loses the level', () => {
    let s = createState(spec)
    s = dig(spec, s, 0).state
    for (let k = 0; k < spec.ovens; k++) s = deliver(spec, s, 0).state
    expect(outcome(spec, s)).toBe('lost')
  })
})

describe('level 3: less sunlight every sol', () => {
  const spec = LEVELS[3]

  it('energy per sol goes down and then the lander goes silent', () => {
    for (let i = 1; i < spec.budget.length; i++) expect(spec.budget[i]).toBeLessThanOrEqual(spec.budget[i - 1])
    let s = createState(spec)
    for (let i = 0; i < spec.budget.length; i++) s = nextSol(spec, s)
    expect(s.silent).toBe(true)
  })

  it('using the sunny sols well gets 3 readings in time', () => {
    let s = createState(spec)
    for (const col of [2, 0, 4]) {
      s = digToIce(spec, s, col)
      if (s.energy <= 0) s = nextSol(spec, s)
      s = deliver(spec, s, col).state
    }
    expect(s.readings).toBe(3)
    expect(outcome(spec, s)).toBe('won')
  })

  it('waiting idle through the sunny sols leaves too little energy', () => {
    let s = createState(spec)
    for (let i = 0; i < 3; i++) s = nextSol(spec, s)
    for (const col of [2, 0, 4]) {
      s = digToIce(spec, s, col)
      if (s.silent) break
      if (s.energy <= 0) s = nextSol(spec, s)
      if (s.silent) break
      s = deliver(spec, s, col).state
    }
    expect(s.readings).toBeLessThan(3)
  })
})

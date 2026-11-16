import { describe, expect, it } from 'vitest'
import {
  CSM_RING,
  DOCK_GAP,
  INSERTION_RING,
  LEVELS,
  RINGS,
  TUTORIAL,
  burn,
  gap,
  initialState,
  judgeInsertion,
  launch,
  omega,
  step,
  strandedReason,
  type LevelSpec,
  type State,
} from './rules'

const DT = 1 / 30

function run(s: State, spec = LEVELS[2], seconds = 200, policy?: (s: State) => void) {
  const verdicts = []
  for (let i = 0; i < seconds / DT && (s.phase === 'orbit' || s.phase === 'ascent' || s.phase === 'pad'); i++) {
    policy?.(s)
    const v = step(s, spec, DT)
    if (v) verdicts.push(v)
  }
  return verdicts
}

describe('Kepler: lower is faster', () => {
  it('a lower ring has a higher angular speed', () => {
    for (let r = 1; r <= 4; r++) expect(omega(r - 1)).toBeGreaterThan(omega(r))
  })
})

describe('level 1: launch window', () => {
  const spec = LEVELS[1]
  it('launching when Columbia is a little ahead docks by itself', () => {
    const s = initialState(spec)
    // Wait until Columbia will be ~30 deg ahead at insertion, then launch.
    run(s, spec, 60, (st) => {
      if (st.phase === 'pad') {
        const atInsertion = st.csm + omega(CSM_RING) * 3 - (90 + 20)
        const lead = ((atInsertion % 360) + 360) % 360
        if (lead > 25 && lead < 35) launch(st)
      }
    })
    expect(s.phase).toBe('docked')
  })

  it('launching when Columbia is behind fails and teaches why', () => {
    const s = initialState(spec)
    let verdict: ReturnType<typeof step> = null
    for (let i = 0; i < 2000 && s.phase !== 'failed'; i++) {
      if (s.phase === 'pad') {
        const lead = (((s.csm + omega(CSM_RING) * 3 - 110) % 360) + 360) % 360
        if (lead > 300 && lead < 340) launch(s)
      }
      verdict = step(s, spec, DT) ?? verdict
    }
    expect(s.phase).toBe('failed')
    expect(verdict).toMatchObject({ concept: 'ventana-de-lanzamiento', correct: false })
  })
})

describe('level 2: catch up by going lower', () => {
  const spec = LEVELS[2]
  it('drop one orbit, wait, climb back: docked', () => {
    const s = initialState(spec)
    const v1 = burn(s, 'down')
    expect(v1?.correct).toBe(true)
    run(s, spec, 80, (st) => {
      if (st.ring < CSM_RING && gap(st) <= 3) {
        const v = burn(st, 'up')
        expect(v?.correct).toBe(true)
      }
    })
    expect(s.phase).toBe('docked')
  })

  it('burning forward to chase is wrong and loses the race', () => {
    const s = initialState(spec)
    const v = burn(s, 'up')
    expect(v).toMatchObject({ concept: 'orbita-baja-mas-rapida', correct: false })
    const g0 = gap(s)
    step(s, spec, 5)
    expect(gap(s)).toBeGreaterThan(g0)
    run(s, spec, 200)
    expect(s.phase).toBe('failed')
  })

  it('doing nothing never closes the gap', () => {
    const s = initialState(spec)
    run(s, spec, 200)
    expect(s.phase).toBe('failed')
  })
})

describe('level 3: full rendezvous is winnable', () => {
  it('good launch then one climb docks within the limits', () => {
    const spec = LEVELS[3]
    const s = initialState(spec)
    let climbed = false
    run(s, spec, 200, (st) => {
      if (st.phase === 'pad') {
        const lead = (((st.csm + omega(CSM_RING) * 3 - 110) % 360) + 360) % 360
        if (lead > 40 && lead < 45) launch(st)
      }
      if (st.phase === 'orbit' && !climbed && gap(st) <= 3) {
        burn(st, 'up')
        climbed = true
      }
    })
    expect(s.phase).toBe('docked')
  })
})

// --- Winnability oracle ---------------------------------------------------------
// The defect class locked out below is "the game praises something it cannot
// let you finish". Deciding that needs a solver rather than a hand-picked
// example, so every state the game blesses is replayed here against every plan
// the level can afford: coast on some ring until the gap is inside DOCK_GAP,
// then burn back onto Columbia's ring. Rings are ordered by speed, so a plan is
// fully described by the ring you wait on.

function orbitState(spec: LevelSpec, ring: number, g: number, burnsLeft = spec.burns): State {
  return { phase: 'orbit', lm: 0, ring, csm: g, burnsLeft, t: 0, ascentT: 0, reason: '' }
}

function playPlan(start: State, spec: LevelSpec, waitRing: number): State {
  const s = { ...start }
  let stage: 'move' | 'coast' | 'back' = 'move'
  for (let i = 0; i < spec.timeLimit / DT + 10 && s.phase === 'orbit'; i++) {
    if (stage === 'move') {
      if (s.ring !== waitRing) burn(s, s.ring < waitRing ? 'up' : 'down', spec)
      else stage = 'coast'
    }
    if (stage === 'coast' && Math.abs(gap(s)) <= DOCK_GAP) stage = 'back'
    if (stage === 'back' && s.ring !== CSM_RING) burn(s, s.ring < CSM_RING ? 'up' : 'down', spec)
    step(s, spec, DT)
  }
  return s
}

function isWinnable(start: State, spec: LevelSpec): boolean {
  if (start.phase === 'docked') return true
  if (start.phase !== 'orbit') return false
  for (let w = 0; w < RINGS.length; w++) {
    // A burn crosses exactly one ring, so a plan costs the trip out plus the
    // trip home. Levels that fly the last ring for you need no burn at all.
    const cost = Math.abs(w - start.ring) + Math.abs(CSM_RING - w)
    const affordable = spec.autoCatchUp ? w === start.ring : cost <= start.burnsLeft
    if (affordable && playPlan(start, spec, w).phase === 'docked') return true
  }
  return false
}

describe('the game never praises what it will not let you finish', () => {
  for (const key of [1, 2, 3] as const) {
    const spec = LEVELS[key]
    it(`level ${key}: every lead called a good launch can actually be flown to a docking`, () => {
      if (!spec.fromPad) {
        // No launch decision on this level: the only promise it makes is that
        // the gap it drops you into is flyable with the burns it hands you.
        expect(isWinnable(initialState(spec), spec)).toBe(true)
        return
      }
      let praised = 0
      for (let g = -180; g <= 180; g++) {
        const s = orbitState(spec, INSERTION_RING, g)
        if (!judgeInsertion(s, spec)?.correct) continue
        praised++
        expect(isWinnable(s, spec), `lead ${g}° is called a good launch but cannot be flown to a docking`).toBe(true)
      }
      // Guards the sweep itself: if the window ever stopped matching what
      // judgeInsertion praises, the loop above could be checking nothing.
      expect(praised).toBe(spec.window[1] - spec.window[0] + 1)
    })
  }

  for (const key of [2, 3] as const) {
    const spec = LEVELS[key]
    it(`level ${key}: a burn reported correct always leaves Eagle closing in, never in a dead end`, () => {
      for (let ring = 0; ring < RINGS.length; ring++) {
        for (let burnsLeft = 1; burnsLeft <= spec.burns; burnsLeft++) {
          for (let g = -180; g <= 180; g += 5) {
            for (const dir of ['up', 'down'] as const) {
              const s = orbitState(spec, ring, g, burnsLeft)
              const v = burn(s, dir, spec)
              if (!v?.correct) continue
              const where = `${dir} from ring ${ring} at ${g}° with ${burnsLeft} burns`
              // 1. The move may not strand Eagle where docking is impossible.
              expect(strandedReason(s, spec), `${where} is praised but strands Eagle`).toBe(null)
              // 2. It must either dock now or leave the gap actually shrinking:
              //    below Columbia when it leads, above it when it trails.
              const after = gap(s)
              const docking = s.ring === CSM_RING && Math.abs(after) <= DOCK_GAP
              const closing =
                (omega(s.ring) > omega(CSM_RING) && after > 0) || (omega(s.ring) < omega(CSM_RING) && after < 0)
              expect(docking || closing, `${where} is praised but the gap is not closing`).toBe(true)
            }
          }
        }
      }
    })
  }

  it('climbing into Columbia\'s orbit is praised only when the docking really follows', () => {
    const spec = LEVELS[2]
    for (let burnsLeft = 1; burnsLeft <= 2; burnsLeft++) {
      for (let g = -180; g <= 180; g++) {
        const s = orbitState(spec, CSM_RING - 1, g, burnsLeft)
        const v = burn(s, 'up', spec)
        expect(v, `climbing at ${g}° gave no verdict at all`).not.toBe(null)
        if (v?.correct) {
          // Praised: flying hands-off from here must end docked, not timed out.
          run(s, spec, spec.timeLimit + 5)
          expect(s.phase, `climbing at ${g}° was praised but did not dock`).toBe('docked')
        } else {
          expect(Math.abs(g) > DOCK_GAP, `climbing at ${g}° was inside docking range yet marked wrong`).toBe(true)
        }
      }
    }
  })
})

describe('being stranded is said out loud, not timed out', () => {
  it('matching Columbia\'s orbit out of range with no burns left loses at once', () => {
    const spec = LEVELS[2]
    // One burn down and one back up: same ring as Columbia, 50° short, no fuel.
    const s = initialState(spec)
    s.burnsLeft = 2
    burn(s, 'down', spec)
    const v = burn(s, 'up', spec)
    expect(s.ring).toBe(CSM_RING)
    expect(s.burnsLeft).toBe(0)
    expect(v?.correct).toBe(false)
    expect(s.phase).toBe('failed')
    // The message has to name the cause (same orbit, same speed), not the clock.
    expect(v?.message).toMatch(/same orbit means the same speed/i)
    expect(s.reason).toBe(v?.message)
    expect(s.t).toBeLessThan(spec.timeLimit)
  })

  it('spending the burns too far from Columbia\'s orbit loses at once', () => {
    const spec = LEVELS[2]
    const s = initialState(spec)
    expect(burn(s, 'down', spec)?.correct).toBe(true)
    const v = burn(s, 'down', spec)
    // Two rings below Columbia with one burn left: no way back, so say so now
    // instead of letting the player wait out the whole clock.
    expect(s.ring).toBe(CSM_RING - 2)
    expect(s.burnsLeft).toBe(1)
    expect(v).toMatchObject({ concept: 'orbita-baja-mas-rapida', correct: false })
    expect(v?.message).toMatch(/Each burn moves one orbit/i)
    expect(s.phase).toBe('failed')
    expect(s.t).toBe(0)
  })

  it('a level that flies the catch-up for you is never called stranded', () => {
    const spec = LEVELS[1]
    const s = orbitState(spec, INSERTION_RING, 40)
    // Level 1 hands out zero burns on purpose: step() closes the last ring.
    expect(s.burnsLeft).toBe(0)
    expect(strandedReason(s, spec)).toBe(null)
    run(s, spec, spec.timeLimit)
    expect(s.phase).toBe('docked')
  })
})

describe('level 0: the guided tutorial can always be finished', () => {
  it('follows the coach (launch in the window, drop once, climb when close) and docks', () => {
    const spec = TUTORIAL
    const s = initialState(spec)
    let dropped = false
    let launched = false
    let t = 0
    for (let i = 0; i < 90 / DT && s.phase !== 'docked' && s.phase !== 'failed'; i++, t += DT) {
      if (s.phase === 'pad' && !launched) {
        const g = gap(s)
        if (g >= spec.window[0] && g <= spec.window[1]) {
          launch(s)
          launched = true
        }
      } else if (s.phase === 'orbit') {
        const ag = Math.abs(gap(s))
        if (!dropped && s.ring === INSERTION_RING) {
          burn(s, 'down', spec)
          dropped = true
        } else if (dropped && s.ring < INSERTION_RING && ag <= 12) burn(s, 'up', spec)
        else if (dropped && s.ring === INSERTION_RING && ag <= DOCK_GAP) burn(s, 'up', spec)
      }
      step(s, spec, DT)
    }
    expect(launched).toBe(true)
    expect(s.phase).toBe('docked')
    // Short enough to keep a 9-year-old's attention.
    expect(t).toBeLessThan(60)
  })

  it('Columbia reaches the launch window within a few seconds of the start', () => {
    const s = initialState(TUTORIAL)
    let wait = 0
    while (gap(s) < TUTORIAL.window[0] && wait < 30) {
      step(s, TUTORIAL, DT)
      wait += DT
    }
    expect(wait).toBeLessThan(10)
  })
})

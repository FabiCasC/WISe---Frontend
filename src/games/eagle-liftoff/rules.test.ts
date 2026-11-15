import { describe, expect, it } from 'vitest'
import { CSM_RING, LEVELS, burn, gap, initialState, launch, omega, step, type State } from './rules'

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

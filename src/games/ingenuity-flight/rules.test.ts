import { describe, expect, it } from 'vitest'
import {
  EARTH_G,
  FIRST_FLIGHT_RPM,
  LEVELS,
  MARS_G,
  RHO_EARTH,
  createHeli,
  groundAt,
  hoverRpm,
  judge,
  liftAccel,
  stepHeli,
  type Controls,
  type Event,
  type Heli,
  type LevelSpec,
} from './rules'

const DT = 1 / 60

/** A steady pilot: hold an altitude, fly toward x, then come down gently. */
function autopilot(target: { x: number; alt: number; land: boolean; tolerance?: number }) {
  return (h: Heli): Controls => {
    const dx = target.x - h.x
    const near = Math.abs(dx) < (target.tolerance ?? 1.5)
    const wantAlt = target.land && near && Math.abs(h.vx) < 0.4 ? -1 : target.alt
    const wantVy = Math.max(-0.8, Math.min(1.2, (wantAlt - h.y) * 0.8))
    const faster = h.vy < wantVy
    const wantVx = Math.max(-3, Math.min(3, dx * 0.5))
    return { faster, slower: !faster, left: h.airborne && h.vx > wantVx + 0.2, right: h.airborne && h.vx < wantVx - 0.2 }
  }
}

function fly(spec: LevelSpec, phases: ((h: Heli) => Controls)[], until: ((h: Heli) => boolean)[]) {
  let h = createHeli(spec)
  let phase = 0
  for (let i = 0; i < 60 * 200; i++) {
    const r = stepHeli(spec, h, phases[phase](h), DT)
    h = r.heli
    if (phase < phases.length - 1 && until[phase](h)) phase++
    if (r.event !== 'none') return { h, event: r.event as Event, reason: r.reason }
  }
  return { h, event: 'none' as Event, reason: '' }
}

describe('thin air needs fast blades', () => {
  it('Mars hover speed is close to the real 2,537 rpm, Earth needs far less', () => {
    expect(hoverRpm()).toBeGreaterThan(2200)
    expect(hoverRpm()).toBeLessThan(FIRST_FLIGHT_RPM)
    const earth = hoverRpm(RHO_EARTH, EARTH_G)
    expect(earth).toBeLessThan(hoverRpm() / 3)
  })

  it('at 2,000 rpm the helicopter cannot leave the ground on Mars', () => {
    expect(liftAccel(2000)).toBeLessThan(MARS_G)
    let h: Heli = { ...createHeli(LEVELS[1]), rpm: 2000 }
    for (let i = 0; i < 300; i++) h = stepHeli(LEVELS[1], h, { faster: false, slower: false, left: false, right: false }, DT).heli
    expect(h.airborne).toBe(false)
    expect(h.y).toBe(0)
  })

  it('level 1: take off, hover above 3 m, land softly', () => {
    const spec = LEVELS[1]
    const r = fly(
      spec,
      [autopilot({ x: 25, alt: 4, land: false }), autopilot({ x: 25, alt: 4, land: true })],
      [(h) => h.hoverTime > 7]
    )
    expect(r.event).toBe('landed')
    const v = judge(1, spec, r.h, r.event, r.reason)
    expect(v.won).toBe(true)
    expect(v.conceptOk).toBe(true)
  })

  it('cutting the rotors in the air means a hard landing', () => {
    const spec = LEVELS[1]
    const r = fly(
      spec,
      [autopilot({ x: 25, alt: 6, land: false }), () => ({ faster: false, slower: true, left: false, right: false })],
      [(h) => h.y > 5.5]
    )
    expect(r.event).toBe('crash')
  })
})

describe('level 2: the battery allows about one 90 s flight', () => {
  const spec = LEVELS[2]

  it('a direct flight takes the photo and lands at the base with battery left', () => {
    const r = fly(
      spec,
      [autopilot({ x: 105, alt: 6, land: false }), autopilot({ x: 155, alt: 6, land: true, tolerance: 3 })],
      [(h) => h.photo]
    )
    expect(r.event).toBe('landed')
    expect(judge(2, spec, r.h, r.event, r.reason).won).toBe(true)
    expect(r.h.battery).toBeGreaterThan(5)
  })

  it('a slow, wandering flight runs out of battery', () => {
    const slow = (h: Heli): Controls => {
      const c = autopilot({ x: 155, alt: 20, land: false })(h)
      return { ...c, right: c.right && h.vx < 0.6 }
    }
    const r = fly(spec, [slow], [])
    expect(r.event).toBe('battery')
    expect(judge(2, spec, r.h, r.event, r.reason).conceptOk).toBe(false)
  })
})

describe('level 3: the camera needs texture', () => {
  const spec = LEVELS[3]

  it('over pebbles the helicopter holds still; over smooth ripples it drifts', () => {
    const hold = (h: Heli): Controls => autopilot({ x: h.x, alt: 4, land: false })(h)
    let a = createHeli(spec)
    let b: Heli = { ...createHeli(spec), x: 44 }
    for (let i = 0; i < 60 * 8; i++) {
      a = stepHeli(spec, a, hold(a), DT).heli
      b = stepHeli(spec, b, { ...autopilot({ x: 44, alt: 4, land: false })(b), left: false, right: false }, DT).heli
    }
    expect(Math.abs(a.x - spec.start)).toBeLessThan(0.5)
    expect(Math.abs(b.x - 44)).toBeGreaterThan(1)
  })

  it('landing on the ripples breaks a blade', () => {
    const r = fly(spec, [autopilot({ x: 44, alt: 4, land: true, tolerance: 8 })], [])
    expect(groundAt(spec, r.h.x)).toBe('ripples')
    expect(r.event).toBe('crash')
    expect(judge(3, spec, r.h, r.event, r.reason).conceptOk).toBe(false)
  })

  it('flying over to the pebbly patch and landing there wins', () => {
    const r = fly(
      spec,
      [autopilot({ x: 70, alt: 6, land: false, tolerance: 3 }), autopilot({ x: 70, alt: 6, land: true, tolerance: 4 })],
      [(h) => Math.abs(h.x - 70) < 3]
    )
    expect(r.event).toBe('landed')
    expect(groundAt(spec, r.h.x)).toBe('pebbles')
    expect(judge(3, spec, r.h, r.event, r.reason).won).toBe(true)
  })
})

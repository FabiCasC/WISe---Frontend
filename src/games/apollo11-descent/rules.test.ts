import { describe, expect, it } from 'vitest'
import {
  EARTH_G,
  ENGINE_ACCEL,
  LEVELS,
  MOON_G,
  conceptOk,
  createLander,
  judgeTouchdown,
  outOfZone,
  stepLander,
  touchingGround,
  zoneAt,
  type Controls,
  type Lander,
  type LevelSpec,
} from './rules'

const DT = 1 / 60

/**
 * A simple pilot: fly to `targetX`, keep the descent rate gentle near the
 * ground. If this pilot can land with fuel to spare, a child can too.
 */
function pilot(l: Lander, targetX: number, jets: boolean): Controls {
  const alt = l.y
  const wantVy = -Math.max(1.0, Math.min(9, alt * 0.12))
  const thrust = l.vy < wantVy
  let left = false
  let right = false
  if (jets) {
    const dx = targetX - l.x
    const wantVx = Math.max(-6, Math.min(6, dx * 0.25))
    if (l.vx < wantVx - 0.15) right = true
    else if (l.vx > wantVx + 0.15) left = true
  }
  return { thrust, left, right }
}

function fly(spec: LevelSpec, policy: (l: Lander) => Controls, gravity = MOON_G) {
  let l = createLander(spec)
  for (let i = 0; i < 60 * 240; i++) {
    l = stepLander(l, policy(l), DT, { gravity, jets: spec.jets })
    if (outOfZone(l)) return { l, out: true, t: null }
    if (touchingGround(spec, l)) return { l, out: false, t: judgeTouchdown(spec, l) }
  }
  throw new Error('never landed')
}

describe('low gravity: a little fuel is enough on the Moon', () => {
  it('the engine is stronger than Moon gravity but weaker than Earth gravity', () => {
    expect(ENGINE_ACCEL).toBeGreaterThan(MOON_G)
    expect(ENGINE_ACCEL).toBeLessThan(EARTH_G)
    expect(MOON_G / EARTH_G).toBeCloseTo(1 / 6, 1)
  })

  it('level 1 can be landed with fuel to spare', () => {
    const r = fly(LEVELS[1], (l) => pilot(l, 100, false))
    expect(r.t?.landed).toBe(true)
    expect(r.l.fuel).toBeGreaterThan(3)
    expect(conceptOk(1, r.t!)).toBe(true)
  })

  it('with Earth gravity the same lander and fuel crash, whatever you do', () => {
    // Full thrust the whole way down is the best anyone can do.
    const r = fly(LEVELS[1], () => ({ thrust: true, left: false, right: false }), EARTH_G)
    expect(r.t?.verticalOk).toBe(false)
    expect(r.t?.landed).toBe(false)
  })

  it('never firing the engine crashes, and the concept is reported wrong', () => {
    const r = fly(LEVELS[1], () => ({ thrust: false, left: false, right: false }))
    expect(r.t?.landed).toBe(false)
    expect(conceptOk(1, r.t!)).toBe(false)
  })

  it('fuel runs out: the engine stops pushing', () => {
    let l: Lander = { ...createLander(LEVELS[1]), fuel: 0.05 }
    l = stepLander(l, { thrust: true, left: false, right: false }, 0.1)
    l = stepLander(l, { thrust: true, left: false, right: false }, 0.1)
    expect(l.fuel).toBe(0)
    expect(l.burning).toBe(false)
  })
})

describe('horizontal speed must be zero', () => {
  it('level 2 is winnable by killing the drift', () => {
    const r = fly(LEVELS[2], (l) => pilot(l, 110, true))
    expect(r.out).toBe(false)
    expect(r.t?.landed).toBe(true)
    expect(conceptOk(2, r.t!)).toBe(true)
  })

  it('a soft but sliding touchdown tips over', () => {
    // Vertical control only: the 9 m/s drift is never cancelled.
    const r = fly(LEVELS[2], (l) => ({ ...pilot(l, 0, false) }))
    if (r.t) {
      expect(r.t.verticalOk).toBe(true)
      expect(r.t.sideOk).toBe(false)
      expect(r.t.landed).toBe(false)
      expect(conceptOk(2, r.t)).toBe(false)
    } else {
      // Drifting out of the landing zone is a failure too.
      expect(r.out).toBe(true)
    }
  })
})

describe('pick flat ground', () => {
  it('the start of level 3 is above boulders', () => {
    expect(zoneAt(LEVELS[3], LEVELS[3].start.x)).toBe('rocks')
  })

  it('landing straight down on the boulders fails even if soft', () => {
    const r = fly(LEVELS[3], (l) => pilot(l, LEVELS[3].start.x, true))
    expect(r.t?.verticalOk).toBe(true)
    expect(r.t?.flatOk).toBe(false)
    expect(conceptOk(3, r.t!)).toBe(false)
  })

  it('flying to the smooth spot lands with fuel left', () => {
    const r = fly(LEVELS[3], (l) => pilot(l, 167, true))
    expect(r.t?.landed).toBe(true)
    expect(r.l.fuel).toBeGreaterThan(2)
    expect(conceptOk(3, r.t!)).toBe(true)
  })
})

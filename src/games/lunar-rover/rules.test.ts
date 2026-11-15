import { describe, expect, it } from 'vitest'
import {
  LEVELS,
  LM,
  MAX_SPEED,
  bearingDeg,
  createRover,
  dist,
  insideWalkBack,
  status,
  stepRover,
  type LevelSpec,
  type Rover,
  type Status,
  type Vec,
} from './rules'

const DT = 1 / 60

/** Drives through the waypoints like a careful player holding a finger on the map. */
function drive(spec: LevelSpec, route: Vec[]): { r: Rover; st: Status; minInside: boolean } {
  let r = createRover(spec)
  let minInside = true
  for (const wp of route) {
    for (let i = 0; i < 60 * 60; i++) {
      r = stepRover(spec, r, { forward: false, back: false, left: false, right: false, target: wp }, DT)
      if (!insideWalkBack(spec, r)) minInside = false
      const st = status(spec, r)
      if (st !== 'driving') return { r, st, minInside }
      if (dist(r, wp) < 45) break
    }
  }
  // Coast to a stop at the end.
  for (let i = 0; i < 120; i++) r = stepRover(spec, r, { forward: false, back: false, left: false, right: false }, DT)
  return { r, st: status(spec, r), minInside }
}

const at = (spec: LevelSpec, i: number) => spec.stations[i]

describe('level 1: batteries that cannot be recharged', () => {
  const spec = LEVELS[1]

  it('a tidy loop collects every sample and gets home with charge left', () => {
    const res = drive(spec, [at(spec, 0), { x: 2950, y: 1200 }, at(spec, 1), at(spec, 2), LM])
    expect(res.st).toBe('won')
    expect(res.r.battery).toBeGreaterThan(500)
  })

  it('a zig-zag order wastes the battery and strands the crew', () => {
    const res = drive(spec, [at(spec, 0), { x: 2000, y: 3300 }, at(spec, 2), { x: 3700, y: 2900 }, at(spec, 1), { x: 3700, y: 400 }, LM])
    expect(res.st).toBe('battery')
  })

  it('the battery only goes down', () => {
    let r = createRover(spec)
    const start = r.battery
    for (let i = 0; i < 300; i++) r = stepRover(spec, r, { forward: true, back: false, left: false, right: false }, DT)
    expect(r.battery).toBeLessThan(start)
    expect(r.battery).toBeCloseTo(start - r.driven, 3)
  })

  it('with a flat battery the rover cannot move', () => {
    let r: Rover = { ...createRover(spec), battery: 0 }
    for (let i = 0; i < 120; i++) r = stepRover(spec, r, { forward: true, back: false, left: false, right: false }, DT)
    expect(r.speed).toBe(0)
    expect(status(spec, r)).toBe('battery')
  })
})

describe('level 2: stay within walking distance of the LM', () => {
  const spec = LEVELS[2]

  it('every station is inside the circle', () => {
    for (const s of spec.stations) expect(insideWalkBack(spec, s)).toBe(true)
  })

  it('going around the crater on the inside wins', () => {
    const res = drive(spec, [at(spec, 0), { x: 2150, y: 1550 }, at(spec, 1), at(spec, 2), LM])
    expect(res.minInside).toBe(true)
    expect(res.st).toBe('won')
  })

  it('going around the crater on the outside leaves the circle and ends the run', () => {
    const res = drive(spec, [at(spec, 0), { x: 3150, y: 620 }, at(spec, 1), at(spec, 2), LM])
    expect(res.st).toBe('too-far')
  })
})

describe('level 3: the navigation computer points home', () => {
  const spec = LEVELS[3]

  it('bearing math: north is 0, east is 90', () => {
    expect(bearingDeg({ x: 0, y: 0 }, { x: 0, y: -10 })).toBeCloseTo(0)
    expect(bearingDeg({ x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(90)
  })

  it('the LM is out of sight from the far station', () => {
    expect(dist(at(spec, 1), LM)).toBeGreaterThan(spec.sight! * 2)
  })

  it('following the arrow home wins', () => {
    const res = drive(spec, [{ x: 1700, y: 1050 }, at(spec, 0), { x: 1150, y: 1900 }, { x: 2300, y: 2550 }, at(spec, 1), { x: 2850, y: 2250 }, LM])
    expect(res.st).toBe('won')
    expect(res.minInside).toBe(true)
  })

  it('the rover never exceeds its top speed', () => {
    let r = createRover(spec)
    for (let i = 0; i < 600; i++) {
      r = stepRover(spec, r, { forward: true, back: false, left: false, right: true }, DT)
      expect(Math.abs(r.speed)).toBeLessThanOrEqual(MAX_SPEED + 1e-6)
    }
  })
})

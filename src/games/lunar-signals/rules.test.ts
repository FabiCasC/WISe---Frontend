import { describe, expect, it } from 'vitest'
import { approach } from './dom'
import { createSfx } from './sound'
import { LEVEL1_MEASURED_ECHO_S, LEVEL2_QUAKE, LEVEL3_QUAKE } from './levels'
import {
  MOON_DISTANCE_KM, candidates, circleIntersections, circlesCross, correctRadius,
  dist, distanceFromEcho, echoSeconds, isLocatable, judgeAnswer, judgeCircle,
  judgeEcho, newMetrics, radiusFromDelay, readings, recordAttempt, spDelay,
} from './rules'

describe('level 1: echo of light', () => {
  it('the echo at the mean distance is a little over 2 seconds', () => {
    const t = echoSeconds(MOON_DISTANCE_KM)
    expect(t).toBeGreaterThan(2)
    expect(t).toBeLessThan(3)
  })

  it('round trip and distance invert each other', () => {
    expect(distanceFromEcho(echoSeconds(MOON_DISTANCE_KM))).toBeCloseTo(MOON_DISTANCE_KM, 3)
  })

  it('the correct marker matches; a short or long one does not', () => {
    const km = distanceFromEcho(LEVEL1_MEASURED_ECHO_S)
    expect(judgeEcho(km, LEVEL1_MEASURED_ECHO_S).verdict).toBe('match')
    expect(judgeEcho(km * 0.5, LEVEL1_MEASURED_ECHO_S).verdict).toBe('too-short')
    expect(judgeEcho(km * 1.5, LEVEL1_MEASURED_ECHO_S).verdict).toBe('too-long')
  })
})

describe('levels 2 and 3: quakes', () => {
  it('S-P delay and radius are inverses', () => {
    const d = 37
    expect(radiusFromDelay(spDelay(d, 10, 5.5), 10, 5.5)).toBeCloseTo(d, 6)
  })

  it('the correct radius of each station is its real distance to the epicenter', () => {
    for (const r of readings(LEVEL2_QUAKE)) {
      const st = LEVEL2_QUAKE.stations.find((s) => s.id === r.stationId)!
      expect(correctRadius(LEVEL2_QUAKE, st.id)).toBeCloseTo(dist(st.pos, LEVEL2_QUAKE.epicenter), 6)
    }
  })

  it('judges the drawn circle', () => {
    const r = correctRadius(LEVEL2_QUAKE, 'A')
    expect(judgeCircle(LEVEL2_QUAKE, 'A', r)).toBe('ok')
    expect(judgeCircle(LEVEL2_QUAKE, 'A', r - 10)).toBe('too-small')
    expect(judgeCircle(LEVEL2_QUAKE, 'A', r + 10)).toBe('too-big')
  })

  it('circles that do not touch do not cross', () => {
    expect(circlesCross({ x: 0, y: 0 }, 1, { x: 10, y: 0 }, 1)).toBe(false)
    expect(circleIntersections({ x: 0, y: 0 }, 1, { x: 10, y: 0 }, 1)).toEqual([])
  })

  it('1 station = circle; 2 = two points; 3 = one point', () => {
    expect(candidates(LEVEL2_QUAKE, ['A']).kind).toBe('circle')
    const two = candidates(LEVEL2_QUAKE, ['A', 'B'])
    expect(two.kind).toBe('two-points')
    expect(two.points.some((p) => dist(p, LEVEL2_QUAKE.epicenter) < 0.01)).toBe(true)
    const three = candidates(LEVEL2_QUAKE, ['A', 'B', 'C'])
    expect(three.kind).toBe('one-point')
    expect(dist(three.points[0], LEVEL2_QUAKE.epicenter)).toBeLessThan(0.01)
  })

  it('the two possible points fall inside the map (the ambiguity is real)', () => {
    for (const q of [LEVEL2_QUAKE, LEVEL3_QUAKE]) {
      const pts = candidates(q, ['A', 'B']).points
      expect(pts).toHaveLength(2)
      for (const p of pts) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThanOrEqual(100)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('level 3: no hints', () => {
  it('with C down the quake cannot be located', () => {
    expect(isLocatable(LEVEL2_QUAKE)).toBe(true)
    expect(isLocatable(LEVEL3_QUAKE)).toBe(false)
  })

  it('saying "not enough" shows understanding; betting on a point does not, even if it hits', () => {
    expect(judgeAnswer(LEVEL3_QUAKE, { type: 'insufficient' })).toBe('understood-insufficient')
    expect(judgeAnswer(LEVEL3_QUAKE, { type: 'locate', point: LEVEL3_QUAKE.epicenter })).toBe('wrong-place')
  })

  it('in level 2 it can be located, and declaring "not enough" is wrong', () => {
    expect(judgeAnswer(LEVEL2_QUAKE, { type: 'locate', point: LEVEL2_QUAKE.epicenter })).toBe('located')
    expect(judgeAnswer(LEVEL2_QUAKE, { type: 'locate', point: { x: 5, y: 5 } })).toBe('wrong-place')
    expect(judgeAnswer(LEVEL2_QUAKE, { type: 'insufficient' })).toBe('wrong-insufficient')
  })
})

describe('teacher metrics', () => {
  it('firstAttemptCorrect only looks at the first attempt', () => {
    let m = recordAttempt(newMetrics(), false)
    m = recordAttempt(m, true)
    expect(m).toEqual({ attempts: 2, firstAttemptCorrect: false })
    expect(recordAttempt(newMetrics(), true)).toEqual({ attempts: 1, firstAttemptCorrect: true })
  })
})

describe('smooth numbers', () => {
  it('approach moves toward the target without overshooting and snaps when close', () => {
    let v = 0
    const seen: number[] = []
    for (let i = 0; i < 200; i++) {
      v = approach(v, 2.56, 16, 90)
      seen.push(v)
      expect(v).toBeLessThanOrEqual(2.56)
    }
    expect(seen[0]).toBeGreaterThan(0)
    expect(seen[0]).toBeLessThan(2.56) // it advances little by little
    expect(v).toBe(2.56)
  })

  it('a time constant of 0 jumps straight to the target', () => {
    expect(approach(0, 5, 16, 0)).toBe(5)
  })
})

describe('sound', () => {
  it('is silent and never throws without Web Audio or with volume 0', () => {
    for (const volume of [0, 1]) {
      const sfx = createSfx(volume)
      for (const name of ['fire', 'hit', 'echo', 'select', 'ok', 'bad', 'quake', 'done', 'suspend', 'resume', 'dispose'] as const) {
        expect(() => sfx[name]()).not.toThrow()
      }
    }
  })
})

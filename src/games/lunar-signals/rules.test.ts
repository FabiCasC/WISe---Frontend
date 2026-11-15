import { describe, expect, it } from 'vitest'
import { approach } from './dom'
import { createSfx } from './sound'
import { LEVEL1_MEASURED_ECHO_S, LEVEL2_QUAKE, LEVEL3_QUAKE } from './levels'
import {
  MAX_WRONG, MOON_DISTANCE_KM, attemptsLeft, candidates, circleIntersections, circlesCross,
  correctRadius, dist, distanceFromEcho, echoSeconds, hasFailed, isLocatable, judgeAnswer,
  judgeCircle, judgeEcho, judgeMarks, newMetrics, radiusFromDelay, readings, recordAttempt,
  recordJudgement, spDelay,
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

describe('level 1 cannot be solved by eye', () => {
  /** The distance dial of level 1 runs from 0 to 500,000 km. */
  const DIAL_MAX_KM = 500_000

  it('rejects a marker dropped roughly where the Moon used to be drawn', () => {
    const km = distanceFromEcho(LEVEL1_MEASURED_ECHO_S)
    // 3% of the dial was inside the old tolerance, so a marker nudged onto the
    // Moon sprite passed without any arithmetic. It must not any more.
    for (const off of [0.03, -0.03, 0.02, -0.02]) {
      expect(judgeEcho(km + off * DIAL_MAX_KM, LEVEL1_MEASURED_ECHO_S).verdict).not.toBe('match')
    }
  })

  it('accepts the distance that d = c · t / 2 actually gives', () => {
    const km = distanceFromEcho(LEVEL1_MEASURED_ECHO_S)
    expect(judgeEcho(km, LEVEL1_MEASURED_ECHO_S).verdict).toBe('match')
    // Rounded to the slider's 500 km step, the computed answer still passes.
    expect(judgeEcho(Math.round(km / 500) * 500, LEVEL1_MEASURED_ECHO_S).verdict).toBe('match')
  })
})

describe('level 3: marking every possible place', () => {
  const both = candidates(LEVEL3_QUAKE, ['A', 'B']).points

  it('marking only one of the two crossings is an incomplete answer', () => {
    expect(judgeMarks(LEVEL3_QUAKE, ['A', 'B'], [both[0]])).toBe('incomplete')
    expect(judgeMarks(LEVEL3_QUAKE, ['A', 'B'], [both[1]])).toBe('incomplete')
  })

  it('two marks on the same crossing are still only one place', () => {
    expect(judgeMarks(LEVEL3_QUAKE, ['A', 'B'], [both[0], both[0]])).toBe('incomplete')
  })

  it('marking both crossings is the answer', () => {
    expect(judgeMarks(LEVEL3_QUAKE, ['A', 'B'], both)).toBe('complete')
    expect(judgeMarks(LEVEL3_QUAKE, ['A', 'B'], [both[1], both[0]])).toBe('complete')
  })

  it('a mark that is not on both circles is wrong, even next to a real one', () => {
    expect(judgeMarks(LEVEL3_QUAKE, ['A', 'B'], [both[0], { x: 5, y: 95 }])).toBe('wrong-marks')
    expect(judgeMarks(LEVEL3_QUAKE, ['A', 'B'], [...both, { x: 5, y: 95 }])).toBe('wrong-marks')
  })

  it('no marks is not an answer at all', () => {
    expect(judgeMarks(LEVEL3_QUAKE, ['A', 'B'], [])).toBe('none')
  })
})

describe('wrong answers can lose the level', () => {
  it('three wrong answers fail the level and report it as not completed', () => {
    let wrong = 0
    let log = recordJudgement(wrong, false)
    for (let i = 1; i < MAX_WRONG; i++) {
      expect(log.failed).toBe(false)
      expect(log.left).toBe(MAX_WRONG - i)
      log = recordJudgement((wrong = log.wrong), false)
    }
    expect(log.failed).toBe(true)
    expect(log.left).toBe(0)
  })

  it('correct answers never burn an attempt, so a clean run never fails', () => {
    let log = recordJudgement(0, true)
    for (let i = 0; i < 20; i++) log = recordJudgement(log.wrong, true)
    expect(log).toEqual({ wrong: 0, failed: false, left: MAX_WRONG })
  })

  it('the binary search on the radius slider is no longer free', () => {
    // judgeCircle still says "too small / too big", but only MAX_WRONG times.
    const r = correctRadius(LEVEL3_QUAKE, 'A')
    let wrong = 0
    for (const guess of [10, 90, 70, 30]) {
      expect(judgeCircle(LEVEL3_QUAKE, 'A', guess)).not.toBe('ok')
      wrong = recordJudgement(wrong, false).wrong
    }
    expect(hasFailed(wrong)).toBe(true)
    expect(attemptsLeft(wrong)).toBe(0)
    expect(judgeCircle(LEVEL3_QUAKE, 'A', r)).toBe('ok') // the right answer existed all along
  })
})

import { describe, expect, it } from 'vitest'
import {
  DIDYMOS_MU,
  LEVELS,
  ORBIT_RADIUS_M,
  bestPossibleCutMin,
  circularSpeed,
  deltaVMagnitude,
  dot,
  hitGrade,
  levelConfig,
  orbitHeading,
  orbitPosition,
  periodSeconds,
  previewImpact,
  resolveImpact,
  scoreShot,
  semiMajorAxis,
  shotPassed,
  unit,
  type AimPreviewInput,
  type LevelConfig,
} from './rules'

const DART: LevelConfig = levelConfig(3)

/** Direction that hits the moonlet exactly head-on at `angle`. */
function headOn(angle: number) {
  const h = orbitHeading(angle)
  return { x: -h.x, y: -h.y }
}

describe('vector helpers', () => {
  it('normalises a vector to length 1', () => {
    const u = unit({ x: 3, y: 4 })
    expect(Math.hypot(u.x, u.y)).toBeCloseTo(1, 10)
    expect(u.x).toBeCloseTo(0.6, 10)
  })

  it('leaves a zero vector at zero instead of NaN', () => {
    expect(unit({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
  })

  it('keeps the heading perpendicular to the radius', () => {
    for (const angle of [0, 0.7, 2.1, 4.9]) {
      expect(dot(orbitPosition(angle), orbitHeading(angle))).toBeCloseTo(0, 6)
    }
  })

  it('gives the heading unit length', () => {
    const h = orbitHeading(1.3)
    expect(Math.hypot(h.x, h.y)).toBeCloseTo(1, 10)
  })
})

describe('the real Didymos system', () => {
  it('puts Dimorphos on an 11.9-hour orbit', () => {
    const hours = periodSeconds(DIDYMOS_MU, ORBIT_RADIUS_M) / 3600
    expect(hours).toBeCloseTo(11.92, 1)
  })

  it('has Dimorphos crawling at about 17 cm/s', () => {
    expect(circularSpeed(DIDYMOS_MU, ORBIT_RADIUS_M)).toBeCloseTo(0.1742, 3)
  })

  it('returns the radius itself as the semi-major axis of a circular orbit', () => {
    const v = circularSpeed(DIDYMOS_MU, ORBIT_RADIUS_M)
    expect(semiMajorAxis(DIDYMOS_MU, ORBIT_RADIUS_M, v)).toBeCloseTo(ORBIT_RADIUS_M, 6)
  })

  it('makes a bigger orbit slower (Kepler)', () => {
    expect(periodSeconds(DIDYMOS_MU, 2000)).toBeGreaterThan(periodSeconds(DIDYMOS_MU, 1190))
  })
})

describe('momentum transfer', () => {
  it('gives DART a kick of about 2.9 mm/s', () => {
    expect(deltaVMagnitude(DART) * 1000).toBeCloseTo(2.93, 1)
  })

  it('scales with the ejecta factor', () => {
    const noEjecta = deltaVMagnitude({ ...DART, beta: 1 })
    expect(deltaVMagnitude(DART) / noEjecta).toBeCloseTo(DART.beta, 10)
  })

  it('scales with probe mass and closing speed', () => {
    expect(deltaVMagnitude({ ...DART, probeMassKg: 1140 })).toBeCloseTo(
      deltaVMagnitude(DART) * 2,
      12,
    )
    expect(deltaVMagnitude({ ...DART, relSpeedMs: 3070 })).toBeCloseTo(
      deltaVMagnitude(DART) / 2,
      12,
    )
  })

  it('barely moves a heavier target', () => {
    expect(deltaVMagnitude({ ...DART, targetMassKg: 4.3e10 })).toBeLessThan(
      deltaVMagnitude(DART),
    )
  })
})

describe('resolveImpact', () => {
  it('shortens the orbit when the hit lands head-on', () => {
    const out = resolveImpact({ spec: DART, orbitAngle: 0, probeDirection: headOn(0) })
    expect(out.changeMin).toBeLessThan(0)
    expect(out.periodAfterS).toBeLessThan(out.periodBeforeS)
    expect(out.semiMajorAfterM).toBeLessThan(ORBIT_RADIUS_M)
    expect(out.alignment).toBeCloseTo(-1, 10)
  })

  it('lengthens the orbit when the moonlet is pushed from behind', () => {
    const out = resolveImpact({ spec: DART, orbitAngle: 0, probeDirection: orbitHeading(0) })
    expect(out.changeMin).toBeGreaterThan(0)
    expect(out.semiMajorAfterM).toBeGreaterThan(ORBIT_RADIUS_M)
    expect(out.alignment).toBeCloseTo(1, 10)
  })

  it('wastes almost all of the impact on a sideways hit', () => {
    const out = resolveImpact({ spec: DART, orbitAngle: 0, probeDirection: orbitPosition(0) })
    expect(out.alignment).toBeCloseTo(0, 6)
    // A sideways kick barely changes the SPEED, so it barely changes the
    // period: under 1% of what the same impactor does head-on. What little
    // it does add goes the wrong way, because sqrt(v^2 + dv^2) > v.
    expect(out.changeMin).toBeGreaterThan(0)
    expect(out.changeMin).toBeLessThan(bestPossibleCutMin(DART) * 0.01)
  })

  it('gives the same result head-on anywhere on the orbit', () => {
    const base = resolveImpact({ spec: DART, orbitAngle: 0, probeDirection: headOn(0) })
    for (const angle of [0.9, 2.6, 4.4, 5.9]) {
      const out = resolveImpact({ spec: DART, orbitAngle: angle, probeDirection: headOn(angle) })
      expect(out.changeMin).toBeCloseTo(base.changeMin, 9)
    }
  })

  it('cuts less the further the hit strays from head-on', () => {
    const cuts = [0, 0.4, 0.8, 1.2].map((off) => {
      const h = orbitHeading(0)
      const dir = {
        x: -h.x * Math.cos(off) - h.y * Math.sin(off),
        y: -h.y * Math.cos(off) + h.x * Math.sin(off),
      }
      return resolveImpact({ spec: DART, orbitAngle: 0, probeDirection: dir }).changeMin
    })
    for (let i = 1; i < cuts.length; i++) {
      expect(cuts[i]!).toBeGreaterThan(cuts[i - 1]!)
    }
  })

  it('ignores the magnitude of the probe direction', () => {
    const slow = resolveImpact({ spec: DART, orbitAngle: 1, probeDirection: headOn(1) })
    const fast = resolveImpact({
      spec: DART,
      orbitAngle: 1,
      probeDirection: { x: headOn(1).x * 900, y: headOn(1).y * 900 },
    })
    expect(fast.changeMin).toBeCloseTo(slow.changeMin, 10)
  })

  it('reports the kick it applied', () => {
    const out = resolveImpact({ spec: DART, orbitAngle: 0, probeDirection: headOn(0) })
    expect(out.deltaVMs).toBeCloseTo(deltaVMagnitude(DART), 12)
  })
})

describe('what the mission could achieve', () => {
  it('lands in the same ballpark as the 32 minutes DART really managed', () => {
    const best = bestPossibleCutMin(DART)
    expect(best).toBeGreaterThan(25)
    expect(best).toBeLessThan(45)
  })

  it('would cut far less without the ejecta plume', () => {
    const noEjecta = bestPossibleCutMin({ ...DART, beta: 1 })
    expect(noEjecta).toBeLessThan(bestPossibleCutMin(DART) / 3)
  })

  it('leaves every level beatable', () => {
    for (const cfg of LEVELS) {
      expect(cfg.requiredMin).toBeLessThan(bestPossibleCutMin(cfg))
    }
  })
})

describe('levels', () => {
  it('has three levels, in order', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3])
  })

  it('asks for more and gives less as it goes', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      const prev = LEVELS[i - 1]!
      const cur = LEVELS[i]!
      expect(cur.requiredMin).toBeGreaterThan(prev.requiredMin)
      expect(cur.targetRadiusM).toBeLessThan(prev.targetRadiusM)
      expect(cur.shots).toBeLessThanOrEqual(prev.shots)
      expect(cur.orbitSeconds).toBeLessThan(prev.orbitSeconds)
      expect(cur.divertBudgetS).toBeLessThan(prev.divertBudgetS)
    }
  })

  it('ends on the mission as flown: one impactor, real hardware', () => {
    const final = levelConfig(3)
    expect(final.shots).toBe(1)
    expect(final.probeMassKg).toBe(570)
    expect(final.relSpeedMs).toBe(6140)
    expect(final.targetRadiusM).toBe(85)
  })

  it('falls back to level 1 for an unknown level', () => {
    expect(levelConfig(99 as 1).id).toBe(1)
  })
})

describe('shotPassed', () => {
  it('needs the orbit to get shorter, not just different', () => {
    expect(shotPassed(-30, 30)).toBe(true)
    expect(shotPassed(-31, 30)).toBe(true)
    expect(shotPassed(-29.9, 30)).toBe(false)
    expect(shotPassed(30, 30)).toBe(false)
    expect(shotPassed(0, 30)).toBe(false)
  })
})

describe('scoreShot', () => {
  const base = { changeMin: -34, requiredMin: 30, shotsUsed: 1, totalShots: 1, level: 3 as const }

  it('scores nothing for a shot that misses the target cut', () => {
    expect(scoreShot({ ...base, changeMin: -10 })).toBe(0)
  })

  it('scores nothing for pushing the moonlet the wrong way', () => {
    expect(scoreShot({ ...base, changeMin: 34 })).toBe(0)
  })

  it('pays more for a bigger cut', () => {
    expect(scoreShot({ ...base, changeMin: -34 })).toBeGreaterThan(
      scoreShot({ ...base, changeMin: -31 }),
    )
  })

  it('pays a bonus for every impactor left unused', () => {
    const spent = scoreShot({ changeMin: -20, requiredMin: 12, shotsUsed: 3, totalShots: 3, level: 1 })
    const saved = scoreShot({ changeMin: -20, requiredMin: 12, shotsUsed: 1, totalShots: 3, level: 1 })
    expect(saved - spent).toBe(80)
  })

  it('weights the later levels higher', () => {
    const easy = scoreShot({ changeMin: -34, requiredMin: 12, shotsUsed: 1, totalShots: 1, level: 1 })
    const hard = scoreShot({ changeMin: -34, requiredMin: 12, shotsUsed: 1, totalShots: 1, level: 3 })
    expect(hard).toBeGreaterThan(easy)
  })

  it('always returns a whole, non-negative number', () => {
    const score = scoreShot({ ...base, changeMin: -33.3333 })
    expect(Number.isInteger(score)).toBe(true)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

describe('hitGrade', () => {
  it('names the quality of the hit', () => {
    expect(hitGrade(-1)).toBe('head-on')
    expect(hitGrade(-0.95)).toBe('head-on')
    expect(hitGrade(-0.7)).toBe('angled')
    expect(hitGrade(-0.2)).toBe('glancing')
    expect(hitGrade(0.6)).toBe('wrong way')
  })
})

describe('previewImpact', () => {
  /**
   * A toy system in screen-like units: Didymos at the origin, the moonlet
   * parked at the top of a 100-unit orbit, and the probe running in from
   * the right. Travelling in -x is exactly against the moonlet's heading
   * there, so this base case is a perfect head-on line.
   */
  function aimSetup(over: Partial<AimPreviewInput> = {}): AimPreviewInput {
    return {
      spec: DART,
      probe: { x: 300, y: -100 },
      probeVelocity: { x: -120, y: 0 },
      center: { x: 0, y: 0 },
      orbitRadius: 100,
      orbitAngle: -Math.PI / 2,
      angularRateRadS: 0,
      captureRadius: 10,
      blockerRadius: 40,
      horizonS: 5,
      ...over,
    }
  }

  it('reads a head-on line as head-on, with the bar full', () => {
    const p = previewImpact(aimSetup())
    expect(p.hits).toBe(true)
    expect(p.alignment).toBeCloseTo(-1, 10)
    expect(hitGrade(p.alignment)).toBe('head-on')
    expect(p.quality).toBeCloseTo(1, 6)
    expect(p.changeMin).toBeLessThan(0)
    expect(p.impactPoint.y).toBeCloseTo(-100, 6)
  })

  it('predicts a head-on line that really does deliver the best cut', () => {
    const setup = aimSetup()
    const p = previewImpact(setup)
    // Resolve the shot the preview described, with the same maths the real
    // impact uses: the promise on screen has to be the thing that lands.
    const resolved = resolveImpact({
      spec: setup.spec,
      orbitAngle: p.impactAngle,
      probeDirection: setup.probeVelocity,
    })
    expect(-resolved.changeMin).toBeCloseTo(bestPossibleCutMin(DART), 6)
    expect(p.changeMin).toBeCloseTo(resolved.changeMin, 12)
  })

  it('says nothing when the line never reaches the moonlet', () => {
    const p = previewImpact(aimSetup({ probe: { x: 300, y: 400 } }))
    expect(p.hits).toBe(false)
    expect(p.quality).toBe(0)
    expect(p.changeMin).toBe(0)
    expect(p.impactPoint).toEqual({ x: 0, y: 0 })
  })

  it('counts a line that buries itself in the parent asteroid as a miss', () => {
    // The moonlet is on the far side, so this line only reaches it by
    // going straight through Didymos.
    const through = aimSetup({ orbitAngle: Math.PI, probe: { x: 300, y: 0 } })
    expect(previewImpact(through).hits).toBe(false)
    // Without the big rock in the way the very same line does connect,
    // which is what makes the blocker the reason for the miss.
    expect(previewImpact({ ...through, blockerRadius: 0 }).hits).toBe(true)
  })

  it('leads a moonlet that is still coming round', () => {
    const rate = 0.35
    const setup = aimSetup({
      angularRateRadS: rate,
      orbitAngle: -Math.PI / 2 - rate * 2.5,
    })
    const p = previewImpact(setup)
    expect(p.hits).toBe(true)
    // Where it says they meet, they really do meet.
    const px = setup.probe.x + setup.probeVelocity.x * p.timeS
    const py = setup.probe.y + setup.probeVelocity.y * p.timeS
    expect(Math.hypot(px - p.impactPoint.x, py - p.impactPoint.y)).toBeLessThanOrEqual(
      setup.captureRadius + 1e-9,
    )
    expect(p.quality).toBeGreaterThan(0.9)
  })

  it('fills less the further the line strays from head-on', () => {
    // The blocker is off here: the steeper lines pass near the asteroid,
    // and this test is about the quality ordering, not the geometry.
    const quals = [0, 0.4, 0.8, 1.4].map((off) => {
      const dir = { x: -Math.cos(off), y: -Math.sin(off) }
      return previewImpact(
        aimSetup({
          blockerRadius: 0,
          probe: { x: -dir.x * 200, y: -100 - dir.y * 200 },
          probeVelocity: { x: dir.x * 120, y: dir.y * 120 },
        }),
      ).quality
    })
    expect(quals[0]).toBeCloseTo(1, 6)
    for (let i = 1; i < quals.length; i++) {
      expect(quals[i]!).toBeLessThan(quals[i - 1]!)
    }
  })

  it('gives no quality at all to a push from behind', () => {
    const p = previewImpact(
      aimSetup({ probe: { x: -300, y: -100 }, probeVelocity: { x: 120, y: 0 } }),
    )
    expect(p.hits).toBe(true)
    expect(p.alignment).toBeCloseTo(1, 10)
    expect(hitGrade(p.alignment)).toBe('wrong way')
    expect(p.changeMin).toBeGreaterThan(0)
    expect(p.quality).toBe(0)
  })

  it('cannot promise more than the impact delivers', () => {
    for (const off of [0.2, 0.9, 2.3]) {
      const dir = { x: -Math.cos(off), y: -Math.sin(off) }
      const setup = aimSetup({
        blockerRadius: 0,
        probe: { x: -dir.x * 200, y: -100 - dir.y * 200 },
        probeVelocity: { x: dir.x * 120, y: dir.y * 120 },
      })
      const p = previewImpact(setup)
      expect(p.hits).toBe(true)
      const resolved = resolveImpact({
        spec: setup.spec,
        orbitAngle: p.impactAngle,
        probeDirection: setup.probeVelocity,
      })
      expect(p.changeMin).toBeCloseTo(resolved.changeMin, 12)
      expect(p.alignment).toBeCloseTo(resolved.alignment, 12)
      expect(p.quality).toBeLessThanOrEqual(1)
    }
  })

  it('has nothing to say without a line to look along', () => {
    expect(previewImpact(aimSetup({ probeVelocity: { x: 0, y: 0 } })).hits).toBe(false)
    expect(previewImpact(aimSetup({ horizonS: 0 })).hits).toBe(false)
    // Too short a look-ahead and the probe has not arrived yet.
    expect(previewImpact(aimSetup({ horizonS: 0.5 })).hits).toBe(false)
  })
})

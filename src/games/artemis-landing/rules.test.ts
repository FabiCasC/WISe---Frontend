import { describe, expect, it } from 'vitest'
import {
  LEVELS,
  MOON_G,
  hoverSecondsLeft,
  hoverThrottle,
  initialState,
  isSafe,
  levelConfig,
  scoreLanding,
  step,
  thrustAccel,
  totalMass,
  verdict,
  verdictReason,
  type LanderState,
  type LevelConfig,
} from './rules'

const L1 = levelConfig(1)

/** Drop the lander for a while with a fixed input. */
function fly(
  cfg: LevelConfig,
  state: LanderState,
  input: { throttle: number; lateral: number },
  seconds: number,
  dt = 1 / 60,
): LanderState {
  let s = state
  for (let t = 0; t < seconds; t += dt) s = step(cfg, s, input, dt)
  return s
}

/**
 * A plain autopilot: hold a descent rate that eases off as the ground comes
 * up, and null out the sideways drift once it is over the pad. It is not
 * clever — that is the point. If this can land, a player can.
 */
function autoLand(cfg: LevelConfig, dt = 1 / 60): { state: LanderState; seconds: number } {
  let s = initialState(cfg)
  let t = 0
  while (s.altitude > 0 && t < 400) {
    // Target: fast up high, gentle near the surface.
    const wanted = -Math.max(1, Math.min(28, 0.7 * Math.sqrt(Math.max(0, s.altitude))))
    const hover = hoverThrottle(cfg, s.fuelKg)
    const throttle = s.vy < wanted ? Math.min(1, hover + 0.35) : Math.max(0, hover - 0.3)

    // Steer towards the middle of the pad, then stop the drift.
    const wantVx = Math.max(-6, Math.min(6, -s.x * 0.08))
    const lateral = Math.abs(s.vx - wantVx) < 0.08 ? 0 : s.vx < wantVx ? 1 : -1

    s = step(cfg, s, { throttle, lateral }, dt)
    t += dt
  }
  return { state: s, seconds: t }
}

describe('the Moon itself', () => {
  it('pulls about a sixth as hard as Earth', () => {
    expect(MOON_G).toBeCloseTo(1.62, 2)
    expect(9.81 / MOON_G).toBeCloseTo(6, 0)
  })

  it('has no air, so a dead engine means free fall and nothing else', () => {
    const s = fly(L1, { x: 0, altitude: 500, vx: 0, vy: 0, fuelKg: 0 }, { throttle: 1, lateral: 0 }, 10)
    // Straight from v = g*t. Any drag term would make this come out slower.
    expect(s.vy).toBeCloseTo(-MOON_G * 10, 1)
  })

  it('never slows a sideways drift on its own', () => {
    const s = fly(L1, { x: 0, altitude: 500, vx: 5, vy: 0, fuelKg: 300 }, { throttle: 0, lateral: 0 }, 12)
    expect(s.vx).toBeCloseTo(5, 6)
  })
})

describe('mass and thrust', () => {
  it('counts the fuel as part of what has to be lifted', () => {
    expect(totalMass(L1, 500)).toBe(L1.dryMassKg + 500)
    expect(totalMass(L1, 0)).toBe(L1.dryMassKg)
  })

  it('accelerates harder as the tanks empty', () => {
    expect(thrustAccel(L1, 1, 100)).toBeGreaterThan(thrustAccel(L1, 1, 500))
  })

  it('gives nothing at all once the fuel runs out', () => {
    expect(thrustAccel(L1, 1, 0)).toBe(0)
    expect(thrustAccel(L1, 1, -5)).toBe(0)
  })

  it('clamps the throttle to 0..1', () => {
    expect(thrustAccel(L1, 5, 400)).toBeCloseTo(thrustAccel(L1, 1, 400), 10)
    expect(thrustAccel(L1, -2, 400)).toBe(0)
  })

  it('can lift the loaded vehicle off the Moon', () => {
    expect(thrustAccel(L1, 1, L1.fuelKg)).toBeGreaterThan(MOON_G)
  })
})

describe('hovering', () => {
  it('holds altitude at exactly the hover throttle', () => {
    const start: LanderState = { x: 0, altitude: 400, vx: 0, vy: 0, fuelKg: 400 }
    const s = fly(L1, start, { throttle: hoverThrottle(L1, 400), lateral: 0 }, 3)
    // Fuel burns off as it hovers, so it creeps up a little. It must not fall.
    expect(s.altitude).toBeGreaterThanOrEqual(399.5)
    expect(s.altitude).toBeLessThan(402)
  })

  it('costs fuel the whole time it buys nothing', () => {
    const start: LanderState = { x: 0, altitude: 400, vx: 0, vy: 0, fuelKg: 400 }
    const s = fly(L1, start, { throttle: hoverThrottle(L1, 400), lateral: 0 }, 5)
    expect(s.fuelKg).toBeLessThan(400)
  })

  it('needs under a third of the engine, because the Moon pulls weakly', () => {
    expect(hoverThrottle(L1, L1.fuelKg)).toBeLessThan(0.33)
  })

  it('reports how many seconds of thinking time are left', () => {
    expect(hoverSecondsLeft(L1, L1.fuelKg)).toBeGreaterThan(0)
    expect(hoverSecondsLeft(L1, 0)).toBe(0)
    expect(hoverSecondsLeft(L1, 200)).toBeLessThan(hoverSecondsLeft(L1, 400))
  })
})

describe('step', () => {
  it('leaves the state it was given untouched', () => {
    const start: LanderState = { x: 1, altitude: 100, vx: 2, vy: -3, fuelKg: 50 }
    const copy = { ...start }
    step(L1, start, { throttle: 0.5, lateral: 1 }, 0.5)
    expect(start).toEqual(copy)
  })

  it('burns more fuel the harder the engine is pushed', () => {
    const start: LanderState = { x: 0, altitude: 100, vx: 0, vy: 0, fuelKg: 100 }
    const easy = step(L1, start, { throttle: 0.2, lateral: 0 }, 1)
    const hard = step(L1, start, { throttle: 1, lateral: 0 }, 1)
    expect(hard.fuelKg).toBeLessThan(easy.fuelKg)
  })

  it('charges for the side thrusters too', () => {
    const start: LanderState = { x: 0, altitude: 100, vx: 0, vy: 0, fuelKg: 100 }
    const straight = step(L1, start, { throttle: 0.5, lateral: 0 }, 1)
    const sideways = step(L1, start, { throttle: 0.5, lateral: 1 }, 1)
    expect(sideways.fuelKg).toBeLessThan(straight.fuelKg)
    expect(sideways.vx).toBeGreaterThan(0)
  })

  it('never lets the tank go negative', () => {
    const s = fly(L1, { x: 0, altitude: 900, vx: 0, vy: 0, fuelKg: 3 }, { throttle: 1, lateral: 1 }, 20)
    expect(s.fuelKg).toBe(0)
  })

  it('steers both ways', () => {
    const start: LanderState = { x: 0, altitude: 100, vx: 0, vy: 0, fuelKg: 100 }
    expect(step(L1, start, { throttle: 0, lateral: -1 }, 1).vx).toBeLessThan(0)
    expect(step(L1, start, { throttle: 0, lateral: 1 }, 1).vx).toBeGreaterThan(0)
  })

  it('agrees with itself at different frame rates', () => {
    const start: LanderState = { x: 0, altitude: 600, vx: 3, vy: -10, fuelKg: 400 }
    const coarse = fly(L1, start, { throttle: 0.4, lateral: 0 }, 6, 1 / 20)
    const fine = fly(L1, start, { throttle: 0.4, lateral: 0 }, 6, 1 / 240)
    expect(coarse.altitude).toBeCloseTo(fine.altitude, 0)
    expect(coarse.vy).toBeCloseTo(fine.vy, 1)
  })
})

describe('verdict', () => {
  const onPad = { x: 0, altitude: 0, vx: 0, vy: -1, fuelKg: 10 }

  it('says nothing while it is still in the air', () => {
    expect(verdict(L1, { ...onPad, altitude: 12 })).toBe('flying')
  })

  it('accepts a gentle, upright touchdown on the pad', () => {
    expect(verdict(L1, onPad)).toBe('safe')
    expect(isSafe(verdict(L1, onPad))).toBe(true)
  })

  it('calls a fast descent a hard landing', () => {
    expect(verdict(L1, { ...onPad, vy: -(L1.maxTouchdownVyMs + 0.2) })).toBe('hard')
  })

  it('tips over when it is still sliding', () => {
    expect(verdict(L1, { ...onPad, vx: L1.maxTouchdownVxMs + 0.3 })).toBe('tipped')
    expect(verdict(L1, { ...onPad, vx: -(L1.maxTouchdownVxMs + 0.3) })).toBe('tipped')
  })

  it('reports missing the pad before anything else', () => {
    const missed = { ...onPad, x: L1.padHalfWidthM + 5, vy: -40, vx: 20 }
    expect(verdict(L1, missed)).toBe('off-pad')
  })

  it('treats the stated limits as allowed, not as failures', () => {
    expect(verdict(L1, { ...onPad, vy: -L1.maxTouchdownVyMs })).toBe('safe')
    expect(verdict(L1, { ...onPad, vx: L1.maxTouchdownVxMs })).toBe('safe')
    expect(verdict(L1, { ...onPad, x: L1.padHalfWidthM })).toBe('safe')
  })

  it('explains every outcome in words', () => {
    for (const v of ['safe', 'hard', 'tipped', 'off-pad'] as const) {
      expect(verdictReason(v).length).toBeGreaterThan(20)
    }
  })
})

describe('levels', () => {
  it('has three levels, in order', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3])
  })

  it('squeezes the margin at every step', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      const prev = LEVELS[i - 1]!
      const cur = LEVELS[i]!
      expect(cur.fuelKg).toBeLessThan(prev.fuelKg)
      expect(cur.padHalfWidthM).toBeLessThan(prev.padHalfWidthM)
      expect(cur.startAltitudeM).toBeGreaterThan(prev.startAltitudeM)
      expect(cur.maxTouchdownVyMs).toBeLessThanOrEqual(prev.maxTouchdownVyMs)
    }
  })

  it('starts every descent already falling and off-centre', () => {
    for (const cfg of LEVELS) {
      const s = initialState(cfg)
      expect(s.vy).toBeLessThan(0)
      expect(Math.abs(s.x)).toBeGreaterThan(cfg.padHalfWidthM)
      expect(s.fuelKg).toBe(cfg.fuelKg)
    }
  })

  it('falls back to level 1 for an unknown level', () => {
    expect(levelConfig(42 as 1).id).toBe(1)
  })

  it('is beatable: a plain autopilot lands every level safely', () => {
    for (const cfg of LEVELS) {
      const { state, seconds } = autoLand(cfg)
      expect(verdict(cfg, state), `level ${cfg.id}`).toBe('safe')
      expect(state.fuelKg, `level ${cfg.id} fuel left`).toBeGreaterThan(0)
      expect(seconds).toBeLessThan(400)
    }
  })

  it('is not a walkover: the hardest level lands on fumes', () => {
    const cfg = levelConfig(3)
    const { state } = autoLand(cfg)
    expect(state.fuelKg / cfg.fuelKg).toBeLessThan(0.5)
  })

  it('cannot be beaten by doing nothing', () => {
    for (const cfg of LEVELS) {
      let s = initialState(cfg)
      while (s.altitude > 0) s = step(cfg, s, { throttle: 0, lateral: 0 }, 1 / 60)
      expect(verdict(cfg, s), `level ${cfg.id}`).not.toBe('safe')
    }
  })

  it('cannot be beaten by holding the engine wide open either', () => {
    for (const cfg of LEVELS) {
      let s = initialState(cfg)
      let t = 0
      while (s.altitude > 0 && t < 400) {
        s = step(cfg, s, { throttle: 1, lateral: 0 }, 1 / 60)
        t += 1 / 60
      }
      // Either it burns the tank dry and falls, or it drifts off the pad.
      expect(verdict(cfg, s), `level ${cfg.id}`).not.toBe('safe')
    }
  })
})

describe('scoreLanding', () => {
  const base = {
    verdictValue: 'safe' as const,
    fuelKg: 100,
    startFuelKg: 500,
    touchdownVyMs: -1,
    offsetM: 0,
    padHalfWidthM: 40,
    level: 1 as const,
  }

  it('scores nothing for anything but a safe landing', () => {
    for (const v of ['hard', 'tipped', 'off-pad', 'flying'] as const) {
      expect(scoreLanding({ ...base, verdictValue: v })).toBe(0)
    }
  })

  it('pays for fuel saved', () => {
    expect(scoreLanding({ ...base, fuelKg: 300 })).toBeGreaterThan(
      scoreLanding({ ...base, fuelKg: 50 }),
    )
  })

  it('pays for a softer touchdown', () => {
    expect(scoreLanding({ ...base, touchdownVyMs: -0.3 })).toBeGreaterThan(
      scoreLanding({ ...base, touchdownVyMs: -2.8 }),
    )
  })

  it('pays for landing near the middle of the pad', () => {
    expect(scoreLanding({ ...base, offsetM: 0 })).toBeGreaterThan(
      scoreLanding({ ...base, offsetM: 38 }),
    )
  })

  it('weights the later levels higher', () => {
    expect(scoreLanding({ ...base, level: 3 })).toBeGreaterThan(scoreLanding({ ...base, level: 1 }))
  })

  it('always returns a whole, non-negative number', () => {
    const s = scoreLanding({ ...base, fuelKg: 0, touchdownVyMs: -2.99, offsetM: 39.9 })
    expect(Number.isInteger(s)).toBe(true)
    expect(s).toBeGreaterThanOrEqual(0)
  })

  it('does not blow up on an offset past the edge of the pad', () => {
    expect(scoreLanding({ ...base, offsetM: 500 })).toBeGreaterThanOrEqual(0)
  })
})

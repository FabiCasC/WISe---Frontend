import { describe, expect, it } from 'vitest'
import {
  AIRBAG_MAX,
  BETA_CHUTE,
  LEVELS,
  MARS_G,
  bounces,
  conceptOk,
  createCraft,
  rho,
  simulate,
  speed,
  stepCraft,
  trigger,
  type Craft,
} from './rules'

const v = (c: Craft) => speed(c)

describe('the model matches the real Pathfinder numbers', () => {
  it('the heat shield alone brakes from 7300 m/s to about 400 m/s high above the ground', () => {
    let c = createCraft()
    while (v(c) > 400) c = stepCraft(c, 0.01)
    expect(c.h).toBeGreaterThan(5000)
    expect(c.t).toBeGreaterThan(60)
    expect(c.t).toBeLessThan(200)
  })

  it('under the parachute the lander still falls at about 70 m/s near the ground', () => {
    const terminal = Math.sqrt((2 * BETA_CHUTE * MARS_G) / rho(100))
    expect(terminal).toBeGreaterThan(55)
    expect(terminal).toBeLessThan(80)
    expect(terminal).toBeGreaterThan(AIRBAG_MAX * 2)
  })

  it('Earth-thick air would make the same parachute enough on its own', () => {
    const earthTerminal = Math.sqrt((2 * BETA_CHUTE * 9.8) / 1.2)
    expect(earthTerminal).toBeLessThan(AIRBAG_MAX)
  })
})

describe('level 1: the heat shield brakes first', () => {
  const player = LEVELS[1].player

  it('opening the parachute at the real moment lands safely', () => {
    const r = simulate({ chute: (c) => v(c) <= 450 }, player)
    expect(r.landing.ok).toBe(true)
    expect(conceptOk(1, r.craft, r.landing)).toBe(true)
  })

  it('opening it too early, at high speed, tears it and the lander crashes', () => {
    const r = simulate({ chute: (c) => v(c) < 2000 }, player)
    expect(r.craft.chute).toBe('torn')
    expect(r.landing.ok).toBe(false)
    expect(conceptOk(1, r.craft, r.landing)).toBe(false)
  })

  it('never opening it is a crash', () => {
    const r = simulate({}, player)
    expect(r.landing.ok).toBe(false)
  })
})

describe('level 2: a parachute is not enough in thin air', () => {
  const player = LEVELS[2].player

  it('without the rockets the lander hits too fast even with airbags', () => {
    const r = simulate({}, player)
    expect(r.craft.airbags).toBe(true)
    expect(r.landing.impact).toBeGreaterThan(AIRBAG_MAX)
    expect(r.landing.ok).toBe(false)
    expect(conceptOk(2, r.craft, r.landing)).toBe(false)
  })

  it('firing at about 100 m works', () => {
    const r = simulate({ rockets: (c) => c.h <= 100 }, player)
    expect(r.landing.ok).toBe(true)
    expect(r.landing.impact).toBeLessThan(20)
    expect(conceptOk(2, r.craft, r.landing)).toBe(true)
  })

  it('there is a window: anywhere from about 90 m to 150 m works', () => {
    for (const h of [90, 100, 120, 150]) {
      expect(simulate({ rockets: (c) => c.h <= h }, player).landing.ok).toBe(true)
    }
  })

  it('too early burns out high up; too late hits the ground', () => {
    expect(simulate({ rockets: (c) => c.h <= 600 }, player).landing.ok).toBe(false)
    expect(simulate({ rockets: (c) => c.h <= 30 }, player).landing.ok).toBe(false)
  })
})

describe('level 3: airbags take the hit', () => {
  const player = LEVELS[3].player
  const good = {
    chute: (c: Craft) => v(c) <= 450,
    airbags: (c: Craft) => c.h <= 1000,
    rockets: (c: Craft) => c.h <= 100,
    cut: (c: Craft) => c.rocketsAt !== null && c.t - c.rocketsAt > 2,
  }

  it('the full sequence lands and bounces at least 15 times', () => {
    const r = simulate(good, player)
    expect(r.landing.ok).toBe(true)
    expect(conceptOk(3, r.craft, r.landing)).toBe(true)
    expect(bounces(r.landing.impact).length).toBeGreaterThanOrEqual(15)
  })

  it('forgetting the airbags breaks the lander', () => {
    const { airbags: _skip, ...noBags } = good
    const r = simulate(noBags, player)
    expect(r.landing.ok).toBe(false)
    expect(conceptOk(3, r.craft, r.landing)).toBe(false)
  })

  it('cutting the cord far too high drops the lander too fast', () => {
    const r = simulate({ ...good, cut: (c: Craft) => c.rocketsAt !== null && c.h < 250 }, player)
    expect(r.landing.ok).toBe(false)
  })

  it('never cutting the cord buries the lander under the parachute', () => {
    const { cut: _skip, ...noCut } = good
    const r = simulate(noCut, player)
    expect(r.landing.ok).toBe(false)
  })

  it('airbags cannot inflate while the heat shield is still on', () => {
    const c = createCraft()
    expect(trigger(c, 'airbags').ok).toBe(false)
  })
})

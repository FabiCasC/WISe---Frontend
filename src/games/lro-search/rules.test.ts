import { describe, expect, it } from 'vitest'
import {
  LEVELS,
  LM_HEIGHT,
  brightnessContrast,
  goodLight,
  makeScene,
  shadowLength,
  tap,
  trailVisibility,
} from './rules'

describe('shadows reveal tall things when the Sun is low', () => {
  const scene = makeScene(1)
  const lm = scene.things.find((t) => t.kind === 'lm')!
  const boulders = scene.things.filter((t) => t.kind === 'boulder')

  it('the scene is the same every time (fair for every student)', () => {
    expect(makeScene(1)).toEqual(scene)
  })

  it('boulders are about as wide as the lander, so from above they look alike', () => {
    const wide = boulders.filter((b) => b.size > 3.4).length
    expect(wide).toBeGreaterThan(5)
  })

  it('with a low Sun the lander throws by far the longest shadow', () => {
    const lmShadow = shadowLength(lm.height, 12)
    const maxBoulder = Math.max(...boulders.map((b) => shadowLength(b.height, 12)))
    expect(lmShadow).toBeGreaterThan(maxBoulder * 1.6)
    expect(shadowLength(LM_HEIGHT, 12)).toBeGreaterThan(14)
  })

  it('with a high Sun the shadow almost disappears', () => {
    expect(shadowLength(lm.height, 70)).toBeLessThan(1.5)
  })

  it('tapping the end of the long shadow finds the lander only when the shadow is there', () => {
    const p = { x: lm.x + shadowLength(lm.height, 12) - 1, y: lm.y }
    expect(tap(1, scene, p, 12, [])).toEqual({ kind: 'target', id: 'lm' })
    expect(tap(1, scene, p, 70, [])).toEqual({ kind: 'miss' })
  })

  it('the right light for level 1 is a low Sun', () => {
    expect(goodLight(1, 12)).toBe(true)
    expect(goodLight(1, 70)).toBe(false)
  })
})

describe('a high Sun brings out brightness differences', () => {
  it('contrast grows as the Sun climbs', () => {
    expect(brightnessContrast(70)).toBeGreaterThan(brightnessContrast(12) * 3)
  })

  it('a faint footpath is invisible at 12° and clear at 70°', () => {
    expect(trailVisibility(12)).toBe(0)
    expect(trailVisibility(70)).toBeGreaterThan(0.8)
  })

  it('the ALSEP sits at the end of the trail and can be tapped', () => {
    const scene = makeScene(2)
    const alsep = scene.things.find((t) => t.kind === 'alsep')!
    const trail = scene.paths[0].points
    const end = trail[trail.length - 1]
    expect(Math.hypot(end.x - alsep.x, end.y - alsep.y)).toBeLessThan(1)
    expect(tap(2, scene, alsep, 70, [])).toEqual({ kind: 'target', id: 'alsep' })
    expect(goodLight(2, 70)).toBe(true)
    expect(goodLight(2, 12)).toBe(false)
  })
})

describe('before and after: new objects versus new shadows', () => {
  const scene = makeScene(3)
  const sun = LEVELS[3].passes[0].sun

  it('the lander, Surveyor 3 and the tracks are the new things', () => {
    const lm = scene.things.find((t) => t.kind === 'lm')!
    const sv = scene.things.find((t) => t.kind === 'surveyor')!
    const mid = scene.paths[0].points[7]
    expect(tap(3, scene, lm, sun, [])).toEqual({ kind: 'target', id: 'lm' })
    expect(tap(3, scene, sv, sun, [])).toEqual({ kind: 'target', id: 'surveyor' })
    expect(tap(3, scene, mid, sun, [])).toEqual({ kind: 'target', id: 'tracks' })
  })

  it('a boulder whose shadow changed is only a lighting difference', () => {
    const b = scene.things.find((t) => t.kind === 'boulder' && Math.hypot(t.x - 120, t.y - 90) > 20)!
    expect(tap(3, scene, b, sun, [])).toEqual({ kind: 'lighting' })
  })

  it('the 1967 picture had a lower Sun, so shadows really are different', () => {
    expect(LEVELS[3].beforeSun!).toBeLessThan(sun)
    expect(shadowLength(1, LEVELS[3].beforeSun!)).toBeGreaterThan(shadowLength(1, sun) * 2)
  })

  it('a thing already found is not found twice', () => {
    const lm = scene.things.find((t) => t.kind === 'lm')!
    expect(tap(3, scene, lm, sun, ['lm']).kind).not.toBe('target')
  })
})

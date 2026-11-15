import { describe, expect, it } from 'vitest'
import {
  DSN_IDS,
  LEVELS,
  SITES,
  coverage,
  longestBlackoutMin,
  norm180,
  passed,
  sees,
  snapLon,
} from './rules'

const lonOf = (id: string) => SITES.find((s) => s.id === id)!.lon

describe('a dish sees the probe only above its horizon', () => {
  it('sees it when facing it and not from the far side', () => {
    expect(sees(0, 0)).toBe(true)
    expect(sees(0, 80)).toBe(true)
    expect(sees(0, 81)).toBe(false)
    expect(sees(0, 180)).toBe(false)
  })

  it('normalises angles', () => {
    expect(norm180(190)).toBe(-170)
    expect(norm180(-190)).toBe(170)
    expect(snapLon(-116.9)).toBe(-120)
  })
})

describe('coverage over one day', () => {
  it('one dish loses the probe for more than half the day', () => {
    expect(coverage([0])).toBeLessThan(0.5)
    expect(longestBlackoutMin([0])).toBeGreaterThan(12 * 60)
  })

  it('two opposite dishes pass level 1 but still have blackouts', () => {
    expect(coverage([0, 180])).toBeGreaterThanOrEqual(LEVELS[1].goal)
    expect(longestBlackoutMin([0, 180])).toBeGreaterThan(0)
    expect(passed([0, 180], LEVELS[1])).toBe(true)
    // Two dishes side by side do not.
    expect(passed([0, 30], LEVELS[1])).toBe(false)
  })

  it('three dishes 120 degrees apart give a full day', () => {
    expect(coverage([0, 120, -120])).toBe(1)
    expect(longestBlackoutMin([0, 120, -120])).toBe(0)
    expect(passed([0, 120, -120], LEVELS[2])).toBe(true)
  })

  it('three dishes bunched together leave a long blackout', () => {
    expect(passed([0, 30, 60], LEVELS[2])).toBe(false)
    expect(longestBlackoutMin([0, 30, 60])).toBeGreaterThan(6 * 60)
  })

  it('the real Deep Space Network covers the whole day', () => {
    const dsn = DSN_IDS.map(lonOf)
    expect(passed(dsn, LEVELS[3])).toBe(true)
  })

  it('three sites in the Americas fail', () => {
    expect(passed(['goldstone', 'houston', 'florida'].map(lonOf), LEVELS[3])).toBe(false)
  })
})

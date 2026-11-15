/**
 * KEEP THE LINK - pure rules (no DOM, tested with Vitest).
 * -------------------------------------------------------------------------
 * Real idea (NASA, Deep Space Network): to talk to a far probe an antenna
 * must have it above its horizon. The Earth turns once a day, so a single
 * dish loses the probe for about half of every day. NASA built three
 * complexes, Goldstone (California), Madrid (Spain) and Canberra
 * (Australia), "strategically equidistant for full coverage".
 *
 * Model, seen from above the North Pole: the probe sits far away in one
 * fixed direction (angle 0). A dish at longitude `lon` points at angle
 * `lon + rotation`. It sees the probe while that angle is within HALF_VIEW
 * degrees of the probe: about 80 degrees, i.e. the probe is more than
 * ~10 degrees above the local horizon. One degree of rotation = 4 minutes.
 */

/** Half of the sky slice a dish can see, in degrees. */
export const HALF_VIEW = 80

/** Minutes of Earth rotation per degree (1440 min / 360 deg). */
export const MIN_PER_DEG = 4

export function norm360(a: number): number {
  return ((a % 360) + 360) % 360
}

/** Signed difference in (-180, 180]. */
export function norm180(a: number): number {
  const n = norm360(a)
  return n > 180 ? n - 360 : n
}

export function sees(lon: number, rotation: number, half = HALF_VIEW): boolean {
  return Math.abs(norm180(lon + rotation)) <= half
}

/** Dishes that see the probe at this rotation. */
export function inView(dishes: number[], rotation: number, half = HALF_VIEW): number[] {
  return dishes.filter((lon) => sees(lon, rotation, half))
}

/** 360 booleans, one per degree of rotation: is there contact? */
export function contactTimeline(dishes: number[], half = HALF_VIEW): boolean[] {
  const out: boolean[] = []
  for (let r = 0; r < 360; r++) out.push(inView(dishes, r, half).length > 0)
  return out
}

/** Fraction of the day with contact, 0..1. */
export function coverage(dishes: number[], half = HALF_VIEW): number {
  const t = contactTimeline(dishes, half)
  return t.filter(Boolean).length / 360
}

/** Longest blackout of the day, in minutes (circular: wraps midnight). */
export function longestBlackoutMin(dishes: number[], half = HALF_VIEW): number {
  const t = contactTimeline(dishes, half)
  if (t.every((c) => !c)) return 360 * MIN_PER_DEG
  let best = 0
  let run = 0
  // Two laps so a gap that crosses the end of the array is counted once whole.
  for (let i = 0; i < 720; i++) {
    if (!t[i % 360]) {
      run++
      best = Math.max(best, Math.min(run, 360))
    } else run = 0
  }
  return best * MIN_PER_DEG
}

export interface Site {
  id: string
  name: string
  lon: number
}

/**
 * Level 3 offers real places. NASA's three are in the list together with
 * decoys that bunch up on the same side of the planet.
 */
export const SITES: Site[] = [
  { id: 'goldstone', name: 'Goldstone, USA', lon: -116.9 },
  { id: 'houston', name: 'Houston, USA', lon: -95.4 },
  { id: 'florida', name: 'Florida, USA', lon: -80.6 },
  { id: 'madrid', name: 'Madrid, Spain', lon: -4.2 },
  { id: 'paris', name: 'Paris, France', lon: 2.4 },
  { id: 'nairobi', name: 'Nairobi, Kenya', lon: 36.8 },
  { id: 'tokyo', name: 'Tokyo, Japan', lon: 139.7 },
  { id: 'canberra', name: 'Canberra, Australia', lon: 149.0 },
]

export const DSN_IDS = ['goldstone', 'madrid', 'canberra']

export interface LevelSpec {
  name: string
  /** Dishes you must place before the day can run. */
  dishes: number
  /** Coverage needed to pass, 0..1. */
  goal: number
  /** Only these sites can hold a dish; null = any longitude (snapped). */
  sites: Site[] | null
  intro: string
}

export const LEVELS: Record<1 | 2 | 3, LevelSpec> = {
  1: {
    name: 'One dish is not enough',
    dishes: 2,
    goal: 0.85,
    sites: null,
    intro:
      'A dish only hears the probe while the probe is above its horizon. Run a day with one dish and watch the Earth turn it away. Then place two dishes so the link stays up at least 85% of the day.',
  },
  2: {
    name: 'No blackouts',
    dishes: 3,
    goal: 1,
    sites: null,
    intro:
      'Mission control wants contact 24 hours a day. You have three dishes. Where must they go so there is never a blackout?',
  },
  3: {
    name: 'Pick real places',
    dishes: 3,
    goal: 1,
    sites: SITES,
    intro:
      'Now choose from real places on the map. Three dishes, zero blackouts. Can you find a set that works, and the one NASA really built?',
  },
}

/** Longitudes are snapped so placing a dish by touch is easy. */
export const SNAP = 15

export function snapLon(lon: number): number {
  return norm180(Math.round(lon / SNAP) * SNAP)
}

export function passed(dishes: number[], spec: LevelSpec): boolean {
  return dishes.length === spec.dishes && coverage(dishes) >= spec.goal - 1e-9
}

/** 0..1000: coverage first, fewer test runs a little better. */
export function scoreLink(cov: number, runs: number): number {
  return Math.max(100, Math.round(cov * 1000) - Math.max(0, runs - 1) * 50)
}

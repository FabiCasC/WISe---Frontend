/**
 * SEEN FROM ORBIT - pure rules (no DOM, tested with Vitest).
 * -------------------------------------------------------------------------
 * Real facts behind the mechanic (NASA Photojournal PIA12889, PIA12897,
 * PIA12909, PIA12922; NASA "LRO Looks at Apollo 12, Surveyor 3 Landing
 * Sites"; NSSDCA Apollo 11 LM):
 *   - The Lunar Reconnaissance Orbiter (launched 18 June 2009) photographed
 *     the Apollo landing sites with its Narrow Angle Camera. The lunar
 *     module descent stages, the ALSEP experiments and the astronauts'
 *     footpaths can be seen.
 *   - At Apollo 14 the ALSEP sits about 180 m west of the lunar module,
 *     joined by a well-worn footpath.
 *   - When LRO passed over Apollo 11 again with the Sun 28° higher, the
 *     shadows were smaller and subtle brightness differences stood out.
 *   - Compared with a 1967 Lunar Orbiter photo, the LRO image of Apollo 12
 *     shows the lunar module, Surveyor 3 (about 155 m away) and astronaut
 *     tracks; the ground near the lunar module is brighter where the rocket
 *     exhaust blasted it.
 *   - The descent stage is 4.2 m across, its bottom 1.5 m above the ground
 *     and 1.7 m thick: about 3.2 m tall.
 *
 * Game model: a top-down image with the Sun shining from the left. A thing
 * of height h throws a shadow h / tan(elevation) long. Brightness
 * differences (footpaths, blasted soil) show more as the Sun climbs.
 * Positions are invented; sizes are realistic.
 */
import { createRng } from '../shared/rng'

/** Metres shown across the image and pixels per metre. */
export const IMG = { w: 320, h: 210, ppm: 2 }
export const LM_SIZE = 4.2
export const LM_HEIGHT = 3.2

export interface Thing {
  id: string
  kind: 'boulder' | 'lm' | 'alsep' | 'surveyor'
  x: number
  y: number
  /** Diameter, m. */
  size: number
  height: number
  /** 0..1 how bright it looks from above. */
  albedo: number
}

export interface Crater {
  x: number
  y: number
  r: number
}

export interface Path {
  id: string
  points: { x: number; y: number }[]
}

export interface Scene {
  things: Thing[]
  craters: Crater[]
  paths: Path[]
  /** Brighter ground blasted by the landing rocket. */
  blast: { x: number; y: number; r: number } | null
}

export interface Pass {
  label: string
  sun: number
}

export type TargetId = 'lm' | 'alsep' | 'surveyor' | 'tracks'

export interface LevelSpec {
  name: string
  mode: 'search' | 'compare'
  passes: Pass[]
  /** How many passes you can order. */
  maxPasses: number
  targets: TargetId[]
  /** Level 3: the Sun angle of the old 1967 picture. */
  beforeSun: number | null
  maxMistakes: number
  intro: string
  goal: string
}

/** 0 = the guided practice round (Level 0): an easy, friendly scene. */
export type Lvl = 0 | 1 | 2 | 3

export const LEVELS: Record<Lvl, LevelSpec> = {
  0: {
    name: 'Learn to look',
    mode: 'search',
    passes: [
      { label: 'Noon pass · Sun 70°', sun: 70 },
      { label: 'Morning pass · Sun 12°', sun: 12 },
    ],
    maxPasses: 2,
    targets: ['lm'],
    beforeSun: null,
    // Practice never loses: this only keeps the hearts honest if it is ever used.
    maxMistakes: 99,
    intro: 'Meet LRO, a space camera! Pick a time for the photo, then tap the lunar module.',
    goal: 'Find the lunar module',
  },
  1: {
    name: 'Long shadows',
    mode: 'search',
    passes: [
      { label: 'Noon pass · Sun 70°', sun: 70 },
      { label: 'Morning pass · Sun 12°', sun: 12 },
    ],
    maxPasses: 2,
    targets: ['lm'],
    beforeSun: null,
    maxMistakes: 4,
    intro: 'Hide and seek on the Moon! Pick a photo time, then tap the lunar module. Tall things throw long shadows.',
    goal: 'Find the lunar module',
  },
  2: {
    name: 'Footpaths',
    mode: 'search',
    passes: [
      { label: 'Morning pass · Sun 12°', sun: 12 },
      { label: 'Noon pass · Sun 70°', sun: 70 },
    ],
    maxPasses: 2,
    targets: ['alsep'],
    beforeSun: null,
    maxMistakes: 4,
    intro: 'The astronauts left a dark trail of footprints. Follow it to the science station!',
    goal: 'Follow the trail to the ALSEP',
  },
  3: {
    name: 'Before and after',
    mode: 'compare',
    passes: [{ label: 'LRO pass · Sun 45°', sun: 45 }],
    maxPasses: 1,
    targets: ['lm', 'surveyor', 'tracks'],
    beforeSun: 15,
    maxMistakes: 5,
    intro: 'Hold the button to see the old 1967 photo. Tap only what is NEW. A moved shadow is not new!',
    goal: 'Tap the 3 new things',
  },
}

/** Shadow length on the ground, metres. */
export function shadowLength(height: number, sunDeg: number): number {
  return height / Math.tan((Math.max(1, sunDeg) * Math.PI) / 180)
}

/** How strongly albedo (brightness) differences show, 0..1. */
export function brightnessContrast(sunDeg: number): number {
  return Math.sin((Math.max(0, Math.min(90, sunDeg)) * Math.PI) / 180)
}

/** How visible a faint footpath is: needs a high Sun and no long shadows. */
export function trailVisibility(sunDeg: number): number {
  return Math.max(0, brightnessContrast(sunDeg) - 0.35) / 0.65
}

export function makeScene(level: Lvl): Scene {
  const rng = createRng('lro-' + level)
  const things: Thing[] = []
  const craters: Crater[] = []
  const lm = level === 0 ? { x: 200, y: 105 } : level === 2 ? { x: 230, y: 120 } : level === 3 ? { x: 120, y: 90 } : { x: rng.range(80, 240), y: rng.range(50, 160) }
  const far = (x: number, y: number, d: number) => Math.hypot(x - lm.x, y - lm.y) > d
  // Keep craters off the hardware and the trails, so nothing hides inside a bowl.
  const keepClear = level === 2 ? [lm, { x: 185, y: 95 }, { x: 140, y: 70 }] : level === 3 ? [lm, { x: 175, y: 105 }, { x: 230, y: 140 }] : [lm]
  for (let i = 0; craters.length < (level === 0 ? 6 : 9) && i < 200; i++) {
    const cr = { x: rng.range(20, IMG.w - 20), y: rng.range(20, IMG.h - 20), r: rng.range(6, 18) }
    if (keepClear.every((k) => Math.hypot(cr.x - k.x, cr.y - k.y) > cr.r + 34)) craters.push(cr)
  }
  // Boulders, about as wide as the lander but much lower.
  for (let i = 0; things.length < (level === 0 ? 22 : 46) && i < 400; i++) {
    const x = rng.range(10, IMG.w - 10)
    const y = rng.range(10, IMG.h - 10)
    if (!far(x, y, 12)) continue
    const size = rng.range(2.2, 4.8)
    things.push({ id: 'b' + i, kind: 'boulder', x, y, size, height: size * rng.range(0.2, 0.38), albedo: rng.range(0.65, 0.95) })
  }
  things.push({ id: 'lm', kind: 'lm', x: lm.x, y: lm.y, size: LM_SIZE, height: LM_HEIGHT, albedo: 0.85 })
  const paths: Path[] = []
  let blast: Scene['blast'] = null
  if (level === 2) {
    // ALSEP about 90 m away (scaled from Apollo 14's 180 m), joined by a winding trail.
    const ax = 140
    const ay = 70
    things.push({ id: 'alsep', kind: 'alsep', x: ax, y: ay, size: 2, height: 0.5, albedo: 0.9 })
    const pts = []
    for (let k = 0; k <= 12; k++) {
      const t = k / 12
      pts.push({ x: lm.x + (ax - lm.x) * t, y: lm.y + (ay - lm.y) * t + Math.sin(t * Math.PI * 2) * 10 })
    }
    paths.push({ id: 'trail', points: pts })
    // A decoy: other small bright things far from the trail.
    things.push({ id: 'decoy1', kind: 'boulder', x: 60, y: 160, size: 2, height: 0.6, albedo: 0.95 })
    things.push({ id: 'decoy2', kind: 'boulder', x: 280, y: 30, size: 2, height: 0.6, albedo: 0.95 })
  }
  if (level === 3) {
    // Surveyor 3 about 155 m away, inside its crater (scaled to fit).
    const sx = 230
    const sy = 140
    craters.push({ x: sx, y: sy, r: 26 })
    things.push({ id: 'surveyor', kind: 'surveyor', x: sx, y: sy, size: 3, height: 3, albedo: 0.8 })
    const pts = []
    for (let k = 0; k <= 14; k++) {
      const t = k / 14
      pts.push({ x: lm.x + (sx - lm.x) * t, y: lm.y + (sy - lm.y) * t - Math.sin(t * Math.PI) * 22 })
    }
    paths.push({ id: 'tracks', points: pts })
    blast = { x: lm.x, y: lm.y, r: 16 }
  }
  return { things, craters, paths, blast }
}

/** Is a point (metres) on a thing or its shadow under this Sun? */
export function hitThing(t: Thing, p: { x: number; y: number }, sunDeg: number, slack = 2.5): boolean {
  const r = t.size / 2 + slack
  if (Math.hypot(p.x - t.x, p.y - t.y) <= r) return true
  // Shadow points away from the Sun (to the right).
  const len = shadowLength(t.height, sunDeg)
  return p.x >= t.x && p.x <= t.x + len + slack && Math.abs(p.y - t.y) <= t.size / 2 + slack * 0.6
}

function distToSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l2 = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

export function hitPath(path: Path, p: { x: number; y: number }, slack = 3.5): boolean {
  for (let i = 1; i < path.points.length; i++) if (distToSegment(p, path.points[i - 1], path.points[i]) <= slack) return true
  return false
}

export type TapResult =
  | { kind: 'target'; id: TargetId }
  | { kind: 'lighting' }
  | { kind: 'miss' }

/**
 * What did the tap land on? Targets first; on level 3 a tap on a boulder or
 * crater is a "lighting" change (its shadow differs from 1967, nothing new).
 */
export function tap(level: Lvl, scene: Scene, p: { x: number; y: number }, sunDeg: number, found: TargetId[]): TapResult {
  const spec = LEVELS[level]
  for (const id of spec.targets) {
    if (found.includes(id)) continue
    if (id === 'tracks') {
      const path = scene.paths.find((x) => x.id === 'tracks')
      // Tracks near the lander count only away from it (the lander is its own target).
      if (path && hitPath(path, p) && Math.hypot(p.x - path.points[0].x, p.y - path.points[0].y) > 8) return { kind: 'target', id }
      continue
    }
    const t = scene.things.find((x) => x.kind === id)
    if (t && hitThing(t, p, sunDeg)) return { kind: 'target', id }
  }
  if (spec.mode === 'compare') {
    for (const t of scene.things) if (t.kind === 'boulder' && hitThing(t, p, sunDeg)) return { kind: 'lighting' }
    for (const c of scene.craters) if (Math.hypot(p.x - c.x, p.y - c.y) <= c.r) return { kind: 'lighting' }
  }
  return { kind: 'miss' }
}

export type Seen = 'lm' | 'alsep' | 'surveyor' | 'tracks' | 'boulder' | 'crater' | 'ground'

/**
 * What is under the finger? Used to show the NAME of whatever a child taps,
 * whether or not it is the thing being searched for.
 */
export function identify(scene: Scene, p: { x: number; y: number }, sunDeg: number): Seen {
  for (const kind of ['lm', 'alsep', 'surveyor'] as const) {
    const t = scene.things.find((x) => x.kind === kind)
    if (t && hitThing(t, p, sunDeg)) return kind
  }
  const path = scene.paths.find((x) => x.id === 'tracks')
  if (path && hitPath(path, p)) return 'tracks'
  for (const t of scene.things) if (t.kind === 'boulder' && hitThing(t, p, sunDeg, 1.5)) return 'boulder'
  for (const c of scene.craters) if (Math.hypot(p.x - c.x, p.y - c.y) <= c.r) return 'crater'
  return 'ground'
}

/** The lighting choice each search level teaches. */
export function goodLight(level: Lvl, sunDeg: number): boolean {
  if (level === 0 || level === 1) return sunDeg <= 30
  if (level === 2) return sunDeg >= 50
  return true
}

export function conceptFor(level: Lvl): string {
  return level <= 1 ? 'sombra-revela-altura' : level === 2 ? 'sol-alto-revela-brillo' : 'cambio-o-iluminacion'
}

export function scoreSearch(mistakes: number, passesUsed: number): number {
  return Math.max(100, 1000 - mistakes * 120 - (passesUsed - 1) * 200)
}

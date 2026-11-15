/**
 * MOON BUGGY RUN - pure rules (no DOM, tested with Vitest).
 * -------------------------------------------------------------------------
 * Real facts behind the mechanic (NASA NSSDCA, "The Apollo Lunar Roving
 * Vehicle"):
 *   - Three rovers were driven on the Moon (Apollo 15, 16 and 17) and left
 *     there. Each was used on three traverses, one per day.
 *   - Power came from two 36-volt silver-zinc batteries that were NOT
 *     rechargeable (121 amp-hours).
 *   - A navigation computer kept track of the overall direction and distance
 *     back to the lunar module (LM).
 *   - Farthest the rovers got from their LM: 5.0 km (Apollo 15), 4.5 km
 *     (Apollo 16) and 7.6 km (Apollo 17).
 *
 * Game rules: the map is seen from above in metres. Battery is counted in
 * metres of driving. The walk-back circle (level 2 and 3) is a game version
 * of Apollo traverse planning: if the rover broke down, the crew had to be
 * able to walk back to the LM. Its radius here is a game number.
 */

export interface Vec {
  x: number
  y: number
}

export interface Crater extends Vec {
  r: number
}

export interface Station extends Vec {
  name: string
}

export interface LevelSpec {
  name: string
  /** Battery, in metres of driving. */
  batteryM: number
  /** Walk-back circle radius around the LM, or null. */
  walkRadius: number | null
  /** You only see this far around the rover, or null for the whole map. */
  sight: number | null
  stations: Station[]
  craters: Crater[]
  intro: string
  goal: string
}

export const MAP = { w: 4000, h: 3500 }
export const LM: Vec = { x: 2000, y: 1750 }
/** Game speed (time is sped up: real rovers were much slower). */
export const MAX_SPEED = 190
export const REVERSE_SPEED = 60
export const ACCEL = 260
export const TURN_RATE = 2.4
export const PICKUP_R = 90
export const HOME_R = 110
export const ROVER_R = 20

export const LEVELS: Record<1 | 2 | 3, LevelSpec> = {
  1: {
    name: 'No charger on the Moon',
    batteryM: 6000,
    walkRadius: null,
    sight: null,
    stations: [
      { name: 'Elbow', x: 2000, y: 800 },
      { name: 'St. George', x: 3000, y: 1750 },
      { name: 'Spur', x: 2000, y: 2700 },
    ],
    craters: [
      { x: 2600, y: 1150, r: 170 },
      { x: 1350, y: 1600, r: 220 },
      { x: 2650, y: 2400, r: 160 },
      { x: 1500, y: 2700, r: 140 },
      { x: 3400, y: 900, r: 200 },
    ],
    intro:
      'The rover runs on two batteries that cannot be recharged. Visit the three stations to collect rocks and drive back to the lunar module before the battery runs out. Plan a short loop!',
    goal: 'Collect 3 samples and return to the LM',
  },
  2: {
    name: 'Walking distance',
    batteryM: 9000,
    walkRadius: 1400,
    sight: null,
    stations: [
      { name: 'Station 1', x: 2000, y: 450 },
      { name: 'Station 2', x: 3300, y: 1750 },
      { name: 'Station 3', x: 1300, y: 2300 },
    ],
    craters: [
      { x: 2650, y: 1100, r: 480 },
      { x: 1500, y: 1150, r: 180 },
      { x: 2400, y: 2500, r: 200 },
    ],
    intro:
      'If the rover breaks down, you must walk back to the lunar module with the air in your suit. Never drive outside the dashed walk-back circle. A big crater is in the way: go around it on the safe side.',
    goal: 'Collect 3 samples without leaving the circle',
  },
  3: {
    name: 'Find the way home',
    batteryM: 8500,
    walkRadius: 1750,
    sight: 420,
    stations: [
      { name: 'Station 1', x: 800, y: 1000 },
      { name: 'Station 2', x: 3200, y: 2600 },
    ],
    craters: [
      { x: 1500, y: 1450, r: 200 },
      { x: 2000, y: 2150, r: 230 },
      { x: 2600, y: 1900, r: 180 },
      { x: 1200, y: 700, r: 130 },
      { x: 2900, y: 2900, r: 150 },
      { x: 2500, y: 1350, r: 160 },
    ],
    intro:
      'The hills hide the lunar module. Like the real rover, yours has a navigation computer that always points home and tells you how far it is. Collect 2 samples and use the arrow to find your way back.',
    goal: 'Collect 2 samples and follow the arrow home',
  },
}

export interface Rover extends Vec {
  heading: number
  speed: number
  battery: number
  driven: number
  collected: boolean[]
}

export interface Controls {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  /** Touch steering: drive toward this point (overrides keys). */
  target?: Vec | null
}

export function createRover(spec: LevelSpec): Rover {
  return {
    x: LM.x + 150,
    y: LM.y + 40,
    heading: -Math.PI / 2,
    speed: 0,
    battery: spec.batteryM,
    driven: 0,
    collected: spec.stations.map(() => false),
  }
}

export const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y)

function angleDiff(a: number, b: number): number {
  let d = a - b
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

/** Compass bearing (0 = map north/up, clockwise, degrees) from a to b. */
export function bearingDeg(a: Vec, b: Vec): number {
  const deg = (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI
  return (deg + 360) % 360
}

/** One step. `infinite` battery is practice mode. Returns a NEW rover. */
export function stepRover(spec: LevelSpec, r: Rover, ctrl: Controls, dt: number, infinite = false): Rover {
  let { heading, speed } = r
  const powered = infinite || r.battery > 0
  let want = 0
  let steer = 0
  if (ctrl.target) {
    const desired = Math.atan2(ctrl.target.y - r.y, ctrl.target.x - r.x)
    const d = angleDiff(desired, heading)
    steer = Math.max(-1, Math.min(1, d * 2))
    const far = dist(r, ctrl.target)
    want = far < 30 ? 0 : Math.abs(d) > 1.6 ? MAX_SPEED * 0.25 : Math.min(MAX_SPEED, far * 1.2)
  } else {
    if (ctrl.forward) want = MAX_SPEED
    else if (ctrl.back) want = -REVERSE_SPEED
    steer = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0)
  }
  if (!powered) want = 0
  // Speed approaches the wanted value.
  const dv = want - speed
  const maxDv = ACCEL * dt * (want === 0 ? 1.4 : 1)
  speed += Math.max(-maxDv, Math.min(maxDv, dv))
  // You can only steer while rolling.
  const roll = Math.min(1, Math.abs(speed) / 50)
  heading += steer * TURN_RATE * roll * dt * Math.sign(speed || 1)

  let x = r.x + Math.cos(heading) * speed * dt
  let y = r.y + Math.sin(heading) * speed * dt
  x = Math.max(ROVER_R, Math.min(MAP.w - ROVER_R, x))
  y = Math.max(ROVER_R, Math.min(MAP.h - ROVER_R, y))

  // Craters block the way: the rover stops at the rim.
  for (const c of spec.craters) {
    const d = Math.hypot(x - c.x, y - c.y)
    const min = c.r + ROVER_R
    if (d < min) {
      const k = min / (d || 1)
      x = c.x + (x - c.x) * k
      y = c.y + (y - c.y) * k
      speed *= 0.3
    }
  }

  const moved = Math.hypot(x - r.x, y - r.y)
  const battery = infinite ? r.battery : Math.max(0, r.battery - moved)
  const collected = r.collected.map((got, i) => got || dist({ x, y }, spec.stations[i]) <= PICKUP_R)
  return { x, y, heading, speed, battery, driven: r.driven + moved, collected }
}

export type Status = 'driving' | 'won' | 'battery' | 'too-far'

export function insideWalkBack(spec: LevelSpec, p: Vec): boolean {
  return spec.walkRadius === null || dist(p, LM) <= spec.walkRadius
}

export function status(spec: LevelSpec, r: Rover): Status {
  if (!insideWalkBack(spec, r)) return 'too-far'
  const all = r.collected.every(Boolean)
  if (all && dist(r, LM) <= HOME_R) return 'won'
  if (r.battery <= 0 && Math.abs(r.speed) < 1) return 'battery'
  return 'driving'
}

export function conceptFor(level: 1 | 2 | 3): string {
  return level === 1 ? 'bateria-no-recargable' : level === 2 ? 'distancia-caminando-al-lm' : 'navegar-de-vuelta-al-lm'
}

export function scoreRun(spec: LevelSpec, r: Rover): number {
  return Math.round(400 + (r.battery / spec.batteryM) * 600)
}

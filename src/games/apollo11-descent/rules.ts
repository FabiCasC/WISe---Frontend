/**
 * LAND THE EAGLE - pure rules (no DOM, tested with Vitest).
 * -------------------------------------------------------------------------
 * Real facts behind the mechanic (NASA NSSDCA + NASA History):
 *   - Surface gravity of the Moon: 1.62 m/s², Earth: 9.80 m/s² (ratio 0.165,
 *     about one sixth).
 *   - The Apollo lunar module was two stages. The descent stage, with its
 *     landing rocket and four legs (9.4 m between opposite footpads), was the
 *     launch platform for the ascent stage and was LEFT BEHIND on the Moon.
 *   - Apollo 11: Armstrong saw the computer taking Eagle into a boulder-strewn
 *     area, took manual control and flew past it to smoother ground. The
 *     low-fuel light came on at about 100 feet with about 90 s of hover left.
 *
 * Game model (simplified, in metres and seconds): a side view. The main
 * engine gives a fixed push upwards; two small side jets push left/right.
 * Fuel is counted in seconds of main-engine burn. The safe touchdown limits
 * (2 m/s down, 1 m/s sideways) are game numbers.
 */

export const MOON_G = 1.62
export const EARTH_G = 9.8
/** Push of the main engine, m/s². Bigger than Moon gravity, smaller than Earth's. */
export const ENGINE_ACCEL = 4.2
/** Push of the side jets, m/s². */
export const JET_ACCEL = 1.4
/** Fuel (seconds of main burn) used per second of side jets. */
export const JET_FUEL = 0.2
/** Distance between opposite footpads of the real lunar module, m. */
export const LEG_SPAN = 9.4
export const SAFE_VY = 2
export const SAFE_VX = 1
/** Max height difference under the legs to count as flat ground, m. */
export const FLAT_TOLERANCE = 0.6
export const WORLD_W = 200

export interface Lander {
  x: number
  /** Height of the footpads above the datum, m. */
  y: number
  vx: number
  /** Positive = going up. */
  vy: number
  fuel: number
  burning: boolean
}

export interface Controls {
  thrust: boolean
  left: boolean
  right: boolean
}

export type GroundKind = 'flat' | 'rocks'

export interface Zone {
  x0: number
  x1: number
  kind: GroundKind
}

export interface LevelSpec {
  name: string
  start: { x: number; y: number; vx: number; vy: number }
  fuel: number
  jets: boolean
  zones: Zone[]
  intro: string
  goal: string
}

export const LEVELS: Record<1 | 2 | 3, LevelSpec> = {
  1: {
    name: 'One-sixth gravity',
    start: { x: 100, y: 120, vx: 0, vy: -4 },
    fuel: 20,
    jets: false,
    zones: [{ x0: 0, x1: WORLD_W, kind: 'flat' }],
    intro:
      'The Moon pulls six times weaker than the Earth. Hold the engine to slow your fall and touch down slower than 2 m/s. You only have a little fuel, and on the Moon a little is enough.',
    goal: 'Touch down slower than 2 m/s',
  },
  2: {
    name: 'Stop the drift',
    start: { x: 26, y: 115, vx: 8, vy: -3 },
    fuel: 18,
    jets: true,
    zones: [{ x0: 0, x1: WORLD_W, kind: 'flat' }],
    intro:
      'You are coming in sideways at 8 m/s. Land with the side speed close to zero, or the legs catch the ground and the lander tips over. Use the side jets.',
    goal: 'Side speed under 1 m/s at touchdown',
  },
  3: {
    name: 'Fly past the boulders',
    start: { x: 80, y: 120, vx: 2, vy: -3 },
    fuel: 22,
    jets: true,
    zones: [
      { x0: 0, x1: 40, kind: 'rocks' },
      { x0: 40, x1: 54, kind: 'flat' },
      { x0: 54, x1: 150, kind: 'rocks' },
      { x0: 150, x1: 184, kind: 'flat' },
      { x0: 184, x1: WORLD_W, kind: 'rocks' },
    ],
    intro:
      'Like Apollo 11, the autopilot is taking you into a field of boulders. Look for smooth ground, fly there with the side jets and land with all four legs on flat ground.',
    goal: 'Land on flat ground, not on boulders',
  },
}

/** Boulder heights are fixed per metre, so the same field is drawn and tested. */
export function boulderHeight(x: number): number {
  const i = Math.floor(x)
  const h = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1
  return h > 0.55 ? 0.8 + (h - 0.55) * 4 : 0
}

export function zoneAt(spec: LevelSpec, x: number): GroundKind {
  for (const z of spec.zones) if (x >= z.x0 && x < z.x1) return z.kind
  return 'rocks'
}

/** Ground height at x (0 on flat ground, boulders in rock fields). */
export function groundAt(spec: LevelSpec, x: number): number {
  return zoneAt(spec, x) === 'rocks' ? boulderHeight(x) : 0
}

/** Highest and lowest ground under the four legs. */
export function groundUnder(spec: LevelSpec, x: number): { max: number; min: number } {
  let max = -Infinity
  let min = Infinity
  for (let dx = -LEG_SPAN / 2; dx <= LEG_SPAN / 2 + 1e-9; dx += 0.5) {
    const g = groundAt(spec, x + dx)
    if (g > max) max = g
    if (g < min) min = g
  }
  return { max, min }
}

export function createLander(spec: LevelSpec): Lander {
  return { ...spec.start, fuel: spec.fuel, burning: false }
}

/**
 * One physics step. `infiniteFuel` is practice mode. Returns a NEW lander.
 */
export function stepLander(
  l: Lander,
  ctrl: Controls,
  dt: number,
  opts: { gravity?: number; jets?: boolean; infiniteFuel?: boolean } = {}
): Lander {
  const g = opts.gravity ?? MOON_G
  const jets = opts.jets ?? true
  let fuel = l.fuel
  const hasFuel = opts.infiniteFuel || fuel > 0
  const burning = ctrl.thrust && hasFuel
  let ax = 0
  let ay = -g
  if (burning) {
    ay += ENGINE_ACCEL
    if (!opts.infiniteFuel) fuel -= dt
  }
  if (jets && hasFuel && ctrl.left !== ctrl.right) {
    ax = ctrl.left ? -JET_ACCEL : JET_ACCEL
    if (!opts.infiniteFuel) fuel -= JET_FUEL * dt
  }
  const vx = l.vx + ax * dt
  const vy = l.vy + ay * dt
  return {
    x: l.x + vx * dt,
    y: l.y + vy * dt,
    vx,
    vy,
    fuel: Math.max(0, fuel),
    burning,
  }
}

export interface Touchdown {
  verticalOk: boolean
  sideOk: boolean
  flatOk: boolean
  landed: boolean
  reason: string
}

/** Has the lander reached the ground under its legs? */
export function touchingGround(spec: LevelSpec, l: Lander): boolean {
  return l.y <= groundUnder(spec, l.x).max
}

export function outOfZone(l: Lander): boolean {
  return l.x < LEG_SPAN / 2 || l.x > WORLD_W - LEG_SPAN / 2 || l.y > 155
}

export function judgeTouchdown(spec: LevelSpec, l: Lander): Touchdown {
  const under = groundUnder(spec, l.x)
  const verticalOk = -l.vy <= SAFE_VY
  const sideOk = Math.abs(l.vx) <= SAFE_VX
  const flatOk = zoneAt(spec, l.x - LEG_SPAN / 2) === 'flat' && zoneAt(spec, l.x + LEG_SPAN / 2) === 'flat' && under.max - under.min <= FLAT_TOLERANCE
  const landed = verticalOk && sideOk && flatOk
  const problems: string[] = []
  if (!verticalOk) problems.push('You hit the ground at ' + (-l.vy).toFixed(1) + ' m/s, too fast for the legs.')
  if (!sideOk) problems.push('You were still sliding sideways at ' + Math.abs(l.vx).toFixed(1) + ' m/s, so the legs caught the ground.')
  if (!flatOk) problems.push('A leg came down on a boulder and the lander tipped over.')
  const reason = landed ? 'Contact light! The Eagle has landed.' : problems.join(' ')
  return { verticalOk, sideOk, flatOk, landed, reason }
}

/** The one idea each level checks, reported to the teacher dashboard. */
export function conceptOk(level: 1 | 2 | 3, t: Touchdown): boolean {
  if (level === 1) return t.verticalOk
  if (level === 2) return t.sideOk
  return t.flatOk
}

export function scoreLanding(t: Touchdown, fuelLeft: number, vy: number): number {
  if (!t.landed) return 0
  return Math.round(500 + fuelLeft * 30 + Math.max(0, SAFE_VY + vy) * 100)
}

export function conceptFor(level: 1 | 2 | 3): string {
  return level === 1 ? 'gravedad-lunar-sexta-parte' : level === 2 ? 'velocidad-horizontal-cero' : 'elegir-terreno-plano'
}

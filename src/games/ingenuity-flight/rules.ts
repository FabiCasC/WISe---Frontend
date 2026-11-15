/**
 * INGENUITY: FLY IN THIN AIR - pure rules (no DOM, tested with Vitest).
 * -------------------------------------------------------------------------
 * Real facts behind the mechanic (NASA Science "Ingenuity Mars Helicopter",
 * NASA news releases of April 2021, January 2024 and December 2024):
 *   - Ingenuity (1.8 kg) flew in air less than 1% as dense as Earth's. For
 *     the first flight its blades spun up in about 12 s to 2,537 rpm; the
 *     plan was to hover 3 m up for up to 30 s.
 *   - Its solar panel charged batteries with enough energy for about one
 *     90-second flight per Martian day. Nights at Jezero can drop to -90 °C.
 *   - It made 72 flights (19 April 2021 – 18 January 2024). On flight 72
 *     one or more rotor blades were damaged at landing. The most likely
 *     cause: its navigation camera tracked surface features, and the steep,
 *     featureless sand ripples gave it too little texture to measure its
 *     own speed. It stays on Mars, upright.
 *
 * Game model: lift = k·ρ·rpm² (the standard rotor rule), so in air 75 times
 * thinner the rotor must spin much faster to lift the same weight. k is
 * tuned so the Mars hover speed is about 2,400 rpm. Battery is counted in
 * seconds of hover; the drift over smooth sand is a game simplification of
 * the navigation problem.
 */

export const MARS_G = 3.73
export const EARTH_G = 9.8
export const RHO_MARS = 0.016
export const RHO_EARTH = 1.2
/** Real spin speed for the first flight. */
export const FIRST_FLIGHT_RPM = 2537
/** Lift at 2537 rpm on Mars, as a fraction of Mars weight. */
const LIFT_AT_REF = 1.12
export const MAX_RPM = 2800
/**
 * Spin rates. The real blades took about 12 s to reach flight speed, but a
 * player holding a key while nothing moves reads that as a broken game, so
 * the game spins up in about 1.5 s from idle. The rule that matters (you
 * cannot lift until you pass the Mars hover speed) is untouched.
 */
export const SPIN_UP = 800 // rpm per second while holding "faster"
export const SPIN_DOWN = 700
export const TILT_ACCEL = 1.6
export const VERT_DAMP = 0.8
export const HORIZ_DAMP = 0.5
/** Touchdown limits (game numbers). */
export const SAFE_DOWN = 1.2
export const SAFE_SIDE = 1.0
export const MAX_ALT = 25

/** Lift acceleration (m/s²) at a rotor speed and air density. */
export function liftAccel(rpm: number, rho = RHO_MARS): number {
  return MARS_G * LIFT_AT_REF * (rpm / FIRST_FLIGHT_RPM) ** 2 * (rho / RHO_MARS)
}

/** Rotor speed where lift equals weight. */
export function hoverRpm(rho = RHO_MARS, g = MARS_G): number {
  return FIRST_FLIGHT_RPM * Math.sqrt(g / (MARS_G * LIFT_AT_REF * (rho / RHO_MARS)))
}

/**
 * The blades are already turning when the flight starts, at half the Mars
 * hover speed. Two reasons: the player's first key press produces visible
 * change instead of five seconds of a rising number, and the idle speed is
 * itself the lesson — it is already far above the speed that would lift the
 * same helicopter on Earth, and on Mars it still does not leave the ground.
 */
export const IDLE_RPM = Math.round(hoverRpm() * 0.5)

export type Ground = 'pebbles' | 'ripples'

export interface Zone {
  x0: number
  x1: number
  kind: Ground
}

export interface LevelSpec {
  name: string
  worldW: number
  start: number
  battery: number
  zones: Zone[]
  /** Level 2: fly over this x above `photoAlt` to take the picture. */
  photo: { x: number; alt: number } | null
  /** Where the flight must end (x range), or null = back where you like. */
  landing: { x0: number; x1: number } | null
  /** Level 1: climb at least this high and hover this long. */
  hover: { alt: number; seconds: number } | null
  intro: string
  goal: string
}

export const LEVELS: Record<1 | 2 | 3, LevelSpec> = {
  1: {
    name: 'Spin faster',
    worldW: 50,
    start: 25,
    battery: 90,
    zones: [{ x0: 0, x1: 50, kind: 'pebbles' }],
    photo: null,
    landing: null,
    hover: { alt: 3, seconds: 6 },
    intro:
      'Mars air is less than 1% as thick as Earth’s, so the blades must spin very fast to lift you. They are already turning faster than they would ever need on Earth — and you are still on the ground. Up spins them faster, Down slower, and the speed stays where you leave it: set it and watch. Climb above 3 m, hover there 6 seconds, then land gently.',
    goal: 'Hover above 3 m, then land softly',
  },
  2: {
    name: 'One flight per sol',
    worldW: 170,
    start: 12,
    battery: 90,
    zones: [{ x0: 0, x1: 170, kind: 'pebbles' }],
    photo: { x: 105, alt: 5 },
    landing: { x0: 148, x1: 162 },
    hover: null,
    intro:
      'The solar panel charges the battery for about one 90-second flight per sol. Fly ahead of the rover, photograph the rock outcrop from at least 5 m up, and land at the new base before the battery runs out. Climbing hard uses more power!',
    goal: 'Photo from 5 m up, land at the base, 90 s of battery',
  },
  3: {
    name: 'Featureless sand',
    worldW: 150,
    start: 10,
    battery: 90,
    zones: [
      { x0: 0, x1: 24, kind: 'pebbles' },
      { x0: 24, x1: 64, kind: 'ripples' },
      { x0: 64, x1: 76, kind: 'pebbles' },
      { x0: 76, x1: 124, kind: 'ripples' },
      { x0: 124, x1: 150, kind: 'pebbles' },
    ],
    photo: null,
    landing: { x0: 64, x1: 150 },
    hover: null,
    intro:
      'Ingenuity’s camera measures its speed by tracking pebbles on the ground. Over smooth sand ripples it cannot see enough texture and starts to drift. Fly forward and land on pebbly ground. Never land on the ripples!',
    goal: 'Land on pebbly ground beyond the first ripples',
  },
}

export interface Heli {
  t: number
  x: number
  y: number
  vx: number
  vy: number
  rpm: number
  battery: number
  airborne: boolean
  /** Highest altitude reached. */
  maxAlt: number
  /** Seconds spent above the hover altitude (level 1). */
  hoverTime: number
  photo: boolean
}

export interface Controls {
  faster: boolean
  slower: boolean
  left: boolean
  right: boolean
}

export function createHeli(spec: LevelSpec): Heli {
  return {
    t: 0,
    x: spec.start,
    y: 0,
    vx: 0,
    vy: 0,
    rpm: IDLE_RPM,
    battery: spec.battery,
    airborne: false,
    maxAlt: 0,
    hoverTime: 0,
    photo: false,
  }
}

export function groundAt(spec: LevelSpec, x: number): Ground {
  for (const z of spec.zones) if (x >= z.x0 && x < z.x1) return z.kind
  return 'pebbles'
}

/** Ground height: ripples are dunes 0..1.2 m high with steep sides. */
export function groundHeight(spec: LevelSpec, x: number): number {
  if (groundAt(spec, x) !== 'ripples') return 0
  const p = ((x % 8) + 8) % 8
  return p < 4 ? p * 0.3 : (8 - p) * 0.3
}

/** Navigation drift over smooth sand (m/s²): smooth but unpredictable to the pilot. */
export function navDrift(spec: LevelSpec, h: Heli): number {
  if (!h.airborne || groundAt(spec, h.x) !== 'ripples') return 0
  return 1.3 * Math.sin(h.t * 1.3 + h.x * 0.21) + 0.6 * Math.sin(h.t * 3.1)
}

export type Event = 'none' | 'landed' | 'crash' | 'battery'

export interface StepResult {
  heli: Heli
  event: Event
  reason: string
}

export function stepHeli(
  spec: LevelSpec,
  h: Heli,
  ctrl: Controls,
  dt: number,
  opts: { rho?: number; infinite?: boolean } = {}
): StepResult {
  const rho = opts.rho ?? RHO_MARS
  let rpm = h.rpm
  if (h.battery > 0 || opts.infinite) {
    if (ctrl.faster) rpm = Math.min(MAX_RPM, rpm + SPIN_UP * dt)
    if (ctrl.slower) rpm = Math.max(0, rpm - SPIN_DOWN * dt)
  } else rpm = Math.max(0, rpm - SPIN_DOWN * 2 * dt)

  // Power grows with the square of the rotor speed (game rule).
  const draw = (rpm / hoverRpm()) ** 2
  const battery = opts.infinite ? h.battery : Math.max(0, h.battery - draw * dt)

  const lift = liftAccel(rpm, rho)
  let ax = 0
  let ay = 0
  let { x, y, vx, vy, airborne } = h
  if (!airborne) {
    if (lift > MARS_G + 0.02) airborne = true
    else return { heli: { ...h, rpm, battery, t: h.t + dt }, event: battery <= 0 && h.battery > 0 ? 'battery' : 'none', reason: '' }
  }
  ay = lift - MARS_G - VERT_DAMP * vy
  const tilt = (ctrl.right ? 1 : 0) - (ctrl.left ? 1 : 0)
  ax = tilt * TILT_ACCEL * Math.min(1, rpm / 2000) - HORIZ_DAMP * vx + navDrift(spec, h)
  vx += ax * dt
  vy += ay * dt
  x += vx * dt
  y += vy * dt
  if (y > MAX_ALT) {
    y = MAX_ALT
    vy = Math.min(0, vy)
  }
  x = Math.max(1, Math.min(spec.worldW - 1, x))

  const hover = spec.hover
  const hoverTime = h.hoverTime + (hover && y >= hover.alt ? dt : 0)
  const photo = h.photo || (spec.photo !== null && Math.abs(x - spec.photo.x) < 4 && y >= spec.photo.alt)
  let next: Heli = { t: h.t + dt, x, y, vx, vy, rpm, battery, airborne, maxAlt: Math.max(h.maxAlt, y), hoverTime, photo }

  const gh = groundHeight(spec, x)
  if (y <= gh) {
    const kind = groundAt(spec, x)
    const down = -vy
    next = { ...next, y: gh, vy: 0, vx: 0, airborne: false }
    if (kind === 'ripples') return { heli: next, event: 'crash', reason: 'You landed on a sloping sand ripple. Ingenuity tipped and a rotor blade broke.' }
    if (down > SAFE_DOWN) return { heli: next, event: 'crash', reason: 'You came down at ' + down.toFixed(1) + ' m/s. Too hard for the landing legs.' }
    if (Math.abs(vx) > SAFE_SIDE) return { heli: next, event: 'crash', reason: 'You were still moving sideways at ' + Math.abs(vx).toFixed(1) + ' m/s and the blades hit the ground.' }
    if (h.maxAlt > 0.5) return { heli: next, event: 'landed', reason: 'Touchdown.' }
  }
  if (battery <= 0 && h.battery > 0 && next.airborne) return { heli: next, event: 'battery', reason: 'The battery is empty.' }
  return { heli: next, event: 'none', reason: '' }
}

export interface Verdict {
  won: boolean
  conceptOk: boolean
  reason: string
}

export function judge(level: 1 | 2 | 3, spec: LevelSpec, h: Heli, event: Event, reason: string): Verdict {
  if (event === 'crash' || event === 'battery') {
    // On level 3 a hard landing on pebbles still shows the right choice of ground.
    const conceptOk = level === 3 && event === 'crash' && groundAt(spec, h.x) === 'pebbles'
    return { won: false, conceptOk, reason }
  }
  if (level === 1) {
    const ok = !!spec.hover && h.hoverTime >= spec.hover.seconds
    return { won: ok, conceptOk: ok, reason: ok ? 'Lift-off and a soft landing.' : 'Climb above ' + spec.hover!.alt + ' m and hover there for ' + spec.hover!.seconds + ' s before landing.' }
  }
  const inZone = !spec.landing || (h.x >= spec.landing.x0 && h.x <= spec.landing.x1)
  if (level === 2) {
    const ok = h.photo && inZone
    return { won: ok, conceptOk: ok, reason: ok ? 'Photo taken and landed at the new base.' : !h.photo ? 'You landed without the photo.' : 'Land inside the yellow base zone.' }
  }
  const textured = groundAt(spec, h.x) === 'pebbles'
  const ok = inZone && textured
  return { won: ok, conceptOk: textured, reason: ok ? 'Landed safely on pebbly ground.' : 'Fly past the first ripples before landing.' }
}

export function conceptFor(level: 1 | 2 | 3): string {
  return level === 1 ? 'aire-fino-giro-rapido' : level === 2 ? 'bateria-limita-vuelo' : 'navegar-con-textura'
}

export function scoreFlight(spec: LevelSpec, h: Heli): number {
  return Math.round(500 + (h.battery / spec.battery) * 500)
}

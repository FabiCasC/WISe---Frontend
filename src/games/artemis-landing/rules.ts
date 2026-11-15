import type { LevelId } from '../../shared/types'

/**
 * ARTEMIS LANDING — pure rules
 * -------------------------------------------------------------------------
 * A lander falling towards the Moon, integrated in SI units.
 *
 * The lesson is what the Moon takes away. There is no air up there, so a
 * parachute is useless: the only thing that can slow the vehicle down is
 * its own engine, and every second of engine is fuel it will never get
 * back. Gravity is weak (1.62 m/s^2, a sixth of Earth's) but it never
 * stops pulling, so hovering to think costs more than it looks.
 *
 * Nothing here draws or reads input; everything is a value in, a value out.
 */

/** Surface gravity of the Moon, m/s^2. Earth is 9.81. */
export const MOON_G = 1.62

export interface LanderState {
  /** Horizontal position, metres. 0 is the centre of the landing pad. */
  x: number
  /** Height above the surface, metres. */
  altitude: number
  /** Horizontal speed, m/s. Positive is to the right. */
  vx: number
  /** Vertical speed, m/s. Positive is UP, so a descent is negative. */
  vy: number
  fuelKg: number
}

export interface LanderInput {
  /** Main engine, 0..1. */
  throttle: number
  /** Side thrusters: -1 left, 0 off, +1 right. */
  lateral: number
}

export interface LevelConfig {
  id: LevelId
  name: string
  /** Mass of the vehicle with no fuel in it, kg. */
  dryMassKg: number
  /** Fuel loaded at the start, kg. */
  fuelKg: number
  /** Main engine at full throttle, newtons. */
  maxThrustN: number
  /** Fuel burnt at full throttle, kg/s. */
  maxFlowKgS: number
  /** Sideways acceleration from the thrusters, m/s^2. */
  rcsAccel: number
  /** Fuel the side thrusters burn while firing, kg/s. */
  rcsFlowKgS: number
  startAltitudeM: number
  startVyMs: number
  startVxMs: number
  startXm: number
  /** Half the width of the flat pad, metres. */
  padHalfWidthM: number
  /** Fastest descent the legs can absorb, m/s. */
  maxTouchdownVyMs: number
  /** Fastest sideways drift that will not tip it over, m/s. */
  maxTouchdownVxMs: number
}

// --- Flight -----------------------------------------------------------------

/** Mass right now: structure plus whatever fuel is still aboard. */
export function totalMass(cfg: LevelConfig, fuelKg: number): number {
  return cfg.dryMassKg + Math.max(0, fuelKg)
}

/**
 * Upward acceleration from the main engine, m/s^2.
 * An empty tank produces nothing, however hard the throttle is pushed.
 */
export function thrustAccel(cfg: LevelConfig, throttle: number, fuelKg: number): number {
  if (fuelKg <= 0) return 0
  const t = Math.max(0, Math.min(1, throttle))
  return (t * cfg.maxThrustN) / totalMass(cfg, fuelKg)
}

/**
 * Throttle that exactly cancels gravity at this mass. Hovering is not free:
 * it burns this much fuel per second and buys no descent at all.
 */
export function hoverThrottle(cfg: LevelConfig, fuelKg: number): number {
  if (fuelKg <= 0) return Infinity
  return (MOON_G * totalMass(cfg, fuelKg)) / cfg.maxThrustN
}

/**
 * Advance the lander by `dtS` seconds.
 *
 * Pure: it returns a new state and never touches the one passed in. There
 * is no drag term anywhere, and that is the point — the Moon has no air.
 */
export function step(
  cfg: LevelConfig,
  state: LanderState,
  input: LanderInput,
  dtS: number,
): LanderState {
  const throttle = Math.max(0, Math.min(1, input.throttle))
  const lateral = Math.max(-1, Math.min(1, input.lateral))

  const hasFuel = state.fuelKg > 0
  const up = thrustAccel(cfg, throttle, state.fuelKg)
  const side = hasFuel ? lateral * cfg.rcsAccel : 0

  const burn = hasFuel
    ? (throttle * cfg.maxFlowKgS + Math.abs(lateral) * cfg.rcsFlowKgS) * dtS
    : 0

  const ay = up - MOON_G
  const vy = state.vy + ay * dtS
  const vx = state.vx + side * dtS

  return {
    // Trapezoidal integration: averaging the speeds over the step keeps the
    // descent honest at the frame rates a browser actually delivers.
    x: state.x + ((state.vx + vx) / 2) * dtS,
    altitude: state.altitude + ((state.vy + vy) / 2) * dtS,
    vx,
    vy,
    fuelKg: Math.max(0, state.fuelKg - burn),
  }
}

// --- Touchdown --------------------------------------------------------------

export type Verdict = 'flying' | 'safe' | 'hard' | 'tipped' | 'off-pad'

/**
 * What happened at the moment the legs reached the ground.
 *
 * Order matters: missing the pad is reported before the speeds, because a
 * gentle touchdown onto a boulder field is still not a landing.
 */
export function verdict(cfg: LevelConfig, state: LanderState): Verdict {
  if (state.altitude > 0) return 'flying'
  if (Math.abs(state.x) > cfg.padHalfWidthM) return 'off-pad'
  if (-state.vy > cfg.maxTouchdownVyMs) return 'hard'
  if (Math.abs(state.vx) > cfg.maxTouchdownVxMs) return 'tipped'
  return 'safe'
}

export function isSafe(v: Verdict): boolean {
  return v === 'safe'
}

/** Plain-language reason for the overlay. */
export function verdictReason(v: Verdict): string {
  switch (v) {
    case 'hard':
      return 'You came down too fast. With no air to slow you, the engine is the only brake there is — and it has to be lit early, not at the last second.'
    case 'tipped':
      return 'You were still sliding sideways when the legs touched, and it went over. Kill the drift before you kill the altitude.'
    case 'off-pad':
      return 'You touched down outside the flat ground. Everything around it is boulders and craters, and a leg on a rock is a lost vehicle.'
    case 'safe':
      return 'Down gently, upright, on the pad.'
    default:
      return 'Still flying.'
  }
}

// --- Levels -----------------------------------------------------------------

/**
 * Three descents at the same vehicle, with the margin squeezed out of it.
 * Level 3 carries the fuel Apollo 11 had left when it landed: enough, and
 * not a kilogram more.
 */
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Equatorial practice',
    dryMassKg: 7000,
    fuelKg: 520,
    maxThrustN: 45000,
    maxFlowKgS: 15,
    rcsAccel: 2.2,
    rcsFlowKgS: 1.4,
    startAltitudeM: 620,
    startVyMs: -22,
    startVxMs: 4,
    startXm: -150,
    padHalfWidthM: 46,
    maxTouchdownVyMs: 3,
    maxTouchdownVxMs: 1.4,
  },
  {
    id: 2,
    name: 'South pole approach',
    dryMassKg: 7000,
    fuelKg: 430,
    maxThrustN: 45000,
    maxFlowKgS: 15,
    rcsAccel: 2.2,
    rcsFlowKgS: 1.4,
    startAltitudeM: 720,
    startVyMs: -27,
    startVxMs: 7,
    startXm: -205,
    padHalfWidthM: 32,
    maxTouchdownVyMs: 2.6,
    maxTouchdownVxMs: 1.1,
  },
  {
    id: 3,
    name: 'Twenty-five seconds',
    dryMassKg: 7000,
    // Tuned against the autopilot in the tests: a careful descent lands with
    // roughly a tenth of the tank left. Less than this and only a very
    // efficient profile gets down at all, which is a worse lesson than a
    // tight one — the level should punish dithering, not competence.
    fuelKg: 420,
    maxThrustN: 45000,
    maxFlowKgS: 15,
    rcsAccel: 2.2,
    rcsFlowKgS: 1.4,
    startAltitudeM: 820,
    startVyMs: -31,
    startVxMs: 9,
    startXm: -250,
    padHalfWidthM: 22,
    maxTouchdownVyMs: 2.2,
    maxTouchdownVxMs: 0.9,
  },
]

export function levelConfig(level: LevelId): LevelConfig {
  return LEVELS.find((l) => l.id === level) ?? LEVELS[0]!
}

export function initialState(cfg: LevelConfig): LanderState {
  return {
    x: cfg.startXm,
    altitude: cfg.startAltitudeM,
    vx: cfg.startVxMs,
    vy: cfg.startVyMs,
    fuelKg: cfg.fuelKg,
  }
}

/**
 * Seconds of hovering the remaining fuel would buy at this moment. This is
 * the number that makes the fuel gauge mean something: it is not "how much
 * is left", it is "how long you can go on thinking about it".
 */
export function hoverSecondsLeft(cfg: LevelConfig, fuelKg: number): number {
  if (fuelKg <= 0) return 0
  const flow = hoverThrottle(cfg, fuelKg) * cfg.maxFlowKgS
  return flow > 0 ? fuelKg / flow : 0
}

// --- Result -----------------------------------------------------------------

export interface ScoreInput {
  verdictValue: Verdict
  fuelKg: number
  startFuelKg: number
  touchdownVyMs: number
  offsetM: number
  padHalfWidthM: number
  level: LevelId
}

/**
 * Points for a safe landing: fuel saved, softness of the touchdown and how
 * close to the middle of the pad it finished. A crash scores nothing.
 */
export function scoreLanding(input: ScoreInput): number {
  if (!isSafe(input.verdictValue)) return 0

  const fuelShare = Math.max(0, Math.min(1, input.fuelKg / input.startFuelKg))
  const softness = Math.max(0, 1 - Math.abs(input.touchdownVyMs) / 3)
  const centring = Math.max(0, 1 - Math.abs(input.offsetM) / input.padHalfWidthM)
  const levelMult = 1 + (input.level - 1) * 0.3

  return Math.max(
    0,
    Math.round((300 + fuelShare * 400 + softness * 200 + centring * 150) * levelMult),
  )
}

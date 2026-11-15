import type { LevelId } from '../../shared/types'

/**
 * DART IMPACT — pure rules
 * -------------------------------------------------------------------------
 * Every number here is SI (metres, kilograms, seconds) and comes from the
 * real mission, so the maths in the game is the maths NASA actually did.
 *
 * The lesson the player has to discover: a 570 kg spacecraft cannot "push"
 * a 4.3-billion-kilogram rock out of the way. What it can do is change its
 * SPEED by a few millimetres per second, and a slower moonlet falls into a
 * smaller, faster orbit. Direction is everything: the hit only counts when
 * it lands head-on, against the way the moonlet is already travelling.
 */

export interface Vec2 {
  x: number
  y: number
}

// --- The real Didymos system ------------------------------------------------

/**
 * Standard gravitational parameter (G·M) of Didymos, the parent asteroid.
 * Derived from the measured orbit: mu = 4*pi^2*r^3 / T^2 with r = 1190 m and
 * T = 11.92 h, which is how its mass (~5.3e11 kg) was worked out.
 */
export const DIDYMOS_MU = 36.127
/** Mean radius of Didymos, metres (~780 m across). */
export const DIDYMOS_RADIUS_M = 390
/** Radius of Dimorphos' orbit around Didymos, metres. */
export const ORBIT_RADIUS_M = 1190

// --- Vector helpers ---------------------------------------------------------

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function scale(v: Vec2, k: number): Vec2 {
  return { x: v.x * k, y: v.y * k }
}

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.y)
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

/** Unit vector. A zero vector stays zero instead of becoming NaN. */
export function unit(v: Vec2): Vec2 {
  const len = length(v)
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len }
}

/** Position on the orbit at `angle`, in metres, relative to Didymos. */
export function orbitPosition(angle: number, radiusM = ORBIT_RADIUS_M): Vec2 {
  return { x: Math.cos(angle) * radiusM, y: Math.sin(angle) * radiusM }
}

/**
 * Direction the moonlet is travelling at `angle` (unit vector).
 * The orbit runs in the direction of increasing angle.
 */
export function orbitHeading(angle: number): Vec2 {
  return { x: -Math.sin(angle), y: Math.cos(angle) }
}

// --- Orbital mechanics ------------------------------------------------------

/** Speed of a circular orbit of radius `r`, m/s. */
export function circularSpeed(mu: number, r: number): number {
  return Math.sqrt(mu / r)
}

/**
 * Semi-major axis from the vis-viva equation: v^2 = mu*(2/r - 1/a).
 * Note it depends on the SPEED only, never on the direction — which is
 * exactly why slowing the moonlet down is what shrinks its orbit.
 */
export function semiMajorAxis(mu: number, r: number, speed: number): number {
  return 1 / (2 / r - (speed * speed) / mu)
}

/** Orbital period of a semi-major axis `a`, seconds (Kepler's third law). */
export function periodSeconds(mu: number, a: number): number {
  return 2 * Math.PI * Math.sqrt((a * a * a) / mu)
}

// --- Momentum transfer ------------------------------------------------------

export interface ImpactorSpec {
  probeMassKg: number
  /** Closing speed between probe and moonlet, m/s. */
  relSpeedMs: number
  targetMassKg: number
  /**
   * Ejecta momentum multiplier. The debris blasted off the surface flies
   * away and pushes back, so the moonlet gets several times more momentum
   * than the spacecraft alone carried. DART measured beta ~ 3.6.
   */
  beta: number
}

/**
 * How much speed the moonlet gains or loses from the hit, m/s.
 * Conservation of momentum: dv = beta * (m/M) * v_rel.
 */
export function deltaVMagnitude(spec: ImpactorSpec): number {
  return (spec.beta * spec.probeMassKg * spec.relSpeedMs) / spec.targetMassKg
}

export interface ImpactOutcome {
  /** Period before the hit, seconds. */
  periodBeforeS: number
  /** Period after the hit, seconds. */
  periodAfterS: number
  /** Negative means the orbit got shorter — that is the goal. */
  changeMin: number
  /** Speed change given to the moonlet, m/s. */
  deltaVMs: number
  /**
   * -1 = perfectly head-on (all of it slows the moonlet down),
   *  0 = sideways, +1 = pushed from behind (orbit gets bigger).
   */
  alignment: number
  semiMajorAfterM: number
}

export interface ImpactInput {
  spec: ImpactorSpec
  /** Where the moonlet was on its orbit when the probe arrived, radians. */
  orbitAngle: number
  /** Direction the probe was travelling. Magnitude is ignored. */
  probeDirection: Vec2
  mu?: number
  orbitRadiusM?: number
}

/**
 * Resolve one impact: add the momentum kick to the moonlet's orbital
 * velocity, then read the new orbit straight out of vis-viva and Kepler.
 */
export function resolveImpact(input: ImpactInput): ImpactOutcome {
  const mu = input.mu ?? DIDYMOS_MU
  const r = input.orbitRadiusM ?? ORBIT_RADIUS_M

  const speed = circularSpeed(mu, r)
  const velocity = scale(orbitHeading(input.orbitAngle), speed)

  const dvMag = deltaVMagnitude(input.spec)
  const dv = scale(unit(input.probeDirection), dvMag)

  const after = add(velocity, dv)
  const semiMajorAfterM = semiMajorAxis(mu, r, length(after))

  const periodBeforeS = periodSeconds(mu, r)
  const periodAfterS = periodSeconds(mu, semiMajorAfterM)

  return {
    periodBeforeS,
    periodAfterS,
    changeMin: (periodAfterS - periodBeforeS) / 60,
    deltaVMs: dvMag,
    alignment: dot(unit(dv), unit(velocity)),
    semiMajorAfterM,
  }
}

// --- Levels -----------------------------------------------------------------

export interface LevelConfig extends ImpactorSpec {
  id: LevelId
  name: string
  /** Radius of the moonlet, metres. Doubles as the size of the target. */
  targetRadiusM: number
  /** Minutes the orbit must be shortened by to pass. */
  requiredMin: number
  /** Impactors available. The real mission had exactly one. */
  shots: number
  /** Seconds of screen time per orbit. Animation only, not physics. */
  orbitSeconds: number
  /**
   * Sideways steering authority during the terminal approach, in screen
   * pixels per second. Presentation only — it never enters the physics.
   */
  divertPxPerS: number
  /** How long the probe may steer for, seconds. */
  divertBudgetS: number
}

/**
 * Three runs at the same real system. Levels 1 and 2 are rehearsals flown
 * against a bigger, slower target; level 3 is the mission as flown.
 */
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Navigation rehearsal',
    targetMassKg: 4.3e9,
    targetRadiusM: 150,
    probeMassKg: 570,
    relSpeedMs: 6140,
    beta: 3.6,
    requiredMin: 12,
    shots: 3,
    orbitSeconds: 12,
    divertPxPerS: 150,
    divertBudgetS: 3.2,
  },
  {
    id: 2,
    name: 'Dress rehearsal',
    targetMassKg: 4.3e9,
    targetRadiusM: 110,
    probeMassKg: 570,
    relSpeedMs: 6140,
    beta: 3.6,
    requiredMin: 22,
    shots: 2,
    orbitSeconds: 9,
    divertPxPerS: 130,
    divertBudgetS: 2.4,
  },
  {
    id: 3,
    name: '26 September 2022',
    targetMassKg: 4.3e9,
    targetRadiusM: 85,
    probeMassKg: 570,
    relSpeedMs: 6140,
    beta: 3.6,
    requiredMin: 30,
    shots: 1,
    orbitSeconds: 7,
    divertPxPerS: 115,
    divertBudgetS: 1.9,
  },
]

export function levelConfig(level: LevelId): LevelConfig {
  return LEVELS.find((l) => l.id === level) ?? LEVELS[0]!
}

/**
 * Best period cut physically available with this impactor: everything the
 * probe has, delivered perfectly head-on. Used to grade a shot honestly.
 */
export function bestPossibleCutMin(spec: ImpactorSpec): number {
  const best = resolveImpact({
    spec,
    orbitAngle: 0,
    // Exactly opposite to the heading at angle 0, which is (0, 1).
    probeDirection: { x: 0, y: -1 },
  })
  return -best.changeMin
}

// --- Aiming preview ---------------------------------------------------------

export interface AimPreviewInput {
  spec: ImpactorSpec
  /** Where the probe is now. Any units, so long as every length here shares them. */
  probe: Vec2
  /**
   * Probe velocity, units per second. The line is straight: the preview
   * answers "what happens if I stop steering now?", which is the only
   * question the player can actually act on while the probe is in flight.
   */
  probeVelocity: Vec2
  /** Centre of the system, i.e. the parent asteroid. */
  center: Vec2
  /** Radius of the moonlet's orbit, in those same units. */
  orbitRadius: number
  /** Where the moonlet is right now, radians. */
  orbitAngle: number
  /** How fast the moonlet goes round, rad/s, positive with rising angle. */
  angularRateRadS: number
  /** Moonlet radius plus probe radius: how close counts as a hit. */
  captureRadius: number
  /**
   * Parent-body radius. The probe can bury itself in the big asteroid long
   * before it reaches the moonlet, and such a line is a miss, not a shot.
   */
  blockerRadius?: number
  /** How long the probe stays in play, seconds. */
  horizonS: number
  /** Walking step, seconds. Finer costs more and buys little. */
  stepS?: number
}

export interface AimPreview {
  /** False when this line never reaches the moonlet. */
  hits: boolean
  /** Seconds until the meeting. 0 on a miss. */
  timeS: number
  /** Orbit angle of the meeting, radians. 0 on a miss. */
  impactAngle: number
  /** Meeting point, in the input's units. Zero on a miss. */
  impactPoint: Vec2
  /** -1 head-on, 0 sideways, +1 from behind. 0 on a miss. */
  alignment: number
  /** Minutes the orbit would change by. Negative is the good direction. */
  changeMin: number
  /** 0..1 for a bar: the share of the best possible cut this line would land. */
  quality: number
}

/** A line that reaches nothing. Built fresh so no caller can scribble on it. */
function noContact(): AimPreview {
  return {
    hits: false,
    timeS: 0,
    impactAngle: 0,
    impactPoint: { x: 0, y: 0 },
    alignment: 0,
    changeMin: 0,
    quality: 0,
  }
}

/**
 * What the shot being lined up would actually do, worked out with the very
 * same resolveImpact that settles the real hit — so the readout on screen
 * can never promise the player more than the impact delivers.
 *
 * The probe flies straight while the moonlet keeps circling, so there is no
 * closed form for where the two meet: the line is walked forward in small
 * steps until they overlap, which is exactly how the game's own collision
 * check works frame by frame.
 */
export function previewImpact(input: AimPreviewInput): AimPreview {
  const step = input.stepS ?? 0.01
  if (length(input.probeVelocity) === 0 || input.horizonS <= 0 || step <= 0) return noContact()

  const blocker = input.blockerRadius ?? 0
  let hitTime = -1
  let hitAngle = 0
  let point: Vec2 = { x: 0, y: 0 }

  for (let t = 0; t <= input.horizonS; t += step) {
    const px = input.probe.x + input.probeVelocity.x * t
    const py = input.probe.y + input.probeVelocity.y * t

    // Crashing into the parent body ends the run before the moonlet matters.
    if (blocker > 0 && Math.hypot(px - input.center.x, py - input.center.y) <= blocker) {
      return noContact()
    }

    const angle = input.orbitAngle + input.angularRateRadS * t
    const m = orbitPosition(angle, input.orbitRadius)
    const mx = input.center.x + m.x
    const my = input.center.y + m.y
    if (Math.hypot(px - mx, py - my) <= input.captureRadius) {
      hitTime = t
      hitAngle = angle
      point = { x: mx, y: my }
      break
    }
  }

  if (hitTime < 0) return noContact()

  const outcome = resolveImpact({
    spec: input.spec,
    orbitAngle: hitAngle,
    probeDirection: input.probeVelocity,
  })

  // Measured against the best this impactor can physically do, so a full
  // bar means there is nothing left to steer for.
  const best = bestPossibleCutMin(input.spec)

  return {
    hits: true,
    timeS: hitTime,
    impactAngle: hitAngle,
    impactPoint: point,
    alignment: outcome.alignment,
    changeMin: outcome.changeMin,
    quality: best <= 0 ? 0 : Math.max(0, Math.min(1, -outcome.changeMin / best)),
  }
}

// --- Result -----------------------------------------------------------------

/** A shot passes only when it SHORTENS the orbit by at least the target. */
export function shotPassed(changeMin: number, requiredMin: number): boolean {
  return changeMin <= -requiredMin
}

export interface ScoreInput {
  changeMin: number
  requiredMin: number
  shotsUsed: number
  totalShots: number
  level: LevelId
}

/**
 * Points for a passing shot: the size of the cut, weighted by level, plus a
 * bonus for every impactor left unused. A failed shot scores nothing.
 */
export function scoreShot(input: ScoreInput): number {
  if (!shotPassed(input.changeMin, input.requiredMin)) return 0
  const cut = Math.abs(input.changeMin)
  const levelMult = 1 + (input.level - 1) * 0.25
  const spare = Math.max(0, input.totalShots - input.shotsUsed)
  return Math.max(0, Math.round(cut * 12 * levelMult + spare * 40))
}

/** Plain-language grade for the overlay, from how head-on the hit was. */
export function hitGrade(alignment: number): 'head-on' | 'angled' | 'glancing' | 'wrong way' {
  if (alignment > 0.1) return 'wrong way'
  if (alignment > -0.5) return 'glancing'
  if (alignment > -0.9) return 'angled'
  return 'head-on'
}

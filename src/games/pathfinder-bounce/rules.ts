/**
 * PATHFINDER BOUNCE - pure rules (no DOM, tested with Vitest).
 * -------------------------------------------------------------------------
 * Real facts behind the mechanic (NASA NSSDCA "Mars Pathfinder", NASA
 * Science "Mars Pathfinder", NSSDCA Mars Fact Sheet):
 *   - Pathfinder hit the top of the Martian air on 4 July 1997 at about
 *     7300 m/s. The heat shield slowed it to 400 m/s in about 160 s.
 *   - Then a 12.5 m parachute opened and slowed it to about 70 m/s. The heat
 *     shield dropped 20 s later and the lander slid down a 20 m tether.
 *   - About 10 s before landing four airbags inflated. At 98 m three solid
 *     rockets fired, and about 2 s later the tether was cut 21.5 m above the
 *     ground. The lander hit at about 18 m/s and bounced at least 15 times.
 *   - Mars: gravity 3.73 m/s², air density at the surface ~0.016 kg/m³
 *     (Earth ~1.2), scale height 11 km.
 *
 * Model: a 2D point falling through an exponential atmosphere with drag
 * a = rho·v²/(2β). β (ballistic coefficient) changes with the hardware:
 * the heat-shield capsule, the parachute, the lander alone. These β, the
 * rocket push and the safe limits are game numbers tuned so the speeds
 * match the real ones above.
 */

export const MARS_G = 3.73
export const RHO0 = 0.016
export const SCALE_H = 11000
export const ENTRY = { h: 125000, v: 7300, angleDeg: 14 }
export const BETA_SHIELD = 40
export const BETA_CHUTE = 9
export const BETA_LANDER = 60
/** Opening the parachute faster than this tears it (game limit). */
export const CHUTE_MAX_SPEED = 600
/** The real parachute opened at about this speed. */
export const CHUTE_REAL_SPEED = 400
export const SHIELD_DROP_DELAY = 20
export const ROCKET_ACCEL = 32
export const ROCKET_TIME = 2
/** Airbags survive hitting the ground this fast (game limit). */
export const AIRBAG_MAX = 26
/** Without airbags the lander survives only a gentle touch (game limit). */
export const NO_AIRBAG_MAX = 3
export const REAL = { airbagsAt: 300, rocketsAt: 98, cutAt: 21.5 }

export type ChuteState = 'packed' | 'open' | 'torn'

export interface Craft {
  t: number
  h: number
  vx: number
  vy: number
  chute: ChuteState
  shieldOn: boolean
  chuteAt: number | null
  airbags: boolean
  rocketsAt: number | null
  cut: boolean
  /** Speed when the parachute opened (for the report). */
  chuteSpeed: number | null
}

export type EventId = 'chute' | 'airbags' | 'rockets' | 'cut'

export interface LevelSpec {
  name: string
  /** Events the player triggers; the rest happen on their own. */
  player: EventId[]
  intro: string
  goal: string
}

export const LEVELS: Record<1 | 2 | 3, LevelSpec> = {
  1: {
    name: 'Let the heat shield work',
    player: ['chute'],
    intro:
      'You hit the top of the Martian air at 7300 m/s. The heat shield does the first braking. Open the parachute when the speed has dropped enough: open it too fast and it tears.',
    goal: 'Open the parachute below 600 m/s',
  },
  2: {
    name: 'Thin air',
    player: ['rockets'],
    intro:
      'Mars air is only about 1% as thick as Earth’s. Even a huge parachute only slows you to about 70 m/s: too fast for the airbags. Fire the braking rockets close to the ground, not too early, not too late.',
    goal: 'Fire the rockets in the yellow zone (about 100 m)',
  },
  3: {
    name: 'Bounce to a stop',
    player: ['chute', 'airbags', 'rockets', 'cut'],
    intro:
      'Now you run the whole landing: parachute, airbags, rockets, and cut the cord so the lander drops in its ball of airbags. Watch it bounce!',
    goal: 'Parachute, airbags, rockets, cut the cord',
  },
}

export function rho(h: number): number {
  return RHO0 * Math.exp(-Math.max(0, h) / SCALE_H)
}

export function createCraft(): Craft {
  const a = (ENTRY.angleDeg * Math.PI) / 180
  return {
    t: 0,
    h: ENTRY.h,
    vx: ENTRY.v * Math.cos(a),
    vy: -ENTRY.v * Math.sin(a),
    chute: 'packed',
    shieldOn: true,
    chuteAt: null,
    airbags: false,
    rocketsAt: null,
    cut: false,
    chuteSpeed: null,
  }
}

export const speed = (c: Craft) => Math.hypot(c.vx, c.vy)

export function rocketsBurning(c: Craft): boolean {
  return c.rocketsAt !== null && c.t - c.rocketsAt < ROCKET_TIME && !c.cut
}

export function beta(c: Craft): number {
  if (c.cut) return BETA_LANDER
  if (c.chute === 'open') return BETA_CHUTE
  return BETA_SHIELD
}

/** Physics step (real seconds). Returns a NEW craft. */
export function stepCraft(c: Craft, dt: number): Craft {
  const v = speed(c) || 1e-6
  let ax = 0
  let ay = -MARS_G
  const drag = (rho(c.h) * v * v) / (2 * beta(c))
  ax -= (drag * c.vx) / v
  ay -= (drag * c.vy) / v
  if (rocketsBurning(c)) {
    // The rockets push against the motion (mostly straight up).
    ax -= (ROCKET_ACCEL * c.vx) / v
    ay -= (ROCKET_ACCEL * c.vy) / v
  }
  let vx = c.vx + ax * dt
  let vy = c.vy + ay * dt
  // Rockets can stop the fall but not lift the lander back up.
  if (rocketsBurning(c) && vy > 0) vy = 0
  if (Math.abs(vx) < 1e-6) vx = 0
  const t = c.t + dt
  const shieldOn = c.shieldOn && !(c.chuteAt !== null && t - c.chuteAt >= SHIELD_DROP_DELAY)
  return { ...c, t, vx, vy, h: c.h + vy * dt, shieldOn }
}

export interface EventResult {
  craft: Craft
  ok: boolean
  message: string
}

export function trigger(c: Craft, id: EventId): EventResult {
  if (id === 'chute') {
    if (c.chute !== 'packed') return { craft: c, ok: false, message: 'The parachute is already out.' }
    const v = speed(c)
    if (v > CHUTE_MAX_SPEED) {
      return {
        craft: { ...c, chute: 'torn', chuteAt: c.t, chuteSpeed: v },
        ok: false,
        message: 'Too fast! The parachute tore at ' + Math.round(v) + ' m/s.',
      }
    }
    return { craft: { ...c, chute: 'open', chuteAt: c.t, chuteSpeed: v }, ok: true, message: 'Parachute open at ' + Math.round(v) + ' m/s' }
  }
  if (id === 'airbags') {
    if (c.airbags) return { craft: c, ok: false, message: 'The airbags are already full.' }
    if (c.shieldOn) return { craft: c, ok: false, message: 'Wait: the heat shield must drop first.' }
    return { craft: { ...c, airbags: true }, ok: true, message: 'Airbags inflated' }
  }
  if (id === 'rockets') {
    if (c.rocketsAt !== null) return { craft: c, ok: false, message: 'The rockets already fired.' }
    if (c.chute !== 'open' || c.shieldOn) return { craft: c, ok: false, message: 'Not yet: the rockets fire under the parachute, near the ground.' }
    return { craft: { ...c, rocketsAt: c.t }, ok: true, message: 'Rockets fired at ' + Math.round(c.h) + ' m' }
  }
  if (c.cut) return { craft: c, ok: false, message: 'The cord is already cut.' }
  if (c.chute !== 'open' || c.shieldOn) return { craft: c, ok: false, message: 'Not yet: the lander is still inside the shell.' }
  return { craft: { ...c, cut: true }, ok: true, message: 'Cord cut at ' + Math.round(c.h) + ' m' }
}

/**
 * The events the player does NOT control happen on their own, at the real
 * moments: parachute at 400 m/s, airbags at ~300 m, rockets at 98 m, cord
 * cut at 21.5 m (or right after the rockets burn out, if lower).
 */
export function autoEvents(c: Craft, player: EventId[]): Craft {
  let x = c
  if (!player.includes('chute') && x.chute === 'packed' && speed(x) <= CHUTE_REAL_SPEED) x = trigger(x, 'chute').craft
  if (!player.includes('airbags') && !x.airbags && !x.shieldOn && x.h <= REAL.airbagsAt) x = trigger(x, 'airbags').craft
  if (!player.includes('rockets') && x.rocketsAt === null && x.chute === 'open' && !x.shieldOn && x.h <= REAL.rocketsAt)
    x = trigger(x, 'rockets').craft
  if (!player.includes('cut') && !x.cut && x.rocketsAt !== null && x.h <= REAL.cutAt) x = trigger(x, 'cut').craft
  if (!player.includes('cut') && !x.cut && x.rocketsAt !== null && !rocketsBurning(x) && x.h < 40) x = trigger(x, 'cut').craft
  return x
}

export interface Landing {
  impact: number
  ok: boolean
  airbagsWorked: boolean
  reason: string
}

export function judgeLanding(c: Craft): Landing {
  const impact = speed(c)
  const limit = c.airbags ? AIRBAG_MAX : NO_AIRBAG_MAX
  const tangled = !c.cut && c.chute === 'open'
  let reason = ''
  if (c.chute === 'torn') reason = 'The torn parachute could not slow the lander.'
  else if (c.chute === 'packed') reason = 'The parachute never opened.'
  else if (!c.airbags) reason = 'No airbags: the lander hit the rocks unprotected.'
  else if (impact > limit) reason = 'You hit the ground at ' + Math.round(impact) + ' m/s. The airbags only survive up to ' + AIRBAG_MAX + ' m/s.'
  else if (tangled) reason = 'The cord was never cut: the parachute and the shell came down on top of the lander.'
  const ok = reason === ''
  return { impact, ok, airbagsWorked: c.airbags && impact <= AIRBAG_MAX, reason: ok ? 'Touchdown on Mars!' : reason }
}

export function conceptOk(level: 1 | 2 | 3, c: Craft, l: Landing): boolean {
  if (level === 1) return c.chute === 'open'
  if (level === 2) return c.rocketsAt !== null && l.ok
  return l.airbagsWorked && c.cut
}

/** How much faster the clock runs on screen at this altitude. */
export function warp(h: number, chuteOpen: boolean): number {
  if (h > 20000) return 9
  if (!chuteOpen && h > 2000) return 3
  if (h > 1200) return 9
  if (h > 450) return 3
  return 0.55
}

/** Heights of the bounces after a good landing (first ~12 m, at least 15). */
export function bounces(impact: number): number[] {
  const out: number[] = []
  let hgt = Math.max(3, Math.min(15, impact * 0.7))
  while (out.length < 16 || hgt > 0.25) {
    out.push(hgt)
    hgt *= 0.72
    if (out.length > 30) break
  }
  return out
}

export function scoreLanding(l: Landing): number {
  if (!l.ok) return 0
  return Math.round(400 + Math.max(0, AIRBAG_MAX - l.impact) * 30)
}

/** Simulates a whole descent with a fixed plan (used by tests and nowhere else). */
export function simulate(
  plan: Partial<Record<EventId, (c: Craft) => boolean>>,
  player: EventId[],
  dt = 0.01
): { craft: Craft; landing: Landing; log: string[] } {
  let c = createCraft()
  const log: string[] = []
  for (let i = 0; i < 600 / dt && c.h > 0; i++) {
    for (const id of player) {
      const when = plan[id]
      if (when && when(c)) {
        const r = trigger(c, id)
        if (r.craft !== c) log.push(r.message)
        c = r.craft
      }
    }
    c = autoEvents(c, player)
    c = stepCraft(c, dt)
  }
  return { craft: c, landing: judgeLanding(c), log }
}

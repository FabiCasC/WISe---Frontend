/**
 * EAGLE LIFTOFF - pure rules (no DOM, tested with Vitest).
 * -------------------------------------------------------------------------
 * Real mission (NASA Apollo 11 mission overview; NSSDCA 1969-059C):
 *  - The lunar module had two stages. The ascent stage lifted off and the
 *    DESCENT STAGE STAYED ON THE MOON as its launch pad (it is still there).
 *  - Eagle's engine burned 435 s and put it in an orbit of 11 x 55 miles,
 *    LOWER than Columbia's (about 69 miles). It docked with Columbia about
 *    3.5 hours later.
 *  - Why lower? A lower orbit is faster (Kepler). To catch a ship ahead of
 *    you, you drop BELOW it, gain on it, then climb back to its orbit.
 *    Burning "forward" to chase it raises your orbit and slows you down.
 *
 * Model, seen from above the Moon's pole: circular orbits on fixed rings,
 * angles in degrees growing counter-clockwise. A burn moves the lander one
 * ring (a game simplification of a two-burn transfer). Angular speed follows
 * Kepler: w = W0 * r^-1.5. Time is sped up a lot.
 */

export const RINGS = [0.86, 0.9, 0.94, 1.0, 1.06] as const
export const CSM_RING = 3
/** Degrees per second on the reference ring (time is sped up). */
export const W0 = 12
/** Docking needs the same ring and a gap of at most this many degrees. */
export const DOCK_GAP = 4
/** The ascent from the pad to the insertion ring. */
export const ASCENT_SECONDS = 3
export const ASCENT_ARC = 20
export const INSERTION_RING = 2
export const LAUNCH_SITE = 90

export function omega(ring: number): number {
  return W0 * Math.pow(RINGS[ring], -1.5)
}

/** Signed angle in (-180, 180]. */
export function norm180(a: number): number {
  const n = ((a % 360) + 360) % 360
  return n > 180 ? n - 360 : n
}

export interface LevelSpec {
  name: string
  /** Starts on the pad (true) or already in orbit behind Columbia. */
  fromPad: boolean
  /** Columbia's lead over Eagle at the start (orbit levels). */
  startGap: number
  /** Columbia's angle at the start (pad levels). */
  csmStart: number
  burns: number
  /** Seconds allowed after reaching orbit. */
  timeLimit: number
  /** Lead that makes a good launch (pad levels): Columbia ahead, not too far. */
  window: [number, number]
  /** Level 1 flies the catch-up for you after a good launch. */
  autoCatchUp: boolean
  intro: string
}

export const LEVELS: Record<1 | 2 | 3, LevelSpec> = {
  1: {
    name: 'Launch window',
    fromPad: true,
    startGap: 0,
    csmStart: 200,
    burns: 0,
    timeLimit: 90,
    window: [8, 70],
    autoCatchUp: true,
    intro:
      'Eagle lifts off and its descent stage stays on the Moon as the launch pad. Columbia is circling above. Launch when Columbia is a little AHEAD of you: your new orbit is lower, so you will catch it up.',
  },
  2: {
    name: 'Lower is faster',
    fromPad: false,
    startGap: 50,
    csmStart: 0,
    burns: 3,
    timeLimit: 75,
    window: [0, 0],
    autoCatchUp: false,
    intro:
      'You are in Columbia\'s orbit, 50° behind it. Each burn moves you one orbit down or up. Watch the speeds on the screen: which way do you burn to catch up? Then climb back to dock.',
  },
  3: {
    name: 'Full rendezvous',
    fromPad: true,
    startGap: 0,
    csmStart: 260,
    burns: 3,
    timeLimit: 80,
    // Checked by the sweep in rules.test.ts, which refuses any window this
    // level cannot actually fly. Coasting on the insertion ring and climbing
    // once only catches a lead of ~97°, but the 3 burns granted here buy the
    // real manoeuvre (drop one orbit, close at 2.05°/s, climb back twice),
    // which catches ~160° inside the 80 s. So 100° is winnable with margin.
    window: [5, 100],
    autoCatchUp: false,
    intro:
      'The whole job, like Armstrong and Aldrin: pick the launch moment, then use at most 3 burns to reach Columbia and dock before time runs out.',
  },
}

export type Phase = 'pad' | 'ascent' | 'orbit' | 'docked' | 'failed'

export interface State {
  phase: Phase
  /** Eagle's angle and ring (ring is -1 on the pad). */
  lm: number
  ring: number
  csm: number
  burnsLeft: number
  /** Seconds in orbit. */
  t: number
  ascentT: number
  reason: string
}

export function initialState(spec: LevelSpec): State {
  if (spec.fromPad) {
    return { phase: 'pad', lm: LAUNCH_SITE, ring: -1, csm: spec.csmStart, burnsLeft: spec.burns, t: 0, ascentT: 0, reason: '' }
  }
  return { phase: 'orbit', lm: 0, ring: CSM_RING, csm: spec.startGap, burnsLeft: spec.burns, t: 0, ascentT: 0, reason: '' }
}

/** How far Columbia is ahead of Eagle (negative: Eagle is ahead). */
export function gap(s: State): number {
  return norm180(s.csm - s.lm)
}

export type Verdict = { concept: string; correct: boolean; message: string } | null

/** Lift off from the pad. Returns the launch decision. */
export function launch(s: State): Verdict {
  if (s.phase !== 'pad') return null
  s.phase = 'ascent'
  s.ascentT = 0
  return null
}

/**
 * Is this lead angle inside the level's launch window?
 *
 * Exported so the HUD can colour the gap live while Eagle is still on the
 * pad. The launch is the whole decision in level 1, and the player was
 * making it blind: the window existed only inside judgeInsertion, after the
 * fact, where it could tell you that you were wrong but never that you were
 * about to be right.
 */
export function inWindow(gapDeg: number, spec: LevelSpec): boolean {
  const [lo, hi] = spec.window
  return gapDeg >= lo && gapDeg <= hi
}

/** Judges the launch once Eagle reaches orbit. */
export function judgeInsertion(s: State, spec: LevelSpec): Verdict {
  const g = gap(s)
  const [lo, hi] = spec.window
  if (g >= lo && g <= hi) {
    return {
      concept: 'ventana-de-lanzamiento',
      correct: true,
      message: `Good launch: Columbia is ${Math.round(g)}° ahead and you are lower, so you are faster.`,
    }
  }
  return {
    concept: 'ventana-de-lanzamiento',
    correct: false,
    message:
      g < lo
        ? 'Columbia is behind you. In your lower, faster orbit you would only pull further away.'
        : `Columbia is ${Math.round(g)}° ahead: too far to catch before your oxygen and fuel run low.`,
  }
}

export const ORBIT_CONCEPT = 'orbita-baja-mas-rapida'

/**
 * Why docking can no longer happen, or null while the run is still alive.
 * Two dead ends exist, and both used to be silent until the clock ran out:
 *  - Eagle sits on Columbia's ring outside docking range with no burn left:
 *    the same ring means the same angular speed, so the gap is frozen for
 *    good and no amount of waiting closes it;
 *  - Eagle is more rings away from Columbia than it has burns left, and a
 *    burn only ever moves one ring.
 * Levels that fly the catch-up themselves (autoCatchUp) are exempt: there
 * the game closes the last ring for the player, so zero burns is normal.
 */
export function strandedReason(s: State, spec?: LevelSpec): string | null {
  if (spec?.autoCatchUp) return null
  if (s.phase !== 'orbit' || s.ring < 0) return null
  const rings = Math.abs(CSM_RING - s.ring)
  if (rings === 0) {
    if (Math.abs(gap(s)) <= DOCK_GAP || s.burnsLeft > 0) return null
    return `Stranded: you are in Columbia's orbit but ${Math.round(Math.abs(gap(s)))}° away, with no burns left. The same orbit means the same speed, so this gap can never close. Catching up needs a LOWER, faster orbit first.`
  }
  if (s.burnsLeft >= rings) return null
  const orbits = rings === 1 ? '1 orbit' : `${rings} orbits`
  const left = s.burnsLeft === 1 ? '1 burn' : `${s.burnsLeft} burns`
  return `Stranded: Columbia is ${orbits} away and you have ${left} left. Each burn moves one orbit, so you can no longer get back to it. Always keep enough fuel for the climb home.`
}

/**
 * A burn: 'down' (brake, drop to a lower and faster orbit) or 'up' (speed
 * up, climb to a higher and slower orbit). Returns a decision when the move
 * says something about the concept. `spec` is optional only so older callers
 * keep compiling; pass it so the stranding check knows the level's rules.
 */
export function burn(s: State, dir: 'up' | 'down', spec?: LevelSpec): Verdict {
  if (s.phase !== 'orbit' || s.burnsLeft <= 0) return null
  const next = s.ring + (dir === 'up' ? 1 : -1)
  if (next < 0 || next >= RINGS.length) return null
  const g = gap(s)
  s.ring = next
  s.burnsLeft -= 1
  const concept = ORBIT_CONCEPT
  // A burn can end the run on the spot. Say so here, with the reason, rather
  // than leaving the player to watch a frozen gap until the clock runs out.
  const stuck = strandedReason(s, spec)
  if (stuck) {
    s.phase = 'failed'
    s.reason = stuck
    return { concept, correct: false, message: stuck }
  }
  if (dir === 'up' && next > CSM_RING && g > DOCK_GAP * 2) {
    return { concept, correct: false, message: 'You climbed ABOVE Columbia: a higher orbit is slower, so it pulls away.' }
  }
  // Docking needs DOCK_GAP, so that is the only band worth praising. The old
  // hard-coded 12° band congratulated the player for a move that froze the
  // gap at 5-12°: unwinnable, and logged to the teacher's stats as correct.
  if (dir === 'up' && next === CSM_RING && Math.abs(g) > DOCK_GAP) {
    return {
      concept,
      correct: false,
      message: `Back in Columbia's orbit ${Math.round(Math.abs(g))}° away, outside the ${DOCK_GAP}° docking range: you now match its speed, so the gap stops closing. Drop lower again to keep gaining.`,
    }
  }
  // Dropping from ABOVE Columbia only brings you back to its speed, never
  // below it, so the gap stays stuck: praising it would teach the opposite of
  // the lesson. Only a ring under Columbia is genuinely faster.
  if (dir === 'down' && next === CSM_RING && Math.abs(g) > DOCK_GAP) {
    return {
      concept,
      correct: false,
      message: `Back in Columbia's orbit ${Math.round(Math.abs(g))}° away: the same orbit means the same speed, so the gap holds. Drop one more orbit to actually gain on it.`,
    }
  }
  if (dir === 'down' && next < CSM_RING && g > DOCK_GAP) {
    return { concept, correct: true, message: 'Lower orbit: you are now faster than Columbia and closing in.' }
  }
  if (dir === 'up' && next === CSM_RING && Math.abs(g) <= DOCK_GAP) {
    return {
      concept,
      correct: true,
      message: `Columbia's orbit with ${Math.round(Math.abs(g))}° to go, inside the ${DOCK_GAP}° docking range: your speeds match and the hatches meet.`,
    }
  }
  return null
}

/** Advances the simulation. Returns a verdict when something is decided. */
export function step(s: State, spec: LevelSpec, dt: number): Verdict {
  s.csm = (s.csm + omega(CSM_RING) * dt) % 360
  if (s.phase === 'pad') return null
  if (s.phase === 'ascent') {
    s.ascentT += dt
    s.lm = LAUNCH_SITE + ASCENT_ARC * Math.min(1, s.ascentT / ASCENT_SECONDS)
    if (s.ascentT >= ASCENT_SECONDS) {
      s.ring = INSERTION_RING
      s.phase = 'orbit'
      s.t = 0
      const v = judgeInsertion(s, spec)
      if (v && !v.correct) {
        s.phase = 'failed'
        s.reason = v.message
      }
      return v
    }
    return null
  }
  if (s.phase !== 'orbit') return null

  s.t += dt
  s.lm = (s.lm + omega(s.ring) * dt) % 360
  const g = gap(s)

  // Level 1 climbs for you once you are close.
  if (spec.autoCatchUp && s.ring < CSM_RING && Math.abs(g) <= DOCK_GAP) s.ring = CSM_RING

  if (s.ring === CSM_RING && Math.abs(g) <= DOCK_GAP) {
    s.phase = 'docked'
    return null
  }
  // Catch a dead end that no burn produced (a level that starts the player
  // already out of reach, say), so the loss is still explained, not timed out.
  const stuck = strandedReason(s, spec)
  if (stuck) {
    s.phase = 'failed'
    s.reason = stuck
    return { concept: ORBIT_CONCEPT, correct: false, message: stuck }
  }
  if (s.t >= spec.timeLimit) {
    s.phase = 'failed'
    s.reason = 'Time is up: Eagle could not reach Columbia before its supplies ran low.'
  }
  return null
}

export function conceptFor(level: 1 | 2 | 3): string {
  return level === 1 ? 'ventana-de-lanzamiento' : 'orbita-baja-mas-rapida'
}

/** 1000 for a quick, frugal docking. */
export function scoreLiftoff(s: State, spec: LevelSpec): number {
  const timeLeft = Math.max(0, spec.timeLimit - s.t)
  return Math.round(400 + timeLeft * 6 + s.burnsLeft * 60)
}

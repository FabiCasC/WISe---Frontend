/**
 * GAME 2 · "Two Signals from the Moon" · Pure rules (no Phaser, no DOM).
 *
 * Level 1: measure the distance to the Moon from a laser's round-trip time.
 * Level 2: locate a moonquake with 1, 2 and 3 stations (circles).
 * Level 3: one station fails; does the child notice that two are not enough?
 *
 * ⚠️ All physical constants are DATA to be checked against official sources
 * (NASA / NSSDCA) before the cutoff. They are here only so the game works.
 */

// ───────────────────────── Level 1: the echo of light ─────────────────────────

/** Speed of light in vacuum (exact by the definition of the metre). */
export const C_KM_S = 299_792.458
/** Semi-major axis of the Moon's orbit, about 384,400 km. ⚠️ Verify against an official source. */
export const MOON_DISTANCE_KM = 384_400
/** Accepted margin between the measured echo and the marker's echo. Adjustable. */
export const ECHO_TOLERANCE_S = 0.1

/** Round-trip time of a pulse to a given distance. */
export const echoSeconds = (km: number): number => (2 * km) / C_KM_S
/** Distance that corresponds to a round-trip time. */
export const distanceFromEcho = (seconds: number): number => (seconds * C_KM_S) / 2

export type EchoVerdict = 'match' | 'too-short' | 'too-long'
export interface EchoJudgement {
  verdict: EchoVerdict
  /** Echo the marker would produce as currently placed (shown on screen). */
  markerEchoSeconds: number
  /** Positive if the marker's echo is longer than the measured one. */
  diffSeconds: number
}

export function judgeEcho(
  markerKm: number,
  measuredSeconds: number,
  tolerance = ECHO_TOLERANCE_S,
): EchoJudgement {
  const markerEchoSeconds = echoSeconds(markerKm)
  const diffSeconds = markerEchoSeconds - measuredSeconds
  const verdict: EchoVerdict =
    Math.abs(diffSeconds) <= tolerance ? 'match' : diffSeconds < 0 ? 'too-short' : 'too-long'
  return { verdict, markerEchoSeconds, diffSeconds }
}

// ──────────────────────── Levels 2 and 3: quakes and circles ────────────────────────

export interface Vec { x: number; y: number }
export interface Station { id: string; pos: Vec; working: boolean }

/**
 * A quake on an abstract map (map units, not real km).
 * vp and vs = speeds of the P (fast) and S (slow) waves, in units/s.
 * Each station measures the delay between the arrival of P and S, and its
 * radius comes from that delay: so ONE station already gives a circle.
 */
export interface QuakeDef {
  id: string
  epicenter: Vec
  stations: Station[]
  vp: number
  vs: number
  /** Margin (in map units) to accept a circle or a point. */
  tolerance: number
}

export const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y)

/** S-P delay recorded by a station at distance d from the epicenter. */
export const spDelay = (d: number, vp: number, vs: number): number => d / vs - d / vp
/** Radius that corresponds to an S-P delay. */
export const radiusFromDelay = (delay: number, vp: number, vs: number): number =>
  (delay * vp * vs) / (vp - vs)

export interface Reading { stationId: string; delay: number }

/** What the graph of each working station shows. */
export function readings(q: QuakeDef): Reading[] {
  return q.stations
    .filter((s) => s.working)
    .map((s) => ({ stationId: s.id, delay: spDelay(dist(s.pos, q.epicenter), q.vp, q.vs) }))
}

/** Correct circle radius for a station (to validate the one the child draws). */
export function correctRadius(q: QuakeDef, stationId: string): number {
  const r = readings(q).find((x) => x.stationId === stationId)
  if (!r) throw new Error(`${q.id}: station ${stationId} is not working or does not exist`)
  return radiusFromDelay(r.delay, q.vp, q.vs)
}

export type CircleVerdict = 'ok' | 'too-small' | 'too-big'
export function judgeCircle(q: QuakeDef, stationId: string, playerRadius: number): CircleVerdict {
  const diff = playerRadius - correctRadius(q, stationId)
  return Math.abs(diff) <= q.tolerance ? 'ok' : diff < 0 ? 'too-small' : 'too-big'
}

/** Do two circles cross? If not, the game points it out. */
export function circlesCross(a: Vec, ra: number, b: Vec, rb: number): boolean {
  const d = dist(a, b)
  return d <= ra + rb && d >= Math.abs(ra - rb)
}

export function circleIntersections(a: Vec, ra: number, b: Vec, rb: number): Vec[] {
  const d = dist(a, b)
  if (d === 0 || !circlesCross(a, ra, b, rb)) return []
  const along = (ra * ra - rb * rb + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, ra * ra - along * along))
  const ux = (b.x - a.x) / d
  const uy = (b.y - a.y) / d
  const base = { x: a.x + along * ux, y: a.y + along * uy }
  if (h === 0) return [base]
  return [
    { x: base.x - h * uy, y: base.y + h * ux },
    { x: base.x + h * uy, y: base.y - h * ux },
  ]
}

export type Ambiguity = 'none-used' | 'circle' | 'two-points' | 'one-point' | 'no-match'
export interface Candidates { kind: Ambiguity; points: Vec[] }

/**
 * Which points are possible with the CHOSEN stations (usedIds):
 * 1 → a whole circle · 2 → up to two points · 3 → a single one.
 */
export function candidates(q: QuakeDef, usedIds: string[]): Candidates {
  const used = q.stations.filter((s) => s.working && usedIds.includes(s.id))
  if (used.length === 0) return { kind: 'none-used', points: [] }
  const circles = used.map((s) => ({ pos: s.pos, r: correctRadius(q, s.id) }))
  if (circles.length === 1) return { kind: 'circle', points: [] }
  let pts = circleIntersections(circles[0].pos, circles[0].r, circles[1].pos, circles[1].r)
  for (const c of circles.slice(2)) {
    pts = pts.filter((p) => Math.abs(dist(p, c.pos) - c.r) <= q.tolerance)
  }
  if (pts.length === 0) return { kind: 'no-match', points: [] }
  return { kind: pts.length === 1 ? 'one-point' : 'two-points', points: pts }
}

/** Is what we have (working stations) enough to locate the quake without doubt? */
export function isLocatable(q: QuakeDef): boolean {
  const ids = q.stations.filter((s) => s.working).map((s) => s.id)
  return candidates(q, ids).kind === 'one-point'
}

// ─────────────────────────── The child's answers ───────────────────────────

export type Answer =
  | { type: 'locate'; point: Vec }
  | { type: 'insufficient' } // "these stations are not enough"

export type AnswerVerdict = 'located' | 'wrong-place' | 'understood-insufficient' | 'wrong-insufficient'

export function judgeAnswer(q: QuakeDef, answer: Answer): AnswerVerdict {
  if (answer.type === 'insufficient') {
    return isLocatable(q) ? 'wrong-insufficient' : 'understood-insufficient'
  }
  // Betting on one point when two are possible does NOT count as understanding,
  // even if it hits: that is why it is not accepted in level 3.
  if (!isLocatable(q)) return 'wrong-place'
  return dist(answer.point, q.epicenter) <= q.tolerance ? 'located' : 'wrong-place'
}

// ─────────────────────────── Teacher metrics ───────────────────────────

export interface LevelMetrics {
  attempts: number
  firstAttemptCorrect: boolean
}

export function newMetrics(): LevelMetrics {
  return { attempts: 0, firstAttemptCorrect: false }
}

/** Call once per evaluated attempt (echo, circle or final answer). */
export function recordAttempt(m: LevelMetrics, correct: boolean): LevelMetrics {
  const attempts = m.attempts + 1
  return { attempts, firstAttemptCorrect: attempts === 1 ? correct : m.firstAttemptCorrect }
}

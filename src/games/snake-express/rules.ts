/**
 * LUNAR EXPRESS — Reglas puras del motor
 * -------------------------------------------------------------------------
 * Sin DOM, sin canvas, sin audio. Todo lo que determina si una partida es
 * correcta vive aquí y puede probarse con Vitest.
 */

import { GRID, type Difficulty, DIFFICULTY_CONFIGS } from './config'

// ---------------------------------------------------------------------------
// Tipos base
// ---------------------------------------------------------------------------

export interface Vec2 {
  x: number
  y: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'

/** Obstáculo en la cuadrícula */
export interface Obstacle {
  pos: Vec2
  kind: 'rock' | 'crater'
}

/** Muestra científica recogible */
export interface Sample {
  pos: Vec2
  /** Fase de animación para flotado visual */
  phase: number
  /** Muestra recogida */
  taken: boolean
}

/** Cohete de destino — solo existe en RETURN */
export interface Rocket {
  pos: Vec2
  /** Contador visual de animación */
  thrusterPhase: number
}

export type GamePhase =
  | 'INTRO'
  | 'DIFFICULTY'
  | 'INSTRUCTIONS'
  | 'READY'
  | 'EXPLORATION'
  | 'RETURN'
  | 'PAUSED'
  | 'SUCCESS'
  | 'FAILED'
  | 'RESULTS'

// ---------------------------------------------------------------------------
// Colisiones
// ---------------------------------------------------------------------------

export function vecEquals(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y
}

export function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === 'up' && b === 'down') ||
    (a === 'down' && b === 'up') ||
    (a === 'left' && b === 'right') ||
    (a === 'right' && b === 'left')
  )
}

export function moveVec(pos: Vec2, dir: Direction): Vec2 {
  switch (dir) {
    case 'up':    return { x: pos.x, y: pos.y - 1 }
    case 'down':  return { x: pos.x, y: pos.y + 1 }
    case 'left':  return { x: pos.x - 1, y: pos.y }
    case 'right': return { x: pos.x + 1, y: pos.y }
  }
}

export function isOutOfBounds(pos: Vec2): boolean {
  return pos.x < 0 || pos.x >= GRID.cols || pos.y < 0 || pos.y >= GRID.rows
}

export function collidesWithObstacles(pos: Vec2, obstacles: Obstacle[]): boolean {
  return obstacles.some((o) => vecEquals(o.pos, pos))
}

export function collidesWithWagon(pos: Vec2, wagons: Vec2[]): boolean {
  return wagons.some((w) => vecEquals(w, pos))
}

// ---------------------------------------------------------------------------
// Generación aleatoria determinista
// ---------------------------------------------------------------------------

/** RNG simple para generación interna (complementa el Rng del portal) */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 4294967296
  }
}

/**
 * Genera obstáculos garantizando que no bloqueen completamente el camino.
 * Nunca en la posición inicial del carrito ni en las primeras dos filas.
 */
export function generateObstacles(count: number, rand: () => number): Obstacle[] {
  const obstacles: Obstacle[] = []
  const forbidden = new Set<string>()

  // Posición inicial del carrito (centro de la cuadrícula)
  const startX = Math.floor(GRID.cols / 2)
  const startY = Math.floor(GRID.rows / 2)

  // Zona de exclusión alrededor del inicio: 3 celdas
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      forbidden.add(`${startX + dx},${startY + dy}`)
    }
  }

  let attempts = 0
  while (obstacles.length < count && attempts < count * 20) {
    attempts++
    const x = Math.floor(rand() * GRID.cols)
    const y = Math.floor(rand() * GRID.rows)
    const key = `${x},${y}`
    if (forbidden.has(key)) continue
    forbidden.add(key)
    obstacles.push({
      pos: { x, y },
      kind: rand() < 0.4 ? 'crater' : 'rock',
    })
  }

  return obstacles
}

/**
 * Genera una posición libre para una muestra.
 * Nunca sobre obstáculos, el carrito, los vagones ni otras muestras.
 */
export function findFreePosition(
  rand: () => number,
  occupied: Set<string>,
): Vec2 | null {
  for (let attempt = 0; attempt < 200; attempt++) {
    const x = Math.floor(rand() * GRID.cols)
    const y = Math.floor(rand() * GRID.rows)
    const key = `${x},${y}`
    if (!occupied.has(key)) return { x, y }
  }
  return null
}

export function buildOccupied(
  head: Vec2,
  wagons: Vec2[],
  obstacles: Obstacle[],
  extras: Vec2[] = [],
): Set<string> {
  const s = new Set<string>()
  s.add(`${head.x},${head.y}`)
  for (const w of wagons) s.add(`${w.x},${w.y}`)
  for (const o of obstacles) s.add(`${o.pos.x},${o.pos.y}`)
  for (const e of extras) s.add(`${e.x},${e.y}`)
  return s
}

// ---------------------------------------------------------------------------
// Puntuación
// ---------------------------------------------------------------------------

export interface ScoreData {
  samplesCollected: number
  samplesDelivered: number
  difficulty: Difficulty
  missionSuccess: boolean
}

export function calcRecoveryPct(collected: number, delivered: number): number {
  if (collected === 0) return 0
  return Math.round((delivered / collected) * 100)
}

export function calcScore(data: ScoreData): number {
  if (!data.missionSuccess) return 0
  const cfg = DIFFICULTY_CONFIGS[data.difficulty]
  const base = data.samplesDelivered * 100
  const bonus = data.samplesDelivered >= cfg.targetSamples ? 500 : 0
  const diffBonus = data.difficulty === 'medium' ? 200 : data.difficulty === 'expert' ? 500 : 0
  return base + bonus + diffBonus
}

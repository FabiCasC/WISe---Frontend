/**
 * LABERINTO DE GUSEV - reglas puras.
 * -------------------------------------------------------------------------
 * Movimiento por casillas con interpolacion: cada criatura ocupa SIEMPRE una
 * casilla y avanza hacia la siguiente con un progreso 0..1. Es la forma mas
 * robusta de hacer un laberinto: no existe el desalineado por decimales que
 * hace que un personaje se cuele por una pared.
 */

export type Dir = 'up' | 'down' | 'left' | 'right' | 'none'

export const DIRS: Record<Exclude<Dir, 'none'>, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const ALL_DIRS: Exclude<Dir, 'none'>[] = ['up', 'left', 'down', 'right']

export function opposite(dir: Dir): Dir {
  if (dir === 'up') return 'down'
  if (dir === 'down') return 'up'
  if (dir === 'left') return 'right'
  if (dir === 'right') return 'left'
  return 'none'
}

export interface Maze {
  grid: string[][]
  w: number
  h: number
  start: { x: number; y: number }
  home: { x: number; y: number }[]
  /** Casillas con muestra pendiente, clave "x,y". */
  pellets: Set<string>
  powers: Set<string>
  totalPellets: number
}

export const key = (x: number, y: number) => x + ',' + y

export function parseMaze(map: string[]): Maze {
  const grid = map.map((row) => row.split(''))
  const h = grid.length
  const w = grid[0].length

  let start = { x: 1, y: 1 }
  const home: { x: number; y: number }[] = []
  const pellets = new Set<string>()
  const powers = new Set<string>()

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = grid[y][x]
      if (t === 'P') start = { x, y }
      else if (t === 'G') home.push({ x, y })
      else if (t === '.') pellets.add(key(x, y))
      else if (t === 'o') powers.add(key(x, y))
    }
  }

  // Si un mapa no declarase casa, los remolinos salen del centro.
  if (home.length === 0) home.push({ x: Math.floor(w / 2), y: Math.floor(h / 2) })

  return { grid, w, h, start, home, pellets, powers, totalPellets: pellets.size + powers.size }
}

export function isWall(maze: Maze, x: number, y: number): boolean {
  if (y < 0 || y >= maze.h || x < 0 || x >= maze.w) return true
  return maze.grid[y][x] === '#'
}

export function canGo(maze: Maze, x: number, y: number, dir: Dir): boolean {
  if (dir === 'none') return false
  const d = DIRS[dir]
  return !isWall(maze, x + d.x, y + d.y)
}

/** Criatura que se desplaza de casilla a casilla. */
export interface Mover {
  x: number
  y: number
  /** Casilla destino. Igual a (x,y) cuando esta quieta. */
  tx: number
  ty: number
  /** Progreso hacia el destino, 0..1. */
  t: number
  dir: Dir
  /** Direccion pedida por el jugador, se aplica en cuanto sea legal. */
  want: Dir
}

export function createMover(x: number, y: number): Mover {
  return { x, y, tx: x, ty: y, t: 0, dir: 'none', want: 'none' }
}

/** Posicion continua en casillas, para dibujar. */
export function moverPos(m: Mover): { x: number; y: number } {
  return { x: m.x + (m.tx - m.x) * m.t, y: m.y + (m.ty - m.y) * m.t }
}

/**
 * Avanza un mover. Devuelve true si ACABA de llegar a una casilla nueva
 * (momento en que el juego recoge muestras o la IA vuelve a decidir).
 */
export function stepMover(maze: Maze, m: Mover, cellsPerSec: number, dtSec: number): boolean {
  // Parado: solo arranca si la direccion pedida es legal.
  if (m.t === 0 && m.x === m.tx && m.y === m.ty) {
    const dir = canGo(maze, m.x, m.y, m.want) ? m.want : 'none'
    if (dir === 'none') {
      m.dir = 'none'
      return false
    }
    m.dir = dir
    const d = DIRS[dir]
    m.tx = m.x + d.x
    m.ty = m.y + d.y
  }

  // Giro en seco: invertir a mitad de pasillo no debe sentirse bloqueado.
  if (m.want !== 'none' && m.want === opposite(m.dir) && m.t > 0 && m.t < 1) {
    const ox = m.x
    const oy = m.y
    m.x = m.tx
    m.y = m.ty
    m.tx = ox
    m.ty = oy
    m.dir = m.want
    m.t = 1 - m.t
  }

  m.t += cellsPerSec * dtSec

  if (m.t < 1) return false

  // Llegada: se asienta en la casilla y decide la siguiente.
  m.x = m.tx
  m.y = m.ty
  m.t = 0

  const nextDir = canGo(maze, m.x, m.y, m.want)
    ? m.want
    : canGo(maze, m.x, m.y, m.dir)
      ? m.dir
      : 'none'

  if (nextDir === 'none') {
    m.dir = 'none'
  } else {
    m.dir = nextDir
    const d = DIRS[nextDir]
    m.tx = m.x + d.x
    m.ty = m.y + d.y
  }

  return true
}

/**
 * Decision de un remolino al llegar a una casilla.
 *
 * Regla clasica de laberinto, y la que hace que perseguir se sienta justo:
 * nunca se da la vuelta en mitad de un pasillo (solo en un callejon sin
 * salida), y entre las salidas disponibles elige la que mas acerca -o aleja,
 * si esta huyendo- de su objetivo.
 */
export function chooseGhostDir(
  maze: Maze,
  m: Mover,
  target: { x: number; y: number },
  flee: boolean,
  rand: () => number
): Dir {
  const back = opposite(m.dir)
  const options = ALL_DIRS.filter((d) => canGo(maze, m.x, m.y, d) && d !== back)

  // Callejon sin salida: la unica opcion es volver.
  if (options.length === 0) return back

  let best: Dir = options[0]
  let bestScore = Infinity

  for (const d of options) {
    const v = DIRS[d]
    const nx = m.x + v.x
    const ny = m.y + v.y
    const dist = (nx - target.x) ** 2 + (ny - target.y) ** 2
    // Huyendo se invierte el criterio. El ruido evita que varios remolinos
    // se muevan en bloque y resulten predecibles.
    const score = (flee ? -dist : dist) + rand() * 0.6
    if (score < bestScore) {
      bestScore = score
      best = d
    }
  }

  return best
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Panel power left, 1..0. Real fact: dust settling on Spirit's panels cut its
 * power, and passing dust devils blew it off ("cleaning events").
 *
 * This is the number the HUD shows, so it MUST hit 0 exactly where the rover
 * dies (dust = 1). It used to bottom out at 40%, which told the player they
 * still had power while the game was killing them for running out of it.
 */
export function panelPower(dust: number): number {
  return 1 - clamp01(dust)
}

/**
 * Lowest share of its nominal speed a dusty rover still manages.
 *
 * Playability floor, not physics: a rover that crawled to a literal stop could
 * never reach the dust devil the game is telling it to chase.
 */
export const DRIVE_FLOOR = 0.4

/** Speed multiplier for dust on the panels, 1 .. DRIVE_FLOOR. */
export function driveFactor(dust: number): number {
  return DRIVE_FLOOR + (1 - DRIVE_FLOOR) * panelPower(dust)
}

/** Share of the devil's nominal speed actually used in play. */
export const GHOST_SPEED_FACTOR = 0.7

/** Rover speed in cells per second, exactly as the game computes it. */
export function roverSpeed(t: { playerSpeed: number }, dust: number): number {
  return t.playerSpeed * driveFactor(dust)
}

/**
 * Dust devil speed in cells per second, exactly as the game computes it.
 *
 * It is scaled by the SAME driveFactor as the rover on purpose. With a fixed
 * devil speed the devils overtook the rover once dust passed ~0.63, i.e. the
 * game became unwinnable precisely when it was telling the player "power is
 * low, go chase a devil". Sharing the factor keeps that chase possible.
 */
export function devilSpeed(t: { ghostSpeed: number }, dust: number): number {
  return t.ghostSpeed * GHOST_SPEED_FACTOR * driveFactor(dust)
}

/** Dust left on the panels after a dust-out costs the rover a life. */
export const RESPAWN_DUST = 0.6

/**
 * Dust carried across a respawn.
 *
 * Dying used to set dust back to 0 while keeping every sample already
 * collected, so a death WAS a free, perfect cleaning event -- the player could
 * finish a level by dying three times and never once learn what a dust devil
 * is for. A respawn now only brushes the panels off partially.
 */
export function dustAfterRespawn(dust: number): number {
  return Math.min(clamp01(dust), RESPAWN_DUST)
}

/** Below this much dust a devil has nothing to clean, so it is not consumed. */
export const CLEAN_MIN_DUST = 0.15

/** Reaching a devil with at least this much dust is the lesson being taught. */
export const SMART_CLEAN_DUST = 0.35

export interface MazeScore {
  pellets: number
  powers: number
  scattered: number
  livesLeft: number
  completed: boolean
}

export function scoreMaze({
  pellets,
  powers,
  scattered,
  livesLeft,
  completed,
}: MazeScore): number {
  return (
    pellets * 10 +
    powers * 50 +
    scattered * 200 +
    (completed ? livesLeft * 150 + 300 : 0)
  )
}

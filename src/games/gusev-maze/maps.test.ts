import { describe, expect, it } from 'vitest'
import { MAZE_LEVELS, MAZE_MAPS } from './maps'
import { canGo, DIRS, isWall, key, parseMaze, type Maze } from './rules'

/**
 * Un laberinto con una muestra inalcanzable es un nivel IMPOSIBLE: el jugador
 * recorreria el mapa entero sin poder terminarlo nunca. Estas pruebas lo
 * impiden antes de que llegue a una pantalla.
 */

/** Casillas transitables alcanzables desde un punto. */
function reachable(maze: Maze, from: { x: number; y: number }): Set<string> {
  const seen = new Set<string>([key(from.x, from.y)])
  const queue = [from]

  while (queue.length) {
    const cur = queue.shift() as { x: number; y: number }
    for (const d of Object.values(DIRS)) {
      const nx = cur.x + d.x
      const ny = cur.y + d.y
      const k = key(nx, ny)
      if (isWall(maze, nx, ny) || seen.has(k)) continue
      seen.add(k)
      queue.push({ x: nx, y: ny })
    }
  }

  return seen
}

describe.each(MAZE_MAPS.map((map, i) => [i + 1, map] as const))('mapa %i', (_n, map) => {
  const maze = parseMaze(map)

  it('es rectangular y esta cerrado por un muro', () => {
    expect(new Set(map.map((row) => row.length)).size).toBe(1)
    for (let x = 0; x < maze.w; x++) {
      expect(isWall(maze, x, 0)).toBe(true)
      expect(isWall(maze, x, maze.h - 1)).toBe(true)
    }
    for (let y = 0; y < maze.h; y++) {
      expect(isWall(maze, 0, y)).toBe(true)
      expect(isWall(maze, maze.w - 1, y)).toBe(true)
    }
  })

  it('tiene salida del rover, casa de remolinos y eventos de limpieza', () => {
    expect(map.join('').match(/P/g)).toHaveLength(1)
    expect(maze.home.length).toBeGreaterThan(0)
    expect(maze.powers.size).toBeGreaterThan(0)
    expect(maze.totalPellets).toBeGreaterThan(40)
  })

  it('deja TODAS las muestras al alcance del rover', () => {
    const seen = reachable(maze, maze.start)
    const unreachable = [...maze.pellets, ...maze.powers].filter((k) => !seen.has(k))
    expect(unreachable).toEqual([])
  })

  it('no encierra a los remolinos en su casa', () => {
    const seen = reachable(maze, maze.start)
    // Al menos una casilla de la casa conecta con el resto del mapa.
    expect(maze.home.some((h) => seen.has(key(h.x, h.y)))).toBe(true)
  })

  it('no deja al rover empezando dentro de una pared', () => {
    expect(isWall(maze, maze.start.x, maze.start.y)).toBe(false)
    // Y con al menos una salida: empezar bloqueado seria un nivel muerto.
    const exits = Object.keys(DIRS).filter((d) =>
      canGo(maze, maze.start.x, maze.start.y, d as never)
    )
    expect(exits.length).toBeGreaterThan(0)
  })
})

describe('ajustes por nivel', () => {
  it('sube la dificultad nivel a nivel', () => {
    const [l1, l2, l3] = [MAZE_LEVELS[1], MAZE_LEVELS[2], MAZE_LEVELS[3]]
    expect(l1.ghosts).toBeLessThan(l2.ghosts)
    expect(l2.ghosts).toBeLessThan(l3.ghosts)
    expect(l1.ghostSpeed).toBeLessThan(l3.ghostSpeed)
    // Dust covers the panels faster on harder levels.
    expect(l1.dustSecs).toBeGreaterThan(l3.dustSecs)
  })

  it('mantiene al rover mas rapido que los remolinos', () => {
    // Si un remolino corriese mas que el rover, huir seria imposible.
    for (const lvl of [1, 2, 3] as const) {
      const t = MAZE_LEVELS[lvl]
      expect(t.playerSpeed).toBeGreaterThan(t.ghostSpeed)
    }
  })
})

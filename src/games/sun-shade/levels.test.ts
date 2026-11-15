import { describe, expect, it } from 'vitest'
import { CELL, SUN_LEVELS, SUN_MAPS } from './levels'
import {
  createBody,
  isLethal,
  isSolid as isSolidTile,
  openChannels,
  overlapsCell,
  parseLevel,
  PHYS,
  scoreSun,
  stepBody,
  tileAt,
  touchesLethal,
  type LevelState,
  type Who,
} from './rules'

/**
 * En un nivel de plataformas, un salto de una celda de mas lo vuelve
 * IMPOSIBLE, y no se nota hasta que alguien se queda atascado delante del
 * jurado. Estas pruebas recorren cada mapa con un modelo del salto real y
 * comprueban que los dos rovers pueden terminarlo.
 *
 * Los margenes son MAS ESTRICTOS que la fisica del juego:
 *   altura real = jumpV^2 / (2*gravity) = 109 px = 3.4 celdas  -> se exige 3
 *   alcance real del salto ~125 px = 3.9 celdas                -> se exige 3
 */
const MAX_UP = 3
const MAX_SIDE = 3
const MAX_FALL_SIDE = 4

type Cell = { x: number; y: number }
const key = (c: Cell) => c.x + ',' + c.y

function solid(level: LevelState, x: number, y: number, open: Set<number>): boolean {
  if (y < 0 || y >= level.h || x < 0 || x >= level.w) return true
  const t = tileAt(level, x, y)
  if (t === 'D') return !open.has(1)
  if (t === 'E') return !open.has(2)
  return t === '#'
}

function free(level: LevelState, x: number, y: number, who: Who, open: Set<number>): boolean {
  if (solid(level, x, y, open)) return false
  return !isLethal(tileAt(level, x, y), who)
}

/** Cae desde una celda y devuelve donde aterriza, o null si muere al caer. */
function landing(
  level: LevelState,
  x: number,
  y: number,
  who: Who,
  open: Set<number>
): number | null {
  let cy = y
  while (cy + 1 < level.h && !solid(level, x, cy + 1, open)) {
    cy++
    if (!free(level, x, cy, who, open)) return null
  }
  return free(level, x, cy, who, open) ? cy : null
}

/** Celdas de apoyo que un rover puede alcanzar. */
function reachable(level: LevelState, from: Cell, who: Who, gatesOpen: boolean): Set<string> {
  const open = gatesOpen ? new Set([1, 2]) : new Set<number>()
  const startY = landing(level, from.x, from.y, who, open)
  if (startY === null) return new Set()

  const seen = new Set<string>([key({ x: from.x, y: startY })])
  const queue: Cell[] = [{ x: from.x, y: startY }]

  const arrive = (x: number, y: number) => {
    const ly = landing(level, x, y, who, open)
    if (ly === null) return
    const k = key({ x, y: ly })
    if (seen.has(k)) return
    seen.add(k)
    queue.push({ x, y: ly })
  }

  while (queue.length) {
    const { x, y } = queue.shift() as Cell

    // Caminar.
    for (const dx of [-1, 1]) if (free(level, x + dx, y, who, open)) arrive(x + dx, y)

    // Caer por un borde. El corte va POR DIRECCION: si no, la busqueda
    // atraviesa paredes y da por bueno un nivel que no lo es.
    for (const s of [-1, 1]) {
      for (let dx = 1; dx <= MAX_FALL_SIDE; dx++) {
        const nx = x + s * dx
        if (!free(level, nx, y, who, open)) break
        arrive(nx, y)
      }
    }

    // Saltar: subir recto y luego desplazarse por la fila alcanzada.
    for (let up = 1; up <= MAX_UP; up++) {
      const ny = y - up
      if (!free(level, x, ny, who, open)) break
      arrive(x, ny)
      for (const s of [-1, 1]) {
        for (let dx = 1; dx <= MAX_SIDE; dx++) {
          const nx = x + s * dx
          if (!free(level, nx, ny, who, open)) break
          arrive(nx, ny)
        }
      }
    }
  }

  return seen
}

describe.each(SUN_MAPS.map((m, i) => [i + 1, m] as const))('mapa %i', (_n, map) => {
  const level = parseLevel(map)

  it('es rectangular y esta cerrado por roca', () => {
    expect(new Set(map.map((r) => r.length)).size).toBe(1)
    for (let x = 0; x < level.w; x++) {
      expect(tileAt(level, x, 0)).toBe('#')
      expect(tileAt(level, x, level.h - 1)).toBe('#')
    }
    for (let y = 0; y < level.h; y++) {
      expect(tileAt(level, 0, y)).toBe('#')
      expect(tileAt(level, level.w - 1, y)).toBe('#')
    }
  })

  it('declara las dos salidas y los dos puntos de partida', () => {
    const flat = map.join('')
    for (const ch of ['1', '2', 'A', 'B']) {
      expect(flat.split(ch).length - 1).toBe(1)
    }
    expect(level.gems.length).toBeGreaterThan(3)
  })

  it('no arranca a ningun rover sobre terreno que lo mate', () => {
    for (const who of ['solar', 'nuclear'] as Who[]) {
      const s = level.start[who]
      expect(isLethal(tileAt(level, s.x, s.y), who)).toBe(false)
    }
  })

  it('deja que CADA rover llegue a su escotilla', () => {
    const rs = reachable(level, level.start.solar, 'solar', true)
    const rn = reachable(level, level.start.nuclear, 'nuclear', true)
    expect(rs.has(key(level.exit.solar))).toBe(true)
    expect(rn.has(key(level.exit.nuclear))).toBe(true)
  })

  it('no esconde ninguna muestra fuera de alcance', () => {
    const rs = reachable(level, level.start.solar, 'solar', true)
    const rn = reachable(level, level.start.nuclear, 'nuclear', true)
    const lost = level.gems.filter((g) => !rs.has(key(g)) && !rn.has(key(g)))
    expect(lost).toEqual([])
  })

  it('da a cada compuerta una placa de su canal', () => {
    for (const gate of level.gates) {
      expect(level.plates.some((p) => p.channel === gate.channel)).toBe(true)
    }
  })

  it('deja alguna placa al alcance con las compuertas cerradas', () => {
    if (!level.gates.length) return
    const rs = reachable(level, level.start.solar, 'solar', false)
    const rn = reachable(level, level.start.nuclear, 'nuclear', false)
    const ok = level.plates.some((p) => rs.has(key(p)) || rn.has(key(p)))
    expect(ok).toBe(true)
  })

  it('hace que las compuertas sean necesarias de verdad', () => {
    if (!level.gates.length) return
    // Si los dos llegasen a su salida sin abrir nada, la cooperacion que
    // anuncia el nivel seria decorativa.
    const rs = reachable(level, level.start.solar, 'solar', false)
    const rn = reachable(level, level.start.nuclear, 'nuclear', false)
    const both = rs.has(key(level.exit.solar)) && rn.has(key(level.exit.nuclear))
    expect(both).toBe(false)
  })
})

describe('fisica', () => {
  it('salta lo bastante alto para los escalones de 2 celdas de los mapas', () => {
    const height = (PHYS.jumpV * PHYS.jumpV) / (2 * PHYS.gravity)
    expect(height).toBeGreaterThan(CELL * 2)
    // Y no tanto como para romper los techos de 3 celdas.
    expect(height).toBeLessThan(CELL * 4)
  })

  it('un cuerpo en reposo cae y se apoya en el suelo', () => {
    const level = parseLevel(SUN_MAPS[0])
    const body = createBody(level.start.solar.x, level.start.solar.y - 2)
    const open = openChannels(level)
    const still = { left: false, right: false, jump: false, jumpHeld: false }
    for (let i = 0; i < 120; i++) stepBody(level, body, still, 1 / 60, open)
    expect(body.onGround).toBe(true)
    expect(body.vy).toBe(0)
  })

  it('no deja que un rover atraviese la roca por mucho que empuje', () => {
    const level = parseLevel(SUN_MAPS[0])
    const body = createBody(level.start.solar.x, level.start.solar.y)
    const open = openChannels(level)
    const left = { left: true, right: false, jump: false, jumpHeld: false }
    for (let i = 0; i < 600; i++) stepBody(level, body, left, 1 / 60, open)
    // Se queda apoyado en la pared del borde, nunca fuera del mapa.
    expect(body.x).toBeGreaterThanOrEqual(CELL)
    expect(body.y).toBeLessThan(level.h * CELL)
  })

  it('sube de un salto a una plataforma dos celdas mas alta', () => {
    // Mapa 1: el suelo es la fila 14 y hay una plataforma en la fila 12
    // (columnas 1 a 4). Desde la fila 13 hay que poder plantarse encima.
    const level = parseLevel(SUN_MAPS[0])
    const open = openChannels(level)
    const body = createBody(6, 13)

    const run = (cmd: Parameters<typeof stepBody>[2], frames: number) => {
      for (let i = 0; i < frames; i++) stepBody(level, body, cmd, 1 / 60, open)
    }

    // Asentarse en el suelo antes de saltar.
    run({ left: false, right: false, jump: false, jumpHeld: false }, 30)
    const floorY = body.y

    // Salto hacia la izquierda, manteniendo el boton para el salto largo.
    run({ left: true, right: false, jump: true, jumpHeld: true }, 1)
    run({ left: true, right: false, jump: false, jumpHeld: true }, 40)
    run({ left: true, right: false, jump: false, jumpHeld: false }, 60)

    expect(body.onGround).toBe(true)
    // Ha quedado por encima del suelo del que partio: subio de verdad.
    expect(body.y).toBeLessThan(floorY - CELL)
    expect(body.alive).toBe(true)
  })

  it('da por llegado a un rover que se apoya en su escotilla', () => {
    const level = parseLevel(SUN_MAPS[0])
    const open = openChannels(level)
    const exit = level.exit.solar
    const body = createBody(exit.x, exit.y)
    const still = { left: false, right: false, jump: false, jumpHeld: false }
    for (let i = 0; i < 60; i++) stepBody(level, body, still, 1 / 60, open)

    expect(body.onGround).toBe(true)
    expect(overlapsCell(body, exit.x, exit.y)).toBe(true)
  })

  it('reconoce el terreno mortal de cada rover', () => {
    const level = parseLevel(SUN_MAPS[0])
    // La arena blanda del mapa 1 esta en la fila 13.
    const lit = { x: 8, y: 13 }
    expect(tileAt(level, lit.x, lit.y)).toBe('L')

    const solar = createBody(lit.x, lit.y)
    const nuclear = createBody(lit.x, lit.y)
    expect(touchesLethal(level, solar, 'solar')).toBe(false)
    expect(touchesLethal(level, nuclear, 'nuclear')).toBe(true)
  })

  it('abre la compuerta al pisar la placa de su canal, y solo esa', () => {
    // Mapa 2: una placa de canal 1 y la compuerta D que guarda la camara.
    const level = parseLevel(SUN_MAPS[1])
    const plate = level.plates[0]
    const gate = level.gates[0]
    expect(gate.channel).toBe(plate.channel)

    const open = () => openChannels(level)
    const solidNow = () =>
      isSolidTile(level, gate.x, gate.y, open())

    // Cerrada de inicio: la camara esta sellada.
    expect(solidNow()).toBe(true)

    // Un rover encima de la placa la enciende.
    const body = createBody(plate.x, plate.y)
    const still = { left: false, right: false, jump: false, jumpHeld: false }
    for (let i = 0; i < 60; i++) stepBody(level, body, still, 1 / 60, open())
    expect(overlapsCell(body, plate.x, plate.y)).toBe(true)

    plate.on = true
    expect(solidNow()).toBe(false)

    // Una placa de otro canal no habria abierto esta compuerta.
    plate.on = false
    const other = { ...plate, channel: (plate.channel === 1 ? 2 : 1) as 1 | 2, on: true }
    level.plates.push(other)
    expect(solidNow()).toBe(true)
  })

  it('mata a los dos en el polvo', () => {
    expect(isLethal('X', 'solar')).toBe(true)
    expect(isLethal('X', 'nuclear')).toBe(true)
  })
})

describe('puntuacion', () => {
  it('premia terminar por encima de abandonar', () => {
    const done = scoreSun({ gems: 4, totalGems: 6, seconds: 40, resets: 1, completed: true })
    const quit = scoreSun({ gems: 4, totalGems: 6, seconds: 40, resets: 1, completed: false })
    expect(done).toBeGreaterThan(quit)
  })

  it('nunca baja de cero por muchos apagones', () => {
    expect(
      scoreSun({ gems: 0, totalGems: 6, seconds: 600, resets: 999, completed: true })
    ).toBe(0)
  })
})

describe('catalogo', () => {
  it('describe los tres niveles', () => {
    for (const id of [1, 2, 3] as const) {
      expect(SUN_LEVELS[id].map.length).toBeGreaterThan(10)
      expect(SUN_LEVELS[id].hint.length).toBeGreaterThan(10)
    }
  })
})

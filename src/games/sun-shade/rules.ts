/**
 * SOL Y SOMBRA - reglas puras.
 * -------------------------------------------------------------------------
 * Fisica de plataformas y estado del nivel, sin DOM ni canvas, para poder
 * probarlo con Vitest.
 *
 * La idea cientifica: un rover SOLAR necesita luz y se apaga en la sombra
 * (asi acabaron Opportunity y Spirit); un rover con generador NUCLEAR (RTG)
 * no depende del Sol y trabaja en la sombra. La luz NO le hace dano (NASA:
 * los RPS funcionan "largely independent of changes in sunlight"). Su limite
 * en el juego es otro, tambien real: llevar un RTG hace al rover GRANDE
 * (NASA da Curiosity como 10 ft de largo y 7 ft de alto sin el brazo, unos
 * 3 m por 2.1 m; Spirit 1.6 m y 1.5 m), y un
 * rover solo pasa por donde cabe. Cada uno cruza lo que el otro no puede.
 *
 * WHY size and not soft ground: this game used to stop the nuclear rover in
 * soft sand "because it is heavier", which is the opposite of the record.
 * Spirit - the LIGHT, solar, 185 kg rover - is the one that stayed trapped in
 * soft soil at Troy in 2009 and ended its mission there, and Opportunity got
 * stuck in Purgatory Dune in 2005; Curiosity, 899 kg with its RTG, never got
 * permanently trapped. What sinks a rover is ground pressure, not mass.
 */

import { CELL } from './levels'

export type Who = 'solar' | 'nuclear'

export interface Body {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  onGround: boolean
  /** Tiempo desde que dejo el suelo: permite saltar justo tras un borde. */
  coyoteMs: number
  /** Salto pedido hace poco: se ejecuta en cuanto toca el suelo. */
  bufferMs: number
  dir: 1 | -1
  alive: boolean
  /** Ya esta en su salida. */
  home: boolean
}

// --- Ajustes de movimiento --------------------------------------------------
// Con celdas de 32 px: altura de salto = 660^2/(2*2000) = 109 px (3.4 celdas)
// y alcance horizontal de un salto completo ~125 px (3.9 celdas). Los mapas
// se disenan con saltos de 2 celdas, asi que sobra margen.
export const PHYS = {
  gravity: 2000,
  moveSpeed: 190,
  jumpV: -660,
  /** Caida mas rapida al soltar el salto: da control fino. */
  cutJump: 0.45,
  maxFall: 720,
  coyoteMs: 90,
  bufferMs: 120,
  bodyW: 20,
  bodyH: 26,
} as const

export function createBody(cx: number, cy: number): Body {
  return {
    // Centrado en la celda y apoyado en su base.
    x: cx * CELL + (CELL - PHYS.bodyW) / 2,
    y: cy * CELL + (CELL - PHYS.bodyH),
    w: PHYS.bodyW,
    h: PHYS.bodyH,
    vx: 0,
    vy: 0,
    onGround: false,
    coyoteMs: 0,
    bufferMs: 0,
    dir: 1,
    alive: true,
    home: false,
  }
}

export interface Plate {
  x: number
  y: number
  /** Canal: abre las compuertas del mismo canal. */
  channel: 1 | 2
  /** Las placas son interruptores: una vez pisadas, quedan encendidas. */
  on: boolean
}

export interface Gate {
  x: number
  y: number
  channel: 1 | 2
}

export interface Gem {
  x: number
  y: number
  taken: boolean
}

export interface LevelState {
  grid: string[][]
  w: number
  h: number
  start: Record<Who, { x: number; y: number }>
  exit: Record<Who, { x: number; y: number }>
  plates: Plate[]
  gates: Gate[]
  gems: Gem[]
}

export function parseLevel(map: string[]): LevelState {
  const grid = map.map((r) => r.split(''))
  const h = grid.length
  const w = grid[0].length

  const start = { solar: { x: 1, y: 1 }, nuclear: { x: 2, y: 1 } }
  const exit = { solar: { x: 1, y: 1 }, nuclear: { x: 2, y: 1 } }
  const plates: Plate[] = []
  const gates: Gate[] = []
  const gems: Gem[] = []

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = grid[y][x]
      if (t === '1') start.solar = { x, y }
      else if (t === '2') start.nuclear = { x, y }
      else if (t === 'A') exit.solar = { x, y }
      else if (t === 'B') exit.nuclear = { x, y }
      else if (t === 'P') plates.push({ x, y, channel: 1, on: false })
      else if (t === 'Q') plates.push({ x, y, channel: 2, on: false })
      else if (t === 'D') gates.push({ x, y, channel: 1 })
      else if (t === 'E') gates.push({ x, y, channel: 2 })
      else if (t === '*') gems.push({ x, y, taken: false })
    }
  }

  return { grid, w, h, start, exit, plates, gates, gems }
}

/** Canales abiertos ahora mismo. */
export function openChannels(level: LevelState): Set<number> {
  const open = new Set<number>()
  for (const p of level.plates) if (p.on) open.add(p.channel)
  return open
}

export function tileAt(level: LevelState, cx: number, cy: number): string {
  if (cy < 0 || cy >= level.h || cx < 0 || cx >= level.w) return '#'
  return level.grid[cy][cx]
}

export function isSolid(level: LevelState, cx: number, cy: number, open: Set<number>): boolean {
  const t = tileAt(level, cx, cy)
  if (t === '#') return true
  if (t === 'D') return !open.has(1)
  if (t === 'E') return !open.has(2)
  return false
}

/**
 * What the player reads when a rover stops. It lives next to the rule it
 * explains so the tests can check the science of the message, not only the
 * physics: the nuclear rover is stopped by its SIZE, never by its mass.
 */
export const STOP_REASON: Record<Who, string> = {
  solar: 'Shade: no sunlight, so the solar panels make no power',
  nuclear: 'Low gap: the RTG rover is too big to fit (about 2.1 m tall against 1.5 m)',
}

/** Un tile que apaga o atasca al rover indicado. */
export function isLethal(tile: string, who: Who): boolean {
  if (tile === 'X') return true
  // La sombra deja sin luz al rover solar.
  if (who === 'solar') return tile === 'S'
  // The low gap: an RTG rover is too tall and too wide to get under it.
  return tile === 'L'
}

/** Rango de celdas que toca un cuerpo. */
export function cellRange(body: Body) {
  return {
    x0: Math.floor(body.x / CELL),
    x1: Math.floor((body.x + body.w - 0.001) / CELL),
    y0: Math.floor(body.y / CELL),
    y1: Math.floor((body.y + body.h - 0.001) / CELL),
  }
}

/**
 * Integra un cuerpo un paso. Resuelve los ejes POR SEPARADO (primero X y
 * despues Y): es lo que evita que un cuerpo se cuele por una esquina, el
 * fallo clasico de un motor de plataformas hecho a mano.
 */
export function stepBody(
  level: LevelState,
  body: Body,
  input: { left: boolean; right: boolean; jump: boolean; jumpHeld: boolean },
  dtSec: number,
  open: Set<number>
): void {
  if (!body.alive || body.home) {
    body.vx = 0
    return
  }

  // --- Horizontal
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  body.vx = dir * PHYS.moveSpeed
  if (dir !== 0) body.dir = dir > 0 ? 1 : -1

  body.x += body.vx * dtSec
  {
    const r = cellRange(body)
    for (let cy = r.y0; cy <= r.y1; cy++) {
      for (let cx = r.x0; cx <= r.x1; cx++) {
        if (!isSolid(level, cx, cy, open)) continue
        if (body.vx > 0) body.x = cx * CELL - body.w
        else if (body.vx < 0) body.x = (cx + 1) * CELL
        body.vx = 0
      }
    }
  }

  // --- Salto (con coyote time y buffer: el salto responde como se espera)
  if (input.jump) body.bufferMs = PHYS.bufferMs
  body.bufferMs = Math.max(0, body.bufferMs - dtSec * 1000)
  body.coyoteMs = body.onGround ? PHYS.coyoteMs : Math.max(0, body.coyoteMs - dtSec * 1000)

  if (body.bufferMs > 0 && body.coyoteMs > 0) {
    body.vy = PHYS.jumpV
    body.onGround = false
    body.bufferMs = 0
    body.coyoteMs = 0
  }

  // Soltar el boton corta la subida: salto corto y salto largo.
  if (!input.jumpHeld && body.vy < 0) body.vy *= 1 - PHYS.cutJump * Math.min(1, dtSec * 60)

  // --- Vertical
  body.vy = Math.min(PHYS.maxFall, body.vy + PHYS.gravity * dtSec)
  body.y += body.vy * dtSec
  body.onGround = false
  {
    const r = cellRange(body)
    for (let cy = r.y0; cy <= r.y1; cy++) {
      for (let cx = r.x0; cx <= r.x1; cx++) {
        if (!isSolid(level, cx, cy, open)) continue
        if (body.vy > 0) {
          body.y = cy * CELL - body.h
          body.onGround = true
        } else if (body.vy < 0) {
          body.y = (cy + 1) * CELL
        }
        body.vy = 0
      }
    }
  }
}

/** True si alguna celda que toca el cuerpo acaba con este rover. */
export function touchesLethal(level: LevelState, body: Body, who: Who): boolean {
  const r = cellRange(body)
  for (let cy = r.y0; cy <= r.y1; cy++) {
    for (let cx = r.x0; cx <= r.x1; cx++) {
      if (isLethal(tileAt(level, cx, cy), who)) return true
    }
  }
  return false
}

/** True si el cuerpo esta sobre esa celda (con holgura para que no frustre). */
export function overlapsCell(body: Body, cx: number, cy: number): boolean {
  const left = cx * CELL
  const top = cy * CELL
  return (
    body.x + body.w > left + 4 &&
    body.x < left + CELL - 4 &&
    body.y + body.h > top + 4 &&
    body.y < top + CELL - 4
  )
}

export interface SunScore {
  gems: number
  totalGems: number
  seconds: number
  resets: number
  completed: boolean
}

/**
 * Puntuacion: terminar es lo que mas pesa, luego las muestras. El tiempo da
 * un extra que se agota, y cada reinicio descuenta, pero NUNCA por debajo de
 * cero: un nivel dificil no debe castigar por intentarlo.
 */
export function scoreSun({ gems, seconds, resets, completed }: SunScore): number {
  if (!completed) return gems * 40
  const base = 500
  const byGems = gems * 120
  const speed = Math.max(0, 300 - Math.floor(seconds) * 4)
  const penalty = resets * 60
  return Math.max(0, base + byGems + speed - penalty)
}

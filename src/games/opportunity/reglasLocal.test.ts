import { describe, expect, it } from 'vitest'
import { crearReglasLocal, grupos, hayJugada, N, type Tablero } from './reglasLocal'
import { CONFIG_NIVELES, PUNTUACION_CONFIG } from './config'
import type { Evento, Ficha, Pos } from './events'

describe('Motor Match-3 y Detección de Combinaciones (grupos)', () => {
  it('detecta combinaciones horizontales de 3 o más fichas', () => {
    const t: Tablero = Array.from({ length: N }, () => Array(N).fill('energia'))
    t[0][0] = 'camara'
    t[0][1] = 'camara'
    t[0][2] = 'camara'
    t[0][3] = 'rat'
    t[0][4] = 'rat'
    t[0][5] = 'espectrometro'

    for (let f = 1; f < N; f++) {
      for (let c = 0; c < N; c++) {
        t[f][c] = (f + c) % 2 === 0 ? 'rat' : 'espectrometro'
      }
    }

    const gs = grupos(t)
    const grupoCamara = gs.find((g) => g.ficha === 'camara')
    expect(grupoCamara).toBeDefined()
    expect(grupoCamara!.celdas).toHaveLength(3)
    expect(grupoCamara!.celdas).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
    ])
  })

  it('detecta combinaciones verticales de 4 o más fichas', () => {
    const t: Tablero = Array.from({ length: N }, () => Array(N).fill('rat'))
    for (let f = 0; f < N; f++) {
      for (let c = 0; c < N; c++) {
        t[f][c] = (f * 2 + c) % 4 === 0 ? 'rat' : 'energia'
      }
    }
    t[1][1] = 'espectrometro'
    t[2][1] = 'espectrometro'
    t[3][1] = 'espectrometro'
    t[4][1] = 'espectrometro'

    const gs = grupos(t)
    const grupoEsp = gs.find((g) => g.ficha === 'espectrometro')
    expect(grupoEsp).toBeDefined()
    expect(grupoEsp!.celdas.length).toBeGreaterThanOrEqual(4)
  })

  it('no duplica celdas en cruces L o T de la misma ficha', () => {
    const t: Tablero = Array.from({ length: N }, () => Array(N).fill('rat'))
    for (let f = 0; f < N; f++) {
      for (let c = 0; c < N; c++) {
        t[f][c] = (f + c) % 2 === 0 ? 'rat' : 'energia'
      }
    }

    // T en (2,2)
    t[2][1] = 'camara'
    t[2][2] = 'camara'
    t[2][3] = 'camara'
    t[1][2] = 'camara'
    t[3][2] = 'camara'

    const gs = grupos(t)
    const grupoCam = gs.find((g) => g.ficha === 'camara')
    expect(grupoCam).toBeDefined()
    expect(grupoCam!.celdas).toHaveLength(5)
    const set = new Set(grupoCam!.celdas.map(([f, c]) => `${f},${c}`))
    expect(set.size).toBe(5)
  })

  it('detecta correctamente si hay jugada disponible (hayJugada)', () => {
    const t: Tablero = [
      ['camara', 'rat', 'camara', 'rat', 'energia', 'rat'],
      ['rat', 'camara', 'rat', 'camara', 'rat', 'camara'],
      ['energia', 'espectrometro', 'energia', 'espectrometro', 'energia', 'espectrometro'],
      ['espectrometro', 'energia', 'espectrometro', 'energia', 'espectrometro', 'energia'],
      ['camara', 'rat', 'camara', 'rat', 'camara', 'rat'],
      ['rat', 'camara', 'rat', 'camara', 'rat', 'camara'],
    ]
    expect(hayJugada(t)).toBe(true)
  })

  it('detecta ausencia de jugadas posibles en tableros bloqueados', () => {
    const bloqueado: Tablero = [
      ['camara', 'rat', 'camara', 'rat', 'camara', 'rat'],
      ['espectrometro', 'energia', 'espectrometro', 'energia', 'espectrometro', 'energia'],
      ['camara', 'rat', 'camara', 'rat', 'camara', 'rat'],
      ['espectrometro', 'energia', 'espectrometro', 'energia', 'espectrometro', 'energia'],
      ['camara', 'rat', 'camara', 'rat', 'camara', 'rat'],
      ['espectrometro', 'energia', 'espectrometro', 'energia', 'espectrometro', 'energia'],
    ]
    expect(hayJugada(bloqueado)).toBe(false)
  })
})

describe('Reglas de Swaps, Movimientos y Puntuación', () => {
  it('rechaza swaps no adyacentes o diagonales sin modificar el estado', () => {
    const reglas = crearReglasLocal(1, 42, false)
    const ev = reglas.intentarSwap([0, 0], [1, 1]) // diagonal
    expect(ev).toEqual([])

    const ev2 = reglas.intentarSwap([0, 0], [0, 2]) // distancia 2
    expect(ev2).toEqual([])
  })

  it('revierte un swap que no genera combinación sin gastar movimientos', () => {
    const reglas = crearReglasLocal(1, 12345, false)
    const ini = reglas.tableroInicial()

    let swapInvalidoA: [number, number] | null = null
    let swapInvalidoB: [number, number] | null = null

    for (let f = 0; f < N && !swapInvalidoA; f++) {
      for (let c = 0; c < N && !swapInvalidoA; c++) {
        if (c + 1 < N && ini[f][c] !== ini[f][c + 1]) {
          const clon = ini.map((row) => [...row])
          const tmp = clon[f][c]
          clon[f][c] = clon[f][c + 1]
          clon[f][c + 1] = tmp
          if (grupos(clon).length === 0) {
            swapInvalidoA = [f, c]
            swapInvalidoB = [f, c + 1]
          }
        }
      }
    }

    if (swapInvalidoA && swapInvalidoB) {
      const ev = reglas.intentarSwap(swapInvalidoA, swapInvalidoB)
      expect(ev.some((e) => e.tipo === 'swapRevertido')).toBe(true)
      expect(reglas.movimientosRestantes()).toBe(reglas.movimientosMax())
    }
  })

  it('gasta 1 movimiento en swaps válidos y suma puntos por ficha eliminada', () => {
    const reglas = crearReglasLocal(1, 999, false)
    const ini = reglas.tableroInicial()

    let swapValidoA: [number, number] | null = null
    let swapValidoB: [number, number] | null = null

    for (let f = 0; f < N && !swapValidoA; f++) {
      for (let c = 0; c < N && !swapValidoA; c++) {
        for (const [df, dc] of [
          [0, 1],
          [1, 0],
        ]) {
          const f2 = f + df,
            c2 = c + dc
          if (f2 < N && c2 < N && ini[f][c] !== ini[f][c2]) {
            const clon = ini.map((r) => [...r])
            const v1 = clon[f][c],
              v2 = clon[f2][c2]
            clon[f][c] = v2
            clon[f2][c2] = v1
            if (grupos(clon).length > 0) {
              swapValidoA = [f, c]
              swapValidoB = [f2, c2]
              break
            }
          }
        }
      }
    }

    expect(swapValidoA).not.toBeNull()
    const ev = reglas.intentarSwap(swapValidoA!, swapValidoB!)
    expect(ev.some((e) => e.tipo === 'match')).toBe(true)
    expect(ev.some((e) => e.tipo === 'caida')).toBe(true)
    expect(reglas.movimientosRestantes()).toBe(reglas.movimientosMax() - 1)

    const res = reglas.resultado(1000)
    expect(res.puntos).toBeGreaterThanOrEqual(PUNTUACION_CONFIG.puntosPorFicha * 3)
  })

  it('en modo práctica los movimientos no se agotan y no se genera puntuación competitiva', () => {
    const reglas = crearReglasLocal(1, 777, true)
    const ini = reglas.tableroInicial()

    for (let f = 0; f < N; f++) {
      for (let c = 0; c < N; c++) {
        for (const [df, dc] of [
          [0, 1],
          [1, 0],
        ]) {
          const f2 = f + df,
            c2 = c + dc
          if (f2 < N && c2 < N && ini[f][c] !== ini[f][c2]) {
            const clon = ini.map((r) => [...r])
            clon[f][c] = ini[f2][c2]
            clon[f2][c2] = ini[f][c]
            if (grupos(clon).length > 0) {
              reglas.intentarSwap([f, c], [f2, c2])
              break
            }
          }
        }
      }
    }

    const res = reglas.resultado(5000)
    expect(res.practica).toBe(true)
    expect(res.puntos).toBe(0)
  })
})

describe('Reglas Educativas por Nivel', () => {
  it('Nivel 1: solo completa al reunir 6 cámaras y emite evento nieblaQuitada', () => {
    const reglas = crearReglasLocal(1, 100, false)
    expect(reglas.movimientosMax()).toBe(4)
    const ini = reglas.tableroInicial()
    expect(ini).toHaveLength(6)

    const rInicial = reglas.resultado(0)
    expect(rInicial.levelId).toBe(1)
    expect(rInicial.completado).toBe(false)
  })

  it('Nivel 2: REGLA EDUCATIVA OBLIGATORIA - los RAT deben completarse (6) antes de que el espectrómetro sume al objetivo', () => {
    const reglas = crearReglasLocal(2, 555, false)
    expect(reglas.movimientosMax()).toBe(8)

    // Jugar turnos verificando que espectrómetros antes de 6 RAT activan malaDecision
    let huboMalaDecision = false

    for (let f = 0; f < N && !huboMalaDecision; f++) {
      for (let c = 0; c < N && !huboMalaDecision; c++) {
        for (const [df, dc] of [
          [0, 1],
          [1, 0],
        ]) {
          const f2 = f + df,
            c2 = c + dc
          if (f2 < N && c2 < N) {
            const ev = reglas.intentarSwap([f, c], [f2, c2])
            if (ev.some((e) => e.tipo === 'malaDecision')) {
              huboMalaDecision = true
              const matchEsp = ev.find(
                (e) => e.tipo === 'match' && (e as { ficha: string }).ficha === 'espectrometro',
              )
              expect(matchEsp).toBeDefined()
              break
            }
          }
        }
      }
    }

    if (huboMalaDecision) {
      const r = reglas.resultado(2000)
      expect(r.malasDecisiones).toBeGreaterThan(0)
      expect(r.sinErroresDecision).toBe(false)
      expect(r.historialDecisiones.length).toBeGreaterThan(0)
    }
  })

  it('Nivel 3: requiere los 3 objetivos (cámara, espectrómetro, energía) y entrega evidencias oficiales', () => {
    const reglas = crearReglasLocal(3, 333, false)
    expect(reglas.movimientosMax()).toBe(7)
    const ini = reglas.progresoInicial()
    expect(ini.metas).toEqual({ camara: 6, espectrometro: 6, energia: 6 })

    const res = reglas.resultado(3000)
    expect(res.levelId).toBe(3)
    expect(res.completado).toBe(false)
  })

  it('reiniciar() restaura limpiamente el estado del juego', () => {
    const reglas = crearReglasLocal(1, 123, false)
    for (let f = 0; f < N; f++) {
      for (let c = 0; c < N; c++) {
        if (c + 1 < N) {
          const ev = reglas.intentarSwap([f, c], [f, c + 1])
          if (ev.some((e) => e.tipo === 'match')) break
        }
      }
    }

    reglas.reiniciar()
    expect(reglas.movimientosRestantes()).toBe(reglas.movimientosMax())
    const res = reglas.resultado(0)
    expect(res.puntos).toBe(0)
    expect(res.movimientosUsados).toBe(0)
    expect(res.malasDecisiones).toBe(0)
    expect(res.completado).toBe(false)
  })

  it('entrega un contrato de resultado completo y compatible con el portal', () => {
    const reglas = crearReglasLocal(2, 456, false)
    const r = reglas.resultado(12345)
    expect(r).toHaveProperty('levelId', 2)
    expect(r).toHaveProperty('completado')
    expect(r).toHaveProperty('puntos')
    expect(r).toHaveProperty('tiempoMs', 12345)
    expect(r).toHaveProperty('evidencias')
    expect(r).toHaveProperty('sinErroresDecision')
    expect(r).toHaveProperty('practica', false)
    expect(r).toHaveProperty('movimientosUsados')
    expect(r).toHaveProperty('movimientosRestantes')
    expect(r).toHaveProperty('malasDecisiones')
    expect(r).toHaveProperty('historialDecisiones')
    expect(r).toHaveProperty('objetivosCompletados')
  })
})

// ---------------------------------------------------------------------------
// Dificultad: jugadores guionizados sobre muchas semillas.
//
// WHY: GameHost seeds every board from Date.now(), so a single hand-picked seed
// proves nothing about difficulty. These helpers drive the REAL rules engine
// with two scripted players over a deterministic sweep of seeds, so the suite
// fails if the level ever becomes winnable by tapping at random again.
// ---------------------------------------------------------------------------

/** PRNG propio del jugador aleatorio: sembrado aparte para que el test nunca sea flaky. */
function prngTest(semilla: number) {
  let a = semilla
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Espejo del tablero reconstruido desde los eventos.
 * WHY: the engine never exposes its board, but the event stream fully describes
 * every change, so replaying it keeps the scripted player honest: it only ever
 * sees what the real UI sees.
 */
function aplicarEventos(tab: Tablero, ev: Evento[]): void {
  for (const e of ev) {
    if (e.tipo === 'swap' || e.tipo === 'swapRevertido') {
      const [fa, ca] = e.a
      const [fb, cb] = e.b
      const tmp = tab[fa][ca]
      tab[fa][ca] = tab[fb][cb]
      tab[fb][cb] = tmp
    } else if (e.tipo === 'match') {
      for (const [f, c] of e.celdas) tab[f][c] = null
    } else if (e.tipo === 'caida') {
      for (const m of e.movimientos) {
        tab[m.a[0]][m.a[1]] = tab[m.de[0]][m.de[1]]
        tab[m.de[0]][m.de[1]] = null
      }
      for (const n of e.nuevas) tab[n.a[0]][n.a[1]] = n.ficha
    } else if (e.tipo === 'mezcla') {
      for (let f = 0; f < N; f++) {
        for (let c = 0; c < N; c++) tab[f][c] = e.tablero[f][c]
      }
    }
  }
}

interface Jugada {
  a: Pos
  b: Pos
  gs: { ficha: Ficha; celdas: Pos[] }[]
  tras: Tablero
}

/** Todos los intercambios adyacentes que producen combinación. */
function jugadasValidas(tab: Tablero): Jugada[] {
  const out: Jugada[] = []
  for (let f = 0; f < N; f++) {
    for (let c = 0; c < N; c++) {
      for (const [df, dc] of [
        [0, 1],
        [1, 0],
      ]) {
        const f2 = f + df
        const c2 = c + dc
        if (f2 >= N || c2 >= N) continue
        const v1 = tab[f][c]
        const v2 = tab[f2][c2]
        if (!v1 || !v2 || v1 === v2) continue
        const tras = tab.map((r) => [...r])
        tras[f][c] = v2
        tras[f2][c2] = v1
        const gs = grupos(tras)
        if (gs.length > 0) out.push({ a: [f, c], b: [f2, c2], gs, tras })
      }
    }
  }
  return out
}

/**
 * Cuenta parejas adyacentes de fichas útiles que sobreviven a la combinación.
 * WHY: a competent player does not only cash in matches, they keep the board
 * stocked with near-matches of the type they still need. Refills are unknown,
 * so only surviving tiles count (gravity applied without refill).
 */
function potencial(tras: Tablero, gs: { celdas: Pos[] }[], util: (f: Ficha) => number): number {
  const t = tras.map((r) => [...r])
  for (const g of gs) {
    for (const [f, c] of g.celdas) t[f][c] = null
  }
  for (let c = 0; c < N; c++) {
    let r = N - 1
    for (let f = N - 1; f >= 0; f--) {
      const v = t[f][c]
      if (!v) continue
      t[r][c] = v
      if (f !== r) t[f][c] = null
      r--
    }
    for (let f = r; f >= 0; f--) t[f][c] = null
  }
  let n = 0
  for (let f = 0; f < N; f++) {
    for (let c = 0; c < N; c++) {
      const v = t[f][c]
      if (!v || util(v) <= 0) continue
      if (c + 1 < N && t[f][c + 1] === v) n++
      if (f + 1 < N && t[f + 1][c] === v) n++
    }
  }
  return n
}

/** Partida completa guiada por un jugador guionizado. Devuelve si ganó. */
function partida(
  levelId: number,
  seed: number,
  modo: 'azar' | 'habil',
  dado: () => number,
): boolean {
  const reglas = crearReglasLocal(levelId, seed, false, 'es')
  const metas = CONFIG_NIVELES[levelId].metas
  const tab: Tablero = reglas.tableroInicial().map((r) => [...r])
  let conteo: Partial<Record<Ficha, number>> = {}

  // Cuánto aporta todavía una ficha al objetivo (0 si ya está completa).
  const util = (ficha: Ficha): number => {
    const falta = (metas[ficha] ?? 0) - (conteo[ficha] ?? 0)
    if (falta <= 0) return 0
    // El nivel 2 no contabiliza espectrómetros hasta pulir con 6 RAT.
    if (levelId === 2 && ficha === 'espectrometro' && (conteo.rat ?? 0) < 6) return 0
    return falta
  }

  // Cota de seguridad: el presupuesto de movimientos termina la partida mucho antes.
  for (let turno = 0; turno < 200; turno++) {
    const posibles = jugadasValidas(tab)
    if (posibles.length === 0) break

    let elegida = posibles[0]
    if (modo === 'azar') {
      elegida = posibles[Math.floor(dado() * posibles.length)]
    } else {
      let mejor = -1
      let mejorPot = -1
      for (const j of posibles) {
        let puntos = 0
        for (const g of j.gs) {
          const u = util(g.ficha)
          if (u > 0) puntos += Math.min(u, g.celdas.length) * 10 + g.celdas.length
        }
        const pot = potencial(j.tras, j.gs, util)
        if (puntos > mejor || (puntos === mejor && pot > mejorPot)) {
          mejor = puntos
          mejorPot = pot
          elegida = j
        }
      }
    }

    const ev = reglas.intentarSwap(elegida.a, elegida.b)
    aplicarEventos(tab, ev)
    for (const e of ev) if (e.tipo === 'progreso') conteo = e.conteo
    if (ev.some((e) => e.tipo === 'nivelCompleto')) break
  }

  return reglas.resultado(0).completado
}

function tasaVictorias(levelId: number, modo: 'azar' | 'habil', semillas: number): number {
  // Semilla fija del jugador: la prueba debe dar exactamente el mismo número siempre.
  const dado = prngTest(90210 + levelId)
  let ganadas = 0
  for (let s = 1; s <= semillas; s++) {
    if (partida(levelId, s * 7919, modo, dado)) ganadas++
  }
  return ganadas / semillas
}

describe('Dificultad: el azar no puede ganar y el juego hábil sí', () => {
  const SEMILLAS = 150

  // Measured over 400 seeds with the current budgets (4 / 8 / 7), after cascades
  // stopped counting toward the goal: random 26.0 / 16.0 / 18.3 %, competent
  // 85.5 / 90.3 / 92.8 %. Before the fix (budgets 12 / 16 / 18, cascades counting
  // toward the goal) BOTH players won 100 % of the time on all three levels.
  const MAX_AZAR = 0.35
  const MIN_HABIL = 0.8

  for (const levelId of [1, 2, 3]) {
    it(`Nivel ${levelId}: un jugador al azar pierde la gran mayoría de las partidas`, () => {
      expect(tasaVictorias(levelId, 'azar', SEMILLAS)).toBeLessThan(MAX_AZAR)
    })

    it(`Nivel ${levelId}: un jugador que apunta al objetivo sigue ganando con holgura`, () => {
      expect(tasaVictorias(levelId, 'habil', SEMILLAS)).toBeGreaterThan(MIN_HABIL)
    })
  }

  it('el jugador hábil gana al menos el doble que el azar en los tres niveles', () => {
    // WHY: both absolute thresholds could drift together; the gap between the two
    // players is the property that actually encodes "skill decides the outcome".
    for (const levelId of [1, 2, 3]) {
      const azar = tasaVictorias(levelId, 'azar', SEMILLAS)
      const habil = tasaVictorias(levelId, 'habil', SEMILLAS)
      expect(habil).toBeGreaterThan(azar * 2)
    }
  })

  it('las cascadas puntúan pero no suman al objetivo del nivel', () => {
    // WHY: this is the rule that forces the player to aim. Without it, whatever
    // falls in after a match satisfies the goal and random tapping clears the game.
    const reglas = crearReglasLocal(1, 2468, false)
    const tab: Tablero = reglas.tableroInicial().map((r) => [...r])
    let comprobado = false

    for (let turno = 0; turno < 4 && !comprobado; turno++) {
      const posibles = jugadasValidas(tab)
      if (posibles.length === 0) break
      const j = posibles[turno % posibles.length]
      const ev = reglas.intentarSwap(j.a, j.b)

      // Más de una 'caida' en el mismo turno significa que hubo cascada.
      const hayCascada = ev.filter((e) => e.tipo === 'caida').length > 1
      if (hayCascada) {
        const camarasTotales = ev
          .filter(
            (e): e is Extract<Evento, { tipo: 'match' }> =>
              e.tipo === 'match' && e.ficha === 'camara',
          )
          .reduce((n, m) => n + m.celdas.length, 0)
        const progresos = ev.filter(
          (e): e is Extract<Evento, { tipo: 'progreso' }> => e.tipo === 'progreso',
        )
        const contabilizadas = progresos[progresos.length - 1].conteo.camara ?? 0
        // Hubo cámaras eliminadas en cascada: el objetivo no puede haberlas contado todas.
        if (camarasTotales > 0 && contabilizadas > 0 && camarasTotales > contabilizadas) {
          expect(contabilizadas).toBeLessThan(camarasTotales)
          comprobado = true
        }
      }
      aplicarEventos(tab, ev)
      if (ev.some((e) => e.tipo === 'nivelCompleto')) break
    }
  })
})

import { describe, expect, it } from 'vitest'
import { crearReglasLocal, grupos, hayJugada, N, type Tablero } from './reglasLocal'
import { PUNTUACION_CONFIG } from './config'
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


/** Un jugador guionizado que solo usa lo que el jugador real ve: el puerto de reglas. */
function jugar(levelId: number, seed: number, modo: 'azar' | 'habil', dado: () => number) {
  const reglas = crearReglasLocal(levelId, seed, false)
  const tab: Tablero = reglas.tableroInicial().map((r) => [...r])
  const puntos = ['A', 'B', 'C'] as const
  let envios = 0

  /** Qué ficha quiere el jugador hábil ahora y sobre qué punto. */
  const querer = (): { punto: (typeof puntos)[number]; ficha: Ficha } | 'informe' | null => {
    const v = reglas.roca()
    if (v.energia === 0 && v.elegido) return { punto: v.elegido, ficha: 'energia' }
    if (levelId === 1) {
      const p = v.puntos.find((x) => !x.fotografiado)
      return p ? { punto: p.id, ficha: 'camara' } : null
    }
    if (levelId === 2) {
      const p = v.puntos[0]
      return { punto: p.id, ficha: p.pulido ? 'espectrometro' : 'rat' }
    }
    // Nivel 3: fotografiar hasta ver dos puntos con rasgos, y pulir y leer esos dos.
    const e = v.evidencias
    if (e.imagen && e.quimica && e.segundo) return 'informe'
    const conRasgo = v.puntos.filter((x) => x.fotografiado && !x.perturbado && x.rasgo !== 'lisa')
    const sinFoto = v.puntos.find((x) => !x.fotografiado)
    if (conRasgo.length < 2 && sinFoto) return { punto: sinFoto.id, ficha: 'camara' }
    for (const p of conRasgo) {
      if (!p.pulido) return { punto: p.id, ficha: 'rat' }
      if (p.lectura === null || p.lectura === 'polvo') return { punto: p.id, ficha: 'espectrometro' }
    }
    return 'informe'
  }

  for (let turno = 0; turno < 120; turno++) {
    const posibles = jugadasValidas(tab)
    if (posibles.length === 0) break
    let ev: Evento[] = []

    if (modo === 'azar') {
      reglas.elegirPunto(puntos[Math.floor(dado() * 3)])
      if (levelId === 3 && dado() < 0.12) {
        envios++
        ev = reglas.enviarInforme()
      } else {
        const j = posibles[Math.floor(dado() * posibles.length)]
        ev = reglas.intentarSwap(j.a, j.b)
      }
    } else {
      const q = querer()
      if (q === 'informe') {
        envios++
        ev = reglas.enviarInforme()
      } else {
        const objetivo = q ?? { punto: 'A' as const, ficha: 'energia' as Ficha }
        reglas.elegirPunto(objetivo.punto)
        const buenas = posibles.filter((j) => j.gs.some((g) => g.ficha === objetivo.ficha))
        const sinTocar = posibles.filter((j) => j.gs.every((g) => g.ficha === 'energia'))
        const j = (buenas.length ? buenas : sinTocar)[0]
        // Sin la combinación que quiere, el jugador que sabe baraja en vez de tocar la roca por error.
        ev = j ? reglas.intentarSwap(j.a, j.b) : reglas.barajar()
      }
    }
    aplicarEventos(tab, ev)
    if (ev.some((e) => e.tipo === 'nivelCompleto')) break
  }
  const r = reglas.resultado(0)
  return { r, envios }
}

function tasa(levelId: number, modo: 'azar' | 'habil', semillas: number, limpia: boolean): number {
  const dado = prngTest(90210 + levelId)
  let ok = 0
  for (let s = 1; s <= semillas; s++) {
    const { r } = jugar(levelId, s * 7919, modo, dado)
    if (r.completado && (!limpia || r.sinErroresDecision)) ok++
  }
  return ok / semillas
}

describe('Reglas educativas por nivel (la roca)', () => {
  it('sin un punto elegido, las herramientas no actúan y el swap no cuesta movimiento', () => {
    const reglas = crearReglasLocal(2, 31, false)
    const tab: Tablero = reglas.tableroInicial().map((r) => [...r])
    const j = jugadasValidas(tab).find((x) => x.gs.some((g) => g.ficha !== 'energia'))
    if (!j) return
    const ev = reglas.intentarSwap(j.a, j.b)
    expect(ev.some((e) => e.tipo === 'aviso')).toBe(true)
    expect(ev.some((e) => e.tipo === 'swapRevertido')).toBe(true)
    expect(reglas.movimientosRestantes()).toBe(reglas.movimientosMax())
  })

  it('nivel 3: el informe solo se acepta con las tres líneas de evidencia', () => {
    const dado = prngTest(7)
    const { r, envios } = jugar(3, 4242, 'habil', dado)
    expect(envios).toBeGreaterThan(0)
    expect(r.completado).toBe(true)
    expect(r.decisiones.every((d) => d.concept === 'varias-evidencias')).toBe(true)
    expect(r.evidencias).toEqual(['ev-blueberries', 'agua-antigua'])
  })

  it('nivel 3: enviar el informe sin pruebas es un concepto fallado y el nivel sigue', () => {
    const reglas = crearReglasLocal(3, 99, false)
    const ev = reglas.enviarInforme()
    expect(ev.some((e) => e.tipo === 'nivelCompleto')).toBe(false)
    const r = reglas.resultado(0)
    expect(r.decisiones).toEqual([
      expect.objectContaining({ concept: 'varias-evidencias', correct: false }),
    ])
    expect(r.sinErroresDecision).toBe(false)
  })

  it('fuera de nivel 3 no hay informe', () => {
    expect(crearReglasLocal(1, 5, false).enviarInforme()).toEqual([])
    expect(crearReglasLocal(1, 5, false).informeDisponible()).toBe(false)
    expect(crearReglasLocal(3, 5, false).informeDisponible()).toBe(true)
  })

  it('la práctica deja probar todo y no guarda decisiones ni termina el nivel', () => {
    const reglas = crearReglasLocal(1, 11, true)
    const tab: Tablero = reglas.tableroInicial().map((r) => [...r])
    reglas.elegirPunto('A')
    for (let i = 0; i < 25; i++) {
      const posibles = jugadasValidas(tab)
      if (!posibles.length) break
      const j = posibles[i % posibles.length]
      aplicarEventos(tab, reglas.intentarSwap(j.a, j.b))
    }
    const r = reglas.resultado(0)
    expect(r.practica).toBe(true)
    expect(r.puntos).toBe(0)
    expect(r.completado).toBe(false)
    expect(reglas.movimientosRestantes()).toBe(reglas.movimientosMax())
  })

  it('reiniciar() restaura limpiamente el estado del juego', () => {
    const reglas = crearReglasLocal(2, 5, false)
    const tab: Tablero = reglas.tableroInicial().map((r) => [...r])
    reglas.elegirPunto('A')
    const j = jugadasValidas(tab)[0]
    reglas.intentarSwap(j.a, j.b)
    reglas.reiniciar()
    expect(reglas.movimientosRestantes()).toBe(reglas.movimientosMax())
    expect(reglas.resultado(0).puntos).toBe(0)
    expect(reglas.resultado(0).decisiones).toEqual([])
    expect(reglas.roca().elegido).toBeNull()
  })

  it('entrega un contrato de resultado completo y compatible con el portal', () => {
    const { r } = jugar(2, 1234, 'habil', prngTest(1))
    expect(r.levelId).toBe(2)
    expect(r.completado).toBe(true)
    expect(r.puntos).toBeGreaterThan(PUNTUACION_CONFIG.bonoVictoria)
    expect(r.decisiones.length).toBeGreaterThan(0)
    expect(r.decisiones.every((d) => d.concept === 'pulir-antes-de-analizar')).toBe(true)
  })
})

describe('Dificultad: el azar no gana limpio y el juego hábil sí', () => {
  const SEMILLAS = 120
  // "Limpio" = ganar sin ninguna decisión mal hecha: es lo que mide al profesor.
  const MAX_AZAR = 0.35
  const MIN_HABIL = 0.8

  for (const levelId of [1, 2, 3]) {
    it(`Nivel ${levelId}: un jugador al azar casi nunca gana sin errores`, () => {
      expect(tasa(levelId, 'azar', SEMILLAS, true)).toBeLessThan(MAX_AZAR)
    })

    it(`Nivel ${levelId}: un jugador que sabe qué hacer gana con holgura y sin errores`, () => {
      expect(tasa(levelId, 'habil', SEMILLAS, true)).toBeGreaterThan(MIN_HABIL)
    })
  }
})

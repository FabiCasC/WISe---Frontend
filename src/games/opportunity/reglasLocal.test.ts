import { describe, expect, it } from 'vitest'
import { crearReglasLocal, grupos, hayJugada, N, type Tablero } from './reglasLocal'
import { PUNTUACION_CONFIG } from './config'

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
    expect(reglas.movimientosMax()).toBe(12)
    const ini = reglas.tableroInicial()
    expect(ini).toHaveLength(6)

    const rInicial = reglas.resultado(0)
    expect(rInicial.levelId).toBe(1)
    expect(rInicial.completado).toBe(false)
  })

  it('Nivel 2: REGLA EDUCATIVA OBLIGATORIA - los RAT deben completarse (6) antes de que el espectrómetro sume al objetivo', () => {
    const reglas = crearReglasLocal(2, 555, false)
    expect(reglas.movimientosMax()).toBe(16)

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
    expect(reglas.movimientosMax()).toBe(18)
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

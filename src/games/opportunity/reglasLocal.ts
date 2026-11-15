import type { Conteo, Evento, Ficha, Pos, PuertoReglas, Resultado } from './events'
import type { Lang } from '../../shared/types'
import { CONFIG_NIVELES, PUNTUACION_CONFIG, obtenerTextoNivel } from './config'

// Lógica del juego determinista (seed): tablero 6x6, combinaciones, cascadas,
// niveles, puntuación centralizada y control pedagógico.

export const N = 6
export const TIPOS: Ficha[] = ['camara', 'rat', 'espectrometro', 'energia']

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Tablero = (Ficha | null)[][]

/**
 * Detecta todos los grupos de 3 o más fichas iguales en horizontal o vertical.
 * Garantiza que cada celda de una combinación se incluya una sola vez (evita duplicar en cruces L o T).
 * Retorna los grupos ordenados para que en el nivel 2 las fichas RAT se procesen antes que espectrómetros.
 */
export function grupos(t: Tablero): { ficha: Ficha; celdas: Pos[] }[] {
  const marca: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false))
  for (let f = 0; f < N; f++) {
    for (let c = 0; c < N; c++) {
      const v = t[f][c]
      if (!v) continue

      // Horizontal
      let k = c
      while (k + 1 < N && t[f][k + 1] === v) k++
      if (k - c >= 2) {
        for (let i = c; i <= k; i++) marca[f][i] = true
      }

      // Vertical
      k = f
      while (k + 1 < N && t[k + 1][c] === v) k++
      if (k - f >= 2) {
        for (let i = f; i <= k; i++) marca[i][c] = true
      }
    }
  }

  const out = new Map<Ficha, Pos[]>()
  for (let f = 0; f < N; f++) {
    for (let c = 0; c < N; c++) {
      if (marca[f][c]) {
        const v = t[f][c] as Ficha
        if (!out.has(v)) out.set(v, [])
        out.get(v)!.push([f, c])
      }
    }
  }

  // RAT primero: fundamental en el nivel 2 para procesar el pulido antes del análisis.
  return TIPOS.filter((x) => out.has(x)).map((ficha) => ({ ficha, celdas: out.get(ficha)! }))
}

/** Comprueba si existe al menos un movimiento válido que genere un match de 3 o más. */
export function hayJugada(t: Tablero): boolean {
  for (let f = 0; f < N; f++) {
    for (let c = 0; c < N; c++) {
      for (const [df, dc] of [
        [0, 1],
        [1, 0],
      ]) {
        const f2 = f + df,
          c2 = c + dc
        if (f2 >= N || c2 >= N) continue
        const v1 = t[f][c]
        const v2 = t[f2][c2]
        if (!v1 || !v2 || v1 === v2) continue

        t[f][c] = v2
        t[f2][c2] = v1
        const ok = grupos(t).length > 0
        t[f][c] = v1
        t[f2][c2] = v2
        if (ok) return true
      }
    }
  }
  return false
}

export function crearReglasLocal(
  levelId: number,
  seed: number,
  practica: boolean,
  lang: Lang = 'es',
): PuertoReglas {
  const nivel = CONFIG_NIVELES[levelId] ?? CONFIG_NIVELES[1]
  const textos = obtenerTextoNivel(nivel, lang)
  let rng = mulberry32(seed || 1)
  const azar = (): Ficha => TIPOS[Math.floor(rng() * TIPOS.length)]

  function generar(): Ficha[][] {
    for (let intento = 0; intento < 200; intento++) {
      const t: Tablero = Array.from({ length: N }, () => Array(N).fill(null))
      for (let f = 0; f < N; f++) {
        for (let c = 0; c < N; c++) {
          let v: Ficha
          do {
            v = azar()
          } while (
            (c >= 2 && t[f][c - 1] === v && t[f][c - 2] === v) ||
            (f >= 2 && t[f - 1][c] === v && t[f - 2][c] === v)
          )
          t[f][c] = v
        }
      }
      if (hayJugada(t)) return t as Ficha[][]
    }
    // Fallback de seguridad en caso extremo
    const fb: Ficha[][] = [
      ['camara', 'rat', 'camara', 'rat', 'camara', 'rat'],
      ['rat', 'camara', 'rat', 'camara', 'rat', 'camara'],
      ['espectrometro', 'energia', 'espectrometro', 'energia', 'espectrometro', 'energia'],
      ['energia', 'espectrometro', 'energia', 'espectrometro', 'energia', 'espectrometro'],
      ['camara', 'rat', 'espectrometro', 'camara', 'rat', 'espectrometro'],
      ['rat', 'camara', 'espectrometro', 'rat', 'camara', 'espectrometro'],
    ]
    return fb
  }

  let tablero: Tablero = generar()
  let inicial: Ficha[][] = tablero.map((r) => [...r]) as Ficha[][]
  let conteo: Conteo = {}
  let movs = nivel.movimientos
  let movsUsados = 0
  let puntos = 0
  let fin = false
  let ganado = false
  let malas = 0
  let historialDecisiones: string[] = []
  let nieblaQuitada = 0

  const sumar = (n: number) => {
    if (!practica) puntos += n
  }

  const progreso = (): Extract<Evento, { tipo: 'progreso' }> => ({
    tipo: 'progreso',
    conteo: { ...conteo },
    metas: nivel.metas,
    puntos,
  })

  const cumplida = () =>
    Object.entries(nivel.metas).every(([k, m]) => (conteo[k as Ficha] ?? 0) >= (m as number))

  function reiniciar(): void {
    rng = mulberry32((seed || 1) + Date.now())
    tablero = generar()
    inicial = tablero.map((r) => [...r]) as Ficha[][]
    conteo = {}
    movs = nivel.movimientos
    movsUsados = 0
    puntos = 0
    fin = false
    ganado = false
    malas = 0
    historialDecisiones = []
    nieblaQuitada = 0
  }

  function intentarSwap(a: Pos, b: Pos): Evento[] {
    if (fin) return []
    // Solo permitir adyacentes horizontal o vertical
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return []

    const ev: Evento[] = [{ tipo: 'swap', a, b }]
    const t = tablero
    const va = t[a[0]][a[1]]
    const vb = t[b[0]][b[1]]
    t[a[0]][a[1]] = vb
    t[b[0]][b[1]] = va

    // Intercambio inválido: no produce match, se revierte sin consumir movimientos
    if (grupos(t).length === 0) {
      t[a[0]][a[1]] = va
      t[b[0]][b[1]] = vb
      ev.push({ tipo: 'swapRevertido', a: b, b: a })
      return ev
    }

    // Intercambio válido: consume movimiento (en modo normal)
    movsUsados++
    if (!practica) movs--
    ev.push({
      tipo: 'energia',
      delta: practica ? 0 : -1,
      restante: practica ? nivel.movimientos : movs,
    })

    // Resolución de combinaciones y cascadas
    for (let k = 0; ; k++) {
      const gs = grupos(t)
      if (gs.length === 0) break

      if (k > 0) {
        sumar(PUNTUACION_CONFIG.bonoCascadaPorNivel * k)
      }

      for (const g of gs) {
        sumar(PUNTUACION_CONFIG.puntosPorFicha * g.celdas.length)
        ev.push({ tipo: 'match', celdas: g.celdas, ficha: g.ficha })

        const esMeta = g.ficha in nivel.metas

        // REGLA EDUCATIVA NIVEL 2:
        // El jugador DEBE completar primero las 6 unidades de RAT antes de contabilizar espectrómetros.
        // Solo cuenta como mala decision el intercambio del jugador (k === 0):
        // una cascada automatica no la decidio nadie y no debe castigarse.
        if (levelId === 2 && g.ficha === 'espectrometro' && (conteo.rat ?? 0) < 6) {
          if (k > 0) continue
          malas++
          const desc =
            lang === 'en'
              ? 'Grind the rock with 6 RAT first before using the spectrometer.'
              : 'Pule primero la roca con las 6 herramientas RAT antes de usar el espectrómetro.'
          historialDecisiones.push(desc)
          ev.push({
            tipo: 'malaDecision',
            mensaje: desc,
          })
          // Las fichas eliminadas puntúan normalmente, pero NO suman al objetivo.
        } else if (esMeta) {
          conteo[g.ficha] = (conteo[g.ficha] ?? 0) + g.celdas.length
        }
      }

      // NIVEL 1: Cada cámara revela una de las 6 zonas de la foto de la roca
      if (levelId === 1) {
        const zonas = Math.min(6, conteo.camara ?? 0) - nieblaQuitada
        if (zonas > 0) {
          nieblaQuitada += zonas
          ev.push({ tipo: 'nieblaQuitada', zonas })
        }
      }

      // Quitar fichas combinadas, aplicar gravedad y reponer desde arriba
      const movimientos: { de: Pos; a: Pos }[] = []
      const nuevas: { a: Pos; ficha: Ficha }[] = []

      for (const g of gs) {
        for (const [f, c] of g.celdas) t[f][c] = null
      }

      for (let c = 0; c < N; c++) {
        let r = N - 1
        for (let f = N - 1; f >= 0; f--) {
          const v = t[f][c]
          if (!v) continue
          if (f !== r) {
            movimientos.push({ de: [f, c], a: [r, c] })
            t[r][c] = v
            t[f][c] = null
          }
          r--
        }
        for (let f = r; f >= 0; f--) {
          const v = azar()
          t[f][c] = v
          nuevas.push({ a: [f, c], ficha: v })
        }
      }

      ev.push({ tipo: 'caida', movimientos, nuevas })
      ev.push(progreso())
    }

    // Comprobación de estado final
    if (cumplida()) {
      fin = ganado = true
      if (!practica) {
        sumar(
          PUNTUACION_CONFIG.bonoVictoria +
            PUNTUACION_CONFIG.bonoPorMovimientoRestante * Math.max(0, movs) +
            (malas === 0 ? PUNTUACION_CONFIG.bonoSinMalasDecisiones : 0),
        )
      }
      ev.push(progreso(), { tipo: 'nivelCompleto', ganado: true })
    } else if (!practica && movs <= 0) {
      fin = true
      ganado = false
      ev.push({ tipo: 'nivelCompleto', ganado: false })
    } else if (!hayJugada(t)) {
      // Remezcla automática segura sin costo ni bucle infinito
      let exito = false
      for (let intento = 0; intento < 60; intento++) {
        const planas = t.flat() as Ficha[]
        for (let i = planas.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1))
          ;[planas[i], planas[j]] = [planas[j], planas[i]]
        }
        for (let f = 0; f < N; f++) {
          for (let c = 0; c < N; c++) {
            t[f][c] = planas[f * N + c]
          }
        }
        if (grupos(t).length === 0 && hayJugada(t)) {
          exito = true
          break
        }
      }
      if (!exito) {
        // Si barajar las mismas fichas no produce un tablero válido, generar de cero
        const nuevoT = generar()
        for (let f = 0; f < N; f++) {
          for (let c = 0; c < N; c++) {
            t[f][c] = nuevoT[f][c]
          }
        }
      }
      ev.push({ tipo: 'mezcla', tablero: t.map((r) => [...r]) as Ficha[][] })
    }

    return ev
  }

  return {
    tableroInicial: () => inicial,
    progresoInicial: progreso,
    intentarSwap,
    reiniciar,
    objetivo: () => textos.objetivo,
    nota: () => textos.nota,
    explicacionVictoria: () => textos.victoria,
    explicacionDerrota: () => textos.derrota,
    movimientosMax: () => nivel.movimientos,
    movimientosRestantes: () => (practica ? nivel.movimientos : movs),
    zonasNiebla: () => 6,
    obtenerMalasDecisiones: () => malas,
    obtenerLang: () => lang,
    resultado: (tiempoMs: number): Resultado => ({
      levelId,
      completado: ganado,
      puntos: practica ? 0 : puntos,
      tiempoMs,
      evidencias: ganado && !practica ? nivel.evidencias : [],
      sinErroresDecision: malas === 0,
      practica,
      movimientosUsados: movsUsados,
      movimientosRestantes: practica ? nivel.movimientos : Math.max(0, movs),
      malasDecisiones: malas,
      historialDecisiones: [...historialDecisiones],
      objetivosCompletados: { ...conteo },
    }),
  }
}

import Phaser from 'phaser'
import type { GameContext, GameController, GameResult } from '../../shared/types'
import { OpportunityScene } from './scene'
import { crearReglasLocal } from './reglasLocal'
import type { Conteo } from './events'

// Extensión de GameResult con datos detallados para el seguimiento docente
export interface OpportunityResult extends GameResult {
  movimientosUsados: number
  movimientosRestantes: number
  malasDecisiones: number
  objetivosCompletados: Conteo
  historialDecisiones: string[]
}

// La semilla del portal es un string; las reglas usan un número.
function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const reglas = crearReglasLocal(
    ctx.levelId,
    hashSeed(ctx.seed),
    ctx.settings.practice,
    ctx.settings.lang,
  )

  // Reloj que no cuenta el tiempo en pausa.
  let acumulado = 0
  let desde: number | null = performance.now()
  const tiempoMs = () => acumulado + (desde === null ? 0 : performance.now() - desde)
  const reiniciarTiempo = () => {
    acumulado = 0
    desde = performance.now()
  }

  let completado = false
  const scene = new OpportunityScene({
    reglas,
    ajustes: ctx.settings,
    levelId: ctx.levelId,
    tiempoMs,
    reiniciarTiempo,
    alSalir: () => {
      ctx.onExit()
    },
    alTerminar: () => {
      if (completado) return // onComplete se llama una sola vez por partida
      completado = true
      const r = reglas.resultado(tiempoMs())
      const result: OpportunityResult = {
        gameId: 'opportunity',
        levelId: ctx.levelId,
        score: r.puntos,
        durationMs: Math.round(r.tiempoMs),
        completed: r.completado,
        evidenceIds: r.evidencias,
        firstAnswerCorrect: r.sinErroresDecision,
        movimientosUsados: r.movimientosUsados,
        movimientosRestantes: r.movimientosRestantes,
        malasDecisiones: r.malasDecisiones,
        objetivosCompletados: r.objetivosCompletados,
        historialDecisiones: r.historialDecisiones,
      }
      ctx.onComplete(result)
    },
  })

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    backgroundColor: '#0c101c',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
    },
    scene,
  })

  // Asegura que el canvas no herede márgenes desfasados por flex/grid
  requestAnimationFrame(() => {
    const canvas = container.querySelector('canvas')
    if (canvas) {
      canvas.style.margin = '0'
      canvas.style.display = 'block'
    }
  })

  let destruido: Promise<void> | null = null
  return {
    pause() {
      if (desde !== null) {
        acumulado += performance.now() - desde
        desde = null
      }
      scene.pausar()
    },
    resume() {
      if (desde === null) desde = performance.now()
      scene.reanudar()
    },
    destroy(): Promise<void> {
      return (destruido ??= new Promise<void>((resolve) => {
        scene.limpiar()
        game.events.once(Phaser.Core.Events.DESTROY, () => {
          const esperar = () =>
            container.querySelector('canvas') ? requestAnimationFrame(esperar) : resolve()
          esperar()
        })
        game.destroy(true)
      }))
    },
  }
}

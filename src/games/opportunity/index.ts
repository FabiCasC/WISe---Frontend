import Phaser from 'phaser'
import type { GameContext, GameController, GameResult } from '../../shared/types'
import { OpportunityScene, W, H } from './scene'
import { crearReglasLocal } from './reglasLocal'

// La semilla del portal es un string; las reglas usan un número.
function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const reglas = crearReglasLocal(ctx.levelId, hashSeed(ctx.seed), ctx.settings.practice)

  // Reloj que no cuenta el tiempo en pausa.
  let acumulado = 0
  let desde: number | null = performance.now()
  const tiempoMs = () => acumulado + (desde === null ? 0 : performance.now() - desde)

  let completado = false
  const scene = new OpportunityScene({
    reglas,
    ajustes: ctx.settings,
    levelId: ctx.levelId,
    tiempoMs,
    alTerminar: () => {
      if (completado) return // onComplete se llama una sola vez por partida
      completado = true
      const r = reglas.resultado(tiempoMs())
      const result: GameResult = {
        gameId: 'opportunity',
        levelId: ctx.levelId,
        score: r.puntos,
        durationMs: Math.round(r.tiempoMs),
        completed: r.completado,
        evidenceIds: r.evidencias,
        firstAnswerCorrect: r.sinErroresDecision,
      }
      ctx.onComplete(result)
    },
  })

  const game = new Phaser.Game({
    type: Phaser.AUTO, parent: container, width: W, height: H, backgroundColor: '#0c0d45',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene,
  })

  let destruido: Promise<void> | null = null
  return {
    pause() {
      if (desde !== null) { acumulado += performance.now() - desde; desde = null }
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
          const esperar = () => (container.querySelector('canvas') ? requestAnimationFrame(esperar) : resolve())
          esperar()
        })
        game.destroy(true)
      }))
    },
  }
}
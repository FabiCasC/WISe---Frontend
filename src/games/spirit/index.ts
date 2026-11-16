import Phaser from 'phaser'
import type { GameContext, GameController, GameResult } from '../../shared/types'
import { getMission } from '../../content/missions'
import { H, W } from './engine/config'
import { MainScene } from './engine/MainScene'
import { createGlossary, el } from '../shared/glossary'
import { TERMS } from './terms'

export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const mission = getMission('spirit')
  const startedAt = performance.now()
  let pausedAt: number | null = null
  let pausedMs = 0
  let settled = false

  const scene = new MainScene({
    levelId: ctx.levelId,
    practice: ctx.settings.practice,
    reducedMotion: ctx.settings.reducedMotion,
    onFinish: (completed, score, decisions) => {
      if (settled) return
      settled = true
      const result: GameResult = {
        gameId: 'spirit',
        levelId: ctx.levelId,
        score: ctx.settings.practice ? 0 : score,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt - pausedMs)),
        completed,
        evidenceIds: completed ? (mission?.evidence.map((item) => item.id) ?? []) : [],
        firstAnswerCorrect: completed && decisions.every((d) => d.correct),
        decisions: ctx.settings.practice ? [] : decisions,
      }
      ctx.onComplete(result)
    },
  })

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: W,
    height: H,
    backgroundColor: '#0d2334',
    scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true },
  })

  // The scene draws on a canvas, so the words get their own help button and screen over it.
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative'
  const gl = createGlossary(container, TERMS)
  const helpBtn = el('button', 'gl-help', '?')
  helpBtn.type = 'button'
  helpBtn.setAttribute('aria-label', 'Help: what the words mean')
  helpBtn.addEventListener('click', () => gl.openHelp())
  container.append(helpBtn)

  let destruction: Promise<void> | null = null
  return {
    pause() {
      if (pausedAt !== null) return
      pausedAt = performance.now()
      game.scene.pause('Main')
    },
    resume() {
      if (pausedAt !== null) {
        pausedMs += performance.now() - pausedAt
        pausedAt = null
      }
      game.scene.resume('Main')
    },
    destroy() {
      gl.destroy()
      helpBtn.remove()
      return (destruction ??= new Promise<void>((resolve) => {
        game.events.once(Phaser.Core.Events.DESTROY, () => {
          const waitForCanvasRemoval = () => {
            if (container.querySelector('canvas')) requestAnimationFrame(waitForCanvasRemoval)
            else resolve()
          }
          waitForCanvasRemoval()
        })
        game.destroy(true)
      }))
    },
  }
}

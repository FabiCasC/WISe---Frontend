import type { GameContext, GameController } from '../../shared/types'
import { getMission } from '../../content/missions'
import { COPY, FICHA_SOURCE_URL } from './copy'
import { el, type Env } from './dom'
import { buildLevel1 } from './level1'
import { buildQuakeLevel } from './level2'
import { LEVEL2_QUAKE, LEVEL3_QUAKE } from './levels'
import { newMetrics, recordAttempt, recordJudgement } from './rules'
import { createSfx } from './sound'
import { STYLES } from './styles'

const BASE_SCORE = 1000
const WRONG_PENALTY = 150
const MIN_SCORE = 100

export function mountSignals(container: HTMLElement, ctx: GameContext): GameController {
  let paused = false
  let destroyed = false
  let finished = false
  let sent = false
  let activeMs = 0
  let wrong = 0
  let failed = false
  let metrics = newMetrics()
  /** Every judged attempt is one decision about this level's concept. */
  const concept =
    ctx.levelId === 1 ? 'laser-mide-distancia' : ctx.levelId === 2 ? 'tres-estaciones-ubican-sismo' : 'datos-insuficientes'
  const decisions: { concept: string; correct: boolean }[] = []
  let raf = 0
  const sfx = createSfx(ctx.settings.volume)

  // ── Structure ──
  const root = el('div', 'ls-root')
  if (ctx.settings.reducedMotion) root.classList.add('is-reduced')
  const style = el('style')
  style.textContent = STYLES

  // LevelId pasó a ser number en el contrato v2; este juego tiene los niveles 1 a 3.
  const intro = COPY.intro[ctx.levelId as keyof typeof COPY.intro] ?? COPY.intro[1]
  const head = el('header', 'ls-head')
  head.append(el('h2', 'ls-title', intro.title), el('p', 'ls-text', intro.text))

  const stage = el('div', 'ls-stage')
  const end = el('section', 'ls-end')
  end.hidden = true

  const pauseLayer = el('div', 'ls-pause', 'Paused')
  pauseLayer.setAttribute('role', 'status')

  root.append(style, head, stage, end, pauseLayer)
  container.append(root)

  // ── Result ──
  const complete = () => {
    if (sent) return
    sent = true
    const mission = getMission(ctx.gameId)
    ctx.onComplete({
      gameId: ctx.gameId,
      levelId: ctx.levelId,
      // Practice mode does not score (see Settings).
      score: ctx.settings.practice ? 0 : failed ? 0 : Math.max(MIN_SCORE, BASE_SCORE - WRONG_PENALTY * wrong),
      durationMs: Math.round(activeMs),
      // A level that ran out of attempts is NOT completed: reporting every run
      // as a success made every wrong answer free.
      completed: !failed,
      evidenceIds: mission?.evidence.map((e) => e.id) ?? [],
      firstAnswerCorrect: metrics.firstAttemptCorrect,
      decisions: ctx.settings.practice ? [] : decisions,
    })
  }

  /** Shared tail of both endings: conclusion text plus the sealing button. */
  const closeWith = (text: string, label: string, ok: boolean) => {
    finished = true
    stage.inert = true // the attempt is over: no more fiddling with the sliders
    end.replaceChildren(el('p', '', text))
    end.classList.toggle('is-failed', !ok)

    if (ok && ctx.levelId === 3) {
      const ficha = el('div', 'ls-ficha')
      const link = el('a', '', COPY.ficha.link)
      link.href = FICHA_SOURCE_URL
      link.target = '_blank'
      link.rel = 'noreferrer noopener'
      ficha.append(el('h3', '', COPY.ficha.title), el('p', '', COPY.ficha.text), link)
      end.append(ficha)
    }

    const seal = el('button', 'btn btn--primary', label)
    seal.type = 'button'
    seal.addEventListener('click', complete)
    end.append(seal)
    end.hidden = false
    seal.focus()
  }

  const env: Env = {
    stage,
    reducedMotion: ctx.settings.reducedMotion,
    sfx,
    judge(correct) {
      metrics = recordAttempt(metrics, correct)
      decisions.push({ concept, correct })
      const log = recordJudgement(wrong, correct)
      wrong = log.wrong
      // Running out of attempts ends the level as a loss. Without this the
      // "too small / too big" hints make the sliders a free binary search.
      if (log.failed && !finished) {
        failed = true
        sfx.bad()
        closeWith(COPY.failed, COPY.sealFailed, false)
      }
      return log.left
    },
    finish(conclusion) {
      if (finished) return
      sfx.done()
      closeWith(conclusion, COPY.seal, true)
    },
  }

  const run =
    ctx.levelId === 1
      ? buildLevel1(env)
      : ctx.levelId === 2
        ? buildQuakeLevel(env, LEVEL2_QUAKE, 'guided')
        : buildQuakeLevel(env, LEVEL3_QUAKE, 'free')

  // ── Own loop: active ms do not count paused time ──
  let last = performance.now()
  const loop = (now: number) => {
    if (destroyed) return
    const dt = Math.min(now - last, 100)
    last = now
    if (!paused) {
      if (!finished) activeMs += dt // the clock stops at the end...
      run.tick?.(dt) // ...but animations keep running
    }
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  return {
    pause() {
      paused = true
      sfx.suspend()
      stage.inert = true
      root.classList.add('is-paused')
    },
    resume() {
      paused = false
      sfx.resume()
      stage.inert = false
      root.classList.remove('is-paused')
    },
    destroy() {
      destroyed = true
      sfx.dispose()
      cancelAnimationFrame(raf)
      root.remove()
      return Promise.resolve()
    },
  }
}

import type { GameContext, GameController } from '../../shared/types'
import { createGlossary } from '../shared/glossary'
import { showRecap } from '../shared/recap'
import { TERMS } from './terms'
import { getMission } from '../../content/missions'
import { COPY } from './copy'
import { createNameTags, el, type Env, type LevelRun } from './dom'
import { buildLevel0 } from './level0'
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
  const headTitle = el('h2', 'ls-title', intro.title)
  const headText = el('p', 'ls-text', intro.text)
  head.append(headTitle, headText)
  const setHead = (h: { title: string; text: string }) => {
    headTitle.textContent = h.title
    gl.decorate(headText, h.text)
  }

  const stage = el('div', 'ls-stage')
  const end = el('section', 'ls-end')
  end.hidden = true

  const helpBtn = el('button', 'gl-help', '?')
  helpBtn.type = 'button'
  helpBtn.setAttribute('aria-label', 'Help: what the words mean')

  const pauseLayer = el('div', 'ls-pause', 'Paused')
  pauseLayer.setAttribute('role', 'status')

  root.append(style, head, stage, end, pauseLayer, helpBtn)
  container.append(root)
  const gl = createGlossary(root, TERMS)
  helpBtn.addEventListener('click', () => gl.openHelp())
  gl.decorate(headText, intro.text)

  // Touch an object and its name shows for a moment.
  const tags = createNameTags(root)

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

  /** Shared tail of both endings: the recap card, built from what the player did. */
  const closeWith = (lines: string[], label: string, ok: boolean) => {
    finished = true
    stage.inert = true // the attempt is over: no more fiddling with the sliders
    const extra = ok
      ? `You needed ${metrics.attempts} check${metrics.attempts === 1 ? '' : 's'}, ${wrong} of them wrong. Stars: ${ok ? '★' : '☆'} concept ${wrong === 0 ? '★' : '☆'} no wrong checks ${activeMs <= 90_000 ? '★' : '☆'} under 90 s.`
      : `You made ${wrong} wrong checks in ${Math.round(activeMs / 1000)} s.`
    showRecap(gl, {
      won: ok,
      title: ok ? 'Level complete' : 'Out of attempts',
      lines: [...lines, extra].slice(0, 4),
      points: ok ? Math.max(MIN_SCORE, BASE_SCORE - WRONG_PENALTY * wrong) : null,
      practice: ctx.settings.practice,
      buttons: [{ label, main: true, onClick: complete }],
    })
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
        closeWith([COPY.failed], COPY.sealFailed, false)
      }
      return log.left
    },
    finish(lines) {
      if (finished) return
      sfx.done()
      closeWith(lines, COPY.seal, true)
    },
    decorate(host, text) {
      gl.decorate(host, text)
    },
    name(target, label) {
      tags.attach(target, label)
    },
  }

  const startLevel = (): LevelRun =>
    ctx.levelId === 1
      ? buildLevel1(env)
      : ctx.levelId === 2
        ? buildQuakeLevel(env, LEVEL2_QUAKE, 'guided')
        : buildQuakeLevel(env, LEVEL3_QUAKE, 'free')

  let run: LevelRun = {}
  /** Swaps the practice screen (or nothing) for the real level. */
  const begin = () => {
    setHead(intro)
    stage.replaceChildren()
    run = startLevel()
  }

  // Level 1 opens with the mission briefing and Level 0 (practice). The player
  // can skip it at any time; it never touches attempts, score or decisions.
  if (ctx.levelId === 1) {
    setHead(COPY.l0.head)
    run = buildLevel0(env, begin)
  } else {
    begin()
  }

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
      tags.dispose()
      gl.destroy()
      cancelAnimationFrame(raf)
      root.remove()
      return Promise.resolve()
    },
  }
}

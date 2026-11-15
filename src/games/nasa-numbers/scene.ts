import type { GameContext, GameController } from '../../shared/types'
import { getMission } from '../../content/missions'
import { LEVELS, sourcesOf } from './questions'
import {
  HINT_AFTER, PASS_MARK, attemptsFor, judgeGuess, levelPassed, pointsFor,
  rankFor, shuffledOrder, type Question,
} from './rules'
import { STYLES } from './styles'

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls = '',
  text?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text !== undefined) n.textContent = text
  return n
}

function sourceLink(label: string, url: string, prefix = ''): HTMLAnchorElement {
  const a = el('a', '', `${prefix}${label}`)
  a.href = url
  a.target = '_blank'
  a.rel = 'noreferrer noopener'
  return a
}

export function mountNumberQuest(container: HTMLElement, ctx: GameContext): GameController {
  const level = LEVELS[ctx.levelId]
  const practice = ctx.settings.practice
  // Same seed, same question order: a failure can be reproduced exactly.
  const questions: Question[] = shuffledOrder(level.questions, ctx.seed)

  let mode: 'asking' | 'result' | 'done' = 'asking'
  let index = 0
  let allowed = 0
  let used = 0
  let wrong = 0
  let solved = 0
  let score = 0
  let firstHit = false
  let paused = false
  let destroyed = false
  let activeMs = 0
  let raf = 0

  // ── Structure ──
  const root = el('div', 'nq-root')
  const style = el('style')
  style.textContent = STYLES

  const card = el('section', 'nq-card')
  const status = el('p', 'nq-status')
  const title = el('h2', 'nq-title', level.name)
  const intro = el('p', 'nq-intro', level.intro)
  const clue = el('p', 'nq-clue')
  const range = el('p', 'nq-range')
  const hint = el('p', 'nq-hint')
  const input = el('input', 'nq-input')
  input.type = 'number'
  input.step = '1'
  input.inputMode = 'numeric'
  input.setAttribute('aria-label', 'Your guess')
  const tryBtn = el('button', 'btn btn--primary', 'Try')
  tryBtn.type = 'button'
  const nextBtn = el('button', 'btn btn--ghost', 'Next question')
  nextBtn.type = 'button'
  nextBtn.disabled = true
  const row = el('div', 'nq-row')
  row.append(input, tryBtn, nextBtn)
  const feedback = el('p', 'nq-feedback')
  feedback.setAttribute('role', 'status')
  const log = el('div', 'nq-log')
  log.hidden = true

  card.append(status, title, intro, clue, range, hint, row, feedback, log)

  const end = el('section', 'nq-end')
  end.hidden = true
  const pauseLayer = el('div', 'nq-pause', 'Paused')
  pauseLayer.setAttribute('role', 'status')

  root.append(style, card, end, pauseLayer)
  container.append(root)

  // ── Helpers ──
  const say = (text: string, tone: '' | 'ok' | 'bad' = '') => {
    feedback.textContent = text
    feedback.className = `nq-feedback${tone ? ` is-${tone}` : ''}`
  }

  const refreshStatus = () => {
    const attempts = practice ? 'unlimited' : String(Math.max(0, allowed - used))
    const points = practice ? 'practice' : String(score)
    status.textContent =
      `Level ${ctx.levelId} · Question ${Math.min(index + 1, questions.length)}/${questions.length}` +
      ` · Attempts: ${attempts} · Score: ${points}`
  }

  const showLog = (q: Question) => {
    log.replaceChildren(
      el('strong', '', 'Mission log'),
      el('p', '', q.fact),
      sourceLink(q.source.label, q.source.url, 'Source: '),
    )
    log.hidden = false
  }

  // ── Flow ──
  const loadQuestion = () => {
    const q = questions[index]
    mode = 'asking'
    allowed = attemptsFor(q)
    used = 0
    wrong = 0
    clue.textContent = q.clue
    range.textContent = `Pick a whole number from ${q.min} to ${q.max}.`
    hint.textContent = ''
    log.hidden = true
    say('')
    input.min = String(q.min)
    input.max = String(q.max)
    input.placeholder = `${q.min} – ${q.max}`
    input.value = ''
    input.disabled = false
    tryBtn.disabled = false
    nextBtn.disabled = true
    refreshStatus()
    input.focus()
  }

  const endQuestion = (correct: boolean) => {
    const q = questions[index]
    mode = 'result'
    input.disabled = true
    tryBtn.disabled = true
    nextBtn.disabled = false
    nextBtn.textContent = index + 1 < questions.length ? 'Next question' : 'Finish level'
    showLog(q)
    if (correct) solved += 1
    refreshStatus()
    nextBtn.focus()
  }

  const submit = () => {
    if (mode !== 'asking' || paused) return
    const q = questions[index]
    const result = judgeGuess(q, input.valueAsNumber)

    if (result.verdict === 'invalid') {
      say(`Enter a whole number from ${q.min} to ${q.max}.`, 'bad')
      return
    }

    used += 1

    if (result.verdict === 'correct') {
      if (index === 0 && used === 1) firstHit = true
      const gained = practice ? 0 : pointsFor(allowed, used)
      score += gained
      const where = result.exact ? `Correct! ${q.answerText}.` : `Close enough! The exact value is ${q.answerText}.`
      const bonus = !practice && used === 1 ? ' Direct hit!' : ''
      const pts = practice ? '' : ` +${gained} points.`
      say(`${where}${pts}${bonus}`, 'ok')
      endQuestion(true)
      return
    }

    wrong += 1
    if (!practice && used >= allowed) {
      say(`Out of attempts. The answer was ${q.answerText}.`, 'bad')
      endQuestion(false)
      return
    }

    const direction =
      result.verdict === 'too-low'
        ? 'Higher: the secret number is greater.'
        : 'Lower: the secret number is smaller.'
    const warmth =
      result.closeness === 'very-close' ? ' Very close!' : result.closeness === 'warm' ? ' Getting warmer.' : ''
    say(direction + warmth, 'bad')
    if (wrong === HINT_AFTER) hint.textContent = `Hint: ${q.hint}`
    input.value = ''
    refreshStatus()
    input.focus()
  }

  const finishLevel = () => {
    mode = 'done'
    card.hidden = true
    const passed = levelPassed(solved)
    const rank = rankFor(score, questions.length)

    end.replaceChildren(
      el('h2', 'nq-title', `${level.name}: complete`),
      el(
        'p',
        '',
        practice
          ? `You solved ${solved} of ${questions.length}. Practice mode does not score.`
          : `You solved ${solved} of ${questions.length}. Score: ${score}. Rank: ${rank}.`,
      ),
      el(
        'p',
        '',
        passed
          ? level.tip
          : `You need at least ${PASS_MARK} correct answers to seal this memory. Try the level again!`,
      ),
    )

    const list = el('ul')
    for (const s of sourcesOf(ctx.levelId)) {
      const li = el('li')
      li.append(sourceLink(s.label, s.url))
      list.append(li)
    }
    end.append(el('p', '', 'Learn more from NASA:'), list)

    const seal = el('button', 'btn btn--primary', passed ? 'Seal the memory' : 'Close this run')
    seal.type = 'button'
    seal.addEventListener('click', complete)
    end.append(seal)
    end.hidden = false
    seal.focus()
  }

  let sent = false
  const complete = () => {
    if (sent) return
    sent = true
    const passed = levelPassed(solved)
    const mission = getMission(ctx.gameId)
    ctx.onComplete({
      gameId: ctx.gameId,
      levelId: ctx.levelId,
      score: practice ? 0 : score,
      durationMs: Math.round(activeMs),
      completed: passed,
      evidenceIds: passed ? (mission?.evidence.map((e) => e.id) ?? []) : [],
      // Did the player solve the first question of the run on the first guess?
      firstAnswerCorrect: firstHit,
    })
  }

  const next = () => {
    if (mode !== 'result' || paused) return
    if (index + 1 < questions.length) {
      index += 1
      loadQuestion()
    } else {
      finishLevel()
    }
  }

  tryBtn.addEventListener('click', submit)
  nextBtn.addEventListener('click', next)
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (mode === 'asking') submit()
  })

  loadQuestion()

  // ── Active time (pauses do not count) ──
  let last = performance.now()
  const loop = (now: number) => {
    if (destroyed) return
    const dt = Math.min(now - last, 100)
    last = now
    if (!paused && mode !== 'done') activeMs += dt
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  return {
    pause() {
      paused = true
      card.inert = true
      root.classList.add('is-paused')
    },
    resume() {
      paused = false
      card.inert = false
      root.classList.remove('is-paused')
    },
    destroy() {
      destroyed = true
      cancelAnimationFrame(raf)
      root.remove()
      return Promise.resolve()
    },
  }
}

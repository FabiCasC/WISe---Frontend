import type { Decision, GameContext, GameController } from '../../shared/types'
import { getMission } from '../../content/missions'
import { createRng } from '../shared/rng'
import { createGlossary, el } from '../shared/glossary'
import { showRecap } from '../shared/recap'
import {
  ECHO_TIME_S, LIGHT_KM_S, ROUNDS, echoDistance, echoPoints, echoRounds, halvingProbes, huntPoints, huntRounds,
  judgeEcho, judgeInterval, markPoints, newHunt, noiseRounds, overlap, passed, probe, reading, stars,
  type HuntState,
} from './rules'
import { TERMS } from './terms'
import { STYLES } from './styles'

type Lvl = 1 | 2 | 3

const NAMES: Record<Lvl, string> = { 1: 'Halving the range', 2: 'Margin of error', 3: 'Echo to distance' }
const INTROS: Record<Lvl, string> = {
  1: 'A probe called Dawn has a beacon. In each round it hides at a different spot in a range. Scan a number: the beacon answers higher or lower. Scans are limited, so try the middle of the range every time.',
  2: 'Each reading of the beacon is off by up to the margin of error. Take readings, then mark an interval you are sure holds the real spot. Too wide says nothing; too narrow can miss it.',
  3: 'A laser echo went to the Moon and came back, bounced by the retroreflector. Turn the echo time into the distance to the Moon, in thousands of km, before the clock runs out. The light went there AND back.',
}

const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })

export function mountNumberQuest(container: HTMLElement, ctx: GameContext): GameController {
  const lvl = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as Lvl
  const practice = ctx.settings.practice
  const rng = createRng(ctx.seed + ':readings')
  const hunts = huntRounds(ctx.seed)
  const noises = noiseRounds(ctx.seed)
  const echoes = echoRounds(ctx.seed)

  let round = 0
  let solved = 0
  let score = 0
  let paused = false
  let destroyed = false
  let activeMs = 0
  let raf = 0
  let sent = false
  let locked = false // between rounds
  const decisions: Decision[] = []
  const decide = (correct: boolean) => {
    if (!practice) decisions.push({ concept: `nasa-numbers-${lvl}`, correct })
  }

  // per level tallies for the recap
  let huntState: HuntState = newHunt(hunts[0])
  let probesUsed = 0
  let probesNeeded = 0
  let goodSplits = 0
  let totalSplits = 0
  let readings: number[] = []
  let widthSum = 0
  let marks = 0
  let echoForgotHalf = 0
  let echoTimeLeft = ECHO_TIME_S
  let lastTimeLeft = 0

  // ── Structure ──
  const root = el('div', 'nq-root')
  const style = el('style')
  style.textContent = STYLES
  const card = el('section', 'nq-card')
  const status = el('p', 'nq-status')
  const title = el('h2', 'nq-title', `Find the Beacon · ${NAMES[lvl]}`)
  const intro = el('p', 'nq-intro')
  const clue = el('p', 'nq-clue')
  const bar = el('div', 'nq-bar')
  const barFill = el('i', 'nq-bar-fill')
  const barTicks = el('div', 'nq-bar-ticks')
  bar.append(barFill, barTicks)
  const barLabel = el('p', 'nq-range')
  const row = el('div', 'nq-row')
  const input = el('input', 'nq-input')
  input.type = 'number'
  input.step = '1'
  input.inputMode = 'numeric'
  const input2 = el('input', 'nq-input')
  input2.type = 'number'
  input2.step = '1'
  input2.inputMode = 'numeric'
  const goBtn = el('button', 'btn btn--primary', 'Scan')
  goBtn.type = 'button'
  const readBtn = el('button', 'btn btn--ghost', 'Take a reading')
  readBtn.type = 'button'
  const nextBtn = el('button', 'btn btn--ghost', 'Next round')
  nextBtn.type = 'button'
  const feedback = el('p', 'nq-feedback')
  feedback.setAttribute('role', 'status')
  const helpBtn = el('button', 'nq-help', '?')
  helpBtn.type = 'button'
  helpBtn.setAttribute('aria-label', 'Help: what the words mean')
  card.append(status, title, intro, clue, bar, barLabel, row, feedback)
  const pauseLayer = el('div', 'nq-pause', 'Paused')
  pauseLayer.setAttribute('role', 'status')
  root.append(style, card, pauseLayer, helpBtn)
  container.append(root)
  const gl = createGlossary(root, TERMS)
  helpBtn.addEventListener('click', () => gl.openHelp())
  gl.decorate(intro, INTROS[lvl])

  const say = (text: string, tone: '' | 'ok' | 'bad' = '') => {
    gl.decorate(feedback, text)
    feedback.className = `nq-feedback${tone ? ` is-${tone}` : ''}`
  }

  const timeLeftS = () => (practice ? ECHO_TIME_S : Math.max(0, echoTimeLeft))

  const refreshStatus = () => {
    const parts = [`Level ${lvl}`, `Round ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`]
    if (lvl === 1) parts.push(practice ? 'Scans: unlimited' : `Scans left: ${Math.max(0, hunts[round].allowed - huntState.probes)}`)
    if (lvl === 2) parts.push(`Readings left: ${Math.max(0, noises[round].maxReadings - readings.length)}`)
    if (lvl === 3) parts.push(practice ? 'No clock in practice' : `Time: ${Math.ceil(timeLeftS())} s`)
    parts.push(practice ? 'Practice' : `Score: ${score}`)
    status.textContent = parts.join(' · ')
  }

  // ── Bar drawing ──
  const setBar = (lo: number, hi: number, min: number, max: number) => {
    const span = max - min
    barFill.style.left = `${((lo - min) / span) * 100}%`
    barFill.style.width = `${Math.max(1, ((hi - lo) / span) * 100)}%`
  }
  const tick = (value: number, min: number, max: number, cls: string) => {
    const t = el('b', `nq-tick ${cls}`)
    t.style.left = `${((value - min) / (max - min)) * 100}%`
    barTicks.append(t)
  }

  // ── Round setup ──
  const loadRound = () => {
    locked = false
    feedback.textContent = ''
    barTicks.replaceChildren()
    row.replaceChildren()
    nextBtn.hidden = true
    if (lvl === 1) {
      const h = hunts[round]
      huntState = newHunt(h)
      clue.textContent = 'Where is the silent beacon?'
      barFill.style.background = ''
      setBar(h.min, h.max, h.min, h.max)
      barLabel.textContent = `The beacon is somewhere in the range ${h.min} to ${h.max}.`
      input.min = String(h.min)
      input.max = String(h.max)
      input.placeholder = `${h.min} – ${h.max}`
      input.value = ''
      input.disabled = false
      goBtn.textContent = 'Scan'
      row.append(input, goBtn, nextBtn)
    } else if (lvl === 2) {
      const n = noises[round]
      readings = []
      clue.textContent = `Each reading can be off by up to ±${n.margin} (margin of error).`
      barFill.style.background = 'transparent'
      setBar(n.min, n.max, n.min, n.max)
      barLabel.textContent = 'Take readings, then mark where the beacon really is.'
      input.placeholder = 'from'
      input2.placeholder = 'to'
      input.value = input2.value = ''
      input.disabled = input2.disabled = false
      readBtn.disabled = false
      goBtn.textContent = 'Mark interval'
      row.append(readBtn, input, input2, goBtn, nextBtn)
    } else {
      const e = echoes[round]
      clue.textContent = `Echo time: ${e.seconds.toFixed(2)} s · light travels ${fmt(LIGHT_KM_S)} km every second. Distance to the Moon, in thousands of km?`
      barFill.style.background = 'transparent'
      setBar(0, 0, 0, 1)
      barLabel.textContent = 'Answer within 3 %.'
      input.placeholder = 'thousand km'
      input.value = ''
      input.disabled = false
      goBtn.textContent = 'Send distance'
      row.append(input, goBtn, nextBtn)
    }
    refreshStatus()
    input.focus()
  }

  const endRound = (ok: boolean, points: number) => {
    locked = true
    if (ok) solved += 1
    if (!practice) score += points
    input.disabled = input2.disabled = true
    readBtn.disabled = true
    nextBtn.hidden = false
    nextBtn.textContent = round + 1 < ROUNDS ? 'Next round' : 'Finish level'
    refreshStatus()
    nextBtn.focus()
  }

  // ── Level 1 ──
  const scan = () => {
    const h = hunts[round]
    const r = probe(h, huntState, input.valueAsNumber)
    if (r.verdict === 'invalid') {
      say(`Scan a whole number inside the range (${huntState.lo} to ${huntState.hi}).`, 'bad')
      return
    }
    totalSplits += 1
    if (r.goodSplit) goodSplits += 1
    decide(r.goodSplit)
    setBar(huntState.lo, huntState.hi, h.min, h.max)
    if (r.verdict === 'found') {
      probesUsed += huntState.probes
      probesNeeded += halvingProbes(h.max - h.min + 1)
      say(`Beacon found in ${huntState.probes} scans. Halving never needs more than ${halvingProbes(h.max - h.min + 1)} here.`, 'ok')
      endRound(true, huntPoints(h, huntState))
      return
    }
    barLabel.textContent = `The beacon is somewhere in ${huntState.lo} to ${huntState.hi}.`
    if (!practice && huntState.probes >= h.allowed) {
      probesUsed += huntState.probes
      probesNeeded += halvingProbes(h.max - h.min + 1)
      say(`Out of scans. The beacon was at ${h.secret}. Halving would have found it in at most ${halvingProbes(h.max - h.min + 1)}.`, 'bad')
      endRound(false, 0)
      return
    }
    say(`${r.verdict === 'higher' ? 'Higher' : 'Lower'}. ${r.goodSplit ? 'Good cut: about half of the range is gone.' : 'That left most of the range. Try the middle next.'}`, r.goodSplit ? 'ok' : 'bad')
    input.value = ''
    refreshStatus()
    input.focus()
  }

  // ── Level 2 ──
  const takeReading = () => {
    const n = noises[round]
    if (readings.length >= n.maxReadings) {
      say('No more readings this round. Mark your interval.', 'bad')
      return
    }
    const v = reading(n, rng)
    readings.push(v)
    tick(v, n.min, n.max, 'is-read')
    barLabel.textContent = `Readings: ${readings.join(', ')} (each ±${n.margin})`
    if (readings.length >= n.maxReadings) readBtn.disabled = true
    if (!input.value) input.value = String(v - n.margin)
    if (!input2.value) input2.value = String(v + n.margin)
    refreshStatus()
  }
  const mark = () => {
    const n = noises[round]
    if (!readings.length) {
      say('Take at least one reading first.', 'bad')
      return
    }
    const lo = input.valueAsNumber
    const hi = input2.valueAsNumber
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
      say('Fill in both ends of the interval.', 'bad')
      return
    }
    const m = judgeInterval(n, lo, hi)
    marks += 1
    widthSum += m.width
    decide(m.correct)
    tick(n.truth, n.min, n.max, 'is-truth')
    const a = Math.min(lo, hi)
    const b = Math.max(lo, hi)
    barFill.style.background = ''
    setBar(a, b, n.min, n.max)
    const [oLo, oHi] = overlap(readings, n.margin)
    const best = `The readings overlap at ${oLo} to ${oHi}.`
    if (m.correct) say(`Your interval holds the beacon (it was at ${n.truth}). ${best}`, 'ok')
    else if (!m.contains) say(`The beacon was at ${n.truth}, outside your interval. A reading can be off by ±${n.margin}, so mark at least that much around it. ${best}`, 'bad')
    else say(`It holds the beacon (${n.truth}), but ${m.width} wide says little: no more than ${2 * n.margin} counts. ${best}`, 'bad')
    endRound(m.correct, markPoints(m, n))
  }

  // ── Level 3 ──
  const sendDistance = () => {
    const e = echoes[round]
    const g = input.valueAsNumber
    if (!Number.isFinite(g)) {
      say('Type a distance in thousands of km.', 'bad')
      return
    }
    const r = judgeEcho(e, g)
    decide(r.correct)
    if (r.forgotHalf) echoForgotHalf += 1
    lastTimeLeft = timeLeftS()
    if (r.correct) say(`Yes: ${fmt(LIGHT_KM_S)} km/s × ${e.seconds.toFixed(2)} s ÷ 2 = ${fmt(r.truth, 1)} thousand km.`, 'ok')
    else if (r.forgotHalf) say(`That is the whole round trip. The light went there AND back, so the Moon is half: ${fmt(r.truth, 1)} thousand km.`, 'bad')
    else say(`Not quite. Distance = ${fmt(LIGHT_KM_S)} × ${e.seconds.toFixed(2)} ÷ 2 = ${fmt(r.truth, 1)} thousand km.`, 'bad')
    endRound(r.correct, r.correct ? echoPoints(timeLeftS()) : 0)
  }

  // ── Flow ──
  const submit = () => {
    if (locked || paused) return
    if (lvl === 1) scan()
    else if (lvl === 2) mark()
    else sendDistance()
  }

  const finishLevel = (timeUp = false) => {
    card.hidden = true
    const ok = passed(solved)
    const lines: string[] = []
    let efficient = false
    let fast = false
    if (lvl === 1) {
      lines.push(`You found ${solved} of ${ROUNDS} beacons using ${probesUsed} scans. Halving every time needs at most ${probesNeeded}.`)
      lines.push(`${goodSplits} of your ${totalSplits} scans left at most 70 % of the range: each one throws half of the possibilities away.`)
      efficient = probesUsed <= probesNeeded
      fast = activeMs <= 90_000
    } else if (lvl === 2) {
      const avg = marks ? Math.round(widthSum / marks) : 0
      lines.push(`${solved} of your ${marks} intervals held the real spot. Their average width was ${avg}; a single reading is only good to ±20 to ±30.`)
      lines.push('Every measurement has a margin of error. Overlapping several readings is how you narrow it down.')
      efficient = marks > 0 && widthSum / marks <= 50
      fast = activeMs <= 90_000
    } else {
      lines.push(`You turned ${solved} of ${ROUNDS} echoes into a distance${timeUp ? ' before the clock ran out' : `, with ${Math.ceil(lastTimeLeft)} s left`}.`)
      lines.push(
        echoForgotHalf
          ? `${echoForgotHalf} time(s) you gave the whole round trip. The light went there and back, so the distance is half of speed × time.`
          : 'You halved the round trip every time: distance = speed of light × echo time ÷ 2.',
      )
      efficient = echoForgotHalf === 0
      fast = lastTimeLeft >= ECHO_TIME_S * 0.3
    }
    const st = stars(solved, efficient, fast)
    lines.push(`Stars: ${st.concept ? '★' : '☆'} concept ${st.efficiency ? '★' : '☆'} efficiency ${st.speed ? '★' : '☆'} speed`)
    showRecap(gl, {
      won: ok,
      title: ok ? 'Beacon located' : 'Signal lost',
      lines,
      points: score,
      practice,
      buttons: [{ label: ok ? 'Save and continue' : 'Close this run', main: true, onClick: complete }],
    })
  }

  const complete = () => {
    if (sent) return
    sent = true
    const ok = passed(solved)
    const mission = getMission(ctx.gameId)
    ctx.onComplete({
      gameId: ctx.gameId,
      levelId: ctx.levelId,
      score: practice ? 0 : score,
      durationMs: Math.round(activeMs),
      completed: ok,
      evidenceIds: ok ? (mission?.evidence.map((e) => e.id) ?? []) : [],
      firstAnswerCorrect: decisions.length > 0 && decisions.every((d) => d.correct),
      decisions,
    })
  }

  const next = () => {
    if (!locked || paused) return
    if (round + 1 < ROUNDS) {
      round += 1
      loadRound()
    } else finishLevel()
  }

  goBtn.addEventListener('click', submit)
  readBtn.addEventListener('click', takeReading)
  nextBtn.addEventListener('click', next)
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target === input || e.target === input2)) {
      e.preventDefault()
      submit()
    }
  }
  input.addEventListener('keydown', onKey)
  input2.addEventListener('keydown', onKey)

  loadRound()

  // ── Active time (pauses do not count). Level 3 runs a countdown. ──
  let last = performance.now()
  const loop = (now: number) => {
    if (destroyed) return
    const dt = Math.min(now - last, 100)
    last = now
    if (!paused && !card.hidden) {
      activeMs += dt
      if (lvl === 3 && !practice && !locked) {
        echoTimeLeft -= dt / 1000
        if (echoTimeLeft <= 0 && !locked) {
          echoTimeLeft = 0
          lastTimeLeft = 0
          // Time ran out on an unanswered echo: it counts as a miss.
          decide(false)
          const e = echoes[round]
          say(`Time is up. That echo meant ${fmt(echoDistance(e.seconds), 1)} thousand km.`, 'bad')
          locked = true
          input.disabled = true
          finishLevel(true)
        } else refreshStatus()
      }
    }
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
      gl.destroy()
      root.remove()
      return Promise.resolve()
    },
  }
}

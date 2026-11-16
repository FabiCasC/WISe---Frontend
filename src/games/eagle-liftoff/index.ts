import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import { inBox, toLogical, type Box, type Point } from '../shared/canvasui'
import {
  ASCENT_SECONDS,
  CSM_RING,
  DOCK_GAP,
  LAUNCH_SITE,
  LEVELS,
  RINGS,
  TUTORIAL,
  burn,
  gap,
  inWindow,
  initialState,
  launch,
  omega,
  scoreLiftoff,
  step,
  type LevelSpec,
  type Verdict,
  type VerdictCode,
} from './rules'
import { getTexts, type ObjectId } from './texts'
import { applyTheme, PALETTE } from './theme'
import {
  bigButton,
  checkBadge,
  chip,
  coachBubble,
  drawColumbia,
  drawDescentStage,
  drawEagle,
  drawEarth,
  drawMoon,
  drawParticles,
  drawSky,
  nameTag,
  pulseHalo,
  stepParticles,
  type Particle,
} from './art'

const W = 620
const H = 560
const CX = 310
const CY = 232
const MOON_R = 128
/** Drawn radius of each ring (exaggerated so the rings can be told apart). */
const ringR = (i: number) => MOON_R + 22 + i * 16
const EARTH = { x: 566, y: 58, r: 30 }
/** Where Eagle and its descent stage stand on the Moon. */
const PAD_EAGLE_Y = CY - MOON_R - 20
const PAD_BASE_Y = CY - MOON_R - 8

const BTN_DOWN: Box = { x: 30, y: 494, w: 270, h: 52 }
const BTN_UP: Box = { x: 320, y: 494, w: 270, h: 52 }
const BTN_LAUNCH: Box = { x: 175, y: 494, w: 270, h: 52 }
const COACH: Box = { x: 12, y: 446, w: W - 24, h: 42 }

type Mode = 'tutorial' | 'play'
type TutorialStep = 'meet' | 'rings' | 'fly'
type Button = 'launch' | 'down' | 'up' | 'skip'

const SEEN_KEY = 'eagle-liftoff:level0-done'
let seenInSession = false
function tutorialSeen(): boolean {
  if (seenInSession) return true
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}
function markTutorialSeen(): void {
  seenInSession = true
  try {
    window.localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* private mode: the session flag is enough */
  }
}

/**
 * EAGLE LIFTOFF
 * -------------------------------------------------------------------------
 * The ascent stage leaves the descent stage on the Moon (it is still there)
 * and must meet Columbia in orbit. The child learns by doing it that the
 * launch must be timed, and that to catch a ship AHEAD of you, you drop to a
 * LOWER orbit, which is faster, and then climb back.
 *
 * LEVEL 0 is a guided tutorial (Capi the astronaut). It runs the same
 * physics as the real levels, but it cannot be lost: mistakes are turned
 * into "let's try again". It opens automatically the first time a child
 * plays level 1, and can be replayed from every level's intro card.
 *
 * Tapping any object (Eagle, Columbia, Moon, Earth, the launch pad, the
 * window, each orbit) pops up its name and a one-line explanation.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('eagle-liftoff')
  const tx = getTexts(ctx.settings.lang)
  const isLevel0 = ctx.levelId === 0
  const levelKey = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as 1 | 2 | 3
  const sfx = createSfx(ctx.settings.volume)
  const practice = ctx.settings.practice
  const reduced = ctx.settings.reducedMotion
  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#F3B54A' })
  const removeTheme = applyTheme(stage.root)
  const input = createInput(stage.root)
  const c = stage.ctx
  let startedAt = performance.now()

  let mode: Mode = 'play'
  let spec: LevelSpec = LEVELS[levelKey]
  let s = initialState(spec)
  let running = false
  let settled = false
  let note = ''
  let noteT = 0
  let lastCode: VerdictCode | undefined
  let clock = 0
  let flashN = 0
  let burnFlash = 0
  let celebrate = -1
  const decisions: { concept: string; correct: boolean }[] = []
  const trail: { a: number; r: number }[] = []
  const particles: Particle[] = []
  const timers = new Set<number>()

  // Tutorial state
  let tStep: TutorialStep = 'meet'
  const seen = new Set<ObjectId>()
  let dropped = false
  let advancing = false
  let ringMsg: string | null = null
  let demoT = 0
  let skipBox: Box | null = null

  // Name tag that pops up when something is tapped.
  let tip: { name: string; line: string; x: number; y: number; age: number; life: number } | null = null

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
  }

  // --- Geometry ---------------------------------------------------------------
  const pt = (deg: number, r: number): Point => {
    const a = (deg * Math.PI) / 180
    return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) }
  }

  function eaglePos(): Point {
    if (s.phase === 'pad') return { x: CX, y: PAD_EAGLE_Y }
    const r0 = CY - PAD_EAGLE_Y
    const r =
      s.phase === 'ascent' ? r0 + (ringR(2) - r0) * Math.min(1, s.ascentT / ASCENT_SECONDS) : ringR(s.ring)
    return pt(s.lm, r)
  }

  const columbiaPos = () => pt(s.csm, ringR(CSM_RING))
  const showWindow = () => mode === 'play' || tStep === 'fly'

  /** What is under this point? Small things first, big things last. */
  function pick(p: Point): ObjectId | null {
    const e = eaglePos()
    const col = columbiaPos()
    const small: { id: ObjectId; x: number; y: number; r: number }[] = [
      { id: 'eagle', x: e.x, y: e.y, r: 17 },
      { id: 'columbia', x: col.x, y: col.y, r: 22 },
      { id: 'pad', x: CX, y: PAD_BASE_Y, r: 17 },
    ]
    let best: ObjectId | null = null
    let bestK = 1
    for (const o of small) {
      const k = Math.hypot(p.x - o.x, p.y - o.y) / o.r
      if (k < bestK) {
        bestK = k
        best = o.id
      }
    }
    if (best) return best
    if (Math.hypot(p.x - EARTH.x, p.y - EARTH.y) <= EARTH.r + 6) return 'earth'

    const d = Math.hypot(p.x - CX, p.y - CY)
    if (s.phase === 'pad' && showWindow()) {
      const ang = (Math.atan2(CY - p.y, p.x - CX) * 180) / Math.PI
      const rel = (((ang - LAUNCH_SITE) % 360) + 360) % 360
      if (Math.abs(d - ringR(CSM_RING)) <= 12 && rel >= spec.window[0] && rel <= spec.window[1]) return 'window'
    }
    let ring = -1
    let ringD = 8
    for (let i = 0; i < RINGS.length; i++) {
      const dd = Math.abs(d - ringR(i))
      if (dd <= ringD) {
        ringD = dd
        ring = i
      }
    }
    if (ring >= 0) return ('ring' + ring) as ObjectId
    if (d <= MOON_R) return 'moon'
    return null
  }

  function objectAnchor(id: ObjectId, p: Point): Point {
    switch (id) {
      case 'eagle':
        return eaglePos()
      case 'columbia':
        return columbiaPos()
      case 'pad':
        return { x: CX, y: PAD_BASE_Y }
      case 'earth':
        return { x: EARTH.x, y: EARTH.y }
      default:
        return p
    }
  }

  // --- Particles ----------------------------------------------------------------
  function spawn(n: number, x: number, y: number, make: () => Partial<Particle>) {
    if (reduced) return
    for (let i = 0; i < n; i++) {
      particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        life: 0.6,
        max: 0.6,
        size: 3,
        color: '#fff',
        kind: 'dot',
        rot: 0,
        spin: 0,
        gravity: 0,
        ...make(),
      })
    }
  }
  const flameColors = ['#fff3b0', '#ffd166', '#ff9f43', '#ff6b6b']
  function flame(x: number, y: number) {
    spawn(2, x, y + 10, () => ({
      vx: (Math.random() - 0.5) * 40,
      vy: 50 + Math.random() * 60,
      life: 0.5,
      max: 0.5,
      size: 3 + Math.random() * 3,
      color: flameColors[Math.floor(Math.random() * flameColors.length)],
    }))
  }
  function sparkles(x: number, y: number) {
    spawn(14, x, y, () => {
      const a = Math.random() * Math.PI * 2
      const v = 40 + Math.random() * 70
      return {
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.8,
        max: 0.8,
        size: 2.5 + Math.random() * 2.5,
        color: PALETTE.rings[Math.floor(Math.random() * 5)],
      }
    })
  }
  function confetti() {
    const cols = [...PALETTE.rings, '#ffffff']
    spawn(110, 0, 0, () => ({
      x: Math.random() * W,
      y: -10 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 80,
      vy: 60 + Math.random() * 120,
      life: 2.6,
      max: 2.6,
      size: 4 + Math.random() * 3,
      color: cols[Math.floor(Math.random() * cols.length)],
      kind: 'rect' as const,
      rot: Math.random() * 6,
      spin: (Math.random() - 0.5) * 12,
      gravity: 60,
    }))
  }

  // --- Coach text ---------------------------------------------------------------
  function coachText(): string {
    if (noteT > 0 && note) return note
    if (mode === 'tutorial') {
      const T = tx.tutorial
      if (tStep === 'meet') return seen.size >= 4 ? T.meetDone : T.meet(seen.size, 4)
      if (tStep === 'rings') return ringMsg ?? T.rings
      if (s.phase === 'pad') return inWindow(gap(s), spec) ? T.launchNow : T.launchWait
      if (s.phase === 'ascent') return tx.liftoffNote
      if (s.phase === 'orbit') {
        const ag = Math.abs(gap(s))
        if (s.ring === CSM_RING) return T.sameOrbit
        if (s.ring > CSM_RING) return T.tooHigh
        if (s.ring < 2) return ag > 12 ? T.wait : T.climb
        if (!dropped) return T.drop
        return ag <= DOCK_GAP ? T.climbNow : T.climb2
      }
      return ''
    }
    if (s.phase === 'pad') return inWindow(gap(s), spec) ? tx.coachPadGo : tx.coachPad
    if (s.phase === 'ascent') return tx.liftoffNote
    if (s.phase === 'orbit') return spec.autoCatchUp ? tx.coachAuto : tx.coachOrbit
    return ''
  }

  /** Which button should glow in the tutorial ("press this one"). */
  function tutorialPulse(): Button | null {
    if (mode !== 'tutorial' || tStep !== 'fly') return null
    if (s.phase === 'pad') return inWindow(gap(s), spec) ? 'launch' : null
    if (s.phase !== 'orbit') return null
    const ag = Math.abs(gap(s))
    if (s.ring >= CSM_RING) return 'down'
    if (s.ring < 2) return ag <= 12 ? 'up' : null
    if (!dropped) return 'down'
    return ag <= DOCK_GAP ? 'up' : null
  }

  // --- HUD ------------------------------------------------------------------------
  function stats() {
    const g = gap(s)
    const inTutorial = mode === 'tutorial'
    const eagleW = s.ring < 0 ? 0 : omega(s.ring)
    const csmW = omega(CSM_RING)
    stage.setStats([
      {
        key: 'gap',
        label: s.phase === 'pad' ? tx.hud.gapPad(spec.window[0], spec.window[1]) : tx.hud.gap,
        value: tx.hud.gapValue(Math.abs(Math.round(g)), g >= 0),
        tone: s.phase === 'pad' ? (inWindow(g, spec) ? 'ok' : 'warn') : undefined,
      },
      {
        key: 'speed',
        label: tx.hud.speed,
        value:
          s.ring < 0
            ? tx.hud.onPad
            : (eagleW > csmW ? tx.hud.faster : eagleW < csmW ? tx.hud.slower : tx.hud.same) +
              ' ' +
              eagleW.toFixed(1) +
              ' vs ' +
              csmW.toFixed(1),
        tone: s.ring < 0 ? undefined : eagleW > csmW ? 'ok' : eagleW < csmW ? 'bad' : undefined,
      },
      { key: 'burns', label: tx.hud.burns, value: inTutorial ? tx.hud.infinity : String(s.burnsLeft) },
      {
        key: 'time',
        label: tx.hud.time,
        value: inTutorial ? tx.hud.infinity : s.phase === 'pad' ? '-' : Math.round(s.t) + ' / ' + spec.timeLimit + ' s',
        meter: inTutorial || s.phase === 'pad' ? 0 : 1 - s.t / spec.timeLimit,
      },
    ])
  }

  function setHint() {
    stage.setHint(mode === 'tutorial' ? tx.hintTutorial : spec.burns === 0 ? tx.hintLevel1 : tx.hintPlay)
  }

  // --- Flow -----------------------------------------------------------------------
  function resetRun() {
    trail.length = 0
    particles.length = 0
    note = ''
    noteT = 0
    lastCode = undefined
    celebrate = -1
    burnFlash = 0
    tip = null
    advancing = false
    ringMsg = null
    dropped = false
  }

  function beginPlay() {
    mode = 'play'
    spec = LEVELS[levelKey]
    s = initialState(spec)
    resetRun()
    startedAt = performance.now()
    running = true
    stage.hideOverlay()
    setHint()
    stats()
  }

  function beginTutorial() {
    mode = 'tutorial'
    spec = TUTORIAL
    s = initialState(spec)
    resetRun()
    tStep = 'meet'
    seen.clear()
    demoT = 0
    running = true
    stage.hideOverlay()
    setHint()
    stats()
  }

  function tutorialReset(msg: string) {
    s = initialState(TUTORIAL)
    trail.length = 0
    dropped = false
    celebrate = -1
    note = msg
    noteT = 3.6
    sfx.sweep(400, 250, 260, 'triangle', 0.14)
  }

  function goStep(next: TutorialStep) {
    tStep = next
    tip = null
    advancing = false
    ringMsg = null
    if (next === 'fly') {
      s = initialState(TUTORIAL)
      trail.length = 0
      dropped = false
    }
  }

  function chime(up = true) {
    const base = up ? [523, 659, 784] : [392, 330, 262]
    base.forEach((f, i) => later(() => sfx.tone(f, 110, 'triangle', 0.16), i * 90))
  }

  function showIntro() {
    const first = isLevel0 || (levelKey === 1 && !tutorialSeen())
    if (first) {
      stage.showOverlay({
        title: tx.tutorial.title,
        text: tx.tutorial.intro,
        buttons: [
          { label: tx.startTutorial, onClick: beginTutorial },
          ...(isLevel0
            ? []
            : [
                {
                  label: tx.skipToLevel,
                  variant: 'quiet' as const,
                  onClick: () => {
                    markTutorialSeen()
                    beginPlay()
                  },
                },
              ]),
        ],
      })
      return
    }
    stage.showOverlay({
      title: tx.levelTitle[levelKey],
      text: tx.levelIntro[levelKey],
      buttons: [
        { label: tx.start, onClick: beginPlay },
        { label: tx.seeTutorial, variant: 'quiet', onClick: beginTutorial },
      ],
    })
  }

  function finishTutorial() {
    running = false
    markTutorialSeen()
    chime(true)
    const buttons = isLevel0
      ? [{ label: tx.tutorial.save, onClick: () => complete(true, 0) }]
      : [
          { label: levelKey === 1 ? tx.tutorial.toLevel : tx.tutorial.backToLevel, onClick: beginPlay },
          { label: tx.tutorial.again, variant: 'quiet' as const, onClick: beginTutorial },
        ]
    stage.showOverlay({
      title: tx.tutorial.winTitle,
      tone: 'win',
      score: '⭐⭐⭐',
      text: tx.tutorial.winText,
      buttons,
    })
  }

  function record(v: Verdict) {
    if (!v) return
    lastCode = v.code
    if (!practice && mode === 'play') decisions.push({ concept: v.concept, correct: v.correct })
    note = v.code ? tx.verdict[v.code] : v.message
    noteT = 4
    const list = v.correct ? tx.flashGood : tx.flashBad
    stage.flash(list[flashN++ % list.length], v.correct ? 'ok' : 'bad')
    if (v.correct) {
      const e = eaglePos()
      sparkles(e.x, e.y)
      chime(true)
    }
  }

  function loseText(): string {
    if (s.reason.startsWith('Time is up')) return tx.loseTimeUp
    switch (lastCode) {
      case 'behind':
        return tx.loseBehind
      case 'too-far':
        return tx.loseTooFar
      case 'stranded':
        return s.ring === CSM_RING ? tx.loseSameOrbit : tx.loseNoFuel
      default:
        return tx.loseTimeUp
    }
  }

  function finish(won: boolean) {
    running = false
    const score = practice ? 0 : scoreLiftoff(s, spec)
    if (won) chime(true)
    else sfx.sweep(320, 140, 420, 'triangle', 0.16)
    const allOk = decisions.every((d) => d.correct)
    const left = Math.max(0, spec.timeLimit - s.t) / spec.timeLimit
    const stars = 1 + (allOk ? 1 : 0) + (left > 0.45 ? 1 : 0)
    stage.showOverlay({
      title: won ? tx.winTitle : tx.loseTitle,
      tone: won ? 'win' : 'lose',
      score: won ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '  ' + (practice ? tx.practice : tx.points(score)) : undefined,
      text: won ? tx.winText[levelKey] : loseText(),
      buttons: won
        ? [{ label: tx.saveContinue, onClick: () => complete(true, score) }]
        : [
            { label: tx.tryAgain, onClick: beginPlay },
            { label: tx.backToArcade, variant: 'quiet', onClick: () => complete(false, 0) },
          ],
    })
  }

  function complete(won: boolean, score: number) {
    if (settled) return
    settled = true
    ctx.onComplete({
      gameId: 'eagle-liftoff',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: won,
      evidenceIds: won && !isLevel0 ? (card?.evidence.map((e) => e.id) ?? []) : [],
      firstAnswerCorrect: won && decisions.every((d) => d.correct),
      decisions,
    })
  }

  // --- Actions --------------------------------------------------------------------
  function doLaunch() {
    if (!running || s.phase !== 'pad') return
    if (mode === 'tutorial') {
      if (tStep !== 'fly') return
      const g = gap(s)
      if (!inWindow(g, spec)) {
        note = g < spec.window[0] ? tx.tutorial.launchEarlyTap : tx.tutorial.launchLateTap
        noteT = 2.6
        sfx.tone(220, 140, 'triangle', 0.15)
        stage.flash(tx.flashBad[flashN++ % tx.flashBad.length], 'bad')
        return
      }
    }
    launch(s)
    sfx.sweep(200, 700, 500, 'sawtooth', 0.16)
    note = tx.liftoffNote
    noteT = 3
  }

  function doBurn(dir: 'up' | 'down') {
    if (!running || s.phase !== 'orbit') return
    if (mode === 'tutorial' && tStep !== 'fly') return
    if (spec.burns === 0) return
    if (s.burnsLeft <= 0) return stage.flash(tx.noBurns, 'bad')
    const before = s.ring
    record(burn(s, dir, spec))
    if (s.ring !== before) {
      sfx.tone(dir === 'down' ? 380 : 620, 120, 'triangle', 0.15)
      burnFlash = 0.45
      if (dir === 'down') dropped = true
      const e = eaglePos()
      spawn(10, e.x, e.y + 8, () => ({
        vx: (Math.random() - 0.5) * 70,
        vy: (dir === 'down' ? -1 : 1) * (20 + Math.random() * 40),
        color: dir === 'down' ? '#ff9f43' : '#5eead4',
        size: 3,
      }))
    }
  }

  function tapObject(id: ObjectId, p: Point) {
    const info = tx.names[id]
    const a = objectAnchor(id, p)
    const above = a.y > 170
    tip = {
      name: info.name,
      line: info.line,
      x: a.x,
      y: above ? a.y - 78 : a.y + 26,
      age: 0,
      life: 3.4,
    }
    sfx.tone(520 + (id.length % 5) * 70, 90, 'sine', 0.13)

    if (mode !== 'tutorial' || advancing) return
    if (tStep === 'meet') {
      if ((id === 'eagle' || id === 'columbia' || id === 'moon' || id === 'pad') && !seen.has(id)) {
        seen.add(id)
        chime(true)
        if (seen.size >= 4) {
          advancing = true
          later(() => goStep('rings'), 1500)
        }
      }
    } else if (tStep === 'rings') {
      if (id === 'ring0' || id === 'ring1' || id === 'ring2') {
        ringMsg = tx.tutorial.ringsRight
        tip.line = tx.tutorial.ringsRight
        advancing = true
        chime(true)
        later(() => goStep('fly'), 1700)
      } else if (id === 'ring3') {
        tip.line = tx.tutorial.ringsSame
      } else if (id === 'ring4') {
        tip.line = tx.tutorial.ringsSlow
      }
    }
  }

  // --- Buttons ----------------------------------------------------------------------
  function buttonAt(p: Point): Button | null {
    if (mode === 'tutorial' && skipBox && inBox(p, skipBox)) return 'skip'
    if (mode === 'tutorial' && tStep !== 'fly') return null
    if (s.phase === 'pad' && inBox(p, BTN_LAUNCH)) return 'launch'
    if (s.phase === 'orbit' && spec.burns > 0) {
      if (inBox(p, BTN_DOWN)) return 'down'
      if (inBox(p, BTN_UP)) return 'up'
    }
    return null
  }

  const onDown = (e: PointerEvent) => {
    e.preventDefault()
    if (!running) return
    const p = toLogical(stage.canvas, e, W, H)
    const b = buttonAt(p)
    if (b === 'skip') {
      markTutorialSeen()
      if (isLevel0) return ctx.onExit()
      return beginPlay()
    }
    if (b === 'launch') return doLaunch()
    if (b === 'down') return doBurn('down')
    if (b === 'up') return doBurn('up')
    const id = pick(p)
    if (id) tapObject(id, p)
  }
  const onMove = (e: PointerEvent) => {
    if (!running) {
      stage.canvas.style.cursor = 'default'
      return
    }
    const p = toLogical(stage.canvas, e, W, H)
    stage.canvas.style.cursor = buttonAt(p) || pick(p) ? 'pointer' : 'default'
  }
  stage.canvas.addEventListener('pointerdown', onDown)
  stage.canvas.addEventListener('pointermove', onMove)
  const offPress = input.onPress((code) => {
    if (code === 'Space' || code === 'Enter') doLaunch()
    else if (code === 'ArrowDown' || code === 'KeyS') doBurn('down')
    else if (code === 'ArrowUp' || code === 'KeyW') doBurn('up')
  })

  // --- Loop -------------------------------------------------------------------------
  function update(dtMs: number) {
    const dt = Math.min(0.05, dtMs / 1000)
    clock += dt
    stepParticles(particles, dt)
    if (tip) {
      tip.age += dt
      if (tip.age > tip.life) tip = null
    }
    if (!running) return
    noteT = Math.max(0, noteT - dt)
    burnFlash = Math.max(0, burnFlash - dt)
    demoT += dt

    // The tutorial holds the world still while the child explores.
    const frozen = mode === 'tutorial' && tStep !== 'fly'
    if (!frozen && s.phase !== 'docked') {
      const v = step(s, spec, dt)
      if (v) record(v)
    }

    if (s.phase === 'orbit' || s.phase === 'ascent') {
      trail.push({ a: s.lm, r: s.ring < 0 ? -1 : s.ring })
      if (trail.length > 90) trail.shift()
    }
    if (s.phase === 'ascent') {
      const e = eaglePos()
      flame(e.x, e.y)
    }

    if (mode === 'tutorial' && tStep === 'fly') {
      // Missed the window? Columbia goes round again, sooner than in real life.
      if (s.phase === 'pad' && gap(s) > spec.window[1] + 8) {
        s.csm = TUTORIAL.csmStart
        note = tx.tutorial.launchLate
        noteT = 3
      }
      // Flew past Columbia, or took too long: friendly restart, never a loss.
      if (s.phase === 'orbit' && ((s.ring < CSM_RING && gap(s) < -25) || s.t > 75)) tutorialReset(tx.tutorial.retry)
      if (s.phase === 'failed') tutorialReset(tx.tutorial.retry)
    }

    if (s.phase === 'docked') {
      if (celebrate < 0) {
        celebrate = reduced ? 0.6 : 1.8
        confetti()
        sfx.sweep(520, 980, 340, 'triangle', 0.22)
      } else {
        celebrate -= dt
        if (celebrate <= 0) {
          if (mode === 'tutorial') finishTutorial()
          else finish(true)
        }
      }
    } else if (s.phase === 'failed' && mode === 'play') {
      finish(false)
    }
    stats()
  }

  function arcBand(r: number, lo: number, hi: number) {
    // Model angles grow counter-clockwise; canvas angles grow clockwise.
    c.arc(CX, CY, r, (-(LAUNCH_SITE + hi) * Math.PI) / 180, (-(LAUNCH_SITE + lo) * Math.PI) / 180)
  }

  function render() {
    drawSky(c, W, H, clock, reduced)
    drawEarth(c, EARTH.x, EARTH.y, EARTH.r)
    chip(c, tx.legendFast, 12, 10, { bg: 'rgba(255,107,157,0.75)' })
    chip(c, tx.legendSlow, 12, 36, { bg: 'rgba(167,139,250,0.75)' })

    // Orbits: one colour each, Columbia's is the solid glowing one.
    const ringsStep = mode === 'tutorial' && tStep === 'rings'
    for (let i = 0; i < RINGS.length; i++) {
      c.save()
      c.strokeStyle = PALETTE.rings[i]
      if (i === CSM_RING) {
        c.lineWidth = 3.5
        c.globalAlpha = 0.9
        c.shadowColor = PALETTE.rings[i]
        c.shadowBlur = reduced ? 0 : 10
      } else {
        c.lineWidth = ringsStep ? 3 : 2
        c.globalAlpha = ringsStep ? 0.85 : 0.45
        c.setLineDash([3, 7])
      }
      c.beginPath()
      c.arc(CX, CY, ringR(i), 0, Math.PI * 2)
      c.stroke()
      c.restore()
    }

    // Tutorial: the race that shows which track is faster.
    if (ringsStep) {
      c.save()
      c.strokeStyle = '#fff'
      c.lineWidth = 3
      c.setLineDash([4, 4])
      c.beginPath()
      c.moveTo(CX, CY - ringR(0) + 8)
      c.lineTo(CX, CY - ringR(RINGS.length - 1) - 8)
      c.stroke()
      c.restore()
      const lap = demoT % 6
      for (let i = 0; i < RINGS.length; i++) {
        const p = pt(LAUNCH_SITE + omega(i) * 3 * lap, ringR(i))
        c.fillStyle = PALETTE.rings[i]
        c.beginPath()
        c.arc(p.x, p.y, 7, 0, Math.PI * 2)
        c.fill()
        c.strokeStyle = '#fff'
        c.lineWidth = 2
        c.stroke()
      }
    }

    drawMoon(c, CX, CY, MOON_R)
    drawDescentStage(c, CX, PAD_BASE_Y)
    if (s.phase !== 'pad') {
      chip(c, tx.staysChip, CX, PAD_BASE_Y + 14, { size: 10, align: 'center', bg: 'rgba(58,42,107,0.8)' })
    }

    // The launch window, drawn on Columbia's own orbit.
    if (s.phase === 'pad' && showWindow()) {
      const [lo, hi] = spec.window
      const good = inWindow(gap(s), spec)
      const k = reduced ? 1 : 0.7 + 0.3 * Math.sin(clock * 6)
      c.save()
      c.lineCap = 'round'
      c.lineWidth = 14
      c.strokeStyle = good ? `rgba(74,222,128,${k})` : 'rgba(74,222,128,0.42)'
      if (good) {
        c.shadowColor = '#4ade80'
        c.shadowBlur = reduced ? 0 : 16
      }
      c.beginPath()
      arcBand(ringR(CSM_RING), lo, hi)
      c.stroke()
      c.restore()
      const mid = pt(LAUNCH_SITE + (lo + hi) / 2, ringR(CSM_RING) - 36)
      chip(c, good ? tx.windowNow : tx.windowChip, mid.x, mid.y - 11, {
        align: 'center',
        bg: good ? 'rgba(34,160,90,0.95)' : 'rgba(20,10,60,0.7)',
      })
    }

    // Tutorial: the circle that must touch Columbia to dock.
    const col = columbiaPos()
    if (mode === 'tutorial' && tStep === 'fly' && s.phase === 'orbit') {
      c.save()
      c.strokeStyle = 'rgba(74,222,128,0.85)'
      c.lineWidth = 3
      c.setLineDash([5, 4])
      c.beginPath()
      c.arc(col.x, col.y, ((DOCK_GAP * Math.PI) / 180) * ringR(CSM_RING) + 14, 0, Math.PI * 2)
      c.stroke()
      c.restore()
    }

    // Trail (rainbow dots that fade).
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i]
      if (t.r < 0) continue
      const p = pt(t.a, ringR(t.r))
      c.globalAlpha = (i / trail.length) * 0.7
      c.fillStyle = PALETTE.rings[(i >> 2) % PALETTE.rings.length]
      c.beginPath()
      c.arc(p.x, p.y, 1.5 + (i / trail.length) * 2.2, 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = 1

    // Ships
    const bob = reduced ? 0 : Math.sin(clock * 3) * 1.5
    drawColumbia(c, col.x, col.y + bob, 1)
    chip(c, 'Columbia', col.x, col.y - 40, { align: 'center', bg: 'rgba(15,118,110,0.9)', size: 11 })

    const ep = eaglePos()
    const flameAmt = s.phase === 'ascent' ? 1 : burnFlash > 0 ? 0.6 : 0
    drawEagle(c, ep.x, ep.y + (s.phase === 'pad' ? 0 : bob), flameAmt, s.phase === 'pad' ? 1 : 1.05, s.ring <= CSM_RING)
    chip(c, 'Eagle', ep.x, s.phase === 'pad' ? ep.y - 46 : ep.y + 20, {
      align: 'center',
      bg: 'rgba(180,83,9,0.92)',
      size: 11,
    })

    drawParticles(c, particles)

    // Tutorial: "tap me" halos and check marks while meeting the objects.
    if (mode === 'tutorial' && tStep === 'meet') {
      const targets: { id: ObjectId; x: number; y: number; r: number; bx: number; by: number }[] = [
        { id: 'eagle', x: ep.x, y: ep.y, r: 18, bx: ep.x + 20, by: ep.y - 14 },
        { id: 'columbia', x: col.x, y: col.y, r: 22, bx: col.x + 24, by: col.y + 18 },
        { id: 'pad', x: CX, y: PAD_BASE_Y + 2, r: 18, bx: CX - 34, by: PAD_BASE_Y + 14 },
        { id: 'moon', x: CX, y: CY, r: MOON_R, bx: CX + 92, by: CY - 92 },
      ]
      for (const t of targets) {
        if (seen.has(t.id)) checkBadge(c, t.bx, t.by)
        else pulseHalo(c, t.x, t.y, t.r, clock, '#fff')
      }
    }

    // Name tag
    if (tip) nameTag(c, tip.name, tip.line, tip.x, tip.y, W, tip.age)

    // Coach (Capi) + step dots
    const say = coachText()
    if (say) coachBubble(c, say, COACH, reduced ? 0 : Math.sin(clock * 4) * 2)

    skipBox = null
    if (mode === 'tutorial') {
      const stepIx = tStep === 'meet' ? 0 : tStep === 'rings' ? 1 : 2
      const dots = [0, 1, 2].map((i) => (i <= stepIx ? '●' : '○')).join(' ')
      chip(c, tx.tutorial.pips + '  ' + dots, CX, 4, {
        align: 'center',
        size: 12,
        bg: 'rgba(255,209,102,0.95)',
        color: PALETTE.ink,
      })
      skipBox = chip(c, tx.skip, W - 12, 108, { align: 'right', size: 12, bg: 'rgba(255,255,255,0.22)' })
    }

    // Buttons
    const showBtns = mode === 'play' || tStep === 'fly'
    if (showBtns) {
      const glow = tutorialPulse()
      const k = reduced ? 0.6 : (Math.sin(clock * 6) + 1) / 2
      if (s.phase === 'pad') {
        const good = inWindow(gap(s), spec)
        bigButton(c, BTN_LAUNCH, good ? tx.launchNow : tx.launch, {
          top: good ? '#b6ffd0' : '#ffe08a',
          bottom: good ? '#22c55e' : '#ff9f1c',
          shadow: good ? '#13803f' : '#b45f06',
          pulse: glow === 'launch' || (mode === 'play' && good) ? k : 0,
        })
      } else if (spec.burns > 0) {
        const can = s.phase === 'orbit' && s.burnsLeft > 0
        bigButton(c, BTN_DOWN, tx.burnDown, {
          top: '#ffc2d6',
          bottom: '#ff5c8a',
          shadow: '#b32859',
          sub: tx.burnDownSub,
          enabled: can,
          pulse: glow === 'down' ? k : 0,
        })
        bigButton(c, BTN_UP, tx.burnUp, {
          top: '#c4b5fd',
          bottom: '#6d5bf0',
          shadow: '#3b2fa8',
          text: '#fff',
          sub: tx.burnUpSub,
          enabled: can,
          pulse: glow === 'up' ? k : 0,
        })
      }
    }
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  setHint()
  stats()
  showIntro()
  render()
  loop.start()

  return {
    pause() {
      loop.pause()
    },
    resume() {
      loop.resume()
    },
    destroy() {
      loop.stop()
      offPress()
      stage.canvas.removeEventListener('pointerdown', onDown)
      stage.canvas.removeEventListener('pointermove', onMove)
      for (const t of timers) window.clearTimeout(t)
      timers.clear()
      input.destroy()
      sfx.destroy()
      removeTheme()
      stage.destroy()
      return Promise.resolve()
    },
  }
}

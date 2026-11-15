import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import { COLORS, drawButton, drawStars, inBox, text, toLogical, type Box } from '../shared/canvasui'
import {
  CSM_RING,
  LAUNCH_SITE,
  LEVELS,
  RINGS,
  burn,
  gap,
  initialState,
  launch,
  omega,
  scoreLiftoff,
  step,
  type Verdict,
  inWindow,
} from './rules'

const W = 620
const H = 560
const CX = 310
const CY = 250
const MOON_R = 140
/** Drawn radius of each ring (exaggerated so the rings can be told apart). */
const ringR = (i: number) => MOON_R + 26 + i * 20

const BTN_DOWN: Box = { x: 30, y: 492, w: 270, h: 52 }
const BTN_UP: Box = { x: 320, y: 492, w: 270, h: 52 }
const BTN_LAUNCH: Box = { x: 175, y: 492, w: 270, h: 52 }

/**
 * EAGLE LIFTOFF
 * -------------------------------------------------------------------------
 * The ascent stage leaves the descent stage on the Moon (it is still there)
 * and must meet Columbia in orbit. The player learns by doing it that the
 * launch must be timed, and that to catch a ship AHEAD of you, you drop to a
 * LOWER orbit, which is faster, and then climb back. The speeds of both
 * ships are on screen the whole time, so the rule can be discovered.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('eagle-liftoff')
  const levelKey = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as 1 | 2 | 3
  const spec = LEVELS[levelKey]
  const sfx = createSfx(ctx.settings.volume)
  const practice = ctx.settings.practice
  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#F3B54A' })
  const input = createInput(stage.root)
  const c = stage.ctx
  const startedAt = performance.now()

  let s = initialState(spec)
  let running = false
  let settled = false
  let note = ''
  let noteT = 0
  const decisions: { concept: string; correct: boolean }[] = []
  const trail: { a: number; r: number }[] = []

  function record(v: Verdict) {
    if (!v) return
    if (!practice) decisions.push({ concept: v.concept, correct: v.correct })
    note = v.message
    noteT = 5
    stage.flash(v.correct ? 'Good move' : 'Watch the speeds', v.correct ? 'ok' : 'bad')
  }

  function stats() {
    const g = gap(s)
    stage.setStats([
      {
        // Hiding this on the pad hid the one number the launch decision is
        // made from: the player had to guess when to press Space.
        key: 'gap',
        label: s.phase === 'pad' ? 'Columbia is · launch window ' + spec.window[0] + '-' + spec.window[1] + '°' : 'Columbia is',
        value: Math.abs(Math.round(g)) + '° ' + (g >= 0 ? 'ahead' : 'behind'),
        tone: s.phase === 'pad' ? (inWindow(g, spec) ? 'ok' : 'warn') : undefined,
      },
      {
        key: 'speed',
        label: 'Speed · Eagle vs Columbia',
        value: s.ring < 0 ? 'on the pad' : omega(s.ring).toFixed(1) + ' vs ' + omega(CSM_RING).toFixed(1) + ' °/s',
        tone: s.ring < 0 ? undefined : omega(s.ring) > omega(CSM_RING) ? 'ok' : omega(s.ring) < omega(CSM_RING) ? 'bad' : undefined,
      },
      { key: 'burns', label: 'Burns left', value: String(s.burnsLeft) },
      {
        key: 'time',
        label: 'Time in orbit',
        value: s.phase === 'pad' ? '-' : Math.round(s.t) + ' / ' + spec.timeLimit + ' s',
        meter: s.phase === 'pad' ? 0 : 1 - s.t / spec.timeLimit,
      },
    ])
  }

  function begin() {
    s = initialState(spec)
    trail.length = 0
    running = true
    note = ''
    stage.hideOverlay()
    stats()
  }

  function doLaunch() {
    if (!running || s.phase !== 'pad') return
    launch(s)
    sfx.sweep(200, 700, 500, 'sawtooth', 0.16)
    note = 'Liftoff! The descent stage stays behind as the launch pad.'
    noteT = 3
  }

  function doBurn(dir: 'up' | 'down') {
    if (!running || s.phase !== 'orbit') return
    if (spec.burns === 0) return
    if (s.burnsLeft <= 0) return stage.flash('No burns left', 'bad')
    const before = s.ring
    record(burn(s, dir, spec))
    if (s.ring !== before) sfx.tone(dir === 'down' ? 380 : 620, 120, 'triangle', 0.15)
  }

  function finish(won: boolean) {
    running = false
    const score = practice ? 0 : scoreLiftoff(s, spec)
    if (won) sfx.sweep(520, 980, 340, 'triangle', 0.22)
    else sfx.sweep(320, 120, 420, 'sawtooth', 0.18)
    stage.showOverlay({
      title: won ? 'Docked with Columbia' : 'Missed Columbia',
      tone: won ? 'win' : 'lose',
      score: won ? (practice ? 'Practice' : score + ' points') : undefined,
      text: won
        ? levelKey === 1
          ? 'You launched with Columbia ahead. Your lower orbit was faster, so you caught it. The descent stage you left behind is still on the Moon today.'
          : 'You dropped to a lower, faster orbit to catch up and climbed back to dock. That is how every Apollo crew met their command module.'
        : s.reason,
      fact: card?.fact,
      buttons: won
        ? [{ label: 'Save and continue', onClick: () => complete(true, score) }]
        : [
            { label: 'Try again', onClick: begin },
            { label: 'Back to the arcade', variant: 'quiet', onClick: () => complete(false, 0) },
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
      evidenceIds: won ? (card?.evidence.map((e) => e.id) ?? []) : [],
      firstAnswerCorrect: won && decisions.every((d) => d.correct),
      decisions,
    })
  }

  // --- Input -------------------------------------------------------------------
  const onDown = (e: PointerEvent) => {
    e.preventDefault()
    const p = toLogical(stage.canvas, e, W, H)
    if (!running) return
    if (s.phase === 'pad' && inBox(p, BTN_LAUNCH)) return doLaunch()
    if (s.phase === 'orbit' && spec.burns > 0) {
      if (inBox(p, BTN_DOWN)) return doBurn('down')
      if (inBox(p, BTN_UP)) return doBurn('up')
    }
  }
  stage.canvas.addEventListener('pointerdown', onDown)
  const offPress = input.onPress((code) => {
    if (code === 'Space' || code === 'Enter') doLaunch()
    else if (code === 'ArrowDown' || code === 'KeyS') doBurn('down')
    else if (code === 'ArrowUp' || code === 'KeyW') doBurn('up')
  })
  // Level 1 grants no burns at all, so advertising the burn keys there told
  // the player about controls that do nothing. The hint follows the level.
  stage.setHint(
    spec.burns === 0
      ? 'Space launches. Wait until Columbia reaches the green band, then go.'
      : 'Space launches · Down = burn back (lower, faster) · Up = burn forward (higher, slower)',
  )

  // --- Loop ----------------------------------------------------------------------
  function update(dtMs: number) {
    if (!running) return
    const dt = Math.min(0.05, dtMs / 1000)
    const v = step(s, spec, dt)
    if (v) record(v)
    if (s.phase === 'orbit' || s.phase === 'ascent') {
      trail.push({ a: s.lm, r: s.ring < 0 ? -1 : s.ring })
      if (trail.length > 120) trail.shift()
    }
    noteT = Math.max(0, noteT - dt)
    if (s.phase === 'docked') finish(true)
    else if (s.phase === 'failed') finish(false)
    stats()
  }

  const pt = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180
    return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) }
  }

  function render() {
    c.fillStyle = COLORS.space
    c.fillRect(0, 0, W, H)
    drawStars(c, W, H, 70, 0.45)

    // Orbits
    for (let i = 0; i < RINGS.length; i++) {
      c.strokeStyle = i === CSM_RING ? 'rgba(117,203,209,0.45)' : 'rgba(236,230,216,0.12)'
      c.lineWidth = i === CSM_RING ? 2 : 1
      c.setLineDash(i === CSM_RING ? [] : [4, 6])
      c.beginPath()
      c.arc(CX, CY, ringR(i), 0, Math.PI * 2)
      c.stroke()
    }
    c.setLineDash([])
    // Pinned to the canvas margins: anchored to the outer ring these ran
    // off the right edge and only the last letters were visible.
    text(c, 'outer ring = slower', 12, 22, { size: 11, color: COLORS.dim })
    text(c, 'inner ring = faster', 12, 38, { size: 11, color: COLORS.dim })

    // Moon
    const g = c.createRadialGradient(CX - 40, CY - 40, 10, CX, CY, MOON_R)
    g.addColorStop(0, '#c9ccd3')
    g.addColorStop(1, '#6d717c')
    c.fillStyle = g
    c.beginPath()
    c.arc(CX, CY, MOON_R, 0, Math.PI * 2)
    c.fill()

    // The descent stage stays on the pad.
    const pad = pt(LAUNCH_SITE, MOON_R)
    c.fillStyle = '#d9a441'
    c.fillRect(pad.x - 7, pad.y - 2, 14, 8)
    text(c, s.phase === 'pad' ? 'Eagle' : 'descent stage (stays)', pad.x, pad.y + 22, { size: 11, color: '#ece6d8', align: 'center' })

    // Trail of Eagle
    c.fillStyle = 'rgba(243,181,74,0.35)'
    for (const t of trail) {
      if (t.r < 0) continue
      const p = pt(t.a, ringR(t.r))
      c.fillRect(p.x - 1, p.y - 1, 2, 2)
    }

    // The launch window, drawn on Columbia's own ring while Eagle waits.
    // Level 1 is one decision - when to press Space - and the window lived
    // only in the verdict afterwards, so the player could not see the right
    // moment coming. Now the band sweeps towards the pad and they can.
    if (s.phase === 'pad') {
      const [lo, hi] = spec.window
      // Columbia must be lo..hi degrees AHEAD of the pad at lift-off, so the
      // band sits ahead of the launch site, in the direction of travel.
      const a0 = ((LAUNCH_SITE + lo) * Math.PI) / 180
      const a1 = ((LAUNCH_SITE + hi) * Math.PI) / 180
      const good = inWindow(gap(s), spec)
      c.save()
      c.strokeStyle = good ? 'rgba(47,158,107,0.9)' : 'rgba(243,181,74,0.5)'
      c.lineWidth = 10
      c.lineCap = 'butt'
      c.beginPath()
      c.arc(CX, CY, ringR(CSM_RING), a0, a1)
      c.stroke()
      c.restore()
      const mid = pt(LAUNCH_SITE + (lo + hi) / 2, ringR(CSM_RING) + 20)
      text(c, good ? 'LAUNCH NOW' : 'launch window', mid.x, mid.y, {
        size: 11,
        color: good ? '#2f9e6b' : COLORS.dim,
        align: 'center',
      })
    }

    // Columbia
    const cp = pt(s.csm, ringR(CSM_RING))
    c.fillStyle = COLORS.cyan
    c.beginPath()
    c.arc(cp.x, cp.y, 7, 0, Math.PI * 2)
    c.fill()
    text(c, 'Columbia', cp.x, cp.y - 12, { size: 12, color: COLORS.cyan, align: 'center' })

    // Eagle
    if (s.phase !== 'pad') {
      const r = s.phase === 'ascent' ? MOON_R + (ringR(2) - MOON_R) * Math.min(1, s.ascentT / 3) : ringR(s.ring)
      const ep = pt(s.lm, r)
      c.fillStyle = COLORS.gold
      c.beginPath()
      c.arc(ep.x, ep.y, 6, 0, Math.PI * 2)
      c.fill()
      text(c, 'Eagle', ep.x, ep.y + 20, { size: 12, color: COLORS.gold, align: 'center' })
    }

    // Live explanation
    if (noteT > 0 && note) {
      c.fillStyle = 'rgba(13,16,23,0.9)'
      c.fillRect(20, 444, W - 40, 34)
      text(c, note, W / 2, 466, { size: 13, align: 'center' })
    }

    // Buttons
    if (s.phase === 'pad') drawButton(c, BTN_LAUNCH, 'Launch ▲', { primary: true })
    else if (spec.burns > 0) {
      const can = s.phase === 'orbit' && s.burnsLeft > 0
      drawButton(c, BTN_DOWN, '▼ Burn back · lower', { enabled: can })
      drawButton(c, BTN_UP, '▲ Burn forward · higher', { enabled: can })
    } else if (s.phase !== 'docked') {
      text(c, 'Watch: lower orbit, faster speed…', W / 2, 522, { size: 14, color: COLORS.dim, align: 'center' })
    }
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  stats()
  stage.showOverlay({
    title: (card?.title ?? 'Eagle Liftoff') + ' · ' + spec.name,
    text: spec.intro,
    buttons: [{ label: 'Start', onClick: begin }],
  })
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
      input.destroy()
      sfx.destroy()
      stage.destroy()
      return Promise.resolve()
    },
  }
}

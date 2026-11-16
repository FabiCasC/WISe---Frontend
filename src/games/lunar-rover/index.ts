import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { COLORS, roundRect, text, toLogical } from '../shared/canvasui'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import { TERMS } from './terms'
import {
  HOME_R,
  LEVELS,
  LM,
  MAP,
  PICKUP_R,
  bearingDeg,
  conceptFor,
  createRover,
  dist,
  scoreRun,
  status,
  stepRover,
  type Controls,
  type Rover,
  type Vec,
} from './rules'

const W = 640
const H = 560
const K = W / MAP.w
const px = (v: number) => v * K

/**
 * MOON BUGGY RUN
 * -------------------------------------------------------------------------
 * Top-down drive with the Apollo Lunar Roving Vehicle. Three real ideas
 * become the rules: batteries that only go down (level 1), staying close
 * enough to walk back if the rover fails (level 2), and finding the lunar
 * module again with the navigation computer when hills hide it (level 3).
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('lunar-rover')
  const levelKey = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as 1 | 2 | 3
  const spec = LEVELS[levelKey]
  const concept = conceptFor(levelKey)
  const practice = ctx.settings.practice
  const sfx = createSfx(ctx.settings.volume)

  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#9fd0ff' })
  const input = createInput(stage.root)
  const c = stage.ctx
  const startedAt = performance.now()

  type Phase = 'intro' | 'driving' | 'done'
  let phase: Phase = 'intro'
  let rover: Rover = createRover(spec)
  let trail: Vec[] = []
  let tries = 0
  let settled = false
  let edgeWarned = false
  let lowWarned = false
  const decisions: { concept: string; correct: boolean }[] = []
  /** Farthest the rover got from the lunar module on this try, in metres. */
  let farthest = 0
  stage.setGlossary(TERMS)

  // Surface speckles, fixed.
  const speckles = Array.from({ length: 260 }, (_, i) => ({
    x: (i * 7919) % W,
    y: (i * 104729) % H,
    r: (i % 3) + 0.6,
  }))

  const touch = { forward: false, back: false, left: false, right: false }
  let touchTarget: Vec | null = null

  function controls(): Controls {
    const h = input.held
    return {
      forward: touch.forward || h.has('ArrowUp') || h.has('KeyW'),
      back: touch.back || h.has('ArrowDown') || h.has('KeyS'),
      left: touch.left || h.has('ArrowLeft') || h.has('KeyA'),
      right: touch.right || h.has('ArrowRight') || h.has('KeyD'),
      target: touchTarget,
    }
  }

  function begin() {
    rover = createRover(spec)
    trail = [{ x: rover.x, y: rover.y }]
    edgeWarned = false
    lowWarned = false
    tries++
    farthest = 0
    phase = 'driving'
    stage.hideOverlay()
    sfx.tone(520, 90, 'triangle', 0.14)
  }

  function finish(st: 'won' | 'battery' | 'too-far') {
    phase = 'done'
    touchTarget = null
    const won = st === 'won'
    if (!practice) decisions.push({ concept, correct: won })
    const score = practice || !won ? 0 : scoreRun(spec, rover)
    if (won) sfx.sweep(520, 980, 360, 'triangle', 0.2)
    else sfx.sweep(320, 100, 420, 'sawtooth', 0.18)

    const km = (m: number) => (m / 1000).toFixed(1) + ' km'
    const got = rover.collected.filter(Boolean).length
    const lines = [
      `You collected ${got} of ${rover.collected.length} samples, driving ${km(rover.driven)} and reaching ${km(farthest)} from the lunar module${won ? `, with ${pct(rover.battery / spec.batteryM)} of the battery left` : ''}.`,
      levelKey === 1
        ? 'The battery is not rechargeable: every metre you drive is gone for good, so a short loop leaves more.'
        : levelKey === 2
          ? st === 'too-far'
            ? 'You left the walk-back circle: if the rover broke down there, the crew could not walk home.'
            : `Your farthest point was ${km(farthest)}, inside the ${km(spec.walkRadius ?? 0)} walk-back circle: if the rover broke down, the crew could walk home.`
          : 'The navigation computer always showed the direction and distance back to the lunar module, even when hills hid it.',
    ]
    if (!won) lines.unshift(st === 'battery' ? `The battery ran out ${km(dist(rover, LM))} from the lunar module.` : 'You were too far to walk back.')
    const star = (ok: boolean) => (ok ? '★' : '☆')
    lines.push(`Stars: ${star(won)} back home ${star(won && got === rover.collected.length)} all samples ${star(won && rover.battery / spec.batteryM > 0.25)} battery left`)
    stage.showOverlay({
      title: won ? 'Back at the lunar module' : st === 'battery' ? 'The battery is empty' : 'Too far to walk back',
      tone: won ? 'win' : 'lose',
      score: won ? (practice ? undefined : score + ' points') : undefined,
      lines: lines.slice(0, 4),
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
      gameId: 'lunar-rover',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: won,
      evidenceIds: won ? (card?.evidence.map((e) => e.id) ?? []) : [],
      firstAnswerCorrect: won && tries === 1,
      decisions: practice ? [] : decisions,
    })
  }

  // --- Input -------------------------------------------------------------------
  const offPress = input.onPress((code) => {
    if (phase === 'intro' && (code === 'Space' || code === 'Enter' || code === 'ArrowUp')) begin()
  })

  let activePointer: number | null = null
  const onDown = (e: PointerEvent) => {
    e.preventDefault()
    if (phase === 'intro') return begin()
    if (phase !== 'driving') return
    activePointer = e.pointerId
    const p = toLogical(stage.canvas, e, W, H)
    touchTarget = { x: p.x / K, y: p.y / K }
  }
  const onMove = (e: PointerEvent) => {
    if (activePointer !== e.pointerId || phase !== 'driving') return
    const p = toLogical(stage.canvas, e, W, H)
    touchTarget = { x: p.x / K, y: p.y / K }
  }
  const onUp = (e: PointerEvent) => {
    if (activePointer !== e.pointerId) return
    activePointer = null
    touchTarget = null
  }
  stage.canvas.addEventListener('pointerdown', onDown)
  stage.canvas.addEventListener('pointermove', onMove)
  stage.canvas.addEventListener('pointerup', onUp)
  stage.canvas.addEventListener('pointercancel', onUp)
  stage.canvas.addEventListener('pointerleave', onUp)

  type Held = 'forward' | 'back' | 'left' | 'right'
  const padHandlers: { el: HTMLButtonElement; down: (e: PointerEvent) => void; up: () => void }[] = []
  for (const [label, aria, key] of [
    ['◀', 'Steer left', 'left'],
    ['▲ Drive', 'Drive', 'forward'],
    ['▼', 'Brake and reverse', 'back'],
    ['▶', 'Steer right', 'right'],
  ] as [string, string, Held][]) {
    const el = stage.addTouchButton(label, aria)
    const down = (e: PointerEvent) => {
      e.preventDefault()
      if (phase === 'intro') begin()
      touch[key] = true
    }
    const up = () => {
      touch[key] = false
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', up)
    padHandlers.push({ el, down, up })
  }

  stage.setHint('Arrows or WASD to drive · or hold your finger on the map and the rover drives there')

  // --- Simulation -----------------------------------------------------------------
  function update(dtMs: number) {
    if (phase !== 'driving') return
    const dt = dtMs / 1000
    const steps = Math.max(1, Math.round(dt / (1 / 120)))
    const before = rover.collected
    const ctrl = controls()
    for (let i = 0; i < steps; i++) rover = stepRover(spec, rover, ctrl, dt / steps, practice)
    farthest = Math.max(farthest, dist(rover, LM))
    rover.collected.forEach((got, i) => {
      if (!got || before[i]) return
      stage.flash('Sample from ' + spec.stations[i].name + '!')
      sfx.tone(880, 90, 'sine', 0.16)
      sfx.tone(1180, 120, 'sine', 0.12)
    })
    const last = trail[trail.length - 1]
    if (!last || dist(last, rover) > 25) trail.push({ x: rover.x, y: rover.y })

    if (spec.walkRadius !== null) {
      const margin = spec.walkRadius - dist(rover, LM)
      if (margin < 160 && !edgeWarned) {
        edgeWarned = true
        stage.flash('Careful: near the walk-back limit', 'bad')
        sfx.tone(660, 120, 'square', 0.1)
      }
      if (margin > 260) edgeWarned = false
    }
    if (!practice && !lowWarned && rover.battery < spec.batteryM * 0.2) {
      lowWarned = true
      stage.flash('Battery low!', 'bad')
    }

    const st = status(spec, rover)
    if (st !== 'driving') {
      if (st === 'battery' && practice) return
      return finish(st)
    }
    stats()
  }

  function stats() {
    const b = rover.battery / spec.batteryM
    const got = rover.collected.filter(Boolean).length
    stage.setStats([
      {
        key: 'bat',
        label: practice ? 'Battery (practice)' : 'Battery',
        value: practice ? '∞' : pct(b),
        meter: practice ? 1 : b,
        tone: practice || b > 0.4 ? 'ok' : b > 0.2 ? 'warn' : 'bad',
      },
      { key: 'samples', label: 'Samples', value: got + ' / ' + spec.stations.length },
      { key: 'lm', label: 'To the LM', value: (dist(rover, LM) / 1000).toFixed(2) + ' km' },
      { key: 'driven', label: 'Driven', value: (rover.driven / 1000).toFixed(1) + ' km' },
    ])
  }

  // --- Drawing --------------------------------------------------------------------
  function drawLM(x: number, y: number) {
    c.fillStyle = '#d9a63e'
    c.fillRect(x - 9, y - 9, 18, 18)
    c.strokeStyle = '#c9b27a'
    c.lineWidth = 2
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      c.beginPath()
      c.moveTo(x + dx * 9, y + dy * 9)
      c.lineTo(x + dx * 15, y + dy * 15)
      c.stroke()
    }
    c.fillStyle = '#c9ccd4'
    c.beginPath()
    c.arc(x, y, 6, 0, Math.PI * 2)
    c.fill()
    text(c, 'LM', x, y + 30, { size: 11, color: COLORS.gold, align: 'center' })
  }

  function drawRover() {
    const x = px(rover.x)
    const y = px(rover.y)
    c.save()
    c.translate(x, y)
    c.rotate(rover.heading)
    c.fillStyle = '#9aa3b5'
    c.fillRect(-12, -8, 24, 16)
    c.fillStyle = '#2a3142'
    for (const [wx, wy] of [[-9, -10], [9, -10], [-9, 10], [9, 10]]) c.fillRect(wx - 4, wy - 2.5, 8, 5)
    c.fillStyle = '#ece6d8'
    c.fillRect(2, -6, 6, 12)
    // dish antenna at the front
    c.fillStyle = COLORS.gold
    c.beginPath()
    c.arc(13, 0, 4, 0, Math.PI * 2)
    c.fill()
    c.restore()
  }

  function render() {
    c.fillStyle = '#3c3f47'
    c.fillRect(0, 0, W, H)
    c.fillStyle = 'rgba(255,255,255,0.05)'
    for (const s of speckles) c.fillRect(s.x, s.y, s.r, s.r)

    const sight = spec.sight
    const visible = (p: Vec, extra = 0) => sight === null || dist(p, rover) <= sight + extra

    // Craters
    for (const cr of spec.craters) {
      if (phase === 'driving' && !visible(cr, cr.r)) continue
      const x = px(cr.x)
      const y = px(cr.y)
      const r = px(cr.r)
      c.fillStyle = '#2b2d33'
      c.beginPath()
      c.arc(x, y, r, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = 'rgba(236,230,216,0.35)'
      c.lineWidth = 3
      c.beginPath()
      c.arc(x, y, r, Math.PI * 0.9, Math.PI * 1.7)
      c.stroke()
    }

    // Tracks (the same tracks orbiters still see today)
    c.strokeStyle = 'rgba(20,22,28,0.7)'
    c.lineWidth = 3
    c.beginPath()
    trail.forEach((p, i) => (i === 0 ? c.moveTo(px(p.x), px(p.y)) : c.lineTo(px(p.x), px(p.y))))
    if (phase === 'driving') c.lineTo(px(rover.x), px(rover.y))
    c.stroke()

    // Fog: only the area around the rover is visible (level 3)
    if (sight !== null && phase === 'driving') {
      c.save()
      c.fillStyle = 'rgba(5,6,10,0.88)'
      c.beginPath()
      c.rect(0, 0, W, H)
      c.arc(px(rover.x), px(rover.y), px(sight), 0, Math.PI * 2, true)
      c.fill('evenodd')
      c.restore()
    }

    // Walk-back circle
    if (spec.walkRadius !== null) {
      const near = spec.walkRadius - dist(rover, LM) < 160 && phase === 'driving'
      c.strokeStyle = near ? 'rgba(255,107,90,0.95)' : 'rgba(127,214,163,0.7)'
      c.lineWidth = near ? 3 : 2
      c.setLineDash([10, 8])
      c.beginPath()
      c.arc(px(LM.x), px(LM.y), px(spec.walkRadius), 0, Math.PI * 2)
      c.stroke()
      c.setLineDash([])
      text(c, 'walk-back limit', px(LM.x), Math.min(H - 8, px(LM.y + spec.walkRadius) - 8), {
        size: 11,
        color: near ? '#ff9aa8' : COLORS.ok,
        align: 'center',
      })
    }

    // LM (hidden by the hills when out of sight on level 3)
    if (phase !== 'driving' || visible(LM, 0)) drawLM(px(LM.x), px(LM.y))
    // Home zone
    if (rover.collected.every(Boolean) && (phase !== 'driving' || visible(LM))) {
      c.strokeStyle = 'rgba(243,181,74,0.6)'
      c.lineWidth = 2
      c.beginPath()
      c.arc(px(LM.x), px(LM.y), px(HOME_R), 0, Math.PI * 2)
      c.stroke()
    }

    // Stations (planned stops: always on the map)
    spec.stations.forEach((s, i) => {
      const x = px(s.x)
      const y = px(s.y)
      const got = rover.collected[i]
      c.strokeStyle = got ? COLORS.ok : COLORS.gold
      c.lineWidth = 2
      c.beginPath()
      c.arc(x, y, px(PICKUP_R), 0, Math.PI * 2)
      c.stroke()
      c.fillStyle = got ? COLORS.ok : COLORS.gold
      c.fillRect(x - 1, y - 16, 2, 16)
      c.beginPath()
      c.moveTo(x + 1, y - 16)
      c.lineTo(x + 12, y - 12)
      c.lineTo(x + 1, y - 8)
      c.fill()
      text(c, (got ? '✓ ' : '') + s.name, x, y + 26, { size: 11, color: got ? COLORS.ok : COLORS.star, align: 'center' })
    })

    drawRover()
    drawNav()
  }

  /** The rover's navigation readout: arrow home + distance. */
  function drawNav() {
    const bx = 10
    const by = 10
    c.fillStyle = 'rgba(13,16,23,0.88)'
    roundRect(c, bx, by, 168, 62, 8)
    c.fill()
    c.strokeStyle = COLORS.line
    c.lineWidth = 1
    c.stroke()
    const cx = bx + 30
    const cy = by + 31
    c.strokeStyle = 'rgba(236,230,216,0.3)'
    c.beginPath()
    c.arc(cx, cy, 20, 0, Math.PI * 2)
    c.stroke()
    const a = Math.atan2(LM.y - rover.y, LM.x - rover.x)
    c.save()
    c.translate(cx, cy)
    c.rotate(a)
    c.fillStyle = COLORS.gold
    c.beginPath()
    c.moveTo(16, 0)
    c.lineTo(-8, -8)
    c.lineTo(-3, 0)
    c.lineTo(-8, 8)
    c.closePath()
    c.fill()
    c.restore()
    text(c, 'NAV · to the LM', bx + 58, by + 22, { size: 10, color: COLORS.dim })
    text(c, (dist(rover, LM) / 1000).toFixed(2) + ' km', bx + 58, by + 40, { size: 15, weight: 800 })
    text(c, 'bearing ' + Math.round(bearingDeg(rover, LM)) + '°', bx + 58, by + 55, { size: 10, color: COLORS.dim })
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  stats()
  stage.showOverlay({
    title: (card?.title ?? 'Moon Buggy Run') + ' · ' + spec.name,
    text: spec.intro,
    buttons: [{ label: 'Start driving', onClick: begin }],
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
      stage.canvas.removeEventListener('pointermove', onMove)
      stage.canvas.removeEventListener('pointerup', onUp)
      stage.canvas.removeEventListener('pointercancel', onUp)
      stage.canvas.removeEventListener('pointerleave', onUp)
      for (const p of padHandlers) {
        p.el.removeEventListener('pointerdown', p.down)
        p.el.removeEventListener('pointerup', p.up)
        p.el.removeEventListener('pointercancel', p.up)
        p.el.removeEventListener('pointerleave', p.up)
      }
      input.destroy()
      sfx.destroy()
      stage.destroy()
      container.replaceChildren()
      return Promise.resolve()
    },
  }
}

function pct(v: number): string {
  return Math.max(0, Math.round(v * 100)) + '%'
}

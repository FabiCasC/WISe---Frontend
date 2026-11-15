import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { COLORS, drawStars, text, toLogical } from '../shared/canvasui'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import {
  LEG_SPAN,
  LEVELS,
  MOON_G,
  SAFE_VX,
  SAFE_VY,
  WORLD_W,
  boulderHeight,
  conceptFor,
  conceptOk,
  createLander,
  judgeTouchdown,
  outOfZone,
  scoreLanding,
  stepLander,
  touchingGround,
  zoneAt,
  type Controls,
  type Lander,
} from './rules'

const W = 640
const H = 560
/** Pixels per metre. */
const S = W / WORLD_W
/** Screen line of the datum (flat ground). */
const G = 520
const sx = (x: number) => x * S
const sy = (y: number) => G - y * S

/**
 * LAND THE EAGLE
 * -------------------------------------------------------------------------
 * Side-view landing with real lunar gravity. The player learns by flying:
 * the engine that would not even slow you down on Earth is plenty on the
 * Moon (level 1), a lander that is still sliding tips over (level 2), and
 * a soft landing on boulders is still a crash (level 3, like Armstrong
 * flying past the boulder field near West crater).
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('apollo11-descent')
  const levelKey = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as 1 | 2 | 3
  const spec = LEVELS[levelKey]
  const concept = conceptFor(levelKey)
  const practice = ctx.settings.practice
  const reduced = ctx.settings.reducedMotion
  const sfx = createSfx(ctx.settings.volume)

  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#f3b54a' })
  const input = createInput(stage.root)
  const c = stage.ctx
  const startedAt = performance.now()

  type Phase = 'intro' | 'flying' | 'done'
  let phase: Phase = 'intro'
  let lander: Lander = createLander(spec)
  let tries = 0
  let settled = false
  let flameT = 0
  let lowFuelWarned = false
  /** One per touchdown, kept across retries: a crash is a lesson too. */
  const decisions: { concept: string; correct: boolean }[] = []

  // Touch / pointer state for held controls.
  const touch = { thrust: false, left: false, right: false }

  function controls(): Controls {
    const h = input.held
    return {
      thrust: touch.thrust || h.has('ArrowUp') || h.has('KeyW') || h.has('Space'),
      left: spec.jets && (touch.left || h.has('ArrowLeft') || h.has('KeyA')),
      right: spec.jets && (touch.right || h.has('ArrowRight') || h.has('KeyD')),
    }
  }

  function begin() {
    lander = createLander(spec)
    lowFuelWarned = false
    tries++
    phase = 'flying'
    stage.hideOverlay()
    sfx.tone(440, 90, 'triangle', 0.14)
  }

  function finish(kind: 'touchdown' | 'out') {
    phase = 'done'
    const t = kind === 'touchdown' ? judgeTouchdown(spec, lander) : null
    const ok = t ? t.landed : false
    if (!practice) decisions.push({ concept, correct: t ? conceptOk(levelKey, t) : false })
    const score = practice || !t ? 0 : scoreLanding(t, lander.fuel, lander.vy)

    if (ok) sfx.sweep(520, 980, 360, 'triangle', 0.2)
    else {
      sfx.noise(320, 0.25)
      sfx.sweep(300, 90, 420, 'sawtooth', 0.18)
    }

    const lesson =
      levelKey === 1
        ? 'On the Moon gravity is 1.62 m/s², one sixth of Earth’s. This engine pushes ' +
          '4.2 m/s²: on Earth it could not even slow your fall. On the Moon a few seconds of fuel are enough.'
        : levelKey === 2
          ? 'A lander must touch down with almost no sideways speed. If it slides, the footpads catch the dust and it tips over.'
          : 'Apollo 11’s computer was taking Eagle into a field of boulders. Neil Armstrong took control and flew past it to smoother ground.'

    const fuelLine = practice ? '' : ' · fuel left ' + lander.fuel.toFixed(1) + ' s'
    if (ok) {
      stage.showOverlay({
        title: 'The Eagle has landed',
        tone: 'win',
        score:
          'Down ' + (-lander.vy).toFixed(1) + ' m/s · side ' + Math.abs(lander.vx).toFixed(1) + ' m/s' + fuelLine +
          (practice ? '' : ' · ' + score + ' points'),
        text: lesson + ' The descent stage stayed on the Moon as the launch pad for the ascent stage, and it is still there.',
        fact: card?.fact,
        buttons: [{ label: 'Save and continue', onClick: () => complete(true, score) }],
      })
    } else {
      stage.showOverlay({
        title: kind === 'out' ? 'Out of the landing zone' : 'Crash',
        tone: 'lose',
        score: kind === 'out' ? 'You flew out of the landing area' : t!.reason,
        text: lesson,
        buttons: [
          { label: 'Try again', onClick: begin },
          { label: 'Back to the arcade', variant: 'quiet', onClick: () => complete(false, 0) },
        ],
      })
    }
  }

  function complete(won: boolean, score: number) {
    if (settled) return
    settled = true
    ctx.onComplete({
      gameId: 'apollo11-descent',
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

  // Holding the canvas fires the engine (the simplest control on a phone).
  // On levels with side jets, holding the left or right edge also fires a jet.
  const activePointers = new Map<number, 'thrust' | 'left' | 'right'>()
  const syncTouch = () => {
    touch.thrust = touch.left = touch.right = false
    for (const v of activePointers.values()) touch[v] = true
  }
  const onCanvasDown = (e: PointerEvent) => {
    e.preventDefault()
    if (phase === 'intro') return begin()
    if (phase !== 'flying') return
    const p = toLogical(stage.canvas, e, W, H)
    const zone = spec.jets && p.x < W * 0.22 ? 'left' : spec.jets && p.x > W * 0.78 ? 'right' : 'thrust'
    activePointers.set(e.pointerId, zone)
    syncTouch()
  }
  const onCanvasUp = (e: PointerEvent) => {
    activePointers.delete(e.pointerId)
    syncTouch()
  }
  stage.canvas.addEventListener('pointerdown', onCanvasDown)
  stage.canvas.addEventListener('pointerup', onCanvasUp)
  stage.canvas.addEventListener('pointercancel', onCanvasUp)
  stage.canvas.addEventListener('pointerleave', onCanvasUp)

  type Held = 'thrust' | 'left' | 'right'
  const padDefs: [string, string, Held][] = spec.jets
    ? [
        ['◀ Jet', 'Side jet: push left', 'left'],
        ['Engine', 'Main engine', 'thrust'],
        ['Jet ▶', 'Side jet: push right', 'right'],
      ]
    : [['Engine', 'Main engine', 'thrust']]
  const padHandlers: { el: HTMLButtonElement; down: (e: PointerEvent) => void; up: () => void }[] = []
  for (const [label, aria, key] of padDefs) {
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

  stage.setHint(
    spec.jets
      ? 'Hold Up or Space for the engine · Left / Right for the side jets · on a phone hold the screen (edges = jets)'
      : 'Hold Up or Space (or hold the screen) to fire the engine · let go to fall'
  )

  // --- Simulation -----------------------------------------------------------------
  function update(dtMs: number) {
    if (phase !== 'flying') return
    const dt = dtMs / 1000
    flameT += dt
    // Small fixed sub-steps keep the physics identical to the tests.
    const steps = Math.max(1, Math.round(dt / (1 / 120)))
    const ctrl = controls()
    for (let i = 0; i < steps; i++) {
      lander = stepLander(lander, ctrl, dt / steps, { jets: spec.jets, infiniteFuel: practice })
      if (outOfZone(lander)) return finish('out')
      if (touchingGround(spec, lander)) return finish('touchdown')
    }
    if (!practice && !lowFuelWarned && lander.fuel < spec.fuel * 0.2) {
      lowFuelWarned = true
      stage.flash('Low fuel!', 'bad')
      sfx.tone(880, 140, 'square', 0.12)
    }
    stats()
  }

  function stats() {
    const down = -lander.vy
    stage.setStats([
      { key: 'alt', label: 'Altitude', value: Math.max(0, lander.y).toFixed(0) + ' m' },
      {
        key: 'vy',
        label: 'Up / down',
        value: (down >= 0 ? '↓ ' : '↑ ') + Math.abs(down).toFixed(1) + ' m/s',
        tone: down <= SAFE_VY ? 'ok' : down <= SAFE_VY * 3 ? 'warn' : 'bad',
      },
      {
        key: 'vx',
        label: 'Sideways',
        value: lander.vx.toFixed(1) + ' m/s',
        tone: Math.abs(lander.vx) <= SAFE_VX ? 'ok' : Math.abs(lander.vx) <= 3 ? 'warn' : 'bad',
      },
      {
        key: 'fuel',
        label: practice ? 'Fuel (practice)' : 'Fuel',
        value: practice ? '∞' : lander.fuel.toFixed(1) + ' s',
        meter: practice ? 1 : lander.fuel / spec.fuel,
        tone: practice || lander.fuel > spec.fuel * 0.4 ? 'ok' : lander.fuel > spec.fuel * 0.2 ? 'warn' : 'bad',
      },
    ])
  }

  // --- Drawing --------------------------------------------------------------------
  function drawGround() {
    // Surface
    c.fillStyle = '#4b4d55'
    c.fillRect(0, G, W, H - G)
    for (const z of spec.zones) {
      if (z.kind === 'flat') {
        c.fillStyle = '#6b6e78'
        c.fillRect(sx(z.x0), G, sx(z.x1) - sx(z.x0), 4)
      }
    }
    // Boulders: drawn exactly where the rules put them.
    for (let x = 0; x < WORLD_W; x++) {
      if (zoneAt(spec, x) !== 'rocks') continue
      const h = boulderHeight(x)
      if (h <= 0) continue
      const r = (h * S) / 1.4 + 2
      c.fillStyle = '#7b7d86'
      c.beginPath()
      c.ellipse(sx(x + 0.5), G - r * 0.6, r, r * 0.8, 0, Math.PI, 0)
      c.fill()
      // Low Sun from the left: each boulder throws a shadow to the right.
      c.fillStyle = 'rgba(0,0,0,0.55)'
      c.fillRect(sx(x + 0.5) + r * 0.4, G - 2, r * 2.2, 3)
    }
    // Labels on level 3
    if (levelKey === 3) {
      for (const z of spec.zones) {
        if (z.kind !== 'flat') continue
        text(c, 'smooth', sx((z.x0 + z.x1) / 2), G + 22, { size: 11, color: COLORS.ok, align: 'center' })
      }
      text(c, 'boulders', sx(100), G + 22, { size: 11, color: '#ff9aa8', align: 'center' })
    }
  }

  function drawLander() {
    const x = sx(lander.x)
    const foot = sy(lander.y)
    const half = (LEG_SPAN / 2) * S
    // Body sizes are a little larger than life so the lander reads on phones.
    const bodyW = half * 1.05
    const clear = 1.5 * S * 1.3
    const descentH = 1.7 * S * 1.4
    const descentTop = foot - clear - descentH

    // Shadow on the ground (Sun from the left)
    const alt = Math.max(0, lander.y)
    c.fillStyle = `rgba(0,0,0,${Math.max(0.1, 0.45 - alt / 300)})`
    c.beginPath()
    c.ellipse(x + 10 + alt * 0.15, G + 2, half * 1.1, 3, 0, 0, Math.PI * 2)
    c.fill()

    // Flame
    if (lander.burning) {
      const flick = reduced ? 1 : 0.8 + Math.sin(flameT * 50) * 0.2
      c.fillStyle = 'rgba(255,214,140,0.9)'
      c.beginPath()
      c.moveTo(x - 6, foot - clear + 2)
      c.lineTo(x + 6, foot - clear + 2)
      c.lineTo(x, foot - clear + 2 + 26 * flick)
      c.closePath()
      c.fill()
    }
    const ctrl = phase === 'flying' ? controls() : { left: false, right: false, thrust: false }
    if (spec.jets && (ctrl.left || ctrl.right) && (practice || lander.fuel > 0)) {
      c.fillStyle = 'rgba(236,230,216,0.85)'
      const dir = ctrl.left ? 1 : -1
      const jx = x + dir * (bodyW / 2 + 2)
      c.beginPath()
      c.moveTo(jx, descentTop - 10)
      c.lineTo(jx + dir * 12, descentTop - 14)
      c.lineTo(jx + dir * 12, descentTop - 6)
      c.closePath()
      c.fill()
    }

    // Legs (footpads exactly at the real 9.4 m span)
    c.strokeStyle = '#c9b27a'
    c.lineWidth = 2
    for (const d of [-1, 1]) {
      c.beginPath()
      c.moveTo(x + d * bodyW * 0.4, descentTop + descentH * 0.5)
      c.lineTo(x + d * half, foot - 1)
      c.stroke()
      c.fillStyle = '#c9b27a'
      c.fillRect(x + d * half - 4, foot - 2, 8, 2)
    }
    // Descent stage (gold foil)
    c.fillStyle = '#d9a63e'
    c.fillRect(x - bodyW / 2, descentTop, bodyW, descentH)
    c.fillStyle = 'rgba(0,0,0,0.18)'
    c.fillRect(x - bodyW / 2, descentTop + descentH * 0.55, bodyW, descentH * 0.45)
    // Ascent stage
    const asH = descentH * 1.3
    c.fillStyle = '#c9ccd4'
    c.beginPath()
    c.moveTo(x - bodyW * 0.42, descentTop)
    c.lineTo(x - bodyW * 0.36, descentTop - asH)
    c.lineTo(x + bodyW * 0.3, descentTop - asH)
    c.lineTo(x + bodyW * 0.42, descentTop - asH * 0.4)
    c.lineTo(x + bodyW * 0.42, descentTop)
    c.closePath()
    c.fill()
    c.fillStyle = '#2a3142'
    c.fillRect(x - bodyW * 0.2, descentTop - asH * 0.78, bodyW * 0.18, asH * 0.28)
  }

  function render() {
    c.fillStyle = COLORS.space
    c.fillRect(0, 0, W, H)
    drawStars(c, W, G - 20, 70, 0.55)
    // Earth hanging in the black sky
    c.fillStyle = '#2f6fb5'
    c.beginPath()
    c.arc(560, 70, 16, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = COLORS.space
    c.beginPath()
    c.arc(566, 66, 15, 0, Math.PI * 2)
    c.fill()

    drawGround()
    drawLander()

    // Gravity reminder
    text(c, 'Moon gravity ' + MOON_G + ' m/s² · 1/6 of Earth', 14, 24, { size: 12, color: COLORS.dim })
    text(c, spec.goal, 14, 42, { size: 13, color: COLORS.gold })

    // Speed arrow (where the lander is heading)
    if (phase === 'flying') {
      const x = sx(lander.x)
      const y = sy(lander.y) - 40
      c.strokeStyle = 'rgba(117,203,209,0.8)'
      c.lineWidth = 2
      c.beginPath()
      c.moveTo(x, y)
      c.lineTo(x + lander.vx * 4, y - lander.vy * 4)
      c.stroke()
    }
    if (spec.jets && phase === 'flying') {
      c.fillStyle = 'rgba(236,230,216,0.06)'
      c.fillRect(0, 0, W * 0.22, G)
      c.fillRect(W * 0.78, 0, W * 0.22, G)
    }
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  stats()
  stage.showOverlay({
    title: (card?.title ?? 'Land the Eagle') + ' · ' + spec.name,
    text: spec.intro,
    buttons: [{ label: 'Start descent', onClick: begin }],
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
      stage.canvas.removeEventListener('pointerdown', onCanvasDown)
      stage.canvas.removeEventListener('pointerup', onCanvasUp)
      stage.canvas.removeEventListener('pointercancel', onCanvasUp)
      stage.canvas.removeEventListener('pointerleave', onCanvasUp)
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

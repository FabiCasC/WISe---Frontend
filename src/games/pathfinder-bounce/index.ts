import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { COLORS, drawButton, drawStars, inBox, roundRect, text, toLogical, type Box } from '../shared/canvasui'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import {
  AIRBAG_MAX,
  CHUTE_MAX_SPEED,
  ENTRY,
  LEVELS,
  bounces,
  conceptFor,
  conceptOk,
  createCraft,
  judgeLanding,
  rho,
  rocketsBurning,
  scoreLanding,
  speed,
  stepCraft,
  trigger,
  autoEvents,
  warp,
  beta,
  type Craft,
  type EventId,
  type Landing,
} from './rules'

const W = 640
const H = 560
const CRAFT = { x: 300, y: 210 }
const GAUGE = { x: 24, y: 70, w: 20, h: 330 }
const LABELS: Record<EventId, string> = { chute: 'Parachute', airbags: 'Airbags', rockets: 'Rockets', cut: 'Cut cord' }
const KEYS: Record<string, EventId> = { Digit1: 'chute', Digit2: 'airbags', Digit3: 'rockets', Digit4: 'cut' }

/**
 * PATHFINDER BOUNCE
 * -------------------------------------------------------------------------
 * Mission-control console for the 1997 Mars Pathfinder landing. The fall is
 * simulated with real physics (thin air, Mars gravity) and the clock is
 * sped up high in the sky and slowed down near the ground. The player
 * presses each event at the right moment and discovers why Pathfinder
 * needed a heat shield, a parachute, rockets AND airbags.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('pathfinder-bounce')
  const levelKey = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as 1 | 2 | 3
  const spec = LEVELS[levelKey]
  const concept = conceptFor(levelKey)
  const practice = ctx.settings.practice
  const reduced = ctx.settings.reducedMotion
  const sfx = createSfx(ctx.settings.volume)

  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#E68A68' })
  const input = createInput(stage.root)
  const c = stage.ctx
  const startedAt = performance.now()

  type Phase = 'intro' | 'falling' | 'bouncing' | 'done'
  let phase: Phase = 'intro'
  let craft: Craft = createCraft()
  let log: { t: number; msg: string }[] = []
  let landing: Landing | null = null
  let bounceList: number[] = []
  let bounceT = 0
  let shieldFallY = 0
  let tries = 0
  let settled = false
  let anim = 0
  const decisions: { concept: string; correct: boolean }[] = []

  // Buttons: one per player event, along the bottom.
  const buttons: { id: EventId; box: Box }[] = spec.player.map((id, i, all) => {
    const gap = 10
    const w = (W - 40 - gap * (all.length - 1)) / all.length
    return { id, box: { x: 20 + i * (w + gap), y: H - 66, w, h: 50 } }
  })

  function begin() {
    craft = createCraft()
    log = []
    landing = null
    bounceList = []
    bounceT = 0
    shieldFallY = 0
    tries++
    phase = 'falling'
    stage.hideOverlay()
    sfx.noise(400, 0.1)
  }

  function done(id: EventId): boolean {
    if (id === 'chute') return craft.chute !== 'packed'
    if (id === 'airbags') return craft.airbags
    if (id === 'rockets') return craft.rocketsAt !== null
    return craft.cut
  }

  function press(id: EventId) {
    if (phase === 'intro') return begin()
    if (phase !== 'falling' || !spec.player.includes(id)) return
    const r = trigger(craft, id)
    if (r.craft === craft) {
      stage.flash(r.message, 'bad')
      return
    }
    craft = r.craft
    log.push({ t: craft.t, msg: r.message })
    stage.flash(r.message, r.ok ? 'ok' : 'bad')
    if (id === 'chute') sfx.sweep(200, 90, 300, 'triangle', 0.18)
    if (id === 'airbags') sfx.noise(260, 0.14)
    if (id === 'rockets') sfx.noise(700, 0.22)
    if (id === 'cut') sfx.tone(980, 60, 'square', 0.12)
    if (craft.chute === 'torn') {
      // Nothing can save the lander now: end the run right away.
      landing = judgeLanding({ ...craft })
      end()
    }
  }

  /** Space presses the next event the player has not done yet. */
  function pressNext() {
    const next = spec.player.find((id) => !done(id))
    if (next) press(next)
  }

  function end() {
    phase = 'done'
    const l = landing ?? judgeLanding(craft)
    landing = l
    const correct = conceptOk(levelKey, craft, l)
    if (!practice) decisions.push({ concept, correct })
    const score = practice ? 0 : scoreLanding(l)
    if (l.ok) sfx.sweep(520, 980, 360, 'triangle', 0.2)
    else sfx.sweep(300, 90, 420, 'sawtooth', 0.2)

    const lesson =
      levelKey === 1
        ? 'The heat shield did most of the braking: from 7300 m/s down to about 400 m/s. Only then could the parachute open without tearing.'
        : levelKey === 2
          ? 'Mars air is so thin that the parachute only slowed Pathfinder to about 70 m/s. Three small rockets fired at 98 m to brake the last part.'
          : 'Pathfinder hit the ground wrapped in airbags and bounced at least 15 times before it rolled to a stop, about 1 km away.'

    if (l.ok) {
      stage.showOverlay({
        title: 'Pathfinder is on Mars',
        tone: 'win',
        score:
          'Hit the ground at ' + Math.round(l.impact) + ' m/s · ' + bounceList.length + ' bounces' + (practice ? '' : ' · ' + score + ' points'),
        text: lesson + ' The lander, later named the Carl Sagan Memorial Station, is still in Ares Vallis.',
        fact: card?.fact,
        buttons: [{ label: 'Save and continue', onClick: () => complete(true, score) }],
      })
    } else {
      stage.showOverlay({
        title: 'Landing failed',
        tone: 'lose',
        score: l.reason,
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
      gameId: 'pathfinder-bounce',
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
    if (phase === 'intro' && (code === 'Space' || code === 'Enter')) return begin()
    if (code === 'Space' || code === 'Enter') return pressNext()
    const id = KEYS[code]
    if (id) press(id)
  })

  const onDown = (e: PointerEvent) => {
    e.preventDefault()
    if (phase === 'intro') return begin()
    const p = toLogical(stage.canvas, e, W, H)
    for (const b of buttons) if (inBox(p, b.box)) return press(b.id)
  }
  stage.canvas.addEventListener('pointerdown', onDown)

  stage.setHint(
    spec.player.length === 1
      ? 'Space or tap the button to ' + LABELS[spec.player[0]].toLowerCase() + ' · watch speed and altitude'
      : 'Space does the next step · keys 1-4 or tap the buttons · watch speed and altitude'
  )

  // --- Simulation -----------------------------------------------------------------
  function update(dtMs: number) {
    anim += dtMs / 1000
    if (phase === 'bouncing') {
      bounceT += dtMs / 1000
      const total = bounceList.length * 0.32
      if (reduced || bounceT >= total) end()
      return
    }
    if (phase !== 'falling') return
    const realDt = (dtMs / 1000) * warp(craft.h, craft.chute === 'open')
    const sub = 0.01
    let left = realDt
    while (left > 0 && craft.h > 0) {
      const step = Math.min(sub, left)
      const before = craft
      craft = autoEvents(craft, spec.player)
      if (craft !== before) {
        for (const id of ['chute', 'airbags', 'rockets', 'cut'] as EventId[]) {
          const was = id === 'chute' ? before.chute !== 'packed' : id === 'airbags' ? before.airbags : id === 'rockets' ? before.rocketsAt !== null : before.cut
          if (!was && done(id)) log.push({ t: craft.t, msg: LABELS[id] + ' (automatic) at ' + Math.round(craft.h) + ' m' })
        }
      }
      const shieldWas = craft.shieldOn
      craft = stepCraft(craft, step)
      if (shieldWas && !craft.shieldOn) {
        log.push({ t: craft.t, msg: 'Heat shield dropped (automatic)' })
        shieldFallY = 0
      }
      left -= step
    }
    if (!craft.shieldOn) shieldFallY += dtMs * 0.25
    if (craft.h <= 0) {
      craft = { ...craft, h: 0 }
      landing = judgeLanding(craft)
      if (landing.ok) {
        bounceList = bounces(landing.impact)
        phase = 'bouncing'
        sfx.noise(200, 0.2)
      } else {
        sfx.noise(500, 0.3)
        end()
      }
    }
    stats()
  }

  function stats() {
    const v = speed(craft)
    stage.setStats([
      { key: 'alt', label: 'Altitude', value: fmtAlt(craft.h) },
      {
        key: 'speed',
        label: 'Speed',
        value: Math.round(v) + ' m/s',
        tone: v <= AIRBAG_MAX ? 'ok' : v <= CHUTE_MAX_SPEED ? 'warn' : 'bad',
      },
      { key: 'time', label: 'Since entry', value: fmtTime(craft.t) },
      { key: 'warp', label: 'Clock', value: phase === 'falling' ? warpLabel(warp(craft.h, craft.chute === 'open')) : '-' },
    ])
  }

  // --- Drawing --------------------------------------------------------------------
  /** Altitude gauge: log scale so both 125 km and 100 m fit. */
  const gaugeY = (h: number) => {
    const top = Math.log10(ENTRY.h + 10)
    const f = Math.log10(Math.max(0, h) + 10) / top
    const bottom = 1 / top
    return GAUGE.y + GAUGE.h - ((f - bottom) / (1 - bottom)) * GAUGE.h
  }

  function drawSky() {
    const h = craft.h
    // Black space high up, dusty butterscotch sky low down.
    const k = Math.max(0, Math.min(1, 1 - h / 45000))
    const g = c.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, mix('#05060a', '#7a5a4a', k * 0.8))
    g.addColorStop(1, mix('#05060a', '#c28e6c', k))
    c.fillStyle = g
    c.fillRect(0, 0, W, H)
    if (h > 30000) drawStars(c, W, H - 120, 60, Math.min(0.6, (h - 30000) / 60000))
  }

  function drawGround() {
    // The ground comes into view in the last ~400 m.
    const scale = 0.85
    const gy = CRAFT.y + 40 + Math.max(0, craft.h) * scale
    if (gy > H) return
    c.fillStyle = '#8a4e33'
    c.fillRect(0, gy, W, H - gy)
    c.fillStyle = '#6e3c28'
    for (let i = 0; i < 18; i++) {
      const x = (i * 83) % W
      c.beginPath()
      c.ellipse(x, gy + 6 + (i % 4) * 9, 8 + (i % 3) * 5, 4, 0, 0, Math.PI * 2)
      c.fill()
    }
  }

  function drawCraft() {
    const x = CRAFT.x
    let y = CRAFT.y
    if (phase === 'bouncing' || (phase === 'done' && landing?.ok)) {
      // Rolling ball of airbags along the ground.
      const per = 0.32
      const i = Math.min(bounceList.length - 1, Math.floor(bounceT / per))
      const f = (bounceT - i * per) / per
      const hgt = bounceList[i] ?? 0
      const groundY = CRAFT.y + 40
      y = groundY - 22 - Math.sin(Math.PI * Math.min(1, f)) * hgt * 6
      const bx = x + Math.min(bounceT, bounceList.length * per) * 40
      drawAirbagBall(bx, y)
      text(c, 'Bounce ' + Math.min(bounceList.length, i + 1), bx, groundY - 70 - hgt * 6, { size: 14, weight: 800, align: 'center', color: COLORS.star })
      return
    }

    const chuteOpen = craft.chute === 'open'
    const decel = (rho(craft.h) * speed(craft) ** 2) / (2 * beta(craft))
    const lowered = !craft.shieldOn
    const shellY = y - (lowered ? 34 : 0)

    // Parachute
    if (chuteOpen && !craft.cut) {
      const cy = shellY - 120
      c.fillStyle = '#ece6d8'
      c.beginPath()
      c.ellipse(x, cy, 70, 34, 0, Math.PI, 0)
      c.fill()
      c.fillStyle = '#d2501c'
      for (let i = -2; i <= 2; i += 2) {
        c.beginPath()
        c.ellipse(x + i * 14, cy, 7, 34, 0, Math.PI, 0)
        c.fill()
      }
      c.strokeStyle = 'rgba(236,230,216,0.7)'
      c.lineWidth = 1
      for (const dx of [-68, -34, 0, 34, 68]) {
        c.beginPath()
        c.moveTo(x + dx, cy)
        c.lineTo(x, shellY - 14)
        c.stroke()
      }
    } else if (craft.chute === 'torn') {
      c.strokeStyle = '#ece6d8'
      c.lineWidth = 2
      for (let i = 0; i < 5; i++) {
        c.beginPath()
        c.moveTo(x, shellY - 14)
        c.lineTo(x - 30 + i * 15, shellY - 70 - (i % 2) * 20)
        c.stroke()
      }
    }

    // Backshell (stays with the parachute; flies off when the cord is cut)
    if (!craft.cut) {
      c.fillStyle = '#d9d2c2'
      c.beginPath()
      c.moveTo(x - 30, shellY + 6)
      c.lineTo(x - 12, shellY - 16)
      c.lineTo(x + 12, shellY - 16)
      c.lineTo(x + 30, shellY + 6)
      c.closePath()
      c.fill()
      if (rocketsBurning(craft)) {
        const fl = reduced ? 1 : 0.8 + Math.sin(anim * 60) * 0.2
        c.fillStyle = 'rgba(255,206,120,0.95)'
        for (const dx of [-18, 0, 18]) {
          c.beginPath()
          c.moveTo(x + dx - 4, shellY + 6)
          c.lineTo(x + dx + 4, shellY + 6)
          c.lineTo(x + dx, shellY + 6 + 36 * fl)
          c.closePath()
          c.fill()
        }
      }
    }

    // Tether and lander
    if (lowered) {
      if (!craft.cut) {
        c.strokeStyle = 'rgba(236,230,216,0.8)'
        c.lineWidth = 1.5
        c.beginPath()
        c.moveTo(x, shellY + 6)
        c.lineTo(x, y + 2)
        c.stroke()
      }
      if (craft.airbags) drawAirbagBall(x, y + 20)
      else drawLander(x, y + 14)
      // The heat shield falling away
      c.globalAlpha = Math.max(0, 1 - shieldFallY / 300)
      c.fillStyle = '#7b4a2a'
      c.beginPath()
      c.ellipse(x + 20, y + 30 + shieldFallY, 30, 8, 0.3, 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 1
    } else {
      // Heat shield under the shell, glowing during the hot part of entry.
      if (decel > 15 && craft.chute !== 'open') {
        const glow = Math.min(1, decel / 150)
        const r = 40 + glow * 30 + (reduced ? 0 : Math.sin(anim * 30) * 3)
        const gg = c.createRadialGradient(x, y + 14, 4, x, y + 14, r)
        gg.addColorStop(0, `rgba(255,220,150,${0.9 * glow})`)
        gg.addColorStop(1, 'rgba(255,120,60,0)')
        c.fillStyle = gg
        c.beginPath()
        c.arc(x, y + 14, r, 0, Math.PI * 2)
        c.fill()
      }
      c.fillStyle = '#7b4a2a'
      c.beginPath()
      c.ellipse(x, y + 8, 32, 10, 0, 0, Math.PI)
      c.fill()
    }
  }

  function drawLander(x: number, y: number) {
    c.fillStyle = '#c9ccd4'
    c.beginPath()
    c.moveTo(x - 14, y + 10)
    c.lineTo(x, y - 12)
    c.lineTo(x + 14, y + 10)
    c.closePath()
    c.fill()
  }

  function drawAirbagBall(x: number, y: number) {
    c.fillStyle = '#ece6d8'
    for (const [dx, dy] of [[-10, -8], [10, -8], [-10, 8], [10, 8], [0, 0]]) {
      c.beginPath()
      c.arc(x + dx, y + dy, 13, 0, Math.PI * 2)
      c.fill()
    }
    c.strokeStyle = 'rgba(0,0,0,0.2)'
    c.lineWidth = 1
    c.beginPath()
    c.arc(x, y, 22, 0, Math.PI * 2)
    c.stroke()
  }

  function drawGauges() {
    // Altitude gauge
    c.fillStyle = 'rgba(13,16,23,0.8)'
    c.fillRect(GAUGE.x, GAUGE.y, GAUGE.w, GAUGE.h)
    if (spec.player.includes('rockets')) {
      const y1 = gaugeY(160)
      const y2 = gaugeY(90)
      c.fillStyle = 'rgba(243,181,74,0.85)'
      c.fillRect(GAUGE.x, y1, GAUGE.w, y2 - y1)
      text(c, 'rockets', GAUGE.x + GAUGE.w + 6, (y1 + y2) / 2 + 4, { size: 10, color: COLORS.gold })
    }
    for (const [h, label] of [[100000, '100 km'], [10000, '10 km'], [1000, '1 km'], [100, '100 m'], [10, '10 m']] as const) {
      const y = gaugeY(h)
      c.fillStyle = 'rgba(236,230,216,0.5)'
      c.fillRect(GAUGE.x - 4, y, 4, 1)
      if (!(spec.player.includes('rockets') && h === 100)) text(c, label, GAUGE.x + GAUGE.w + 6, y + 4, { size: 10, color: COLORS.dim })
    }
    const ay = gaugeY(craft.h)
    c.fillStyle = COLORS.star
    c.beginPath()
    c.moveTo(GAUGE.x - 10, ay - 6)
    c.lineTo(GAUGE.x, ay)
    c.lineTo(GAUGE.x - 10, ay + 6)
    c.fill()
    text(c, 'ALT', GAUGE.x, GAUGE.y - 8, { size: 10, color: COLORS.dim })

    // Speed readout
    const v = speed(craft)
    const bx = W - 196
    c.fillStyle = 'rgba(13,16,23,0.85)'
    roundRect(c, bx, 14, 182, 84, 10)
    c.fill()
    text(c, 'SPEED', bx + 12, 32, { size: 10, color: COLORS.dim })
    text(c, Math.round(v) + ' m/s', bx + 12, 62, {
      size: 26,
      weight: 800,
      color: v <= AIRBAG_MAX ? COLORS.ok : v <= CHUTE_MAX_SPEED ? COLORS.gold : COLORS.bad,
    })
    const hint =
      craft.chute === 'packed'
        ? v > CHUTE_MAX_SPEED
          ? 'too fast for the parachute'
          : 'parachute can open'
        : v > AIRBAG_MAX
          ? 'airbags survive ' + AIRBAG_MAX + ' m/s'
          : 'airbag-safe speed'
    text(c, hint, bx + 12, 84, { size: 11, color: COLORS.dim })

    // Event log
    const lx = W - 196
    let ly = 122
    for (const l of log.slice(-6)) {
      text(c, fmtTime(l.t) + '  ' + l.msg, lx, ly, { size: 10, color: 'rgba(236,230,216,0.8)' })
      ly += 15
    }
  }

  function drawButtons() {
    for (const b of buttons) {
      const isDone = done(b.id)
      const label = (spec.player.length > 1 ? spec.player.indexOf(b.id) + 1 + ' · ' : '') + LABELS[b.id] + (isDone ? ' ✓' : '')
      drawButton(c, b.box, label, { primary: !isDone && phase === 'falling', enabled: phase === 'falling' && !isDone, size: 16 })
    }
  }

  function render() {
    drawSky()
    drawGround()
    drawCraft()
    drawGauges()
    drawButtons()
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  stats()
  stage.showOverlay({
    title: (card?.title ?? 'Pathfinder Bounce') + ' · ' + spec.name,
    text: spec.intro,
    buttons: [{ label: 'Start entry', onClick: begin }],
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
      container.replaceChildren()
      return Promise.resolve()
    },
  }
}

function fmtAlt(h: number): string {
  return h >= 1000 ? (h / 1000).toFixed(1) + ' km' : Math.max(0, Math.round(h)) + ' m'
}

function fmtTime(t: number): string {
  const s = Math.floor(t)
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

function warpLabel(k: number): string {
  return k >= 1 ? '×' + Math.round(k) + ' fast' : 'slow motion'
}

function mix(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, k))))
  return `rgb(${m[0]},${m[1]},${m[2]})`
}

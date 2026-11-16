import { getArcade } from '../../content/arcade'
import type { GameContext, GameController, LevelId } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { createInput, createLoop } from '../shared/loop'
import { createRng } from '../shared/rng'
import { createStage } from '../shared/stage'
import { TERMS } from './terms'
import {
  MOON_G,
  hoverSecondsLeft,
  initialState,
  isSafe,
  levelConfig,
  scoreLanding,
  step,
  verdict,
  verdictReason,
  type LanderState,
  type Verdict,
} from './rules'

const W = 620
const H = 560

/** Screen row the surface is drawn on. */
const GROUND_Y = 470

/** How fast the throttle opens and closes when the key is held, per second. */
const THROTTLE_UP = 2.5
const THROTTLE_DOWN = 3

interface Dust {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

/**
 * ARTEMIS LANDING
 * -------------------------------------------------------------------------
 * Bring the lander down on the pad: gently, upright, and with fuel still in
 * the tank.
 *
 * The Moon has no air. Nothing here slows the vehicle but its own engine,
 * and the engine eats the only resource that matters. Gravity is a sixth of
 * Earth's, which sounds forgiving until you notice it never lets go: the
 * fuel gauge is shown as seconds of hovering, because that is what hanging
 * around actually costs.
 *
 * All of the flight maths lives in rules.ts and is unit-tested, including a
 * check that every level can be landed.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('artemis-landing')
  const level = ctx.levelId as LevelId
  const cfg = levelConfig(level)
  const rng = createRng(ctx.seed)
  const sfx = createSfx(ctx.settings.volume)
  const reduced = ctx.settings.reducedMotion

  const accent = card?.accent ?? '#9BB8D3'
  const stage = createStage(container, { width: W, height: H, accent })
  stage.setGlossary(TERMS)
  let floatKg = 0
  let brakeKg = 0
  const input = createInput(stage.root)
  const startedAt = performance.now()

  type Phase = 'intro' | 'flying' | 'done'
  let phase: Phase = 'intro'

  let state: LanderState = initialState(cfg)
  let throttle = 0
  let lateral = 0
  let result: Verdict = 'flying'
  let touchdownVy = 0
  let elapsed = 0
  let settled = false
  let engineWasOn = false

  const dust: Dust[] = []

  let touchLeft = false
  let touchRight = false
  let touchThrust = false

  /** Stars: the sky is black even in full sun, because there is no air. */
  const stars = Array.from({ length: 70 }, () => ({
    x: rng.range(0, W),
    y: rng.range(0, GROUND_Y - 30),
    r: rng.range(0.4, 1.4),
    a: rng.range(0.25, 0.9),
  }))

  /** Rubble either side of the pad, in metres from the pad centre. */
  const rocks = Array.from({ length: 40 }, () => {
    const side = rng.chance(0.5) ? -1 : 1
    return {
      x: side * rng.range(cfg.padHalfWidthM + 8, cfg.padHalfWidthM + 420),
      r: rng.range(1.2, 5.5),
      shade: rng.range(0.25, 0.55),
    }
  })

  // --- Camera ---------------------------------------------------------------

  /**
   * Pixels per metre. Zooms in as the lander comes down, so the approach
   * reads at 800 m and the last few metres still read at 2 m.
   *
   * Above 25 m this holds the vehicle at a fixed height on screen and lets
   * the ground rush up instead, which also means it stays in frame however
   * high it gets — a player who holds the engine open and climbs to 4 km
   * must still be able to see what they have done. Below 25 m the zoom caps
   * and the last stretch plays out as real movement down the screen.
   */
  function scale(): number {
    return Math.max(0.02, Math.min(8, 260 / Math.max(state.altitude, 25)))
  }

  const toScreenX = (metres: number, s: number) => W / 2 + (metres - state.x) * s
  const toScreenY = (altitude: number, s: number) => GROUND_Y - altitude * s

  // --- HUD ------------------------------------------------------------------

  function statLine() {
    const descent = -state.vy
    const climbing = state.vy > 0.05
    const hoverLeft = hoverSecondsLeft(cfg, state.fuelKg)
    stage.setStats([
      {
        key: 'alt',
        label: 'Altitude',
        value: Math.max(0, Math.round(state.altitude)) + ' m',
      },
      {
        key: 'vy',
        label: 'Vertical',
        // Always signed by an arrow rather than a minus: a bare "-23.7 m/s"
        // under the word "descent" reads as a gentle fall, when it actually
        // means the vehicle is climbing away from the pad.
        value: (climbing ? '▲ ' + state.vy.toFixed(1) : '▼ ' + descent.toFixed(1)) + ' m/s',
        tone: climbing
          ? // Going up is never progress on a landing; it is fuel spent twice.
            'warn'
          : descent > cfg.maxTouchdownVyMs
            ? state.altitude < 120
              ? 'bad'
              : 'warn'
            : 'ok',
      },
      {
        key: 'vx',
        // "4.7 m/s" told the player nothing about WHICH WAY they were
        // sliding, which is the only part they can act on.
        label: 'Drift',
        value:
          Math.abs(state.vx) < 0.05
            ? 'none'
            : (state.vx > 0 ? 'right ' : 'left ') + Math.abs(state.vx).toFixed(1) + ' m/s',
        tone: Math.abs(state.vx) > cfg.maxTouchdownVxMs ? (state.altitude < 120 ? 'bad' : 'warn') : 'ok',
      },
      {
        key: 'fuel',
        // The number that teaches: not kilograms, but how long you may dither.
        label: 'Fuel (hover)',
        value: hoverLeft < 10 ? hoverLeft.toFixed(1) + ' s' : Math.round(hoverLeft) + ' s',
        meter: state.fuelKg / cfg.fuelKg,
        tone: state.fuelKg <= 0 ? 'bad' : hoverLeft < 12 ? 'warn' : undefined,
      },
    ])
  }

  // --- Flow -----------------------------------------------------------------

  function startRun() {
    state = initialState(cfg)
    throttle = 0
    lateral = 0
    result = 'flying'
    touchdownVy = 0
    floatKg = 0
    brakeKg = 0
    dust.length = 0
    phase = 'flying'
    stage.hideOverlay()
    stage.setHint('Up fires the engine · Left and Right stop the drift')
    statLine()
    sfx.tone(480, 90, 'triangle', 0.14)
  }

  function complete(passed: boolean, score: number) {
    if (settled) return
    settled = true
    ctx.onComplete({
      gameId: 'artemis-landing',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: passed,
      evidenceIds: passed ? (card?.evidence.map((e) => e.id) ?? []) : [],
      firstAnswerCorrect: passed,
      decisions: [
        // Braking with the engine at all is the whole point: no air, no
        // parachute, nothing else slows it down.
        { concept: 'sin-aire-solo-motor', correct: passed },
        // Did they arrive with fuel still aboard, or scrape in on empty?
        { concept: 'combustible-es-tiempo', correct: passed && state.fuelKg > cfg.fuelKg * 0.1 },
        // Low gravity still has to be flown: drift has to be killed too.
        { concept: 'gravedad-baja-no-es-nula', correct: passed && Math.abs(state.vx) < cfg.maxTouchdownVxMs * 0.6 },
      ],
    })
  }

  function land() {
    phase = 'done'
    touchdownVy = state.vy
    state = { ...state, altitude: 0 }
    result = verdict(cfg, state)
    const passed = isSafe(result)

    const score = ctx.settings.practice
      ? 0
      : scoreLanding({
          verdictValue: result,
          fuelKg: state.fuelKg,
          startFuelKg: cfg.fuelKg,
          touchdownVyMs: touchdownVy,
          offsetM: state.x,
          padHalfWidthM: cfg.padHalfWidthM,
          level,
        })

    if (passed) sfx.sweep(440, 880, 380, 'triangle', 0.2)
    else {
      sfx.noise(320, 0.3)
      sfx.sweep(300, 90, 460, 'sawtooth', 0.2)
    }

    const total = Math.round(cfg.fuelKg - state.fuelKg)
    const lines = [
      `You touched down at ${Math.abs(touchdownVy).toFixed(1)} m/s (the legs take up to ${cfg.maxTouchdownVyMs} m/s), ${Math.abs(state.x).toFixed(0)} m from the pad centre, drifting ${Math.abs(state.vx).toFixed(1)} m/s.`,
      `You burned ${total} kg of fuel: ${Math.round(floatKg)} kg floating (barely sinking) and ${Math.round(brakeKg)} kg braking. ${floatKg > brakeKg ? 'Floating costs fuel and gets you nowhere.' : 'Fuel is time: the less you float, the more you keep.'}`,
      passed
        ? 'With no air on the Moon only the engine can brake, and low gravity still pulls all the way down.'
        : verdictReason(result),
    ]
    const star = (ok: boolean) => (ok ? '★' : '☆')
    lines.push(`Stars: ${star(passed)} soft landing ${star(passed && Math.abs(state.x) <= cfg.padHalfWidthM * 0.5)} near the centre ${star(passed && state.fuelKg > cfg.fuelKg * 0.1)} fuel left`)
    stage.showOverlay({
      title: passed ? 'The Eagle has landed' : 'Vehicle lost',
      tone: passed ? 'win' : 'lose',
      score: ctx.settings.practice ? undefined : passed ? score + ' points' : undefined,
      lines,
      buttons: passed
        ? [{ label: 'Save and continue', onClick: () => complete(true, score) }]
        : [
            { label: 'Try again', onClick: startRun },
            { label: 'Back to the portal', variant: 'quiet', onClick: () => complete(false, 0) },
          ],
    })
    statLine()
  }

  // --- Input ----------------------------------------------------------------

  const offPress = input.onPress((code) => {
    if (phase === 'intro' && (code === 'Space' || code === 'Enter')) startRun()
  })

  const thrustHeld = () =>
    input.held.has('ArrowUp') || input.held.has('KeyW') || input.held.has('Space') || touchThrust
  const leftHeld = () => input.held.has('ArrowLeft') || input.held.has('KeyA') || touchLeft
  const rightHeld = () => input.held.has('ArrowRight') || input.held.has('KeyD') || touchRight

  const thrustBtn = stage.addTouchButton('Thrust', 'Fire the main engine')
  const leftBtn = stage.addTouchButton('◀', 'Thrust left')
  const rightBtn = stage.addTouchButton('▶', 'Thrust right')

  function bindHold(btn: HTMLButtonElement, set: (v: boolean) => void) {
    const down = (e: PointerEvent) => {
      e.preventDefault()
      if (phase === 'intro') startRun()
      set(true)
    }
    const up = (e: PointerEvent) => {
      e.preventDefault()
      set(false)
    }
    btn.addEventListener('pointerdown', down)
    btn.addEventListener('pointerup', up)
    btn.addEventListener('pointercancel', up)
    btn.addEventListener('pointerleave', up)
    return () => {
      btn.removeEventListener('pointerdown', down)
      btn.removeEventListener('pointerup', up)
      btn.removeEventListener('pointercancel', up)
      btn.removeEventListener('pointerleave', up)
    }
  }

  const unbindThrust = bindHold(thrustBtn, (v) => (touchThrust = v))
  const unbindLeft = bindHold(leftBtn, (v) => (touchLeft = v))
  const unbindRight = bindHold(rightBtn, (v) => (touchRight = v))

  const onCanvasDown = (e: PointerEvent) => {
    e.preventDefault()
    if (phase === 'intro') startRun()
  }
  stage.canvas.addEventListener('pointerdown', onCanvasDown)

  stage.setHint('Press Space to begin')

  // --- Simulation -----------------------------------------------------------

  function spawnDust(dtS: number) {
    // Close to the surface the exhaust blasts dust outwards. With no air it
    // travels in straight lines and never billows — one of the things that
    // makes footage from the Moon look wrong to eyes used to Earth.
    if (reduced || state.altitude > 40 || throttle < 0.15) return
    const n = Math.round(dtS * 90 * throttle)
    for (let i = 0; i < n; i++) {
      const dir = rng.chance(0.5) ? -1 : 1
      const life = rng.range(260, 700)
      dust.push({
        x: state.x + rng.range(-1, 1),
        y: 0,
        vx: dir * rng.range(6, 26),
        vy: rng.range(0.5, 5),
        life,
        maxLife: life,
      })
    }
  }

  function update(dtMs: number) {
    elapsed += dtMs
    if (phase !== 'flying') return

    // Clamp the step: an alt-tab must not teleport the lander into the ground.
    const dtS = Math.min(dtMs, 50) / 1000

    const wantThrust = thrustHeld() && state.fuelKg > 0
    throttle = wantThrust
      ? Math.min(1, throttle + THROTTLE_UP * dtS)
      : Math.max(0, throttle - THROTTLE_DOWN * dtS)

    lateral = (leftHeld() ? -1 : 0) + (rightHeld() ? 1 : 0)

    const engineOn = throttle > 0.05 && state.fuelKg > 0
    if (engineOn && !engineWasOn) sfx.noise(90, 0.1)
    engineWasOn = engineOn

    const fuelBefore = state.fuelKg
    state = step(cfg, state, { throttle, lateral }, dtS)
    // Fuel burnt while barely sinking is spent hovering: it buys time, not height.
    const burnt = fuelBefore - state.fuelKg
    if (state.vy > -1.5 && state.altitude > 8) floatKg += burnt
    else brakeKg += burnt
    spawnDust(dtS)

    for (const d of dust) {
      d.x += d.vx * dtS
      d.y += d.vy * dtS
      d.life -= dtMs
    }
    if (dust.length > 400) dust.splice(0, dust.length - 400)

    if (state.altitude <= 0) {
      land()
      return
    }
    statLine()
  }

  // --- Drawing --------------------------------------------------------------

  const c = stage.ctx

  function drawSky() {
    c.fillStyle = '#04050a'
    c.fillRect(0, 0, W, H)
    for (const s of stars) {
      c.globalAlpha = s.a
      c.fillStyle = '#ffffff'
      c.beginPath()
      c.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = 1
  }

  function drawGround(s: number) {
    // Regolith.
    c.fillStyle = '#5d5a52'
    c.fillRect(0, GROUND_Y, W, H - GROUND_Y)

    // A lighter skim so the surface does not read as a flat block.
    c.fillStyle = '#6e6b61'
    c.fillRect(0, GROUND_Y, W, 5)

    // Rubble outside the pad.
    for (const r of rocks) {
      const rx = toScreenX(r.x, s)
      const rr = Math.max(1, r.r * s)
      if (rx < -40 || rx > W + 40) continue
      c.fillStyle = 'rgba(28,26,24,' + r.shade.toFixed(2) + ')'
      c.beginPath()
      c.ellipse(rx, GROUND_Y + 2, rr, rr * 0.55, 0, Math.PI, 0)
      c.fill()
    }

    // The pad. From 500 m up this is only a few dozen pixels wide, so it has
    // to shout: at that range a 4px grey strip on grey ground is invisible,
    // and a player who cannot find the target cannot aim at it.
    const padL = toScreenX(-cfg.padHalfWidthM, s)
    const padR = toScreenX(cfg.padHalfWidthM, s)
    const overPad = Math.abs(state.x) <= cfg.padHalfWidthM

    c.fillStyle = overPad ? '#2f9e6b' : '#8a8779'
    c.fillRect(padL, GROUND_Y - 1, padR - padL, 6)

    // Landing lights: a post at each end, tall enough to read from altitude.
    const postH = Math.max(14, Math.min(26, 10 + s * 3))
    c.strokeStyle = accent
    c.lineWidth = 3
    for (const px of [padL, padR]) {
      c.beginPath()
      c.moveTo(px, GROUND_Y)
      c.lineTo(px, GROUND_Y - postH)
      c.stroke()
      c.fillStyle = accent
      c.beginPath()
      c.arc(px, GROUND_Y - postH, 3, 0, Math.PI * 2)
      c.fill()
    }

    c.fillStyle = overPad ? '#2f9e6b' : accent
    c.font = '700 11px "Space Grotesk", system-ui, sans-serif'
    c.textAlign = 'center'
    c.fillText('PAD', (padL + padR) / 2, GROUND_Y - postH - 7)

    // Where the lander is going to arrive, dropped straight down. This is
    // the readout the HUD cannot give: "drift 4.7 m/s" says nothing about
    // WHICH WAY, and the camera follows the ship, so without this line the
    // pad just slides around with no sense of how far off you are.
    if (phase === 'flying' || phase === 'intro') {
      const shipX = W / 2
      c.save()
      c.setLineDash([5, 7])
      c.strokeStyle = overPad ? 'rgba(47,158,107,0.85)' : 'rgba(240,165,0,0.75)'
      c.lineWidth = 1.5
      c.beginPath()
      c.moveTo(shipX, toScreenY(state.altitude, s) + 12)
      c.lineTo(shipX, GROUND_Y)
      c.stroke()
      c.restore()

      // A chevron on the ground marks the spot it is heading for.
      c.fillStyle = overPad ? '#2f9e6b' : accent
      c.beginPath()
      c.moveTo(shipX, GROUND_Y - 9)
      c.lineTo(shipX - 6, GROUND_Y - 19)
      c.lineTo(shipX + 6, GROUND_Y - 19)
      c.closePath()
      c.fill()

      // How far off, in metres, so "move left" is a number and not a guess.
      // Drawn under the ship rather than by the pad: the ship is always in
      // the middle of the view, and down there it collided with the PAD label.
      if (!overPad) {
        const off = Math.round(Math.abs(state.x) - cfg.padHalfWidthM)
        c.fillStyle = accent
        c.font = '700 12px "Space Grotesk", system-ui, sans-serif'
        c.fillText(
          (state.x > 0 ? 'PAD IS ' + off + ' m LEFT' : 'PAD IS ' + off + ' m RIGHT'),
          shipX,
          Math.min(GROUND_Y - 44, toScreenY(state.altitude, s) + 36),
        )
      }
    }
  }

  function drawDust(s: number) {
    for (const d of dust) {
      if (d.life <= 0) continue
      c.globalAlpha = Math.max(0, d.life / d.maxLife) * 0.55
      c.fillStyle = '#b9b2a3'
      c.fillRect(toScreenX(d.x, s), toScreenY(d.y, s), 2, 2)
    }
    c.globalAlpha = 1
  }

  function drawLander(s: number) {
    if (phase === 'intro') return
    const x = W / 2
    const y = toScreenY(state.altitude, s)

    // The vehicle keeps a readable size however far the camera has zoomed.
    const k = Math.max(0.75, Math.min(1.6, 0.5 + s * 0.12))
    const bodyW = 26 * k
    const bodyH = 18 * k

    c.save()
    c.translate(x, y)

    // Plume, drawn first so the body sits on top of it.
    if (throttle > 0.05 && state.fuelKg > 0 && phase === 'flying') {
      const len = (14 + throttle * 42) * k * (reduced ? 1 : 0.85 + rng.range(0, 0.3))
      const g = c.createLinearGradient(0, 0, 0, len)
      g.addColorStop(0, 'rgba(255,245,210,0.95)')
      g.addColorStop(0.5, 'rgba(255,190,90,0.6)')
      g.addColorStop(1, 'rgba(255,120,40,0)')
      c.fillStyle = g
      c.beginPath()
      c.moveTo(-5 * k, bodyH / 2)
      c.lineTo(5 * k, bodyH / 2)
      c.lineTo(0, bodyH / 2 + len)
      c.closePath()
      c.fill()
    }

    // Side thrusters.
    if (lateral !== 0 && state.fuelKg > 0 && phase === 'flying') {
      c.fillStyle = 'rgba(255,240,200,0.8)'
      const sx = lateral > 0 ? -bodyW / 2 : bodyW / 2
      c.beginPath()
      c.moveTo(sx, -2 * k)
      c.lineTo(sx - lateral * 12 * k, 0)
      c.lineTo(sx, 2 * k)
      c.closePath()
      c.fill()
    }

    // Legs.
    c.strokeStyle = '#9aa3ad'
    c.lineWidth = 2 * k
    for (const dir of [-1, 1]) {
      c.beginPath()
      c.moveTo((dir * bodyW) / 2.6, bodyH / 2)
      c.lineTo((dir * bodyW) / 1.5, bodyH / 2 + 9 * k)
      c.stroke()
      c.beginPath()
      c.moveTo((dir * bodyW) / 1.8, bodyH / 2 + 9 * k)
      c.lineTo((dir * bodyW) / 1.25, bodyH / 2 + 9 * k)
      c.stroke()
    }

    // Descent stage and crew module.
    c.fillStyle = result === 'safe' || phase === 'flying' ? '#d8dde4' : '#b06a62'
    c.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH)
    c.fillStyle = '#f0b53f'
    c.fillRect(-bodyW / 2.6, -bodyH / 2 - 10 * k, bodyW / 1.3, 10 * k)
    c.fillStyle = '#2b3442'
    c.fillRect(-bodyW / 5, -bodyH / 2 - 8 * k, bodyW / 2.5, 5 * k)

    c.restore()
  }

  function drawHud(s: number) {
    c.textAlign = 'center'
    c.font = '600 15px "Space Grotesk", system-ui, sans-serif'

    if (phase === 'flying') {
      // A standing reminder of what counts as a landing.
      c.fillStyle = 'rgba(218,232,251,0.55)'
      c.font = '500 12px "Space Grotesk", system-ui, sans-serif'
      c.fillText(
        'Touch down under ' +
          cfg.maxTouchdownVyMs +
          ' m/s, drift under ' +
          cfg.maxTouchdownVxMs +
          ' m/s, on the pad',
        W / 2,
        26,
      )

      if (state.fuelKg <= 0) {
        c.fillStyle = '#ff9aa8'
        c.font = '700 18px "Space Grotesk", system-ui, sans-serif'
        c.fillText('TANKS DRY', W / 2, 52)
      }
    }

    // Off-screen pad pointer, so you always know which way home is.
    if (phase === 'flying') {
      const padX = toScreenX(0, s)
      if (padX < 16 || padX > W - 16) {
        const atLeft = padX < 16
        c.fillStyle = accent
        c.font = '700 14px "Space Grotesk", system-ui, sans-serif'
        c.textAlign = atLeft ? 'left' : 'right'
        c.fillText(
          (atLeft ? '◀ pad ' : 'pad ▶ ') + Math.abs(Math.round(state.x)) + ' m',
          atLeft ? 14 : W - 14,
          GROUND_Y - 14,
        )
      }
    }

    // Gravity, stated plainly, because it is the thing being flown against.
    c.textAlign = 'right'
    c.font = '500 11px "Space Grotesk", system-ui, sans-serif'
    c.fillStyle = 'rgba(218,232,251,0.4)'
    c.fillText('Moon gravity ' + MOON_G + ' m/s² · no atmosphere', W - 14, H - 14)
  }

  function render() {
    const s = scale()
    drawSky()
    drawGround(s)
    drawDust(s)
    drawLander(s)
    drawHud(s)
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  statLine()
  stage.showOverlay({
    title: card?.title ?? 'Artemis Landing',
    text:
      'You are ' +
      cfg.startAltitudeM +
      ' m up and falling at ' +
      Math.abs(cfg.startVyMs) +
      ' m/s, with ' +
      cfg.fuelKg +
      ' kg of fuel. There is no air on the Moon, so no parachute can help: the engine is the only brake you have, and every second of it is fuel you will not get back. Touch down on the pad under ' +
      cfg.maxTouchdownVyMs +
      ' m/s.',
    buttons: [{ label: 'Begin descent', onClick: startRun }],
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
      unbindThrust()
      unbindLeft()
      unbindRight()
      stage.canvas.removeEventListener('pointerdown', onCanvasDown)
      input.destroy()
      sfx.destroy()
      stage.destroy()
      return Promise.resolve()
    },
  }
}

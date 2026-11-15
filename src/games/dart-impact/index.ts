import { getArcade } from '../../content/arcade'
import type { GameContext, GameController, LevelId } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { createInput, createLoop } from '../shared/loop'
import { createRng } from '../shared/rng'
import { createStage } from '../shared/stage'
import {
  DIDYMOS_RADIUS_M,
  ORBIT_RADIUS_M,
  bestPossibleCutMin,
  hitGrade,
  levelConfig,
  orbitHeading,
  orbitPosition,
  resolveImpact,
  scoreShot,
  shotPassed,
  type ImpactOutcome,
} from './rules'

const W = 620
const H = 560

/** Didymos sits right of centre so the probe has room to run in. */
const CX = 392
const CY = 296
/** Screen scale. The whole system is drawn to one scale, no cheating. */
const PX_PER_M = 0.145

const ORBIT_PX = ORBIT_RADIUS_M * PX_PER_M
const DIDYMOS_PX = DIDYMOS_RADIUS_M * PX_PER_M

/** Forward speed of the probe on screen, px/s. */
const PROBE_SPEED = 170
const PROBE_R = 4
/** Far enough in that the player can see the spacecraft before releasing. */
const LAUNCH_X = 28
/**
 * The approach lane runs below Didymos, through the lower half of the orbit.
 * Left alone it reaches the moonlet at an angle, which is good enough for the
 * rehearsals; the full head-on hit sits at the very bottom of the circle and
 * has to be steered for, which is the skill the last level asks for.
 */
const LAUNCH_Y = CY + ORBIT_PX * 0.72

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
}

/**
 * DART IMPACT
 * -------------------------------------------------------------------------
 * Dimorphos circles Didymos once every 11.9 hours. You fly one 570 kg
 * spacecraft into it at 6.1 km/s and try to shorten that orbit.
 *
 * The whole game is one decision made twice: WHEN to release, and WHERE to
 * steer. Hit the moonlet while it is coming towards you and the impact
 * takes speed away, so it drops into a smaller, faster orbit. Hit it from
 * behind, or sideways, and 570 kg of spacecraft is simply thrown away.
 *
 * The maths lives in rules.ts and is the real thing: vis-viva and Kepler,
 * with the measured masses and the ejecta factor DART came back with.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('dart-impact')
  const level = ctx.levelId as LevelId
  const cfg = levelConfig(level)
  const rng = createRng(ctx.seed)
  const sfx = createSfx(ctx.settings.volume)
  const reduced = ctx.settings.reducedMotion

  const accent = card?.accent ?? '#C9A227'
  const stage = createStage(container, { width: W, height: H, accent })
  const input = createInput(stage.root)
  const startedAt = performance.now()

  const targetPx = cfg.targetRadiusM * PX_PER_M
  const bestPossible = bestPossibleCutMin(cfg)

  type Phase = 'intro' | 'aim' | 'flight' | 'impact' | 'levelEnd'
  let phase: Phase = 'intro'

  /** Where Dimorphos is on its orbit, radians. */
  let orbitAngle = rng.range(0, Math.PI * 2)
  let shotsUsed = 0
  let elapsed = 0
  let settled = false
  /** Set once the player has thrown away a shot, to unlock the hint. */
  let showArrowHint = false

  // Probe state.
  let probeX = LAUNCH_X
  let probeY = LAUNCH_Y
  let probeVy = 0
  let divertLeft = cfg.divertBudgetS
  const trail: { x: number; y: number }[] = []

  // Impact state.
  let outcome: ImpactOutcome | null = null
  /** Radius of the post-impact orbit on screen, px. Animated in. */
  let newOrbitPx = ORBIT_PX
  let impactAt = 0
  let impactX = 0
  let impactY = 0
  const ejecta: Particle[] = []

  /** Static starfield: seeded, so the same seed draws the same sky. */
  const stars = Array.from({ length: 90 }, () => ({
    x: rng.range(0, W),
    y: rng.range(0, H),
    r: rng.range(0.4, 1.5),
    a: rng.range(0.2, 0.8),
  }))

  /** Craters on Didymos, also seeded. */
  const craters = Array.from({ length: 7 }, () => {
    const a = rng.range(0, Math.PI * 2)
    const d = rng.range(0, DIDYMOS_PX * 0.68)
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: rng.range(3, 9) }
  })

  // --- HUD ------------------------------------------------------------------

  function statLine() {
    const cut = outcome ? -outcome.changeMin : 0
    stage.setStats([
      {
        key: 'impactors',
        label: 'Impactors',
        value: String(cfg.shots - shotsUsed) + ' / ' + cfg.shots,
        tone: cfg.shots - shotsUsed === 0 ? 'bad' : undefined,
      },
      { key: 'target', label: 'Cut needed', value: cfg.requiredMin + ' min' },
      {
        key: 'achieved',
        label: 'Orbit cut',
        value: cut > 0 ? cut.toFixed(1) + ' min' : '—',
        tone: cut >= cfg.requiredMin ? 'ok' : cut > 0 ? 'warn' : undefined,
      },
      {
        key: 'divert',
        label: 'Divert fuel',
        value: Math.round((divertLeft / cfg.divertBudgetS) * 100) + '%',
        meter: divertLeft / cfg.divertBudgetS,
        tone: divertLeft <= 0 ? 'bad' : undefined,
      },
    ])
  }

  // --- Flow -----------------------------------------------------------------

  function armShot() {
    probeX = LAUNCH_X
    probeY = LAUNCH_Y
    probeVy = 0
    divertLeft = cfg.divertBudgetS
    trail.length = 0
    phase = 'aim'
    stage.setHint('Watch the arrow, then press Space to release. Steer with Up and Down.')
    statLine()
  }

  function startLevel() {
    shotsUsed = 0
    outcome = null
    newOrbitPx = ORBIT_PX
    ejecta.length = 0
    showArrowHint = false
    stage.hideOverlay()
    armShot()
    sfx.tone(520, 90, 'triangle', 0.16)
  }

  function release() {
    if (phase !== 'aim') return
    shotsUsed++
    phase = 'flight'
    stage.setHint('Steer with Up and Down. Divert fuel is limited.')
    sfx.sweep(240, 520, 260, 'triangle', 0.16)
    statLine()
  }

  function complete(passed: boolean, score: number) {
    if (settled) return
    settled = true
    ctx.onComplete({
      gameId: 'dart-impact',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: passed,
      evidenceIds: passed ? (card?.evidence.map((e) => e.id) ?? []) : [],
      firstAnswerCorrect: passed && shotsUsed === 1,
      decisions: [
        { concept: 'momento-desvia-asteroide', correct: passed },
        // Did they work out that the hit has to land against its travel?
        { concept: 'golpe-frontal-frena', correct: (outcome?.alignment ?? 0) <= -0.9 },
        // Passing at all means the ejecta bonus was in play: without it the
        // same spacecraft falls far short of every level's target.
        { concept: 'eyecta-multiplica', correct: passed },
      ],
    })
  }

  /** No impactors left and the orbit is still too long. */
  function missionLost(reason: string) {
    phase = 'levelEnd'
    sfx.sweep(320, 110, 420, 'sawtooth', 0.2)
    stage.showOverlay({
      title: 'Dimorphos holds its orbit',
      tone: 'lose',
      text:
        reason +
        ' Momentum only counts along the direction of travel: release so that you meet the moonlet while its arrow points back at you, and the impact takes speed away instead of wasting it sideways.',
      fact: card?.fact,
      buttons: [
        { label: 'Fly it again', onClick: startLevel },
        { label: 'Back to the portal', variant: 'quiet', onClick: () => ctx.onExit() },
      ],
    })
  }

  function endLevel(result: ImpactOutcome) {
    phase = 'levelEnd'
    const cut = -result.changeMin
    const passed = shotPassed(result.changeMin, cfg.requiredMin)
    const score = ctx.settings.practice
      ? 0
      : scoreShot({
          changeMin: result.changeMin,
          requiredMin: cfg.requiredMin,
          shotsUsed,
          totalShots: cfg.shots,
          level,
        })

    if (passed) sfx.sweep(520, 980, 360, 'triangle', 0.22)
    else sfx.tone(300, 260, 'sawtooth', 0.18)

    const grade = hitGrade(result.alignment)
    const detail = cut > 0 ? cut.toFixed(1) + ' min shorter' : Math.abs(cut).toFixed(1) + ' min longer'

    const explain =
      grade === 'wrong way'
        ? 'You caught it from behind. That adds speed, and a faster moonlet climbs into a wider, slower orbit — the opposite of what the mission needs.'
        : grade === 'glancing'
          ? 'A sideways hit barely changes its speed, so the orbit hardly moves. Only the part of the impact aimed against its travel does any work.'
          : grade === 'angled'
            ? 'A good hit, but off-axis: part of those 570 kg pushed sideways and did nothing. Meet it squarely and the same spacecraft cuts more.'
            : 'Square on the nose, against its travel. Every kilogram went into slowing it down.'

    const ejectaNote =
      ' The spacecraft alone carried ' +
      (result.deltaVMs * 1000).toFixed(2) +
      ' mm/s of kick, but the debris blasted off the surface flew away and pushed back: that ejecta multiplied the effect about ' +
      cfg.beta.toFixed(1) +
      ' times.'

    stage.showOverlay({
      title: passed ? 'Orbit shortened' : 'Not enough',
      tone: passed ? 'win' : 'lose',
      score: ctx.settings.practice
        ? detail + ' · ' + grade
        : detail + ' · ' + grade + ' · ' + score + ' points',
      text: explain + (passed ? ejectaNote : ''),
      fact: card?.fact,
      buttons: passed
        ? [{ label: 'Save and continue', onClick: () => complete(true, score) }]
        : [
            { label: 'Fly it again', onClick: startLevel },
            { label: 'Back to the portal', variant: 'quiet', onClick: () => ctx.onExit() },
          ],
    })
  }

  function spawnEjecta(dirX: number, dirY: number) {
    const count = reduced ? 14 : 46
    for (let i = 0; i < count; i++) {
      // Debris sprays back along the way the probe came in, in a cone.
      const spread = rng.range(-1.1, 1.1)
      const cos = Math.cos(spread)
      const sin = Math.sin(spread)
      const bx = -dirX * cos - -dirY * sin
      const by = -dirY * cos + -dirX * sin
      const speed = rng.range(30, 180)
      const life = rng.range(420, 1150)
      ejecta.push({
        x: impactX,
        y: impactY,
        vx: bx * speed,
        vy: by * speed,
        life,
        maxLife: life,
        size: rng.range(1, 3.2),
      })
    }
  }

  function hit() {
    const dir = { x: PROBE_SPEED, y: probeVy }
    const result = resolveImpact({ spec: cfg, orbitAngle, probeDirection: dir })
    outcome = result
    impactAt = elapsed
    phase = 'impact'

    // Freeze the flash and the debris where the moonlet actually was.
    const pos = orbitPosition(orbitAngle)
    impactX = CX + pos.x * PX_PER_M
    impactY = CY + pos.y * PX_PER_M

    const len = Math.hypot(dir.x, dir.y)
    spawnEjecta(dir.x / len, dir.y / len)

    sfx.noise(260, 0.26)
    sfx.tone(140, 320, 'sawtooth', 0.2)
    statLine()
  }

  /** The shot was spent without a usable hit. */
  function wasteShot(message: string) {
    stage.flash(message, 'bad')
    showArrowHint = true
    if (shotsUsed >= cfg.shots) {
      missionLost(message)
      return
    }
    armShot()
  }

  // --- Input ----------------------------------------------------------------

  const offPress = input.onPress((code) => {
    if (phase === 'intro' && (code === 'Space' || code === 'Enter')) {
      startLevel()
      return
    }
    if (phase === 'aim' && (code === 'Space' || code === 'Enter')) release()
  })

  const upHeld = () => input.held.has('ArrowUp') || input.held.has('KeyW') || touchUp
  const downHeld = () => input.held.has('ArrowDown') || input.held.has('KeyS') || touchDown

  let touchUp = false
  let touchDown = false

  const upBtn = stage.addTouchButton('Up', 'Steer up')
  const downBtn = stage.addTouchButton('Down', 'Steer down')

  const holdOn = (set: (v: boolean) => void) => (e: PointerEvent) => {
    e.preventDefault()
    if (phase === 'intro') startLevel()
    else if (phase === 'aim') release()
    set(true)
  }
  const holdOff = (set: (v: boolean) => void) => (e: PointerEvent) => {
    e.preventDefault()
    set(false)
  }

  const onUpDown = holdOn((v) => (touchUp = v))
  const onUpUp = holdOff((v) => (touchUp = v))
  const onDownDown = holdOn((v) => (touchDown = v))
  const onDownUp = holdOff((v) => (touchDown = v))

  upBtn.addEventListener('pointerdown', onUpDown)
  upBtn.addEventListener('pointerup', onUpUp)
  upBtn.addEventListener('pointercancel', onUpUp)
  upBtn.addEventListener('pointerleave', onUpUp)
  downBtn.addEventListener('pointerdown', onDownDown)
  downBtn.addEventListener('pointerup', onDownUp)
  downBtn.addEventListener('pointercancel', onDownUp)
  downBtn.addEventListener('pointerleave', onDownUp)

  const onCanvasDown = (e: PointerEvent) => {
    e.preventDefault()
    if (phase === 'intro') startLevel()
    else if (phase === 'aim') release()
  }
  stage.canvas.addEventListener('pointerdown', onCanvasDown)

  stage.setHint('Press Space to release the impactor')

  // --- Simulation -----------------------------------------------------------

  function update(dtMs: number) {
    elapsed += dtMs
    const dt = dtMs / 1000

    // The moonlet keeps circling in every phase but the final freeze.
    if (phase !== 'levelEnd' && phase !== 'impact') {
      orbitAngle += (Math.PI * 2 * dt) / cfg.orbitSeconds
    }

    if (phase === 'impact') {
      for (const p of ejecta) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life -= dtMs
      }
      // Shrink (or grow) the drawn orbit towards its new size.
      if (outcome) {
        const target = (outcome.semiMajorAfterM / ORBIT_RADIUS_M) * ORBIT_PX
        newOrbitPx += (target - newOrbitPx) * Math.min(1, dt * 3)
      }
      if (elapsed - impactAt > 1500 && outcome) endLevel(outcome)
      return
    }

    if (phase !== 'flight') return

    // Steering: costs divert fuel, and there is not much of it.
    const up = upHeld()
    const down = downHeld()
    if ((up || down) && divertLeft > 0) {
      probeVy += (down ? 1 : -1) * cfg.divertPxPerS * dt * 6
      divertLeft = Math.max(0, divertLeft - dt)
      statLine()
    }
    probeVy = Math.max(-cfg.divertPxPerS, Math.min(cfg.divertPxPerS, probeVy))

    probeX += PROBE_SPEED * dt
    probeY += probeVy * dt

    trail.push({ x: probeX, y: probeY })
    if (trail.length > 26) trail.shift()

    // Did it reach something?
    const pos = orbitPosition(orbitAngle)
    const mx = CX + pos.x * PX_PER_M
    const my = CY + pos.y * PX_PER_M

    if (Math.hypot(probeX - mx, probeY - my) <= targetPx + PROBE_R) {
      hit()
      return
    }
    if (Math.hypot(probeX - CX, probeY - CY) <= DIDYMOS_PX + PROBE_R) {
      wasteShot('You hit Didymos, not the moonlet')
      return
    }
    if (probeX > W + 40 || probeY < -40 || probeY > H + 40) {
      wasteShot('The impactor flew past Dimorphos')
    }
  }

  // --- Drawing --------------------------------------------------------------

  const c = stage.ctx

  function drawSky() {
    const g = c.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#06060f')
    g.addColorStop(1, '#101024')
    c.fillStyle = g
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

  function drawOrbits() {
    // The orbit as it is now.
    c.save()
    c.setLineDash([5, 7])
    c.strokeStyle = 'rgba(218,232,251,0.28)'
    c.lineWidth = 1.5
    c.beginPath()
    c.arc(CX, CY, ORBIT_PX, 0, Math.PI * 2)
    c.stroke()
    c.restore()

    // The orbit the impact bought, once there is one.
    if (outcome) {
      c.save()
      c.strokeStyle = accent
      c.lineWidth = 2.2
      c.globalAlpha = 0.9
      c.beginPath()
      c.arc(CX, CY, newOrbitPx, 0, Math.PI * 2)
      c.stroke()
      c.restore()
    }
  }

  function drawDidymos() {
    c.save()
    c.translate(CX, CY)

    const g = c.createRadialGradient(-DIDYMOS_PX * 0.3, -DIDYMOS_PX * 0.3, 4, 0, 0, DIDYMOS_PX)
    g.addColorStop(0, '#8d8070')
    g.addColorStop(1, '#3b352f')
    c.fillStyle = g
    c.beginPath()
    c.arc(0, 0, DIDYMOS_PX, 0, Math.PI * 2)
    c.fill()

    c.fillStyle = 'rgba(0,0,0,0.22)'
    for (const cr of craters) {
      c.beginPath()
      c.arc(cr.x, cr.y, cr.r, 0, Math.PI * 2)
      c.fill()
    }
    c.restore()

    c.fillStyle = 'rgba(218,232,251,0.55)'
    c.font = '500 12px "Space Grotesk", system-ui, sans-serif'
    c.textAlign = 'center'
    c.fillText('Didymos', CX, CY + DIDYMOS_PX + 18)
  }

  function drawMoonlet() {
    const pos = orbitPosition(orbitAngle)
    const mx = CX + pos.x * PX_PER_M
    const my = CY + pos.y * PX_PER_M

    c.save()
    c.translate(mx, my)
    const g = c.createRadialGradient(-targetPx * 0.3, -targetPx * 0.3, 1, 0, 0, targetPx)
    g.addColorStop(0, '#b9a98f')
    g.addColorStop(1, '#5a4f41')
    c.fillStyle = g
    c.beginPath()
    c.arc(0, 0, targetPx, 0, Math.PI * 2)
    c.fill()
    c.restore()

    // The velocity arrow. This is the whole lesson in one glyph: it shows
    // which way the moonlet is going, so you know where to meet it.
    const head = orbitHeading(orbitAngle)
    const ax = mx + head.x * (targetPx + 8)
    const ay = my + head.y * (targetPx + 8)
    const tipX = ax + head.x * 26
    const tipY = ay + head.y * 26

    // Lights up as the geometry turns favourable (arrow pointing back at
    // the incoming probe means a head-on hit).
    const facing = -head.x
    c.strokeStyle = facing > 0.75 ? '#7ee2b0' : 'rgba(218,232,251,0.7)'
    c.fillStyle = c.strokeStyle
    c.lineWidth = 2.4
    c.beginPath()
    c.moveTo(ax, ay)
    c.lineTo(tipX, tipY)
    c.stroke()
    c.beginPath()
    c.moveTo(tipX + head.x * 6, tipY + head.y * 6)
    c.lineTo(tipX - head.y * 5, tipY + head.x * 5)
    c.lineTo(tipX + head.y * 5, tipY - head.x * 5)
    c.closePath()
    c.fill()

    if (phase !== 'impact' && phase !== 'levelEnd') {
      c.fillStyle = 'rgba(218,232,251,0.6)'
      c.font = '500 11px "Space Grotesk", system-ui, sans-serif'
      c.textAlign = 'center'
      c.fillText('Dimorphos', mx, my - targetPx - 12)
    }
  }

  function drawProbe() {
    if (phase !== 'aim' && phase !== 'flight') return

    // Trail.
    c.save()
    c.strokeStyle = accent
    c.lineWidth = 2
    for (let i = 1; i < trail.length; i++) {
      c.globalAlpha = (i / trail.length) * 0.55
      c.beginPath()
      c.moveTo(trail[i - 1]!.x, trail[i - 1]!.y)
      c.lineTo(trail[i]!.x, trail[i]!.y)
      c.stroke()
    }
    c.restore()

    // The probe: a small wedge pointing the way it is travelling.
    const ang = Math.atan2(probeVy, PROBE_SPEED)
    c.save()
    c.translate(probeX, probeY)
    c.rotate(ang)
    c.fillStyle = '#f4f7ff'
    c.beginPath()
    c.moveTo(9, 0)
    c.lineTo(-6, -5)
    c.lineTo(-6, 5)
    c.closePath()
    c.fill()
    // Solar wings.
    c.fillStyle = accent
    c.fillRect(-5, -12, 3, 7)
    c.fillRect(-5, 5, 3, 7)
    c.restore()

    // While aiming, show the straight run it will take.
    if (phase === 'aim') {
      c.save()
      c.setLineDash([4, 8])
      c.strokeStyle = 'rgba(244,247,255,0.35)'
      c.lineWidth = 1.4
      c.beginPath()
      c.moveTo(probeX, probeY)
      c.lineTo(W, probeY)
      c.stroke()
      c.restore()
    }
  }

  function drawEjecta() {
    for (const p of ejecta) {
      if (p.life <= 0) continue
      c.globalAlpha = Math.max(0, p.life / p.maxLife) * 0.9
      c.fillStyle = p.life / p.maxLife > 0.6 ? '#fff6d8' : '#c7b48d'
      c.beginPath()
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = 1
  }

  function drawFlash() {
    if (phase !== 'impact') return
    const t = (elapsed - impactAt) / 420
    if (t > 1) return
    const r = 18 + t * 90
    c.save()
    c.globalAlpha = (1 - t) * 0.85
    const g = c.createRadialGradient(impactX, impactY, 0, impactX, impactY, r)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.4, '#ffd98a')
    g.addColorStop(1, 'rgba(255,217,138,0)')
    c.fillStyle = g
    c.beginPath()
    c.arc(impactX, impactY, r, 0, Math.PI * 2)
    c.fill()
    c.restore()
  }

  function drawHud() {
    c.textAlign = 'center'
    c.font = '600 16px "Space Grotesk", system-ui, sans-serif'

    if (phase === 'aim') {
      c.fillStyle = accent
      c.fillText('Pick your moment — Space to release', W / 2, 36)
    } else if (phase === 'flight') {
      c.fillStyle = '#f4f7ff'
      c.fillText('Terminal guidance — steer with Up and Down', W / 2, 36)
    } else if (phase === 'impact' && outcome) {
      const cut = -outcome.changeMin
      c.fillStyle = cut >= cfg.requiredMin ? '#7ee2b0' : '#ff9aa8'
      c.fillText(
        (cut > 0 ? 'Orbit ' + cut.toFixed(1) + ' min shorter' : 'Orbit ' + Math.abs(cut).toFixed(1) + ' min longer'),
        W / 2,
        36,
      )
    }

    // The ceiling of what this impactor can physically do, so the numbers
    // on screen mean something.
    c.font = '500 12px "Space Grotesk", system-ui, sans-serif'
    c.fillStyle = 'rgba(218,232,251,0.5)'
    c.textAlign = 'left'
    c.fillText(
      'Best possible cut with one DART: ' + bestPossible.toFixed(0) + ' min',
      16,
      H - 16,
    )

    if (showArrowHint && (phase === 'aim' || phase === 'flight')) {
      c.textAlign = 'right'
      c.fillStyle = '#7ee2b0'
      c.fillText('Meet it while its arrow points back at you', W - 16, H - 16)
    }
  }

  function render() {
    drawSky()
    drawOrbits()
    drawDidymos()
    drawMoonlet()
    drawProbe()
    drawEjecta()
    drawFlash()
    drawHud()
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  statLine()
  stage.showOverlay({
    title: card?.title ?? 'DART Impact',
    text:
      'Dimorphos circles Didymos once every 11.9 hours. You have ' +
      (cfg.shots === 1 ? 'one impactor' : cfg.shots + ' impactors') +
      ' and need to shorten that orbit by at least ' +
      cfg.requiredMin +
      ' minutes. A 570 kg spacecraft cannot shove a 4-billion-tonne rock aside — but it can take a few millimetres per second off its speed, and a slower moonlet falls into a tighter, faster orbit.',
    buttons: [{ label: 'Begin', onClick: startLevel }],
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
      upBtn.removeEventListener('pointerdown', onUpDown)
      upBtn.removeEventListener('pointerup', onUpUp)
      upBtn.removeEventListener('pointercancel', onUpUp)
      upBtn.removeEventListener('pointerleave', onUpUp)
      downBtn.removeEventListener('pointerdown', onDownDown)
      downBtn.removeEventListener('pointerup', onDownUp)
      downBtn.removeEventListener('pointercancel', onDownUp)
      downBtn.removeEventListener('pointerleave', onDownUp)
      stage.canvas.removeEventListener('pointerdown', onCanvasDown)
      input.destroy()
      sfx.destroy()
      stage.destroy()
      return Promise.resolve()
    },
  }
}

import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { COLORS, roundRect, text, toLogical } from '../shared/canvasui'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import {
  EARTH_G,
  IDLE_RPM,
  LEVELS,
  MAX_ALT,
  MAX_RPM,
  RHO_EARTH,
  conceptFor,
  createHeli,
  groundAt,
  groundHeight,
  hoverRpm,
  judge,
  scoreFlight,
  stepHeli,
  type Controls,
  type Heli,
} from './rules'

const W = 640
const H = 560
const GROUND = 486
const SX = 10 // px per metre (horizontal)
const SY = 14 // px per metre (vertical)

/**
 * INGENUITY: FLY IN THIN AIR
 * -------------------------------------------------------------------------
 * Side-view flight where you control the ROTOR SPEED, not a thrust. Lift
 * grows with air density × rpm², so on Mars nothing happens until the
 * blades pass ~2,400 rpm (level 1). The battery allows about one 90 s
 * flight (level 2), and over smooth sand the navigation camera loses track
 * and the helicopter drifts (level 3, how the real mission ended).
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('ingenuity-flight')
  const levelKey = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as 1 | 2 | 3
  const spec = LEVELS[levelKey]
  const concept = conceptFor(levelKey)
  const practice = ctx.settings.practice
  const reduced = ctx.settings.reducedMotion
  const sfx = createSfx(ctx.settings.volume)
  const MARS_HOVER = hoverRpm()
  const EARTH_HOVER = hoverRpm(RHO_EARTH, EARTH_G)
  /** Half-width of the "you are hovering" band on the gauge (about 2% of the hover speed). */
  const HOVER_BAND = 48

  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#c9ccd4' })
  const input = createInput(stage.root)
  const c = stage.ctx
  const startedAt = performance.now()

  type Phase = 'intro' | 'flying' | 'done'
  let phase: Phase = 'intro'
  let heli: Heli = createHeli(spec)
  let camX = 0
  let tries = 0
  let settled = false
  let spin = 0
  let lowWarned = false
  /** Seconds flying with no key down, to teach once that the setting holds. */
  let coasting = 0
  let holdExplained = false
  const decisions: { concept: string; correct: boolean }[] = []
  const touch = { faster: false, slower: false, left: false, right: false }

  function controls(): Controls {
    const h = input.held
    return {
      faster: touch.faster || h.has('ArrowUp') || h.has('KeyW') || h.has('Space'),
      slower: touch.slower || h.has('ArrowDown') || h.has('KeyS'),
      left: touch.left || h.has('ArrowLeft') || h.has('KeyA'),
      right: touch.right || h.has('ArrowRight') || h.has('KeyD'),
    }
  }

  function begin() {
    heli = createHeli(spec)
    lowWarned = false
    coasting = 0
    holdExplained = false
    tries++
    phase = 'flying'
    stage.hideOverlay()
    sfx.tone(440, 90, 'triangle', 0.12)
    // The blades already spin faster than Earth would ever need, and nothing
    // happens: that is the lesson, so say it at the moment the player sees it.
    if (levelKey === 1) stage.flash('Blades already at ' + IDLE_RPM + ' rpm — enough to fly on Earth. Not on Mars.')
  }

  function finish(event: 'landed' | 'crash' | 'battery', reason: string) {
    phase = 'done'
    const v = judge(levelKey, spec, heli, event, reason)
    if (!practice) decisions.push({ concept, correct: v.conceptOk })
    const score = practice || !v.won ? 0 : scoreFlight(spec, heli)
    if (v.won) sfx.sweep(520, 980, 360, 'triangle', 0.2)
    else {
      sfx.noise(260, 0.2)
      sfx.sweep(300, 90, 420, 'sawtooth', 0.16)
    }
    const lesson =
      levelKey === 1
        ? 'Lift depends on how thick the air is. Mars air is less than 1% as dense as Earth’s, so Ingenuity spun its blades at about 2,500 rpm. In this game’s model the same helicopter would lift off on Earth at about ' +
          Math.round(EARTH_HOVER / 10) * 10 +
          ' rpm.'
        : levelKey === 2
          ? 'Ingenuity’s solar panel charged its batteries for about one 90-second flight per Martian day. Every flight was planned to fit the battery.'
          : 'On its 72nd flight Ingenuity was over steep, smooth sand ripples. Its camera found too little texture to measure its speed, and at landing a rotor blade was damaged. It never flew again, but it still stands on Mars.'
    if (v.won) {
      stage.showOverlay({
        title: 'Flight complete',
        tone: 'win',
        score: 'Battery left ' + Math.round(heli.battery) + ' s · max height ' + heli.maxAlt.toFixed(1) + ' m' + (practice ? '' : ' · ' + score + ' points'),
        text: lesson,
        fact: card?.fact,
        buttons: [{ label: 'Save and continue', onClick: () => complete(true, score) }],
      })
    } else {
      stage.showOverlay({
        title: event === 'battery' ? 'Battery empty' : event === 'crash' ? 'Hard landing' : 'Not yet',
        tone: 'lose',
        score: v.reason,
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
      gameId: 'ingenuity-flight',
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

  type Held = 'faster' | 'slower' | 'left' | 'right'
  const pointers = new Map<number, Held>()
  const sync = () => {
    touch.faster = touch.slower = touch.left = touch.right = false
    for (const v of pointers.values()) touch[v] = true
  }
  const zoneAt = (e: PointerEvent): Held => {
    const p = toLogical(stage.canvas, e, W, H)
    if (p.x < W * 0.22) return 'left'
    if (p.x > W * 0.78) return 'right'
    return p.y < H * 0.55 ? 'faster' : 'slower'
  }
  const onDown = (e: PointerEvent) => {
    e.preventDefault()
    if (phase === 'intro') return begin()
    if (phase !== 'flying') return
    pointers.set(e.pointerId, zoneAt(e))
    sync()
  }
  const onMove = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, zoneAt(e))
    sync()
  }
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId)
    sync()
  }
  stage.canvas.addEventListener('pointerdown', onDown)
  stage.canvas.addEventListener('pointermove', onMove)
  stage.canvas.addEventListener('pointerup', onUp)
  stage.canvas.addEventListener('pointercancel', onUp)
  stage.canvas.addEventListener('pointerleave', onUp)

  const padHandlers: { el: HTMLButtonElement; down: (e: PointerEvent) => void; up: () => void }[] = []
  for (const [label, aria, key] of [
    ['◀', 'Fly left', 'left'],
    ['Spin ▲', 'Spin the rotors faster', 'faster'],
    ['Spin ▼', 'Spin the rotors slower', 'slower'],
    ['▶', 'Fly right', 'right'],
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

  stage.setHint(
    'Up spins the blades faster, Down slower. You do not hold the key: the speed stays where you leave it, like a dial. Left / Right fly sideways · on a phone: top = faster, bottom = slower, edges = sideways'
  )

  // --- Simulation -----------------------------------------------------------------
  function update(dtMs: number) {
    spin += (dtMs / 1000) * (heli.rpm / 60) * 0.25
    if (phase !== 'flying') return
    const dt = dtMs / 1000
    const steps = Math.max(1, Math.round(dt / (1 / 120)))
    const ctrl = controls()
    const wasAir = heli.airborne
    for (let i = 0; i < steps; i++) {
      const r = stepHeli(spec, heli, ctrl, dt / steps, { infinite: practice })
      heli = r.heli
      if (r.event !== 'none') return finish(r.event, r.reason)
    }
    if (!wasAir && heli.airborne) {
      stage.flash('Lift-off at ' + Math.round(heli.rpm) + ' rpm!')
      sfx.tone(880, 120, 'sine', 0.12)
    }
    // First time the player lets go in the air, name what they are seeing:
    // the rotor did not stop, because the speed is a setting, not a push.
    coasting = !ctrl.faster && !ctrl.slower && heli.airborne ? coasting + dt : 0
    if (!holdExplained && coasting > 0.7) {
      holdExplained = true
      stage.flash('Keys up — the blades keep the speed you set. Press Down to slow them.')
    }
    if (!practice && !lowWarned && heli.battery < spec.battery * 0.2) {
      lowWarned = true
      stage.flash('Battery low: land soon!', 'bad')
    }
    stats()
  }

  function stats() {
    const goal =
      levelKey === 1
        ? Math.min(spec.hover!.seconds, heli.hoverTime).toFixed(1) + ' / ' + spec.hover!.seconds + ' s hover'
        : levelKey === 2
          ? heli.photo
            ? 'Photo ✓ · land at base'
            : 'Photo: not yet'
          : groundAt(spec, heli.x) === 'pebbles'
            ? 'NAV: tracking pebbles'
            : 'NAV: no texture!'
    stage.setStats([
      {
        key: 'rpm',
        label: 'Rotor speed',
        value: Math.round(heli.rpm) + ' rpm',
        tone: heli.rpm >= MARS_HOVER - HOVER_BAND ? 'ok' : heli.rpm > 1500 ? 'warn' : undefined,
      },
      { key: 'alt', label: 'Height', value: heli.y.toFixed(1) + ' m' },
      {
        key: 'bat',
        label: practice ? 'Battery (practice)' : 'Battery',
        value: practice ? '∞' : Math.round(heli.battery) + ' s',
        meter: practice ? 1 : heli.battery / spec.battery,
        tone: practice || heli.battery > spec.battery * 0.4 ? 'ok' : heli.battery > spec.battery * 0.2 ? 'warn' : 'bad',
      },
      { key: 'goal', label: 'Goal', value: goal, tone: levelKey === 3 && groundAt(spec, heli.x) === 'ripples' ? 'bad' : undefined },
    ])
  }

  // --- Drawing --------------------------------------------------------------------
  const wx = (x: number) => (x - camX) * SX
  const wy = (y: number) => GROUND - y * SY

  function drawWorld() {
    const g = c.createLinearGradient(0, 0, 0, GROUND)
    g.addColorStop(0, '#b98f72')
    g.addColorStop(1, '#e2bf9b')
    c.fillStyle = g
    c.fillRect(0, 0, W, GROUND)
    // Distant crater rim
    c.fillStyle = 'rgba(150,100,75,0.55)'
    const par = reduced ? 0 : camX * 3
    c.beginPath()
    c.moveTo(0, GROUND - 60)
    for (let x = 0; x <= W; x += 20) c.lineTo(x, GROUND - 60 - 18 * Math.sin((x + par) / 90) - 8 * Math.sin((x + par) / 31))
    c.lineTo(W, GROUND)
    c.lineTo(0, GROUND)
    c.fill()

    // Ground: pebbly flats and smooth ripples
    for (let px = 0; px < W; px += 2) {
      const x = camX + px / SX
      const kind = groundAt(spec, x)
      const gh = groundHeight(spec, x)
      c.fillStyle = kind === 'pebbles' ? '#9a6043' : '#c48b5f'
      c.fillRect(px, wy(gh), 2, H - wy(gh))
    }
    // Ripple crests: smooth, steep sand with nothing for a camera to track
    c.strokeStyle = 'rgba(255,236,205,0.6)'
    c.lineWidth = 2
    c.beginPath()
    let drawing = false
    for (let px = 0; px <= W; px += 3) {
      const x = camX + px / SX
      if (groundAt(spec, x) !== 'ripples') {
        drawing = false
        continue
      }
      const y = wy(groundHeight(spec, x))
      if (!drawing) c.moveTo(px, y)
      else c.lineTo(px, y)
      drawing = true
    }
    c.stroke()
    // Pebbles (texture the camera can track)
    c.fillStyle = 'rgba(60,35,25,0.75)'
    for (let x = Math.floor(camX); x < camX + W / SX + 1; x++) {
      if (groundAt(spec, x) !== 'pebbles') continue
      for (let k = 0; k < 3; k++) {
        const ox = (Math.sin(x * 12.9 + k * 7.1) * 0.5 + 0.5) * 0.9
        const oy = (Math.sin(x * 4.3 + k * 2.7) * 0.5 + 0.5) * 30
        c.beginPath()
        c.ellipse(wx(x + ox), GROUND + 4 + oy, 3, 2, 0, 0, Math.PI * 2)
        c.fill()
      }
    }
    // Labels for level 3 ground
    if (levelKey === 3) {
      for (const z of spec.zones) {
        const mid = (z.x0 + z.x1) / 2
        const x = wx(mid)
        if (x < -60 || x > W + 60) continue
        text(c, z.kind === 'pebbles' ? 'pebbles · safe' : 'smooth ripples', x, GROUND + 52, {
          size: 12,
          weight: 800,
          color: z.kind === 'pebbles' ? '#fff3dc' : '#5a2a1a',
          align: 'center',
        })
      }
    }
    // Targets
    if (spec.hover) {
      const y = wy(spec.hover.alt)
      c.strokeStyle = 'rgba(18,12,4,0.55)'
      c.setLineDash([8, 6])
      c.beginPath()
      c.moveTo(0, y)
      c.lineTo(W, y)
      c.stroke()
      c.setLineDash([])
      text(c, 'hover above ' + spec.hover.alt + ' m', 12, y - 6, { size: 11, color: 'rgba(18,12,4,0.8)' })
    }
    if (spec.photo) {
      const x = wx(spec.photo.x)
      c.fillStyle = '#6b4430'
      c.beginPath()
      c.moveTo(x - 40, GROUND)
      c.lineTo(x - 22, GROUND - 26)
      c.lineTo(x + 8, GROUND - 34)
      c.lineTo(x + 40, GROUND)
      c.fill()
      c.strokeStyle = heli.photo ? 'rgba(127,214,163,0.9)' : 'rgba(18,12,4,0.6)'
      c.setLineDash([6, 6])
      c.strokeRect(x - 40, wy(MAX_ALT), 80, wy(spec.photo.alt) - wy(MAX_ALT))
      c.setLineDash([])
      text(c, heli.photo ? 'photo taken ✓' : 'photo zone (5 m+)', x, wy(spec.photo.alt) + 16, { size: 11, weight: 800, color: 'rgba(18,12,4,0.85)', align: 'center' })
    }
    if (spec.landing && levelKey === 2) {
      const x0 = wx(spec.landing.x0)
      const x1 = wx(spec.landing.x1)
      c.fillStyle = 'rgba(243,181,74,0.55)'
      c.fillRect(x0, GROUND - 4, x1 - x0, 8)
      text(c, 'new base', (x0 + x1) / 2, GROUND - 10, { size: 11, weight: 800, color: '#3a2410', align: 'center' })
    }
    // Perseverance waiting near the start
    const rx = wx(spec.start - 7)
    if (rx > -60 && rx < W + 60) {
      c.fillStyle = '#e9e4d6'
      c.fillRect(rx - 22, GROUND - 26, 44, 14)
      c.fillStyle = '#2a3142'
      for (const d of [-16, 0, 16]) {
        c.beginPath()
        c.arc(rx + d, GROUND - 8, 6, 0, Math.PI * 2)
        c.fill()
      }
      c.fillStyle = '#e9e4d6'
      c.fillRect(rx + 12, GROUND - 44, 4, 18)
      c.fillRect(rx + 8, GROUND - 48, 12, 6)
      text(c, 'Perseverance', rx, GROUND - 54, { size: 10, color: 'rgba(18,12,4,0.7)', align: 'center' })
    }
  }

  function drawHeli() {
    const x = wx(heli.x)
    const y = wy(heli.y)
    const tilt = Math.max(-0.3, Math.min(0.3, heli.vx * 0.08))
    c.save()
    c.translate(x, y)
    c.rotate(tilt)
    // legs
    c.strokeStyle = '#d7d2c4'
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(-6, -12)
    c.lineTo(-16, 0)
    c.moveTo(6, -12)
    c.lineTo(16, 0)
    c.stroke()
    // body
    c.fillStyle = '#c9ccd4'
    c.fillRect(-9, -22, 18, 12)
    c.fillStyle = '#2a3142'
    c.fillRect(-9, -14, 18, 2)
    // mast
    c.fillStyle = '#ece6d8'
    c.fillRect(-1.5, -46, 3, 24)
    // two rotors: faster = more blurred and wider
    const k = Math.min(1, heli.rpm / MAX_RPM)
    for (const [yy, dir] of [[-34, 1], [-42, -1]] as const) {
      if (k > 0.35 || reduced) {
        c.fillStyle = `rgba(236,230,216,${0.18 + k * 0.25})`
        c.beginPath()
        c.ellipse(0, yy, 34, 3.5, 0, 0, Math.PI * 2)
        c.fill()
      }
      const a = reduced ? 0 : spin * dir * Math.PI * 2
      const len = 34 * Math.abs(Math.cos(a))
      c.strokeStyle = '#2f2a24'
      c.lineWidth = 3
      c.beginPath()
      c.moveTo(-len, yy)
      c.lineTo(len, yy)
      c.stroke()
    }
    // solar panel on top
    c.fillStyle = '#35507a'
    c.fillRect(-12, -50, 24, 4)
    c.restore()

    // shadow
    const gh = groundHeight(spec, heli.x)
    c.fillStyle = 'rgba(40,20,10,0.35)'
    c.beginPath()
    c.ellipse(x, wy(gh) + 2, Math.max(6, 18 - heli.y), 3, 0, 0, Math.PI * 2)
    c.fill()
  }

  /** What the current setting is doing, in the words a child would use. */
  function throttleState(): { label: string; color: string } {
    if (heli.rpm < MARS_HOVER - HOVER_BAND)
      return heli.airborne
        ? { label: 'Sinking — spin faster', color: COLORS.gold }
        : { label: 'Too slow to lift in Mars air', color: COLORS.gold }
    if (heli.rpm <= MARS_HOVER + HOVER_BAND) return { label: 'Holding height', color: COLORS.ok }
    return { label: 'Climbing', color: COLORS.ok }
  }

  /**
   * Throttle gauge. The rotor speed is a SETTING the player leaves somewhere,
   * not a button they push, so the gauge has to answer three questions at a
   * glance: where is my setting now, where does it lift off and hover on Mars,
   * and how far below that is Earth.
   */
  function drawRpmGauge() {
    const bx = 12
    const by = 12
    const bw = 244
    c.fillStyle = 'rgba(13,16,23,0.86)'
    roundRect(c, bx, by, bw, 108, 10)
    c.fill()
    text(c, 'ROTOR SPEED', bx + 12, by + 18, { size: 10, color: COLORS.dim })
    text(c, Math.round(heli.rpm) + ' rpm', bx + bw - 12, by + 18, { size: 13, weight: 800, align: 'right' })
    const tx = bx + 12
    const tw = bw - 24
    const ty = by + 30
    const th = 14
    const f = (rpm: number) => tx + (Math.max(0, Math.min(MAX_RPM, rpm)) / MAX_RPM) * tw
    c.fillStyle = '#141925'
    c.fillRect(tx, ty, tw, th)
    c.fillStyle = heli.rpm >= MARS_HOVER - HOVER_BAND ? COLORS.ok : COLORS.gold
    c.fillRect(tx, ty, f(heli.rpm) - tx, th)
    // Green band = lift matches weight, so the helicopter holds its height.
    // Drawn over the bar, or a full bar would hide the target to aim at.
    const b0 = f(MARS_HOVER - HOVER_BAND)
    const b1 = f(MARS_HOVER + HOVER_BAND)
    c.fillStyle = 'rgba(13,16,23,0.35)'
    c.fillRect(b0, ty, b1 - b0, th)
    c.strokeStyle = COLORS.ok
    c.lineWidth = 2
    c.strokeRect(b0 - 1, ty - 5, b1 - b0 + 2, th + 10)
    // Earth mark: the same helicopter would already be flying this far left.
    c.fillStyle = '#7fb6e0'
    c.fillRect(f(EARTH_HOVER) - 1, ty - 5, 2, th + 10)
    // The handle: a slider knob, because the setting stays where it is left.
    const hx = f(heli.rpm)
    c.fillStyle = COLORS.star
    c.fillRect(hx - 2, ty - 7, 4, th + 14)
    c.beginPath()
    c.moveTo(hx - 6, ty - 8)
    c.lineTo(hx + 6, ty - 8)
    c.lineTo(hx, ty - 1)
    c.fill()
    // Legend: left = Earth, right = the Mars hover band the handle must reach.
    text(c, 'Earth: ' + Math.round(EARTH_HOVER / 10) * 10 + ' rpm', tx, ty + 30, { size: 10, weight: 700, color: '#7fb6e0' })
    text(c, 'Mars: hover at ' + Math.round(MARS_HOVER / 10) * 10 + ' rpm', tx + tw, ty + 30, {
      size: 10,
      weight: 700,
      color: COLORS.ok,
      align: 'right',
    })
    const st = throttleState()
    text(c, st.label, tx, ty + 48, { size: 12, weight: 800, color: st.color })
    text(c, 'Up / Down move the handle · it stays put', tx, ty + 64, { size: 10, color: COLORS.dim })
  }

  function drawMinimap() {
    if (spec.worldW <= W / SX) return
    const mx = W - 212
    const my = 12
    const mw = 200
    c.fillStyle = 'rgba(13,16,23,0.86)'
    roundRect(c, mx, my, mw, 34, 8)
    c.fill()
    const px = (x: number) => mx + 8 + (x / spec.worldW) * (mw - 16)
    for (const z of spec.zones) {
      c.fillStyle = z.kind === 'pebbles' ? '#9a6043' : '#e2b98a'
      c.fillRect(px(z.x0), my + 20, px(z.x1) - px(z.x0), 6)
    }
    if (spec.photo) {
      c.fillStyle = heli.photo ? COLORS.ok : '#fff3dc'
      c.fillRect(px(spec.photo.x) - 2, my + 8, 4, 10)
    }
    if (spec.landing && levelKey === 2) {
      c.fillStyle = COLORS.gold
      c.fillRect(px(spec.landing.x0), my + 14, px(spec.landing.x1) - px(spec.landing.x0), 4)
    }
    c.fillStyle = COLORS.star
    c.beginPath()
    c.arc(px(heli.x), my + 12, 4, 0, Math.PI * 2)
    c.fill()
  }

  function render() {
    // Camera follows the helicopter, clamped to the world.
    const target = Math.max(0, Math.min(spec.worldW - W / SX, heli.x - W / SX / 2))
    camX = reduced ? target : camX + (target - camX) * 0.15
    drawWorld()
    drawHeli()
    drawRpmGauge()
    drawMinimap()
    if (levelKey === 3 && phase === 'flying' && heli.airborne && groundAt(spec, heli.x) === 'ripples') {
      text(c, 'NAV: smooth sand, no texture to track. Drifting!', W / 2, 112, { size: 13, weight: 800, color: '#7a1a10', align: 'center' })
    }
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  stats()
  camX = Math.max(0, Math.min(spec.worldW - W / SX, heli.x - W / SX / 2))
  stage.showOverlay({
    title: (card?.title ?? 'Ingenuity') + ' · ' + spec.name,
    text: spec.intro,
    buttons: [{ label: 'Start the rotors', onClick: begin }],
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

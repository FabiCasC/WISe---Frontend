import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import { TERMS } from './terms'
import {
  DSN_IDS,
  HALF_VIEW,
  LEVELS,
  MIN_PER_DEG,
  contactTimeline,
  coverage,
  inView,
  longestBlackoutMin,
  norm180,
  passed,
  scoreLink,
  snapLon,
  type Site,
} from './rules'

const W = 620
const H = 560
const CX = 250
const CY = 220
const R = 112
const RING = R + 46
const PROBE = { x: 584, y: CY }
const TL = { x: 40, y: 430, w: 540, h: 26 }
const BTN_CLEAR = { x: 40, y: 494, w: 250, h: 48 }
const BTN_RUN = { x: 330, y: 494, w: 250, h: 48 }
/** One simulated day lasts this long on screen. */
const DAY_MS = 6500

/**
 * KEEP THE LINK
 * -------------------------------------------------------------------------
 * Replaces the old tic-tac-toe: now the coverage idea IS the game. You place
 * dishes on a turning Earth and run a day. Each dish sees a slice of sky
 * (its coloured arc); the link survives only if the arcs close the ring.
 * The player discovers by testing that one dish fails, that dishes bunched
 * together fail, and that three spread ~120 degrees apart never lose the probe:
 * exactly why NASA's Deep Space Network sits in California, Spain and
 * Australia.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('orbital-grid')
  const levelKey = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as 1 | 2 | 3
  const spec = LEVELS[levelKey]
  const concept = levelKey === 1 ? 'la-tierra-gira-oculta-antena' : 'tres-estaciones-cobertura'
  const sfx = createSfx(ctx.settings.volume)
  const reduced = ctx.settings.reducedMotion
  const practice = ctx.settings.practice

  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#75CBD1' })
  stage.setGlossary(TERMS)
  const input = createInput(stage.root)
  const c = stage.ctx
  const startedAt = performance.now()

  type Phase = 'intro' | 'placing' | 'running' | 'done'
  let phase: Phase = 'intro'
  /** Longitudes (free levels) of the dishes placed. */
  let dishes: number[] = []
  /** Site ids (level 3). */
  let picked: string[] = []
  let rotation = 0
  let runMs = 0
  let runs = 0
  let cursor = 0
  let hoverLon: number | null = null
  let lastTimeline: boolean[] | null = null
  let settled = false
  /** Longest blackout (minutes) of the first full run, to say what the player improved. */
  let firstBlackout: number | null = null
  const decisions: { concept: string; correct: boolean }[] = []

  const sites = spec.sites
  /** A tap this close (degrees) to a dish removes it. */
  const SNAP_HIT = 8
  const currentLons = () =>
    sites ? picked.map((id) => sites.find((s) => s.id === id)!.lon) : dishes

  function stats() {
    const lons = currentLons()
    stage.setStats([
      { key: 'dishes', label: 'Dishes', value: lons.length + ' / ' + spec.dishes },
      {
        key: 'cov',
        label: 'Contact last run',
        value: lastTimeline ? Math.round((lastTimeline.filter(Boolean).length / 360) * 100) + '%' : '-',
        meter: lastTimeline ? lastTimeline.filter(Boolean).length / 360 : 0,
      },
      { key: 'goal', label: 'Goal', value: Math.round(spec.goal * 100) + '%' },
      { key: 'runs', label: 'Days run', value: String(runs) },
    ])
  }

  // --- Placing ----------------------------------------------------------------
  function toggleAt(lon: number) {
    if (phase === 'intro') return begin()
    if (phase !== 'placing') return
    if (sites) {
      // Nearest real site to the tap.
      let best: Site | null = null
      let bestD = 999
      for (const s of sites) {
        const d = Math.abs(norm180(s.lon - lon))
        if (d < bestD) {
          bestD = d
          best = s
        }
      }
      if (!best || bestD > 12) return
      if (picked.includes(best.id)) picked = picked.filter((id) => id !== best!.id)
      else if (picked.length < spec.dishes) picked = [...picked, best.id]
      else return stage.flash('All ' + spec.dishes + ' dishes used. Tap one to move it.', 'bad')
      sfx.tone(640, 70, 'sine', 0.14)
    } else {
      const snapped = snapLon(lon)
      const near = dishes.find((d) => Math.abs(norm180(d - snapped)) < SNAP_HIT)
      if (near !== undefined) dishes = dishes.filter((d) => d !== near)
      else if (dishes.length < spec.dishes) dishes = [...dishes, snapped]
      else return stage.flash('All ' + spec.dishes + ' dishes used. Tap one to move it.', 'bad')
      sfx.tone(640, 70, 'sine', 0.14)
    }
    stats()
  }
  function clearAll() {
    if (phase !== 'placing') return
    dishes = []
    picked = []
    stats()
  }

  function run() {
    if (phase === 'intro') return begin()
    if (phase !== 'placing') return
    if (currentLons().length === 0) return stage.flash('Place at least one dish first', 'bad')
    phase = 'running'
    runMs = 0
    rotation = 0
    runs++
    sfx.sweep(300, 520, 260, 'triangle', 0.14)
    if (reduced) finishRun()
  }

  function finishRun() {
    const lons = currentLons()
    lastTimeline = contactTimeline(lons)
    rotation = 0
    const cov = coverage(lons)
    const blackout = longestBlackoutMin(lons)
    const full = lons.length === spec.dishes
    stats()

    if (!full) {
      phase = 'placing'
      stage.flash(
        'Test day: ' + Math.round(cov * 100) + '% contact. Place ' + spec.dishes + ' dishes to finish.',
        cov >= spec.goal ? 'ok' : 'bad'
      )
      return
    }

    const ok = passed(lons, spec)
    if (firstBlackout === null) firstBlackout = blackout
    decisions.push({ concept, correct: ok })
    if (ok) return win(cov, blackout)

    phase = 'placing'
    sfx.sweep(320, 140, 380, 'sawtooth', 0.16)
    stage.flash('Lost the probe for ' + fmtMin(blackout) + '. Look for the gap in the ring.', 'bad')
  }

  function win(cov: number, blackout: number) {
    phase = 'done'
    sfx.sweep(520, 980, 340, 'triangle', 0.22)
    const score = practice ? 0 : scoreLink(cov, runs)
    const usedDsn = sites && DSN_IDS.every((id) => picked.includes(id))
    const text =
      levelKey === 1
        ? 'One dish loses the probe for over 12 hours, because the Earth turns it away. Two on opposite sides keep most of the day, but the longest gap is still ' +
          fmtMin(blackout) +
          '.'
        : levelKey === 2
          ? 'Three dishes about 120° apart: when one turns away, the next one already sees the probe. That is why NASA spread its Deep Space Network around the planet.'
          : usedDsn
            ? 'You picked the real Deep Space Network: Goldstone, Madrid and Canberra, about a third of the world apart.'
            : 'Your three sites work. NASA chose Goldstone (California), Madrid (Spain) and Canberra (Australia), spread about a third of the world apart.'
    const star = (v: boolean) => (v ? '★' : '☆')
    const lines = [
      `${currentLons().length} dishes at ${currentLons().map((l) => Math.round(l) + '°').join(', ')}: the probe stayed in contact ${Math.round(cov * 100)}% of the day, longest blackout ${fmtMin(blackout)}.`,
      runs === 1
        ? 'You got it on the first run.'
        : `It took ${runs} runs. The first full run left a blackout of ${fmtMin(firstBlackout ?? blackout)}.`,
      text,
      `Stars: ${star(true)} link kept ${star(runs === 1)} first run ${star(blackout === 0 && (!sites || !!usedDsn))} ${sites ? 'real sites' : 'no blackout'}`,
    ]
    stage.showOverlay({
      title: 'Link kept',
      tone: 'win',
      score: practice ? undefined : score + ' points',
      lines,
      buttons: [{ label: 'Save and continue', onClick: () => complete(score) }],
    })
  }

  function complete(score: number) {
    if (settled) return
    settled = true
    ctx.onComplete({
      gameId: 'orbital-grid',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: true,
      evidenceIds: card?.evidence.map((e) => e.id) ?? [],
      firstAnswerCorrect: decisions.length > 0 && decisions[0].correct,
      decisions,
    })
  }

  function begin() {
    stage.hideOverlay()
    phase = 'placing'
    stats()
  }

  // --- Input -----------------------------------------------------------------
  const toLogical = (e: PointerEvent) => {
    const rect = stage.canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    }
  }
  const inBox = (p: { x: number; y: number }, b: typeof BTN_RUN) =>
    p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h
  /** Screen point to longitude, if it is on the placing ring. */
  const lonAt = (p: { x: number; y: number }): number | null => {
    const dx = p.x - CX
    const dy = CY - p.y
    const d = Math.hypot(dx, dy)
    if (d < R * 0.55 || d > RING + 34) return null
    return norm180((Math.atan2(dy, dx) * 180) / Math.PI)
  }

  const onDown = (e: PointerEvent) => {
    e.preventDefault()
    const p = toLogical(e)
    if (inBox(p, BTN_RUN)) return run()
    if (inBox(p, BTN_CLEAR)) return clearAll()
    const lon = lonAt(p)
    if (lon !== null) toggleAt(lon)
    else if (phase === 'intro') begin()
  }
  const onMove = (e: PointerEvent) => {
    hoverLon = lonAt(toLogical(e))
  }
  const onLeave = () => {
    hoverLon = null
  }
  stage.canvas.addEventListener('pointerdown', onDown)
  stage.canvas.addEventListener('pointermove', onMove)
  stage.canvas.addEventListener('pointerleave', onLeave)

  const offPress = input.onPress((code) => {
    if (code === 'ArrowLeft') cursor = norm180(cursor + 15)
    else if (code === 'ArrowRight') cursor = norm180(cursor - 15)
    else if (code === 'Space') toggleAt(cursor)
    else if (code === 'Enter') run()
    else if (code === 'Backspace' || code === 'KeyC') clearAll()
  })

  stage.setHint('Tap the ring to place or remove a dish · Enter runs a day · arrows + Space work too')

  // --- Loop --------------------------------------------------------------------
  function update(dt: number) {
    if (phase !== 'running') return
    runMs += dt
    rotation = Math.min(360, (runMs / DAY_MS) * 360)
    if (runMs >= DAY_MS) finishRun()
  }

  const pt = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180
    return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) }
  }

  function arc(fromDeg: number, toDeg: number, r: number) {
    // Canvas angles grow clockwise; ours grow counter-clockwise.
    c.beginPath()
    c.arc(CX, CY, r, (-toDeg * Math.PI) / 180, (-fromDeg * Math.PI) / 180)
  }

  function render() {
    c.fillStyle = '#05060a'
    c.fillRect(0, 0, W, H)

    // Stars
    c.fillStyle = 'rgba(236,230,216,0.5)'
    for (let i = 0; i < 60; i++) c.fillRect((i * 97) % W, (i * 53) % 400, 1.5, 1.5)

    const lons = currentLons()
    const live = phase === 'running'
    const rot = live ? rotation : 0

    // Sky slice each dish sees (fixed to the dish, turns with the Earth).
    for (const lon of lons) {
      const a = lon + rot
      c.strokeStyle = 'rgba(117,203,209,0.35)'
      c.lineWidth = 14
      arc(a - HALF_VIEW, a + HALF_VIEW, RING)
      c.stroke()
    }
    // The probe direction on the ring: the link exists when it is covered.
    c.strokeStyle = 'rgba(236,230,216,0.18)'
    c.lineWidth = 1
    c.beginPath()
    c.arc(CX, CY, RING, 0, Math.PI * 2)
    c.stroke()

    // Earth
    const g = c.createRadialGradient(CX - 30, CY - 30, 10, CX, CY, R)
    g.addColorStop(0, '#3d7bd1')
    g.addColorStop(1, '#123a73')
    c.fillStyle = g
    c.beginPath()
    c.arc(CX, CY, R, 0, Math.PI * 2)
    c.fill()
    // Longitude ticks every 30 deg turn with the planet.
    c.strokeStyle = 'rgba(255,255,255,0.14)'
    c.lineWidth = 1
    for (let l = -180; l < 180; l += 30) {
      const p = pt(l + rot, R)
      c.beginPath()
      c.moveTo(CX, CY)
      c.lineTo(p.x, p.y)
      c.stroke()
    }
    c.fillStyle = '#e9f1ff'
    c.font = '700 12px Nunito, system-ui, sans-serif'
    c.textAlign = 'center'
    c.fillText('North Pole', CX, CY + 4)

    // Real sites (level 3)
    if (sites) {
      for (const s of sites) {
        const p = pt(s.lon + rot, R)
        const on = picked.includes(s.id)
        c.fillStyle = on ? '#f3b54a' : 'rgba(236,230,216,0.75)'
        c.beginPath()
        c.arc(p.x, p.y, on ? 7 : 5, 0, Math.PI * 2)
        c.fill()
        if (!live) {
          const lp = pt(s.lon, R + 22)
          c.fillStyle = on ? '#f3b54a' : 'rgba(236,230,216,0.8)'
          c.font = '600 11px Nunito, system-ui, sans-serif'
          c.textAlign = lp.x < CX - 10 ? 'right' : lp.x > CX + 10 ? 'left' : 'center'
          c.fillText(s.name.split(',')[0], lp.x, lp.y + 4)
        }
      }
    }

    // Dishes and link lines
    const seeing = new Set(inView(lons, rot))
    for (const lon of lons) {
      const p = pt(lon + rot, R)
      if (live && seeing.has(lon)) {
        c.strokeStyle = '#7fd6a3'
        c.lineWidth = 2
        c.setLineDash([6, 5])
        c.beginPath()
        c.moveTo(p.x, p.y)
        c.lineTo(PROBE.x, PROBE.y)
        c.stroke()
        c.setLineDash([])
      }
      c.fillStyle = '#f3b54a'
      c.strokeStyle = '#120c04'
      c.lineWidth = 2
      c.beginPath()
      c.arc(p.x, p.y, 9, 0, Math.PI * 2)
      c.fill()
      c.stroke()
    }

    // Hover / keyboard cursor
    if (phase === 'placing') {
      const show = hoverLon ?? cursor
      const lon = sites ? show : snapLon(show)
      const p = pt(lon, R)
      c.strokeStyle = 'rgba(243,181,74,0.8)'
      c.lineWidth = 2
      c.beginPath()
      c.arc(p.x, p.y, 13, 0, Math.PI * 2)
      c.stroke()
    }

    // Probe
    const linked = live ? seeing.size > 0 : false
    c.fillStyle = live ? (linked ? '#7fd6a3' : '#ff6b5a') : '#ece6d8'
    c.fillRect(PROBE.x - 8, PROBE.y - 6, 16, 12)
    c.fillRect(PROBE.x - 20, PROBE.y - 2, 40, 4)
    c.font = '700 12px Nunito, system-ui, sans-serif'
    c.textAlign = 'center'
    c.fillText(live ? (linked ? 'LINK' : 'NO SIGNAL') : 'Probe', PROBE.x, PROBE.y + 26)

    // Clock
    if (live) {
      const minutes = Math.round(rot * MIN_PER_DEG)
      c.fillStyle = '#ece6d8'
      c.font = '800 16px Nunito, system-ui, sans-serif'
      c.textAlign = 'left'
      c.fillText('Hour ' + String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0'), 24, 34)
    }

    // Timeline of the day
    c.fillStyle = 'rgba(236,230,216,0.8)'
    c.font = '700 12px Nunito, system-ui, sans-serif'
    c.textAlign = 'left'
    c.fillText('One day of contact (24 h)', TL.x, TL.y - 8)
    c.fillStyle = '#141925'
    c.fillRect(TL.x, TL.y, TL.w, TL.h)
    const tl = live ? contactTimeline(lons) : lastTimeline
    const upto = live ? Math.floor(rotation) : tl ? 360 : 0
    if (tl) {
      for (let d = 0; d < upto; d++) {
        c.fillStyle = tl[d] ? '#7fd6a3' : '#ff6b5a'
        c.fillRect(TL.x + (d / 360) * TL.w, TL.y, TL.w / 360 + 0.6, TL.h)
      }
    }
    c.strokeStyle = '#2a3142'
    c.strokeRect(TL.x, TL.y, TL.w, TL.h)

    // Buttons
    const btn = (b: typeof BTN_RUN, label: string, primary: boolean, enabled: boolean) => {
      c.globalAlpha = enabled ? 1 : 0.45
      c.fillStyle = primary ? '#f3b54a' : '#141925'
      c.fillRect(b.x, b.y, b.w, b.h)
      c.strokeStyle = primary ? '#f3b54a' : '#2a3142'
      c.strokeRect(b.x, b.y, b.w, b.h)
      c.fillStyle = primary ? '#120c04' : '#ece6d8'
      c.font = '800 16px Nunito, system-ui, sans-serif'
      c.textAlign = 'center'
      c.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 6)
      c.globalAlpha = 1
    }
    btn(BTN_CLEAR, 'Clear dishes', false, phase === 'placing' && lons.length > 0)
    btn(BTN_RUN, 'Run a day ▶', true, phase === 'placing' && lons.length > 0)
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  stats()
  stage.showOverlay({
    title: (card?.title ?? 'Keep the Link') + ' · ' + spec.name,
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
      stage.canvas.removeEventListener('pointermove', onMove)
      stage.canvas.removeEventListener('pointerleave', onLeave)
      input.destroy()
      sfx.destroy()
      stage.destroy()
      return Promise.resolve()
    },
  }
}

function fmtMin(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? h + ' h ' + String(m).padStart(2, '0') + ' min' : m + ' min'
}

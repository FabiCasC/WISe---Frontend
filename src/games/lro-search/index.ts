import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { COLORS, drawButton, inBox, roundRect, text, toLogical, type Box } from '../shared/canvasui'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import {
  IMG,
  LEVELS,
  brightnessContrast,
  conceptFor,
  goodLight,
  makeScene,
  scoreSearch,
  shadowLength,
  tap,
  trailVisibility,
  type Pass,
  type TargetId,
  type Thing,
} from './rules'

const W = 640
const H = 560
const PPM = IMG.ppm
const VIEW_H = IMG.h * PPM // 420
const NAMES: Record<TargetId, string> = {
  lm: 'Lunar module',
  alsep: 'ALSEP',
  surveyor: 'Surveyor 3',
  tracks: 'Astronaut tracks',
}

/**
 * SEEN FROM ORBIT
 * -------------------------------------------------------------------------
 * Search a Lunar Reconnaissance Orbiter picture for hardware left on the
 * Moon. The player orders the orbit pass (the Sun angle) and discovers that
 * low Sun = long shadows that reveal tall things, high Sun = brightness
 * differences such as footpaths, and that a changed shadow is not a new
 * object (level 3, blink comparison with a 1967 photo).
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('lro-search')
  const levelKey = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as 1 | 2 | 3
  const spec = LEVELS[levelKey]
  const scene = makeScene(levelKey)
  const concept = conceptFor(levelKey)
  const practice = ctx.settings.practice
  const sfx = createSfx(ctx.settings.volume)

  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#c6a8ff' })
  const input = createInput(stage.root)
  const c = stage.ctx
  const startedAt = performance.now()

  type Phase = 'intro' | 'choose' | 'search' | 'done'
  let phase: Phase = 'intro'
  let pass: Pass | null = null
  let passesUsed = 0
  let usedPasses: number[] = []
  let mistakesThisPass = 0
  let mistakes = 0
  let found: TargetId[] = []
  let marks: { x: number; y: number; ok: boolean; label?: string }[] = []
  let showBefore = false
  let cursor = { x: W / 2, y: VIEW_H / 2 }
  let tries = 0
  let settled = false
  const decisions: { concept: string; correct: boolean }[] = []

  // Off-screen images, drawn once per pass (the scene does not move).
  const imgAfter = document.createElement('canvas')
  const imgBefore = document.createElement('canvas')
  for (const cv of [imgAfter, imgBefore]) {
    cv.width = W
    cv.height = VIEW_H
  }

  const passButtons: { i: number; box: Box }[] = spec.passes.map((_, i, all) => {
    const gap = 10
    const w = (W - 24 - gap * (all.length - 1)) / all.length
    return { i, box: { x: 12 + i * (w + gap), y: VIEW_H + 66, w, h: 58 } }
  })
  const BLINK: Box = { x: 12, y: VIEW_H + 66, w: W - 24, h: 58 }

  function begin() {
    pass = null
    passesUsed = 0
    usedPasses = []
    mistakes = 0
    mistakesThisPass = 0
    found = []
    marks = []
    tries++
    stage.hideOverlay()
    phase = 'choose'
    if (spec.mode === 'compare') choosePass(0)
    stats()
  }

  function choosePass(i: number) {
    if (phase !== 'choose') return
    if (usedPasses.includes(i)) return stage.flash('You already used that pass', 'bad')
    if (!practice && passesUsed >= spec.maxPasses) return
    pass = spec.passes[i]
    usedPasses.push(i)
    passesUsed++
    mistakesThisPass = 0
    marks = []
    paint(imgAfter, pass.sun, false)
    if (spec.beforeSun !== null) paint(imgBefore, spec.beforeSun, true)
    phase = 'search'
    sfx.sweep(300, 700, 260, 'sine', 0.1)
    stats()
  }

  function tapAt(px: number, py: number) {
    if (phase === 'intro') return begin()
    if (phase !== 'search' || !pass || py > VIEW_H) return
    if (showBefore) return stage.flash('Let go of the 1967 photo to tap the new picture', 'bad')
    const p = { x: px / PPM, y: py / PPM }
    const r = tap(levelKey, scene, p, pass.sun, found)
    if (r.kind === 'target') {
      found = [...found, r.id]
      marks.push({ x: px, y: py, ok: true, label: NAMES[r.id] })
      sfx.tone(880, 90, 'sine', 0.16)
      sfx.tone(1320, 140, 'sine', 0.12)
      if (!practice) decisions.push({ concept, correct: spec.mode === 'compare' ? true : goodLight(levelKey, pass.sun) })
      stage.flash('Found: ' + NAMES[r.id] + '!')
      stats()
      if (spec.targets.every((t) => found.includes(t))) return end(true)
      return stats()
    }
    marks.push({ x: px, y: py, ok: false })
    sfx.tone(220, 140, 'square', 0.08)
    if (r.kind === 'lighting') {
      if (!practice) decisions.push({ concept, correct: false })
      stage.flash('Only the shadow changed: that rock was there in 1967', 'bad')
    } else stage.flash(spec.mode === 'compare' ? 'Nothing new there' : 'Not there', 'bad')
    if (practice) return stats()
    mistakes++
    mistakesThisPass++
    if (spec.mode === 'compare') {
      if (mistakes >= spec.maxMistakes) return end(false)
    } else if (mistakesThisPass >= spec.maxMistakes) {
      if (passesUsed >= spec.maxPasses) return end(false)
      phase = 'choose'
      stage.flash('The orbiter moved on. Order another pass.', 'bad')
    }
    stats()
  }

  function end(won: boolean) {
    phase = 'done'
    if (!won && !practice && spec.mode === 'search') decisions.push({ concept, correct: false })
    const score = practice || !won ? 0 : scoreSearch(mistakes, passesUsed)
    if (won) sfx.sweep(520, 980, 360, 'triangle', 0.2)
    else sfx.sweep(320, 110, 400, 'sawtooth', 0.16)
    const lesson =
      levelKey === 1
        ? 'With the Sun low, a 3 m tall descent stage throws a shadow over 14 m long, far longer than any boulder. That is how orbiters spot landers.'
        : levelKey === 2
          ? 'With the Sun high, shadows shrink and brightness differences stand out, like the dark footpath the Apollo 14 astronauts wore between their lander and the ALSEP.'
          : 'LRO’s picture of Apollo 12 shows the lunar module, Surveyor 3 and the astronauts’ tracks, none of them in the 1967 photo. Changed shadows only mean the Sun was in a different place.'
    const usedLight = pass ? pass.sun : 0
    if (won) {
      stage.showOverlay({
        title: 'Found from orbit!',
        tone: 'win',
        score:
          (spec.mode === 'search' ? 'Sun ' + usedLight + '° · ' : '') +
          mistakes + (mistakes === 1 ? ' wrong tap' : ' wrong taps') + (practice ? '' : ' · ' + score + ' points'),
        text: lesson + ' The hardware is still there, more than 50 years later.',
        fact: card?.fact,
        buttons: [{ label: 'Save and continue', onClick: () => complete(true, score) }],
      })
    } else {
      stage.showOverlay({
        title: spec.mode === 'compare' ? 'Too many wrong taps' : 'Out of passes',
        tone: 'lose',
        score: 'Found ' + found.length + ' of ' + spec.targets.length,
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
      gameId: 'lro-search',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: won,
      evidenceIds: won ? (card?.evidence.map((e) => e.id) ?? []) : [],
      firstAnswerCorrect: won && tries === 1 && mistakes === 0,
      decisions: practice ? [] : decisions,
    })
  }

  // --- Input -------------------------------------------------------------------
  let blinkPointer: number | null = null
  const onDown = (e: PointerEvent) => {
    e.preventDefault()
    if (phase === 'intro') return begin()
    const p = toLogical(stage.canvas, e, W, H)
    if (spec.mode === 'compare' && inBox(p, BLINK) && phase === 'search') {
      blinkPointer = e.pointerId
      showBefore = true
      return
    }
    if (phase === 'choose') {
      for (const b of passButtons) if (inBox(p, b.box)) return choosePass(b.i)
      return
    }
    if (p.y <= VIEW_H) {
      cursor = { x: p.x, y: p.y }
      tapAt(p.x, p.y)
    }
  }
  const onUp = (e: PointerEvent) => {
    if (blinkPointer === e.pointerId) {
      blinkPointer = null
      showBefore = false
    }
  }
  stage.canvas.addEventListener('pointerdown', onDown)
  stage.canvas.addEventListener('pointerup', onUp)
  stage.canvas.addEventListener('pointercancel', onUp)
  stage.canvas.addEventListener('pointerleave', onUp)

  const offPress = input.onPress((code) => {
    if (phase === 'intro' && (code === 'Space' || code === 'Enter')) return begin()
    if (phase === 'choose') {
      const m = /^Digit([1-9])$/.exec(code)
      if (m && Number(m[1]) <= spec.passes.length) choosePass(Number(m[1]) - 1)
      return
    }
    if (phase !== 'search') return
    const step = 10
    if (code === 'ArrowLeft') cursor.x = Math.max(0, cursor.x - step)
    if (code === 'ArrowRight') cursor.x = Math.min(W, cursor.x + step)
    if (code === 'ArrowUp') cursor.y = Math.max(0, cursor.y - step)
    if (code === 'ArrowDown') cursor.y = Math.min(VIEW_H, cursor.y + step)
    if (code === 'Space' || code === 'Enter') tapAt(cursor.x, cursor.y)
  })

  stage.setHint(
    spec.mode === 'compare'
      ? 'Hold B or the button to see the 1967 photo · tap (or arrows + Space) what is new'
      : 'Pick a pass (1 or 2) · tap the picture, or move the cross with the arrows and press Space'
  )

  // --- Painting the orbital picture ------------------------------------------------
  function paint(cv: HTMLCanvasElement, sun: number, before: boolean) {
    const g = cv.getContext('2d')
    if (!g) return
    const contrast = brightnessContrast(sun)
    // Ground: darker and grainier with a low Sun.
    const base = Math.round(70 + contrast * 70)
    g.fillStyle = before ? `rgb(${base - 6},${base - 8},${base - 14})` : `rgb(${base},${base},${base + 2})`
    g.fillRect(0, 0, W, VIEW_H)
    // Fine texture (fixed)
    for (let i = 0; i < 2200; i++) {
      const x = (i * 7919) % W
      const y = (i * 6271) % VIEW_H
      const v = ((i * 31) % 40) - 20
      g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 300 + (before ? 0.05 : 0)})`
      g.fillRect(x, y, 2, 2)
    }
    // Brighter ground blasted by the landing rocket (after only)
    if (!before && scene.blast) {
      const b = scene.blast
      const rg = g.createRadialGradient(b.x * PPM, b.y * PPM, 2, b.x * PPM, b.y * PPM, b.r * PPM)
      rg.addColorStop(0, `rgba(255,255,255,${0.32 * contrast})`)
      rg.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = rg
      g.fillRect(0, 0, W, VIEW_H)
    }
    // Craters: shadowed inner wall on the Sun side (left), bright wall right.
    for (const cr of scene.craters) {
      const x = cr.x * PPM
      const y = cr.y * PPM
      const r = cr.r * PPM
      g.fillStyle = 'rgba(0,0,0,0.12)'
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fill()
      // Fraction of the bowl in shadow: almost all of the sunward half at a low Sun.
      const f = Math.min(1, 0.25 / Math.tan((sun * Math.PI) / 180))
      g.fillStyle = 'rgba(0,0,0,0.75)'
      g.beginPath()
      g.arc(x, y, r, Math.PI / 2, (3 * Math.PI) / 2)
      g.ellipse(x, y, Math.max(0.5, r * (1 - f)), r, 0, (3 * Math.PI) / 2, Math.PI / 2, true)
      g.fill()
      g.strokeStyle = `rgba(255,255,255,${0.15 + (1 - contrast) * 0.35})`
      g.lineWidth = 2
      g.beginPath()
      g.arc(x, y, r, -Math.PI / 2, Math.PI / 2)
      g.stroke()
    }
    // Footpaths / tracks (darker soil), visible mostly with a high Sun.
    if (!before) {
      for (const path of scene.paths) {
        g.strokeStyle = `rgba(20,20,24,${0.65 * trailVisibility(sun)})`
        g.lineWidth = 3
        g.beginPath()
        path.points.forEach((p, i) => (i ? g.lineTo(p.x * PPM, p.y * PPM) : g.moveTo(p.x * PPM, p.y * PPM)))
        g.stroke()
      }
    }
    // Shadows first, then the objects.
    const visible = (t: Thing) => !before || t.kind === 'boulder'
    for (const t of scene.things) {
      if (!visible(t)) continue
      const len = shadowLength(t.height, sun) * PPM
      g.fillStyle = 'rgba(0,0,0,0.85)'
      const w = t.size * PPM
      if (t.kind === 'lm') {
        // The lander's shadow: the stage and its legs.
        g.fillRect(t.x * PPM, t.y * PPM - w * 0.35, len, w * 0.7)
        g.beginPath()
        g.moveTo(t.x * PPM + len, t.y * PPM - w * 0.6)
        g.lineTo(t.x * PPM + len + 4, t.y * PPM)
        g.lineTo(t.x * PPM + len, t.y * PPM + w * 0.6)
        g.closePath()
        g.fill()
      } else {
        g.beginPath()
        g.ellipse(t.x * PPM + len / 2, t.y * PPM, len / 2 + w / 3, w / 2.4, 0, 0, Math.PI * 2)
        g.fill()
      }
    }
    for (const t of scene.things) {
      if (!visible(t)) continue
      const w = t.size * PPM
      const lum = Math.round(255 * t.albedo * (0.55 + 0.45 * contrast))
      g.fillStyle = `rgb(${lum},${lum},${lum})`
      if (t.kind === 'lm') {
        g.fillRect(t.x * PPM - w / 2, t.y * PPM - w / 2, w, w)
      } else if (t.kind === 'alsep') {
        for (const [dx, dy] of [[0, 0], [3, 2], [-2, 3]]) g.fillRect(t.x * PPM + dx - 1.5, t.y * PPM + dy - 1.5, 3, 3)
      } else if (t.kind === 'surveyor') {
        g.beginPath()
        g.moveTo(t.x * PPM, t.y * PPM - w / 2)
        g.lineTo(t.x * PPM + w / 2, t.y * PPM + w / 2)
        g.lineTo(t.x * PPM - w / 2, t.y * PPM + w / 2)
        g.closePath()
        g.fill()
      } else {
        // Boulders are blocky too, so from straight above the lander does not stand out.
        const k = (t.x * 13.7 + t.y * 7.3) % 1
        g.save()
        g.translate(t.x * PPM, t.y * PPM)
        g.rotate(k * Math.PI)
        g.beginPath()
        const sides = 4 + Math.floor(k * 3)
        for (let j = 0; j < sides; j++) {
          const a = (j / sides) * Math.PI * 2
          const rr = (w / 2) * (0.85 + 0.15 * Math.sin(j * 2.3 + k * 9))
          if (j) g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
          else g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
        }
        g.closePath()
        g.fill()
        g.restore()
      }
    }
  }

  // --- Drawing ---------------------------------------------------------------------
  function stats() {
    stage.setStats([
      { key: 'found', label: 'Found', value: found.length + ' / ' + spec.targets.length },
      { key: 'sun', label: 'Sun height', value: pass ? (showBefore && spec.beforeSun !== null ? spec.beforeSun : pass.sun) + '°' : '-' },
      {
        key: 'passes',
        label: spec.mode === 'compare' ? 'Wrong taps' : 'Passes',
        value: spec.mode === 'compare' ? mistakes + ' / ' + spec.maxMistakes : passesUsed + ' / ' + spec.maxPasses,
      },
      { key: 'goal', label: 'Looking for', value: spec.targets.filter((t) => !found.includes(t)).map((t) => NAMES[t]).join(', ') || 'done' },
    ])
  }

  function render() {
    c.fillStyle = COLORS.space
    c.fillRect(0, 0, W, H)
    if ((phase === 'search' || phase === 'done') && pass) {
      c.drawImage(showBefore ? imgBefore : imgAfter, 0, 0)
      // Sun direction and scale bar
      c.fillStyle = 'rgba(5,6,10,0.75)'
      roundRect(c, 8, 8, showBefore ? 200 : 168, 26, 6)
      c.fill()
      text(c, (showBefore ? '1967 photo · ' : 'LRO · ') + '☀ ← Sun ' + (showBefore ? spec.beforeSun : pass.sun) + '° high', 16, 26, {
        size: 12,
        weight: 800,
        color: showBefore ? '#ffd9a0' : COLORS.star,
      })
      c.fillStyle = COLORS.star
      c.fillRect(16, VIEW_H - 16, 20 * PPM, 3)
      text(c, '20 m', 16 + 20 * PPM + 6, VIEW_H - 11, { size: 11, weight: 800 })
      if (!showBefore) {
        for (const m of marks) {
          if (m.ok) {
            c.strokeStyle = COLORS.ok
            c.lineWidth = 3
            c.beginPath()
            c.arc(m.x, m.y, 16, 0, Math.PI * 2)
            c.stroke()
            text(c, m.label ?? '', m.x, m.y - 22, { size: 12, weight: 800, color: COLORS.ok, align: 'center' })
          } else {
            c.strokeStyle = '#ff9aa8'
            c.lineWidth = 2
            c.beginPath()
            c.moveTo(m.x - 6, m.y - 6)
            c.lineTo(m.x + 6, m.y + 6)
            c.moveTo(m.x + 6, m.y - 6)
            c.lineTo(m.x - 6, m.y + 6)
            c.stroke()
          }
        }
        if (phase === 'search') {
          c.strokeStyle = 'rgba(243,181,74,0.85)'
          c.lineWidth = 1.5
          c.beginPath()
          c.moveTo(cursor.x - 10, cursor.y)
          c.lineTo(cursor.x + 10, cursor.y)
          c.moveTo(cursor.x, cursor.y - 10)
          c.lineTo(cursor.x, cursor.y + 10)
          c.stroke()
        }
      }
    } else {
      // No picture yet: the orbiter and the two passes.
      c.fillStyle = '#0d1017'
      c.fillRect(0, 0, W, VIEW_H)
      c.fillStyle = '#6f7b93'
      c.beginPath()
      c.arc(W / 2, VIEW_H + 120, 300, Math.PI, 0)
      c.fill()
      c.strokeStyle = 'rgba(236,230,216,0.3)'
      c.setLineDash([6, 6])
      c.beginPath()
      c.arc(W / 2, VIEW_H + 120, 360, Math.PI * 1.05, Math.PI * 1.95)
      c.stroke()
      c.setLineDash([])
      c.fillStyle = COLORS.gold
      c.fillRect(W / 2 - 10, VIEW_H + 120 - 366, 20, 12)
      c.fillStyle = '#35507a'
      c.fillRect(W / 2 - 30, VIEW_H + 120 - 364, 18, 8)
      text(c, 'LRO', W / 2, VIEW_H + 120 - 374, { size: 12, weight: 800, align: 'center' })
      text(c, phase === 'choose' ? 'Order an orbit pass: when should LRO take the picture?' : '', W / 2, 60, {
        size: 16,
        weight: 800,
        align: 'center',
      })
      text(c, 'Morning or evening: Sun low, long shadows · Noon: Sun high, short shadows', W / 2, 86, { size: 12, color: COLORS.dim, align: 'center' })
    }

    // Bottom panel
    c.fillStyle = COLORS.panel
    c.fillRect(0, VIEW_H, W, H - VIEW_H)
    text(c, spec.goal, W / 2, VIEW_H + 26, { size: 14, weight: 800, color: COLORS.gold, align: 'center' })
    if (spec.mode === 'compare') {
      drawButton(c, BLINK, showBefore ? 'Showing the 1967 photo…' : 'Hold to see the 1967 photo', {
        active: showBefore,
        enabled: phase === 'search',
        size: 17,
      })
    } else {
      for (const b of passButtons) {
        const used = usedPasses.includes(b.i)
        const current = pass === spec.passes[b.i] && phase === 'search'
        drawButton(c, b.box, (b.i + 1) + ' · ' + spec.passes[b.i].label + (used && !current ? ' (used)' : ''), {
          primary: phase === 'choose' && !used,
          active: current,
          enabled: phase === 'choose' ? !used : current,
          size: 15,
        })
      }
      if (phase === 'search') text(c, 'Wrong taps this pass: ' + mistakesThisPass + ' / ' + spec.maxMistakes, W / 2, VIEW_H + 50, { size: 11, color: COLORS.dim, align: 'center' })
    }
  }

  // Keyboard blink for level 3 (hold B).
  const loop = createLoop(() => {
    if (spec.mode === 'compare' && phase === 'search') {
      const held = input.held.has('KeyB') || blinkPointer !== null
      if (held !== showBefore) {
        showBefore = held
        stats()
      }
    }
    render()
  })

  stats()
  stage.showOverlay({
    title: (card?.title ?? 'Seen from Orbit') + ' · ' + spec.name,
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
      stage.canvas.removeEventListener('pointerup', onUp)
      stage.canvas.removeEventListener('pointercancel', onUp)
      stage.canvas.removeEventListener('pointerleave', onUp)
      input.destroy()
      sfx.destroy()
      stage.destroy()
      container.replaceChildren()
      return Promise.resolve()
    },
  }
}

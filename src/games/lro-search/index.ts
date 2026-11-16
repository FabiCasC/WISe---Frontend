import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { FONT, inBox, roundRect, toLogical, type Box } from '../shared/canvasui'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import {
  IMG,
  LEVELS,
  brightnessContrast,
  conceptFor,
  goodLight,
  identify,
  makeScene,
  scoreSearch,
  shadowLength,
  tap,
  trailVisibility,
  type Lvl,
  type Pass,
  type Seen,
  type TargetId,
  type Thing,
} from './rules'

const W = 640
const H = 560
const PPM = IMG.ppm
const VIEW_H = IMG.h * PPM // 420

/** Friendly colours for the whole game. */
const PAL = {
  skyTop: '#150d44',
  skyMid: '#3b1c7a',
  skyLow: '#a8438f',
  ink: '#2a0f5e',
  white: '#ffffff',
  sun: '#ffd84d',
  gold: '#ffc94a',
  orange: '#ff9a3d',
  pink: '#ff7eb3',
  mint: '#7dffb2',
  cyan: '#6fe3ff',
  lilac: '#c6a8ff',
  bad: '#ff8aa8',
}
const STAR_COLORS = ['#fff6c9', '#9ff3ff', '#ffb8e6']
const CONFETTI = [PAL.sun, PAL.pink, PAL.mint, PAL.cyan, PAL.lilac]

const EMOJI: Record<Seen, string> = {
  lm: '🚀',
  alsep: '🔬',
  surveyor: '🤖',
  tracks: '👣',
  boulder: '🪨',
  crater: '🌑',
  ground: '✨',
}

interface Mark {
  x: number
  y: number
  kind: Seen
  at: number
}
interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
}

/**
 * SEEN FROM ORBIT
 * -------------------------------------------------------------------------
 * Search a Lunar Reconnaissance Orbiter picture for hardware left on the
 * Moon. The player orders the orbit pass (the Sun angle) and discovers that
 * low Sun = long shadows that reveal tall things, high Sun = brightness
 * differences such as footpaths, and that a changed shadow is not a new
 * object (level 3, blink comparison with a 1967 photo).
 *
 * Made for 9-year-olds: colourful, little text, and every object you tap
 * tells you its name. Level 0 (the guided practice round, which the app runs
 * as level 1 + practice mode) uses an easy scene and never ends in a loss.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('lro-search')
  const practice = ctx.settings.practice
  const requested = ctx.levelId >= 0 && ctx.levelId <= 3 ? ctx.levelId : 1
  // Level 0 = the practice round of the tutorial (it runs level 1 in practice mode).
  const levelKey: Lvl = requested === 0 || (practice && requested === 1) ? 0 : (requested as Lvl)
  const tutorial = levelKey === 0
  const spec = LEVELS[levelKey]
  const scene = makeScene(levelKey)
  const concept = conceptFor(levelKey)
  const reduced = ctx.settings.reducedMotion
  const sfx = createSfx(ctx.settings.volume)

  const es = ctx.settings.lang === 'es'
  const tr = (en: string, spanish: string) => (es ? spanish : en)

  const NAME: Record<Seen, string> = {
    lm: tr('Lunar module', 'Módulo lunar'),
    alsep: tr('Science station', 'Estación científica'),
    surveyor: tr('Robot Surveyor 3', 'Robot Surveyor 3'),
    tracks: tr('Astronaut footprints', 'Huellas de astronautas'),
    boulder: tr('Moon rock', 'Roca lunar'),
    crater: tr('Crater', 'Cráter'),
    ground: tr('Moon dust', 'Polvo lunar'),
  }

  const TEXT = {
    title: [
      tr('Learn to look', 'Aprende a mirar'),
      tr('Long shadows', 'Sombras largas'),
      tr('Footprints', 'Huellas'),
      tr('Before and after', 'Antes y después'),
    ][levelKey],
    intro: [
      tr('Meet LRO, a space camera! Pick a time for the photo, then tap the lunar module.', '¡Te presento a LRO, una cámara espacial! Elige la hora de la foto y toca el módulo lunar.'),
      tr('Hide and seek on the Moon! Find the lunar module. Tall things make long shadows.', '¡Escondite en la Luna! Encuentra el módulo lunar. Lo alto hace sombras largas.'),
      tr('The astronauts left a dark trail. Follow it to the science station!', 'Los astronautas dejaron un caminito oscuro. ¡Síguelo hasta la estación científica!'),
      tr('Hold the button to see the old 1967 photo. Tap only what is NEW!', 'Mantén el botón para ver la foto vieja de 1967. ¡Toca solo lo NUEVO!'),
    ][levelKey],
    goal: [
      tr('Find the lunar module', 'Encuentra el módulo lunar'),
      tr('Find the lunar module', 'Encuentra el módulo lunar'),
      tr('Follow the trail to the science station', 'Sigue el caminito hasta la estación'),
      tr('Tap the 3 new things', 'Toca las 3 cosas nuevas'),
    ][levelKey],
    lesson: [
      tr('Low Sun = long shadows. Tall things like landers pop out!', 'Sol bajo = sombras largas. ¡Lo alto, como un módulo, resalta!'),
      tr('The lander is 3 m tall. With a low Sun, its shadow is over 14 m long!', 'El módulo mide 3 m. Con sol bajo, ¡su sombra mide más de 14 m!'),
      tr('A high Sun makes tiny shadows, so dark footprints show up.', 'Con sol alto las sombras son pequeñas y se ven las huellas oscuras.'),
      tr('The Sun moved, so shadows changed. Only new things count!', 'El Sol se movió y las sombras cambiaron. ¡Solo cuentan las cosas nuevas!'),
    ][levelKey],
    fact: tr('More than 50 years later, LRO can still see the Apollo hardware!', 'Más de 50 años después, ¡LRO todavía ve el equipo del Apollo!'),
  }

  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#c6a8ff' })
  const input = createInput(stage.root)
  const c = stage.ctx
  const startedAt = performance.now()
  const timers = new Set<number>()
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
  }

  type Phase = 'intro' | 'choose' | 'search' | 'done'
  let phase: Phase = 'intro'
  let pass: Pass | null = null
  let passIdx = -1
  let usedPasses: number[] = []
  let missesByPass: number[] = spec.passes.map(() => 0)
  let mistakes = 0
  let tutorialMisses = 0
  let found: TargetId[] = []
  let marks: Mark[] = []
  let foundMarks: Mark[] = []
  let sparks: Spark[] = []
  let showBefore = false
  let showCursor = false
  let cursor = { x: W / 2, y: VIEW_H / 2 }
  let tries = 0
  let settled = false
  let coach: { text: string; until: number } | null = null
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

  const say = (textLine: string, ms = 2600) => {
    coach = { text: textLine, until: performance.now() + ms }
  }
  const sunWord = (deg: number) => (deg >= 50 ? tr('High Sun', 'Sol alto') : deg <= 30 ? tr('Low Sun', 'Sol bajo') : tr('Middle Sun', 'Sol medio'))
  const passName = (deg: number) => (deg >= 50 ? tr('Noon', 'Mediodía') : deg <= 30 ? tr('Morning', 'Mañana') : tr('Afternoon', 'Tarde'))

  function begin() {
    pass = null
    passIdx = -1
    usedPasses = []
    missesByPass = spec.passes.map(() => 0)
    mistakes = 0
    tutorialMisses = 0
    found = []
    marks = []
    foundMarks = []
    sparks = []
    coach = null
    tries++
    stage.hideOverlay()
    phase = 'choose'
    if (spec.mode === 'compare') choosePass(0)
    stats()
  }

  /** Switching photos is always allowed: comparing both is how you learn. */
  function choosePass(i: number) {
    if (phase !== 'choose' && phase !== 'search') return
    if (i === passIdx && phase === 'search') return
    if (!practice && missesByPass[i] >= spec.maxMistakes) return stage.flash(tr('No hearts left in that photo', 'Sin corazones en esa foto'), 'bad')
    passIdx = i
    pass = spec.passes[i]
    if (!usedPasses.includes(i)) usedPasses.push(i)
    marks = []
    paint(imgAfter, pass.sun, false)
    if (spec.beforeSun !== null) paint(imgBefore, spec.beforeSun, true)
    phase = 'search'
    coach = null
    sfx.sweep(300, 700, 260, 'sine', 0.1)
    stats()
  }

  function burst(x: number, y: number) {
    if (reduced) return
    for (let i = 0; i < 34; i++) {
      const a = Math.random() * Math.PI * 2
      const v = 1.5 + Math.random() * 3.5
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 2,
        life: 900 + Math.random() * 500,
        max: 1400,
        color: CONFETTI[i % CONFETTI.length],
        size: 3 + Math.random() * 4,
      })
    }
  }

  function tapAt(px: number, py: number) {
    if (phase === 'intro') return begin()
    if (phase !== 'search' || !pass || py > VIEW_H) return
    if (showBefore) return stage.flash(tr('Let go of the old photo first', 'Suelta la foto vieja primero'), 'bad')
    const now = performance.now()
    const p = { x: px / PPM, y: py / PPM }
    const r = tap(levelKey, scene, p, pass.sun, found)

    if (r.kind === 'target') {
      found = [...found, r.id]
      foundMarks.push({ x: px, y: py, kind: r.id, at: now })
      burst(px, py)
      sfx.tone(880, 90, 'sine', 0.16)
      sfx.tone(1320, 140, 'sine', 0.12)
      if (!practice) decisions.push({ concept, correct: spec.mode === 'compare' ? true : goodLight(levelKey, pass.sun) })
      stage.flash('⭐ ' + NAME[r.id])
      say(tr('You found the ' + NAME[r.id] + '!', '¡Encontraste: ' + NAME[r.id] + '!'), 3000)
      stats()
      if (spec.targets.every((t) => found.includes(t))) end(true)
      return
    }

    // Not the target: still tell the child what it is.
    const seen = identify(scene, p, pass.sun)
    marks.push({ x: px, y: py, kind: seen, at: now })
    stage.flash(EMOJI[seen] + ' ' + NAME[seen], 'bad')

    // Something already found: just its name, no penalty.
    if (seen !== 'ground' && seen !== 'boulder' && seen !== 'crater' && found.includes(seen as TargetId)) {
      sfx.tone(660, 70, 'sine', 0.08)
      return
    }
    sfx.tone(300, 110, 'triangle', 0.09)

    if (r.kind === 'lighting') {
      if (!practice) decisions.push({ concept, correct: false })
      say(tr('Only the shadow moved. It was there in 1967!', 'Solo se movió la sombra. ¡Ya estaba en 1967!'))
    } else if (seen === 'ground') {
      say(tr('Just Moon dust. Keep looking!', 'Solo polvo lunar. ¡Sigue buscando!'))
    } else {
      say(NAME[seen] + tr('. Not it, keep looking!', '. Ese no es, ¡sigue buscando!'))
    }

    if (practice) {
      tutorialMisses++
      return stats()
    }
    mistakes++
    missesByPass[passIdx]++
    if (spec.mode === 'compare') {
      if (mistakes >= spec.maxMistakes) return end(false)
    } else if (missesByPass[passIdx] >= spec.maxMistakes) {
      if (spec.passes.every((_, i) => missesByPass[i] >= spec.maxMistakes)) return end(false)
      phase = 'choose'
      say(tr('Out of hearts here. Try the other photo!', '¡Sin corazones! Prueba la otra foto.'), 3800)
    }
    stats()
  }

  function end(won: boolean) {
    phase = 'done'
    if (!won && !practice && spec.mode === 'search') decisions.push({ concept, correct: false })
    const score = practice || !won ? 0 : scoreSearch(mistakes, Math.max(1, usedPasses.length))
    if (won) sfx.sweep(520, 980, 360, 'triangle', 0.2)
    else sfx.sweep(320, 160, 400, 'triangle', 0.12)
    // Let the child enjoy the discovery before the card appears.
    later(() => showResult(won, score), won ? (reduced ? 500 : 1700) : 350)
  }

  function showResult(won: boolean, score: number) {
    const starCount = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
    const stars = '⭐'.repeat(starCount)
    if (won) {
      stage.showOverlay({
        title: tr('🌟 You found it!', '🌟 ¡Lo encontraste!'),
        tone: 'win',
        score: practice ? stars : stars + (score ? ' · ' + score + tr(' points', ' puntos') : ''),
        text: TEXT.lesson,
        fact: TEXT.fact,
        buttons: [
          {
            label: tutorial ? tr('Let’s play! 🚀', '¡A jugar! 🚀') : tr('Continue', 'Continuar'),
            onClick: () => complete(true, score),
          },
        ],
      })
    } else {
      stage.showOverlay({
        title: tr('🛰️ Not this time!', '🛰️ ¡Esta vez no!'),
        tone: 'lose',
        score: tr('Found ', 'Encontraste ') + found.length + ' / ' + spec.targets.length,
        text: TEXT.lesson,
        buttons: [
          { label: tr('Try again', 'Intentar otra vez'), onClick: begin },
          { label: tr('Back to the arcade', 'Volver al arcade'), variant: 'quiet', onClick: () => complete(false, 0) },
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
    if (spec.mode === 'search' && (phase === 'choose' || phase === 'search')) {
      for (const b of passButtons) if (inBox(p, b.box)) return choosePass(b.i)
    }
    if (p.y <= VIEW_H) {
      cursor = { x: p.x, y: p.y }
      showCursor = true
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
    if (spec.mode === 'search' && (phase === 'choose' || phase === 'search')) {
      const m = /^Digit([1-9])$/.exec(code)
      if (m && Number(m[1]) <= spec.passes.length) return choosePass(Number(m[1]) - 1)
    }
    if (phase !== 'search') return
    const step = 10
    if (code.startsWith('Arrow')) showCursor = true
    if (code === 'ArrowLeft') cursor.x = Math.max(0, cursor.x - step)
    if (code === 'ArrowRight') cursor.x = Math.min(W, cursor.x + step)
    if (code === 'ArrowUp') cursor.y = Math.max(0, cursor.y - step)
    if (code === 'ArrowDown') cursor.y = Math.min(VIEW_H, cursor.y + step)
    if (code === 'Space' || code === 'Enter') tapAt(cursor.x, cursor.y)
  })

  stage.setHint(
    spec.mode === 'compare'
      ? tr('Hold B or the button to see the 1967 photo · tap what is new', 'Mantén B o el botón para ver la foto de 1967 · toca lo nuevo')
      : tr('Pick a photo (1 or 2) · tap the picture, or use the arrows and Space', 'Elige una foto (1 o 2) · toca la imagen, o usa las flechas y Espacio'),
  )

  // --- Painting the orbital picture ------------------------------------------------
  function paint(cv: HTMLCanvasElement, sun: number, before: boolean) {
    const g = cv.getContext('2d')
    if (!g) return
    const contrast = brightnessContrast(sun)
    // Ground: a lilac Moon (the 1967 photo is an old, warm sepia print).
    const base = Math.round(70 + contrast * 70)
    g.fillStyle = before ? `rgb(${base + 22},${base + 4},${base - 18})` : `rgb(${base + 22},${base + 6},${base + 44})`
    g.fillRect(0, 0, W, VIEW_H)
    // Colourful fine texture (fixed)
    for (let i = 0; i < 2200; i++) {
      const x = (i * 7919) % W
      const y = (i * 6271) % VIEW_H
      const v = ((i * 31) % 40) - 20
      const tint = i % 3 === 0 ? '120,255,230' : i % 3 === 1 ? '255,150,220' : '255,255,255'
      g.fillStyle = v > 0 ? `rgba(${tint},${Math.abs(v) / 260})` : `rgba(30,0,70,${Math.abs(v) / 260})`
      g.fillRect(x, y, 2, 2)
    }
    // Brighter ground blasted by the landing rocket (after only)
    if (!before && scene.blast) {
      const b = scene.blast
      const rg = g.createRadialGradient(b.x * PPM, b.y * PPM, 2, b.x * PPM, b.y * PPM, b.r * PPM)
      rg.addColorStop(0, `rgba(255,236,190,${0.4 * contrast})`)
      rg.addColorStop(1, 'rgba(255,236,190,0)')
      g.fillStyle = rg
      g.fillRect(0, 0, W, VIEW_H)
    }
    // Craters: shadowed inner wall on the Sun side (left), bright wall right.
    for (const cr of scene.craters) {
      const x = cr.x * PPM
      const y = cr.y * PPM
      const r = cr.r * PPM
      g.fillStyle = 'rgba(40,10,90,0.14)'
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fill()
      const f = Math.min(1, 0.25 / Math.tan((sun * Math.PI) / 180))
      g.fillStyle = 'rgba(35,8,80,0.75)'
      g.beginPath()
      g.arc(x, y, r, Math.PI / 2, (3 * Math.PI) / 2)
      g.ellipse(x, y, Math.max(0.5, r * (1 - f)), r, 0, (3 * Math.PI) / 2, Math.PI / 2, true)
      g.fill()
      g.strokeStyle = `rgba(255,222,245,${0.2 + (1 - contrast) * 0.35})`
      g.lineWidth = 2
      g.beginPath()
      g.arc(x, y, r, -Math.PI / 2, Math.PI / 2)
      g.stroke()
    }
    // Footpaths / tracks (darker soil), visible mostly with a high Sun.
    if (!before) {
      for (const path of scene.paths) {
        g.strokeStyle = `rgba(50,14,90,${0.7 * trailVisibility(sun)})`
        g.lineWidth = 3
        g.setLineDash([5, 4])
        g.beginPath()
        path.points.forEach((p, i) => (i ? g.lineTo(p.x * PPM, p.y * PPM) : g.moveTo(p.x * PPM, p.y * PPM)))
        g.stroke()
        g.setLineDash([])
      }
    }
    // Shadows first, then the objects.
    const visible = (t: Thing) => !before || t.kind === 'boulder'
    for (const t of scene.things) {
      if (!visible(t)) continue
      const len = shadowLength(t.height, sun) * PPM
      g.fillStyle = 'rgba(30,6,70,0.86)'
      const w = t.size * PPM
      if (t.kind === 'lm') {
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
      g.fillStyle = `rgb(${Math.min(255, lum + 12)},${Math.min(255, lum + 4)},${Math.min(255, lum + 22)})`
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
    // Old photo: soft dark edges, like an aged print.
    if (before) {
      const vg = g.createRadialGradient(W / 2, VIEW_H / 2, 120, W / 2, VIEW_H / 2, 380)
      vg.addColorStop(0, 'rgba(60,30,0,0)')
      vg.addColorStop(1, 'rgba(60,30,0,0.45)')
      g.fillStyle = vg
      g.fillRect(0, 0, W, VIEW_H)
    }
  }

  // --- HUD ---------------------------------------------------------------------------
  function stats() {
    const left = spec.targets.filter((t) => !found.includes(t)).map((t) => NAME[t])
    const hearts = spec.mode === 'compare' ? spec.maxMistakes - mistakes : passIdx >= 0 ? spec.maxMistakes - missesByPass[passIdx] : spec.maxMistakes
    stage.setStats([
      { key: 'found', label: '⭐ ' + tr('Found', 'Hallados'), value: found.length + ' / ' + spec.targets.length },
      {
        key: 'sun',
        label: '☀️ ' + tr('Sun', 'Sol'),
        value: pass ? (showBefore && spec.beforeSun !== null ? spec.beforeSun : pass.sun) + '° ' + sunWord(showBefore && spec.beforeSun !== null ? spec.beforeSun : pass.sun) : '-',
      },
      spec.mode === 'compare' || (!practice && !tutorial)
        ? { key: 'passes', label: '❤️ ' + tr('Hearts', 'Vidas'), value: '❤️'.repeat(Math.max(0, hearts)) || '💔' }
        : { key: 'passes', label: '📷 ' + tr('Photos', 'Fotos'), value: usedPasses.length + ' / ' + spec.passes.length },
      { key: 'goal', label: '🔎 ' + tr('Looking for', 'Buscas'), value: left.join(', ') || '✔' },
    ])
  }

  // --- Drawing helpers ---------------------------------------------------------------
  function outlined(s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center') {
    c.font = `900 ${size}px ${FONT}`
    c.textAlign = align
    c.textBaseline = 'alphabetic'
    c.lineJoin = 'round'
    c.lineWidth = 5
    c.strokeStyle = PAL.ink
    c.strokeText(s, x, y)
    c.fillStyle = color
    c.fillText(s, x, y)
  }

  function label(s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left', weight = 800) {
    c.font = `${weight} ${size}px ${FONT}`
    c.textAlign = align
    c.textBaseline = 'alphabetic'
    c.fillStyle = color
    c.fillText(s, x, y)
  }

  function pill(x: number, y: number, w: number, h: number, fill: string, stroke?: string) {
    roundRect(c, x, y, w, h, h / 2)
    c.fillStyle = fill
    c.fill()
    if (stroke) {
      c.strokeStyle = stroke
      c.lineWidth = 2
      c.stroke()
    }
  }

  function wrap(s: string, maxW: number): string[] {
    const words = s.split(' ')
    const lines: string[] = []
    let line = ''
    for (const w of words) {
      const t = line ? line + ' ' + w : w
      if (c.measureText(t).width > maxW && line) {
        lines.push(line)
        line = w
      } else line = t
    }
    if (line) lines.push(line)
    return lines.slice(0, 2)
  }

  /** A little name tag that points at what you tapped. */
  function tag(x: number, y: number, s: string, color: string, alpha = 1) {
    c.save()
    c.globalAlpha = alpha
    c.font = `900 13px ${FONT}`
    const w = c.measureText(s).width + 22
    const h = 26
    const bx = Math.max(6, Math.min(W - w - 6, x - w / 2))
    const above = y - 50 >= 36
    const by = above ? y - 50 : y + 26
    roundRect(c, bx, by, w, h, 13)
    c.fillStyle = 'rgba(30,10,80,0.94)'
    c.fill()
    c.strokeStyle = color
    c.lineWidth = 2
    c.stroke()
    // pointer
    c.fillStyle = 'rgba(30,10,80,0.94)'
    c.beginPath()
    if (above) {
      c.moveTo(x - 6, by + h - 1)
      c.lineTo(x + 6, by + h - 1)
      c.lineTo(x, by + h + 8)
    } else {
      c.moveTo(x - 6, by + 1)
      c.lineTo(x + 6, by + 1)
      c.lineTo(x, by - 8)
    }
    c.closePath()
    c.fill()
    c.fillStyle = PAL.white
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(s, bx + w / 2, by + h / 2 + 1)
    c.restore()
  }

  function drawSky(now: number) {
    const g = c.createLinearGradient(0, 0, 0, VIEW_H)
    g.addColorStop(0, PAL.skyTop)
    g.addColorStop(0.55, PAL.skyMid)
    g.addColorStop(1, PAL.skyLow)
    c.fillStyle = g
    c.fillRect(0, 0, W, VIEW_H)
    // soft colour clouds
    for (const [x, y, r, col] of [[120, 130, 170, '255,126,179'], [520, 170, 190, '111,227,255'], [330, 60, 150, '198,168,255']] as const) {
      const rg = c.createRadialGradient(x, y, 4, x, y, r)
      rg.addColorStop(0, `rgba(${col},0.2)`)
      rg.addColorStop(1, `rgba(${col},0)`)
      c.fillStyle = rg
      c.fillRect(0, 0, W, VIEW_H)
    }
    for (let i = 0; i < 70; i++) {
      const x = (i * 97 + 13) % W
      const y = (i * 53 + 7) % (VIEW_H - 90)
      c.globalAlpha = reduced ? 0.9 : 0.55 + 0.45 * Math.sin(now / 500 + i * 1.7)
      c.fillStyle = STAR_COLORS[i % 3]
      const s = i % 5 === 0 ? 2.6 : 1.6
      c.fillRect(x, y, s, s)
    }
    c.globalAlpha = 1
  }

  function drawSun(x: number, y: number, r: number, now: number) {
    const glow = c.createRadialGradient(x, y, r * 0.5, x, y, r * 3)
    glow.addColorStop(0, 'rgba(255,230,120,0.6)')
    glow.addColorStop(1, 'rgba(255,230,120,0)')
    c.fillStyle = glow
    c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6)
    c.strokeStyle = PAL.sun
    c.lineWidth = 3
    c.lineCap = 'round'
    const spin = reduced ? 0 : now / 4000
    for (let i = 0; i < 12; i++) {
      const a = spin + (i / 12) * Math.PI * 2
      c.beginPath()
      c.moveTo(x + Math.cos(a) * (r + 5), y + Math.sin(a) * (r + 5))
      c.lineTo(x + Math.cos(a) * (r + 12), y + Math.sin(a) * (r + 12))
      c.stroke()
    }
    c.fillStyle = PAL.sun
    c.beginPath()
    c.arc(x, y, r, 0, Math.PI * 2)
    c.fill()
    // happy face
    c.fillStyle = '#c4570a'
    c.beginPath()
    c.arc(x - r * 0.35, y - r * 0.15, 2.2, 0, Math.PI * 2)
    c.arc(x + r * 0.35, y - r * 0.15, 2.2, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = '#c4570a'
    c.lineWidth = 2
    c.beginPath()
    c.arc(x, y + r * 0.05, r * 0.45, 0.2 * Math.PI, 0.8 * Math.PI)
    c.stroke()
  }

  function drawLRO(x: number, y: number, now: number, beam: boolean) {
    if (beam) {
      const bg = c.createLinearGradient(x, y + 8, x, y + 120)
      bg.addColorStop(0, 'rgba(111,227,255,0.45)')
      bg.addColorStop(1, 'rgba(111,227,255,0)')
      c.fillStyle = bg
      c.beginPath()
      c.moveTo(x - 4, y + 8)
      c.lineTo(x + 4, y + 8)
      c.lineTo(x + 60, y + 120)
      c.lineTo(x - 60, y + 120)
      c.closePath()
      c.fill()
    }
    for (const dir of [-1, 1]) {
      const px = dir < 0 ? x - 46 : x + 14
      c.fillStyle = '#3f7cff'
      roundRect(c, px, y - 5, 32, 11, 2)
      c.fill()
      c.strokeStyle = '#a9c6ff'
      c.lineWidth = 1
      for (let k = 1; k < 4; k++) {
        c.beginPath()
        c.moveTo(px + k * 8, y - 5)
        c.lineTo(px + k * 8, y + 6)
        c.stroke()
      }
    }
    c.fillStyle = PAL.gold
    roundRect(c, x - 14, y - 10, 28, 20, 5)
    c.fill()
    c.strokeStyle = PAL.orange
    c.lineWidth = 2
    c.stroke()
    c.fillStyle = PAL.white
    c.beginPath()
    c.arc(x, y - 14, 5, Math.PI, 0)
    c.fill()
    c.fillStyle = '#1b1060'
    c.beginPath()
    c.arc(x, y + 3, 4, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = PAL.cyan
    c.beginPath()
    c.arc(x - 1.2, y + 1.8, 1.3, 0, Math.PI * 2)
    c.fill()
    const blink = reduced || Math.floor(now / 600) % 2 === 0
    c.fillStyle = blink ? PAL.pink : '#7a2f58'
    c.beginPath()
    c.arc(x + 9, y - 6, 2, 0, Math.PI * 2)
    c.fill()
    pill(x - 20, y - 40, 40, 20, 'rgba(30,10,80,0.85)', PAL.gold)
    label('LRO', x, y - 26, 12, PAL.white, 'center', 900)
  }

  function drawOrbit(now: number) {
    drawSky(now)
    drawSun(70, 92, 22, now)
    const cx = W / 2
    const cy = VIEW_H + 150
    // orbit path
    c.strokeStyle = 'rgba(255,255,255,0.4)'
    c.lineWidth = 2
    c.setLineDash([7, 7])
    c.beginPath()
    c.arc(cx, cy, 345, Math.PI * 1.08, Math.PI * 1.92)
    c.stroke()
    c.setLineDash([])
    // the Moon
    const mg = c.createRadialGradient(cx - 90, cy - 250, 20, cx, cy, 310)
    mg.addColorStop(0, '#f4ecff')
    mg.addColorStop(0.55, '#c3adf5')
    mg.addColorStop(1, '#7f69cc')
    c.fillStyle = mg
    c.beginPath()
    c.arc(cx, cy, 300, 0, Math.PI * 2)
    c.fill()
    for (const [dx, dy, r] of [[-150, -230, 34], [110, -250, 26], [-40, -200, 18], [200, -190, 22], [-230, -130, 26], [20, -265, 12]] as const) {
      c.fillStyle = 'rgba(105,80,190,0.45)'
      c.beginPath()
      c.arc(cx + dx, cy + dy, r, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = 'rgba(255,255,255,0.45)'
      c.lineWidth = 2
      c.beginPath()
      c.arc(cx + dx, cy + dy, r, -Math.PI / 4, Math.PI * 0.75)
      c.stroke()
    }
    // LRO flying along its orbit
    const a = Math.PI * 1.5 + (reduced ? 0 : 0.28 * Math.PI * Math.sin(now / 1700))
    drawLRO(cx + 345 * Math.cos(a), cy + 345 * Math.sin(a), now, phase === 'choose')
    if (phase === 'choose') {
      outlined(tr('Pick a time for the photo!', '¡Elige la hora de la foto!'), W / 2, 62, 24, PAL.white)
      pill(W / 2 - 250, 82, 240, 26, 'rgba(255,255,255,0.18)')
      label('🌅 ' + tr('Low Sun = long shadows', 'Sol bajo = sombras largas'), W / 2 - 130, 100, 13, PAL.white, 'center')
      pill(W / 2 + 10, 82, 240, 26, 'rgba(255,255,255,0.18)')
      label('☀️ ' + tr('High Sun = short shadows', 'Sol alto = sombras cortas'), W / 2 + 130, 100, 13, PAL.white, 'center')
    }
  }

  function drawPhoto(now: number) {
    if (!pass) return
    c.drawImage(showBefore ? imgBefore : imgAfter, 0, 0)
    // camera viewfinder corners
    c.strokeStyle = showBefore ? '#ffd9a0' : PAL.cyan
    c.lineWidth = 4
    c.lineCap = 'round'
    for (const [x, y, dx, dy] of [[8, 8, 1, 1], [W - 8, 8, -1, 1], [8, VIEW_H - 8, 1, -1], [W - 8, VIEW_H - 8, -1, -1]] as const) {
      c.beginPath()
      c.moveTo(x, y + dy * 24)
      c.lineTo(x, y)
      c.lineTo(x + dx * 24, y)
      c.stroke()
    }
    // Sun info pill
    const deg = showBefore && spec.beforeSun !== null ? spec.beforeSun : pass.sun
    const sunText = (showBefore ? '📜 1967 · ' : '☀️ ') + sunWord(deg) + ' · ' + deg + '°'
    c.font = `900 13px ${FONT}`
    const sw = c.measureText(sunText).width + 24
    pill(16, 16, sw, 28, 'rgba(30,10,80,0.82)', showBefore ? '#ffd9a0' : PAL.sun)
    label(sunText, 28, 35, 13, showBefore ? '#ffd9a0' : PAL.white)
    // Hearts (not in practice)
    if (!practice) {
      const hearts = spec.mode === 'compare' ? spec.maxMistakes - mistakes : spec.maxMistakes - missesByPass[passIdx]
      const hs = '❤️'.repeat(Math.max(0, hearts)) + '🤍'.repeat(Math.max(0, spec.maxMistakes - Math.max(0, hearts)))
      c.font = `800 15px ${FONT}`
      const hw = c.measureText(hs).width + 20
      pill(W - hw - 16, 16, hw, 28, 'rgba(30,10,80,0.82)', PAL.pink)
      label(hs, W - hw - 6, 36, 15, PAL.white)
    }
    // Scale bar
    c.fillStyle = PAL.white
    c.fillRect(24, VIEW_H - 22, 20 * PPM, 4)
    pill(24 + 20 * PPM + 8, VIEW_H - 32, 52, 22, 'rgba(30,10,80,0.8)')
    label('20 m', 24 + 20 * PPM + 34, VIEW_H - 16, 12, PAL.white, 'center', 900)

    if (showBefore) return

    // Tutorial: after a few wrong taps, a pulsing circle helps.
    if (tutorial && phase === 'search' && tutorialMisses >= 4 && !found.includes('lm')) {
      const lm = scene.things.find((t) => t.kind === 'lm')
      if (lm) {
        const pulse = reduced ? 1 : 0.6 + 0.4 * Math.sin(now / 250)
        c.strokeStyle = `rgba(255,216,77,${pulse})`
        c.lineWidth = 4
        c.beginPath()
        c.arc(lm.x * PPM + 12, lm.y * PPM, 44, 0, Math.PI * 2)
        c.stroke()
      }
    }

    // Things already found: ring, big picture and name.
    for (const m of foundMarks) {
      const age = now - m.at
      const grow = reduced ? 1 : Math.min(1, age / 450)
      const ease = 1 - Math.pow(1 - grow, 3)
      c.strokeStyle = PAL.mint
      c.lineWidth = 4
      c.beginPath()
      c.arc(m.x, m.y, 16 + (1 - ease) * 24, 0, Math.PI * 2)
      c.stroke()
      c.strokeStyle = 'rgba(30,10,80,0.6)'
      c.lineWidth = 1.5
      c.beginPath()
      c.arc(m.x, m.y, 20 + (1 - ease) * 24, 0, Math.PI * 2)
      c.stroke()
      c.font = `${Math.round(18 + 22 * ease)}px ${FONT}`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText(EMOJI[m.kind], m.x, m.y - 4)
      tag(m.x, m.y - 6, EMOJI[m.kind] + ' ' + NAME[m.kind], PAL.mint)
    }
    // Names of things that were not the target (they fade out).
    marks = marks.filter((m) => now - m.at < 2700)
    for (const m of marks) {
      const age = now - m.at
      const alpha = age > 2000 ? 1 - (age - 2000) / 700 : 1
      c.save()
      c.globalAlpha = alpha
      c.strokeStyle = PAL.bad
      c.lineWidth = 3
      c.lineCap = 'round'
      c.beginPath()
      c.moveTo(m.x - 6, m.y - 6)
      c.lineTo(m.x + 6, m.y + 6)
      c.moveTo(m.x + 6, m.y - 6)
      c.lineTo(m.x - 6, m.y + 6)
      c.stroke()
      c.restore()
      tag(m.x, m.y, EMOJI[m.kind] + ' ' + NAME[m.kind], m.kind === 'ground' ? PAL.lilac : PAL.cyan, alpha)
    }
    // Cross for keyboard and touch aiming
    if (phase === 'search' && showCursor) {
      const r = reduced ? 12 : 11 + 2 * Math.sin(now / 200)
      c.strokeStyle = PAL.sun
      c.lineWidth = 2.5
      c.beginPath()
      c.arc(cursor.x, cursor.y, r, 0, Math.PI * 2)
      c.moveTo(cursor.x - r - 5, cursor.y)
      c.lineTo(cursor.x + r + 5, cursor.y)
      c.moveTo(cursor.x, cursor.y - r - 5)
      c.lineTo(cursor.x, cursor.y + r + 5)
      c.stroke()
    }
  }

  function drawMascot(x: number, y: number, now: number) {
    const bob = reduced ? 0 : Math.sin(now / 400) * 2
    y += bob
    c.fillStyle = PAL.white
    c.beginPath()
    c.arc(x, y, 22, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = PAL.cyan
    c.lineWidth = 3
    c.stroke()
    const vg = c.createLinearGradient(x, y - 14, x, y + 12)
    vg.addColorStop(0, '#5a6bff')
    vg.addColorStop(1, '#2a1a8a')
    c.fillStyle = vg
    c.beginPath()
    c.ellipse(x, y + 1, 15, 12, 0, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = 'rgba(255,255,255,0.7)'
    c.beginPath()
    c.ellipse(x - 6, y - 4, 4, 2.5, -0.5, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = PAL.sun
    c.lineWidth = 2
    c.beginPath()
    c.arc(x, y + 3, 5, 0.15 * Math.PI, 0.85 * Math.PI)
    c.stroke()
    // antenna
    c.strokeStyle = PAL.white
    c.beginPath()
    c.moveTo(x + 14, y - 16)
    c.lineTo(x + 20, y - 26)
    c.stroke()
    c.fillStyle = PAL.pink
    c.beginPath()
    c.arc(x + 20, y - 27, 3, 0, Math.PI * 2)
    c.fill()
  }

  function defaultTip(): string {
    if (phase === 'choose') {
      return !practice && usedPasses.length > 0 && missesByPass.some((m) => m >= spec.maxMistakes)
        ? tr('Try the other photo!', '¡Prueba la otra foto!')
        : tutorial
          ? tr('Pick a time. Try both photos!', '¡Elige una hora! Prueba las dos fotos.')
          : TEXT.goal
    }
    if (phase === 'search' && pass) {
      if (spec.mode === 'compare') return tr('Hold the button. Tap what is NEW!', 'Mantén el botón. ¡Toca lo NUEVO!')
      if (levelKey <= 1) return pass.sun <= 30 ? tr('Look for a LONG shadow! Tap things to learn their names.', '¡Busca una sombra LARGA! Toca cosas para saber su nombre.') : tr('Shadows are tiny now. Try the other photo!', 'Las sombras son pequeñas. ¡Prueba la otra foto!')
      return pass.sun >= 50 ? tr('Follow the dark trail to the science station!', '¡Sigue el caminito oscuro hasta la estación!') : tr('The trail hides in shadows. Try the other photo!', 'El caminito se esconde. ¡Prueba la otra foto!')
    }
    return ''
  }

  function drawPassButton(b: { i: number; box: Box }, now: number) {
    const sp = spec.passes[b.i]
    const { x, y, w, h } = b.box
    const exhausted = !practice && missesByPass[b.i] >= spec.maxMistakes
    const current = phase === 'search' && passIdx === b.i
    const enabled = (phase === 'choose' || phase === 'search') && !exhausted
    const high = sp.sun >= 50
    const lowIdx = spec.passes.findIndex((p) => p.sun <= 30)
    const pulse = !reduced && tutorial && phase === 'search' && !!pass && pass.sun > 30 && tutorialMisses >= 2 && b.i === lowIdx
    const hot = !reduced && phase === 'choose'
    const wob = pulse || hot ? 1 + 0.015 * Math.sin(now / 220) : 1

    c.save()
    c.globalAlpha = enabled ? 1 : 0.4
    c.translate(x + w / 2, y + h / 2)
    c.scale(wob, wob)
    c.translate(-(x + w / 2), -(y + h / 2))
    // shadow
    roundRect(c, x, y + 4, w, h, 14)
    c.fillStyle = 'rgba(0,0,0,0.35)'
    c.fill()
    const g = c.createLinearGradient(x, y, x, y + h)
    if (high) {
      g.addColorStop(0, '#ffe36b')
      g.addColorStop(1, '#ffa63d')
    } else {
      g.addColorStop(0, '#ff9ec8')
      g.addColorStop(1, '#ff8f5a')
    }
    roundRect(c, x, y, w, h, 14)
    c.fillStyle = g
    c.fill()
    c.strokeStyle = current || pulse ? PAL.white : 'rgba(255,255,255,0.45)'
    c.lineWidth = current || pulse ? 4 : 2
    c.stroke()

    // little picture: where the Sun is and how long the shadow gets
    const ix = x + 8
    const iy = y + 6
    const iw = 66
    const ih = h - 12
    c.save()
    roundRect(c, ix, iy, iw, ih, 9)
    c.clip()
    const sg = c.createLinearGradient(0, iy, 0, iy + ih)
    if (high) {
      sg.addColorStop(0, '#4fb8ff')
      sg.addColorStop(1, '#bfe9ff')
    } else {
      sg.addColorStop(0, '#7a4fd8')
      sg.addColorStop(1, '#ffb08a')
    }
    c.fillStyle = sg
    c.fillRect(ix, iy, iw, ih)
    const gy = iy + ih - 11
    c.fillStyle = '#9b86e0'
    c.fillRect(ix, gy, iw, 11)
    const sunY = gy - 6 - (sp.sun / 90) * (ih - 28)
    c.fillStyle = PAL.sun
    c.beginPath()
    c.arc(ix + 13, sunY, 6, 0, Math.PI * 2)
    c.fill()
    const sl = Math.min(32, shadowLength(3.2, sp.sun) * 2.2)
    c.fillStyle = 'rgba(40,10,90,0.85)'
    c.fillRect(ix + 31, gy, sl + 8, 3)
    c.fillStyle = '#fff3c9'
    c.fillRect(ix + 28, gy - 8, 8, 8)
    c.restore()

    const tx = x + 84
    label(b.i + 1 + ' · ' + passName(sp.sun), tx, y + 26, 17, '#3a1d00', 'left', 900)
    label(sunWord(sp.sun) + ' · ' + sp.sun + '°', tx, y + 45, 13, 'rgba(58,29,0,0.8)', 'left', 800)
    if (current) label('✔', x + w - 16, y + 26, 18, '#3a1d00', 'center', 900)
    if (exhausted) label('💔', x + w - 16, y + 30, 18, '#3a1d00', 'center')
    c.restore()
  }

  function drawPanel(now: number) {
    const pg = c.createLinearGradient(0, VIEW_H, 0, H)
    pg.addColorStop(0, '#2d1a6b')
    pg.addColorStop(1, '#1a1048')
    c.fillStyle = pg
    c.fillRect(0, VIEW_H, W, H - VIEW_H)
    c.fillStyle = PAL.gold
    c.fillRect(0, VIEW_H, W, 3)

    // Helper row: little astronaut with a speech bubble
    drawMascot(38, VIEW_H + 34, now)
    if (coach && now > coach.until) coach = null
    const tip = coach ? coach.text : defaultTip()
    roundRect(c, 70, VIEW_H + 10, W - 82, 46, 14)
    c.fillStyle = 'rgba(255,255,255,0.95)'
    c.fill()
    c.beginPath()
    c.moveTo(71, VIEW_H + 26)
    c.lineTo(60, VIEW_H + 34)
    c.lineTo(71, VIEW_H + 40)
    c.closePath()
    c.fill()
    c.font = `800 14px ${FONT}`
    const lines = wrap(tip, W - 112)
    const startY = VIEW_H + 33 - (lines.length - 1) * 9
    lines.forEach((ln, i) => label(ln, 84, startY + i * 18 + 5, 14, PAL.ink))

    if (spec.mode === 'compare') {
      const enabled = phase === 'search'
      const { x, y, w, h } = BLINK
      c.save()
      c.globalAlpha = enabled ? 1 : 0.4
      roundRect(c, x, y + 4, w, h, 14)
      c.fillStyle = 'rgba(0,0,0,0.35)'
      c.fill()
      const g = c.createLinearGradient(x, y, x + w, y)
      g.addColorStop(0, showBefore ? '#ffb86b' : '#7a5cff')
      g.addColorStop(1, showBefore ? '#ff8f5a' : '#37c6e8')
      roundRect(c, x, y, w, h, 14)
      c.fillStyle = g
      c.fill()
      c.strokeStyle = 'rgba(255,255,255,0.6)'
      c.lineWidth = showBefore ? 4 : 2
      c.stroke()
      label(
        showBefore ? tr('📜 Showing the 1967 photo…', '📜 Mostrando la foto de 1967…') : tr('📜 Hold to see the 1967 photo', '📜 Mantén para ver la foto de 1967'),
        x + w / 2,
        y + h / 2 + 6,
        18,
        PAL.white,
        'center',
        900,
      )
      c.restore()
    } else {
      for (const b of passButtons) drawPassButton(b, now)
    }
  }

  function drawSparks() {
    for (const s of sparks) {
      c.globalAlpha = Math.max(0, s.life / s.max)
      c.fillStyle = s.color
      c.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size)
    }
    c.globalAlpha = 1
  }

  function render(now: number) {
    if ((phase === 'search' || phase === 'done') && pass) drawPhoto(now)
    else drawOrbit(now)
    drawSparks()
    drawPanel(now)
  }

  // Keyboard blink for level 3 (hold B).
  const loop = createLoop((dt) => {
    if (spec.mode === 'compare' && phase === 'search') {
      const held = input.held.has('KeyB') || blinkPointer !== null
      if (held !== showBefore) {
        showBefore = held
        stats()
      }
    }
    if (sparks.length) {
      for (const s of sparks) {
        s.x += (s.vx * dt) / 16
        s.y += (s.vy * dt) / 16
        s.vy += (0.1 * dt) / 16
        s.life -= dt
      }
      sparks = sparks.filter((s) => s.life > 0)
    }
    render(performance.now())
  })

  stats()
  stage.showOverlay({
    title: '🛰️ ' + TEXT.title,
    text: TEXT.intro,
    buttons: [{ label: tr('Start! 🚀', '¡Empezar! 🚀'), onClick: begin }],
  })
  render(performance.now())
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
      for (const t of timers) window.clearTimeout(t)
      timers.clear()
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

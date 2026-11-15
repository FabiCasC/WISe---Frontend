import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { COLORS, drawButton, inBox, roundRect, text, toLogical, type Box } from '../shared/canvasui'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import {
  LEVELS,
  chunkSize,
  chunksToLabel,
  conceptFor,
  createState,
  deliver,
  dig,
  iceExposed,
  isFresh,
  label,
  labelResults,
  nextSol,
  outcome,
  scoreRun,
  type State,
} from './rules'

const W = 640
const H = 560
const GROUND_Y = 176
const SCOOP_H = 44
const COL_TOP = GROUND_Y

/**
 * PHOENIX ICE DIG
 * -------------------------------------------------------------------------
 * Dig with the robotic arm, then let time pass. Level 1: bright chunks that
 * shrink over the sols are water ice turning to gas; salt stays. Level 2:
 * only freshly exposed ice shows water in the oven. Level 3: each sol the
 * Sun is lower and there is less energy, until Phoenix goes silent.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('phoenix-ice')
  const levelKey = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as 1 | 2 | 3
  const spec = LEVELS[levelKey]
  const concept = conceptFor(levelKey)
  const practice = ctx.settings.practice
  const sfx = createSfx(ctx.settings.volume)

  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#9fd8ff' })
  const input = createInput(stage.root)
  const c = stage.ctx
  const startedAt = performance.now()

  type Phase = 'intro' | 'playing' | 'done'
  let phase: Phase = 'intro'
  let s: State = createState(spec)
  let selected = 0
  let tries = 0
  let settled = false
  let armT = 0
  let lastMsg = ''
  const decisions: { concept: string; correct: boolean }[] = []

  const n = spec.columns.length
  const colW = (W - 40) / n
  const colBox = (i: number): Box => ({ x: 20 + i * colW + 4, y: COL_TOP, w: colW - 8, h: 280 })

  const B1: Box = { x: 20, y: 478, w: (W - 50) / 2, h: 60 }
  const B2: Box = { x: 30 + (W - 50) / 2, y: 478, w: (W - 50) / 2, h: 60 }

  function begin() {
    s = createState(spec)
    selected = 0
    lastMsg = ''
    tries++
    phase = 'playing'
    stage.hideOverlay()
    stats()
  }

  function say(msg: string, ok: boolean) {
    lastMsg = msg
    stage.flash(msg, ok ? 'ok' : 'bad')
  }

  function tapColumn(i: number) {
    if (phase === 'intro') return begin()
    if (phase !== 'playing') return
    selected = i
    const col = s.columns[i]
    if (spec.kind === 'observe' && col.dug >= col.depth) {
      if (col.chunk === 'none') return
      s = label(s, i)
      sfx.tone(640, 50, 'square', 0.08)
      return stats()
    }
    const r = dig(spec, s, i, practice)
    if (r.state === s) return say(r.message, false)
    s = r.state
    armT = 1
    sfx.noise(120, 0.1)
    if (/ice|chunk/i.test(r.message)) sfx.tone(980, 120, 'sine', 0.12)
    say(r.message, true)
    stats()
  }

  function sample() {
    if (phase !== 'playing' || spec.kind !== 'sample') return
    const r = deliver(spec, s, selected, practice)
    if (r.state === s) return say(r.message, false)
    s = r.state
    if (!practice) decisions.push({ concept, correct: r.ok })
    if (r.ok) sfx.sweep(600, 1200, 300, 'triangle', 0.16)
    else sfx.tone(200, 260, 'sawtooth', 0.12)
    say(r.message, r.ok)
    stats()
    check()
  }

  function wait() {
    if (phase !== 'playing') return
    if (spec.kind === 'observe' && s.sol >= spec.budget.length) return say('Time to send your report', false)
    s = nextSol(spec, s, practice)
    sfx.sweep(300, 500, 260, 'sine', 0.1)
    if (!s.silent) say('Sol ' + s.sol + ': ' + s.energy + ' arm actions of energy', true)
    stats()
    check()
  }

  function report() {
    if (phase !== 'playing' || spec.kind !== 'observe') return
    const todo = chunksToLabel(s)
    if (!s.columns.every((c) => c.dug >= c.depth)) return say('Dig all five spots first', false)
    if (todo.some((i) => s.columns[i].label === '?')) return say('Tap each bright chunk to label it', false)
    const res = labelResults(s)
    if (!practice) for (const r of res) decisions.push({ concept, correct: r.correct })
    const won = res.every((r) => r.correct)
    end(won, res.filter((r) => r.correct).length + ' of ' + res.length + ' chunks labeled right')
  }

  function check() {
    const o = outcome(spec, s)
    if (o === 'won') end(true, s.readings + (s.readings === 1 ? ' water reading' : ' water readings'))
    else if (o === 'lost') {
      if (levelKey === 3 && !practice) decisions.push({ concept, correct: false })
      end(false, s.silent ? 'Phoenix went silent with ' + s.readings + ' of ' + spec.readingsNeeded + ' readings' : 'No water readings')
    }
  }

  function end(won: boolean, line: string) {
    phase = 'done'
    if (won && levelKey === 3 && !practice) decisions.push({ concept, correct: true })
    const score = practice || !won ? 0 : scoreRun(spec, s)
    if (won) sfx.sweep(520, 980, 360, 'triangle', 0.2)
    else sfx.sweep(320, 110, 400, 'sawtooth', 0.16)
    const lesson =
      levelKey === 1
        ? 'Phoenix scientists saw three bright clumps in a trench vanish in four days. Ice on Mars turns straight into gas in the thin, dry air. Something that stays, like a salt crust, cannot be ice.'
        : levelKey === 2
          ? 'Phoenix’s first oven sample showed no water: it had sat in the open for several days and the ice had turned to gas. Fresh samples later confirmed water ice.'
          : 'As summer ended, less sunlight reached the solar panels. The team switched off heaters one by one. Phoenix sent its last signal on 2 November 2008. In winter, carbon dioxide frost covered it and most likely broke a solar panel.'
    if (won) {
      stage.showOverlay({
        title: levelKey === 1 ? 'Good science!' : 'Water on Mars!',
        tone: 'win',
        score: line + (practice ? '' : ' · ' + score + ' points'),
        text: lesson + ' Phoenix is still there, in the arctic plains of Mars.',
        fact: card?.fact,
        buttons: [{ label: 'Save and continue', onClick: () => complete(true, score) }],
      })
    } else {
      stage.showOverlay({
        title: levelKey === 1 ? 'Not quite' : 'Mission over',
        tone: 'lose',
        score: line,
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
      gameId: 'phoenix-ice',
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
    const m = /^Digit([1-9])$/.exec(code)
    if (m) {
      const i = Number(m[1]) - 1
      if (i < n) tapColumn(i)
      return
    }
    if (code === 'ArrowLeft') selected = Math.max(0, selected - 1)
    else if (code === 'ArrowRight') selected = Math.min(n - 1, selected + 1)
    else if (code === 'Space' || code === 'ArrowDown') tapColumn(selected)
    else if (code === 'KeyN') wait()
    else if (code === 'KeyO') sample()
    else if (code === 'Enter') (spec.kind === 'observe' ? report : sample)()
  })

  const onDown = (e: PointerEvent) => {
    e.preventDefault()
    if (phase === 'intro') return begin()
    const p = toLogical(stage.canvas, e, W, H)
    for (let i = 0; i < n; i++) if (inBox(p, colBox(i))) return tapColumn(i)
    if (inBox(p, B1)) return spec.kind === 'observe' ? wait() : sample()
    if (inBox(p, B2)) return spec.kind === 'observe' ? report() : wait()
  }
  stage.canvas.addEventListener('pointerdown', onDown)

  stage.setHint(
    spec.kind === 'observe'
      ? 'Tap a spot (or 1-5) to dig · tap a chunk again to label it · N = next sol · Enter sends the report'
      : 'Tap a spot (or 1-6) to dig · O or the button puts the selected scoop in the oven · N = next sol'
  )

  // --- Drawing ---------------------------------------------------------------------
  function stats() {
    const budgetMax = Math.max(...spec.budget)
    const list = [
      { key: 'sol', label: 'Sol', value: String(s.sol) + (practice ? '' : ' / ' + spec.budget.length) },
      {
        key: 'energy',
        label: practice ? 'Energy (practice)' : 'Energy',
        value: practice ? '∞' : s.energy + (s.energy === 1 ? ' action' : ' actions'),
        meter: practice ? 1 : s.energy / budgetMax,
        tone: (practice || s.energy > 1 ? 'ok' : s.energy === 1 ? 'warn' : 'bad') as 'ok' | 'warn' | 'bad',
      },
    ]
    if (spec.kind === 'sample') {
      list.push({ key: 'ovens', label: 'Ovens left', value: practice ? '∞' : String(s.ovensLeft) })
      list.push({ key: 'water', label: 'Water readings', value: s.readings + ' / ' + spec.readingsNeeded })
    } else {
      const todo = chunksToLabel(s)
      list.push({ key: 'labels', label: 'Labeled', value: todo.filter((i) => s.columns[i].label !== '?').length + ' / ' + todo.length })
    }
    stage.setStats(list)
  }

  function drawSky() {
    // Lower Sun and dimmer light as the season ends (level 3).
    const late = levelKey === 3 ? Math.min(1, (s.sol - 1) / (spec.budget.length - 1)) : 0
    const g = c.createLinearGradient(0, 0, 0, GROUND_Y)
    g.addColorStop(0, mix('#c79a7a', '#2b2230', late))
    g.addColorStop(1, mix('#e8c4a0', '#5a4248', late))
    c.fillStyle = g
    c.fillRect(0, 0, W, GROUND_Y)
    const sunY = 34 + late * 110
    c.fillStyle = `rgba(255,244,220,${0.95 - late * 0.4})`
    c.beginPath()
    c.arc(560, sunY, 13 - late * 3, 0, Math.PI * 2)
    c.fill()
    text(c, 'Sun', 560, sunY + 28, { size: 10, color: 'rgba(30,20,20,0.7)', align: 'center' })

    // Polygon-patterned arctic ground
    c.fillStyle = '#9b6e4f'
    c.fillRect(0, GROUND_Y - 22, W, 22)
    c.strokeStyle = 'rgba(60,35,25,0.4)'
    c.lineWidth = 1
    for (let x = 0; x < W; x += 46) {
      c.beginPath()
      c.moveTo(x, GROUND_Y - 22)
      c.lineTo(x + 18, GROUND_Y)
      c.stroke()
    }

    // Lander: deck, legs, two round solar wings
    const lx = 110
    const ly = GROUND_Y - 60
    const frost = levelKey === 3 && s.silent
    c.fillStyle = frost ? '#e8eef5' : '#40567a'
    for (const dx of [-62, 62]) {
      c.beginPath()
      c.ellipse(lx + dx, ly - 6, 38, 12, 0, 0, Math.PI * 2)
      c.fill()
    }
    c.fillStyle = '#d7d2c4'
    c.fillRect(lx - 26, ly - 8, 52, 18)
    c.strokeStyle = '#d7d2c4'
    c.lineWidth = 3
    for (const dx of [-20, 20]) {
      c.beginPath()
      c.moveTo(lx + dx, ly + 10)
      c.lineTo(lx + dx * 1.4, GROUND_Y - 22)
      c.stroke()
    }
    // Robotic arm toward the selected spot
    const b = colBox(selected)
    const tx = b.x + b.w / 2
    const ty = GROUND_Y - 18 + armT * 14
    c.strokeStyle = '#ece6d8'
    c.lineWidth = 5
    c.beginPath()
    c.moveTo(lx + 24, ly)
    const ex = (lx + 24 + tx) / 2
    c.lineTo(ex, ly - 50)
    c.lineTo(tx, ty)
    c.stroke()
    c.fillStyle = COLORS.gold
    c.fillRect(tx - 7, ty - 4, 14, 9)
    text(c, 'Phoenix', lx, ly - 26, { size: 11, weight: 800, color: 'rgba(30,20,20,0.75)', align: 'center' })
  }

  function drawColumns() {
    c.fillStyle = '#7a5038'
    c.fillRect(0, GROUND_Y, W, 290)
    for (let i = 0; i < n; i++) {
      const col = s.columns[i]
      const b = colBox(i)
      const cx = b.x + b.w / 2
      // Ice layer (hidden until reached, on sampling levels)
      if (spec.kind === 'sample' && col.dug >= col.depth) {
        const iy = COL_TOP + col.depth * SCOOP_H
        // Hard, icy ground under the soil (a band: the rest stays hidden)
        const ice = c.createLinearGradient(0, iy, 0, iy + 60)
        ice.addColorStop(0, '#cfe6f2')
        ice.addColorStop(1, 'rgba(207,230,242,0)')
        c.fillStyle = ice
        c.fillRect(b.x, iy, b.w, 60)
      }
      // Trench
      const depthPx = col.dug * SCOOP_H
      if (col.dug > 0) {
        c.fillStyle = '#3e2a20'
        c.fillRect(b.x + 8, COL_TOP, b.w - 16, depthPx)
      }
      // What is at the bottom
      if (spec.kind === 'observe' && col.dug >= col.depth && col.chunk !== 'none') {
        const k = chunkSize(s, col)
        if (k > 0) {
          c.fillStyle = '#f4f7fb'
          c.beginPath()
          c.ellipse(cx, COL_TOP + depthPx - 12, 22 * k + 2, 12 * k + 1, 0, 0, Math.PI * 2)
          c.fill()
          c.beginPath()
          c.ellipse(cx - 14 * k, COL_TOP + depthPx - 20, 9 * k, 6 * k, 0, 0, Math.PI * 2)
          c.fill()
        } else {
          text(c, '(gone)', cx, COL_TOP + depthPx - 8, { size: 11, color: 'rgba(236,230,216,0.6)', align: 'center' })
        }
        const lab = col.label
        const tag = lab === '?' ? 'tap to label' : lab === 'ice' ? 'ICE' : 'SALT'
        c.fillStyle = lab === '?' ? 'rgba(13,16,23,0.7)' : lab === 'ice' ? 'rgba(117,203,209,0.95)' : 'rgba(243,181,74,0.95)'
        roundRect(c, cx - 38, COL_TOP + depthPx + 10, 76, 24, 6)
        c.fill()
        text(c, tag, cx, COL_TOP + depthPx + 27, { size: 12, weight: 800, color: lab === '?' ? COLORS.star : COLORS.ink, align: 'center' })
      }
      if (spec.kind === 'sample' && iceExposed(col)) {
        const fresh = isFresh(s, col)
        c.fillStyle = fresh ? '#ffffff' : '#b9b0a6'
        c.fillRect(b.x + 8, COL_TOP + depthPx - 8, b.w - 16, 8)
        text(c, fresh ? 'fresh ice' : 'old ice', cx, COL_TOP + depthPx + 22, {
          size: 11,
          weight: 800,
          color: fresh ? '#1c3550' : '#5a4a40',
          align: 'center',
        })
      } else if (spec.kind === 'sample' && col.dug >= col.depth) {
        text(c, 'scrape again', cx, COL_TOP + depthPx + 22, { size: 10, color: '#1c3550', align: 'center' })
      }
      // Selection
      if (i === selected && phase === 'playing') {
        c.strokeStyle = COLORS.gold
        c.lineWidth = 2
        c.strokeRect(b.x, b.y - 4, b.w, 30)
      }
      text(c, 'Spot ' + (i + 1), cx, COL_TOP + 18, { size: 11, weight: 800, color: '#f1dcc4', align: 'center' })
    }
  }

  function drawButtons() {
    const on = phase === 'playing'
    if (spec.kind === 'observe') {
      drawButton(c, B1, 'Next sol ▶', { enabled: on && s.sol < spec.budget.length, size: 17 })
      drawButton(c, B2, 'Send report', { primary: true, enabled: on, size: 17 })
    } else {
      const col = s.columns[selected]
      drawButton(c, B1, 'Spot ' + (selected + 1) + ' → oven', { primary: true, enabled: on && col.dug > 0, size: 17 })
      drawButton(c, B2, 'Next sol ▶', { enabled: on, size: 17 })
    }
    if (lastMsg && phase === 'playing') text(c, lastMsg, W / 2, 466, { size: 12, color: COLORS.star, align: 'center' })
  }

  function render() {
    c.fillStyle = COLORS.space
    c.fillRect(0, 0, W, H)
    drawSky()
    drawColumns()
    c.fillStyle = COLORS.space
    c.fillRect(0, 452, W, H - 452)
    drawButtons()
  }

  const loop = createLoop((dt) => {
    armT = Math.max(0, armT - dt / 300)
    render()
  })

  stats()
  stage.showOverlay({
    title: (card?.title ?? 'Phoenix Ice Dig') + ' · ' + spec.name,
    text: spec.intro,
    buttons: [{ label: 'Start digging', onClick: begin }],
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

function mix(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, k))))
  return `rgb(${m[0]},${m[1]},${m[2]})`
}

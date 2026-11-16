import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { COLORS, drawButton, inBox, roundRect, text, toLogical, type Box } from '../shared/canvasui'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import { TERMS } from './terms'
import {
  DX,
  DY,
  LEVELS,
  ROCK_NAMES,
  cellAt,
  conceptFor,
  goalReached,
  landerSees,
  parseLevel,
  runPlan,
  scorePlan,
  type Cmd,
  type Pose,
  type RunResult,
} from './rules'

const W = 640
const H = 560
const CELL = 54
const GX = 12
const GY = 12
const PANEL_X = 512
const CMD_LABEL: Record<Cmd, string> = { F: '▲ Forward', B: '▼ Back', L: '⟲ Left', R: '⟳ Right', A: '● APXS' }
const CMD_SHORT: Record<Cmd, string> = { F: '▲', B: '▼', L: '⟲', R: '⟳', A: 'APXS' }
const CMD_ORDER: Cmd[] = ['F', 'B', 'L', 'R', 'A']

/**
 * SOJOURNER'S PLAN
 * -------------------------------------------------------------------------
 * Programming puzzle: radio takes 10-15 minutes to reach Mars, so you can
 * not steer live. Queue the moves, send them once per sol and watch the
 * plan run. Level 2 adds the APXS on the back of the rover; level 3 hides
 * small rocks that the rover's hazard avoidance stops for by itself.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('sojourner-commands')
  const levelKey = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as 1 | 2 | 3
  const spec = LEVELS[levelKey]
  const grid = parseLevel(spec)
  const concept = conceptFor(levelKey)
  const practice = ctx.settings.practice
  const reduced = ctx.settings.reducedMotion
  const sfx = createSfx(ctx.settings.volume)

  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#F2A65A' })
  stage.setGlossary(TERMS)
  const input = createInput(stage.root)
  const c = stage.ctx
  const startedAt = performance.now()

  type Phase = 'intro' | 'planning' | 'uplink' | 'running' | 'downlink' | 'done'
  let phase: Phase = 'intro'
  let pose: Pose = { ...grid.start }
  let plan: Cmd[] = []
  let sol = 1
  let sent = 0
  let commandsSent = 0
  /** What the rover really did with the plans, for the recap. */
  let stepsRun = 0
  let stepsOk = 0
  let hazardStops = 0
  let apxsMeasured = 0
  let apxsMissed = 0
  let phaseT = 0
  let run: RunResult | null = null
  let stepIdx = 0
  let seen = new Set<string>()
  let tries = 0
  let settled = false
  let lastNote = ''
  const decisions: { concept: string; correct: boolean }[] = []

  const LINK_MS = reduced ? 700 : 2600
  const STEP_MS = reduced ? 160 : 420

  // --- Buttons --------------------------------------------------------------------
  const cmdButtons: { cmd: Cmd; box: Box }[] = CMD_ORDER.filter((cmd) => cmd !== 'A' || levelKey > 1).map((cmd, i, all) => {
    const gap = 8
    const w = (W - 24 - gap * (all.length - 1)) / all.length
    return { cmd, box: { x: 12 + i * (w + gap), y: 406, w, h: 54 } }
  })
  const BTN_UNDO: Box = { x: 12, y: 470, w: 120, h: 54 }
  const BTN_CLEAR: Box = { x: 140, y: 470, w: 120, h: 54 }
  const BTN_SEND: Box = { x: 268, y: 470, w: W - 280, h: 54 }

  function resetRun() {
    pose = { ...grid.start }
    plan = []
    sol = 1
    sent = 0
    commandsSent = 0
    stepsRun = 0
    stepsOk = 0
    hazardStops = 0
    apxsMeasured = 0
    apxsMissed = 0
    run = null
    seen = new Set()
    lastNote = ''
  }

  function begin() {
    resetRun()
    tries++
    phase = 'planning'
    stage.hideOverlay()
    stats()
  }

  function add(cmd: Cmd) {
    if (phase === 'intro') return begin()
    if (phase !== 'planning') return stage.flash('Wait: the rover is busy on Mars', 'bad')
    if (plan.length >= spec.maxQueue) return stage.flash('The plan is full (' + spec.maxQueue + ' commands)', 'bad')
    plan = [...plan, cmd]
    sfx.tone(520 + plan.length * 20, 50, 'square', 0.08)
    stats()
  }
  function undo() {
    if (phase !== 'planning') return
    plan = plan.slice(0, -1)
    stats()
  }
  function clear() {
    if (phase !== 'planning') return
    plan = []
    stats()
  }
  function send() {
    if (phase === 'intro') return begin()
    if (phase !== 'planning') return
    if (plan.length === 0) return stage.flash('Add some commands first', 'bad')
    run = runPlan(grid, pose, plan)
    sent++
    commandsSent += plan.length
    stepIdx = 0
    phaseT = 0
    phase = 'uplink'
    lastNote = ''
    sfx.sweep(400, 900, 400, 'sine', 0.12)
    stats()
  }

  function finishRun() {
    if (!run) return
    run.seen.forEach((s) => seen.add(s))
    pose = run.end
    for (const st of run.steps) {
      stepsRun++
      if (st.result === 'moved' || st.result === 'turned' || st.result === 'measured') stepsOk++
      if (st.result === 'hazard') hazardStops++
      if (st.result === 'measured') apxsMeasured++
      if (st.result === 'missed') apxsMissed++
    }
    // APXS attempts are the level 2 decisions.
    if (levelKey === 2 && !practice) {
      for (const s of run.steps) if (s.cmd === 'A') decisions.push({ concept, correct: s.result === 'measured' })
    }
    const last = run.steps[run.steps.length - 1]
    if (run.stopped && last) {
      lastNote =
        last.result === 'hazard'
          ? 'The rover saw a rock the lander could not see and stopped by itself.'
          : 'The rover stopped in front of an obstacle and waited for new orders.'
    } else if (run.steps.some((s) => s.result === 'missed')) {
      lastNote = 'The APXS found nothing behind the rover. It is on the BACK!'
    } else lastNote = ''
    if (goalReached(spec, grid, run.end, run.measured)) return end(true)
    plan = []
    if (!practice && sol >= spec.sols) return end(false)
    sol++
    phase = 'planning'
    if (lastNote) stage.flash(lastNote.split('.')[0], 'bad')
    stats()
  }

  function end(won: boolean) {
    phase = 'done'
    if (!practice && levelKey !== 2) decisions.push({ concept, correct: won })
    if (!practice && levelKey === 2 && !decisions.some((d) => d.correct) && !won) decisions.push({ concept, correct: false })
    const score = practice || !won ? 0 : scorePlan(sol, spec.sols, commandsSent)
    if (won) sfx.sweep(520, 980, 360, 'triangle', 0.2)
    else sfx.sweep(320, 110, 400, 'sawtooth', 0.16)

    const lesson =
      levelKey === 1
        ? 'You could not steer live: the radio signal takes minutes to reach Mars, so you plan the moves and send them.'
        : levelKey === 2
          ? 'The APXS is on the back of the rover, so to measure a rock the rover has to back up to it.'
          : 'Orders arrive late, so the rover has to stop by itself in front of hazards and wait for the next plan.'
    const star = (v: boolean) => (v ? '★' : '☆')
    const lines = [
      `You used ${sol} sol${sol === 1 ? '' : 's'} and sent ${commandsSent} commands; ${stepsOk} of ${stepsRun} steps did what you planned.`,
      levelKey === 2
        ? `APXS tries: ${apxsMeasured} measured, ${apxsMissed} found nothing.`
        : hazardStops
          ? `The rover stopped by itself ${hazardStops} time${hazardStops === 1 ? '' : 's'} in front of a hazard it was never warned about: it saved itself, not your plan.`
          : 'No hazard stopped the rover: your plan got around every rock.',
      lesson,
      `Stars: ${star(won)} goal ${star(won && sol <= Math.max(1, spec.sols - 1))} few sols ${star(won && hazardStops === 0)} nothing left to autonomy`,
    ]
    stage.showOverlay({
      title: won ? (spec.goal.kind === 'measure' ? ROCK_NAMES[spec.goal.rock] + ' measured!' : 'Sojourner made it') : 'Out of sols',
      tone: won ? 'win' : 'lose',
      score: won && !practice ? score + ' points' : undefined,
      lines,
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
      gameId: 'sojourner-commands',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: won,
      evidenceIds: won ? (card?.evidence.map((e) => e.id) ?? []) : [],
      firstAnswerCorrect: won && tries === 1 && sol === 1,
      decisions: practice ? [] : decisions,
    })
  }

  // --- Input -------------------------------------------------------------------
  const KEYMAP: Record<string, Cmd> = { ArrowUp: 'F', KeyW: 'F', ArrowDown: 'B', KeyS: 'B', ArrowLeft: 'L', KeyQ: 'L', ArrowRight: 'R', KeyE: 'R', KeyA: 'A' }
  const offPress = input.onPress((code) => {
    if (phase === 'intro' && (code === 'Space' || code === 'Enter')) return begin()
    if (code === 'Enter' || code === 'Space') return send()
    if (code === 'Backspace') return undo()
    if (code === 'Delete' || code === 'KeyC') return clear()
    const cmd = KEYMAP[code]
    if (cmd && (cmd !== 'A' || levelKey > 1)) add(cmd)
  })

  const onDown = (e: PointerEvent) => {
    e.preventDefault()
    if (phase === 'intro') return begin()
    const p = toLogical(stage.canvas, e, W, H)
    for (const b of cmdButtons) if (inBox(p, b.box)) return add(b.cmd)
    if (inBox(p, BTN_UNDO)) return undo()
    if (inBox(p, BTN_CLEAR)) return clear()
    if (inBox(p, BTN_SEND)) return send()
  }
  stage.canvas.addEventListener('pointerdown', onDown)

  stage.setHint('Arrows add moves' + (levelKey > 1 ? ' · A adds APXS' : '') + ' · Backspace undoes · Enter sends the plan to Mars')

  // --- Loop ----------------------------------------------------------------------
  function update(dtMs: number) {
    if (phase === 'uplink' || phase === 'downlink') {
      phaseT += dtMs
      if (phaseT >= LINK_MS) {
        phaseT = 0
        if (phase === 'uplink') {
          phase = 'running'
          sfx.tone(700, 80, 'triangle', 0.1)
        } else finishRun()
      }
    } else if (phase === 'running' && run) {
      phaseT += dtMs
      if (phaseT >= STEP_MS) {
        phaseT = 0
        const s = run.steps[stepIdx]
        if (s) {
          if (s.result === 'moved') sfx.tone(300, 60, 'triangle', 0.06)
          if (s.result === 'blocked' || s.result === 'hazard') sfx.tone(180, 200, 'square', 0.1)
          if (s.result === 'measured') sfx.tone(1200, 200, 'sine', 0.12)
          if (s.result === 'missed') sfx.tone(240, 160, 'sawtooth', 0.08)
        }
        stepIdx++
        if (stepIdx > run.steps.length) {
          phase = 'downlink'
          phaseT = 0
        }
      }
    }
  }

  function stats() {
    stage.setStats([
      { key: 'sol', label: 'Sol', value: practice ? String(sol) : sol + ' / ' + spec.sols, tone: practice || sol < spec.sols ? 'ok' : 'warn' },
      { key: 'plan', label: 'Plan', value: plan.length + ' / ' + spec.maxQueue },
      { key: 'delay', label: 'Radio delay', value: spec.delayMin + ' min' },
      { key: 'sent', label: 'Plans sent', value: String(sent) },
    ])
  }

  // --- Drawing ---------------------------------------------------------------------
  const cx = (x: number) => GX + x * CELL + CELL / 2
  const cy = (y: number) => GY + y * CELL + CELL / 2

  function known(x: number, y: number): boolean {
    return landerSees(spec, grid, x, y) || seen.has(x + ',' + y)
  }

  /** Where the plan would take the rover, using only what Earth knows. */
  function preview(): Pose[] {
    const out: Pose[] = []
    let p = { ...pose }
    for (const cmd of plan) {
      if (cmd === 'L') p = { ...p, dir: ((p.dir + 3) % 4) as Pose['dir'] }
      else if (cmd === 'R') p = { ...p, dir: ((p.dir + 1) % 4) as Pose['dir'] }
      else if (cmd === 'F' || cmd === 'B') {
        const s = cmd === 'F' ? 1 : -1
        const nx = p.x + DX[p.dir] * s
        const ny = p.y + DY[p.dir] * s
        const ch = cellAt(grid, nx, ny)
        const believed = ch === 'h' && !known(nx, ny) ? '.' : ch
        if (!(believed === '.' || believed === 'S' || believed === 'G')) break
        p = { ...p, x: nx, y: ny }
      }
      out.push(p)
    }
    return out
  }

  function drawRover(p: Pose, ghost: boolean) {
    const x = cx(p.x)
    const y = cy(p.y)
    c.save()
    c.translate(x, y)
    c.rotate((p.dir * Math.PI) / 2)
    c.globalAlpha = ghost ? 0.35 : 1
    // body (front = up before rotation)
    c.fillStyle = '#d8d3c4'
    c.fillRect(-13, -16, 26, 30)
    c.fillStyle = '#2a3142'
    for (const wy of [-14, 0, 14]) {
      c.fillRect(-19, wy - 4, 6, 8)
      c.fillRect(13, wy - 4, 6, 8)
    }
    // solar panel
    c.fillStyle = '#35507a'
    c.fillRect(-11, -12, 22, 18)
    // front camera arrow
    c.fillStyle = COLORS.cyan
    c.beginPath()
    c.moveTo(0, -24)
    c.lineTo(-7, -16)
    c.lineTo(7, -16)
    c.closePath()
    c.fill()
    // APXS at the back
    if (levelKey > 1) {
      c.fillStyle = COLORS.gold
      c.beginPath()
      c.arc(0, 18, 5, 0, Math.PI * 2)
      c.fill()
    }
    c.restore()
  }

  function render() {
    c.fillStyle = COLORS.space
    c.fillRect(0, 0, W, H)

    // Grid
    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < grid.w; x++) {
        const ch = cellAt(grid, x, y)
        const px = GX + x * CELL
        const py = GY + y * CELL
        c.fillStyle = (x + y) % 2 ? '#b0703f' : '#a9693a'
        c.fillRect(px, py, CELL, CELL)
        if (ch === '#') drawRock(cx(x), cy(y), 18, '#5e3a26')
        if (ch === 'h' && known(x, y)) drawRock(cx(x), cy(y), 11, '#6b4430')
        if (ROCK_NAMES[ch]) {
          drawRock(cx(x), cy(y), 21, '#7d5038')
          text(c, ROCK_NAMES[ch], cx(x), py + CELL - 4, { size: 10, weight: 800, color: '#fff3dc', align: 'center' })
        }
        if (ch === 'G') {
          c.strokeStyle = COLORS.gold
          c.lineWidth = 3
          c.setLineDash([6, 4])
          c.strokeRect(px + 5, py + 5, CELL - 10, CELL - 10)
          c.setLineDash([])
        }
        // Big rocks show in the lander pictures even far away; small ones do not.
        if (!known(x, y) && ch !== '#' && !ROCK_NAMES[ch]) {
          c.fillStyle = 'rgba(5,6,10,0.62)'
          c.fillRect(px, py, CELL, CELL)
          text(c, '?', cx(x), cy(y) + 5, { size: 14, color: 'rgba(236,230,216,0.35)', align: 'center' })
        }
      }
    }
    // Lander
    const lx = cx(grid.lander.x)
    const ly = cy(grid.lander.y)
    c.fillStyle = '#9aa0ab'
    for (let i = 0; i < 3; i++) {
      // Three open solar 'petals' around the base, inside the lander's cells.
      const a = (i * Math.PI * 2) / 3 - Math.PI / 2
      c.beginPath()
      c.moveTo(lx + Math.cos(a - 0.62) * 16, ly + Math.sin(a - 0.62) * 16)
      c.lineTo(lx + Math.cos(a) * 50, ly + Math.sin(a) * 50)
      c.lineTo(lx + Math.cos(a + 0.62) * 16, ly + Math.sin(a + 0.62) * 16)
      c.closePath()
      c.fill()
    }
    c.fillStyle = '#d8d3c4'
    c.beginPath()
    c.arc(lx, ly, 17, 0, Math.PI * 2)
    c.fill()
    text(c, 'Lander', lx, ly + 4, { size: 10, weight: 800, color: '#20242e', align: 'center' })
    if (spec.landerSight !== null) {
      c.strokeStyle = 'rgba(117,203,209,0.5)'
      c.setLineDash([4, 6])
      c.beginPath()
      c.arc(lx, ly, spec.landerSight * CELL, 0, Math.PI * 2)
      c.stroke()
      c.setLineDash([])
    }

    // Plan preview (what Earth expects)
    if (phase === 'planning' && plan.length) {
      const pts = preview()
      c.strokeStyle = 'rgba(117,203,209,0.85)'
      c.lineWidth = 3
      c.setLineDash([5, 5])
      c.beginPath()
      c.moveTo(cx(pose.x), cy(pose.y))
      for (const p of pts) c.lineTo(cx(p.x), cy(p.y))
      c.stroke()
      c.setLineDash([])
      if (pts.length) drawRover(pts[pts.length - 1], true)
    }

    // Rover (animated while the plan runs)
    let shown = pose
    if (run && (phase === 'running' || phase === 'downlink')) {
      const i = Math.min(stepIdx, run.steps.length) - 1
      shown = i >= 0 ? run.steps[i].pose : pose
      const s = i >= 0 ? run.steps[i] : null
      if (s && (s.result === 'blocked' || s.result === 'hazard')) {
        const nx = s.pose.x + DX[s.pose.dir] * (s.cmd === 'B' ? -1 : 1)
        const ny = s.pose.y + DY[s.pose.dir] * (s.cmd === 'B' ? -1 : 1)
        c.strokeStyle = COLORS.bad
        c.lineWidth = 3
        c.strokeRect(GX + nx * CELL + 3, GY + ny * CELL + 3, CELL - 6, CELL - 6)
      }
      if (s && (s.result === 'measured' || s.result === 'missed')) {
        text(c, s.result === 'measured' ? 'APXS: measuring!' : 'APXS: nothing here', cx(s.pose.x), cy(s.pose.y) - 30, {
          size: 12,
          weight: 800,
          color: s.result === 'measured' ? COLORS.ok : '#ff9aa8',
          align: 'center',
        })
      }
    }
    drawRover(shown, false)

    drawPanel()
    drawLink()
    drawControls()
  }

  function drawRock(x: number, y: number, r: number, color: string) {
    c.fillStyle = color
    c.beginPath()
    c.ellipse(x, y, r, r * 0.8, 0.3, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = 'rgba(255,255,255,0.15)'
    c.beginPath()
    c.ellipse(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.25, 0.3, 0, Math.PI * 2)
    c.fill()
  }

  function drawPanel() {
    const x = PANEL_X
    c.fillStyle = COLORS.panel
    roundRect(c, x, GY, W - x - 10, grid.h * CELL, 8)
    c.fill()
    text(c, 'PLAN', x + 10, GY + 20, { size: 11, color: COLORS.dim })
    c.font = '700 9px Nunito, system-ui, sans-serif'
    const words = spec.goalText.split(' ')
    const lines: string[] = []
    let line = ''
    for (const w of words) {
      const t = line ? line + ' ' + w : w
      if (c.measureText(t).width > W - x - 30 && line) {
        lines.push(line)
        line = w
      } else line = t
    }
    if (line) lines.push(line)
    lines.slice(0, 3).forEach((l, i) => text(c, l, x + 10, GY + 34 + i * 11, { size: 9, color: COLORS.gold }))
    for (let i = 0; i < spec.maxQueue; i++) {
      const y = GY + 76 + i * 23
      const cmd = plan[i]
      const running = run && phase === 'running' && i === stepIdx - 1 && run.steps[i]
      c.fillStyle = running ? 'rgba(243,181,74,0.35)' : 'rgba(255,255,255,0.04)'
      c.fillRect(x + 6, y - 15, W - x - 22, 19)
      text(c, String(i + 1).padStart(2, ' '), x + 12, y, { size: 10, color: COLORS.dim })
      if (cmd) text(c, CMD_LABEL[cmd], x + 32, y, { size: 12, weight: 800 })
    }
    if (lastNote && phase === 'planning') {
      // short note under the plan
      text(c, 'Last sol:', x + 10, GY + grid.h * CELL - 20, { size: 9, color: '#ff9aa8' })
      text(c, lastNote.length > 26 ? lastNote.slice(0, 25) + '…' : lastNote, x + 10, GY + grid.h * CELL - 7, { size: 9, color: '#ff9aa8' })
    }
  }

  /** The radio link: a pulse travelling between Earth and Mars. */
  function drawLink() {
    if (phase !== 'uplink' && phase !== 'downlink') return
    const k = Math.min(1, phaseT / LINK_MS)
    const minutes = Math.round(k * spec.delayMin)
    const bx = GX + 40
    const by = GY + grid.h * CELL / 2 - 40
    const bw = grid.w * CELL - 80
    c.fillStyle = 'rgba(5,6,10,0.85)'
    roundRect(c, bx, by, bw, 80, 10)
    c.fill()
    c.strokeStyle = COLORS.line
    c.stroke()
    const up = phase === 'uplink'
    text(c, up ? 'Sending the plan to Mars…' : 'Pictures coming back to Earth…', bx + bw / 2, by + 24, { size: 14, weight: 800, align: 'center' })
    const x0 = bx + 30
    const x1 = bx + bw - 30
    const ly = by + 50
    c.fillStyle = '#2f6fb5'
    c.beginPath()
    c.arc(x0, ly, 9, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#d2501c'
    c.beginPath()
    c.arc(x1, ly, 7, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = 'rgba(236,230,216,0.25)'
    c.beginPath()
    c.moveTo(x0 + 12, ly)
    c.lineTo(x1 - 10, ly)
    c.stroke()
    const px = up ? x0 + (x1 - x0) * k : x1 - (x1 - x0) * k
    c.fillStyle = COLORS.gold
    c.beginPath()
    c.arc(px, ly, 5, 0, Math.PI * 2)
    c.fill()
    text(c, minutes + ' of ' + spec.delayMin + ' minutes', bx + bw / 2, by + 72, { size: 11, color: COLORS.dim, align: 'center' })
  }

  function drawControls() {
    const can = phase === 'planning'
    for (const b of cmdButtons) drawButton(c, b.box, b.cmd === 'A' ? 'APXS' : CMD_SHORT[b.cmd], { enabled: can, size: b.cmd === 'A' ? 15 : 22 })
    drawButton(c, BTN_UNDO, 'Undo', { enabled: can && plan.length > 0 })
    drawButton(c, BTN_CLEAR, 'Clear', { enabled: can && plan.length > 0 })
    drawButton(c, BTN_SEND, phase === 'planning' ? 'Send to Mars ▶' : 'Rover busy on Mars…', {
      primary: true,
      enabled: can && plan.length > 0,
      size: 17,
    })
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  stats()
  stage.showOverlay({
    title: (card?.title ?? 'Sojourner’s Plan') + ' · ' + spec.name,
    text: spec.intro,
    buttons: [{ label: 'Start planning', onClick: begin }],
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

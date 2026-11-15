import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { createInput, createLoop } from '../shared/loop'
import { createRng } from '../shared/rng'
import { createStage } from '../shared/stage'
import { COLORS, text } from '../shared/canvasui'
import {
  COLS,
  LEVELS,
  LM,
  ROWS,
  breathe,
  conceptFor,
  deploy,
  distToLM,
  goalMet,
  initialState,
  scoreWalk,
  step,
  turn,
  type Dir,
  type Event,
} from './rules'

const CELL = 30
const W = COLS * CELL
const H = ROWS * CELL

/**
 * LUNAR EXPRESS
 * -------------------------------------------------------------------------
 * A moonwalk in snake form. You learn to tell the Moon's two kinds of
 * ground apart by what you have to bring back (dark lava basalt on a mare,
 * bright old crust in the highlands), and that some hardware was left on
 * the Moon ON PURPOSE: science packages you set down and leave running.
 * No fact cards: the rule is the game, and every pick explains itself.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('snake-express')
  const levelKey = (ctx.levelId >= 1 && ctx.levelId <= 3 ? ctx.levelId : 1) as 1 | 2 | 3
  const spec = LEVELS[levelKey]
  const concept = conceptFor(levelKey)
  const rng = createRng(ctx.seed)
  const sfx = createSfx(ctx.settings.volume)
  const practice = ctx.settings.practice
  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#C8CEDA' })
  const input = createInput(stage.root)
  const c = stage.ctx
  const startedAt = performance.now()

  let s = initialState(spec, rng.next)
  let running = false
  let acc = 0
  let wrongRocks = 0
  let settled = false
  let note = ''
  let noteT = 0
  const decisions: { concept: string; correct: boolean }[] = []

  const say = (msg: string, secs = 3.5) => {
    note = msg
    noteT = secs
  }
  const decide = (correct: boolean) => {
    if (!practice) decisions.push({ concept, correct })
  }

  function handle(ev: Event) {
    if (ev.type === 'rock') {
      decide(ev.good)
      if (ev.good) {
        sfx.tone(760, 70, 'sine', 0.14)
        say(
          ev.kind === 'dark'
            ? levelKey === 1
              ? 'Dark basalt: cooled lava, the rock this sea is made of.'
              : 'Dark basalt rock collected.'
            : levelKey === 2
              ? 'Bright highland rock: the Moon\'s oldest crust.'
              : 'Bright highland rock collected.',
        )
      } else {
        wrongRocks++
        sfx.tone(240, 120, 'square', 0.12)
        stage.flash('Not the rock you need', 'bad')
        say(
          ev.kind === 'bright'
            ? 'Bright rock: a piece of highland crust thrown here by an impact. It is not the lava of this sea, and now it weighs on you.'
            : 'Dark basalt: lava that flooded the low plains later. The highlands\' oldest crust is the BRIGHT rock.',
          5,
        )
      }
    } else if (ev.type === 'deploy') {
      if (ev.ok) {
        decide(true)
        sfx.sweep(400, 900, 260, 'triangle', 0.16)
        say('Package set down. It stays here and keeps sending data after you leave.')
      } else {
        decide(false)
        stage.flash('Too close', 'bad')
        say(
          distToLM(ev.at) < spec.deployMin
            ? 'Too close to the lunar module: the liftoff blast would hit it. Walk farther out.'
            : 'Too close to another package. Spread them out.',
          4.5,
        )
      }
    } else if (ev.type === 'notReady') {
      const missing: string[] = []
      if (s.collected < spec.need) missing.push(spec.need - s.collected + ' more rock' + (spec.need - s.collected > 1 ? 's' : ''))
      if (s.deployed.length < spec.experiments) missing.push(spec.experiments - s.deployed.length + ' package(s) to set down')
      say('Not ready to leave: ' + missing.join(' and ') + '.', 3)
    } else if (ev.type === 'won') finish(true)
    else if (ev.type === 'lost') finish(false)
  }

  function stats() {
    stage.setStats([
      {
        key: 'rocks',
        label: spec.want === 'dark' ? 'Dark basalt' : spec.want === 'bright' ? 'Bright crust' : 'Rocks',
        value: s.collected + ' / ' + spec.need,
        meter: s.collected / spec.need,
      },
      ...(spec.experiments
        ? [{ key: 'exp', label: 'Packages set', value: s.deployed.length + ' / ' + spec.experiments }]
        : [{ key: 'carry', label: 'Carrying', value: s.cargo.length + ' item' + (s.cargo.length === 1 ? '' : 's') }]),
      {
        key: 'o2',
        label: practice ? 'Oxygen (practice)' : 'Oxygen',
        value: Math.ceil(s.oxygen) + ' s',
        meter: s.oxygen / spec.oxygen,
        tone: s.oxygen > spec.oxygen * 0.4 ? 'ok' : s.oxygen > spec.oxygen * 0.2 ? 'warn' : 'bad',
      },
      { key: 'goal', label: 'Then', value: goalMet(s, spec) ? 'Back to the LM!' : 'Keep exploring' },
    ])
  }

  function begin() {
    s = initialState(spec, rng.next)
    acc = 0
    running = true
    wrongRocks = 0
    stage.hideOverlay()
    say(spec.want === 'dark' ? 'Find the DARK rocks.' : spec.want === 'bright' ? 'Find the BRIGHT rocks.' : 'Space sets down a package.', 3)
    stats()
  }

  function finish(won: boolean) {
    running = false
    const score = practice ? 0 : scoreWalk(s, spec, wrongRocks)
    if (won) sfx.sweep(520, 980, 340, 'triangle', 0.22)
    else sfx.sweep(320, 120, 420, 'sawtooth', 0.18)
    stage.showOverlay({
      title: won ? 'Back in the lunar module' : 'Moonwalk over',
      tone: won ? 'win' : 'lose',
      score: won && !practice ? score + ' points' : undefined,
      text: won
        ? levelKey === 1
          ? 'You brought back the lava of the sea. The dark plains you can see on the Moon from Earth are these basalt lava flows.'
          : levelKey === 2
            ? 'You brought back the oldest crust. The bright parts of the Moon you see from Earth are these highlands.'
            : 'Your packages stay behind on purpose. Apollo\'s seismometers kept sending moonquake data to Earth until 1977.'
        : s.reason,
      fact: card?.fact,
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
      gameId: 'snake-express',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: won,
      evidenceIds: won ? (card?.evidence.map((e) => e.id) ?? []) : [],
      firstAnswerCorrect: won && decisions.every((d) => d.correct),
      decisions,
    })
  }

  // --- Input -------------------------------------------------------------------
  const KEYS: Record<string, Dir> = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  }
  const doDeploy = () => {
    if (!running || !spec.experiments) return
    const ev = deploy(s, spec)
    if (ev) handle(ev)
    else stage.flash('No packages left', 'bad')
  }
  const offPress = input.onPress((code) => {
    if (KEYS[code] && running) turn(s, KEYS[code])
    else if (code === 'Space') doDeploy()
  })
  const pad: [string, string, Dir | 'deploy'][] = [
    ['↑', 'Up', 'up'],
    ['←', 'Left', 'left'],
    ['→', 'Right', 'right'],
    ['↓', 'Down', 'down'],
  ]
  if (spec.experiments) pad.push(['Set down', 'Set down a package', 'deploy'])
  const padCleanup: (() => void)[] = []
  for (const [label, aria, act] of pad) {
    const el = stage.addTouchButton(label, aria)
    const h = (e: PointerEvent) => {
      e.preventDefault()
      if (act === 'deploy') doDeploy()
      else if (running) turn(s, act)
    }
    el.addEventListener('pointerdown', h)
    padCleanup.push(() => el.removeEventListener('pointerdown', h))
  }
  let swipe: { x: number; y: number } | null = null
  const onPDown = (e: PointerEvent) => {
    swipe = { x: e.clientX, y: e.clientY }
  }
  const onPUp = (e: PointerEvent) => {
    if (!swipe || !running) return
    const dx = e.clientX - swipe.x
    const dy = e.clientY - swipe.y
    swipe = null
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return doDeploy()
    turn(s, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
  }
  stage.canvas.addEventListener('pointerdown', onPDown)
  stage.canvas.addEventListener('pointerup', onPUp)
  stage.setHint(
    spec.experiments
      ? 'Arrows / WASD or swipe to walk · Space or tap sets down a package'
      : 'Arrows / WASD or swipe to walk · collect the right rocks · return to the lunar module',
  )

  // --- Loop ----------------------------------------------------------------------
  function update(dtMs: number) {
    if (!running) return
    noteT = Math.max(0, noteT - dtMs / 1000)
    if (!practice) {
      const ev = breathe(s, dtMs / 1000)
      if (ev) return handle(ev)
    }
    acc += dtMs
    while (acc >= spec.stepMs && running) {
      acc -= spec.stepMs
      for (const ev of step(s, spec, rng.next)) handle(ev)
    }
    stats()
  }

  function render() {
    // Ground: a mare is dark grey, the highlands are pale.
    c.fillStyle = levelKey === 2 ? '#9a9892' : levelKey === 1 ? '#565961' : '#6b6c71'
    c.fillRect(0, 0, W, H)
    c.fillStyle = 'rgba(255,255,255,0.04)'
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if ((x + y) % 2 === 0) c.fillRect(x * CELL, y * CELL, CELL, CELL)

    // Deploy ring around the LM (level 3).
    if (spec.deployMin) {
      c.strokeStyle = 'rgba(255,107,90,0.55)'
      c.setLineDash([5, 5])
      c.strokeRect((9 - spec.deployMin + 1) * CELL, (6 - spec.deployMin + 1) * CELL, (2 + 2 * (spec.deployMin - 1)) * CELL, (2 + 2 * (spec.deployMin - 1)) * CELL)
      c.setLineDash([])
      text(c, 'too close: liftoff blast', (9 - spec.deployMin + 1) * CELL + 6, (6 - spec.deployMin + 1) * CELL + 14, { size: 11, color: '#ffb0a6' })
    }

    // Craters
    for (const k of s.craters) {
      // Craters: a bright rim around a shadowed floor, unlike any rock.
      const cx = k.x * CELL + CELL / 2
      const cy = k.y * CELL + CELL / 2
      c.fillStyle = 'rgba(0,0,0,0.3)'
      c.beginPath()
      c.arc(cx, cy, CELL * 0.44, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = 'rgba(255,255,255,0.55)'
      c.lineWidth = 3
      c.beginPath()
      c.arc(cx, cy, CELL * 0.44, Math.PI * 1.05, Math.PI * 1.95)
      c.stroke()
    }

    // Lunar module
    const lx = LM[0].x * CELL
    const ly = LM[0].y * CELL
    c.fillStyle = '#d9a441'
    c.fillRect(lx + 6, ly + 18, CELL * 2 - 12, CELL * 2 - 26)
    c.fillStyle = '#c8ceda'
    c.fillRect(lx + 14, ly + 4, CELL * 2 - 28, 18)
    text(c, 'LM', lx + CELL, ly + CELL + 6, { size: 12, color: COLORS.ink, align: 'center' })

    // Deployed packages, still blinking: they keep working.
    const blink = Math.floor(performance.now() / 500) % 2 === 0
    for (const d of s.deployed) {
      c.fillStyle = COLORS.gold
      c.fillRect(d.x * CELL + 6, d.y * CELL + 8, CELL - 12, CELL - 14)
      if (blink) {
        c.fillStyle = COLORS.ok
        c.fillRect(d.x * CELL + CELL / 2 - 2, d.y * CELL + 2, 4, 4)
      }
    }

    // Rocks
    for (const r of s.rocks) {
      c.fillStyle = r.kind === 'dark' ? '#1d1f24' : '#f2efe6'
      c.strokeStyle = r.kind === 'dark' ? '#c9ccd3' : '#6d6a62'
      c.lineWidth = 2
      c.beginPath()
      c.moveTo(r.x * CELL + 7, r.y * CELL + CELL - 7)
      c.lineTo(r.x * CELL + 10, r.y * CELL + 9)
      c.lineTo(r.x * CELL + CELL - 8, r.y * CELL + 7)
      c.lineTo(r.x * CELL + CELL - 6, r.y * CELL + CELL - 8)
      c.closePath()
      c.fill()
      c.stroke()
    }

    // Explorer and what they carry
    s.body.forEach((b, i) => {
      if (i === 0) {
        c.fillStyle = '#ffffff'
        c.beginPath()
        c.arc(b.x * CELL + CELL / 2, b.y * CELL + CELL / 2, CELL * 0.42, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = COLORS.gold
        c.fillRect(b.x * CELL + 9, b.y * CELL + 10, CELL - 18, 7)
        return
      }
      const cargoIdx = i - 3
      const cargo = cargoIdx >= 0 ? s.cargo[cargoIdx] : undefined
      c.fillStyle = cargo === 'dark' ? '#1d1f24' : cargo === 'bright' ? '#f2efe6' : cargo === 'experiment' ? COLORS.gold : '#cfd5df'
      c.fillRect(b.x * CELL + 5, b.y * CELL + 5, CELL - 10, CELL - 10)
    })

    if (noteT > 0 && note) {
      c.fillStyle = 'rgba(13,16,23,0.9)'
      c.fillRect(10, H - 46, W - 20, 36)
      text(c, note, W / 2, H - 23, { size: 13, align: 'center' })
    }
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  stats()
  stage.showOverlay({
    title: (card?.title ?? 'Lunar Express') + ' · ' + spec.name,
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
      stage.canvas.removeEventListener('pointerdown', onPDown)
      stage.canvas.removeEventListener('pointerup', onPUp)
      for (const fn of padCleanup) fn()
      input.destroy()
      sfx.destroy()
      stage.destroy()
      return Promise.resolve()
    },
  }
}

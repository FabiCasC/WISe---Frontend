import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { createInput, createLoop } from '../shared/loop'
import { createStage } from '../shared/stage'
import { TERMS } from './terms'
import { CELL, SUN_LEVELS } from './levels'
import {
  cellRange,
  createBody,
  openChannels,
  overlapsCell,
  parseLevel,
  scoreSun,
  STOP_REASON,
  stepBody,
  touchesLethal,
  type Body,
  type LevelState,
  type Who,
} from './rules'

/**
 * SOL Y SOMBRA
 * -------------------------------------------------------------------------
 * Dos rovers con fuentes de energia opuestas. El SOLAR se apaga en la sombra;
 * el NUCLEAR no depende del Sol, pero su RTG lo hace grande y no cabe por los
 * huecos bajos. Cada uno pasa por donde el otro no puede, y cada puerta se
 * abre desde una placa del lado del OTRO, asi que el nivel solo se termina
 * llevando a LOS DOS a su escotilla.
 *
 * Dos jugadores en el mismo teclado (WASD y flechas), o una sola persona
 * moviendo un rover y luego el otro: nada obliga a ser dos.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('sun-shade')
  // Contrato v2: LevelId es number; este juego tiene los niveles 1 a 3.
  const spec = SUN_LEVELS[ctx.levelId as 1 | 2 | 3] ?? SUN_LEVELS[1]
  const sfx = createSfx(ctx.settings.volume)
  const reduced = ctx.settings.reducedMotion
  const practice = ctx.settings.practice

  let level: LevelState = parseLevel(spec.map)
  const W = level.w * CELL
  const H = level.h * CELL

  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#F2A65A' })
  stage.setGlossary(TERMS)
  const input = createInput(stage.root)
  const startedAt = performance.now()

  type Phase = 'intro' | 'playing' | 'dying' | 'won'
  let phase: Phase = 'intro'

  const bodies: Record<Who, Body> = {
    solar: createBody(level.start.solar.x, level.start.solar.y),
    nuclear: createBody(level.start.nuclear.x, level.start.nuclear.y),
  }

  let gemsTaken = 0
  const totalGems = level.gems.length
  let resets = 0
  /** Stops by rover, to say in the recap who stopped where and why. */
  const stops: Record<Who, number> = { solar: 0, nuclear: 0 }
  let elapsed = 0
  let dyingMs = 0
  let settled = false
  /** Rover que gobiernan los botones tactiles. */
  let active: Who = 'solar'
  /** Particulas del reinicio: puro acompanamiento visual. */
  let sparks: { x: number; y: number; vx: number; vy: number; life: number; hue: string }[] = []

  // --- Ciclo ----------------------------------------------------------------
  function placeBodies() {
    for (const who of ['solar', 'nuclear'] as Who[]) {
      const s = level.start[who]
      const b = createBody(s.x, s.y)
      Object.assign(bodies[who], b)
    }
  }

  /** Reinicia posiciones y placas. Las muestras ya recogidas se conservan. */
  function softReset(withPenalty: boolean) {
    if (withPenalty) resets++
    for (const p of level.plates) p.on = false
    placeBodies()
    phase = 'playing'
  }

  function restartLevel() {
    level = parseLevel(spec.map)
    gemsTaken = 0
    resets = 0
    stops.solar = 0
    stops.nuclear = 0
    elapsed = 0
    sparks = []
    placeBodies()
    phase = 'playing'
    stage.hideOverlay()
    sfx.tone(520, 90, 'triangle', 0.16)
  }

  function currentScore(completed: boolean) {
    if (practice) return 0
    return scoreSun({
      gems: gemsTaken,
      totalGems,
      seconds: elapsed / 1000,
      resets,
      completed,
    })
  }

  /** Each stop is a wrong call about power sources; the win is the right one. */
  const decisions: { concept: string; correct: boolean }[] = []

  function complete(score: number) {
    if (settled) return
    settled = true
    ctx.onComplete({
      gameId: 'sun-shade',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: true,
      evidenceIds: card?.evidence.map((e) => e.id) ?? [],
      // Sin un solo apagon y con todas las muestras.
      firstAnswerCorrect: resets === 0 && gemsTaken === totalGems,
      decisions: [...decisions, { concept: 'solar-vs-nuclear', correct: true }],
    })
  }

  function win() {
    if (phase === 'won') return
    phase = 'won'
    const score = currentScore(true)
    sfx.sweep(520, 980, 360, 'triangle', 0.22)

    const secs = Math.round(elapsed / 1000)
    const stopsLine =
      resets + stops.solar + stops.nuclear === 0
        ? 'No stops: every shade went to the nuclear rover and every low gap to the solar rover.'
        : `Stops: the solar rover ${stops.solar}, the nuclear rover ${stops.nuclear}. ${stops.solar ? 'The solar rover stops in shade because its panels need light. ' : ''}${stops.nuclear ? 'The nuclear rover stops at low gaps because it is too big, not because of power. ' : ''}`.trim()
    const star = (ok: boolean) => (ok ? '★' : '☆')
    stage.showOverlay({
      title: 'Both rovers made it',
      tone: 'win',
      score: practice ? undefined : score + ' points',
      lines: [
        `You took ${gemsTaken} of ${totalGems} samples in ${secs} s.`,
        stopsLine,
        (level.gates.length
          ? 'Each door opened from a plate only the other rover could reach. '
          : 'Each rover crossed the ground the other one could not. ') +
          'A solar panel needs light; a nuclear generator (RTG) makes power from heat, day or night, but makes the rover too big for a low gap.',
        `Stars: ${star(true)} both through ${star(stops.solar + stops.nuclear === 0)} no stops ${star(gemsTaken === totalGems)} all samples`,
      ],
      buttons: [{ label: 'Save and continue', onClick: () => complete(score) }],
    })
  }

  function kill(who: Who) {
    if (phase !== 'playing') return
    const b = bodies[who]
    if (!b.alive) return
    b.alive = false
    phase = 'dying'
    dyingMs = 620
    sfx.sweep(380, 90, 420, 'sawtooth', 0.2)
    stops[who]++
    decisions.push({ concept: 'solar-vs-nuclear', correct: false })
    // Texto en rules.ts: la explicacion es ciencia, y alli la vigilan los tests.
    stage.flash(STOP_REASON[who], 'bad')

    if (!reduced) {
      const hue = who === 'solar' ? '#ffd27a' : '#c6a8ff'
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2
        sparks.push({
          x: b.x + b.w / 2,
          y: b.y + b.h / 2,
          vx: Math.cos(a) * (60 + Math.random() * 90),
          vy: Math.sin(a) * (60 + Math.random() * 90) - 40,
          life: 1,
          hue,
        })
      }
    }
  }

  // --- Entrada --------------------------------------------------------------
  // Dos jugadores a la vez: WASD mueve al solar, las flechas al nuclear.
  const KEYS: Record<Who, { left: string[]; right: string[]; jump: string[] }> = {
    solar: { left: ['KeyA'], right: ['KeyD'], jump: ['KeyW'] },
    nuclear: { left: ['ArrowLeft'], right: ['ArrowRight'], jump: ['ArrowUp'] },
  }

  const held = (codes: string[]) => codes.some((c) => input.held.has(c))

  /** Saltos pedidos este frame (se consumen al aplicarlos). */
  const jumpQueued: Record<Who, boolean> = { solar: false, nuclear: false }
  /** Salto del mando tactil mientras se mantiene pulsado. */
  const touch = { left: false, right: false, jump: false }

  const offPress = input.onPress((code) => {
    if (phase === 'intro' && (code === 'Space' || code === 'Enter')) {
      restartLevel()
      return
    }
    if (code === 'KeyR' && (phase === 'playing' || phase === 'dying')) {
      softReset(true)
      return
    }
    if (code === 'Tab' || code === 'KeyQ') {
      active = active === 'solar' ? 'nuclear' : 'solar'
      return
    }
    if (phase !== 'playing') return
    if (KEYS.solar.jump.includes(code)) jumpQueued.solar = true
    if (KEYS.nuclear.jump.includes(code)) jumpQueued.nuclear = true
  })

  // Mando tactil: mueve al rover seleccionado; el boton "Cambiar" alterna.
  const padDefs: [string, string, 'left' | 'right' | 'jump' | 'swap'][] = [
    ['<', 'Move left', 'left'],
    ['>', 'Move right', 'right'],
    ['^', 'Jump', 'jump'],
    ['Swap', 'Switch rover', 'swap'],
  ]
  const padCleanup: (() => void)[] = []
  for (const [label, aria, kind] of padDefs) {
    const el = stage.addTouchButton(label, aria)
    if (kind === 'swap') {
      const onTap = (e: PointerEvent) => {
        e.preventDefault()
        if (phase === 'intro') restartLevel()
        else active = active === 'solar' ? 'nuclear' : 'solar'
      }
      el.addEventListener('pointerdown', onTap)
      padCleanup.push(() => el.removeEventListener('pointerdown', onTap))
      continue
    }
    const down = (e: PointerEvent) => {
      e.preventDefault()
      if (phase === 'intro') {
        restartLevel()
        return
      }
      if (kind === 'jump') jumpQueued[active] = true
      touch[kind] = true
    }
    const up = () => {
      touch[kind] = false
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', up)
    padCleanup.push(() => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerleave', up)
    })
  }

  stage.setHint('Solar: A D W  ·  Nuclear: arrows  ·  R restarts  ·  both must reach home')

  // --- Simulacion -----------------------------------------------------------
  function update(dtMs: number) {
    if (phase === 'dying') {
      dyingMs -= dtMs
      updateSparks(dtMs)
      if (dyingMs <= 0) {
        for (const who of ['solar', 'nuclear'] as Who[]) bodies[who].alive = true
        softReset(true)
      }
      return
    }
    if (phase !== 'playing') {
      updateSparks(dtMs)
      return
    }

    const dt = dtMs / 1000
    elapsed += dtMs
    updateSparks(dtMs)

    const open = openChannels(level)

    for (const who of ['solar', 'nuclear'] as Who[]) {
      const b = bodies[who]
      const k = KEYS[who]
      const isActive = who === active

      const cmd = {
        left: held(k.left) || (isActive && touch.left),
        right: held(k.right) || (isActive && touch.right),
        jump: jumpQueued[who],
        jumpHeld: held(k.jump) || (isActive && touch.jump),
      }
      jumpQueued[who] = false

      stepBody(level, b, cmd, dt, open)

      if (b.home) continue

      // Terreno mortal.
      if (touchesLethal(level, b, who)) {
        kill(who)
        return
      }

      // Caer fuera del mapa (no deberia pasar, pero nunca se deja al azar).
      const r = cellRange(b)
      if (r.y0 >= level.h || r.y1 < 0) {
        kill(who)
        return
      }

      // Muestras.
      for (const gem of level.gems) {
        if (gem.taken || !overlapsCell(b, gem.x, gem.y)) continue
        gem.taken = true
        gemsTaken++
        stage.flash('+ sample')
        sfx.tone(820 + gemsTaken * 25, 70, 'sine', 0.14)
      }

      // Placas: interruptores, se quedan encendidos.
      for (const plate of level.plates) {
        if (plate.on || !overlapsCell(b, plate.x, plate.y)) continue
        plate.on = true
        stage.flash('Door open')
        sfx.sweep(300, 760, 260, 'triangle', 0.18)
      }

      // Escotilla propia: hay que estar encima y apoyado.
      const ex = level.exit[who]
      b.home = overlapsCell(b, ex.x, ex.y) && b.onGround
    }

    if (bodies.solar.home && bodies.nuclear.home) {
      win()
      return
    }

    const secs = Math.floor(elapsed / 1000)
    stage.setStats([
      {
        key: 'solar',
        label: 'Solar rover',
        value: bodies.solar.home ? 'home' : 'out',
        tone: bodies.solar.home ? 'ok' : undefined,
      },
      {
        key: 'nuclear',
        label: 'Nuclear rover',
        value: bodies.nuclear.home ? 'home' : 'out',
        tone: bodies.nuclear.home ? 'ok' : undefined,
      },
      {
        key: 'gemas',
        label: 'Samples',
        value: gemsTaken + ' / ' + totalGems,
        meter: totalGems ? gemsTaken / totalGems : 0,
      },
      {
        key: 'tiempo',
        label: 'Time',
        value: String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0'),
      },
      {
        key: 'resets',
        label: 'Stops',
        value: String(resets),
        tone: resets > 0 ? 'warn' : undefined,
      },
    ])
  }

  function updateSparks(dtMs: number) {
    if (!sparks.length) return
    const dt = dtMs / 1000
    for (const s of sparks) {
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.vy += 900 * dt
      s.life -= dt * 1.6
    }
    sparks = sparks.filter((s) => s.life > 0)
  }

  // --- Dibujo ---------------------------------------------------------------
  const c = stage.ctx

  function drawTiles() {
    const open = openChannels(level)
    const wob = reduced ? 0 : Math.sin(elapsed / 420)

    for (let cy = 0; cy < level.h; cy++) {
      for (let cx = 0; cx < level.w; cx++) {
        const t = level.grid[cy][cx]
        const x = cx * CELL
        const y = cy * CELL

        if (t === '#') {
          c.fillStyle = '#3a2f4e'
          c.fillRect(x, y, CELL, CELL)
          c.fillStyle = 'rgba(255,255,255,0.07)'
          c.fillRect(x, y, CELL, 3)
          c.fillStyle = 'rgba(0,0,0,0.22)'
          c.fillRect(x, y + CELL - 3, CELL, 3)
          continue
        }

        if (t === 'L') {
          // Hueco bajo: una visera de roca deja pasar al solar (plano) y
          // detiene al nuclear, que es mas alto. Se dibuja ARRIBA de la celda
          // para que se lea como techo, no como suelo blando.
          // El techo mide 7 px: el panel plano del solar empieza en +9 y pasa
          // justo por debajo; el nucleo del nuclear sobresale y choca.
          const g = c.createLinearGradient(0, y, 0, y + 7)
          g.addColorStop(0, '#4a3d63')
          g.addColorStop(1, 'rgba(58,47,78,0.7)')
          c.fillStyle = g
          c.fillRect(x, y, CELL, 7)
          c.fillStyle = 'rgba(28,22,42,0.55)'
          for (let k = 2; k < CELL; k += 7) {
            c.beginPath()
            c.moveTo(x + k, y + 7)
            c.lineTo(x + k + 3.5, y + 7)
            c.lineTo(x + k + 1.75, y + 9)
            c.closePath()
            c.fill()
          }
          // Marcas del hueco libre, para que se vea por donde si se pasa.
          c.strokeStyle = 'rgba(242,166,90,0.5)'
          c.lineWidth = 1
          c.beginPath()
          c.moveTo(x, y + 15 + wob * 0.8)
          c.lineTo(x + CELL, y + 15 + wob * 0.8)
          c.stroke()
          continue
        }

        if (t === 'S') {
          // Zona de sombra: segura para el nuclear.
          const g = c.createLinearGradient(0, y, 0, y + CELL)
          g.addColorStop(0, 'rgba(96,78,170,0.92)')
          g.addColorStop(1, 'rgba(40,30,90,0.92)')
          c.fillStyle = g
          c.fillRect(x, y + 6, CELL, CELL - 6)
          c.fillStyle = 'rgba(176,150,255,0.85)'
          c.fillRect(x, y + 5 - wob * 1.5, CELL, 3)
          continue
        }

        if (t === 'X') {
          // Polvo: mortal para los dos.
          c.fillStyle = 'rgba(150,96,62,0.9)'
          c.fillRect(x, y + 8, CELL, CELL - 8)
          c.fillStyle = 'rgba(214,160,110,0.85)'
          for (let i = 0; i < 3; i++) {
            const px = x + 5 + i * 10
            const py = y + 10 + (reduced ? 0 : Math.sin(elapsed / 200 + i + cx) * 3)
            c.beginPath()
            c.arc(px, py, 3, 0, Math.PI * 2)
            c.fill()
          }
          continue
        }

        if (t === 'D' || t === 'E') {
          const channel = t === 'D' ? 1 : 2
          const isOpen = open.has(channel)
          const color = channel === 1 ? '#f2a65a' : '#9fd8e8'
          if (isOpen) {
            // Abierta: solo quedan las guias.
            c.strokeStyle = color
            c.globalAlpha = 0.35
            c.lineWidth = 2
            c.strokeRect(x + 3, y + 2, CELL - 6, CELL - 4)
            c.globalAlpha = 1
          } else {
            c.fillStyle = color
            c.globalAlpha = 0.85
            c.fillRect(x + 3, y + 2, CELL - 6, CELL - 4)
            c.globalAlpha = 1
            c.fillStyle = 'rgba(0,0,0,0.25)'
            for (let i = 0; i < 3; i++) c.fillRect(x + 3, y + 7 + i * 8, CELL - 6, 3)
          }
          continue
        }
      }
    }
  }

  function drawPlates() {
    for (const p of level.plates) {
      const x = p.x * CELL
      const y = p.y * CELL
      const color = p.channel === 1 ? '#f2a65a' : '#9fd8e8'
      c.fillStyle = 'rgba(0,0,0,0.3)'
      c.fillRect(x + 4, y + CELL - 9, CELL - 8, 7)
      c.fillStyle = color
      c.globalAlpha = p.on ? 1 : 0.55
      c.fillRect(x + 6, y + CELL - (p.on ? 6 : 10), CELL - 12, p.on ? 4 : 6)
      c.globalAlpha = 1
      if (p.on && !reduced) {
        c.strokeStyle = color
        c.globalAlpha = 0.45
        c.lineWidth = 2
        c.beginPath()
        c.arc(x + CELL / 2, y + CELL - 6, 10 + Math.sin(elapsed / 220) * 3, Math.PI, 0)
        c.stroke()
        c.globalAlpha = 1
      }
    }
  }

  function drawGems() {
    for (const gem of level.gems) {
      if (gem.taken) continue
      const cx = gem.x * CELL + CELL / 2
      const cy = gem.y * CELL + CELL / 2 + (reduced ? 0 : Math.sin(elapsed / 300 + gem.x) * 3)
      c.save()
      c.translate(cx, cy)
      c.rotate(Math.PI / 4)
      const g = c.createLinearGradient(-7, -7, 7, 7)
      g.addColorStop(0, '#bff3ff')
      g.addColorStop(1, '#58b9d4')
      c.fillStyle = g
      c.fillRect(-7, -7, 14, 14)
      c.strokeStyle = 'rgba(255,255,255,0.8)'
      c.lineWidth = 1.5
      c.strokeRect(-7, -7, 14, 14)
      c.restore()
    }
  }

  function drawExit(who: Who) {
    const e = level.exit[who]
    const x = e.x * CELL
    const y = e.y * CELL
    const color = who === 'solar' ? '#ffd27a' : '#c6a8ff'
    const done = bodies[who].home

    c.strokeStyle = color
    c.lineWidth = 2
    c.globalAlpha = done ? 1 : 0.65
    // Escotilla: arco con su base.
    c.beginPath()
    c.arc(x + CELL / 2, y + CELL - 6, 11, Math.PI, 0)
    c.stroke()
    c.beginPath()
    c.moveTo(x + 5, y + CELL - 5)
    c.lineTo(x + CELL - 5, y + CELL - 5)
    c.stroke()
    if (!reduced) {
      const p = (elapsed / 900) % 1
      c.globalAlpha = (1 - p) * (done ? 0.7 : 0.35)
      c.beginPath()
      c.arc(x + CELL / 2, y + CELL - 6, 11 + p * 14, Math.PI, 0)
      c.stroke()
    }
    c.globalAlpha = 1
  }

  function drawRover(who: Who) {
    const b = bodies[who]
    if (!b.alive) return

    const x = b.x
    const y = b.y
    const solar = who === 'solar'
    const body = solar ? '#e8c98f' : '#b9a6e0'
    const accent = solar ? '#ffd27a' : '#c6a8ff'

    c.save()
    if (b.home) c.globalAlpha = 0.55

    // Sombra de apoyo.
    c.fillStyle = 'rgba(0,0,0,0.3)'
    c.beginPath()
    c.ellipse(x + b.w / 2, y + b.h + 2, b.w * 0.5, 3, 0, 0, Math.PI * 2)
    c.fill()

    // Chasis.
    c.fillStyle = body
    c.fillRect(x, y + 8, b.w, b.h - 12)

    // Lo que distingue a cada rover: panel solar plano, o nucleo que brilla.
    if (solar) {
      c.fillStyle = accent
      c.fillRect(x - 3, y + 3, b.w + 6, 5)
      c.strokeStyle = 'rgba(0,0,0,0.25)'
      c.lineWidth = 1
      for (let i = 1; i < 3; i++) {
        c.beginPath()
        c.moveTo(x - 3 + ((b.w + 6) / 3) * i, y + 3)
        c.lineTo(x - 3 + ((b.w + 6) / 3) * i, y + 8)
        c.stroke()
      }
    } else {
      const pulse = reduced ? 1 : 0.75 + Math.sin(elapsed / 200) * 0.25
      c.fillStyle = accent
      c.beginPath()
      c.arc(x + b.w / 2, y + 6, 5 * pulse, 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 0.3 * pulse
      c.beginPath()
      c.arc(x + b.w / 2, y + 6, 10 * pulse, 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = b.home ? 0.55 : 1
    }

    // Ruedas, girando segun el avance.
    const spin = (x / 6) % (Math.PI * 2)
    c.fillStyle = '#2f2a42'
    for (const wx of [x + 4, x + b.w - 4]) {
      c.beginPath()
      c.arc(wx, y + b.h - 3, 4, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = 'rgba(255,255,255,0.45)'
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(wx, y + b.h - 3)
      c.lineTo(wx + Math.cos(spin) * 3, y + b.h - 3 + Math.sin(spin) * 3)
      c.stroke()
    }

    // Ojo/camara mirando hacia donde avanza.
    c.fillStyle = '#ffffff'
    c.beginPath()
    c.arc(x + b.w / 2 + b.dir * 4, y + 13, 2.4, 0, Math.PI * 2)
    c.fill()

    // Aro del rover que gobierna el mando tactil.
    if (who === active) {
      c.strokeStyle = accent
      c.globalAlpha = 0.5
      c.lineWidth = 1.5
      c.strokeRect(x - 4, y - 2, b.w + 8, b.h + 6)
    }
    c.restore()
  }

  function render() {
    // Fondo de cueva.
    const g = c.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#191440')
    g.addColorStop(1, '#0d0a28')
    c.fillStyle = g
    c.fillRect(0, 0, W, H)

    drawTiles()
    drawPlates()
    drawExit('solar')
    drawExit('nuclear')
    drawGems()
    drawRover('solar')
    drawRover('nuclear')

    for (const s of sparks) {
      c.globalAlpha = Math.max(0, s.life)
      c.fillStyle = s.hue
      c.beginPath()
      c.arc(s.x, s.y, 2.5 * s.life, 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = 1
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  stage.setStats([
    { key: 'solar', label: 'Solar rover', value: 'out' },
    { key: 'nuclear', label: 'Nuclear rover', value: 'out' },
    { key: 'gemas', label: 'Samples', value: '0 / ' + totalGems, meter: 0 },
    { key: 'tiempo', label: 'Time', value: '00:00' },
    { key: 'resets', label: 'Stops', value: '0' },
  ])

  stage.showOverlay({
    title: (card?.title ?? 'Sun and Shade') + ' · ' + spec.name,
    text:
      spec.hint +
      ' Get BOTH rovers to their hatch. Solar: A D W. Nuclear: arrows. R restarts.',
    buttons: [{ label: 'Start', onClick: restartLevel }],
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
      for (const fn of padCleanup) fn()
      input.destroy()
      sfx.destroy()
      stage.destroy()
      return Promise.resolve()
    },
  }
}

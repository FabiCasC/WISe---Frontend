import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { createInput, createLoop } from '../shared/loop'
import { createRng } from '../shared/rng'
import { createStage } from '../shared/stage'
import { MAZE_LEVELS } from './maps'
import { TERMS } from './terms'
import {
  canGo,
  chooseGhostDir,
  createMover,
  devilSpeed,
  dustAfterRespawn,
  key,
  moverPos,
  parseMaze,
  panelPower,
  roverSpeed,
  scoreMaze,
  stepMover,
  CLEAN_MIN_DUST,
  SMART_CLEAN_DUST,
  type Dir,
  type Mover,
} from './rules'

/** Tamano de casilla en coordenadas logicas. */
const CELL = 34
/** Alto reservado para el marco del laberinto. */
const PAD = 10

/**
 * LABERINTO DE GUSEV
 * -------------------------------------------------------------------------
 * El rover recorre el crater recogiendo muestras. El polvo se va posando en
 * sus paneles: cada vez hay menos energia y el rover va mas lento, y si los
 * cubre del todo se detiene. Los remolinos de polvo NO son enemigos: cruzarse
 * con uno limpia los paneles, como les paso de verdad a Spirit y Opportunity
 * ("eventos de limpieza"). La estrategia es ir a buscarlos cuando hace falta.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('gusev-maze')
  // Contrato v2: LevelId es number; este juego tiene los niveles 1 a 3.
  const tuning = MAZE_LEVELS[ctx.levelId as 1 | 2 | 3] ?? MAZE_LEVELS[1]
  const rng = createRng(ctx.seed)
  const sfx = createSfx(ctx.settings.volume)
  const reduced = ctx.settings.reducedMotion
  const practice = ctx.settings.practice

  const maze = parseMaze(tuning.map)
  const stage = createStage(container, {
    width: maze.w * CELL + PAD * 2,
    height: maze.h * CELL + PAD * 2,
    accent: card?.accent ?? '#F2A65A',
  })
  stage.setGlossary(TERMS)
  const input = createInput(stage.root)
  const startedAt = performance.now()

  type Phase = 'intro' | 'playing' | 'caught' | 'over' | 'won'
  let phase: Phase = 'intro'

  const START_LIVES = 3
  let lives = START_LIVES
  let pelletsTaken = 0
  let powersTaken = 0
  let scattered = 0
  let cleanMs = 0
  /** Polvo en los paneles, 0..1. */
  let dust = 0
  let respawnMs = 0
  const decisions: { concept: string; correct: boolean }[] = []
  const CONCEPT = 'remolinos-limpian-paneles'
  /** Power (%) before each cleaning event, for the recap. */
  const cleanings: number[] = []
  /** A key moment: power is low and a dust devil is close. It ends in use (correct) or in leaving it (wrong). */
  let moment = false
  let momentsDecided = 0
  let momentsUsed = 0
  const MOMENT_DUST = 0.5
  const resolveMoment = (correct: boolean) => {
    if (!moment) return
    moment = false
    momentsDecided++
    if (correct) momentsUsed++
    if (!practice) decisions.push({ concept: CONCEPT, correct })
  }
  let elapsed = 0
  let settled = false

  const player: Mover = createMover(maze.start.x, maze.start.y)

  interface Ghost {
    mover: Mover
    hue: string
    /** Dispersado: vuelve a casa y no hace dano por un rato. */
    goneMs: number
    /** Retraso de salida de la casa, en ms. */
    waitMs: number
    /** Antirrepeticion del aviso "paneles ya limpios", en ms. */
    brushedMs: number
    corner: { x: number; y: number }
  }

  const GHOST_COLORS = ['#f2a65a', '#e8738a', '#9c7bd6', '#7ed0e2']
  const CORNERS = [
    { x: 1, y: 1 },
    { x: maze.w - 2, y: 1 },
    { x: 1, y: maze.h - 2 },
    { x: maze.w - 2, y: maze.h - 2 },
  ]

  let ghosts: Ghost[] = []

  function spawnGhosts() {
    ghosts = Array.from({ length: tuning.ghosts }, (_, i) => {
      const home = maze.home[i % maze.home.length]
      return {
        mover: createMover(home.x, home.y),
        hue: GHOST_COLORS[i % GHOST_COLORS.length],
        goneMs: 0,
        brushedMs: 0,
        // Salen escalonados y con margen: el jugador necesita unos segundos
        // para orientarse en el mapa antes de tener a uno encima.
        waitMs: 2600 + i * 1600,
        corner: CORNERS[i % CORNERS.length],
      }
    })
  }

  /**
   * Vuelve a colocar a todos tras perder una vida, sin tocar las muestras.
   * NO toca el polvo: quien llama decide cuanto se conserva.
   */
  function resetPositions() {
    player.x = maze.start.x
    player.y = maze.start.y
    player.tx = player.x
    player.ty = player.y
    player.t = 0
    player.dir = 'none'
    player.want = 'none'
    spawnGhosts()
    cleanMs = 0
  }

  function resetAll() {
    // Las muestras se reponen: una partida nueva empieza con el mapa lleno.
    const fresh = parseMaze(tuning.map)
    maze.pellets = fresh.pellets
    maze.powers = fresh.powers
    lives = START_LIVES
    pelletsTaken = 0
    powersTaken = 0
    scattered = 0
    elapsed = 0
    respawnMs = 0
    resetPositions()
    // Partida nueva: paneles limpios. Un respawn por polvo no, ver update().
    dust = 0
    cleanings.length = 0
    moment = false
    momentsDecided = 0
    momentsUsed = 0
  }

  function begin() {
    resetAll()
    phase = 'playing'
    stage.hideOverlay()
    sfx.tone(560, 90, 'triangle', 0.16)
  }

  function currentScore(won: boolean) {
    if (practice) return 0
    return scoreMaze({
      pellets: pelletsTaken,
      powers: powersTaken,
      scattered,
      livesLeft: lives,
      completed: won,
    })
  }

  function complete(won: boolean, score: number) {
    if (settled) return
    settled = true
    ctx.onComplete({
      gameId: 'gusev-maze',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: won,
      evidenceIds: won ? (card?.evidence.map((e) => e.id) ?? []) : [],
      firstAnswerCorrect: won && lives === START_LIVES,
      decisions,
    })
  }

  function finish(won: boolean) {
    if (phase === 'won' || phase === 'over') return
    phase = won ? 'won' : 'over'
    const score = currentScore(won)

    if (won) sfx.sweep(520, 980, 360, 'triangle', 0.22)
    else sfx.sweep(300, 80, 460, 'sawtooth', 0.22)

    const left = maze.pellets.size + maze.powers.size

    // Igual que en el resto del arcade: el resultado se informa al portal
    // cuando el jugador pulsa, para que le de tiempo a leer el dato real.
    const secs = Math.round(elapsed / 1000)
    const power = Math.round(panelPower(dust) * 100)
    const lines = [
      won
        ? `You collected all ${maze.totalPellets} samples in ${secs} s, with ${power}% panel power left.`
        : `Dust covered your panels: you stopped with ${left} of ${maze.totalPellets} samples still to collect.`,
      cleanings.length
        ? `Cleaning events: ${cleanings.map((p) => p + '% → 100%').join(', ')}. Each time you drove into a dust devil, its wind blew the dust off your panels.`
        : 'You never used a dust devil, so the dust only piled up. Its wind is what cleans the panels.',
      momentsDecided
        ? `Low power with a dust devil close: ${momentsDecided} time${momentsDecided > 1 ? 's' : ''}, and you used it ${momentsUsed}.`
        : '',
    ].filter(Boolean)
    const star = (ok: boolean) => (ok ? '★' : '☆')
    lines.push(`Stars: ${star(won)} samples ${star(won && power >= 40)} power left ${star(cleanings.some((p) => p <= 65))} devil used in time`)
    stage.showOverlay({
      title: won ? 'Crater explored' : 'Rover stopped',
      tone: won ? 'win' : 'lose',
      score: won ? score + ' points' : undefined,
      lines: lines.slice(0, 4),
      buttons: won
        ? [{ label: 'Save and continue', onClick: () => complete(true, score) }]
        : [
            { label: 'Try again', onClick: begin },
            { label: 'Back to the arcade', variant: 'quiet', onClick: () => complete(false, 0) },
          ],
    })
  }

  // --- Entrada --------------------------------------------------------------
  const KEY_DIRS: Record<string, Dir> = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
  }

  const offPress = input.onPress((code) => {
    if (phase === 'intro' && (code === 'Space' || code === 'Enter')) {
      begin()
      return
    }
    const dir = KEY_DIRS[code]
    if (dir && phase === 'playing') player.want = dir
  })

  // Botonera tactil con las cuatro direcciones.
  const padButtons: { el: HTMLButtonElement; dir: Dir; handler: (e: PointerEvent) => void }[] = []
  for (const [label, dir, aria] of [
    ['↑', 'up', 'Up'],
    ['←', 'left', 'Left'],
    ['→', 'right', 'Right'],
    ['↓', 'down', 'Down'],
  ] as const) {
    const el = stage.addTouchButton(label, aria)
    const handler = (e: PointerEvent) => {
      e.preventDefault()
      if (phase === 'intro') begin()
      else if (phase === 'playing') player.want = dir
    }
    el.addEventListener('pointerdown', handler)
    padButtons.push({ el, dir, handler })
  }

  // Deslizar sobre el laberinto tambien mueve.
  let swipe: { x: number; y: number } | null = null
  const onDown = (e: PointerEvent) => {
    swipe = { x: e.clientX, y: e.clientY }
  }
  const onUp = (e: PointerEvent) => {
    if (!swipe) return
    const dx = e.clientX - swipe.x
    const dy = e.clientY - swipe.y
    swipe = null
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return
    if (phase !== 'playing') return
    player.want =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
  }
  stage.canvas.addEventListener('pointerdown', onDown)
  stage.canvas.addEventListener('pointerup', onUp)

  stage.setHint('Arrows or WASD to move · collect every sample · meet dust devils to clean your panels')

  // --- Simulacion -----------------------------------------------------------
  function loseLife() {
    lives--
    sfx.sweep(420, 120, 380, 'square', 0.2)
    if (lives <= 0 && !practice) {
      finish(false)
      return
    }
    // En practica nunca se acaba la partida: se reponen las vidas.
    if (lives <= 0) lives = START_LIVES
    phase = 'caught'
    respawnMs = 900
  }

  function update(dtMs: number) {
    if (phase === 'caught') {
      respawnMs -= dtMs
      if (respawnMs <= 0) {
        resetPositions()
        // El rover vuelve con los paneles aun sucios: morir ya no sustituye
        // a un evento de limpieza, solo compra unos segundos y cuesta una vida.
        dust = dustAfterRespawn(dust)
        phase = 'playing'
      }
      return
    }
    if (phase !== 'playing') return

    const dt = dtMs / 1000
    elapsed += dtMs
    if (cleanMs > 0) cleanMs = Math.max(0, cleanMs - dtMs)

    // --- Polvo en los paneles: menos energia, rover mas lento.
    dust = Math.min(1, dust + dt / (tuning.dustSecs * (practice ? 2 : 1)))
    if (dust >= 1) {
      if (moment) resolveMoment(false)
      else if (!practice) decisions.push({ concept: CONCEPT, correct: false })
      stage.flash('Panels covered in dust: no power', 'bad')
      loseLife()
      return
    }

    // --- Jugador
    if (stepMover(maze, player, roverSpeed(tuning, dust), dt)) {
      const k = key(player.x, player.y)
      if (maze.pellets.delete(k)) {
        pelletsTaken++
        sfx.tone(640 + (pelletsTaken % 6) * 40, 40, 'square', 0.07)
      }
      if (maze.powers.delete(k)) {
        powersTaken++
        stage.flash('Bright soil sample')
        sfx.sweep(380, 900, 260, 'triangle', 0.2)
      }
    }

    // --- Remolinos
    const fleeing = false
    let gi = 0
    for (const g of ghosts) {
      gi++
      if (g.brushedMs > 0) g.brushedMs -= dtMs
      if (g.waitMs > 0) {
        g.waitMs -= dtMs
        continue
      }
      if (g.goneMs > 0) {
        g.goneMs -= dtMs
        if (g.goneMs <= 0) {
          // Reaparece en su casa.
          const home = maze.home[0]
          g.mover.x = home.x
          g.mover.y = home.y
          g.mover.tx = home.x
          g.mover.ty = home.y
          g.mover.t = 0
          g.mover.dir = 'none'
          g.mover.want = 'up'
        }
        continue
      }

      // Los remolinos no persiguen: vagan de esquina en esquina, como el
      // viento. Hay que ir a buscarlos.
      const target = CORNERS[(gi + Math.floor(elapsed / 6000)) % CORNERS.length]
      // Misma penalizacion de polvo que el rover: ver devilSpeed() en rules.
      const speed = devilSpeed(tuning, dust)

      if (g.mover.dir === 'none') {
        g.mover.want = chooseGhostDir(maze, g.mover, target, fleeing, rng.next)
      }
      if (stepMover(maze, g.mover, speed, dt)) {
        g.mover.want = chooseGhostDir(maze, g.mover, target, fleeing, rng.next)
      }
      // Seguro: si quedo encajonado sin direccion valida, se libera.
      if (g.mover.dir === 'none' && !canGo(maze, g.mover.x, g.mover.y, g.mover.want)) {
        g.mover.want = chooseGhostDir(maze, g.mover, target, fleeing, rng.next)
      }
    }

    // --- Contacto
    const pp = moverPos(player)
    for (const g of ghosts) {
      if (g.goneMs > 0 || g.waitMs > 0) continue
      const gp = moverPos(g.mover)
      const near = Math.abs(gp.x - pp.x) < 0.6 && Math.abs(gp.y - pp.y) < 0.6
      if (!near) continue

      // Cleaning event: the devil's wind blows the dust off the panels.
      const before = dust
      if (before < CLEAN_MIN_DUST) {
        // Nothing to clean. The devil is NOT spent, so it stays there for when
        // the panels actually need it -- and we say so, because silently
        // eating a devil for four seconds taught the player nothing.
        if (g.brushedMs <= 0) {
          g.brushedMs = 1600
          stage.flash('Panels still clean: save this dust devil for later')
        }
        continue
      }
      g.goneMs = 4000
      dust = 0
      cleanMs = tuning.cleanSecs * 1000
      scattered++
      // Going for a devil when power was low is the smart call.
      cleanings.push(Math.round(panelPower(before) * 100))
      if (moment) resolveMoment(true)
      else if (before >= SMART_CLEAN_DUST && !practice) decisions.push({ concept: CONCEPT, correct: true })
      stage.flash('Cleaning event! Power ' + Math.round(panelPower(before) * 100) + '% → 100%')
      sfx.tone(980, 120, 'sine', 0.2)
    }

    // --- Key moment: low power with a devil close. Using it is the lesson; walking away is the miss.
    if (dust >= MOMENT_DUST) {
      const closest = Math.min(
        ...ghosts.filter((g) => g.goneMs <= 0).map((g) => Math.abs(g.mover.x - player.x) + Math.abs(g.mover.y - player.y)),
        99,
      )
      if (!moment && closest <= 4) moment = true
      else if (moment && closest > 8) resolveMoment(false)
    }

    // --- Victoria
    if (maze.pellets.size === 0 && maze.powers.size === 0) {
      finish(true)
      return
    }

    stage.setStats([
      {
        key: 'muestras',
        label: 'Samples',
        value: pelletsTaken + ' / ' + maze.totalPellets,
        meter: pelletsTaken / Math.max(1, maze.totalPellets),
      },
      {
        key: 'vidas',
        label: practice ? 'Tries (practice)' : 'Rovers',
        value: '*'.repeat(Math.max(0, lives)),
        tone: lives > 1 ? 'ok' : 'bad',
      },
      {
        key: 'limpieza',
        label: 'Panel power',
        // Numero y barra son ahora la MISMA magnitud, y ambos llegan a 0
        // justo donde el rover se queda sin energia (dust = 1).
        value: Math.round(panelPower(dust) * 100) + '%',
        meter: panelPower(dust),
        tone: dust > 0.7 ? 'bad' : dust > 0.4 ? 'warn' : 'ok',
      },
      { key: 'puntos', label: 'Points', value: String(currentScore(false)) },
    ])
  }

  // --- Dibujo ---------------------------------------------------------------
  const c = stage.ctx
  const px = (cx: number) => PAD + cx * CELL + CELL / 2
  const py = (cy: number) => PAD + cy * CELL + CELL / 2

  function drawMaze() {
    for (let y = 0; y < maze.h; y++) {
      for (let x = 0; x < maze.w; x++) {
        if (maze.grid[y][x] !== '#') continue
        const left = PAD + x * CELL
        const top = PAD + y * CELL

        // Roca del crater: relleno suave con borde iluminado arriba.
        c.fillStyle = '#2b2550'
        c.fillRect(left + 1, top + 1, CELL - 2, CELL - 2)
        c.fillStyle = 'rgba(146,122,210,0.28)'
        c.fillRect(left + 1, top + 1, CELL - 2, 3)
      }
    }
  }

  function drawPellets() {
    c.fillStyle = '#e9d9b8'
    for (const k of maze.pellets) {
      const [x, y] = k.split(',').map(Number)
      c.beginPath()
      c.arc(px(x), py(y), 3.2, 0, Math.PI * 2)
      c.fill()
    }

    const pulse = reduced ? 1 : 0.75 + Math.sin(elapsed / 180) * 0.25
    for (const k of maze.powers) {
      const [x, y] = k.split(',').map(Number)
      const cx = px(x)
      const cy = py(y)
      const g = c.createRadialGradient(cx, cy, 1, cx, cy, 14 * pulse)
      g.addColorStop(0, '#fff2cf')
      g.addColorStop(1, 'rgba(255,214,120,0)')
      c.fillStyle = g
      c.beginPath()
      c.arc(cx, cy, 14 * pulse, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#ffd98a'
      c.beginPath()
      c.arc(cx, cy, 6, 0, Math.PI * 2)
      c.fill()
    }
  }

  function drawPlayer() {
    const p = moverPos(player)
    const cx = px(p.x)
    const cy = py(p.y)
    const protectedNow = cleanMs > 0

    if (protectedNow) {
      c.strokeStyle = 'rgba(126,226,176,0.9)'
      c.lineWidth = 2
      c.beginPath()
      c.arc(cx, cy, CELL * 0.46, 0, Math.PI * 2)
      c.stroke()
    }

    // Cuerpo del rover.
    c.fillStyle = '#dcc9a6'
    c.fillRect(cx - 11, cy - 8, 22, 15)
    // Paneles: brillan durante el evento de limpieza.
    c.fillStyle = protectedNow ? '#aef0d2' : mixDust(dust)
    c.fillRect(cx - 13, cy - 12, 26, 5)
    // Ruedas.
    c.fillStyle = '#3a3550'
    c.fillRect(cx - 12, cy + 6, 6, 5)
    c.fillRect(cx + 6, cy + 6, 6, 5)
    // Mastil orientado hacia donde va.
    const d = player.dir
    const mx = d === 'left' ? -8 : d === 'right' ? 8 : 0
    const my = d === 'up' ? -8 : d === 'down' ? 6 : 0
    c.fillStyle = '#75cbd1'
    c.beginPath()
    c.arc(cx + mx, cy - 10 + my * 0.3, 3.4, 0, Math.PI * 2)
    c.fill()
  }

  function drawGhost(g: Ghost) {
    if (g.waitMs > 0 && g.goneMs <= 0) {
      // En casa: se insinua para que se vea que va a salir.
      const p = moverPos(g.mover)
      c.globalAlpha = 0.35
      c.fillStyle = g.hue
      c.beginPath()
      c.arc(px(p.x), py(p.y), 8, 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 1
      return
    }

    const p = moverPos(g.mover)
    const cx = px(p.x)
    const cy = py(p.y)
    const fleeing = false

    if (g.goneMs > 0) {
      // Dispersado: solo queda un rastro tenue volviendo a casa.
      c.globalAlpha = 0.3
      c.strokeStyle = '#9fb6d8'
      c.lineWidth = 1.5
      c.beginPath()
      c.arc(cx, cy, 7, 0, Math.PI * 2)
      c.stroke()
      c.globalAlpha = 1
      return
    }

    // Remolino: espiral de polvo. Al huir se vuelve palido y tiembla.
    const spin = reduced ? 0 : elapsed / (fleeing ? 90 : 160)
    const color = fleeing ? '#9fd8e8' : g.hue
    c.save()
    c.translate(cx, cy)
    c.rotate(spin)
    for (let i = 0; i < 3; i++) {
      const r = 13 - i * 3.4
      c.globalAlpha = 0.85 - i * 0.18
      c.fillStyle = color
      c.beginPath()
      c.ellipse(0, -i * 2.2, r, r * 0.62, (i * Math.PI) / 3, 0, Math.PI * 2)
      c.fill()
    }
    c.restore()
    c.globalAlpha = 1

    // Ojos: dan direccion y hacen que se lea como criatura.
    c.fillStyle = fleeing ? '#0c0d45' : '#ffffff'
    c.beginPath()
    c.arc(cx - 4, cy - 2, 2.6, 0, Math.PI * 2)
    c.arc(cx + 4, cy - 2, 2.6, 0, Math.PI * 2)
    c.fill()
  }

  function render() {
    const W = stage.width
    const H = stage.height

    c.fillStyle = '#120f36'
    c.fillRect(0, 0, W, H)

    // Suelo del crater.
    const g = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7)
    g.addColorStop(0, '#1d1a4a')
    g.addColorStop(1, '#120f36')
    c.fillStyle = g
    c.fillRect(0, 0, W, H)

    drawMaze()
    drawPellets()
    for (const gh of ghosts) drawGhost(gh)

    // Al ser alcanzado, el rover parpadea.
    if (phase !== 'caught' || Math.floor(respawnMs / 110) % 2 === 0) drawPlayer()

    // Tinte verde mientras dura el evento de limpieza.
    if (cleanMs > 0) {
      c.fillStyle = 'rgba(126,226,176,' + (0.05 + (cleanMs / (tuning.cleanSecs * 1000)) * 0.06) + ')'
      c.fillRect(0, 0, W, H)
    }
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  spawnGhosts()
  stage.setStats([
    { key: 'muestras', label: 'Samples', value: '0 / ' + maze.totalPellets, meter: 0 },
    { key: 'vidas', label: 'Rovers', value: '*'.repeat(START_LIVES), tone: 'ok' },
    { key: 'limpieza', label: 'Panel power', value: '100%', meter: 1, tone: 'ok' },
    { key: 'puntos', label: 'Points', value: '0' },
  ])

  stage.showOverlay({
    title: card?.title ?? 'Gusev Maze',
    text:
      'Collect all ' +
      maze.totalPellets +
      ' samples. Dust keeps settling on your solar panels: less power, slower rover. If they get fully covered, you stop. Watch the Panel power meter, and see what happens when you meet a dust devil.',
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
      for (const b of padButtons) b.el.removeEventListener('pointerdown', b.handler)
      input.destroy()
      sfx.destroy()
      stage.destroy()
      return Promise.resolve()
    },
  }
}

/** Panel colour: clean blue fading to dusty brown. */
function mixDust(dust: number): string {
  const d = Math.min(1, Math.max(0, dust))
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * d)
  return 'rgb(' + lerp(127, 168) + ',' + lerp(182, 120) + ',' + lerp(224, 80) + ')'
}

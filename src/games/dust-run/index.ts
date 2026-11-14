import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { createInput, createLoop } from '../shared/loop'
import { createRng } from '../shared/rng'
import { createStage } from '../shared/stage'
import {
  createObstacle,
  createPickup,
  hits,
  LEVELS,
  minGap,
  roverBox,
  scoreRun,
  speedAt,
  WORLD,
  type Obstacle,
  type ObstacleKind,
  type Pickup,
} from './rules'

/**
 * TORMENTA EN MERIDIANI
 * -------------------------------------------------------------------------
 * Carrera lateral: el rover avanza mientras el cielo se cierra. La energia
 * baja sola (la tormenta tapa el sol) y solo se recupera atrapando claros de
 * luz. Llegar a la distancia del nivel completa la mision.
 *
 * Reglas puras en `rules.ts`; aqui solo estado, entrada y dibujo.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('dust-run')
  const tuning = LEVELS[ctx.levelId]
  const rng = createRng(ctx.seed)
  const sfx = createSfx(ctx.settings.volume)
  const reduced = ctx.settings.reducedMotion
  const practice = ctx.settings.practice

  const stage = createStage(container, {
    width: WORLD.width,
    height: WORLD.height,
    accent: card?.accent ?? '#E68A68',
  })
  const input = createInput(stage.root)
  const startedAt = performance.now()

  // --- Estado de la partida -------------------------------------------------
  type Phase = 'intro' | 'running' | 'over' | 'won'
  let phase: Phase = 'intro'

  let y = WORLD.groundY // base del rover
  let vy = 0
  let grounded = true
  let ducking = false
  let meters = 0
  let energy: number = WORLD.maxEnergy
  let pickupCount = 0
  let crashes = 0
  /** Invulnerabilidad corta tras chocar: evita perder toda la energia de golpe. */
  let graceMs = 0
  let shake = 0
  let settled = false

  let obstacles: Obstacle[] = []
  let pickups: Pickup[] = []
  /** Posicion (en px de mundo) donde toca generar el proximo obstaculo. */
  // Margen de cortesia: el primer obstaculo tarda en llegar.
  let nextSpawnX = WORLD.width + 460

  // Decorado: el parallax se apaga con movimiento reducido.
  const stars = Array.from({ length: 46 }, () => ({
    x: rng.range(0, WORLD.width),
    y: rng.range(10, WORLD.groundY - 150),
    r: rng.range(0.6, 1.8),
    s: rng.range(0.04, 0.16),
  }))
  const hills = Array.from({ length: 16 }, (_, i) => ({
    x: i * 90 + rng.range(-20, 20),
    h: rng.range(26, 74),
  }))
  const grit = Array.from({ length: reduced ? 0 : 70 }, () => ({
    x: rng.range(0, WORLD.width),
    y: rng.range(0, WORLD.height),
    r: rng.range(0.8, 2.6),
    s: rng.range(0.7, 1.9),
  }))

  /** 0 (cielo limpio) -> 1 (tormenta encima). Mueve color, polvo y tension. */
  const stormLevel = () => Math.min(1, meters / tuning.targetDistance)

  // --- Ciclo de la partida --------------------------------------------------
  function reset() {
    y = WORLD.groundY
    vy = 0
    grounded = true
    ducking = false
    meters = 0
    energy = WORLD.maxEnergy
    pickupCount = 0
    crashes = 0
    graceMs = 0
    shake = 0
    obstacles = []
    pickups = []
    nextSpawnX = WORLD.width + 460
  }

  function begin() {
    reset()
    phase = 'running'
    stage.hideOverlay()
    sfx.tone(520, 90, 'triangle', 0.18)
  }

  function finish(won: boolean) {
    if (phase === 'over' || phase === 'won') return
    phase = won ? 'won' : 'over'

    const score = practice
      ? 0
      : scoreRun({ meters, pickups: pickupCount, energyLeft: energy, completed: won })

    if (won) sfx.sweep(440, 880, 320, 'triangle', 0.22)
    else sfx.sweep(320, 90, 420, 'sawtooth', 0.22)

    // El portal cierra la partida en cuanto recibe onComplete, asi que el
    // resultado se informa SOLO cuando el jugador pulsa el boton: primero
    // ve su marca y el dato real.
    stage.showOverlay({
      title: won ? 'Mision cumplida' : 'Sin energia',
      tone: won ? 'win' : 'lose',
      score: won
        ? Math.floor(meters) + ' m - ' + pickupCount + ' claros de luz - ' + score + ' puntos'
        : Math.floor(meters) + ' m de ' + tuning.targetDistance + ' m',
      text: won
        ? 'Llegaste con los paneles cargados. Cada claro de luz que atrapaste era energia entrando.'
        : 'El polvo tapo el sol y los paneles dejaron de cargar. Asi se apago Opportunity.',
      fact: card?.fact,
      buttons: won
        ? [{ label: 'Guardar y continuar', onClick: () => complete(true, score) }]
        : [
            { label: 'Reintentar', onClick: begin },
            { label: 'Volver al portal', variant: 'quiet', onClick: () => ctx.onExit() },
          ],
    })
  }

  function complete(won: boolean, score: number) {
    if (settled) return
    settled = true
    ctx.onComplete({
      gameId: 'dust-run',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: won,
      evidenceIds: won ? (card?.evidence.map((e) => e.id) ?? []) : [],
      // Sin choques: el recorrido se leyo bien a la primera.
      firstAnswerCorrect: won && crashes === 0,
    })
  }

  // --- Entrada --------------------------------------------------------------
  function jump() {
    if (phase === 'intro') {
      begin()
      return
    }
    if (phase !== 'running' || !grounded) return
    vy = WORLD.jumpV
    grounded = false
    ducking = false
    sfx.tone(680, 70, 'square', 0.12)
  }

  const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW'])
  const DUCK_KEYS = new Set(['ArrowDown', 'KeyS'])

  const offPress = input.onPress((code) => {
    if (JUMP_KEYS.has(code)) jump()
    if (code === 'Enter' && phase === 'intro') begin()
  })

  // Tactil: tocar el lienzo salta; el boton de agachar se mantiene pulsado.
  const onPointer = (e: PointerEvent) => {
    e.preventDefault()
    jump()
  }
  stage.canvas.addEventListener('pointerdown', onPointer)

  const jumpBtn = stage.addTouchButton('Saltar', 'Saltar')
  const duckBtn = stage.addTouchButton('Agachar', 'Agacharse')
  let duckHeld = false

  const onJumpTap = (e: PointerEvent) => {
    e.preventDefault()
    jump()
  }
  const onDuckDown = (e: PointerEvent) => {
    e.preventDefault()
    duckHeld = true
  }
  const onDuckUp = () => {
    duckHeld = false
  }
  jumpBtn.addEventListener('pointerdown', onJumpTap)
  duckBtn.addEventListener('pointerdown', onDuckDown)
  duckBtn.addEventListener('pointerup', onDuckUp)
  duckBtn.addEventListener('pointercancel', onDuckUp)
  duckBtn.addEventListener('pointerleave', onDuckUp)

  stage.setHint(
    tuning.gusts
      ? 'Espacio o flecha arriba para saltar - flecha abajo para agacharte bajo las rafagas'
      : 'Espacio o flecha arriba para saltar - atrapa los claros de luz'
  )

  // --- Generacion de terreno ------------------------------------------------
  function spawnAhead(worldX: number) {
    const speed = speedAt(tuning, meters)
    const gap = minGap(speed) + rng.range(0, 190)

    const kinds: ObstacleKind[] = tuning.gusts ? ['rock', 'rock', 'dune', 'gust'] : ['rock', 'dune']
    const kind = rng.pick(kinds)
    obstacles.push(createObstacle(kind, worldX))

    // Un claro de luz en el hueco siguiente. Si el obstaculo es una rafaga
    // (se pasa agachado), el claro va bajo: seria inalcanzable arriba.
    if (rng.chance(tuning.pickupChance)) {
      const high = kind !== 'gust' && rng.chance(0.45)
      pickups.push(createPickup(worldX + gap * 0.5, high))
    }

    nextSpawnX = worldX + gap
  }

  // --- Simulacion -----------------------------------------------------------
  function update(dtMs: number) {
    const dt = dtMs / 1000
    if (phase !== 'running') return

    const speed = speedAt(tuning, meters)
    const advance = speed * dt
    meters += advance / WORLD.pxPerMeter

    // Energia: la tormenta tapa el sol. En practica no baja nunca.
    if (!practice) energy -= tuning.drainPerSec * dt
    if (graceMs > 0) graceMs -= dtMs
    if (shake > 0) shake = Math.max(0, shake - dtMs * 0.02)

    // Agacharse: boton tactil mantenido o cualquier tecla de agachar.
    let wantDuck = duckHeld
    if (!wantDuck) {
      for (const code of input.held) {
        if (DUCK_KEYS.has(code)) {
          wantDuck = true
          break
        }
      }
    }
    // Solo se puede ir agachado con las ruedas en el suelo.
    ducking = grounded && wantDuck

    if (!grounded) {
      // Caida rapida: pedir "agachar" en el aire acelera el descenso.
      vy += WORLD.gravity * (wantDuck ? 2.4 : 1) * dt
      y += vy * dt
      if (y >= WORLD.groundY) {
        y = WORLD.groundY
        vy = 0
        grounded = true
      }
    }

    // Mover mundo hacia la izquierda.
    for (const o of obstacles) o.x -= advance
    for (const p of pickups) {
      p.x -= advance
      p.phase += dt * 4
    }
    nextSpawnX -= advance

    obstacles = obstacles.filter((o) => o.x + o.w > -40)
    pickups = pickups.filter((p) => p.x + p.w > -40 && !p.taken)

    while (nextSpawnX < WORLD.width + 200) spawnAhead(nextSpawnX)

    // Colisiones.
    const box = roverBox(y, ducking)

    if (graceMs <= 0) {
      for (const o of obstacles) {
        if (!hits(box, o)) continue
        crashes++
        graceMs = 900
        shake = reduced ? 0 : 14
        sfx.noise(180, 0.22)
        if (!practice) {
          energy -= WORLD.crashCost
          stage.flash('-' + WORLD.crashCost + ' energia', 'bad')
        } else {
          stage.flash('Choque', 'bad')
        }
        // El obstaculo golpeado desaparece: evita choques encadenados.
        obstacles = obstacles.filter((x) => x !== o)
        break
      }
    }

    for (const p of pickups) {
      if (p.taken || !hits(box, p)) continue
      p.taken = true
      pickupCount++
      energy = Math.min(WORLD.maxEnergy, energy + WORLD.pickupGain)
      stage.flash('+' + WORLD.pickupGain + ' energia')
      sfx.tone(880, 80, 'sine', 0.16)
    }

    if (!practice && energy <= 0) {
      energy = 0
      finish(false)
      return
    }

    if (meters >= tuning.targetDistance) {
      meters = tuning.targetDistance
      finish(true)
      return
    }

    const pct = energy / WORLD.maxEnergy
    stage.setStats([
      {
        key: 'dist',
        label: 'Distancia',
        value: Math.floor(meters) + ' / ' + tuning.targetDistance + ' m',
        meter: meters / tuning.targetDistance,
      },
      {
        key: 'energy',
        label: practice ? 'Energia (practica)' : 'Energia',
        value: Math.max(0, Math.round(energy)) + '%',
        meter: pct,
        tone: pct > 0.5 ? 'ok' : pct > 0.25 ? 'warn' : 'bad',
      },
      { key: 'light', label: 'Claros de luz', value: String(pickupCount) },
    ])
  }

  // --- Dibujo ---------------------------------------------------------------
  const c = stage.ctx

  function drawRover(storm: number) {
    const box = roverBox(y, ducking)
    const cx = box.x
    const cy = box.y

    c.save()
    // Parpadeo durante la invulnerabilidad: comunica el golpe sin texto.
    if (graceMs > 0 && Math.floor(graceMs / 90) % 2 === 0) c.globalAlpha = 0.45

    // Sombra en el suelo: da sensacion de altura al saltar.
    const altitude = WORLD.groundY - y
    c.fillStyle = 'rgba(0,0,0,0.3)'
    c.beginPath()
    c.ellipse(
      cx + box.w / 2,
      WORLD.groundY + 6,
      Math.max(14, 30 - altitude * 0.08),
      6,
      0,
      0,
      Math.PI * 2
    )
    c.fill()

    // Paneles solares: se apagan conforme el cielo se cierra.
    const panel = 'rgb(' + Math.round(120 - storm * 60) + ',' + Math.round(190 - storm * 90) + ',235)'
    c.fillStyle = panel
    c.fillRect(cx + 4, cy + 2, box.w - 8, ducking ? 8 : 12)
    c.strokeStyle = 'rgba(255,255,255,0.35)'
    c.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      const px = cx + 4 + ((box.w - 8) / 4) * i
      c.beginPath()
      c.moveTo(px, cy + 2)
      c.lineTo(px, cy + (ducking ? 10 : 14))
      c.stroke()
    }

    // Cuerpo.
    c.fillStyle = '#d8c3a8'
    c.fillRect(cx + 8, cy + (ducking ? 10 : 14), box.w - 16, box.h - (ducking ? 12 : 18))

    // Mastil y camara (solo de pie).
    if (!ducking) {
      c.fillStyle = '#b9a68c'
      c.fillRect(cx + box.w - 20, cy - 12, 5, 14)
      c.fillStyle = '#75cbd1'
      c.fillRect(cx + box.w - 26, cy - 18, 14, 8)
    }

    // Ruedas girando.
    const spin = (meters * 0.9) % (Math.PI * 2)
    c.fillStyle = '#3b3b4d'
    for (const wx of [cx + 14, cx + box.w - 14]) {
      c.beginPath()
      c.arc(wx, WORLD.groundY - 7, 8, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = 'rgba(255,255,255,0.5)'
      c.beginPath()
      c.moveTo(wx, WORLD.groundY - 7)
      c.lineTo(wx + Math.cos(spin) * 6, WORLD.groundY - 7 + Math.sin(spin) * 6)
      c.stroke()
    }
    c.restore()
  }

  function render() {
    const storm = stormLevel()
    const W = WORLD.width
    const H = WORLD.height

    c.save()
    if (shake > 0) c.translate(rng.range(-shake, shake) * 0.4, rng.range(-shake, shake) * 0.4)

    // Cielo: de rosado limpio a ocre cerrado.
    const sky = c.createLinearGradient(0, 0, 0, WORLD.groundY)
    sky.addColorStop(0, 'rgb(' + Math.round(30 + storm * 60) + ',' + Math.round(26 + storm * 24) + ',' + Math.round(72 - storm * 20) + ')')
    sky.addColorStop(1, 'rgb(' + Math.round(150 + storm * 50) + ',' + Math.round(96 + storm * 24) + ',' + Math.round(72 - storm * 10) + ')')
    c.fillStyle = sky
    c.fillRect(0, 0, W, H)

    // Sol: se apaga tras el polvo.
    const sunAlpha = 0.85 - storm * 0.75
    if (sunAlpha > 0.04) {
      c.save()
      c.globalAlpha = sunAlpha
      const g = c.createRadialGradient(W - 150, 78, 6, W - 150, 78, 72)
      g.addColorStop(0, '#fff3d0')
      g.addColorStop(1, 'rgba(255,220,150,0)')
      c.fillStyle = g
      c.beginPath()
      c.arc(W - 150, 78, 72, 0, Math.PI * 2)
      c.fill()
      c.restore()
    }

    // Estrellas tenues (parallax lento).
    c.fillStyle = 'rgba(255,255,255,0.5)'
    for (const s of stars) {
      if (!reduced) s.x -= s.s
      if (s.x < 0) s.x += W
      c.globalAlpha = 0.5 - storm * 0.4
      c.beginPath()
      c.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = 1

    // Cerros lejanos.
    c.fillStyle = 'rgba(90,48,40,' + (0.75 - storm * 0.25) + ')'
    c.beginPath()
    c.moveTo(0, WORLD.groundY)
    for (const h of hills) {
      if (!reduced && phase === 'running') h.x -= 0.35
      if (h.x < -120) h.x += 16 * 90
      c.lineTo(h.x, WORLD.groundY - h.h)
      c.lineTo(h.x + 60, WORLD.groundY)
    }
    c.lineTo(W, WORLD.groundY)
    c.closePath()
    c.fill()

    // Suelo.
    const ground = c.createLinearGradient(0, WORLD.groundY, 0, H)
    ground.addColorStop(0, '#9c5b3c')
    ground.addColorStop(1, '#5e3524')
    c.fillStyle = ground
    c.fillRect(0, WORLD.groundY, W, H - WORLD.groundY)
    c.strokeStyle = 'rgba(0,0,0,0.25)'
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(0, WORLD.groundY)
    c.lineTo(W, WORLD.groundY)
    c.stroke()

    // Obstaculos.
    for (const o of obstacles) {
      if (o.kind === 'gust') {
        c.save()
        c.globalAlpha = 0.9
        c.fillStyle = '#e9c49a'
        for (let i = 0; i < 5; i++) {
          const oy = o.y + (i * o.h) / 5
          const wob = reduced ? 0 : Math.sin(meters * 0.2 + i) * 6
          c.fillRect(o.x + wob, oy, o.w, 4)
        }
        c.restore()
        continue
      }
      c.fillStyle = o.kind === 'dune' ? '#8a4f33' : '#6b4030'
      if (o.kind === 'dune') {
        c.beginPath()
        c.moveTo(o.x, o.y + o.h)
        c.quadraticCurveTo(o.x + o.w / 2, o.y - 10, o.x + o.w, o.y + o.h)
        c.closePath()
        c.fill()
      } else {
        c.beginPath()
        c.moveTo(o.x, o.y + o.h)
        c.lineTo(o.x + 7, o.y + 6)
        c.lineTo(o.x + o.w / 2, o.y)
        c.lineTo(o.x + o.w - 6, o.y + 9)
        c.lineTo(o.x + o.w, o.y + o.h)
        c.closePath()
        c.fill()
      }
      c.strokeStyle = 'rgba(0,0,0,0.3)'
      c.lineWidth = 1
      c.stroke()
    }

    // Claros de luz.
    for (const p of pickups) {
      const bob = reduced ? 0 : Math.sin(p.phase) * 5
      const cx = p.x + p.w / 2
      const cy = p.y + p.h / 2 + bob
      const g = c.createRadialGradient(cx, cy, 2, cx, cy, 22)
      g.addColorStop(0, '#fff6cf')
      g.addColorStop(1, 'rgba(255,214,120,0)')
      c.fillStyle = g
      c.beginPath()
      c.arc(cx, cy, 22, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#ffe9a8'
      c.beginPath()
      c.arc(cx, cy, 7, 0, Math.PI * 2)
      c.fill()
    }

    drawRover(storm)

    // Polvo en suspension: sube con la tormenta.
    if (!reduced) {
      c.fillStyle = 'rgba(226,178,128,0.5)'
      for (const d of grit) {
        if (phase === 'running') {
          d.x -= d.s * (1 + storm * 3)
          if (d.x < 0) {
            d.x = W
            d.y = rng.range(0, H)
          }
        }
        c.globalAlpha = 0.15 + storm * 0.5
        c.beginPath()
        c.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        c.fill()
      }
      c.globalAlpha = 1
    }

    // Velo general de la tormenta.
    if (storm > 0.05) {
      c.fillStyle = 'rgba(190,130,80,' + storm * 0.3 + ')'
      c.fillRect(0, 0, W, H)
    }

    c.restore()
  }

  // --- Bucle ----------------------------------------------------------------
  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  stage.setStats([
    { key: 'dist', label: 'Distancia', value: '0 / ' + tuning.targetDistance + ' m', meter: 0 },
    { key: 'energy', label: 'Energia', value: '100%', meter: 1, tone: 'ok' },
    { key: 'light', label: 'Claros de luz', value: '0' },
  ])

  stage.showOverlay({
    title: card?.title ?? 'Tormenta en Meridiani',
    text:
      'Avanza ' +
      tuning.targetDistance +
      ' m antes de quedarte sin energia. El polvo tapa el sol: atrapa los claros de luz para recargar los paneles.' +
      (tuning.gusts ? ' Agachate bajo las rafagas altas.' : ''),
    buttons: [{ label: 'Empezar', onClick: begin }],
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
      stage.canvas.removeEventListener('pointerdown', onPointer)
      jumpBtn.removeEventListener('pointerdown', onJumpTap)
      duckBtn.removeEventListener('pointerdown', onDuckDown)
      duckBtn.removeEventListener('pointerup', onDuckUp)
      duckBtn.removeEventListener('pointercancel', onDuckUp)
      duckBtn.removeEventListener('pointerleave', onDuckUp)
      input.destroy()
      sfx.destroy()
      stage.destroy()
      return Promise.resolve()
    },
  }
}

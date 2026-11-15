import { getArcade } from '../../content/arcade'
import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { createInput, createLoop } from '../shared/loop'
import { createRng } from '../shared/rng'
import { createStage } from '../shared/stage'
import {
  aiMove,
  emptyBoard,
  findWinner,
  isFull,
  matchPassed,
  scoreMatch,
  type Board,
  type Difficulty,
  type WinInfo,
} from './rules'

const W = 620
const H = 560
/** Lado del tablero. */
const BOARD = 414
const CELL = BOARD / 3
const OX = (W - BOARD) / 2
const OY = 110

const ROUNDS = 3

/**
 * TRES EN RAYA ORBITAL
 * -------------------------------------------------------------------------
 * Tres rondas contra la estacion rival. Cada marca es una antena: alinear
 * tres es cubrir ese sector del cielo sin huecos.
 *
 * El nivel 3 usa un minimax perfecto a proposito: descubrir que lo maximo
 * que se puede sacar es el empate ES la leccion del nivel.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const card = getArcade('orbital-grid')
  const level = ctx.levelId as Difficulty
  const rng = createRng(ctx.seed)
  const sfx = createSfx(ctx.settings.volume)
  const reduced = ctx.settings.reducedMotion

  const stage = createStage(container, { width: W, height: H, accent: card?.accent ?? '#75CBD1' })
  const input = createInput(stage.root)
  const startedAt = performance.now()

  type Phase = 'intro' | 'playing' | 'roundEnd' | 'matchEnd'
  let phase: Phase = 'intro'

  let board: Board = emptyBoard()
  let turn: 1 | 2 = 1
  let round = 1
  let wins = 0
  let draws = 0
  let losses = 0
  let win: WinInfo | null = null
  /** Cursor de teclado. */
  let cursor = 4
  let keyboardMode = false
  /** Animacion de la linea ganadora, 0..1. */
  let lineAnim = 0
  /** Temporizador para que el rival no responda instantaneamente. */
  let aiDelay = 0
  let roundEndDelay = 0
  let elapsed = 0
  let settled = false
  /** Celda recien colocada, para la animacion de aparicion. */
  const placedAt = new Map<number, number>()

  function statLine() {
    stage.setStats([
      { key: 'ronda', label: 'Ronda', value: Math.min(round, ROUNDS) + ' / ' + ROUNDS },
      { key: 'ganadas', label: 'Ganadas', value: String(wins), tone: wins > 0 ? 'ok' : undefined },
      { key: 'empates', label: 'Empates', value: String(draws) },
      {
        key: 'perdidas',
        label: 'Perdidas',
        value: String(losses),
        tone: losses > 0 ? 'bad' : undefined,
      },
    ])
  }

  function newRound(first: 1 | 2) {
    board = emptyBoard()
    placedAt.clear()
    win = null
    lineAnim = 0
    turn = first
    cursor = board[4] === 0 ? 4 : 0
    phase = 'playing'
    aiDelay = first === 2 ? 520 : 0
    statLine()
  }

  function startMatch() {
    round = 1
    wins = 0
    draws = 0
    losses = 0
    stage.hideOverlay()
    // El jugador abre la primera ronda; luego se alterna para que sea justo.
    newRound(1)
    sfx.tone(560, 90, 'triangle', 0.16)
  }

  function complete(passed: boolean, score: number) {
    if (settled) return
    settled = true
    ctx.onComplete({
      gameId: 'orbital-grid',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now() - startedAt),
      completed: passed,
      evidenceIds: passed ? (card?.evidence.map((e) => e.id) ?? []) : [],
      firstAnswerCorrect: passed && losses === 0,
    })
  }

  function endMatch() {
    phase = 'matchEnd'
    const passed = matchPassed({ wins, draws, losses, level })
    const score = ctx.settings.practice ? 0 : scoreMatch({ wins, draws, losses, level })

    if (passed) sfx.sweep(520, 980, 340, 'triangle', 0.22)
    else sfx.sweep(320, 110, 420, 'sawtooth', 0.2)

    const detail = wins + ' ganadas - ' + draws + ' empates - ' + losses + ' perdidas'

    stage.showOverlay({
      title: passed ? 'Cobertura asegurada' : 'Quedaron huecos',
      tone: passed ? 'win' : 'lose',
      score: ctx.settings.practice ? detail : detail + ' - ' + score + ' puntos',
      text: passed
        ? level === 3
          ? 'Aguantaste al rival perfecto sin perder. Contra una red bien repartida, el empate ya es el mejor resultado posible.'
          : 'Alineaste tus antenas antes que la estacion rival: ese sector del cielo queda cubierto.'
        : level === 3
          ? 'El rival juega perfecto: no se le puede ganar, pero si empatar. Ocupa el centro o una esquina y no dejes dos en linea sin tapar.'
          : 'Necesitas ganar 2 de las 3 rondas. Vigila las lineas del rival antes de buscar la tuya.',
      fact: card?.fact,
      buttons: passed
        ? [{ label: 'Guardar y continuar', onClick: () => complete(true, score) }]
        : [
            { label: 'Otra partida', onClick: startMatch },
            { label: 'Volver al portal', variant: 'quiet', onClick: () => ctx.onExit() },
          ],
    })
  }

  function closeRound() {
    if (win) {
      if (win.player === 1) {
        wins++
        stage.flash('Ronda ganada')
      } else {
        losses++
        stage.flash('Ronda perdida', 'bad')
      }
    } else {
      draws++
      stage.flash('Empate')
    }
    statLine()

    if (round >= ROUNDS) {
      endMatch()
      return
    }
    round++
    // Alterna quien abre: abrir da ventaja y las tres rondas deben ser justas.
    newRound(round % 2 === 0 ? 2 : 1)
  }

  function place(index: number, who: 1 | 2) {
    if (board[index] !== 0) return
    board[index] = who
    placedAt.set(index, elapsed)
    sfx.tone(who === 1 ? 740 : 420, 70, who === 1 ? 'sine' : 'triangle', 0.14)

    win = findWinner(board)
    if (win || isFull(board)) {
      phase = 'roundEnd'
      lineAnim = 0
      roundEndDelay = win ? 1100 : 750
      if (win) sfx.tone(win.player === 1 ? 980 : 260, 220, 'sine', 0.2)
      return
    }
    turn = who === 1 ? 2 : 1
    if (turn === 2) aiDelay = 380 + rng.range(0, 260)
  }

  function playerMove(index: number) {
    if (phase === 'intro') {
      startMatch()
      return
    }
    if (phase !== 'playing' || turn !== 1 || board[index] !== 0) return
    place(index, 1)
  }

  // --- Entrada --------------------------------------------------------------
  const offPress = input.onPress((code) => {
    if (phase === 'intro' && (code === 'Space' || code === 'Enter')) {
      startMatch()
      return
    }
    if (phase !== 'playing' || turn !== 1) return

    const col = cursor % 3
    const row = Math.floor(cursor / 3)

    if (code === 'ArrowLeft' || code === 'KeyA') {
      keyboardMode = true
      cursor = row * 3 + ((col + 2) % 3)
    } else if (code === 'ArrowRight' || code === 'KeyD') {
      keyboardMode = true
      cursor = row * 3 + ((col + 1) % 3)
    } else if (code === 'ArrowUp' || code === 'KeyW') {
      keyboardMode = true
      cursor = ((row + 2) % 3) * 3 + col
    } else if (code === 'ArrowDown' || code === 'KeyS') {
      keyboardMode = true
      cursor = ((row + 1) % 3) * 3 + col
    } else if (code === 'Space' || code === 'Enter') {
      playerMove(cursor)
    } else if (/^Digit[1-9]$/.test(code)) {
      // 1..9 como teclado numerico del tablero.
      playerMove(Number(code.slice(5)) - 1)
    }
  })

  /** Convierte un clic de pantalla a indice de celda. */
  function cellFromEvent(e: PointerEvent): number {
    const rect = stage.canvas.getBoundingClientRect()
    const sx = ((e.clientX - rect.left) / rect.width) * W
    const sy = ((e.clientY - rect.top) / rect.height) * H
    const col = Math.floor((sx - OX) / CELL)
    const row = Math.floor((sy - OY) / CELL)
    if (col < 0 || col > 2 || row < 0 || row > 2) return -1
    return row * 3 + col
  }

  let hover = -1
  const onMove = (e: PointerEvent) => {
    hover = cellFromEvent(e)
    if (hover >= 0) keyboardMode = false
  }
  const onLeave = () => {
    hover = -1
  }
  const onClick = (e: PointerEvent) => {
    e.preventDefault()
    const i = cellFromEvent(e)
    if (i >= 0) playerMove(i)
    else if (phase === 'intro') startMatch()
  }

  stage.canvas.addEventListener('pointermove', onMove)
  stage.canvas.addEventListener('pointerleave', onLeave)
  stage.canvas.addEventListener('pointerdown', onClick)

  stage.setHint('Toca un sector, o muevete con las flechas y confirma con Espacio')

  // --- Simulacion -----------------------------------------------------------
  function update(dtMs: number) {
    elapsed += dtMs

    if (phase === 'roundEnd') {
      if (win && lineAnim < 1) lineAnim = Math.min(1, lineAnim + dtMs / 260)
      roundEndDelay -= dtMs
      if (roundEndDelay <= 0) closeRound()
      return
    }

    if (phase !== 'playing') return

    if (turn === 2) {
      aiDelay -= dtMs
      if (aiDelay <= 0) {
        const move = aiMove(board, 2, level, rng.next)
        if (move >= 0) place(move, 2)
      }
    }
  }

  // --- Dibujo ---------------------------------------------------------------
  const c = stage.ctx
  const cx = (i: number) => OX + (i % 3) * CELL + CELL / 2
  const cy = (i: number) => OY + Math.floor(i / 3) * CELL + CELL / 2

  /** Antena del jugador: circulo con ondas. */
  function drawAntenna(x: number, y: number, scale: number, active: boolean) {
    const r = 46 * scale
    c.save()
    c.globalAlpha = Math.min(1, scale)
    c.strokeStyle = '#75cbd1'
    c.lineWidth = 5
    c.beginPath()
    c.arc(x, y + 8 * scale, r * 0.55, Math.PI, 0)
    c.stroke()

    c.beginPath()
    c.moveTo(x, y + 8 * scale)
    c.lineTo(x, y + 34 * scale)
    c.stroke()
    c.beginPath()
    c.moveTo(x - 20 * scale, y + 34 * scale)
    c.lineTo(x + 20 * scale, y + 34 * scale)
    c.stroke()

    // Ondas: solo en la linea ganadora, para no marear.
    if (active && !reduced) {
      const t = (elapsed / 700) % 1
      for (let i = 0; i < 2; i++) {
        const p = (t + i * 0.5) % 1
        c.globalAlpha = (1 - p) * 0.6
        c.beginPath()
        c.arc(x, y + 6 * scale, 26 + p * 30, Math.PI * 1.15, Math.PI * 1.85)
        c.stroke()
      }
    }
    c.restore()
  }

  /** Marca del rival: satelite con su orbita. */
  function drawProbe(x: number, y: number, scale: number, active: boolean) {
    const r = 40 * scale
    c.save()
    c.globalAlpha = Math.min(1, scale)
    c.strokeStyle = '#f2d2ff'
    c.lineWidth = 4.2

    c.beginPath()
    c.ellipse(x, y, r, r * 0.52, -0.5, 0, Math.PI * 2)
    c.stroke()

    c.fillStyle = '#f2d2ff'
    c.beginPath()
    c.arc(x, y, 13 * scale, 0, Math.PI * 2)
    c.fill()

    const ang = active && !reduced ? elapsed / 420 : -0.5
    c.fillStyle = '#ffffff'
    c.beginPath()
    c.arc(x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.52, 5.5 * scale, 0, Math.PI * 2)
    c.fill()
    c.restore()
  }

  function render() {
    // Fondo.
    const g = c.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#141a56')
    g.addColorStop(1, '#0a0b32')
    c.fillStyle = g
    c.fillRect(0, 0, W, H)

    // Arco de la Tierra bajo el tablero: recuerda de que va el juego.
    c.save()
    c.globalAlpha = 0.5
    const earth = c.createRadialGradient(W / 2, H + 170, 60, W / 2, H + 170, 300)
    earth.addColorStop(0, '#2f6fb5')
    earth.addColorStop(1, 'rgba(47,111,181,0)')
    c.fillStyle = earth
    c.beginPath()
    c.arc(W / 2, H + 170, 300, 0, Math.PI * 2)
    c.fill()
    c.restore()

    // Titulo de turno.
    c.textAlign = 'center'
    c.font = '600 17px "Space Grotesk", system-ui, sans-serif'
    if (phase === 'playing') {
      c.fillStyle = turn === 1 ? '#75cbd1' : '#f2d2ff'
      c.fillText(turn === 1 ? 'Tu turno: coloca una antena' : 'La estacion rival esta decidiendo...', W / 2, 54)
    } else if (phase === 'roundEnd') {
      c.fillStyle = win ? (win.player === 1 ? '#7ee2b0' : '#ff9aa8') : '#dae8fb'
      c.fillText(
        win ? (win.player === 1 ? 'Sector cubierto' : 'Lo cubrio el rival') : 'Sin cobertura: empate',
        W / 2,
        54
      )
    }

    // Marcador de rondas en puntos.
    const dotY = 80
    for (let i = 0; i < ROUNDS; i++) {
      const dx = W / 2 - (ROUNDS - 1) * 11 + i * 22
      const played = i + 1 < round || phase === 'matchEnd'
      c.fillStyle = played ? '#75cbd1' : i + 1 === round ? 'rgba(117,203,209,0.55)' : 'rgba(218,232,251,0.2)'
      c.beginPath()
      c.arc(dx, dotY, 4.5, 0, Math.PI * 2)
      c.fill()
    }

    // Rejilla.
    c.strokeStyle = 'rgba(117,203,209,0.35)'
    c.lineWidth = 2
    for (let i = 1; i < 3; i++) {
      c.beginPath()
      c.moveTo(OX + i * CELL, OY + 10)
      c.lineTo(OX + i * CELL, OY + BOARD - 10)
      c.stroke()
      c.beginPath()
      c.moveTo(OX + 10, OY + i * CELL)
      c.lineTo(OX + BOARD - 10, OY + i * CELL)
      c.stroke()
    }

    // Celdas.
    const winSet = new Set<number>(win ? win.line : [])
    for (let i = 0; i < 9; i++) {
      const x = cx(i)
      const y = cy(i)

      // Resaltado de la celda apuntada.
      const isCursor = phase === 'playing' && turn === 1 && board[i] === 0 &&
        ((keyboardMode && i === cursor) || (!keyboardMode && i === hover))
      if (isCursor) {
        c.fillStyle = 'rgba(117,203,209,0.12)'
        c.fillRect(OX + (i % 3) * CELL + 6, OY + Math.floor(i / 3) * CELL + 6, CELL - 12, CELL - 12)
        c.strokeStyle = 'rgba(117,203,209,0.6)'
        c.lineWidth = 2
        c.strokeRect(OX + (i % 3) * CELL + 6, OY + Math.floor(i / 3) * CELL + 6, CELL - 12, CELL - 12)
      }

      if (board[i] === 0) continue

      // Aparicion con escala: la jugada se nota sin leer nada.
      const since = elapsed - (placedAt.get(i) ?? 0)
      const scale = reduced ? 1 : Math.min(1, 0.45 + since / 160)
      const active = winSet.has(i)

      if (board[i] === 1) drawAntenna(x, y, scale, active)
      else drawProbe(x, y, scale, active)
    }

    // Linea ganadora.
    if (win && lineAnim > 0) {
      const a = win.line[0]
      const b = win.line[2]
      const x1 = cx(a)
      const y1 = cy(a)
      const x2 = cx(b)
      const y2 = cy(b)
      c.strokeStyle = win.player === 1 ? '#7ee2b0' : '#ff9aa8'
      c.lineWidth = 6
      c.lineCap = 'round'
      c.beginPath()
      c.moveTo(x1, y1)
      c.lineTo(x1 + (x2 - x1) * lineAnim, y1 + (y2 - y1) * lineAnim)
      c.stroke()
    }

    // Leyenda.
    c.font = '500 13px "Space Grotesk", system-ui, sans-serif'
    c.textAlign = 'left'
    c.fillStyle = '#75cbd1'
    c.fillText('Tus antenas', OX, H - 26)
    c.textAlign = 'right'
    c.fillStyle = '#f2d2ff'
    c.fillText('Estacion rival', OX + BOARD, H - 26)
  }

  const loop = createLoop((dt) => {
    update(dt)
    render()
  })

  statLine()
  stage.showOverlay({
    title: card?.title ?? 'Tres en raya orbital',
    text:
      'Tres rondas contra la estacion rival. ' +
      (level === 3
        ? 'Este rival juega perfecto: no pierdas ninguna ronda y el nivel es tuyo.'
        : 'Gana 2 de las 3 rondas alineando tres antenas.'),
    buttons: [{ label: 'Empezar', onClick: startMatch }],
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
      stage.canvas.removeEventListener('pointermove', onMove)
      stage.canvas.removeEventListener('pointerleave', onLeave)
      stage.canvas.removeEventListener('pointerdown', onClick)
      input.destroy()
      sfx.destroy()
      stage.destroy()
      return Promise.resolve()
    },
  }
}

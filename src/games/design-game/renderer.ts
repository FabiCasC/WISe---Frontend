/**
 * DESIGN GAME - RENDERER DEL SIMULADOR
 * -------------------------------------------------------------------------
 * Dibuja el estado actual del GameRuntime en un canvas 2D.
 * No contiene lógica de juego: solo visualización.
 * Utiliza los SPRITE_DESCRIPTORS de entities.ts para dibujar
 * todas las entidades sin depender de imágenes externas.
 */

import type { Entity, EntityRuntimeState, GameRuntime } from './types'
import { SPRITE_DESCRIPTORS } from './entities'

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  runtime: GameRuntime,
  width: number,
  height: number,
): void {
  const { spec } = runtime

  // Fondo del escenario
  ctx.fillStyle = spec.scene.background
  ctx.fillRect(0, 0, width, height)

  // Grid sutil para orientación espacial
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke()
  }
  for (let y = 0; y < height; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
  }

  // Renderizar entidades ordenadas por tipo (plataformas debajo)
  const ordered = [...spec.entities].sort((a, b) => {
    const order = { platform: 0, obstacle: 1, goal: 2, collectible: 3, enemy: 4, player: 5 }
    return (order[a.type] ?? 3) - (order[b.type] ?? 3)
  })

  for (const entity of ordered) {
    const state = runtime.entityStates.get(entity.id)
    if (!state || !state.visible) continue
    renderEntity(ctx, entity, state, runtime)
  }

  // HUD superpuesto
  renderHUD(ctx, runtime, width, height)
}

function renderEntity(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  state: EntityRuntimeState,
  runtime: GameRuntime,
): void {
  const { x, y } = state.position
  const { width: w, height: h } = entity.size

  ctx.save()

  // Rotación (si aplica)
  const rotation = Number(state.customState?.['rotation'] ?? 0)
  if (rotation !== 0) {
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-(w / 2), -(h / 2))
  } else {
    ctx.translate(x, y)
  }

  const descriptor = SPRITE_DESCRIPTORS[state.sprite] ?? SPRITE_DESCRIPTORS[entity.sprite]
  const primary = descriptor?.primaryColor ?? '#888'
  const secondary = descriptor?.secondaryColor ?? '#555'
  const shape = descriptor?.shape ?? 'player'

  switch (shape) {
    case 'player':
      drawPlayer(ctx, 0, 0, w, h, primary, secondary, entity.type === 'enemy')
      break
    case 'enemy':
      drawEnemy(ctx, 0, 0, w, h, primary, secondary)
      break
    case 'star':
      drawStar(ctx, w / 2, h / 2, Math.min(w, h) / 2.4, primary)
      break
    case 'coin':
      drawCoin(ctx, 0, 0, w, h, primary)
      break
    case 'gem':
      drawGem(ctx, 0, 0, w, h, primary, secondary)
      break
    case 'key':
      drawKey(ctx, 0, 0, w, h, primary)
      break
    case 'rock':
      drawRock(ctx, 0, 0, w, h, primary, secondary)
      break
    case 'fire':
      drawFire(ctx, 0, 0, w, h, primary)
      break
    case 'spike':
      drawSpike(ctx, 0, 0, w, h, primary)
      break
    case 'platform':
      drawPlatform(ctx, 0, 0, w, h, primary, secondary)
      break
    case 'flag':
      drawFlag(ctx, 0, 0, w, h, primary)
      break
    case 'portal':
      drawPortal(ctx, 0, 0, w, h, primary, secondary, runtime.elapsedTime)
      break
    default:
      drawDefault(ctx, 0, 0, w, h, primary)
  }

  ctx.restore()
}

// -------------------------------------------------------------------------
// Primitivos de dibujo
// -------------------------------------------------------------------------

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  primary: string, secondary: string,
  isEnemy: boolean,
): void {
  // Cuerpo
  ctx.fillStyle = primary
  ctx.beginPath()
  ctx.roundRect(x + w * 0.15, y + h * 0.35, w * 0.7, h * 0.55, 4)
  ctx.fill()
  // Cabeza
  ctx.fillStyle = isEnemy ? '#ffcccc' : '#ffe0b2'
  ctx.beginPath()
  ctx.arc(x + w / 2, y + h * 0.25, w * 0.28, 0, Math.PI * 2)
  ctx.fill()
  // Acento de ropa
  ctx.fillStyle = secondary
  ctx.fillRect(x + w * 0.3, y + h * 0.42, w * 0.4, h * 0.08)
  // Ojos
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(x + w * 0.38, y + h * 0.23, 2.5, 0, Math.PI * 2)
  ctx.arc(x + w * 0.62, y + h * 0.23, 2.5, 0, Math.PI * 2)
  ctx.fill()
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  primary: string, secondary: string,
): void {
  ctx.fillStyle = primary
  ctx.beginPath()
  ctx.roundRect(x + 2, y + h * 0.3, w - 4, h * 0.6, 6)
  ctx.fill()
  // Cabeza
  ctx.fillStyle = secondary
  ctx.beginPath()
  ctx.arc(x + w / 2, y + h * 0.22, w * 0.3, 0, Math.PI * 2)
  ctx.fill()
  // Ojos malvados
  ctx.fillStyle = '#ff0'
  ctx.beginPath()
  ctx.arc(x + w * 0.35, y + h * 0.2, 3, 0, Math.PI * 2)
  ctx.arc(x + w * 0.65, y + h * 0.2, 3, 0, Math.PI * 2)
  ctx.fill()
  // Cejas
  ctx.strokeStyle = '#ff0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x + w * 0.28, y + h * 0.14)
  ctx.lineTo(x + w * 0.42, y + h * 0.17)
  ctx.moveTo(x + w * 0.72, y + h * 0.14)
  ctx.lineTo(x + w * 0.58, y + h * 0.17)
  ctx.stroke()
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  color: string,
): void {
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 10
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const a2 = (i * 4 * Math.PI) / 5 + (2 * Math.PI) / 5 - Math.PI / 2
    if (i === 0) ctx.moveTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1))
    else ctx.lineTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1))
    ctx.lineTo(cx + (r * 0.4) * Math.cos(a2), cy + (r * 0.4) * Math.sin(a2))
  }
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0
}

function drawCoin(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
): void {
  ctx.fillStyle = color
  ctx.strokeStyle = '#fff8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2 - 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#fff8'
  ctx.font = `bold ${w * 0.5}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('$', x + w / 2, y + h / 2)
}

function drawGem(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  primary: string, secondary: string,
): void {
  ctx.fillStyle = primary
  ctx.beginPath()
  ctx.moveTo(x + w / 2, y)
  ctx.lineTo(x + w, y + h * 0.4)
  ctx.lineTo(x + w / 2, y + h)
  ctx.lineTo(x, y + h * 0.4)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = secondary + '99'
  ctx.beginPath()
  ctx.moveTo(x + w / 2, y)
  ctx.lineTo(x + w * 0.75, y + h * 0.4)
  ctx.lineTo(x + w / 2, y + h * 0.6)
  ctx.closePath()
  ctx.fill()
}

function drawKey(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.fillStyle = color
  // Cabeza de la llave
  ctx.beginPath()
  ctx.arc(x + w * 0.35, y + h * 0.3, w * 0.25, 0, Math.PI * 2)
  ctx.stroke()
  // Mango
  ctx.beginPath()
  ctx.moveTo(x + w * 0.55, y + h * 0.38)
  ctx.lineTo(x + w * 0.9, y + h * 0.72)
  ctx.stroke()
  // Dientes
  ctx.beginPath()
  ctx.moveTo(x + w * 0.75, y + h * 0.6)
  ctx.lineTo(x + w * 0.75, y + h * 0.75)
  ctx.moveTo(x + w * 0.85, y + h * 0.68)
  ctx.lineTo(x + w * 0.85, y + h * 0.83)
  ctx.stroke()
}

function drawRock(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  primary: string, secondary: string,
): void {
  ctx.fillStyle = primary
  ctx.beginPath()
  ctx.moveTo(x + w * 0.2, y + h * 0.9)
  ctx.lineTo(x + w * 0.05, y + h * 0.6)
  ctx.lineTo(x + w * 0.15, y + h * 0.25)
  ctx.lineTo(x + w * 0.5, y + h * 0.1)
  ctx.lineTo(x + w * 0.85, y + h * 0.3)
  ctx.lineTo(x + w * 0.95, y + h * 0.65)
  ctx.lineTo(x + w * 0.75, y + h * 0.9)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = secondary + '44'
  ctx.beginPath()
  ctx.moveTo(x + w * 0.3, y + h * 0.25)
  ctx.lineTo(x + w * 0.5, y + h * 0.15)
  ctx.lineTo(x + w * 0.65, y + h * 0.3)
  ctx.closePath()
  ctx.fill()
}

function drawFire(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  primary: string,
): void {
  const t = performance.now() / 300
  for (let i = 0; i < 3; i++) {
    const offset = Math.sin(t + i * 1.5) * w * 0.1
    ctx.fillStyle = i === 0 ? primary : i === 1 ? '#FF9800' : '#FFEB3B'
    ctx.beginPath()
    ctx.moveTo(x + w * 0.5 + offset, y)
    ctx.bezierCurveTo(
      x + w * 0.9, y + h * 0.3,
      x + w * 0.75, y + h * 0.7,
      x + w * 0.5, y + h,
    )
    ctx.bezierCurveTo(
      x + w * 0.25, y + h * 0.7,
      x + w * 0.1, y + h * 0.3,
      x + w * 0.5 + offset, y,
    )
    ctx.fill()
  }
}

function drawSpike(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
): void {
  const spikes = 3
  ctx.fillStyle = color
  for (let i = 0; i < spikes; i++) {
    const sx = x + (i / spikes) * w
    const sw = w / spikes
    ctx.beginPath()
    ctx.moveTo(sx + sw * 0.1, y + h)
    ctx.lineTo(sx + sw * 0.5, y)
    ctx.lineTo(sx + sw * 0.9, y + h)
    ctx.closePath()
    ctx.fill()
  }
}

function drawPlatform(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  primary: string, secondary: string,
): void {
  ctx.fillStyle = primary
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 4)
  ctx.fill()
  // Borde superior iluminado
  ctx.fillStyle = secondary + '66'
  ctx.fillRect(x + 2, y + 2, w - 4, 4)
}

function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
): void {
  // Palo
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x + w * 0.3, y + h)
  ctx.lineTo(x + w * 0.3, y)
  ctx.stroke()
  // Bandera
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x + w * 0.3, y)
  ctx.lineTo(x + w, y + h * 0.25)
  ctx.lineTo(x + w * 0.3, y + h * 0.5)
  ctx.closePath()
  ctx.fill()
}

function drawPortal(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  primary: string, secondary: string,
  time: number,
): void {
  const cx = x + w / 2
  const cy = y + h / 2
  const rx = w / 2 - 2
  const ry = h / 2 - 2
  // Anillo exterior
  ctx.strokeStyle = primary
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()
  // Interior animado
  const phase = (time / 1000) % (Math.PI * 2)
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx)
  gradient.addColorStop(0, primary + 'cc')
  gradient.addColorStop(0.5, secondary + '88')
  gradient.addColorStop(1, primary + '00')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx - 2, ry - 2, phase * 0.5, 0, Math.PI * 2)
  ctx.fill()
}

function drawDefault(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6)
  ctx.fill()
}

// -------------------------------------------------------------------------
// HUD
// -------------------------------------------------------------------------

function renderHUD(
  ctx: CanvasRenderingContext2D,
  runtime: GameRuntime,
  width: number,
  height: number,
): void {
  const score = runtime.variableValues.get('puntuacion') ?? runtime.score
  const lives = runtime.variableValues.get('vidas') ?? 3

  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(0, 0, width, 36)

  ctx.fillStyle = '#ece6d8'
  ctx.font = 'bold 14px "Nunito", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(`Puntuación: ${score}`, 10, 18)

  ctx.textAlign = 'right'
  ctx.fillText(`Vidas: ${lives}`, width - 10, 18)

  if (runtime.phase === 'won') {
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#7fd6a3'
    ctx.font = 'bold 36px "Nunito", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('¡Ganaste! 🎉', width / 2, height / 2 - 20)
    ctx.fillStyle = '#ece6d8'
    ctx.font = '18px "Nunito", sans-serif'
    ctx.fillText(`Puntuación: ${runtime.score}`, width / 2, height / 2 + 20)
  }

  if (runtime.phase === 'lost') {
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#ff6b6b'
    ctx.font = 'bold 32px "Nunito", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Game Over', width / 2, height / 2 - 20)
    ctx.fillStyle = '#ece6d8'
    ctx.font = '16px "Nunito", sans-serif'
    ctx.fillText('Presiona reiniciar para intentarlo de nuevo', width / 2, height / 2 + 20)
  }

  if (runtime.phase === 'ready') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(width / 2 - 100, height / 2 - 24, 200, 48)
    ctx.fillStyle = '#ece6d8'
    ctx.font = '15px "Nunito", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Presiona ▶ para jugar', width / 2, height / 2)
  }
}

/**
 * Small canvas UI helpers shared by the arcade minigames.
 * -------------------------------------------------------------------------
 * Buttons drawn ON the canvas scale with the game (they never fall off a
 * phone screen) and are hit-tested in logical coordinates, so every game
 * gets the same look and the same tap behaviour.
 */

export interface Point {
  x: number
  y: number
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Pointer position in the game's logical coordinates. */
export function toLogical(canvas: HTMLCanvasElement, e: { clientX: number; clientY: number }, W: number, H: number): Point {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * W,
    y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * H,
  }
}

export function inBox(p: Point, b: Box): boolean {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h
}

export const FONT = 'Nunito, system-ui, sans-serif'

export const COLORS = {
  space: '#05060a',
  panel: '#0d1017',
  panel2: '#141925',
  line: '#2a3142',
  star: '#ece6d8',
  dim: '#a39d8e',
  gold: '#f3b54a',
  ink: '#120c04',
  ok: '#7fd6a3',
  bad: '#ff6b5a',
  cyan: '#75cbd1',
}

export interface ButtonStyle {
  primary?: boolean
  enabled?: boolean
  active?: boolean
  size?: number
}

/** A flat button drawn on the canvas. */
export function drawButton(c: CanvasRenderingContext2D, b: Box, label: string, style: ButtonStyle = {}): void {
  const { primary = false, enabled = true, active = false, size = 15 } = style
  c.save()
  c.globalAlpha = enabled ? 1 : 0.4
  c.fillStyle = primary || active ? COLORS.gold : COLORS.panel2
  roundRect(c, b.x, b.y, b.w, b.h, 8)
  c.fill()
  c.strokeStyle = primary || active ? COLORS.gold : COLORS.line
  c.lineWidth = 1.5
  c.stroke()
  c.fillStyle = primary || active ? COLORS.ink : COLORS.star
  c.font = `800 ${size}px ${FONT}`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1)
  c.restore()
}

export function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2)
  c.beginPath()
  c.moveTo(x + rr, y)
  c.lineTo(x + w - rr, y)
  c.quadraticCurveTo(x + w, y, x + w, y + rr)
  c.lineTo(x + w, y + h - rr)
  c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  c.lineTo(x + rr, y + h)
  c.quadraticCurveTo(x, y + h, x, y + h - rr)
  c.lineTo(x, y + rr)
  c.quadraticCurveTo(x, y, x + rr, y)
  c.closePath()
}

/** Fixed star field (deterministic: no flicker between frames). */
export function drawStars(c: CanvasRenderingContext2D, W: number, H: number, n = 60, alpha = 0.5): void {
  c.fillStyle = `rgba(236,230,216,${alpha})`
  for (let i = 0; i < n; i++) {
    const x = (i * 97 + 13) % W
    const y = (i * 53 + 7) % H
    const s = i % 5 === 0 ? 2 : 1.3
    c.fillRect(x, y, s, s)
  }
}

/** Text helper: left/center/right aligned label. */
export function text(
  c: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  opts: { size?: number; weight?: number; color?: string; align?: CanvasTextAlign } = {}
): void {
  const { size = 13, weight = 700, color = COLORS.star, align = 'left' } = opts
  c.fillStyle = color
  c.font = `${weight} ${size}px ${FONT}`
  c.textAlign = align
  c.textBaseline = 'alphabetic'
  c.fillText(s, x, y)
}

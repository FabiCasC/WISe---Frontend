/**
 * EAGLE LIFTOFF - drawing helpers (pure canvas, no game state).
 * -------------------------------------------------------------------------
 * Cartoon look for kids: soft gradients, cute faces on the ships, chunky
 * buttons and speech bubbles. Everything is drawn in logical coordinates.
 */
import { FONT, roundRect, type Box } from '../shared/canvasui'
import { PALETTE } from './theme'

const TAU = Math.PI * 2

// --- Sky -------------------------------------------------------------------

export function drawSky(c: CanvasRenderingContext2D, W: number, H: number, clock: number, still: boolean): void {
  const g = c.createLinearGradient(0, 0, W * 0.35, H)
  g.addColorStop(0, PALETTE.skyTop)
  g.addColorStop(0.55, PALETTE.skyMid)
  g.addColorStop(1, PALETTE.skyBottom)
  c.fillStyle = g
  c.fillRect(0, 0, W, H)

  // Soft nebula blobs.
  const blob = (x: number, y: number, r: number, rgb: string, a: number) => {
    const b = c.createRadialGradient(x, y, 0, x, y, r)
    b.addColorStop(0, `rgba(${rgb},${a})`)
    b.addColorStop(1, `rgba(${rgb},0)`)
    c.fillStyle = b
    c.fillRect(x - r, y - r, r * 2, r * 2)
  }
  blob(90, 90, 190, '255,107,157', 0.22)
  blob(W - 70, H - 150, 220, '94,234,212', 0.18)
  blob(W * 0.55, 20, 170, '167,139,250', 0.2)

  // Twinkling coloured stars (fixed positions; only the size breathes).
  for (let i = 0; i < 80; i++) {
    const x = (i * 97 + 13) % W
    const y = (i * 53 + 7) % H
    const base = i % 6 === 0 ? 2.4 : 1.4
    const tw = still ? 1 : 0.75 + 0.25 * Math.sin(clock * 2.2 + i * 1.7)
    c.fillStyle = PALETTE.starColors[i % PALETTE.starColors.length]
    c.globalAlpha = 0.55 + 0.35 * tw
    c.beginPath()
    c.arc(x, y, base * tw, 0, TAU)
    c.fill()
  }
  c.globalAlpha = 1
}

// --- Planets ---------------------------------------------------------------

export function drawMoon(c: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  // Glow
  const halo = c.createRadialGradient(cx, cy, r * 0.9, cx, cy, r + 26)
  halo.addColorStop(0, 'rgba(200,190,255,0.35)')
  halo.addColorStop(1, 'rgba(200,190,255,0)')
  c.fillStyle = halo
  c.beginPath()
  c.arc(cx, cy, r + 26, 0, TAU)
  c.fill()

  const g = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r)
  g.addColorStop(0, '#fffaf0')
  g.addColorStop(0.55, '#d6d3e6')
  g.addColorStop(1, '#9a94bd')
  c.fillStyle = g
  c.beginPath()
  c.arc(cx, cy, r, 0, TAU)
  c.fill()

  // Craters
  const craters: [number, number, number][] = [
    [-50, -28, 18],
    [42, 22, 26],
    [-22, 56, 14],
    [58, -46, 12],
    [-74, 28, 10],
    [8, -68, 9],
    [-4, 8, 8],
  ]
  for (const [dx, dy, cr] of craters) {
    c.fillStyle = 'rgba(110,100,150,0.32)'
    c.beginPath()
    c.arc(cx + dx, cy + dy, cr, 0, TAU)
    c.fill()
    c.strokeStyle = 'rgba(255,255,255,0.35)'
    c.lineWidth = 1.5
    c.beginPath()
    c.arc(cx + dx, cy + dy, cr, 0.2, Math.PI * 0.8)
    c.stroke()
  }
}

export function drawEarth(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const halo = c.createRadialGradient(x, y, r * 0.8, x, y, r + 14)
  halo.addColorStop(0, 'rgba(120,200,255,0.45)')
  halo.addColorStop(1, 'rgba(120,200,255,0)')
  c.fillStyle = halo
  c.beginPath()
  c.arc(x, y, r + 14, 0, TAU)
  c.fill()

  c.save()
  c.beginPath()
  c.arc(x, y, r, 0, TAU)
  c.clip()
  const g = c.createRadialGradient(x - r * 0.4, y - r * 0.4, 2, x, y, r)
  g.addColorStop(0, '#7dd3fc')
  g.addColorStop(1, '#1d4ed8')
  c.fillStyle = g
  c.fillRect(x - r, y - r, r * 2, r * 2)
  c.fillStyle = '#4ade80'
  c.beginPath()
  c.ellipse(x - r * 0.3, y - r * 0.2, r * 0.38, r * 0.25, -0.4, 0, TAU)
  c.fill()
  c.beginPath()
  c.ellipse(x + r * 0.35, y + r * 0.3, r * 0.3, r * 0.2, 0.5, 0, TAU)
  c.fill()
  c.fillStyle = 'rgba(255,255,255,0.7)'
  c.beginPath()
  c.ellipse(x + r * 0.1, y - r * 0.55, r * 0.35, r * 0.1, 0.2, 0, TAU)
  c.fill()
  c.restore()
}

// --- Ships -----------------------------------------------------------------

function face(c: CanvasRenderingContext2D, x: number, y: number, spread: number, happy: boolean): void {
  c.fillStyle = '#fff'
  for (const s of [-1, 1]) {
    c.beginPath()
    c.arc(x + s * spread, y, 2.8, 0, TAU)
    c.fill()
  }
  c.fillStyle = '#1b1b3a'
  for (const s of [-1, 1]) {
    c.beginPath()
    c.arc(x + s * spread, y + 0.5, 1.4, 0, TAU)
    c.fill()
  }
  c.strokeStyle = '#1b1b3a'
  c.lineWidth = 1.4
  c.lineCap = 'round'
  c.beginPath()
  if (happy) c.arc(x, y + 3.2, 3, 0.15 * Math.PI, 0.85 * Math.PI)
  else c.arc(x, y + 6, 2.4, 1.15 * Math.PI, 1.85 * Math.PI)
  c.stroke()
}

/** Eagle's ascent stage: the gold ship the player flies. `flame` is 0..1. */
export function drawEagle(c: CanvasRenderingContext2D, x: number, y: number, flame = 0, scale = 1, happy = true): void {
  c.save()
  c.translate(x, y)
  c.scale(scale, scale)

  if (flame > 0) {
    const len = 10 + 14 * flame
    const fg = c.createLinearGradient(0, 8, 0, 8 + len)
    fg.addColorStop(0, '#fff3b0')
    fg.addColorStop(0.5, '#ff9f43')
    fg.addColorStop(1, 'rgba(255,107,107,0)')
    c.fillStyle = fg
    c.beginPath()
    c.moveTo(-6, 8)
    c.lineTo(6, 8)
    c.lineTo(0, 8 + len)
    c.closePath()
    c.fill()
  }

  // legs
  c.strokeStyle = '#b07a14'
  c.lineWidth = 2.4
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(-8, 8)
  c.lineTo(-13, 14)
  c.moveTo(8, 8)
  c.lineTo(13, 14)
  c.stroke()

  // antenna
  c.strokeStyle = '#fff'
  c.lineWidth = 1.6
  c.beginPath()
  c.moveTo(0, -10)
  c.lineTo(0, -17)
  c.stroke()
  c.fillStyle = '#ff6b9d'
  c.beginPath()
  c.arc(0, -18, 2.6, 0, TAU)
  c.fill()

  // body
  const g = c.createLinearGradient(0, -11, 0, 10)
  g.addColorStop(0, '#fff0b3')
  g.addColorStop(1, '#f3a712')
  c.fillStyle = g
  roundRect(c, -11, -10, 22, 20, 7)
  c.fill()
  c.strokeStyle = '#9a6508'
  c.lineWidth = 1.6
  c.stroke()

  // window with a face
  c.fillStyle = '#26327a'
  c.beginPath()
  c.arc(0, -1, 7.5, 0, TAU)
  c.fill()
  face(c, 0, -3, 3, happy)
  c.restore()
}

/** The descent stage that stays on the Moon: base, legs and a little flag. */
export function drawDescentStage(c: CanvasRenderingContext2D, x: number, y: number): void {
  c.save()
  c.translate(x, y)
  // legs
  c.strokeStyle = '#8a5a12'
  c.lineWidth = 2.2
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(-10, 4)
  c.lineTo(-17, 12)
  c.moveTo(10, 4)
  c.lineTo(17, 12)
  c.stroke()
  // base
  const g = c.createLinearGradient(0, -2, 0, 8)
  g.addColorStop(0, '#e0a23a')
  g.addColorStop(1, '#a8701a')
  c.fillStyle = g
  roundRect(c, -14, -2, 28, 10, 4)
  c.fill()
  c.strokeStyle = '#6e460b'
  c.lineWidth = 1.2
  c.stroke()
  // flag
  c.strokeStyle = '#fff'
  c.lineWidth = 1.6
  c.beginPath()
  c.moveTo(-22, 12)
  c.lineTo(-22, -10)
  c.stroke()
  c.fillStyle = '#ff5a5f'
  c.fillRect(-22, -10, 12, 8)
  c.fillStyle = '#fff'
  c.fillRect(-22, -7, 12, 2)
  c.fillStyle = '#3b5bdb'
  c.fillRect(-22, -10, 5, 4)
  c.restore()
}

/** Columbia: a friendly teal capsule with blue solar panels. */
export function drawColumbia(c: CanvasRenderingContext2D, x: number, y: number, scale = 1, happy = true): void {
  c.save()
  c.translate(x, y)
  c.scale(scale, scale)
  // panels
  for (const s of [-1, 1]) {
    c.fillStyle = '#4f8dff'
    roundRect(c, s < 0 ? -27 : 13, -5, 14, 10, 2)
    c.fill()
    c.strokeStyle = '#d7e6ff'
    c.lineWidth = 1
    c.stroke()
    c.beginPath()
    c.moveTo(s < 0 ? -20 : 20, -5)
    c.lineTo(s < 0 ? -20 : 20, 5)
    c.stroke()
    c.strokeStyle = '#d7e6ff'
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(s < 0 ? -13 : 13, 0)
    c.lineTo(s < 0 ? -9 : 9, 0)
    c.stroke()
  }
  // nose cone
  c.fillStyle = '#ff6b9d'
  c.beginPath()
  c.moveTo(-6, -9)
  c.lineTo(6, -9)
  c.lineTo(0, -18)
  c.closePath()
  c.fill()
  // body
  const g = c.createLinearGradient(0, -10, 0, 10)
  g.addColorStop(0, '#b8fff6')
  g.addColorStop(1, '#27c5b0')
  c.fillStyle = g
  roundRect(c, -10, -10, 20, 20, 8)
  c.fill()
  c.strokeStyle = '#13806f'
  c.lineWidth = 1.6
  c.stroke()
  face(c, 0, -2, 3.6, happy)
  c.restore()
}

// --- UI pieces -------------------------------------------------------------

export interface BigButtonStyle {
  top: string
  bottom: string
  shadow: string
  text?: string
  enabled?: boolean
  pulse?: number // 0..1 pulse amount (tutorial target)
  sub?: string
}

/** Chunky 3D button with a big label and an optional small sub-label. */
export function bigButton(c: CanvasRenderingContext2D, b: Box, label: string, st: BigButtonStyle): void {
  const { top, bottom, shadow, text = PALETTE.ink, enabled = true, pulse = 0, sub } = st
  c.save()
  c.globalAlpha = enabled ? 1 : 0.42
  const grow = pulse * 4
  const x = b.x - grow
  const y = b.y - grow
  const w = b.w + grow * 2
  const h = b.h + grow * 2
  if (pulse > 0) {
    c.shadowColor = '#fff'
    c.shadowBlur = 18 * pulse
  }
  c.fillStyle = shadow
  roundRect(c, x, y + 5, w, h, 18)
  c.fill()
  c.shadowBlur = 0
  const g = c.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, top)
  g.addColorStop(1, bottom)
  c.fillStyle = g
  roundRect(c, x, y, w, h, 18)
  c.fill()
  c.strokeStyle = 'rgba(255,255,255,0.7)'
  c.lineWidth = 2
  c.stroke()
  // shine
  c.fillStyle = 'rgba(255,255,255,0.22)'
  roundRect(c, x + 8, y + 5, w - 16, h * 0.34, 10)
  c.fill()

  c.fillStyle = text
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  if (sub) {
    c.font = `900 18px ${FONT}`
    c.fillText(label, x + w / 2, y + h * 0.4)
    c.font = `800 12px ${FONT}`
    c.fillText(sub, x + w / 2, y + h * 0.75)
  } else {
    c.font = `900 21px ${FONT}`
    c.fillText(label, x + w / 2, y + h / 2 + 1)
  }
  c.restore()
}

/** Small rounded label. Returns its width. */
export function chip(
  c: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  opts: { size?: number; bg?: string; color?: string; align?: 'left' | 'center' | 'right' } = {},
): Box {
  const { size = 12, bg = 'rgba(20,10,60,0.65)', color = '#fff', align = 'left' } = opts
  c.save()
  c.font = `800 ${size}px ${FONT}`
  const tw = c.measureText(s).width
  const w = tw + 16
  const h = size + 10
  const bx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
  c.fillStyle = bg
  roundRect(c, bx, y, w, h, h / 2)
  c.fill()
  c.fillStyle = color
  c.textAlign = 'left'
  c.textBaseline = 'middle'
  c.fillText(s, bx + 8, y + h / 2 + 1)
  c.restore()
  return { x: bx, y, w, h }
}

export function wrap(c: CanvasRenderingContext2D, s: string, maxW: number): string[] {
  const out: string[] = []
  for (const para of s.split('\n')) {
    let line = ''
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word
      if (c.measureText(test).width > maxW && line) {
        out.push(line)
        line = word
      } else line = test
    }
    out.push(line)
  }
  return out
}

/** Capi the astronaut talking in a cream speech bubble. */
export function coachBubble(c: CanvasRenderingContext2D, s: string, box: Box, bounce: number): void {
  c.save()
  // mascot
  c.font = `34px ${FONT}`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText('🧑‍🚀', box.x + 22, box.y + box.h / 2 + bounce)
  // bubble
  const bx = box.x + 48
  const bw = box.w - 48
  c.fillStyle = 'rgba(0,0,0,0.25)'
  roundRect(c, bx, box.y + 3, bw, box.h, 16)
  c.fill()
  c.fillStyle = PALETTE.bubble
  roundRect(c, bx, box.y, bw, box.h, 16)
  c.fill()
  // tail
  c.beginPath()
  c.moveTo(bx + 1, box.y + box.h / 2 - 7)
  c.lineTo(bx - 9, box.y + box.h / 2)
  c.lineTo(bx + 1, box.y + box.h / 2 + 7)
  c.closePath()
  c.fill()
  c.strokeStyle = '#ffd166'
  c.lineWidth = 2
  roundRect(c, bx, box.y, bw, box.h, 16)
  c.stroke()

  c.fillStyle = PALETTE.bubbleText
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  const size = 14
  c.font = `800 ${size}px ${FONT}`
  const lines = wrap(c, s, bw - 22).slice(0, 2)
  const lh = size + 3
  const y0 = box.y + box.h / 2 - ((lines.length - 1) * lh) / 2
  lines.forEach((ln, i) => c.fillText(ln, bx + bw / 2, y0 + i * lh + 1))
  c.restore()
}

/** Name tag that pops up when the child taps something. */
export function nameTag(
  c: CanvasRenderingContext2D,
  name: string,
  line: string,
  x: number,
  y: number,
  W: number,
  age: number,
): void {
  const pop = Math.min(1, age / 0.18)
  const scale = 0.6 + 0.4 * (1 - Math.pow(1 - pop, 3)) * (pop < 1 ? 1.12 : 1)
  c.save()
  c.font = `900 15px ${FONT}`
  const nw = c.measureText(name).width
  c.font = `700 12px ${FONT}`
  const maxW = Math.min(250, W - 24)
  const lines = wrap(c, line, maxW - 20).slice(0, 2)
  const lw = Math.max(...lines.map((l) => c.measureText(l).width))
  const w = Math.min(maxW, Math.max(nw, lw) + 22)
  const h = 30 + lines.length * 15
  const bx = Math.max(8, Math.min(W - w - 8, x - w / 2))
  const by = Math.max(8, y)
  c.translate(bx + w / 2, by + h / 2)
  c.scale(scale, scale)
  c.translate(-(bx + w / 2), -(by + h / 2))
  c.fillStyle = 'rgba(0,0,0,0.3)'
  roundRect(c, bx, by + 3, w, h, 14)
  c.fill()
  c.fillStyle = '#fff'
  roundRect(c, bx, by, w, h, 14)
  c.fill()
  c.strokeStyle = PALETTE.gold
  c.lineWidth = 2.5
  roundRect(c, bx, by, w, h, 14)
  c.stroke()
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillStyle = '#3a2a6b'
  c.font = `900 15px ${FONT}`
  c.fillText(name, bx + w / 2, by + 15)
  c.fillStyle = '#5b4a99'
  c.font = `700 12px ${FONT}`
  lines.forEach((ln, i) => c.fillText(ln, bx + w / 2, by + 32 + i * 15))
  c.restore()
}

/** Pulsing halo that says "tap me" / "this is the target". */
export function pulseHalo(c: CanvasRenderingContext2D, x: number, y: number, r: number, clock: number, color = '#ffffff'): void {
  const k = (Math.sin(clock * 5) + 1) / 2
  c.save()
  c.strokeStyle = color
  c.globalAlpha = 0.35 + 0.5 * k
  c.lineWidth = 3
  c.setLineDash([6, 5])
  c.beginPath()
  c.arc(x, y, r + 4 + k * 5, 0, TAU)
  c.stroke()
  c.restore()
}

export function checkBadge(c: CanvasRenderingContext2D, x: number, y: number): void {
  c.save()
  c.fillStyle = PALETTE.ok
  c.beginPath()
  c.arc(x, y, 8, 0, TAU)
  c.fill()
  c.strokeStyle = '#fff'
  c.lineWidth = 2
  c.stroke()
  c.strokeStyle = '#0b3d1f'
  c.lineWidth = 2.2
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(x - 3.5, y)
  c.lineTo(x - 0.8, y + 3)
  c.lineTo(x + 4, y - 3)
  c.stroke()
  c.restore()
}

// --- Particles -------------------------------------------------------------

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  /** 'dot' glows, 'rect' is confetti. */
  kind: 'dot' | 'rect'
  rot: number
  spin: number
  gravity: number
}

export function drawParticles(c: CanvasRenderingContext2D, ps: Particle[]): void {
  for (const p of ps) {
    const a = Math.max(0, p.life / p.max)
    c.save()
    c.globalAlpha = a
    c.fillStyle = p.color
    if (p.kind === 'dot') {
      c.beginPath()
      c.arc(p.x, p.y, p.size * (0.4 + 0.6 * a), 0, TAU)
      c.fill()
    } else {
      c.translate(p.x, p.y)
      c.rotate(p.rot)
      c.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size)
    }
    c.restore()
  }
}

export function stepParticles(ps: Particle[], dt: number): void {
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]
    p.life -= dt
    if (p.life <= 0) {
      ps.splice(i, 1)
      continue
    }
    p.vy += p.gravity * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rot += p.spin * dt
  }
}

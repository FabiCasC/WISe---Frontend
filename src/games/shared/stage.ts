/**
 * Escenario comun de los minijuegos.
 * -------------------------------------------------------------------------
 * Resuelve de una vez lo que los tres necesitan igual:
 *   - canvas nitido en pantallas HiDPI, con tamano LOGICO fijo (el juego
 *     dibuja siempre en las mismas coordenadas; la pantalla solo escala),
 *   - HUD de marcadores arriba,
 *   - capa de mensajes (inicio, pausa, derrota, victoria) con botones,
 *   - ayuda de controles y botonera tactil,
 *   - limpieza total: un solo destroy() deja el contenedor vacio, como
 *     exige el contrato del portal.
 */

export interface StageOptions {
  /** Ancho logico del lienzo. El juego dibuja siempre en esta escala. */
  width: number
  /** Alto logico del lienzo. */
  height: number
  accent: string
}

export interface Stat {
  key: string
  label: string
  value: string
  /** Barra 0..1 opcional bajo el valor (energia, tiempo). */
  meter?: number
  tone?: 'ok' | 'warn' | 'bad'
}

export interface OverlayButton {
  label: string
  onClick: () => void
  variant?: 'primary' | 'quiet'
}

export interface OverlayContent {
  title: string
  text?: string
  /** Dato cientifico, en su propia caja. */
  fact?: string
  score?: string
  buttons: OverlayButton[]
  tone?: 'win' | 'lose' | 'neutral'
}

export interface Stage {
  root: HTMLElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  setStats: (stats: Stat[]) => void
  showOverlay: (content: OverlayContent) => void
  hideOverlay: () => void
  /** Aviso flotante breve (p.ej. "+50"). */
  flash: (text: string, tone?: 'ok' | 'bad') => void
  /** Botonera tactil. Devuelve el elemento para engancharle eventos. */
  addTouchButton: (label: string, ariaLabel: string) => HTMLButtonElement
  setHint: (text: string) => void
  destroy: () => void
}

export function createStage(container: HTMLElement, opts: StageOptions): Stage {
  const { width, height, accent } = opts

  const root = document.createElement('div')
  root.className = 'mg'
  root.style.setProperty('--mg-accent', accent)

  // --- HUD -----------------------------------------------------------------
  const hud = document.createElement('div')
  hud.className = 'mg__hud'

  // --- Lienzo --------------------------------------------------------------
  const frame = document.createElement('div')
  frame.className = 'mg__frame'

  const canvas = document.createElement('canvas')
  canvas.className = 'mg__canvas'
  // El canvas es decorativo para lectores de pantalla: el estado real se
  // anuncia por el HUD y la capa de mensajes, que si son texto.
  canvas.setAttribute('role', 'presentation')

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('This browser cannot draw on a 2D canvas.')

  frame.append(canvas)

  // --- Capa de mensajes ----------------------------------------------------
  const overlay = document.createElement('div')
  overlay.className = 'mg__overlay'
  overlay.hidden = true
  // Los mensajes importantes se anuncian solos.
  overlay.setAttribute('role', 'status')
  frame.append(overlay)

  // --- Avisos flotantes ----------------------------------------------------
  const flashes = document.createElement('div')
  flashes.className = 'mg__flashes'
  flashes.setAttribute('aria-hidden', 'true')
  frame.append(flashes)

  // --- Pie: ayuda + tactil -------------------------------------------------
  const foot = document.createElement('div')
  foot.className = 'mg__foot'

  const hint = document.createElement('p')
  hint.className = 'mg__hint'

  const pad = document.createElement('div')
  pad.className = 'mg__pad'

  foot.append(hint, pad)
  root.append(hud, frame, foot)
  container.append(root)

  // --- Escalado ------------------------------------------------------------
  // El lienzo mantiene su proporcion y ocupa el maximo posible del hueco.
  let disposed = false

  const resize = () => {
    if (disposed) return
    const box = frame.getBoundingClientRect()
    if (box.width < 1 || box.height < 1) return

    const scale = Math.min(box.width / width, box.height / height)
    const cssW = Math.max(1, Math.floor(width * scale))
    const cssH = Math.max(1, Math.floor(height * scale))

    // Se limita a 2 para no castigar moviles con pantallas 3x.
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const pxW = Math.round(cssW * dpr)
    const pxH = Math.round(cssH * dpr)

    canvas.style.width = cssW + 'px'
    canvas.style.height = cssH + 'px'

    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW
      canvas.height = pxH
    }
    // Una unidad de dibujo = una unidad logica, en cualquier pantalla.
    ctx.setTransform(pxW / width, 0, 0, pxH / height, 0, 0)
    ctx.imageSmoothingEnabled = true
  }

  const observer = new ResizeObserver(resize)
  observer.observe(frame)
  resize()
  // El primer frame puede llegar con el contenedor aun sin medidas.
  requestAnimationFrame(resize)

  // --- HUD: render ---------------------------------------------------------
  const setStats = (stats: Stat[]) => {
    if (disposed) return
    // Se reutilizan los nodos existentes: reconstruir el HUD 60 veces por
    // segundo provocaria parpadeo y basura para el recolector.
    const existing = new Map<string, HTMLElement>()
    for (const el of Array.from(hud.children)) {
      const key = (el as HTMLElement).dataset.key
      if (key) existing.set(key, el as HTMLElement)
    }

    const seen = new Set<string>()
    for (const stat of stats) {
      seen.add(stat.key)
      let cell = existing.get(stat.key)
      if (!cell) {
        cell = document.createElement('div')
        cell.className = 'mg__stat'
        cell.dataset.key = stat.key
        const label = document.createElement('b')
        label.className = 'mg__stat-label'
        const value = document.createElement('span')
        value.className = 'mg__stat-value'
        cell.append(label, value)
        hud.append(cell)
      }

      const label = cell.querySelector('.mg__stat-label') as HTMLElement
      const value = cell.querySelector('.mg__stat-value') as HTMLElement
      if (label.textContent !== stat.label) label.textContent = stat.label
      if (value.textContent !== stat.value) value.textContent = stat.value

      const tone = stat.tone ?? ''
      if (cell.dataset.tone !== tone) {
        cell.dataset.tone = tone
        cell.className = 'mg__stat' + (tone ? ' is-' + tone : '')
      }

      let bar = cell.querySelector('.mg__stat-bar') as HTMLElement | null
      if (stat.meter === undefined) {
        bar?.remove()
      } else {
        if (!bar) {
          bar = document.createElement('div')
          bar.className = 'mg__stat-bar'
          const fill = document.createElement('i')
          bar.append(fill)
          cell.append(bar)
        }
        const fill = bar.firstElementChild as HTMLElement
        const pct = Math.round(Math.max(0, Math.min(1, stat.meter)) * 100) + '%'
        if (fill.style.width !== pct) fill.style.width = pct
      }
    }

    for (const [key, el] of existing) if (!seen.has(key)) el.remove()
  }

  // --- Mensajes ------------------------------------------------------------
  const showOverlay = (content: OverlayContent) => {
    if (disposed) return
    overlay.replaceChildren()
    overlay.hidden = false
    overlay.dataset.tone = content.tone ?? 'neutral'

    const card = document.createElement('div')
    card.className = 'mg__card'

    const h = document.createElement('h2')
    h.className = 'mg__card-title'
    h.textContent = content.title
    card.append(h)

    if (content.score) {
      const s = document.createElement('p')
      s.className = 'mg__card-score'
      s.textContent = content.score
      card.append(s)
    }

    if (content.text) {
      const p = document.createElement('p')
      p.className = 'mg__card-text'
      p.textContent = content.text
      card.append(p)
    }

    if (content.fact) {
      const f = document.createElement('p')
      f.className = 'mg__card-fact'
      const tag = document.createElement('b')
      tag.textContent = 'Real fact: '
      f.append(tag, document.createTextNode(content.fact))
      card.append(f)
    }

    const row = document.createElement('div')
    row.className = 'mg__card-actions'
    for (const b of content.buttons) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'btn ' + (b.variant === 'quiet' ? 'btn--quiet' : 'btn--primary')
      btn.textContent = b.label
      btn.addEventListener('click', b.onClick)
      row.append(btn)
    }
    card.append(row)
    overlay.append(card)

    // El foco va al primer boton: se puede seguir jugando solo con teclado.
    const first = row.querySelector('button')
    if (first) requestAnimationFrame(() => first.focus())
  }

  const hideOverlay = () => {
    if (disposed) return
    overlay.hidden = true
    overlay.replaceChildren()
  }

  // --- Avisos flotantes ----------------------------------------------------
  const timers = new Set<number>()
  const flash = (text: string, tone: 'ok' | 'bad' = 'ok') => {
    if (disposed) return
    const el = document.createElement('span')
    el.className = 'mg__flash is-' + tone
    el.textContent = text
    flashes.append(el)
    const t = window.setTimeout(() => {
      el.remove()
      timers.delete(t)
    }, 900)
    timers.add(t)
  }

  const addTouchButton = (label: string, ariaLabel: string) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'mg__padbtn'
    btn.textContent = label
    btn.setAttribute('aria-label', ariaLabel)
    pad.append(btn)
    return btn
  }

  const setHint = (text: string) => {
    if (hint.textContent !== text) hint.textContent = text
  }

  return {
    root,
    canvas,
    ctx,
    width,
    height,
    setStats,
    showOverlay,
    hideOverlay,
    flash,
    addTouchButton,
    setHint,
    destroy() {
      disposed = true
      observer.disconnect()
      for (const t of timers) window.clearTimeout(t)
      timers.clear()
      root.remove()
    },
  }
}

/**
 * Bucle de animacion con pausa real.
 *
 * Dos cuidados que evitan fallos clasicos:
 *   - el delta se recorta a 50 ms: si la pestana se queda atras (o el equipo
 *     va lento), el jugador no reaparece al otro lado del mapa de golpe;
 *   - al reanudar se reinicia la marca de tiempo, asi una pausa larga no
 *     produce un salto gigante en el primer frame.
 */
export interface Loop {
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  readonly running: boolean
}

export function createLoop(step: (dtMs: number) => void): Loop {
  let raf = 0
  let last = 0
  let paused = false
  let stopped = false

  const frame = (now: number) => {
    if (stopped) return
    raf = requestAnimationFrame(frame)
    if (paused) {
      last = now
      return
    }
    const dt = Math.min(50, now - last)
    last = now
    step(dt)
  }

  return {
    start() {
      if (stopped || raf) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    },
    pause() {
      paused = true
    },
    resume() {
      if (stopped) return
      paused = false
      last = performance.now()
    },
    stop() {
      stopped = true
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    },
    get running() {
      return !stopped && !paused
    },
  }
}

/**
 * Entrada unificada: teclado y tactil en el mismo sitio, con un solo
 * `destroy()` que quita TODOS los listeners. El contrato del portal exige
 * que al salir no quede ningun listener vivo.
 */
export interface Input {
  /** Teclas pulsadas ahora mismo (codigos de KeyboardEvent.code). */
  readonly held: ReadonlySet<string>
  /** Suscribe una pulsacion. Devuelve la funcion para cancelarla. */
  onPress: (handler: (code: string) => void) => () => void
  destroy: () => void
}

export function createInput(target: HTMLElement): Input {
  const held = new Set<string>()
  const handlers = new Set<(code: string) => void>()

  // Teclas que el navegador usaria para desplazar la pagina: dentro de una
  // partida eso es siempre un estorbo.
  const BLOCKED = new Set([
    'Space',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'PageUp',
    'PageDown',
  ])

  const onKeyDown = (e: KeyboardEvent) => {
    if (BLOCKED.has(e.code)) e.preventDefault()
    // Escape lo gobierna el portal (salir de la partida): no se toca aqui.
    if (e.code === 'Escape') return
    if (e.repeat) {
      held.add(e.code)
      return
    }
    held.add(e.code)
    for (const h of handlers) h(e.code)
  }

  const onKeyUp = (e: KeyboardEvent) => {
    held.delete(e.code)
  }

  // Si la ventana pierde el foco con una tecla pulsada, esa tecla se quedaria
  // "pegada" para siempre.
  const onBlur = () => held.clear()

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)

  // Evita el zoom por doble toque en moviles mientras se juega.
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 1) e.preventDefault()
  }
  target.addEventListener('touchstart', onTouchStart, { passive: false })

  return {
    held,
    onPress(handler) {
      handlers.add(handler)
      return () => handlers.delete(handler)
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      target.removeEventListener('touchstart', onTouchStart)
      handlers.clear()
      held.clear()
    },
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  GameContext,
  GameController,
  GameId,
  GameModule,
  GameResult,
  GameSettings,
  LevelId,
} from '../shared/types'
import { getMission } from '../content/missions'
import { IconBack, IconPause, IconPlay } from './components/Art'

/**
 * Carga perezosa de cada módulo: el bundle de un juego solo viaja al
 * navegador cuando el jugador abre ese portal.
 */
const LOADERS: Record<GameId, () => Promise<GameModule>> = {
  opportunity: () => import('../games/opportunity'),
  'lunar-signals': () => import('../games/lunar-signals'),
  spirit: () => import('../games/spirit'),
}

type Status = 'loading' | 'ready' | 'error'

interface Props {
  gameId: GameId
  levelId: LevelId
  settings: GameSettings
  onResult: (result: GameResult) => void
  onExit: () => void
}

export default function GameHost({ gameId, levelId, settings, onResult, onExit }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<GameController | null>(null)
  /** Cola de destrucción: un montaje nuevo espera a que el anterior termine. */
  const teardownRef = useRef<Promise<void>>(Promise.resolve())
  /** onComplete se procesa UNA sola vez por partida (regla del contrato). */
  const settledRef = useRef(false)

  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)

  const mission = getMission(gameId)

  // Callbacks estables: evitan remontar el juego cuando el padre re-renderiza.
  const onResultRef = useRef(onResult)
  const onExitRef = useRef(onExit)
  const settingsRef = useRef(settings)
  useEffect(() => {
    onResultRef.current = onResult
    onExitRef.current = onExit
    settingsRef.current = settings
  })

  useEffect(() => {
    let cancelled = false
    const container = mountRef.current
    if (!container) return

    setStatus('loading')
    setError(null)
    setPaused(false)
    settledRef.current = false

    const context: GameContext = {
      gameId,
      levelId,
      // Semilla reproducible: permite volver a un fallo exacto en QA.
      seed: `${gameId}-${levelId}-${Date.now().toString(36)}`,
      settings: settingsRef.current,
      onComplete: (result) => {
        if (settledRef.current) return
        settledRef.current = true
        onResultRef.current(result)
      },
      onExit: () => onExitRef.current(),
    }

    const start = teardownRef.current.then(async () => {
      try {
        const mod = await LOADERS[gameId]()
        if (cancelled) return

        const controller = await mod.mountGame(container, context)

        // Si el usuario ya salió mientras cargaba, se desmonta de inmediato.
        if (cancelled) {
          await controller.destroy()
          return
        }

        controllerRef.current = controller
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        console.error('[GameHost] fallo al montar', gameId, err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setStatus('error')
      }
    })

    return () => {
      cancelled = true
      const controller = controllerRef.current
      controllerRef.current = null

      // La promesa de destrucción se encadena: el siguiente montaje la espera.
      teardownRef.current = start
        .then(() => controller?.destroy())
        .catch((err) => console.error('[GameHost] fallo al destruir', err))
        .then(() => {
          // Red de seguridad: si un módulo olvidó limpiar su canvas.
          if (container.childElementCount > 0) container.replaceChildren()
        })
    }
  }, [gameId, levelId])

  // La sala de juego ocupa la pantalla: el portal de fondo no debe desplazarse.
  useEffect(() => {
    document.body.classList.add('is-locked')
    return () => document.body.classList.remove('is-locked')
  }, [])

  // Pausa automática al cambiar de pestaña: no suena ni consume batería.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && controllerRef.current) {
        controllerRef.current.pause()
        setPaused(true)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const togglePause = useCallback(() => {
    const controller = controllerRef.current
    if (!controller) return
    setPaused((prev) => {
      if (prev) controller.resume()
      else controller.pause()
      return !prev
    })
  }, [])

  // Escape vuelve al portal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExitRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const level = mission?.levels.find((l) => l.id === levelId)

  return (
    <section className="arena" aria-label={`Partida: ${mission?.title ?? gameId}`}>
      <header className="arena__bar">
        <button type="button" className="btn btn--quiet" onClick={() => onExitRef.current()}>
          <IconBack />
          Portal
        </button>

        <div className="arena__id">
          <span className="arena__name">{mission?.title ?? gameId}</span>
          <span className="arena__level">
            Nivel {levelId}
            {level ? ` · ${level.name}` : ''}
            {settings.practice ? ' · práctica' : ''}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={togglePause}
          disabled={status !== 'ready'}
          aria-pressed={paused}
        >
          {paused ? <IconPlay size={16} /> : <IconPause />}
          {paused ? 'Reanudar' : 'Pausa'}
        </button>
      </header>

      <div className="arena__stage">
        <div className="arena__mount" ref={mountRef} />

        {status === 'loading' && (
          <div className="stub" style={{ position: 'absolute' }}>
            <div className="stub__ring" />
            <p className="stub__text">Abriendo el portal…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="stub" style={{ position: 'absolute' }}>
            <h2 className="stub__title">No se pudo abrir este portal</h2>
            <p className="stub__text">
              {error ?? 'El módulo no respondió.'} El resto del arcade sigue funcionando.
            </p>
            <button type="button" className="btn btn--primary" onClick={() => onExitRef.current()}>
              Volver al portal
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

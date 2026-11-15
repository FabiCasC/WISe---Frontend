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
import { getGame } from '../content/games'
import { getMission } from '../content/missions'
import { IconBack, IconPause, IconPlay } from './components/Art'

/**
 * Carga perezosa de cada módulo: el bundle de un juego solo viaja al
 * navegador cuando el jugador abre ese portal.
 */
/** One loader per playable game. New games: add a line here and an entry in content/games.ts. */
const LOADERS: Record<GameId, () => Promise<GameModule>> = {
  opportunity: () => import('../games/opportunity'),
  'lunar-signals': () => import('../games/lunar-signals'),
  spirit: () => import('../games/spirit'),
  'dust-run': () => import('../games/dust-run'),
  'gusev-maze': () => import('../games/gusev-maze'),
  'orbital-grid': () => import('../games/orbital-grid'),
  'sun-shade': () => import('../games/sun-shade'),
  'eagle-liftoff': () => import('../games/eagle-liftoff'),
  'lunar-rover': () => import('../games/lunar-rover'),
  'pathfinder-bounce': () => import('../games/pathfinder-bounce'),
  'sojourner-commands': () => import('../games/sojourner-commands'),
  'phoenix-ice': () => import('../games/phoenix-ice'),
  'ingenuity-flight': () => import('../games/ingenuity-flight'),
  'lro-search': () => import('../games/lro-search'),
  'dart-impact': () => import('../games/dart-impact'),
  'artemis-landing': () => import('../games/artemis-landing'),
  'snake-express': () => import('../games/snake-express'),
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
  const title = getGame(gameId)?.title ?? mission?.title ?? gameId

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
        const load = LOADERS[gameId]
        if (!load) throw new Error('This game is not available yet.')
        const mod = await load()
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
        setError(err instanceof Error ? err.message : 'Unknown error')
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
    <section className="arena" aria-label={`Game: ${title}`}>
      <header className="arena__bar">
        <button type="button" className="btn btn--quiet" onClick={() => onExitRef.current()}>
          <IconBack />
          Arcade
        </button>

        <div className="arena__id">
          <span className="arena__name">{title}</span>
          <span className="arena__level">
            Level {levelId}
            {level ? ` · ${level.name}` : ''}
            {settings.practice ? ' · practice' : ''}
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
          {paused ? 'Resume' : 'Pause'}
        </button>
      </header>

      <div className="arena__stage">
        <div
          className={gameId === 'spirit' ? 'arena__mount arena__mount--spirit' : 'arena__mount'}
          ref={mountRef}
        />

        {status === 'loading' && (
          <div className="stub" style={{ position: 'absolute' }}>
            <div className="stub__ring" />
            <p className="stub__text">Opening the game…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="stub" style={{ position: 'absolute' }}>
            <h2 className="stub__title">This game could not open</h2>
            <p className="stub__text">
              {error ?? 'The game module did not respond.'} The rest of the arcade still works.
            </p>
            <button type="button" className="btn btn--primary" onClick={() => onExitRef.current()}>
              Back to the portal
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

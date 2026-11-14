import { useState } from 'react'
import type { MissionCard } from '../../content/missions'
import type { Progress } from '../../shared/types'
import { IconPlay, MissionScene } from './Art'

/**
 * Azulejo de juego. Dos tamaños:
 *   · grid     → ocupa 2×2 celdas dentro del mosaico
 *   · featured → suelto y grande, para la fila centrada de juegos reales
 */
export default function GameTile({
  mission,
  progress,
  onPlay,
  variant = 'grid',
}: {
  mission: MissionCard
  progress: Progress
  onPlay: () => void
  variant?: 'grid' | 'featured'
}) {
  const done = progress.games[mission.gameId]?.levelsCompleted ?? []
  // La ilustración solo se muestra si de verdad cargó; si falta, debajo sigue
  // estando la escena dibujada en CSS/SVG y el azulejo nunca se ve roto.
  const [artLoaded, setArtLoaded] = useState(false)

  const featured = variant === 'featured'

  return (
    <button
      type="button"
      className={`tile tile--game${featured ? ' tile--featured' : ''}`}
      style={{ ['--accent' as string]: mission.accent }}
      onClick={onPlay}
    >
      <span className="tile__scene">
        <MissionScene gameId={mission.gameId} accent={mission.accent} />
      </span>

      <img
        className={`tile__art${artLoaded ? ' is-loaded' : ''}`}
        src={mission.art}
        alt=""
        loading={featured ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setArtLoaded(true)}
        onError={() => setArtLoaded(false)}
      />

      <span className="tile__flag">JUGAR</span>
      <span className="tile__shade" />

      <span className="tile__caption">
        {featured && <span className="tile__body">{mission.bodyLabel}</span>}
        <span className="tile__name">{mission.title}</span>
        {featured && <span className="tile__kicker">{mission.genre}</span>}
        <span className="tile__dots">
          {mission.levels.map((l) => (
            <i key={l.id} className={`dot${done.includes(l.id) ? ' is-on' : ''}`} />
          ))}
          {featured && (
            <span className="tile__count">
              {done.length}/{mission.levels.length}
            </span>
          )}
        </span>
      </span>

      <span className="tile__play">
        <IconPlay size={featured ? 30 : 22} />
      </span>
    </button>
  )
}

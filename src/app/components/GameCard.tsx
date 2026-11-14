import { useState } from 'react'
import type { UpcomingCard } from '../../content/catalog'
import type { MissionCard } from '../../content/missions'
import { isLevelUnlocked, nextPlayableLevel } from '../../shared/progress'
import type { LevelId, Progress } from '../../shared/types'
import { IconInfo, IconLock, IconPlay, IconRocket, IconStar, IconVR, MissionScene } from './Art'

interface Props {
  mission: MissionCard
  progress: Progress
  onPlay: (levelId: LevelId) => void
  onDossier: () => void
}

/**
 * Tarjeta de juego del catálogo. Un clic en la miniatura juega el siguiente
 * nivel; los puntos de abajo permiten elegir nivel (bloqueados hasta
 * completar el anterior). La miniatura se anima al pasar el mouse o con foco.
 */
export default function GameCard({ mission, progress, onPlay, onDossier }: Props) {
  const [artLoaded, setArtLoaded] = useState(false)
  const done = progress.games[mission.gameId]?.levelsCompleted ?? []
  const next = nextPlayableLevel(progress, mission.gameId)
  const complete = new Set(done).size >= 3

  return (
    <article className="gcard" style={{ ['--accent' as string]: mission.accent }}>
      <button
        type="button"
        className="gcard__thumb"
        onClick={() => onPlay(next)}
        aria-label={`Jugar ${mission.title}, nivel ${next}`}
      >
        <MissionScene gameId={mission.gameId} accent={mission.accent} />
        <img
          className={`gcard__art${artLoaded ? ' is-loaded' : ''}`}
          src={mission.art}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setArtLoaded(true)}
          onError={() => setArtLoaded(false)}
        />
        <span className="gcard__body-tag">{mission.bodyLabel}</span>
        {complete && (
          <span className="gcard__seal" title="Misión completada">
            <IconStar size={14} /> Completado
          </span>
        )}
        <span className="gcard__play">
          <IconPlay size={26} />
        </span>
      </button>

      <div className="gcard__info">
        <h3 className="gcard__title">{mission.title}</h3>
        <p className="gcard__genre">{mission.genre}</p>

        <div className="gcard__foot">
          <div className="gcard__levels" role="group" aria-label={`Niveles de ${mission.title}`}>
            {mission.levels.map((l) => {
              const isDone = done.includes(l.id)
              const open = isLevelUnlocked(progress, mission.gameId, l.id)
              const state = isDone ? 'completado' : open ? 'disponible' : 'bloqueado'
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`lvdot is-${state}`}
                  disabled={!open}
                  onClick={() => onPlay(l.id)}
                  aria-label={`Nivel ${l.id}, ${l.name}: ${state}${open ? '' : `. Completa el nivel ${l.id - 1} para abrirlo`}`}
                  title={`${l.id}. ${l.name} — ${l.goal}`}
                >
                  {open ? <span aria-hidden="true">{l.id}</span> : <IconLock size={12} />}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="gcard__ficha"
            onClick={onDossier}
            aria-label={`Ficha científica de ${mission.title}`}
          >
            <IconInfo size={16} />
            Ficha
          </button>
        </div>
      </div>
    </article>
  )
}

/** Tarjeta de un juego que aún no existe: bloqueada por nivel o "Próximamente". */
export function UpcomingTile({ card, level }: { card: UpcomingCard; level: number }) {
  const unlocked = card.unlockAt !== null && level >= card.unlockAt
  const status =
    card.unlockAt === null
      ? 'Próximamente'
      : unlocked
        ? '¡Desbloqueado! Muy pronto'
        : `Se desbloquea en nivel ${card.unlockAt}`

  return (
    <article
      className={`gcard gcard--upcoming is-${card.icon}${unlocked ? ' is-unlocked' : ''}`}
      aria-label={`${card.title}. ${status}`}
    >
      <div className="gcard__thumb gcard__thumb--upcoming" aria-hidden="true">
        <span className="gcard__upcoming-icon">
          {card.icon === 'vr' ? <IconVR size={44} /> : <IconRocket size={44} />}
        </span>
        <span className="gcard__upcoming-title">{card.title}</span>
        <span className="gcard__lock">
          {card.unlockAt === null || !unlocked ? <IconLock size={14} /> : <IconStar size={14} />}
          {status}
        </span>
      </div>
      <div className="gcard__info">
        <h3 className="gcard__title">{card.title}</h3>
        <p className="gcard__genre">{card.teaser}</p>
      </div>
    </article>
  )
}

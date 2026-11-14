import { useState } from 'react'
import type { MissionCard } from '../../content/missions'
import type { Progress } from '../../shared/types'
import { IconInfo, IconPlay, MissionScene } from './Art'

interface Props {
  mission: MissionCard
  progress: Progress
  onPlay: () => void
  onDossier: () => void
}

export default function PortalCard({ mission, progress, onPlay, onDossier }: Props) {
  // El arte opcional solo se muestra si realmente cargó. Mientras tanto —y
  // para siempre, si nunca llega— se ve la escena CSS/SVG, que no falla.
  const [artLoaded, setArtLoaded] = useState(false)

  const done = progress.games[mission.gameId]?.levelsCompleted ?? []
  const [minMin, maxMin] = mission.durationMin

  return (
    <article
      className="portal"
      style={{ ['--accent' as string]: mission.accent }}
      aria-labelledby={`portal-${mission.gameId}`}
    >
      <div className="portal__window">
        <MissionScene gameId={mission.gameId} accent={mission.accent} />

        <img
          className={`portal__art${artLoaded ? ' is-loaded' : ''}`}
          src={mission.art}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setArtLoaded(true)}
          onError={() => setArtLoaded(false)}
        />

        <span className="portal__badge">
          <i className="portal__badge-dot" />
          {mission.bodyLabel}
        </span>
        <span className="portal__time">
          {minMin}–{maxMin} min
        </span>

        <div className="portal__play">
          <span className="portal__play-btn">
            <IconPlay size={26} />
          </span>
        </div>
      </div>

      <div className="portal__body">
        <div>
          <h3 className="portal__title" id={`portal-${mission.gameId}`}>
            {mission.title}
          </h3>
          <p className="portal__kicker">{mission.kicker}</p>
        </div>

        <blockquote className="portal__voice">
          «{mission.voice}»
          <span className="portal__voice-tag">Dramatización educativa</span>
        </blockquote>

        <div className="portal__meta">
          <span className="chip chip--accent">{mission.genre}</span>
          <span className="chip">{mission.hardware}</span>
        </div>

        <div className="portal__levels">
          <span className="portal__levels-label">Niveles</span>
          {mission.levels.map((lvl) => (
            <span
              key={lvl.id}
              className={`lvl${done.includes(lvl.id) ? ' is-done' : ''}`}
              title={`${lvl.id}. ${lvl.name} — ${lvl.goal}`}
            />
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-faint)' }}>
            {done.length}/3
          </span>
        </div>
      </div>

      <div className="portal__actions">
        <button type="button" className="btn btn--primary" onClick={onPlay}>
          <IconPlay />
          Jugar
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onDossier}
          aria-label={`Ficha científica de ${mission.title}`}
        >
          <IconInfo />
          Ficha
        </button>
      </div>
    </article>
  )
}

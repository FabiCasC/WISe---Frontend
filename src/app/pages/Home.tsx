import { UPCOMING } from '../../content/catalog'
import { MISSIONS, type MissionCard } from '../../content/missions'
import type { Membership } from '../../shared/classroom'
import {
  GENERAL_LEVELS,
  MAX_GENERAL_LEVEL,
  getGeneralLevel,
  isLevelUnlocked,
  nextGeneralLevel,
  nextPlayableLevel,
  totalLevelsCompleted,
} from '../../shared/progress'
import type { GameId, LevelId, Progress } from '../../shared/types'
import { IconInfo, IconLock, IconPlay, IconTeacher, IconVR } from '../components/Art'
import JoinBox from '../components/JoinBox'
import SiteFooter from '../components/SiteFooter'

interface Props {
  progress: Progress
  membership: Membership | null
  onPlay: (mission: MissionCard, levelId: LevelId) => void
  onDossier: (gameId: GameId) => void
}

/**
 * Portada: arriba, una banda para unirse a la clase con código (al estilo de
 * los portales de clase); abajo, la rejilla de juegos de un clic (al estilo
 * de los portales de juegos). Diseño plano con colores de la NASA.
 */
export default function Home({ progress, membership, onPlay, onDossier }: Props) {
  const level = getGeneralLevel(progress)

  return (
    <>
      {/* ======================================================== UNIRSE */}
      <section className="band" aria-labelledby="band-title">
        <div className="band__inner">
          <h1 className="band__title" id="band-title">
            Aprende jugando con misiones reales de la NASA
          </h1>
          <p className="band__lede">
            Juegos cortos para explorar la Luna y Marte como lo hicieron los rovers y los
            astronautas. Sin cuenta y gratis.
          </p>

          <div className="joincard">
            {membership ? (
              <div className="joincard__member">
                <p className="joincard__label">Estás en la clase {membership.code}</p>
                <p className="joincard__nick">{membership.nickname}</p>
                <div className="joincard__row">
                  <a className="btn btn--primary btn--lg" href="#juegos">
                    <IconPlay /> Seguir jugando
                  </a>
                  <a className="btn btn--quiet" href="#/clase">
                    Ver mi clase
                  </a>
                </div>
              </div>
            ) : (
              <JoinBox />
            )}
          </div>

          <div className="band__links">
            <a className="band__link" href="#juegos">
              <IconPlay size={18} /> Jugar solo
            </a>
            <a className="band__link" href="#/profesor">
              <IconTeacher size={18} /> Soy profesor: crear una clase
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================= NIVEL */}
      <div className="wrap">
        <section className="levelbar" id="nivel" aria-labelledby="levelbar-title">
          <h2 className="levelbar__badge" id="levelbar-title">
            Nivel {level}
            <span className="levelbar__of"> de {MAX_GENERAL_LEVEL}</span>
          </h2>
          <ol className="levelbar__track" aria-hidden="true">
            {GENERAL_LEVELS.map((l) => (
              <li key={l.level} className={l.level <= level ? 'is-on' : ''} />
            ))}
          </ol>
          <p className="levelbar__next">
            {nextGeneralLevel(progress)
              ? `Siguiente: ${nextGeneralLevel(progress)!.requirement.toLowerCase()}`
              : '¡Completaste las tres misiones!'}
            <span className="levelbar__count"> · {totalLevelsCompleted(progress)}/9 niveles</span>
          </p>
        </section>
      </div>

      {/* ========================================================= JUEGOS */}
      <section className="wrap games" id="juegos" aria-labelledby="games-title">
        <h2 className="games__title" id="games-title">
          Juegos
        </h2>

        <ul className="games__grid">
          {MISSIONS.map((m) => (
            <li key={m.gameId}>
              <GameTile mission={m} progress={progress} onPlay={onPlay} onDossier={onDossier} />
            </li>
          ))}
          {UPCOMING.map((card) => {
            const open = card.unlockAt !== null && level >= card.unlockAt
            return (
              <li key={card.id}>
                <article className={`gtile gtile--soon${card.icon === 'vr' ? ' gtile--vr' : ''}`}>
                  <div className="gtile__img gtile__img--soon" aria-hidden="true">
                    {card.icon === 'vr' ? <IconVR size={48} /> : <IconLock size={40} />}
                  </div>
                  <div className="gtile__body">
                    <h3 className="gtile__name">{card.title}</h3>
                    <p className="gtile__meta">
                      {card.unlockAt === null
                        ? 'Próximamente'
                        : open
                          ? '¡Desbloqueado! Muy pronto'
                          : `Se desbloquea en nivel ${card.unlockAt}`}
                    </p>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>

        <p className="games__more">
          ¿Quieres conocer más naves? <a href="#/arcade">Explora el archivo de equipos espaciales</a>
        </p>
      </section>

      <SiteFooter />
    </>
  )
}

/** Ficha de juego: imagen grande de un clic, nombre y niveles debajo. */
function GameTile({
  mission,
  progress,
  onPlay,
  onDossier,
}: {
  mission: MissionCard
  progress: Progress
  onPlay: Props['onPlay']
  onDossier: Props['onDossier']
}) {
  const done = progress.games[mission.gameId]?.levelsCompleted ?? []
  const next = nextPlayableLevel(progress, mission.gameId)

  return (
    <article className="gtile">
      <button
        type="button"
        className="gtile__img"
        onClick={() => onPlay(mission, next)}
        aria-label={`Jugar ${mission.title}, nivel ${next}`}
      >
        <img src={mission.art} alt="" loading="lazy" decoding="async" />
        <span className="gtile__tag">{mission.bodyLabel}</span>
        <span className="gtile__play" aria-hidden="true">
          <IconPlay size={22} /> Jugar
        </span>
      </button>

      <div className="gtile__body">
        <h3 className="gtile__name">{mission.title}</h3>
        <div className="gtile__row">
          <div className="gtile__levels" role="group" aria-label={`Niveles de ${mission.title}`}>
            {mission.levels.map((l) => {
              const isDone = done.includes(l.id)
              const open = isLevelUnlocked(progress, mission.gameId, l.id)
              const state = isDone ? 'completado' : open ? 'disponible' : 'bloqueado'
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`lv is-${state}`}
                  disabled={!open}
                  onClick={() => onPlay(mission, l.id)}
                  aria-label={`Nivel ${l.id}, ${l.name}: ${state}`}
                  title={`${l.id}. ${l.name}`}
                >
                  {open ? l.id : <IconLock size={12} />}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            className="gtile__info"
            onClick={() => onDossier(mission.gameId)}
            aria-label={`Ficha científica de ${mission.title}`}
            title="Ficha científica"
          >
            <IconInfo size={18} />
          </button>
        </div>
      </div>
    </article>
  )
}

import { ARCADE } from '../../content/arcade'
import { UPCOMING } from '../../content/catalog'
import { MISSIONS, type MissionCard } from '../../content/missions'
import type { Membership } from '../../shared/classroom'
import { getGeneralLevel } from '../../shared/progress'
import type { GameId, LevelId, Progress } from '../../shared/types'
import { IconPlay, IconTeacher } from '../components/Art'
import GameCard, { UpcomingTile } from '../components/GameCard'
import MiniCard from '../components/MiniCard'
import JoinBox from '../components/JoinBox'
import LevelMeter from '../components/LevelMeter'
import OrbitArt from '../components/OrbitArt'
import SiteFooter from '../components/SiteFooter'

interface Props {
  progress: Progress
  membership: Membership | null
  onPlay: (mission: MissionCard, levelId: LevelId) => void
  onDossier: (gameId: GameId) => void
}

export default function Home({ progress, membership, onPlay, onDossier }: Props) {
  const level = getGeneralLevel(progress)

  return (
    <>
      {/* ============================================================ PORTADA */}
      <section className="hero">
        <div className="hero__inner wrap">
          <div className="hero__text">
            <span className="hero__eyebrow">Juegos de misiones reales de la NASA</span>
            <h1 className="hero__title">
              Aprende <span className="hero__accent">jugando</span>
            </h1>
            <p className="hero__lede">
              Juegos cortos donde ganas usando la ciencia de verdad: los instrumentos, la
              energía y la luz, como lo hicieron Opportunity, Spirit y el equipo de Apollo 15.
              Sin preguntas aparte: si decides bien, avanzas.
            </p>

            <div className="hero__cta">
              <a className="btn btn--xl btn--primary" href="#juegos">
                <IconPlay size={22} />
                Jugar solo
              </a>
              <a className="btn btn--xl btn--secondary" href="#/profesor">
                <IconTeacher />
                Soy profesor
              </a>
            </div>
          </div>

          <div className="hero__side">
            <OrbitArt />
            <div className="hero__join">
              {membership ? (
                <div className="classchip-card">
                  <p className="classchip-card__label">Estás en la clase</p>
                  <p className="classchip-card__name">{membership.className || membership.code}</p>
                  <p className="classchip-card__nick">
                    Tu apodo: <strong>{membership.nickname}</strong>
                  </p>
                  <a className="btn btn--sm btn--quiet" href="#/clase">
                    Ver mi clase
                  </a>
                </div>
              ) : (
                <JoinBox />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <LevelMeter progress={progress} />
      </div>

      {/* ============================================================ CATÁLOGO */}
      <section className="section wrap catalog" id="juegos" aria-labelledby="catalog-title">
        <div className="catalog__head">
          <h2 className="section__title" id="catalog-title">
            Elige una misión
          </h2>
          <p className="section__note">
            Un clic para jugar. Cada juego tiene 3 niveles; el siguiente se abre al
            completar el anterior.
          </p>
        </div>

        <div className="catalog__grid">
          {MISSIONS.map((mission) => (
            <GameCard
              key={mission.gameId}
              mission={mission}
              progress={progress}
              onPlay={(lvl) => onPlay(mission, lvl)}
              onDossier={() => onDossier(mission.gameId)}
            />
          ))}
          {UPCOMING.map((card) => (
            <UpcomingTile key={card.id} card={card} level={level} />
          ))}
        </div>

        <div className="section__foot">
          <a className="btn btn--lg btn--quiet" href="#/arcade">
            Explorar el archivo de equipos espaciales
          </a>
        </div>
      </section>

      {/* ========================================================= SALA ARCADE
          Partidas cortas, siempre abiertas. No piden nivel previo: son la
          puerta de entrada para quien todavia no se atreve con una misión. */}
      <section className="section wrap catalog" id="arcade" aria-labelledby="arcade-title">
        <div className="catalog__head">
          <h2 className="section__title" id="arcade-title">
            Sala arcade
          </h2>
          <p className="section__note">
            Tres clásicos con ciencia real detrás. Partidas de 1 a 4 minutos, abiertas
            desde el principio: no hacen falta misiones completadas.
          </p>
        </div>

        <div className="catalog__grid">
          {ARCADE.map((card) => (
            <MiniCard key={card.gameId} card={card} progress={progress} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </>
  )
}

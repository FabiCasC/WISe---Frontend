import { ARCADE } from '../../content/arcade'
import { ARCHIVE_STATS, type ArchiveItem } from '../../content/archive'
import { MISSIONS, type MissionCard } from '../../content/missions'
import { GAME_IDS } from '../../shared/progress'
import type { Progress } from '../../shared/types'
import GameTile from '../components/GameTile'
import MiniCard from '../components/MiniCard'
import Mosaic from '../components/Mosaic'
import SiteFooter from '../components/SiteFooter'

interface Props {
  progress: Progress
  onPlay: (mission: MissionCard) => void
  onItem: (item: ArchiveItem) => void
}

export default function Arcade({ progress, onPlay, onItem }: Props) {
  const levelsDone = GAME_IDS.reduce(
    (n, id) => n + progress.games[id].levelsCompleted.length,
    0,
  )

  return (
    <>
      {/* ====================================================== DESTACADOS
          Franja a sangre: el fondo cubre todo el bloque, así no queda aire
          muerto alrededor de las tarjetas. */}
      <section className="arcade-top" id="juegos">
        <div className="arcade-top__aurora" aria-hidden="true" />

        <div className="arcade-top__inner">
          <div className="arcade-top__head">
            <h1 className="arcade-top__title">Elige tu misión</h1>
            <div className="arcade-top__meta">
              <span className="chip chip--accent">
                {MISSIONS.length + ARCADE.length} juegos listos
              </span>
              <span className="chip">{levelsDone}/9 niveles</span>
              <span className="chip">{ARCHIVE_STATS.total} equipos en el archivo</span>
            </div>
          </div>

          {/* El movimiento continuo va DENTRO de la tarjeta (brillo que barre,
              cinta que late). Desplazar la tarjeta entera dejaría un objetivo
              móvil, difícil de pulsar y peor para el público objetivo. */}
          <div className="arcade-top__row">
            {MISSIONS.map((mission, i) => (
              <div
                className="arcade-top__slot"
                key={mission.gameId}
                style={{ ['--delay' as string]: `${i * 110}ms` }}
              >
                <GameTile
                  mission={mission}
                  progress={progress}
                  variant="featured"
                  onPlay={() => onPlay(mission)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= SALA ARCADE */}
      <section className="section wrap catalog" id="arcade" aria-labelledby="arcade-title">
        <div className="catalog__head">
          <h2 className="section__title" id="arcade-title">
            Sala arcade
          </h2>
          <p className="section__note">
            Partidas cortas para calentar. Cada una esconde un hecho real de las
            misiones: lo verás al terminar.
          </p>
        </div>

        <div className="catalog__grid">
          {ARCADE.map((card) => (
            <MiniCard key={card.gameId} card={card} progress={progress} />
          ))}
        </div>
      </section>

      <Mosaic
        progress={progress}
        reducedMotion={progress.settings.reducedMotion}
        onPlay={onPlay}
        onItem={onItem}
      />

      <SiteFooter />
    </>
  )
}

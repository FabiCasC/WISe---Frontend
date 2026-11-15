import { ARCHIVE_STATS, type ArchiveItem } from '../../content/archive'
import { MISSIONS, type MissionCard } from '../../content/missions'
import { totalLevelsCompleted } from '../../shared/progress'
import type { Progress } from '../../shared/types'
import GameTile from '../components/GameTile'
import Mosaic from '../components/Mosaic'
import SiteFooter from '../components/SiteFooter'

interface Props {
  progress: Progress
  onPlay: (mission: MissionCard) => void
  onItem: (item: ArchiveItem) => void
}

export default function Archive({ progress, onPlay, onItem }: Props) {
  const levelsDone = totalLevelsCompleted(progress)

  return (
    <>
      {/* ====================================================== DESTACADOS
          Franja a sangre: el fondo cubre todo el bloque, así no queda aire
          muerto alrededor de las tarjetas. */}
      <section className="arcade-top" id="games">
        <div className="arcade-top__aurora" aria-hidden="true" />

        <div className="arcade-top__inner">
          <div className="arcade-top__head">
            <h1 className="arcade-top__title">Spacecraft archive</h1>
            <div className="arcade-top__meta">
              <span className="chip chip--accent">{MISSIONS.length} games ready</span>
              <span className="chip">{levelsDone} levels completed</span>
              <span className="chip">{ARCHIVE_STATS.total} machines in the archive</span>
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

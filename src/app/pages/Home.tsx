import { Fragment, useMemo } from 'react'
import { ARCHIVE, type ArchiveItem } from '../../content/archive'
import { UPCOMING } from '../../content/catalog'
import { MISSIONS, type MissionCard } from '../../content/missions'
import type { Membership } from '../../shared/classroom'
import {
  GENERAL_LEVELS,
  MAX_GENERAL_LEVEL,
  getGeneralLevel,
  nextGeneralLevel,
  totalLevelsCompleted,
  totalScore,
} from '../../shared/progress'
import type { GameId, LevelId, Progress } from '../../shared/types'
import { IconStar, IconTeacher, IconUsers } from '../components/Art'
import GameCard, { UpcomingTile } from '../components/GameCard'
import JoinBox from '../components/JoinBox'
import MissionPatch from '../components/MissionPatch'
import { ArchiveTile, shuffled } from '../components/Mosaic'
import SiteFooter from '../components/SiteFooter'

interface Props {
  progress: Progress
  membership: Membership | null
  onPlay: (mission: MissionCard, levelId: LevelId) => void
  onDossier: (gameId: GameId) => void
  onItem: (item: ArchiveItem) => void
}

/** Cada cuántas fichas del archivo se intercala una tarjeta "por venir". */
const UPCOMING_EVERY = 9

/**
 * Portada estilo Friv con identidad de misión espacial: una sola pared de
 * fichas. Todo es una ficha: el parche, tu nivel, el código de clase, el
 * acceso del profesor, los tres juegos, los juegos por venir y los equipos
 * reales del archivo.
 */
export default function Home({ progress, membership, onPlay, onDossier, onItem }: Props) {
  const level = getGeneralLevel(progress)
  const items = useMemo(() => shuffled(ARCHIVE), [])

  return (
    <>
      <section className="wall" id="juegos" aria-labelledby="wall-title">
        <h1 className="sr-only" id="wall-title">
          Órbita Arcade: aprende jugando con misiones reales de la NASA
        </h1>

        <div className="wall__grid">
          {/* ------------------------------------------------ PARCHE */}
          <div className="wt wt--patch">
            <MissionPatch size={132} />
            <div className="wt-patch__text">
              <p className="wt-patch__title">Aprende jugando</p>
              <p className="wt-patch__lede">
                Gana usando la ciencia de verdad, como Opportunity, Spirit y Apollo 15.
              </p>
            </div>
          </div>

          {/* ------------------------------------------------ JUEGO 1 */}
          <GameSlot mission={MISSIONS[0]} {...{ progress, onPlay, onDossier }} />

          {/* ------------------------------------------------ NIVEL */}
          <LevelTile progress={progress} />

          {/* ------------------------------------------------ JUEGO 2 */}
          <GameSlot mission={MISSIONS[1]} {...{ progress, onPlay, onDossier }} />

          {/* ------------------------------------------------ CLASE */}
          <div className="wt wt--join">
            {membership ? (
              <div className="wt-join__member">
                <span className="wt__eyebrow">
                  <IconUsers size={16} /> Clase {membership.code}
                </span>
                <p className="wt-join__nick">{membership.nickname}</p>
                <a className="btn btn--sm btn--quiet" href="#/clase">
                  Ver mi clase
                </a>
              </div>
            ) : (
              <JoinBox compact />
            )}
          </div>

          {/* ------------------------------------------------ JUEGO 3 */}
          <GameSlot mission={MISSIONS[2]} {...{ progress, onPlay, onDossier }} />

          {/* ------------------------------------------------ PROFESOR */}
          <a className="wt wt--teacher" href="#/profesor">
            <IconTeacher size={28} />
            <span className="wt-teacher__title">Soy profesor</span>
            <span className="wt-teacher__sub">Crear una clase</span>
          </a>

          {/* ------------------------------------- ARCHIVO + POR VENIR */}
          {items.map((item, i) => {
            const soon = (i + 1) % UPCOMING_EVERY === 0 ? UPCOMING[(i + 1) / UPCOMING_EVERY - 1] : undefined
            return (
              <Fragment key={item.name}>
                <ArchiveTile item={item} onOpen={onItem} />
                {soon && (
                  <div className="wt wt--soon">
                    <UpcomingTile card={soon} level={level} />
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>

        <p className="wall__hint">
          Las fichas grandes son juegos. Las pequeñas son {ARCHIVE.length} equipos reales que la
          humanidad envió al espacio: tócalas para conocerlos.{' '}
          <a href="#/arcade">Ver el archivo por destino</a>
        </p>
      </section>

      <SiteFooter />
    </>
  )
}

function GameSlot({
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
  return (
    <div className="wt wt--game">
      <GameCard
        mission={mission}
        progress={progress}
        onPlay={(lvl) => onPlay(mission, lvl)}
        onDossier={() => onDossier(mission.gameId)}
      />
    </div>
  )
}

/** Ficha del nivel general: número grande y seis segmentos en Thistle. */
function LevelTile({ progress }: { progress: Progress }) {
  const level = getGeneralLevel(progress)
  const next = nextGeneralLevel(progress)

  return (
    <section className="wt wt--level" id="nivel" aria-labelledby="level-title">
      <div className="wt-level__head">
        <span className="wt-level__badge" aria-hidden="true">
          {level}
        </span>
        <div>
          <h2 className="wt-level__title" id="level-title">
            Nivel {level} de {MAX_GENERAL_LEVEL}
          </h2>
          <p className="wt-level__stats">
            {totalLevelsCompleted(progress)}/9 niveles · {totalScore(progress).toLocaleString('es')}{' '}
            pts
          </p>
        </div>
      </div>
      <ol className="wt-level__track" aria-hidden="true">
        {GENERAL_LEVELS.map((l) => (
          <li key={l.level} className={l.level <= level ? 'is-on' : ''} />
        ))}
      </ol>
      <p className="wt-level__next">
        {next ? (
          <>
            <IconStar size={13} /> Sube al {next.level}: {next.requirement.toLowerCase()}
          </>
        ) : (
          '¡Meta cumplida! Completaste las tres misiones.'
        )}
      </p>
    </section>
  )
}

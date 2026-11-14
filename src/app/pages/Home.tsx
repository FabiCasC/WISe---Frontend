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
import { IconInfo, IconLock } from '../components/Art'
import { Barcode, ChromeShape, ChromeWord, Crosshair, type ChromeKind } from '../components/Chrome'
import JoinBox from '../components/JoinBox'
import SiteFooter from '../components/SiteFooter'

interface Props {
  progress: Progress
  membership: Membership | null
  onPlay: (mission: MissionCard, levelId: LevelId) => void
  onDossier: (gameId: GameId) => void
}

/** Mission codes shown as poster labels on each game card. */
const CODE: Record<GameId, string> = {
  opportunity: 'MER-B · 2004',
  'lunar-signals': 'APOLLO 15 · 1971',
  spirit: 'MER-A · 2004',
}

const SOON_SHAPE: ChromeKind[] = ['blob', 'star', 'drop', 'ring']

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Home: a Y2K "liquid chrome" poster. The hero joins a class with a code
 * (class-portal style); below, a one-click grid of games (games-portal
 * style). All readable text sits on solid paper or panels.
 */
export default function Home({ progress, membership, onPlay, onDossier }: Props) {
  const level = getGeneralLevel(progress)
  const next = nextGeneralLevel(progress)

  return (
    <>
      {/* ============================================================ HERO */}
      <section className="poster" aria-labelledby="hero-title">
        <div className="poster__frame">
          <span className="poster__mark poster__mark--tl">
            <Crosshair size={26} />
          </span>
          <span className="poster__side poster__side--l" aria-hidden="true">
            14112026
          </span>
          <span className="poster__side poster__side--r" aria-hidden="true">
            14112026
          </span>

          <div className="poster__sky" aria-hidden="true">
            <span className="poster__cloud poster__cloud--1" />
            <span className="poster__cloud poster__cloud--2" />
            <span className="poster__cloud poster__cloud--3" />
          </div>

          <ChromeShape kind="ring" size={170} className="float float--ring" />
          <ChromeShape kind="star" size={96} className="float float--star" />
          <ChromeShape kind="drop" size={110} className="float float--drop" />
          <ChromeShape kind="blob" size={150} className="float float--blob" />
          <span className="poster__spark poster__spark--l" aria-hidden="true">
            ✦
          </span>
          <span className="poster__spark poster__spark--r" aria-hidden="true">
            ✦
          </span>

          <h1 className="poster__title" id="hero-title">
            <span className="poster__serif" aria-hidden="true">
              Learn by
            </span>
            <span className="poster__script">
              <ChromeWord text="playing" />
            </span>
            <span className="sr-only">Learn by playing with real NASA missions</span>
          </h1>

          <div className="poster__join">
            {membership ? (
              <div className="joined">
                <p className="label">You are in class {membership.code}</p>
                <p className="joined__nick">{membership.nickname}</p>
                <div className="joined__row">
                  <a className="pill pill--solid" href="#games">
                    Keep playing ↗
                  </a>
                  <a className="pill" href="#/class">
                    My class
                  </a>
                </div>
              </div>
            ) : (
              <JoinBox />
            )}
          </div>
        </div>

        <p className="poster__caption">Orbita Arcade — real NASA missions</p>

        <div className="poster__meta">
          <Crosshair />
          <span className="pill pill--tiny">14112026</span>
          <span className="reg" aria-hidden="true">
            R
          </span>
          <Barcode seed="orbita" />
          <span className="label">WISE · Space Apps</span>
          <Barcode seed="arcade" />
          <span className="reg" aria-hidden="true">
            R
          </span>
          <span className="pill pill--tiny">LVL {pad(level)}</span>
          <Crosshair />
        </div>

        <p className="poster__lede">
          Short games about the machines humanity left on the Moon and Mars. You win by using
          real science — the instruments, the energy and the light — just like the missions
          did. No account, no quiz, no names.{' '}
          <a href="#games">Play solo</a> · <a href="#/teacher">I am a teacher</a>
        </p>
      </section>

      {/* =========================================================== LEVEL */}
      <section className="wrap levelrow" id="level" aria-labelledby="level-title">
        <div className="levelrow__head">
          <span className="label">General level</span>
          <h2 className="levelrow__num" id="level-title">
            {pad(level)}
            <span className="levelrow__of">/{pad(MAX_GENERAL_LEVEL)}</span>
          </h2>
        </div>
        <ol className="levelrow__track" aria-hidden="true">
          {GENERAL_LEVELS.map((l) => (
            <li key={l.level} className={l.level <= level ? 'is-on' : ''}>
              <span>{pad(l.level)}</span>
            </li>
          ))}
        </ol>
        <p className="levelrow__next">
          {next ? `Next: ${next.requirement.toLowerCase()}` : 'All three missions complete.'}
          <span className="levelrow__count"> · {totalLevelsCompleted(progress)}/9 levels</span>
        </p>
      </section>

      {/* =========================================================== GAMES */}
      <section className="wrap games" id="games" aria-labelledby="games-title">
        <div className="games__head">
          <h2 className="games__title" id="games-title">
            The games
          </h2>
          <span className="pill pill--tiny">N° {pad(MISSIONS.length)}</span>
          <span className="games__rule" aria-hidden="true" />
          <span className="label">One click to play</span>
        </div>

        <ul className="games__grid">
          {MISSIONS.map((m) => (
            <li key={m.gameId}>
              <GameCard mission={m} progress={progress} onPlay={onPlay} onDossier={onDossier} />
            </li>
          ))}
          {UPCOMING.map((card, i) => {
            const open = card.unlockAt !== null && level >= card.unlockAt
            const status =
              card.unlockAt === null
                ? 'Coming soon'
                : open
                  ? 'Unlocked — coming soon'
                  : `Unlocks at level ${card.unlockAt}`
            return (
              <li key={card.id}>
                <article className="mcard mcard--soon" aria-label={`${card.title}. ${status}`}>
                  <div className="mcard__media mcard__media--soon" aria-hidden="true">
                    <ChromeShape kind={SOON_SHAPE[i % SOON_SHAPE.length]} size={120} className="float float--card" />
                    {card.unlockAt !== null && !open && (
                      <span className="mcard__lock">
                        <IconLock size={14} />
                      </span>
                    )}
                  </div>
                  <div className="mcard__body">
                    <p className="label">{card.icon === 'vr' ? 'VR' : `Level ${card.unlockAt}`}</p>
                    <h3 className="mcard__title">{card.title}</h3>
                    <p className="mcard__meta">{status}</p>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>

        <p className="games__more">
          Want more spacecraft? <a href="#/arcade">Browse the archive ↗</a>
        </p>
      </section>

      <SiteFooter />
    </>
  )
}

function GameCard({
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
    <article className="mcard">
      <button
        type="button"
        className="mcard__media"
        onClick={() => onPlay(mission, next)}
        aria-label={`Play ${mission.title}, level ${next}`}
      >
        <img src={mission.art} alt="" loading="lazy" decoding="async" />
        <span className="mcard__code">{CODE[mission.gameId]}</span>
        <span className="mcard__play" aria-hidden="true">
          Play ↗
        </span>
      </button>

      <div className="mcard__body">
        <p className="label">{mission.bodyLabel}</p>
        <h3 className="mcard__title">{mission.title}</h3>
        <div className="mcard__row">
          <div className="mcard__levels" role="group" aria-label={`${mission.title} levels`}>
            {mission.levels.map((l) => {
              const isDone = done.includes(l.id)
              const open = isLevelUnlocked(progress, mission.gameId, l.id)
              const state = isDone ? 'completed' : open ? 'available' : 'locked'
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`lvl is-${state}`}
                  disabled={!open}
                  onClick={() => onPlay(mission, l.id)}
                  aria-label={`Level ${l.id}, ${l.name}: ${state}`}
                  title={`${l.id}. ${l.name}`}
                >
                  {open ? pad(l.id) : <IconLock size={12} />}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            className="mcard__info"
            onClick={() => onDossier(mission.gameId)}
            aria-label={`Science card for ${mission.title}`}
            title="Science card"
          >
            <IconInfo size={17} />
          </button>
        </div>
      </div>
    </article>
  )
}

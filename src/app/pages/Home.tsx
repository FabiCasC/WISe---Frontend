import { GAMES, type GameEntry } from '../../content/games'
import type { Role } from '../../shared/accounts'
import type { Membership } from '../../shared/classroom'
import { getRank, learnedConcepts, nextRank } from '../../shared/progress'
import type { Progress } from '../../shared/types'
import { IconPlay, IconStar, IconTeacher } from '../components/Art'
import GamesSection from '../components/GamesSection'
import Horizons from '../components/Horizons'
import JoinBox from '../components/JoinBox'
import SiteFooter from '../components/SiteFooter'

interface Props {
  role: Role
  progress: Progress
  membership: Membership | null
  onOpenGame: (game: GameEntry) => void
}

/**
 * Home: join a class with a code, then every game on the same page, just
 * below (#/games). The arcade is not a separate page.
 */
export default function Home({ role, progress, membership, onOpenGame }: Props) {
  const rank = getRank(progress)
  const next = nextRank(progress)
  const learned = learnedConcepts(progress).length

  return (
    <>
      {/* ============================================================ BAND */}
      <section className="band" aria-labelledby="band-title">
        <Horizons />
        <div className="band__inner">
          <h1 className="band__title" id="band-title">
            Learn by playing real NASA missions
          </h1>
          <p className="band__lede">
            Humanity left machines on the Moon and Mars. In {GAMES.length} short games you use
            their real science, the instruments, the energy and the light, to find out what they
            discovered. No quizzes: the science is the game.
          </p>

          <div className="joincard">
            {membership ? (
              <div className="joincard__member">
                <p className="joincard__label">You are in class {membership.code}</p>
                <p className="joincard__nick">{membership.nickname}</p>
                <div className="joincard__row">
                  <a className="btn btn--primary btn--lg" href="#/games">
                    <IconPlay /> Play a game
                  </a>
                  <a className="btn btn--quiet" href="#/class">
                    My class
                  </a>
                </div>
              </div>
            ) : (
              <JoinBox />
            )}
          </div>

          <div className="band__links">
            <a className="band__link" href="#/games">
              <IconPlay size={18} /> Play solo
            </a>
            {role === 'teacher' && (
              <a className="band__link" href="#/teacher">
                <IconTeacher size={18} /> Create a class
              </a>
            )}
          </div>
        </div>

        <p className="band__caption band__caption--moon">
          <strong>Moon, 1971.</strong> Apollo 15 left its descent stage, a laser reflector and a
          seismometer.
        </p>
        <p className="band__caption band__caption--mars">
          <strong>Mars, 2004.</strong> Opportunity, its landing platform and Spirit are still
          there.
        </p>
      </section>

      {/* ============================================================ RANK */}
      <div className="wrap">
        <section className="rankbar" id="rank" aria-labelledby="rank-title">
          <h2 className="rankbar__badge" id="rank-title">
            <IconStar size={16} /> {rank.name}
          </h2>
          <p className="rankbar__text">
            <strong>{learned}</strong> {learned === 1 ? 'concept' : 'concepts'} learned
            {next ? (
              <span className="rankbar__next">
                {' '}
                · {next.min - learned} more to become <strong>{next.name}</strong>
              </span>
            ) : (
              <span className="rankbar__next"> · Top rank reached</span>
            )}
          </p>
        </section>
      </div>

      {/* ========================================================= GAMES */}
      <GamesSection progress={progress} membership={membership} onOpenGame={onOpenGame} />

      <SiteFooter />
    </>
  )
}

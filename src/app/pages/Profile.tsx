import type { Account } from '../../shared/accounts'
import { CATEGORY_LABELS, earnedMedals, type Medal, type MedalCategory, type MedalStats } from '../../shared/medals'
import { getRank, nextRank } from '../../shared/progress'
import type { Progress } from '../../shared/types'
import { IconGear, IconRocket, IconStamp, IconStar, IconTeacher } from '../components/Art'
import SiteFooter from '../components/SiteFooter'
import WallIcon from '../components/WallIcon'

const ICONS: Record<MedalCategory, JSX.Element> = {
  play: <IconRocket size={22} />,
  concepts: <IconStar size={22} />,
  score: <IconStamp size={22} />,
  creator: <IconGear size={22} />,
  teacher: <IconTeacher size={22} />,
}

export function MedalBadge({ medal }: { medal: Medal }) {
  const pct = Math.round((medal.value / medal.goal) * 100)
  return (
    <li className={'medal medal--' + medal.category + (medal.earned ? ' is-earned' : '')}>
      <span className="medal__disc" aria-hidden="true">
        {ICONS[medal.category]}
      </span>
      <b className="medal__name">{medal.name}</b>
      <span className="medal__how">{medal.how}</span>
      {medal.earned ? (
        <span className="medal__state">Earned</span>
      ) : (
        <span className="medal__bar" role="img" aria-label={`${medal.value} of ${medal.goal}`}>
          <i style={{ width: pct + '%' }} />
        </span>
      )}
    </li>
  )
}

interface Props {
  account: Account
  progress: Progress
  stats: MedalStats
  medals: Medal[]
  onLogout: () => void
}

export default function Profile({ account, progress, stats, medals, onLogout }: Props) {
  const rank = getRank(progress)
  const next = nextRank(progress)
  const earned = earnedMedals(medals)
  const categories = [...new Set(medals.map((m) => m.category))]

  return (
    <>
      <section className="section wrap page profile">
        <div className="profile__head">
          <span className="profile__avatar" aria-hidden="true">
            <WallIcon name={account.avatar} size={44} />
          </span>
          <div>
            <h1 className="page__title">{account.username}</h1>
            <p className="profile__role">
              {account.role === 'teacher' ? 'Teacher' : 'Student'} · {rank.name}
              {next ? ` · ${next.min - stats.conceptsLearned} concepts to ${next.name}` : ' · top rank'}
            </p>
          </div>
          <button type="button" className="btn btn--quiet profile__logout" onClick={onLogout}>
            Log out
          </button>
        </div>

        <div className="kpis">
          <div className="kpi">
            <span className="kpi__value">{stats.totalScore.toLocaleString('en-US')}</span>
            <span className="kpi__label">Points</span>
          </div>
          <div className="kpi">
            <span className="kpi__value">{stats.conceptsLearned}</span>
            <span className="kpi__label">Concepts learned</span>
          </div>
          <div className="kpi">
            <span className="kpi__value">{stats.gamesPlayed}</span>
            <span className="kpi__label">Games played</span>
          </div>
          <div className="kpi">
            <span className="kpi__value">
              {earned.length}/{medals.length}
            </span>
            <span className="kpi__label">Medals</span>
          </div>
        </div>

        {categories.map((c) => (
          <section key={c} className="profile__group" aria-labelledby={'medals-' + c}>
            <h2 id={'medals-' + c} className="profile__h2">
              {CATEGORY_LABELS[c]}
            </h2>
            <ul className="medals">
              {medals
                .filter((m) => m.category === c)
                .map((m) => (
                  <MedalBadge key={m.id} medal={m} />
                ))}
            </ul>
          </section>
        ))}
      </section>
      <SiteFooter />
    </>
  )
}

import { BRAND } from '../../content/brand'
import type { Account } from '../../shared/accounts'
import type { Membership } from '../../shared/classroom'
import { getRank, learnedConcepts } from '../../shared/progress'
import type { Progress } from '../../shared/types'
import { BrandGlyph, IconGear, IconStar } from './Art'
import WallIcon from './WallIcon'

interface Props {
  account: Account
  progress: Progress
  membership: Membership | null
  onSettings: () => void
}

export default function Topbar({ account, progress, membership, onSettings }: Props) {
  const rank = getRank(progress)
  const learned = learnedConcepts(progress).length

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <a className="brandmark" href="#/" aria-label={`${BRAND.full}, home`}>
          <BrandGlyph />
          <span className="brandmark__text">
            <span className="brandmark__name">{BRAND.wordmark}</span>
            <span className="brandmark__sub">{BRAND.wordmarkSub}</span>
          </span>
        </a>

        <span className="topbar__spacer" />

        <nav className="topbar__nav" aria-label="Sections">
          <a className="navlink" href="#/games">
            Arcade
          </a>
          <a className="navlink" href="#/studio">
            Studio
          </a>
          {account.role === 'teacher' && (
            <a className="navlink" href="#/teacher">
              Teachers
            </a>
          )}
        </nav>

        {membership && (
          <a
            className="classpill"
            href="#/class"
            aria-label={`Class ${membership.code}, your nickname is ${membership.nickname}`}
          >
            <span className="classpill__code">{membership.code}</span>
            <span className="classpill__nick">{membership.nickname}</span>
          </a>
        )}

        <a className="levelpill" href="#/profile" aria-label={`Rank ${rank.name}, ${learned} concepts learned. Open your profile`}>
          <IconStar size={15} />
          <span>
            {rank.name} <b>{learned}</b>
          </span>
        </a>

        <a className="accountpill" href="#/profile" aria-label={`Your profile, ${account.username}`}>
          <WallIcon name={account.avatar} size={20} />
          <span className="accountpill__name">{account.username}</span>
        </a>

        <button type="button" className="btn btn--quiet btn--icon" onClick={onSettings} aria-label="Settings">
          <IconGear />
        </button>
      </div>
    </header>
  )
}

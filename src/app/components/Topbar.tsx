import { BRAND } from '../../content/brand'
import type { Membership } from '../../shared/classroom'
import { MAX_GENERAL_LEVEL, getGeneralLevel } from '../../shared/progress'
import type { Progress } from '../../shared/types'
import { IconGear } from './Art'

interface Props {
  isHome: boolean
  progress: Progress
  membership: Membership | null
  onSettings: () => void
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Poster-style top row: tiny uppercase labels, outlined pills and arrows. */
export default function Topbar({ isHome, progress, membership, onSettings }: Props) {
  const level = getGeneralLevel(progress)
  // On the home page anchors are local; elsewhere the route carries the id.
  const to = (id: string) => (isHome ? `#${id}` : `#/${id}`)

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <a className="brandmark" href="#/" aria-label={`${BRAND.full}, home`}>
          <span className="brandmark__name">{BRAND.full}</span>
          <span className="pill pill--tiny brandmark__tag" aria-hidden="true">
            WISE26
          </span>
          <span className="brandmark__arrow" aria-hidden="true">
            ↗
          </span>
        </a>

        <span className="topbar__spacer" />

        <nav className="topbar__nav" aria-label="Sections">
          <a className="navlink" href={to('games')}>
            Games
          </a>
          <a className="navlink" href="#/teacher">
            Teachers
          </a>
          <a className="navlink" href="#/arcade">
            Archive
          </a>
        </nav>

        {membership && (
          <a
            className="pill classpill"
            href="#/class"
            aria-label={`Class ${membership.code}, your nickname is ${membership.nickname}`}
          >
            <span className="classpill__code">{membership.code}</span>
            <span>{membership.nickname}</span>
          </a>
        )}

        <a
          className="pill pill--solid levelpill"
          href={to('level')}
          aria-label={`General level ${level} of ${MAX_GENERAL_LEVEL}`}
        >
          LVL {pad(level)}/{pad(MAX_GENERAL_LEVEL)}
        </a>

        <button type="button" className="iconbtn" onClick={onSettings} aria-label="Settings">
          <IconGear />
        </button>
      </div>
    </header>
  )
}

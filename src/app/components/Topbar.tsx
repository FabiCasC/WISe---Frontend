import { BRAND } from '../../content/brand'
import type { Membership } from '../../shared/classroom'
import { MAX_GENERAL_LEVEL, getGeneralLevel } from '../../shared/progress'
import type { Progress } from '../../shared/types'
import { BrandGlyph, IconGear, IconStar } from './Art'

interface Props {
  isHome: boolean
  progress: Progress
  membership: Membership | null
  onSettings: () => void
}

export default function Topbar({ isHome, progress, membership, onSettings }: Props) {
  const level = getGeneralLevel(progress)
  // En la portada las anclas son locales; desde otra página la ruta lleva el id.
  const to = (id: string) => (isHome ? `#${id}` : `#/${id}`)

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <a className="brandmark" href="#/" aria-label={`${BRAND.full}, inicio`}>
          <BrandGlyph />
          <span className="brandmark__text">
            <span className="brandmark__name">{BRAND.wordmark}</span>
            <span className="brandmark__sub">{BRAND.wordmarkSub}</span>
          </span>
        </a>

        <span className="topbar__spacer" />

        <nav className="topbar__nav" aria-label="Secciones">
          <a className="navlink" href={to('juegos')}>
            Juegos
          </a>
          <a className="navlink" href="#/profesor">
            Profesores
          </a>
        </nav>

        {membership && (
          <a
            className="classpill"
            href="#/clase"
            aria-label={`Clase ${membership.code}, tu apodo es ${membership.nickname}`}
          >
            <span className="classpill__code">{membership.code}</span>
            <span className="classpill__nick">{membership.nickname}</span>
          </a>
        )}

        <a
          className="levelpill"
          href={to('nivel')}
          aria-label={`Nivel general ${level} de ${MAX_GENERAL_LEVEL}`}
        >
          <IconStar size={15} />
          <span>
            Nivel <b>{level}</b>
            <span className="levelpill__of">/{MAX_GENERAL_LEVEL}</span>
          </span>
        </a>

        <button
          type="button"
          className="btn btn--quiet btn--icon"
          onClick={onSettings}
          aria-label="Ajustes"
        >
          <IconGear />
        </button>
      </div>
    </header>
  )
}

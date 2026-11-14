import { BRAND } from '../../content/brand'
import { GAME_IDS } from '../../shared/progress'
import type { Progress } from '../../shared/types'
import { BrandGlyph, IconGear, IconPlay } from './Art'

interface Props {
  page: 'landing' | 'arcade'
  progress: Progress
  onSettings: () => void
}

export default function Topbar({ page, progress, onSettings }: Props) {
  const stamps = progress.memories.length

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <a className="brandmark" href="#/" aria-label={`${BRAND.full}, portada`}>
          <BrandGlyph />
          <span className="brandmark__text">
            <span className="brandmark__name">{BRAND.wordmark}</span>
            <span className="brandmark__sub">{BRAND.wordmarkSub}</span>
          </span>
        </a>

        <span className="topbar__spacer" />

        <nav className="topbar__nav" aria-label="Secciones">
          {page === 'landing' ? (
            <>
              <a className="navlink" href="#juegos">
                Juegos
              </a>
              <a className="navlink" href="#pasaporte">
                Pasaporte
              </a>
              <a className="navlink" href="#equipo">
                Equipo
              </a>
            </>
          ) : (
            <>
              <a className="navlink" href="#/">
                Portada
              </a>
              <a className="navlink" href="#archivo">
                Archivo
              </a>
            </>
          )}
        </nav>

        {page === 'landing' && (
          <a className="btn btn--primary btn--sm topbar__cta" href="#/arcade">
            <IconPlay size={16} />
            Arcade
          </a>
        )}

        {/* Desde el arcade hay que volver a la portada Y bajar a la sección,
            por eso la ruta lleva el id dentro. */}
        <a className="passport-pill" href={page === 'landing' ? '#pasaporte' : '#/pasaporte'}>
          <span className="passport-pill__label">Pasaporte</span>
          <span className="stamps" aria-hidden="true">
            {GAME_IDS.map((id) => (
              <i key={id} className={`stamp${progress.memories.includes(id) ? ' is-on' : ''}`} />
            ))}
          </span>
          <span className="sr-only">{stamps} de 3 recuerdos conseguidos</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{stamps}/3</span>
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

import { BRAND } from '../../content/brand'
import { SOURCES } from '../../content/sources'
import { IconLink } from './Art'

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div>
            <div className="footer__title">{BRAND.full}</div>
            <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>{BRAND.pitch}</p>
          </div>

          <div>
            <div className="footer__title">Fuentes</div>
            <ul className="footer__list">
              {Object.values(SOURCES)
                .slice(0, 5)
                .map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noreferrer noopener">
                      <IconLink /> {s.title}
                    </a>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <div className="footer__title">Alcance declarado</div>
            <ul className="footer__list">
              <li>Tres juegos · tres niveles cada uno</li>
              <li>Juego individual y cooperación local en PC</li>
              <li>Controles táctiles, pausa y reinicio</li>
              <li>Sin cuentas: en clase, cada alumno usa un apodo</li>
              <li>Sin multijugador en línea ni ranking global</li>
            </ul>
          </div>

          <div>
            <div className="footer__title">Evento</div>
            <ul className="footer__list">
              <li>
                <a
                  href="https://www.spaceappschallenge.org/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <IconLink /> NASA Space Apps Challenge
                </a>
              </li>
              <li>
                <a
                  href="https://www.spaceappschallenge.org/legal/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <IconLink /> Bases legales
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="footer__disclaimer">{BRAND.disclaimer}</p>
      </div>
    </footer>
  )
}

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
            <div className="footer__title">Sources</div>
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
            <div className="footer__title">Scope</div>
            <ul className="footer__list">
              <li>Every game teaches concepts; levels vary by game</li>
              <li>Solo play and local co-op on PC</li>
              <li>Touch controls, pause and restart</li>
              <li>No accounts: in class, each student uses a nickname</li>
              <li>No online multiplayer or global ranking</li>
            </ul>
          </div>

          <div>
            <div className="footer__title">Event</div>
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
                  <IconLink /> Legal terms
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

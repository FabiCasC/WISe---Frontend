import type { ArcadeCard } from '../../content/arcade'
import { isLevelUnlocked, nextPlayableLevel } from '../../shared/progress'
import type { LevelId, Progress } from '../../shared/types'
import { navigate } from '../hooks/useHashRoute'
import { IconLock, IconPlay, IconStar } from './Art'

/**
 * Miniatura de cada minijuego, dibujada en SVG.
 * Sin imagenes que descargar: la tarjeta se ve igual de bien con la red
 * caida, que en una feria escolar pasa mas de lo que parece.
 */
function MiniScene({ gameId }: { gameId: ArcadeCard['gameId'] }) {
  if (gameId === 'dust-run') {
    return (
      <svg className="mcard__scene" viewBox="0 0 160 90" aria-hidden="true">
        <defs>
          <linearGradient id="dr-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2250" />
            <stop offset="100%" stopColor="#c0703f" />
          </linearGradient>
        </defs>
        <rect width="160" height="90" fill="url(#dr-sky)" />
        <circle cx="124" cy="24" r="11" fill="#ffd9a0" opacity="0.65" />
        <path d="M0 68 L30 68 L44 56 L58 68 L160 68 L160 90 L0 90 Z" fill="#8a4e33" />
        <path d="M96 68 l8 -14 l8 14 z" fill="#64392a" />
        <path d="M130 68 l10 -9 l10 9 z" fill="#64392a" />
        <g transform="translate(26 50)">
          <rect x="-3" y="-6" width="26" height="5" rx="1.5" fill="#7fb6e0" />
          <rect x="1" y="-1" width="18" height="11" rx="2" fill="#dcc9a6" />
          <circle cx="5" cy="12" r="4" fill="#3a3550" />
          <circle cx="16" cy="12" r="4" fill="#3a3550" />
          <circle cx="20" cy="-10" r="3" fill="#75cbd1" />
        </g>
        <g fill="#ffe9a8" opacity="0.9">
          <circle cx="76" cy="36" r="3.5" />
          <circle cx="112" cy="44" r="3" />
        </g>
      </svg>
    )
  }

  if (gameId === 'gusev-maze') {
    return (
      <svg className="mcard__scene" viewBox="0 0 160 90" aria-hidden="true">
        <rect width="160" height="90" fill="#171441" />
        <g fill="#2b2550">
          <rect x="14" y="14" width="34" height="9" rx="2" />
          <rect x="60" y="14" width="40" height="9" rx="2" />
          <rect x="112" y="14" width="34" height="9" rx="2" />
          <rect x="14" y="38" width="22" height="9" rx="2" />
          <rect x="48" y="38" width="64" height="9" rx="2" />
          <rect x="124" y="38" width="22" height="9" rx="2" />
          <rect x="14" y="62" width="40" height="9" rx="2" />
          <rect x="66" y="62" width="30" height="9" rx="2" />
          <rect x="108" y="62" width="38" height="9" rx="2" />
        </g>
        <g fill="#e9d9b8">
          {[22, 38, 54, 70, 86, 102, 118, 134].map((x) => (
            <circle key={x} cx={x} cy={31} r="2.2" />
          ))}
          {[22, 54, 86, 118].map((x) => (
            <circle key={x} cx={x} cy={55} r="2.2" />
          ))}
        </g>
        <circle cx="38" cy="55" r="5" fill="#ffd98a" />
        <g transform="translate(96 50)">
          <rect x="-9" y="-6" width="18" height="4" rx="1" fill="#7fb6e0" />
          <rect x="-7" y="-2" width="14" height="9" rx="2" fill="#dcc9a6" />
        </g>
        <g transform="translate(132 55)">
          <ellipse rx="8" ry="5" fill="#f2a65a" opacity="0.9" />
          <ellipse rx="5" ry="3" cy="-2" fill="#f2a65a" />
          <circle cx="-2.5" cy="-1" r="1.5" fill="#fff" />
          <circle cx="2.5" cy="-1" r="1.5" fill="#fff" />
        </g>
      </svg>
    )
  }

  if (gameId === 'sun-shade') {
    return (
      <svg className="mcard__scene" viewBox="0 0 160 90" aria-hidden="true">
        <rect width="160" height="90" fill="#191440" />
        <g fill="#3a2f4e">
          <rect x="0" y="78" width="160" height="12" />
          <rect x="18" y="54" width="34" height="8" rx="1" />
          <rect x="108" y="54" width="34" height="8" rx="1" />
          <rect x="62" y="34" width="36" height="8" rx="1" />
        </g>
        {/* charco de luz y zona de sombra */}
        <rect x="26" y="70" width="36" height="8" fill="#f0c569" />
        <rect x="98" y="70" width="36" height="8" fill="#6a56ab" />
        {/* rover solar */}
        <g transform="translate(34 58)">
          <rect x="-9" y="-4" width="18" height="4" fill="#ffd27a" />
          <rect x="-7" y="0" width="14" height="9" fill="#e8c98f" />
          <circle cx="-4" cy="10" r="2.4" fill="#2f2a42" />
          <circle cx="4" cy="10" r="2.4" fill="#2f2a42" />
        </g>
        {/* rover nuclear */}
        <g transform="translate(124 58)">
          <circle cx="0" cy="-3" r="4" fill="#c6a8ff" />
          <rect x="-7" y="0" width="14" height="9" fill="#b9a6e0" />
          <circle cx="-4" cy="10" r="2.4" fill="#2f2a42" />
          <circle cx="4" cy="10" r="2.4" fill="#2f2a42" />
        </g>
        {/* muestra y escotillas */}
        <g transform="translate(80 26) rotate(45)">
          <rect x="-5" y="-5" width="10" height="10" fill="#8fe0f2" />
        </g>
        <path d="M14 78 a7 7 0 0 1 14 0" stroke="#ffd27a" strokeWidth="2" fill="none" />
        <path d="M134 78 a7 7 0 0 1 14 0" stroke="#c6a8ff" strokeWidth="2" fill="none" />
      </svg>
    )
  }

  return (
    <svg className="mcard__scene" viewBox="0 0 160 90" aria-hidden="true">
      <rect width="160" height="90" fill="#141a56" />
      <circle cx="80" cy="128" r="62" fill="#2f6fb5" opacity="0.45" />
      <g stroke="#75cbd1" strokeWidth="1.6" opacity="0.6">
        <line x1="62" y1="16" x2="62" y2="74" />
        <line x1="98" y1="16" x2="98" y2="74" />
        <line x1="44" y1="35" x2="116" y2="35" />
        <line x1="44" y1="55" x2="116" y2="55" />
      </g>
      <g stroke="#75cbd1" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M46 28 a6 6 0 0 1 12 0" />
        <path d="M52 28 v6 M47 34 h10" />
        <path d="M82 48 a6 6 0 0 1 12 0" />
        <path d="M88 48 v6 M83 54 h10" />
        <path d="M118 68 a6 6 0 0 1 12 0" />
        <path d="M124 68 v6 M119 74 h10" />
      </g>
      <g stroke="#f2d2ff" strokeWidth="2" fill="none">
        <ellipse cx="88" cy="26" rx="9" ry="5" transform="rotate(-28 88 26)" />
        <ellipse cx="52" cy="66" rx="9" ry="5" transform="rotate(-28 52 66)" />
      </g>
      <g fill="#f2d2ff">
        <circle cx="88" cy="26" r="3" />
        <circle cx="52" cy="66" r="3" />
      </g>
      <line
        x1="52"
        y1="28"
        x2="124"
        y2="71"
        stroke="#7ee2b0"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  )
}

interface Props {
  card: ArcadeCard
  progress: Progress
}

/**
 * Tarjeta de un minijuego. Misma estructura que GameCard para que la pagina
 * se lea igual, pero sin ficha cientifica: el dato real aparece al terminar
 * la partida, que es donde pega.
 */
export default function MiniCard({ card, progress }: Props) {
  const done = progress.games[card.gameId]?.levelsCompleted ?? []
  const next = nextPlayableLevel(progress, card.gameId)
  const complete = new Set(done).size >= 3

  const play = (levelId: LevelId) => {
    navigate(`#/jugar/${card.gameId}/${levelId}`)
  }

  return (
    <article className="gcard mcard" style={{ ['--accent' as string]: card.accent }}>
      <button
        type="button"
        className="gcard__thumb"
        onClick={() => play(next)}
        aria-label={`Jugar ${card.title}, nivel ${next}`}
      >
        <MiniScene gameId={card.gameId} />
        <span className="gcard__body-tag mcard__tag">Arcade</span>
        {complete && (
          <span className="gcard__seal" title="Completado">
            <IconStar size={14} /> Completado
          </span>
        )}
        <span className="gcard__play">
          <IconPlay size={26} />
        </span>
      </button>

      <div className="gcard__info">
        <h3 className="gcard__title">{card.title}</h3>
        <p className="gcard__genre">{card.genre}</p>

        <div className="gcard__foot">
          <div className="gcard__levels" role="group" aria-label={`Niveles de ${card.title}`}>
            {card.levels.map((l) => {
              const isDone = done.includes(l.id)
              const open = isLevelUnlocked(progress, card.gameId, l.id)
              const state = isDone ? 'completado' : open ? 'disponible' : 'bloqueado'
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`lvdot is-${state}`}
                  disabled={!open}
                  onClick={() => play(l.id)}
                  aria-label={`Nivel ${l.id}, ${l.name}: ${state}${
                    open ? '' : `. Completa el nivel ${l.id - 1} para abrirlo`
                  }`}
                  title={`${l.id}. ${l.name} — ${l.goal}`}
                >
                  {open ? <span aria-hidden="true">{l.id}</span> : <IconLock size={12} />}
                </button>
              )
            })}
          </div>

          <span className="mcard__time">
            {card.durationMin[0]}–{card.durationMin[1]} min
          </span>
        </div>
      </div>
    </article>
  )
}

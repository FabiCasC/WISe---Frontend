import { useState } from 'react'
import { DESTINATIONS, type GameEntry } from '../../content/games'
import { getMission } from '../../content/missions'
import { gameProgress, isLearned, isLevelUnlocked, nextPlayableLevel } from '../../shared/progress'
import type { LevelId, Progress } from '../../shared/types'
import { IconLock, IconPlay } from './Art'
import Modal from './Modal'
import WallIcon from './WallIcon'

/* =========================================================================
   The game wall (Friv style): small square tiles packed densely, a few big
   ones, the logo dropped into the grid. Every game is open from the start;
   only the levels inside a game go in order.
   ========================================================================= */

interface WallProps {
  games: GameEntry[]
  progress: Progress
  onOpen: (game: GameEntry) => void
  /** Show the logo tile among the games (only on the full, unfiltered wall). */
  withLogo?: boolean
  compact?: boolean
}

export function GameWall({ games, progress, onOpen, withLogo = false, compact = false }: WallProps) {
  const tiles = games.map((g) => <GameTile key={g.id} game={g} progress={progress} onOpen={onOpen} compact={compact} />)
  if (withLogo && tiles.length > 5) {
    tiles.splice(
      5,
      0,
      <div key="logo" className="gt gt--logo" aria-hidden="true">
        <span>
          <b>ORBITA</b>
          <b>ARCADE</b>
          <small>{games.length} games</small>
        </span>
      </div>,
    )
  }
  return <div className={`gwall${compact ? ' gwall--compact' : ''}`}>{tiles}</div>
}

function GameTile({
  game,
  progress,
  onOpen,
  compact,
}: {
  game: GameEntry
  progress: Progress
  onOpen: (game: GameEntry) => void
  compact: boolean
}) {
  const [artOk, setArtOk] = useState(true)
  const done = gameProgress(progress, game.id).levelsCompleted.length
  const dest = DESTINATIONS[game.destination]
  const size = compact ? '' : game.size === 'big' ? ' gt--big' : game.size === 'wide' ? ' gt--wide' : ''
  const soon = game.status === 'soon'

  return (
    <button
      type="button"
      className={`gt${size}${soon ? ' is-soon' : ''}`}
      style={{ ['--c' as string]: dest.color }}
      onClick={() => onOpen(game)}
      aria-label={`${game.title}. ${dest.label}, ${game.levels} levels${soon ? ', coming soon' : ''}${done ? `, ${done} completed` : ''}`}
    >
      {game.art && artOk ? (
        <img className="gt__art" src={game.art} alt="" loading="lazy" decoding="async" onError={() => setArtOk(false)} />
      ) : (
        <span className="gt__icon">
          <WallIcon name={game.icon} />
        </span>
      )}
      {soon ? <span className="gt__badge">SOON</span> : game.isNew ? <span className="gt__badge gt__badge--new">NEW</span> : null}
      {!soon && <span className="gt__badge gt__badge--live">PLAY</span>}
      <span className="gt__lv">{game.levels} LV</span>
      {done > 0 && (
        <span className="gt__done" aria-hidden="true">
          {Array.from({ length: Math.min(done, 8) }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      )}
      <span className="gt__name">{game.title}</span>
    </button>
  )
}

/* =========================================================================
   Game sheet: levels, concepts and the Play button.
   ========================================================================= */

export function GameSheet({
  game,
  progress,
  onClose,
  onPlay,
  onDossier,
}: {
  game: GameEntry
  progress: Progress
  onClose: () => void
  onPlay: (game: GameEntry, levelId: LevelId) => void
  onDossier: (gameId: string) => void
}) {
  const dest = DESTINATIONS[game.destination]
  const done = gameProgress(progress, game.id).levelsCompleted
  const live = game.status === 'live'
  const next = nextPlayableLevel(progress, game.id, game.levels)
  const hasDossier = !!getMission(game.id)

  return (
    <Modal
      title={game.title}
      subtitle={`${dest.label} · ${game.levels} levels · ${game.concepts.length} concepts`}
      onClose={onClose}
      footer={
        <div className="sheet__actions">
          {live ? (
            <button type="button" className="btn btn--primary btn--lg" onClick={() => onPlay(game, next)}>
              <IconPlay /> {done.length ? `Play level ${next}` : 'Play'}
            </button>
          ) : (
            <span className="sheet__soon">Our team is building this game. Coming soon.</span>
          )}
          {hasDossier && (
            <button type="button" className="btn btn--quiet" onClick={() => onDossier(game.id)}>
              Science card
            </button>
          )}
        </div>
      }
    >
      <div className="sheet__cover" style={{ ['--c' as string]: dest.color }} aria-hidden="true">
        <WallIcon name={game.icon} />
      </div>

      <div>
        <p className="sheet__label">Levels</p>
        <div className="sheet__levels" role="group" aria-label={`${game.title} levels`}>
          {Array.from({ length: game.levels }, (_, i) => i + 1).map((l) => {
            const isDone = done.includes(l)
            const open = live && isLevelUnlocked(progress, game.id, l)
            const state = isDone ? 'completed' : open ? 'available' : 'locked'
            return (
              <button
                key={l}
                type="button"
                className={`slv is-${state}`}
                disabled={!open}
                onClick={() => onPlay(game, l)}
                aria-label={`Level ${l}: ${state}`}
              >
                {open || isDone ? String(l).padStart(2, '0') : <IconLock size={12} />}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="sheet__label">What you will learn</p>
        <ul className="sheet__concepts">
          {game.concepts.map((c) => {
            const learned = isLearned(progress.concepts[c.id])
            return (
              <li key={c.id} className={learned ? 'is-learned' : ''}>
                <span aria-hidden="true">{learned ? '✓' : '◆'}</span>
                {c.label}
                {learned && <span className="sr-only"> (learned)</span>}
              </li>
            )
          })}
        </ul>
      </div>
    </Modal>
  )
}

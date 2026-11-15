import { useMemo, useState } from 'react'
import { DESTINATIONS, GAMES, type Destination, type GameEntry } from '../../content/games'
import type { Membership } from '../../shared/classroom'
import { getRank, learnedConcepts } from '../../shared/progress'
import type { Progress } from '../../shared/types'
import { IconStar } from './Art'
import { GameWall } from './GameWall'

interface Props {
  progress: Progress
  membership: Membership | null
  onOpenGame: (game: GameEntry) => void
}

/**
 * Deterministic shuffle of the games still in progress, so the wall looks
 * scattered like a game portal while live games stay first.
 */
function scattered(list: GameEntry[]): GameEntry[] {
  const live = list.filter((g) => g.status === 'live')
  const rest = list.filter((g) => g.status !== 'live')
  let s = 20261114
  const rand = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return [...live, ...rest]
}

/**
 * Every game, Friv style, at the bottom of the home page (#/games). It is a
 * section, not a page of its own. No game locks another one.
 */
export default function GamesSection({ progress, membership, onOpenGame }: Props) {
  const [filter, setFilter] = useState<'all' | Destination>('all')
  const [query, setQuery] = useState('')
  const rank = getRank(progress)
  const learned = learnedConcepts(progress).length

  const games = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = GAMES.filter(
      (g) => (filter === 'all' || g.destination === filter) && (!q || g.title.toLowerCase().includes(q)),
    )
    return filter === 'all' && !q ? scattered(list) : list
  }, [filter, query])

  return (
    <>
      <section className="arcade wrap" id="games" aria-labelledby="arcade-title">
        <h2 className="sr-only" id="arcade-title">
          Arcade: all games
        </h2>

        <div className="hud">
          <div className="hud__who">
            {membership ? (
              <>
                <span className="hud__chip hud__chip--me">{membership.nickname}</span>
                <span className="hud__chip">Class {membership.code}</span>
              </>
            ) : (
              <span className="hud__chip">Solo mode</span>
            )}
            <span className="hud__chip hud__chip--rank">
              <IconStar size={13} /> {rank.name} · {learned} {learned === 1 ? 'concept' : 'concepts'}
            </span>
          </div>
          <label className="sr-only" htmlFor="game-search">
            Search games
          </label>
          <input
            id="game-search"
            className="hud__search"
            type="search"
            placeholder="Search games…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="filters" role="group" aria-label="Filter by destination">
          <button
            type="button"
            className="filter"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All games
          </button>
          {(Object.keys(DESTINATIONS) as Destination[]).map((d) => (
            <button
              key={d}
              type="button"
              className="filter"
              aria-pressed={filter === d}
              onClick={() => setFilter(d)}
              style={{ ['--c' as string]: DESTINATIONS[d].color }}
            >
              <i aria-hidden="true" />
              {DESTINATIONS[d].label}
            </button>
          ))}
        </div>

        {games.length ? (
          <GameWall games={games} progress={progress} onOpen={onOpenGame} withLogo={filter === 'all' && !query} />
        ) : (
          <p className="arcade__empty">No games match “{query}”.</p>
        )}

        <p className="arcade__foot">
          {games.length} games · new games appear here as the team ships them ·{' '}
          <a href="#/profile">Your medals</a>
        </p>
      </section>
    </>
  )
}

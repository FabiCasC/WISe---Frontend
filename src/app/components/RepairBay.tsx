import { useCallback, useMemo, useState } from 'react'
import { REPAIRS, type RepairMission } from '../../content/repairs'
import { getGame } from '../../content/games'
import { SOURCES } from '../../content/sources'
import { BenchFor } from './benches'
import {
  emptyRepairs,
  isSolved,
  loadRepairs,
  markSolved,
  saveRepairs,
  type RepairProgress,
} from '../../shared/repairProgress'

/**
 * REPAIR BAY
 * -------------------------------------------------------------------------
 * The room where the student stops playing the games and starts fixing them.
 *
 * The order is the point. A child does not read an explanation and then
 * answer a question about it; they do the experiment first and the answer
 * arrives through their eyes. So a mission runs:
 *
 *   1. the bench      — drag, press, watch. Nothing else is on screen yet.
 *   2. what you saw   — one line, and what the game claims instead.
 *   3. the repair     — now the choice is applying what they watched.
 *   4. NASA           — confirms it afterwards. Never homework up front.
 *
 * Steps 2 to 4 stay hidden until the bench has actually been used, so the
 * screen can never be skimmed down to a multiple-choice question.
 *
 * No icons or emoji carry meaning. Every state is also a word, so it
 * survives a screen reader and a nine-year-old.
 */
export default function RepairBay({ accountId }: { accountId?: string }) {
  const [progress, setProgress] = useState<RepairProgress>(() => {
    try {
      return loadRepairs(accountId)
    } catch {
      return emptyRepairs()
    }
  })
  const [openId, setOpenId] = useState<string | null>(null)

  const open = useMemo(() => REPAIRS.find((r) => r.id === openId) ?? null, [openId])

  const handleSolved = useCallback(
    (id: string, firstTry: boolean) => {
      setProgress((prev) => {
        const next = markSolved(prev, id, firstTry)
        saveRepairs(next, accountId)
        return next
      })
    },
    [accountId],
  )

  if (open) {
    return (
      <Mission
        key={open.id}
        mission={open}
        solved={isSolved(progress, open.id)}
        onSolved={handleSolved}
        onBack={() => setOpenId(null)}
      />
    )
  }

  const done = progress.solved.length

  return (
    <div className="bay">
      <p className="bay__lede">
        Every game here was checked rule by rule. Some were teaching things that are not true.
        Run the test yourself, then repair the game.
      </p>

      <p className="bay__count" role="status">
        <strong>{done}</strong> of {REPAIRS.length} repaired
      </p>

      <ol className="bay__list">
        {REPAIRS.map((m, i) => {
          const game = getGame(m.gameId)
          const fixed = isSolved(progress, m.id)
          return (
            <li key={m.id}>
              <button
                type="button"
                className={'bay__card' + (fixed ? ' is-fixed' : '')}
                onClick={() => setOpenId(m.id)}
              >
                <span className="bay__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="bay__body">
                  <span className="bay__game">{game?.title ?? m.gameId}</span>
                  <span className="bay__title">{m.title}</span>
                  <span className="bay__ask">{m.ask}</span>
                </span>
                <span className={'bay__state' + (fixed ? ' is-fixed' : '')}>
                  {fixed ? 'Repaired' : 'Open'}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Mission({
  mission,
  solved,
  onSolved,
  onBack,
}: {
  mission: RepairMission
  solved: boolean
  onSolved: (id: string, firstTry: boolean) => void
  onBack: () => void
}) {
  /** Set once the student has actually run the experiment. */
  const [used, setUsed] = useState(solved)
  const [tried, setTried] = useState<string[]>([])

  const chosen = tried[tried.length - 1] ?? null
  const chosenOption = mission.options.find((o) => o.id === chosen) ?? null
  const isRight = chosenOption?.correct === true
  const source = SOURCES[mission.evidence.sourceId]
  const game = getGame(mission.gameId)

  const choose = (id: string) => {
    if (isRight) return
    const option = mission.options.find((o) => o.id === id)
    if (!option) return
    const firstTry = tried.length === 0
    setTried((t) => (t.includes(id) ? t : [...t, id]))
    if (option.correct) onSolved(mission.id, firstTry)
  }

  const shown = isRight ? mission.ruleFixed : mission.rule

  return (
    <div className="bay">
      <button type="button" className="bay__back" onClick={onBack}>
        Back to the list
      </button>

      <p className="bay__game">{game?.title ?? mission.gameId}</p>
      <h2 className="bay__h2">
        {mission.title}
        {solved ? <span className="bay__state is-fixed bay__state--inline">Repaired</span> : null}
      </h2>

      <BenchFor id={mission.bench} onUsed={() => setUsed(true)} />

      {used ? (
        <>
          <div className="bay__seen">
            <p className="bay__saw">{mission.observation}</p>
            <p className="bay__says">{mission.gameSays}</p>
          </div>

          <section className="bay__step">
            <h3 className="bay__h3">The rule inside the game</h3>
            <div className="blocks">
              {shown.before.map((line) => (
                <p key={line} className="blocks__row">
                  {line}
                </p>
              ))}
              <p className={'blocks__row blocks__row--slot' + (isRight ? ' is-fixed' : '')}>
                <span className="blocks__slot">{shown.slot}</span>
                {isRight ? <span className="blocks__tag">repaired</span> : null}
              </p>
              {shown.after.map((line) => (
                <p key={line} className="blocks__row">
                  {line}
                </p>
              ))}
            </div>

            {!isRight ? (
              <>
                <p className="bay__prompt">Change the marked piece:</p>
                <ul className="bay__options">
                  {mission.options.map((o) => {
                    const usedOpt = tried.includes(o.id)
                    return (
                      <li key={o.id}>
                        <button
                          type="button"
                          className={'bay__chip' + (usedOpt ? ' is-wrong' : '')}
                          onClick={() => choose(o.id)}
                          disabled={usedOpt}
                        >
                          {o.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {chosenOption ? (
                  <p className="bay__note" role="status">
                    {chosenOption.note}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="bay__note is-right" role="status">
                {mission.options.find((o) => o.correct)!.note}
              </p>
            )}
          </section>

          {isRight ? (
            <section className="bay__step">
              <h3 className="bay__h3">What NASA measured</h3>
              <p className="bay__evidence">{mission.evidence.text}</p>
              {source ? (
                <p className="bay__source">
                  <a href={source.url} target="_blank" rel="noreferrer noopener">
                    {source.title}
                  </a>
                  <span className="bay__publisher">
                    {source.publisher}
                    {source.accessed ? ' · checked ' + source.accessed : ''}
                  </span>
                </p>
              ) : null}

              <div className="bay__done">
                <h4 className="bay__h4">What really changed</h4>
                <p>{mission.fixedIn}</p>
                <button type="button" className="bay__next" onClick={onBack}>
                  Back to the list
                </button>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

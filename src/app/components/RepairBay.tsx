import { useCallback, useMemo, useState } from 'react'
import { REPAIRS, type RepairMission } from '../../content/repairs'
import { getGame } from '../../content/games'
import { SOURCES } from '../../content/sources'
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
 * Every mission is a bug this project really had. The student reads one rule
 * written as blocks, opens the NASA source, and chooses the repair. Choosing
 * rewrites the block in front of them, which is the moment the job changes
 * hands: they are not answering a question, they are editing the game.
 *
 * No icons, no emoji, no decoration that carries meaning on its own. Every
 * state is a word, so it survives a screen reader and a nine-year-old.
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
        mission={open}
        solved={isSolved(progress, open.id)}
        onSolved={handleSolved}
        onBack={() => setOpenId(null)}
      />
    )
  }

  const done = progress.solved.length
  const total = REPAIRS.length

  return (
    <div className="bay">
      <div className="bay__intro">
        <h2 className="bay__h2">Repair bay</h2>
        <p className="bay__lede">
          Every game in this arcade was checked rule by rule, and some of them were teaching
          things that are not true. The broken rules are below, exactly as they were. Read what
          NASA measured, find the mistake, and repair it.
        </p>
      </div>

      <p className="bay__count" role="status">
        <strong>{done}</strong> of {total} repaired
        {progress.firstTry.length > 0 ? (
          <span className="bay__clean"> · {progress.firstTry.length} with no wrong guess</span>
        ) : null}
      </p>

      <ol className="bay__list">
        {REPAIRS.map((m, i) => {
          const game = getGame(m.gameId)
          const fixed = isSolved(progress, m.id)
          return (
            <li key={m.id}>
              <button type="button" className="bay__card" onClick={() => setOpenId(m.id)}>
                <span className="bay__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="bay__body">
                  <span className="bay__game">{game?.title ?? m.gameId}</span>
                  <span className="bay__title">{m.title}</span>
                  <span className="bay__symptom">{m.symptom}</span>
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
  /** Every option the student has tried, so a wrong one stays explained. */
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

  // Once it is right the WHOLE repaired rule replaces the broken one, not
  // just the slot: in Sun and Shade, "IF the rover is taller THEN it sinks"
  // would be nonsense. Before that, the slot previews whatever was chosen.
  const shown = isRight
    ? mission.ruleFixed
    : { ...mission.rule, slot: chosenOption?.label ?? mission.rule.slot }

  return (
    <div className="bay">
      <button type="button" className="bay__back" onClick={onBack}>
        Back to the repair list
      </button>

      <h2 className="bay__h2">{mission.title}</h2>
      <p className="bay__game bay__game--big">
        In {game?.title ?? mission.gameId}
        {solved ? <span className="bay__state is-fixed bay__state--inline">Repaired</span> : null}
      </p>

      <section className="bay__step">
        <h3 className="bay__h3">1. What the player saw</h3>
        <p className="bay__text">{mission.symptom}</p>
      </section>

      <section className="bay__step">
        <h3 className="bay__h3">2. The rule inside the game</h3>
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
      </section>

      <section className="bay__step">
        <h3 className="bay__h3">3. What NASA measured</h3>
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
      </section>

      <section className="bay__step">
        <h3 className="bay__h3">4. Your repair</h3>
        <p className="bay__text">{mission.question}</p>
        <ul className="bay__options">
          {mission.options.map((o) => {
            const used = tried.includes(o.id)
            const state = !used ? '' : o.correct ? ' is-right' : ' is-wrong'
            return (
              <li key={o.id}>
                <button
                  type="button"
                  className={'bay__option' + state}
                  onClick={() => choose(o.id)}
                  disabled={isRight || used}
                >
                  <span className="bay__option-label">{o.label}</span>
                  {used ? (
                    <span className="bay__option-state">{o.correct ? 'Correct' : 'Not this'}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>

        {chosenOption ? (
          <div className={'bay__feedback' + (isRight ? ' is-right' : ' is-wrong')} role="status">
            <p>{chosenOption.feedback}</p>
            {!isRight ? <p className="bay__retry">Read the data again and try another one.</p> : null}
          </div>
        ) : null}

        {isRight ? (
          <div className="bay__done" role="status">
            <h4 className="bay__h4">What really changed in the game</h4>
            <p>{mission.fixedIn}</p>
            <button type="button" className="bay__next" onClick={onBack}>
              Back to the repair list
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { conceptLabel, getGame } from '../../content/games'
import type { ClassService, Dashboard, DashboardRow } from '../../shared/classroom'
import { computeMedals, earnedMedals, medalStatsFromStudent } from '../../shared/medals'
import { isLearned } from '../../shared/progress'
import type { Medal } from '../../shared/medals'
import { IconCheck, IconCross, IconStar } from '../components/Art'
import SiteFooter from '../components/SiteFooter'
import { absoluteLink, CopyField } from './Teacher'

/**
 * #/panel/<token> — private teacher dashboard ("Mission log"). It refreshes
 * every few seconds and whenever another tab of this browser saves results.
 */
export default function Panel({ token, service }: { token: string; service: ClassService }) {
  const [data, setData] = useState<Dashboard | null | undefined>(undefined)
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(() => {
    service
      .getDashboard(token)
      .then(setData)
      .catch(() => setData(null))
  }, [service, token])

  useEffect(() => {
    load()
    const t = window.setInterval(load, 5000)
    window.addEventListener('storage', load)
    return () => {
      window.clearInterval(t)
      window.removeEventListener('storage', load)
    }
  }, [load])

  if (data === undefined) {
    return (
      <section className="section wrap page">
        <p role="status">Loading the dashboard…</p>
      </section>
    )
  }

  if (data === null) {
    return (
      <>
        <section className="section wrap page">
          <div className="card">
            <h1 className="page__title">We could not find this class</h1>
            <p className="page__lede">
              Check that the link is complete. In this test version the class only exists in the
              browser where it was created.
            </p>
            <a className="btn btn--primary" href="#/teacher">
              Create a class
            </a>
          </div>
        </section>
        <SiteFooter />
      </>
    )
  }

  const { rows, average, concepts } = data
  const current = rows.find((r) => r.nickname === selected) ?? rows[0]
  const gamesPlayed = rows.reduce((n, r) => n + r.gamesPlayed, 0)
  const hardest = concepts.find((c) => c.percent < 100)
  const medalsOf = (r: DashboardRow) => earnedMedals(computeMedals(medalStatsFromStudent(r), 'student'))
  const classMedals = rows.reduce((n, r) => n + medalsOf(r).length, 0)

  return (
    <>
      <section className="section wrap mlog">
        <div className="mlog__head">
          <div>
            <h1 className="mlog__title">{data.name}</h1>
            <p className="mlog__sub">Mission log · {data.grade}</p>
          </div>
          <div className="mlog__code">
            <span>Class code</span>
            <strong>{data.code}</strong>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi">
            <span className="kpi__label">Students</span>
            <span className="kpi__value">{rows.length}</span>
          </div>
          <div className="kpi">
            <span className="kpi__label">Games played</span>
            <span className="kpi__value">{gamesPlayed}</span>
          </div>
          <div className="kpi">
            <span className="kpi__label">Concepts learned (average)</span>
            <span className="kpi__value">{average ? average.conceptsLearned.toLocaleString('en') : '—'}</span>
          </div>
          <div className="kpi">
            <span className="kpi__label">Medals earned</span>
            <span className="kpi__value">{classMedals}</span>
          </div>
          <div className={`kpi${hardest ? ' kpi--alert' : ''}`}>
            <span className="kpi__label">Hardest concept</span>
            <span className="kpi__value kpi__value--text">{hardest ? conceptLabel(hardest.id) : '—'}</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="card">
            <h2 className="card__title">No students yet</h2>
            <p className="page__lede">
              Share the code <strong className="code-inline">{data.code}</strong> or this link:
            </p>
            <CopyField label="Link for your students" value={absoluteLink(`#/class/${data.code}`)} />
          </div>
        ) : (
          <div className="mlog__grid">
            <div className="box">
              <div className="box__head">
                <h2>Students</h2>
                <span>Select a row</span>
              </div>
              <div className="tablewrap" tabIndex={0} role="region" aria-label="Results by student">
                <table className="table">
                  <caption className="sr-only">Results for class {data.name}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Nickname</th>
                      <th scope="col">Games</th>
                      <th scope="col">Levels</th>
                      <th scope="col">Concepts</th>
                      <th scope="col">Right first time</th>
                      <th scope="col">Medals</th>
                      <th scope="col">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.nickname} className={r === current ? 'is-on' : ''}>
                        <th scope="row">
                          <button type="button" className="rowbtn" onClick={() => setSelected(r.nickname)} aria-pressed={r === current}>
                            {r.nickname}
                          </button>
                        </th>
                        <td className="num">{r.gamesPlayed}</td>
                        <td className="num">{r.levelsCompleted}</td>
                        <td className="num">{r.conceptsLearned}</td>
                        <td className="num">
                          {r.firstTryCorrect} of {r.attempts}
                        </td>
                        <td className="num">{medalsOf(r).length}</td>
                        <td className="num">{r.totalScore.toLocaleString('en')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {current && <StudentDetail row={current} medals={medalsOf(current)} />}
          </div>
        )}

        {concepts.length > 0 && (
          <div className="box">
            <div className="box__head">
              <h2>Class concept map</h2>
              <span>% of students who got it right</span>
            </div>
            <div className="cmap">
              {concepts.map((c) => (
                <div key={c.id} className={`cmap__row${c.percent < 50 ? ' is-low' : ''}`}>
                  <span>{conceptLabel(c.id)}</span>
                  <span className="meter" aria-hidden="true">
                    <i style={{ width: `${c.percent}%` }} />
                  </span>
                  <span className="num">
                    {c.percent}% <small>of {c.seenBy}</small>
                  </span>
                </div>
              ))}
            </div>
            {hardest && (
              <div className="tip">
                <p className="tip__label">Suggested 2-minute talk</p>
                <p>
                  <strong>
                    {100 - hardest.percent}% of the students who met it have not got “{conceptLabel(hardest.id)}” yet.
                  </strong>{' '}
                  Open the science card of the game in class and talk it through with the official NASA
                  source.
                </p>
              </div>
            )}
          </div>
        )}

        <p className="created__note">
          Updates on its own. Only nicknames and game results are stored: never names, emails or ages.
        </p>
      </section>
      <SiteFooter />
    </>
  )
}

function StudentDetail({ row, medals }: { row: DashboardRow; medals: Medal[] }) {
  const games = Object.entries(row.games)
  return (
    <div className="box" aria-live="polite">
      <div className="box__head">
        <h2>{row.nickname}</h2>
        <span>
          {row.totalScore.toLocaleString('en')} points · {row.conceptsLearned} concepts · {row.levelsCompleted} levels
        </span>
      </div>
      <div className="student">
        <div className="played">
          <div className="played__top">
            <span>Medals</span>
            <span className="num">{medals.length}</span>
          </div>
          <div className="tags">
            {medals.length === 0 && <span className="tag tag--none">No medals yet</span>}
            {medals.map((m) => (
              <span key={m.id} className="tag tag--ok">
                <IconStar size={13} />
                {m.name}
              </span>
            ))}
          </div>
        </div>
        {games.length === 0 && <p className="student__empty">No levels completed yet.</p>}
        {games.map(([gameId, levels]) => {
          const game = getGame(gameId)
          const total = game?.levels ?? Math.max(...levels)
          const gameConcepts = game?.concepts ?? []
          return (
            <div key={gameId} className="played">
              <div className="played__top">
                <span>{game?.title ?? gameId}</span>
                <span className="num">
                  {levels.length}/{total} levels
                </span>
              </div>
              <div className="pips" aria-hidden="true">
                {Array.from({ length: total }, (_, i) => (
                  <i key={i} className={levels.includes(i + 1) ? 'is-done' : ''} />
                ))}
              </div>
              <div className="tags">
                {gameConcepts
                  .filter((c) => row.concepts[c.id])
                  .map((c) =>
                    isLearned(row.concepts[c.id]) ? (
                      <span key={c.id} className="tag tag--ok">
                        <IconCheck size={13} />
                        <span className="sr-only">Learned: </span>
                        {c.label}
                      </span>
                    ) : (
                      <span key={c.id} className="tag tag--miss">
                        <IconCross size={13} />
                        <span className="sr-only">Not yet: </span>
                        {c.label}
                      </span>
                    ),
                  )}
                {gameConcepts.every((c) => !row.concepts[c.id]) && (
                  <span className="tag tag--none">No concept decisions recorded yet</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

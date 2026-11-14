import { useCallback, useEffect, useState } from 'react'
import type { ClassService, Dashboard } from '../../shared/classroom'
import { MAX_GENERAL_LEVEL } from '../../shared/progress'
import { IconUsers } from '../components/Art'
import SiteFooter from '../components/SiteFooter'
import { absoluteLink, CopyField } from './Teacher'

/**
 * #/panel/<token> — panel privado del profesor. Se actualiza solo cada pocos
 * segundos y cuando otra pestaña del mismo navegador guarda resultados.
 */
export default function Panel({ token, service }: { token: string; service: ClassService }) {
  const [data, setData] = useState<Dashboard | null | undefined>(undefined)

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

  const { rows, average } = data

  return (
    <>
      <section className="section wrap page">
        <div className="page__head">
          <span className="page__icon" aria-hidden="true">
            <IconUsers size={26} />
          </span>
          <div>
            <h1 className="page__title">{data.name}</h1>
            <p className="page__lede">
              {data.grade} · code <strong className="code-inline">{data.code}</strong>
            </p>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi">
            <span className="kpi__value">{rows.length}</span>
            <span className="kpi__label">Students</span>
          </div>
          <div className="kpi">
            <span className="kpi__value">{average ? average.generalLevel.toLocaleString('es') : '—'}</span>
            <span className="kpi__label">Average level (of {MAX_GENERAL_LEVEL})</span>
          </div>
          <div className="kpi">
            <span className="kpi__value">{average ? average.totalScore.toLocaleString('es') : '—'}</span>
            <span className="kpi__label">Average score</span>
          </div>
          <div className="kpi">
            <span className="kpi__value kpi__value--soon">Soon</span>
            <span className="kpi__label">Hardest concept</span>
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
          <div className="tablewrap" tabIndex={0} role="region" aria-label="Results by student">
            <table className="table">
              <caption className="sr-only">Results for class {data.name}</caption>
              <thead>
                <tr>
                  <th scope="col">Nickname</th>
                  <th scope="col">General level</th>
                  <th scope="col">Total score</th>
                  <th scope="col">Games completed</th>
                  <th scope="col">Right first time</th>
                  <th scope="col">Concepts mastered</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.nickname}>
                    <th scope="row">{r.nickname}</th>
                    <td>
                      <span className="lvpill">{r.generalLevel}</span>
                    </td>
                    <td className="num">{r.totalScore.toLocaleString('es')}</td>
                    <td className="num">{r.gamesCompleted} of 3</td>
                    <td className="num">
                      {r.firstTryCorrect} of {r.attempts}
                    </td>
                    <td className="muted">Soon</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="created__note">
          Updates on its own. Only nicknames and game results are stored: never names, emails
          or ages.
        </p>
      </section>
      <SiteFooter />
    </>
  )
}

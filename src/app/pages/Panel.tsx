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
        <p role="status">Cargando el panel…</p>
      </section>
    )
  }

  if (data === null) {
    return (
      <>
        <section className="section wrap page">
          <div className="card">
            <h1 className="page__title">No encontramos esta clase</h1>
            <p className="page__lede">
              Revisa que el enlace esté completo. En esta versión de prueba la clase solo existe
              en el navegador donde se creó.
            </p>
            <a className="btn btn--primary" href="#/profesor">
              Crear una clase
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
              {data.grade} · código <strong className="code-inline">{data.code}</strong>
            </p>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi">
            <span className="kpi__value">{rows.length}</span>
            <span className="kpi__label">Alumnos</span>
          </div>
          <div className="kpi">
            <span className="kpi__value">{average ? average.generalLevel.toLocaleString('es') : '—'}</span>
            <span className="kpi__label">Nivel promedio (de {MAX_GENERAL_LEVEL})</span>
          </div>
          <div className="kpi">
            <span className="kpi__value">{average ? average.totalScore.toLocaleString('es') : '—'}</span>
            <span className="kpi__label">Puntaje promedio</span>
          </div>
          <div className="kpi">
            <span className="kpi__value kpi__value--soon">Pronto</span>
            <span className="kpi__label">Concepto con más errores</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="card">
            <h2 className="card__title">Todavía no hay alumnos</h2>
            <p className="page__lede">
              Comparte el código <strong className="code-inline">{data.code}</strong> o este enlace:
            </p>
            <CopyField label="Enlace para tus alumnos" value={absoluteLink(`#/clase/${data.code}`)} />
          </div>
        ) : (
          <div className="tablewrap" tabIndex={0} role="region" aria-label="Resultados por alumno">
            <table className="table">
              <caption className="sr-only">Resultados de la clase {data.name}</caption>
              <thead>
                <tr>
                  <th scope="col">Apodo</th>
                  <th scope="col">Nivel general</th>
                  <th scope="col">Puntaje total</th>
                  <th scope="col">Juegos completos</th>
                  <th scope="col">Aciertos a la primera</th>
                  <th scope="col">Conceptos dominados</th>
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
                    <td className="num">{r.gamesCompleted} de 3</td>
                    <td className="num">
                      {r.firstTryCorrect} de {r.attempts}
                    </td>
                    <td className="muted">Pronto</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="created__note">
          Se actualiza solo. Solo se guardan apodos y resultados de juego: nunca nombres, correos
          ni edades.
        </p>
      </section>
      <SiteFooter />
    </>
  )
}

import { useId, useState, type FormEvent } from 'react'
import type { ClassService } from '../../shared/classroom'
import { IconCopy, IconTeacher } from '../components/Art'
import SiteFooter from '../components/SiteFooter'
import { navigate } from '../hooks/useHashRoute'

const GRADES = [
  '4.º de primaria',
  '5.º de primaria',
  '6.º de primaria',
  '1.º de secundaria',
  '2.º de secundaria',
  '3.º de secundaria',
  'Otro',
]

/** Enlace absoluto a una ruta de hash, para copiar y compartir. */
export function absoluteLink(hash: string): string {
  return `${window.location.origin}${window.location.pathname}${hash}`
}

export function CopyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const [copied, setCopied] = useState(false)
  const id = useId()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin permiso de portapapeles: se selecciona el texto para copiar a mano.
      ;(document.getElementById(id) as HTMLInputElement | null)?.select()
    }
  }

  return (
    <div className="copyfield">
      <label className="copyfield__label" htmlFor={id}>
        {label}
      </label>
      <div className="copyfield__row">
        <input id={id} className="copyfield__input" value={value} readOnly onFocus={(e) => e.target.select()} />
        <button type="button" className="btn btn--sm btn--secondary" onClick={copy}>
          <IconCopy />
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      {hint && <p className="copyfield__hint">{hint}</p>}
      <span className="sr-only" role="status">
        {copied ? 'Copiado al portapapeles' : ''}
      </span>
    </div>
  )
}

export default function Teacher({ service }: { service: ClassService }) {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(GRADES[1])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<{ code: string; teacherToken: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Ponle un nombre a la clase, por ejemplo “5.º B Ciencias”.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      setCreated(await service.createClass({ name, grade }))
    } catch {
      setError('No se pudo crear la clase. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="section wrap page">
        <div className="page__head">
          <span className="page__icon" aria-hidden="true">
            <IconTeacher size={26} />
          </span>
          <div>
            <h1 className="page__title">Modo profesor</h1>
            <p className="page__lede">
              Crea una clase, comparte el código y mira cómo avanza tu grupo. Sin cuentas: no te
              pedimos tu nombre ni correo, y tus alumnos solo reciben un apodo.
            </p>
          </div>
        </div>

        {!created ? (
          <form className="card form" onSubmit={submit} noValidate>
            <h2 className="card__title">Crear clase</h2>

            <div className="form__field">
              <label htmlFor="class-name">Nombre de la clase</label>
              <input
                id="class-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="5.º B Ciencias"
                maxLength={60}
                autoComplete="off"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'class-error' : undefined}
              />
            </div>

            <div className="form__field">
              <label htmlFor="class-grade">Grado</label>
              <select id="class-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
                {GRADES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="form__error" id="class-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn--primary btn--lg" disabled={busy}>
              {busy ? 'Creando…' : 'Crear clase'}
            </button>
          </form>
        ) : (
          <div className="card created" role="status">
            <p className="created__label">Código de la clase</p>
            <p className="created__code">{created.code}</p>
            <p className="created__help">
              Tus alumnos lo escriben en la portada, en “Únete a tu clase”.
            </p>

            <CopyField
              label="Enlace para tus alumnos (el código ya va incluido)"
              value={absoluteLink(`#/clase/${created.code}`)}
            />

            <div className="callout callout--warn">
              <strong>Guarda tu enlace privado del panel.</strong> Es la única forma de ver los
              resultados de esta clase. Si lo pierdes, no se puede recuperar.
            </div>

            <CopyField
              label="Tu enlace privado del panel (no lo compartas)"
              value={absoluteLink(`#/panel/${created.teacherToken}`)}
            />

            <div className="created__actions">
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={() => navigate(`#/panel/${created.teacherToken}`)}
              >
                Abrir el panel
              </button>
              <button type="button" className="btn btn--quiet" onClick={() => setCreated(null)}>
                Crear otra clase
              </button>
            </div>

            <p className="created__note">
              Versión de prueba: mientras no esté conectado el servidor, la clase se guarda solo
              en este navegador.
            </p>
          </div>
        )}
      </section>
      <SiteFooter />
    </>
  )
}

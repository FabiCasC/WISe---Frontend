import { useId, useState, type FormEvent } from 'react'
import type { ClassService } from '../../shared/classroom'
import { IconCopy, IconTeacher } from '../components/Art'
import SiteFooter from '../components/SiteFooter'
import { navigate } from '../hooks/useHashRoute'

const GRADES = ['4th grade', '5th grade', '6th grade', '7th grade', '8th grade', '9th grade', 'Other']

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
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {hint && <p className="copyfield__hint">{hint}</p>}
      <span className="sr-only" role="status">
        {copied ? 'Copied to clipboard' : ''}
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
      setError('Give your class a name, for example “5B Science”.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      setCreated(await service.createClass({ name, grade }))
    } catch {
      setError('The class could not be created. Please try again.')
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
            <h1 className="page__title">Teacher mode</h1>
            <p className="page__lede">
              Create a class, share the code and watch your group progress. No accounts: we never
              ask for your name or email, and your students only get a nickname.
            </p>
          </div>
        </div>

        {!created ? (
          <form className="card form" onSubmit={submit} noValidate>
            <h2 className="card__title">Create a class</h2>

            <div className="form__field">
              <label htmlFor="class-name">Class name</label>
              <input
                id="class-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="5B Science"
                maxLength={60}
                autoComplete="off"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'class-error' : undefined}
              />
            </div>

            <div className="form__field">
              <label htmlFor="class-grade">Grade</label>
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
              {busy ? 'Creating…' : 'Create class'}
            </button>
          </form>
        ) : (
          <div className="card created" role="status">
            <p className="created__label">Class code</p>
            <p className="created__code">{created.code}</p>
            <p className="created__help">
              Students type it on the home page, in “Join your class”.
            </p>

            <CopyField
              label="Link for your students (the code is already included)"
              value={absoluteLink(`#/class/${created.code}`)}
            />

            <div className="callout callout--warn">
              <strong>Save your private dashboard link.</strong> It is the only way to see this
              class’s results. If you lose it, it cannot be recovered.
            </div>

            <CopyField
              label="Your private dashboard link (do not share it)"
              value={absoluteLink(`#/panel/${created.teacherToken}`)}
            />

            <div className="created__actions">
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={() => navigate(`#/panel/${created.teacherToken}`)}
              >
                Open the dashboard
              </button>
              <button type="button" className="btn btn--quiet" onClick={() => setCreated(null)}>
                Create another class
              </button>
            </div>

            <p className="created__note">
              Test version: until the server is connected, the class is saved only in this
              browser.
            </p>
          </div>
        )}
      </section>
      <SiteFooter />
    </>
  )
}

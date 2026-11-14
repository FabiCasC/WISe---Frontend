import { useEffect, useRef, useState } from 'react'
import { normalizeClassCode, type ClassService, type JoinError, type Membership } from '../../shared/classroom'
import { IconPlay, IconUsers } from '../components/Art'
import JoinBox from '../components/JoinBox'
import SiteFooter from '../components/SiteFooter'

const ERRORS: Record<JoinError, string> = {
  'codigo-invalido': 'Ese código no parece válido. Tiene una palabra y dos números, por ejemplo LUNA-27.',
  'clase-no-existe': 'No encontramos esa clase. Revisa el código con tu profe.',
}

interface Props {
  code: string | null
  membership: Membership | null
  playerId: string
  service: ClassService
  onJoined: (m: Membership) => void
  onLeave: () => void
}

/**
 * #/clase y #/clase/<CÓDIGO>. Con el código en la URL se une sola, así el
 * profesor puede compartir un enlace directo.
 */
export default function JoinClass({ code, membership, playerId, service, onJoined, onLeave }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const attempted = useRef<string | null>(null)

  const target = code ? normalizeClassCode(code) : null
  const alreadyThere = membership && (!target || membership.code === target)

  useEffect(() => {
    if (!code || alreadyThere || attempted.current === code) return
    attempted.current = code
    setBusy(true)
    service
      .joinClass(code, playerId)
      .then((res) => {
        if (res.ok) {
          setError(null)
          onJoined(res.membership)
        } else setError(ERRORS[res.error])
      })
      .catch(() => setError('No se pudo entrar a la clase. Inténtalo de nuevo.'))
      .finally(() => setBusy(false))
  }, [code, alreadyThere, playerId, service, onJoined])

  return (
    <>
      <section className="section wrap page">
        <div className="page__head">
          <span className="page__icon" aria-hidden="true">
            <IconUsers size={26} />
          </span>
          <div>
            <h1 className="page__title">Entrar a una clase</h1>
            <p className="page__lede">
              Tu profe verá tus avances con un apodo espacial, nunca con tu nombre.
            </p>
          </div>
        </div>

        {alreadyThere && membership ? (
          <div className="card welcome" role="status">
            <p className="welcome__hello">¡Hola!</p>
            <p className="welcome__nick">{membership.nickname}</p>
            <p className="welcome__text">
              Ese es tu apodo en la clase <strong>{membership.className || membership.code}</strong>{' '}
              (código {membership.code}). Cada nivel que completes le llega a tu profe.
            </p>
            <div className="welcome__actions">
              <a className="btn btn--primary btn--xl" href="#/juegos">
                <IconPlay size={22} />
                Empezar a jugar
              </a>
              <button type="button" className="btn btn--quiet" onClick={onLeave}>
                Salir de la clase
              </button>
            </div>
            <p className="welcome__note">
              Si sales, sigues jugando en modo personal y no pierdes tu progreso.
            </p>
          </div>
        ) : (
          <div className="card">
            {busy ? (
              <p className="welcome__text" role="status">
                Entrando a la clase {target ?? code}…
              </p>
            ) : (
              <>
                {error && (
                  <p className="form__error" role="alert">
                    {error}
                  </p>
                )}
                {membership && target && membership.code !== target && (
                  <p className="welcome__note">
                    Ahora estás en la clase {membership.code}. Si entras a otra, saldrás de esa.
                  </p>
                )}
                <JoinBox initial={target ?? code ?? ''} />
              </>
            )}
          </div>
        )}
      </section>
      <SiteFooter />
    </>
  )
}

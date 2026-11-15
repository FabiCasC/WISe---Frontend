import { useEffect, useRef, useState } from 'react'
import { normalizeClassCode, type ClassService, type JoinError, type Membership } from '../../shared/classroom'
import { IconPlay, IconUsers } from '../components/Art'
import JoinBox from '../components/JoinBox'
import SiteFooter from '../components/SiteFooter'

const ERRORS: Record<JoinError, string> = {
  'codigo-invalido': 'That code does not look right. It is one word and two numbers, like MOON-27.',
  'clase-no-existe': 'We could not find that class. Check the code with your teacher.',
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
      .catch(() => setError('Could not join the class. Please try again.'))
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
            <h1 className="page__title">Join a class</h1>
            <p className="page__lede">
              Your teacher sees your progress under a space nickname, never your real name.
            </p>
          </div>
        </div>

        {alreadyThere && membership ? (
          <div className="card welcome" role="status">
            <p className="welcome__hello">Hi there!</p>
            <p className="welcome__nick">{membership.nickname}</p>
            <p className="welcome__text">
              That is your nickname in <strong>{membership.className || membership.code}</strong>{' '}
              (code {membership.code}). Every level you complete reaches your teacher.
            </p>
            <div className="welcome__actions">
              <a className="btn btn--primary btn--xl" href="#/arcade">
                <IconPlay size={22} />
                Start playing
              </a>
              <button type="button" className="btn btn--quiet" onClick={onLeave}>
                Leave the class
              </button>
            </div>
            <p className="welcome__note">
              If you leave, you keep playing in solo mode and keep your progress.
            </p>
          </div>
        ) : (
          <div className="card">
            {busy ? (
              <p className="welcome__text" role="status">
                Joining class {target ?? code}…
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
                    You are in class {membership.code} now. Joining another one will take you out of it.
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

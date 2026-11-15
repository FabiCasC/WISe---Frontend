import { useState, type FormEvent } from 'react'
import { BRAND } from '../../content/brand'
import {
  AVATARS,
  type AccountDb,
  type Avatar,
  type AuthError,
  type AuthResult,
  type Role,
} from '../../shared/accounts'
import { BrandGlyph } from '../components/Art'
import WallIcon from '../components/WallIcon'

const MESSAGES: Record<AuthError, string> = {
  'invalid-username': 'Use 3 to 20 letters, numbers, - or _. No spaces, and not your real name.',
  taken: 'That username is taken. Try another one, or log in if it is yours.',
  'invalid-role': 'Choose if you are a student or a teacher.',
  'not-found': 'There is no account with that username on this device. Create one instead.',
}

interface Props {
  db: AccountDb
  onSignUp: (input: { username: string; role: Role; avatar: Avatar }) => AuthResult
  onLogIn: (username: string) => AuthResult
}

/** Sign up / log in. Simulated for the MVP: no password, no real data. */
export default function Auth({ db, onSignUp, onLogIn }: Props) {
  const known = Object.values(db.accounts)
  const [mode, setMode] = useState<'signup' | 'login'>(known.length ? 'login' : 'signup')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [avatar, setAvatar] = useState<Avatar>('rocket')
  const [error, setError] = useState<AuthError | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = mode === 'signup' ? onSignUp({ username, role, avatar }) : onLogIn(username)
    if (!r.ok) setError(r.error)
  }

  const switchMode = (m: 'signup' | 'login') => {
    setMode(m)
    setError(null)
  }

  return (
    <main className="auth" id="main">
      <div className="auth__card">
        <div className="auth__brand">
          <BrandGlyph />
          <span>
            <b>{BRAND.wordmark}</b> {BRAND.wordmarkSub}
          </span>
        </div>
        <h1 className="auth__title">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth__lede">
          Your medals, points and the concepts you learn live in your account. Use a nickname: we
          never ask for your real name or email.
        </p>

        <div className="auth__tabs" role="tablist" aria-label="Account">
          <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => switchMode('signup')}>
            Create account
          </button>
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')}>
            Log in
          </button>
        </div>

        <form className="form auth__form" onSubmit={submit} noValidate>
          {mode === 'signup' && (
            <fieldset className="auth__roles">
              <legend>I am a…</legend>
              {(['student', 'teacher'] as Role[]).map((r) => (
                <label key={r} className={'auth__role' + (role === r ? ' is-on' : '')}>
                  <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
                  <b>{r === 'student' ? 'Student' : 'Teacher'}</b>
                  <span>
                    {r === 'student'
                      ? 'Play, learn concepts and earn medals'
                      : 'Run classes, see what students learn, and create games'}
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          <div className="form__field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError(null)
              }}
              placeholder="StarPilot_7"
              maxLength={20}
              autoComplete="off"
              autoCapitalize="off"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'auth-error' : undefined}
            />
          </div>

          {mode === 'signup' && (
            <fieldset className="auth__avatars">
              <legend>Pick your icon</legend>
              {AVATARS.map((a) => (
                <label key={a} className={'auth__avatar' + (avatar === a ? ' is-on' : '')}>
                  <input type="radio" name="avatar" value={a} checked={avatar === a} onChange={() => setAvatar(a)} />
                  <WallIcon name={a} size={26} />
                  <span className="sr-only">{a}</span>
                </label>
              ))}
            </fieldset>
          )}

          {error && (
            <p className="form__error" id="auth-error" role="alert">
              {MESSAGES[error]}
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--lg">
            {mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>

        {known.length > 0 && mode === 'login' && (
          <div className="auth__known">
            <p>Accounts on this device (demo)</p>
            <div>
              {known.map((a) => (
                <button key={a.id} type="button" className="auth__chip" onClick={() => onLogIn(a.username)}>
                  <WallIcon name={a.avatar} size={18} />
                  {a.username}
                  <small>{a.role}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="auth__note">
          Prototype: accounts are simulated and saved only in this browser.
        </p>
      </div>
    </main>
  )
}

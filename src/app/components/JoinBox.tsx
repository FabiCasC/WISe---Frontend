import { useId, useState, type FormEvent } from 'react'
import { normalizeClassCode } from '../../shared/classroom'
import { navigate } from '../hooks/useHashRoute'

/**
 * "Join your class" box. It only checks the format and goes to
 * #/class/<CODE>, which is what actually adds the student.
 */
export default function JoinBox({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const id = useId()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const code = normalizeClassCode(value)
    if (!code) {
      setError('A class code is one word and two numbers, like MOON-27.')
      return
    }
    setError(null)
    navigate(`#/class/${code}`)
  }

  return (
    <form className="joinbox" onSubmit={submit} noValidate>
      <label className="joinbox__label" htmlFor={id}>
        Join your class
      </label>
      <div className="joinbox__row">
        <input
          id={id}
          className="joinbox__input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Class code, e.g. MOON-27"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={16}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : `${id}-hint`}
        />
        <button type="submit" className="btn btn--primary joinbox__btn">
          Join
        </button>
      </div>
      {error ? (
        <p className="joinbox__error" id={`${id}-err`} role="alert">
          {error}
        </p>
      ) : (
        <p className="joinbox__hint" id={`${id}-hint`}>
          Type the code your teacher gave you. You get a space nickname — no real name needed.
        </p>
      )}
    </form>
  )
}

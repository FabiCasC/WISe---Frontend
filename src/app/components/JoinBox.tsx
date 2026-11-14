import { useId, useState, type FormEvent } from 'react'
import { normalizeClassCode } from '../../shared/classroom'
import { navigate } from '../hooks/useHashRoute'

/**
 * Recuadro "Escribe el código de tu clase". Solo valida el formato y lleva a
 * #/clase/<CÓDIGO>, que es quien realmente une al alumno.
 */
export default function JoinBox({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const id = useId()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const code = normalizeClassCode(value)
    if (!code) {
      setError('El código tiene una palabra y dos números, por ejemplo LUNA-27.')
      return
    }
    setError(null)
    navigate(`#/clase/${code}`)
  }

  return (
    <form className="joinbox" onSubmit={submit} noValidate>
      <label className="joinbox__label" htmlFor={id}>
        ¿Tu profe te dio un código?
      </label>
      <div className="joinbox__row">
        <input
          id={id}
          className="joinbox__input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="LUNA-27"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={16}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : `${id}-hint`}
        />
        <button type="submit" className="btn btn--primary joinbox__btn">
          Entrar a la clase
        </button>
      </div>
      {error ? (
        <p className="joinbox__error" id={`${id}-err`} role="alert">
          {error}
        </p>
      ) : (
        <p className="joinbox__hint" id={`${id}-hint`}>
          No necesitas cuenta ni tu nombre: recibirás un apodo espacial.
        </p>
      )}
    </form>
  )
}

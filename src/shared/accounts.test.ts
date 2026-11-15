import { describe, expect, it } from 'vitest'
import {
  addClassIn,
  addCreationIn,
  currentAccount,
  emptyDb,
  logInIn,
  logOutIn,
  normalizeUsername,
  signUpIn,
} from './accounts'

const NOW = new Date('2026-11-15T12:00:00Z')

describe('usernames', () => {
  it.each([
    ['Rover_42', 'Rover_42'],
    ['  ana  ', 'ana'],
    ['star pilot', 'star_pilot'],
  ])('accepts "%s"', (input, out) => expect(normalizeUsername(input)).toBe(out))

  it.each(['', 'ab', 'a'.repeat(21), 'ana@mail.com', 'ñandú', '<b>x</b>'])('rejects "%s"', (input) =>
    expect(normalizeUsername(input)).toBeNull(),
  )
})

describe('sign up and log in', () => {
  it('creates a student or teacher account and signs it in', () => {
    const r = signUpIn(emptyDb(), { username: 'Ana_7', role: 'student' }, NOW)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.account).toMatchObject({ id: 'ana_7', username: 'Ana_7', role: 'student', avatar: 'rocket', gamesCreated: 0 })
    expect(currentAccount(r.db)?.id).toBe('ana_7')
  })

  it('stores nothing personal: no email, no password, no real name', () => {
    const r = signUpIn(emptyDb(), { username: 'Ana_7', role: 'teacher' }, NOW)
    if (!r.ok) throw new Error()
    expect(Object.keys(r.account).sort()).toEqual(
      ['avatar', 'classCodes', 'createdAt', 'gamesCreated', 'id', 'role', 'username'].sort(),
    )
  })

  it('refuses a taken name, whatever the capitals', () => {
    const a = signUpIn(emptyDb(), { username: 'Ana_7', role: 'student' }, NOW)
    if (!a.ok) throw new Error()
    expect(signUpIn(a.db, { username: 'ANA_7', role: 'teacher' }, NOW)).toEqual({ ok: false, error: 'taken' })
  })

  it('refuses a bad role and a bad name', () => {
    expect(signUpIn(emptyDb(), { username: 'Ana_7', role: 'admin' as never })).toEqual({ ok: false, error: 'invalid-role' })
    expect(signUpIn(emptyDb(), { username: 'a', role: 'student' })).toEqual({ ok: false, error: 'invalid-username' })
  })

  it('logs out and back in', () => {
    const a = signUpIn(emptyDb(), { username: 'Ana_7', role: 'student' }, NOW)
    if (!a.ok) throw new Error()
    const out = logOutIn(a.db)
    expect(currentAccount(out)).toBeNull()
    const back = logInIn(out, 'ana_7')
    expect(back.ok && back.account.username).toBe('Ana_7')
    expect(logInIn(out, 'nobody')).toEqual({ ok: false, error: 'not-found' })
  })

  it('keeps classes and creations on the account', () => {
    const a = signUpIn(emptyDb(), { username: 'Prof_Luz', role: 'teacher' }, NOW)
    if (!a.ok) throw new Error()
    let db = addClassIn(a.db, 'prof_luz', 'MOON-27')
    db = addClassIn(db, 'prof_luz', 'MOON-27')
    db = addCreationIn(db, 'prof_luz')
    expect(db.accounts.prof_luz.classCodes).toEqual(['MOON-27'])
    expect(db.accounts.prof_luz.gamesCreated).toBe(1)
    expect(addCreationIn(db, 'ghost')).toBe(db)
  })
})

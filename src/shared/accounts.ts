/**
 * CUENTAS (simuladas para el MVP)
 * -------------------------------------------------------------------------
 * Alumnos y profesores crean un usuario. Mientras no exista el backend todo
 * vive en el localStorage de este navegador, igual que el modo clase, y la
 * interfaz `AccountService` es lo que cambiará por un cliente de API.
 *
 * Privacidad: solo hay un usuario (un apodo) y un rol. No se pide nombre
 * real, correo, edad ni contraseña: esto es una simulación, y guardar una
 * contraseña en el navegador no sería seguro aunque sea un prototipo.
 */

export type Role = 'student' | 'teacher'

/** Iconos de avatar disponibles (los mismos de las fichas de juego). */
export const AVATARS = ['rocket', 'rover', 'moon', 'scope', 'astro', 'sat', 'wave', 'comet'] as const
export type Avatar = (typeof AVATARS)[number]

export interface Account {
  /** Usuario en minúsculas: es también el id. */
  id: string
  /** Usuario tal como lo escribió la persona. */
  username: string
  role: Role
  avatar: Avatar
  createdAt: string
  /** Juegos creados en el Studio (medallas de creador). */
  gamesCreated: number
  /** Clases creadas (solo profesores). */
  classCodes: string[]
}

export interface AccountDb {
  accounts: Record<string, Account>
  /** Id de la cuenta con sesión iniciada. */
  current: string | null
}

export type AuthError = 'invalid-username' | 'taken' | 'invalid-role' | 'not-found'

export type AuthResult = { ok: true; db: AccountDb; account: Account } | { ok: false; error: AuthError }

export const emptyDb = (): AccountDb => ({ accounts: {}, current: null })

/** 3 a 20 caracteres: letras, números, guion y guion bajo. */
export function normalizeUsername(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, '_')
  return /^[A-Za-z0-9_-]{3,20}$/.test(name) ? name : null
}

export const idOf = (username: string) => username.toLowerCase()

export function signUpIn(
  db: AccountDb,
  input: { username: string; role: Role; avatar?: Avatar },
  now: Date = new Date(),
): AuthResult {
  if (input.role !== 'student' && input.role !== 'teacher') return { ok: false, error: 'invalid-role' }
  const username = normalizeUsername(input.username)
  if (!username) return { ok: false, error: 'invalid-username' }
  const id = idOf(username)
  if (db.accounts[id]) return { ok: false, error: 'taken' }
  const account: Account = {
    id,
    username,
    role: input.role,
    avatar: input.avatar && AVATARS.includes(input.avatar) ? input.avatar : 'rocket',
    createdAt: now.toISOString(),
    gamesCreated: 0,
    classCodes: [],
  }
  return { ok: true, account, db: { accounts: { ...db.accounts, [id]: account }, current: id } }
}

export function logInIn(db: AccountDb, username: string): AuthResult {
  const name = normalizeUsername(username)
  if (!name) return { ok: false, error: 'invalid-username' }
  const account = db.accounts[idOf(name)]
  if (!account) return { ok: false, error: 'not-found' }
  return { ok: true, account, db: { ...db, current: account.id } }
}

export const logOutIn = (db: AccountDb): AccountDb => ({ ...db, current: null })

export function currentAccount(db: AccountDb): Account | null {
  return db.current ? (db.accounts[db.current] ?? null) : null
}

/** Apunta una clase nueva en la cuenta de la persona (profesores). */
export function addClassIn(db: AccountDb, id: string, code: string): AccountDb {
  const a = db.accounts[id]
  if (!a || a.classCodes.includes(code)) return db
  return { ...db, accounts: { ...db.accounts, [id]: { ...a, classCodes: [...a.classCodes, code] } } }
}

/** Suma un juego creado (lo llamará el Studio al publicar). */
export function addCreationIn(db: AccountDb, id: string): AccountDb {
  const a = db.accounts[id]
  if (!a) return db
  return { ...db, accounts: { ...db.accounts, [id]: { ...a, gamesCreated: a.gamesCreated + 1 } } }
}

// ---------------------------------------------------------------------------
// Almacenamiento
// ---------------------------------------------------------------------------

const KEY = 'orbita-arcade:accounts'

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Lectura defensiva: datos corruptos o almacenamiento bloqueado dan una base vacía. */
export function loadAccountDb(): AccountDb {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!isObject(raw) || !isObject(raw.accounts)) return emptyDb()
    const accounts: Record<string, Account> = {}
    for (const [id, a] of Object.entries(raw.accounts)) {
      if (!isObject(a) || typeof a.username !== 'string') continue
      if (a.role !== 'student' && a.role !== 'teacher') continue
      accounts[id] = {
        id,
        username: a.username,
        role: a.role,
        avatar: AVATARS.includes(a.avatar as Avatar) ? (a.avatar as Avatar) : 'rocket',
        createdAt: typeof a.createdAt === 'string' ? a.createdAt : '',
        gamesCreated: typeof a.gamesCreated === 'number' ? a.gamesCreated : 0,
        classCodes: Array.isArray(a.classCodes) ? a.classCodes.filter((c): c is string => typeof c === 'string') : [],
      }
    }
    const current = typeof raw.current === 'string' && accounts[raw.current] ? raw.current : null
    return { accounts, current }
  } catch {
    return emptyDb()
  }
}

export function saveAccountDb(db: AccountDb): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
    return true
  } catch {
    return false
  }
}

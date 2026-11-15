/**
 * MODO CLASE — lógica pura + respaldo local
 * -------------------------------------------------------------------------
 * Flujo: el profesor crea una clase y recibe un CÓDIGO (LUNA-27) para los
 * alumnos y un ENLACE PRIVADO (#/panel/<token>) para ver resultados. El
 * alumno escribe el código y recibe un apodo aleatorio (Rover-42).
 *
 * Privacidad: solo se guarda un identificador anónimo, el apodo, el código de
 * clase y resultados de juego. Nunca nombres, correos ni edad.
 *
 * Mientras no exista el backend (Flask, otro repo) todo vive en el
 * localStorage de este navegador: sirve para una demo en un solo equipo.
 * El cliente de API implementará la misma interfaz `ClassService`.
 */
import { gamesPlayed, isLearned, learnedConcepts, totalLevelsCompleted, totalScore } from './progress'
import type { ConceptStat, GameResult, Progress } from './types'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface StudentStats {
  totalScore: number
  /** Juegos con al menos un nivel completado. */
  gamesPlayed: number
  levelsCompleted: number
  /** Conceptos aprendidos (más aciertos que errores). */
  conceptsLearned: number
  /** Partidas ganadas sin ninguna mala decisión. */
  firstTryCorrect: number
  /** Partidas terminadas (ganadas o perdidas). */
  attempts: number
  /** Niveles completados por juego: { 'opportunity': [1, 2] }. */
  games: Record<string, number[]>
  /** Aciertos y errores por concepto. */
  concepts: Record<string, ConceptStat>
}

export interface StudentEntry {
  playerId: string
  nickname: string
  joinedAt: string
  stats: StudentStats
}

export interface ClassRoom {
  code: string
  name: string
  grade: string
  teacherToken: string
  createdAt: string
  students: Record<string, StudentEntry>
}

/** Lo que el alumno guarda de la clase a la que pertenece. */
export interface Membership {
  code: string
  className: string
  playerId: string
  nickname: string
}

export interface DashboardRow extends StudentStats {
  nickname: string
}

/** Un concepto visto por la clase: cuántos alumnos lo encontraron y cuántos lo aprendieron. */
export interface ClassConcept {
  id: string
  seenBy: number
  learnedBy: number
  /** 0..100 */
  percent: number
}

export interface Dashboard {
  code: string
  name: string
  grade: string
  rows: DashboardRow[]
  average: { conceptsLearned: number; totalScore: number } | null
  /** Conceptos de la clase, del más difícil al más fácil. */
  concepts: ClassConcept[]
}

export type JoinError = 'codigo-invalido' | 'clase-no-existe'

export interface ClassService {
  createClass(input: { name: string; grade: string }): Promise<{ code: string; teacherToken: string }>
  joinClass(code: string, playerId: string): Promise<{ ok: true; membership: Membership } | { ok: false; error: JoinError }>
  reportResult(membership: Membership, progress: Progress, result: GameResult): Promise<void>
  getDashboard(teacherToken: string): Promise<Dashboard | null>
}

// ---------------------------------------------------------------------------
// Generadores (reciben el azar inyectado para poder probarlos)
// ---------------------------------------------------------------------------

export type Rand = () => number

/** Palabras sin letras ambiguas, fáciles de dictar en voz alta en clase. */
const CODE_WORDS = ['MOON', 'MARS', 'ROVER', 'COMET', 'ORBIT', 'NOVA', 'SOLAR', 'CRATER', 'PROBE', 'ASTRO']
const NICK_WORDS = ['Rover', 'Probe', 'Comet', 'Satellite', 'Orbit', 'Nebula', 'Lander', 'Astro', 'Pulsar', 'Quasar']

const pick = <T,>(list: T[], rand: Rand): T => list[Math.floor(rand() * list.length) % list.length]
const twoDigits = (rand: Rand) => String(10 + Math.floor(rand() * 90))

export function generateClassCode(rand: Rand = Math.random): string {
  return `${pick(CODE_WORDS, rand)}-${twoDigits(rand)}`
}

export function generateNickname(rand: Rand = Math.random): string {
  return `${pick(NICK_WORDS, rand)}-${twoDigits(rand)}`
}

export function generateToken(rand: Rand = Math.random, length = 24): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(rand() * alphabet.length) % alphabet.length]
  return out
}

/** Identificador anónimo del jugador en este navegador. */
export function generatePlayerId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `p-${generateToken(Math.random, 20)}`
  }
}

/**
 * Normaliza lo que escribe un niño: "luna27", "Luna 27", " luna-27 " → "LUNA-27".
 * Devuelve null si no parece un código.
 */
export function normalizeClassCode(input: string): string | null {
  const clean = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  const m = clean.match(/^([A-Z]{3,10})(\d{2})$/)
  return m ? `${m[1]}-${m[2]}` : null
}

// ---------------------------------------------------------------------------
// Estadísticas del alumno a partir de su progreso
// ---------------------------------------------------------------------------

export function emptyStats(): StudentStats {
  return {
    totalScore: 0,
    gamesPlayed: 0,
    levelsCompleted: 0,
    conceptsLearned: 0,
    firstTryCorrect: 0,
    attempts: 0,
    games: {},
    concepts: {},
  }
}

/**
 * Recalcula las estadísticas tras una partida. Nivel, puntaje y juegos salen
 * del progreso (mejores puntajes, sin contar intentos); los contadores de
 * partidas se acumulan con cada resultado.
 */
export function statsAfterResult(prev: StudentStats, progress: Progress, result: GameResult): StudentStats {
  return {
    totalScore: totalScore(progress),
    gamesPlayed: gamesPlayed(progress),
    levelsCompleted: totalLevelsCompleted(progress),
    conceptsLearned: learnedConcepts(progress).length,
    games: Object.fromEntries(
      Object.entries(progress.games)
        .filter(([, g]) => g.levelsCompleted.length > 0)
        .map(([id, g]) => [id, [...g.levelsCompleted]]),
    ),
    concepts: { ...progress.concepts },
    attempts: prev.attempts + 1,
    firstTryCorrect: prev.firstTryCorrect + (result.completed && result.firstAnswerCorrect ? 1 : 0),
  }
}

export function buildDashboard(room: ClassRoom): Dashboard {
  // Old entries (v1) lack the new fields: fill them so the panel never breaks.
  const rows: DashboardRow[] = Object.values(room.students)
    .map((s) => ({ nickname: s.nickname, ...emptyStats(), ...s.stats }))
    .sort(
      (a, b) =>
        b.conceptsLearned - a.conceptsLearned || b.totalScore - a.totalScore || a.nickname.localeCompare(b.nickname),
    )

  const average = rows.length
    ? {
        conceptsLearned: Math.round((rows.reduce((s, r) => s + r.conceptsLearned, 0) / rows.length) * 10) / 10,
        totalScore: Math.round(rows.reduce((s, r) => s + r.totalScore, 0) / rows.length),
      }
    : null

  const seen = new Map<string, { seenBy: number; learnedBy: number }>()
  for (const r of rows) {
    for (const [id, stat] of Object.entries(r.concepts)) {
      const c = seen.get(id) ?? { seenBy: 0, learnedBy: 0 }
      c.seenBy += 1
      if (isLearned(stat)) c.learnedBy += 1
      seen.set(id, c)
    }
  }
  const concepts: ClassConcept[] = [...seen.entries()]
    .map(([id, c]) => ({ id, ...c, percent: Math.round((c.learnedBy / c.seenBy) * 100) }))
    .sort((a, b) => a.percent - b.percent || b.seenBy - a.seenBy)

  return { code: room.code, name: room.name, grade: room.grade, rows, average, concepts }
}

// ---------------------------------------------------------------------------
// Base de datos local (respaldo hasta que exista el backend)
// ---------------------------------------------------------------------------

export interface ClassDb {
  classes: Record<string, ClassRoom>
}

export function createClassIn(
  db: ClassDb,
  input: { name: string; grade: string },
  rand: Rand = Math.random,
  now = new Date().toISOString(),
): { db: ClassDb; room: ClassRoom } {
  let code = generateClassCode(rand)
  for (let i = 0; db.classes[code] && i < 50; i++) code = generateClassCode(rand)
  const room: ClassRoom = {
    code,
    name: input.name.trim().slice(0, 60),
    grade: input.grade.trim().slice(0, 30),
    teacherToken: generateToken(rand),
    createdAt: now,
    students: {},
  }
  return { db: { classes: { ...db.classes, [code]: room } }, room }
}

export function joinClassIn(
  db: ClassDb,
  rawCode: string,
  playerId: string,
  rand: Rand = Math.random,
  now = new Date().toISOString(),
): { ok: true; db: ClassDb; membership: Membership } | { ok: false; error: JoinError } {
  const code = normalizeClassCode(rawCode)
  if (!code) return { ok: false, error: 'codigo-invalido' }
  const room = db.classes[code]
  if (!room) return { ok: false, error: 'clase-no-existe' }

  // Volver a entrar conserva el apodo de antes.
  const existing = room.students[playerId]
  if (existing) {
    return { ok: true, db, membership: { code, className: room.name, playerId, nickname: existing.nickname } }
  }

  const taken = new Set(Object.values(room.students).map((s) => s.nickname))
  let nickname = generateNickname(rand)
  for (let i = 0; taken.has(nickname) && i < 50; i++) nickname = generateNickname(rand)

  const student: StudentEntry = { playerId, nickname, joinedAt: now, stats: emptyStats() }
  const next: ClassDb = {
    classes: { ...db.classes, [code]: { ...room, students: { ...room.students, [playerId]: student } } },
  }
  return { ok: true, db: next, membership: { code, className: room.name, playerId, nickname } }
}

export function reportResultIn(db: ClassDb, membership: Membership, progress: Progress, result: GameResult): ClassDb {
  const room = db.classes[membership.code]
  const student = room?.students[membership.playerId]
  if (!room || !student) return db
  const updated: StudentEntry = { ...student, stats: statsAfterResult(student.stats, progress, result) }
  return {
    classes: { ...db.classes, [room.code]: { ...room, students: { ...room.students, [student.playerId]: updated } } },
  }
}

export function findByToken(db: ClassDb, token: string): ClassRoom | undefined {
  return Object.values(db.classes).find((c) => c.teacherToken === token)
}

// ---------------------------------------------------------------------------
// Persistencia
// ---------------------------------------------------------------------------

const DB_KEY = 'orbita-arcade:classes'
const MEMBERSHIP_KEY = 'orbita-arcade:membership'
const PLAYER_KEY = 'orbita-arcade:player'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* almacenamiento bloqueado: se sigue en memoria */
  }
}

export function loadClassDb(): ClassDb {
  const db = read<ClassDb>(DB_KEY, { classes: {} })
  return db && typeof db.classes === 'object' ? db : { classes: {} }
}

export function loadMembership(): Membership | null {
  const m = read<Membership | null>(MEMBERSHIP_KEY, null)
  return m && typeof m.code === 'string' && typeof m.nickname === 'string' ? m : null
}

export function saveMembership(m: Membership | null): void {
  write(MEMBERSHIP_KEY, m)
}

/** Id anónimo estable de este navegador. */
export function getPlayerId(): string {
  const existing = read<string | null>(PLAYER_KEY, null)
  if (existing) return existing
  const id = generatePlayerId()
  write(PLAYER_KEY, id)
  return id
}

/** Implementación local de ClassService. */
export const localClassService: ClassService = {
  async createClass(input) {
    const { db, room } = createClassIn(loadClassDb(), input)
    write(DB_KEY, db)
    return { code: room.code, teacherToken: room.teacherToken }
  },
  async joinClass(code, playerId) {
    const res = joinClassIn(loadClassDb(), code, playerId)
    if (!res.ok) return res
    write(DB_KEY, res.db)
    return { ok: true, membership: res.membership }
  },
  async reportResult(membership, progress, result) {
    write(DB_KEY, reportResultIn(loadClassDb(), membership, progress, result))
  },
  async getDashboard(token) {
    const room = findByToken(loadClassDb(), token)
    return room ? buildDashboard(room) : null
  },
}

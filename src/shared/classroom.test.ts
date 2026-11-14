import { describe, expect, it } from 'vitest'
import {
  buildDashboard,
  createClassIn,
  findByToken,
  generateClassCode,
  generateNickname,
  joinClassIn,
  normalizeClassCode,
  reportResultIn,
  type ClassDb,
  type Rand,
} from './classroom'
import { applyResult, createEmptyProgress } from './progress'
import type { GameResult } from './types'

/** Azar determinista para que las pruebas sean reproducibles. */
function seq(...values: number[]): Rand {
  let i = 0
  return () => values[i++ % values.length]
}

const empty = (): ClassDb => ({ classes: {} })

function win(patch: Partial<GameResult> = {}): GameResult {
  return {
    gameId: 'spirit',
    levelId: 1,
    score: 200,
    durationMs: 50_000,
    completed: true,
    evidenceIds: [],
    firstAnswerCorrect: true,
    ...patch,
  }
}

describe('códigos y apodos', () => {
  it('genera un código PALABRA-NN', () => {
    expect(generateClassCode(seq(0, 0.5))).toBe('MOON-55')
    expect(generateClassCode()).toMatch(/^[A-Z]+-\d{2}$/)
  })

  it('genera un apodo Palabra-NN', () => {
    expect(generateNickname(seq(0, 0.35))).toBe('Rover-41')
  })

  it.each([
    ['moon27', 'MOON-27'],
    [' Moon 27 ', 'MOON-27'],
    ['moon-27', 'MOON-27'],
    ['Órbita-11', 'ORBITA-11'],
  ])('normaliza "%s" → %s', (input, out) => {
    expect(normalizeClassCode(input)).toBe(out)
  })

  it.each(['', 'moon', '27', 'MOON-2', 'MO-27'])('rechaza "%s"', (input) => {
    expect(normalizeClassCode(input)).toBeNull()
  })
})

describe('crear y unirse a una clase', () => {
  it('crea la clase con código y token privado', () => {
    const { db, room } = createClassIn(empty(), { name: ' 5th B ', grade: '5th grade' })
    expect(room.name).toBe('5th B')
    expect(room.teacherToken).toHaveLength(24)
    expect(db.classes[room.code]).toBe(room)
    expect(findByToken(db, room.teacherToken)?.code).toBe(room.code)
  })

  it('no repite un código que ya existe', () => {
    const first = createClassIn(empty(), { name: 'A', grade: '' }, seq(0, 0.5))
    const second = createClassIn(first.db, { name: 'B', grade: '' }, seq(0, 0.5, 0.1, 0.1))
    expect(second.room.code).not.toBe(first.room.code)
  })

  it('el alumno entra con un apodo y sin datos personales', () => {
    const { db, room } = createClassIn(empty(), { name: 'Science', grade: '6th' })
    const res = joinClassIn(db, room.code.toLowerCase(), 'player-1')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.membership.nickname).toMatch(/^[A-Za-zÁÉÍÓÚáéíóú]+-\d{2}$/)
    const student = res.db.classes[room.code].students['player-1']
    expect(Object.keys(student).sort()).toEqual(['joinedAt', 'nickname', 'playerId', 'stats'])
  })

  it('volver a entrar conserva el apodo', () => {
    const { db, room } = createClassIn(empty(), { name: 'C', grade: '' })
    const a = joinClassIn(db, room.code, 'p1')
    if (!a.ok) throw new Error()
    const b = joinClassIn(a.db, room.code, 'p1')
    if (!b.ok) throw new Error()
    expect(b.membership.nickname).toBe(a.membership.nickname)
  })

  it('distingue código mal escrito de clase inexistente', () => {
    expect(joinClassIn(empty(), 'hola', 'p')).toEqual({ ok: false, error: 'codigo-invalido' })
    expect(joinClassIn(empty(), 'MOON-99', 'p')).toEqual({ ok: false, error: 'clase-no-existe' })
  })
})

describe('panel del profesor', () => {
  it('refleja nivel, puntaje y aciertos a la primera de cada alumno', () => {
    const created = createClassIn(empty(), { name: 'C', grade: '' })
    let db = created.db
    const join = (id: string) => {
      const r = joinClassIn(db, created.room.code, id)
      if (!r.ok) throw new Error()
      db = r.db
      return r.membership
    }
    const ana = join('p1')
    const beto = join('p2')

    let p1 = createEmptyProgress()
    for (const r of [win(), win({ levelId: 2, firstAnswerCorrect: false })]) {
      p1 = applyResult(p1, r)
      db = reportResultIn(db, ana, p1, r)
    }
    const lost = win({ completed: false, score: 0 })
    db = reportResultIn(db, beto, applyResult(createEmptyProgress(), lost), lost)

    const dash = buildDashboard(db.classes[created.room.code])
    expect(dash.rows[0]).toMatchObject({
      nickname: ana.nickname,
      generalLevel: 3,
      totalScore: 400,
      levelsCompleted: 2,
      attempts: 2,
      firstTryCorrect: 1,
    })
    expect(dash.rows[1]).toMatchObject({ nickname: beto.nickname, generalLevel: 1, attempts: 1, firstTryCorrect: 0 })
    expect(dash.average).toEqual({ generalLevel: 2, totalScore: 200 })
  })

  it('una clase sin alumnos no tiene promedio', () => {
    const { room } = createClassIn(empty(), { name: 'C', grade: '' })
    expect(buildDashboard(room).average).toBeNull()
  })
})

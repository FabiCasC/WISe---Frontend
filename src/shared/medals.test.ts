import { describe, expect, it } from 'vitest'
import { applyResult, createEmptyProgress } from './progress'
import { computeMedals, earnedMedals, gamesFinished, medalStatsFromProgress, type MedalStats } from './medals'
import type { GameResult } from './types'

const none: MedalStats = { totalScore: 0, gamesPlayed: 0, conceptsLearned: 0, gamesFinished: 0, gamesCreated: 0, classesCreated: 0 }
const ids = (s: MedalStats, role: 'student' | 'teacher' = 'student') => earnedMedals(computeMedals(s, role)).map((m) => m.id)

const win = (gameId: string, levelId: number, score = 100, concept?: string): GameResult => ({
  gameId,
  levelId,
  score,
  durationMs: 1000,
  completed: true,
  evidenceIds: [],
  firstAnswerCorrect: true,
  decisions: concept ? [{ concept, correct: true }] : [],
})

describe('medals', () => {
  it('a new account has none', () => expect(ids(none)).toEqual([]))

  it('play, learning and score medals follow the stats', () => {
    expect(ids({ ...none, gamesPlayed: 5, conceptsLearned: 5, totalScore: 600 })).toEqual([
      'first-launch',
      'explorer',
      'first-spark',
      'flight-engineer',
      'rising-star',
    ])
  })

  it('creator medals come from games created', () => {
    expect(ids({ ...none, gamesCreated: 3 })).toEqual(['first-build', 'game-maker'])
  })

  it('teaching medals exist only for teachers', () => {
    const stats = { ...none, classesCreated: 1 }
    expect(ids(stats, 'teacher')).toEqual(['class-founder'])
    expect(ids(stats, 'student')).toEqual([])
    expect(computeMedals(stats, 'student').some((m) => m.category === 'teacher')).toBe(false)
  })

  it('shows progress toward a medal that is not earned yet', () => {
    const m = computeMedals({ ...none, conceptsLearned: 3 }, 'student').find((x) => x.id === 'flight-engineer')!
    expect(m).toMatchObject({ earned: false, value: 3, goal: 5 })
  })

  it('"Full Mission" needs every level of a live game', () => {
    expect(gamesFinished({ 'dust-run': [1, 2] })).toBe(0)
    expect(gamesFinished({ 'dust-run': [1, 2, 3] })).toBe(1)
    expect(gamesFinished({ 'not-a-game': [1, 2, 3] })).toBe(0)
  })

  it('is computed from real progress', () => {
    let p = createEmptyProgress()
    for (const l of [1, 2, 3]) p = applyResult(p, win('dust-run', l, 200, 'sin-luz-sin-energia'))
    const s = medalStatsFromProgress(p, { gamesCreated: 0, classesCreated: 0 })
    expect(s).toMatchObject({ totalScore: 600, gamesPlayed: 1, conceptsLearned: 1, gamesFinished: 1 })
    expect(ids(s)).toEqual(['first-launch', 'full-mission', 'first-spark', 'rising-star'])
  })
})

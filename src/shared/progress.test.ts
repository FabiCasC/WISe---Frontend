import { describe, expect, it } from 'vitest'
import {
  applyResult,
  createEmptyProgress,
  gamesPlayed,
  getRank,
  isLevelUnlocked,
  learnedConcepts,
  migrateProgress,
  nextPlayableLevel,
  nextRank,
  totalLevelsCompleted,
  totalScore,
} from './progress'
import type { GameResult, Progress } from './types'

function result(patch: Partial<GameResult> = {}): GameResult {
  return {
    gameId: 'spirit',
    levelId: 1,
    score: 100,
    durationMs: 60_000,
    completed: true,
    evidenceIds: ['ev-silica'],
    firstAnswerCorrect: true,
    ...patch,
  }
}

const play = (...results: GameResult[]): Progress => results.reduce(applyResult, createEmptyProgress())

describe('applyResult', () => {
  it('records the level, the score and the evidence when a level is won', () => {
    const next = play(result())
    expect(next.memories).toEqual(['spirit'])
    expect(next.games.spirit.levelsCompleted).toEqual([1])
    expect(next.games.spirit.bestScore[1]).toBe(100)
    expect(next.evidence).toContain('ev-silica')
  })

  it('records nothing when the game is lost', () => {
    const next = play(result({ completed: false }))
    expect(next.memories).toEqual([])
    expect(next.games.spirit.levelsCompleted).toEqual([])
  })

  it('keeps the best score, not the last one, and a single stamp', () => {
    const p = play(result({ score: 420 }), result({ score: 180 }), result({ score: 300 }))
    expect(p.games.spirit.bestScore[1]).toBe(420)
    expect(p.games.spirit.levelsCompleted).toEqual([1])
    expect(p.memories).toEqual(['spirit'])
  })

  it('works with any game id and any number of levels', () => {
    const p = play(result({ gameId: 'hubble-focus', levelId: 7, score: 50 }))
    expect(p.games['hubble-focus'].levelsCompleted).toEqual([7])
    expect(totalScore(p)).toBe(50)
  })

  it('adds up the best score of every level of every game', () => {
    const p = play(
      result({ levelId: 1, score: 300 }),
      result({ levelId: 2, score: 250 }),
      result({ gameId: 'opportunity', levelId: 1, score: 150, evidenceIds: [] }),
    )
    expect(totalScore(p)).toBe(700)
    expect(totalLevelsCompleted(p)).toBe(3)
    expect(gamesPlayed(p)).toBe(2)
  })

  it('ignores a result without a game id', () => {
    const base = createEmptyProgress()
    expect(applyResult(base, result({ gameId: '' }))).toBe(base)
  })
})

describe('concepts', () => {
  it('counts right and wrong decisions per concept, even in a lost game', () => {
    const p = play(
      result({ decisions: [{ concept: 'arena-gasta-energia', correct: false }], completed: false }),
      result({ decisions: [{ concept: 'arena-gasta-energia', correct: true }, { concept: 'silice-agua-caliente', correct: true }] }),
    )
    expect(p.concepts['arena-gasta-energia']).toEqual({ correct: 1, wrong: 1 })
    expect(learnedConcepts(p).sort()).toEqual(['arena-gasta-energia', 'silice-agua-caliente'])
  })

  it('a concept with more mistakes than successes is not learned yet', () => {
    const p = play(
      result({ decisions: [{ concept: 'agua-no-es-vida', correct: false }, { concept: 'agua-no-es-vida', correct: false }] }),
      result({ decisions: [{ concept: 'agua-no-es-vida', correct: true }] }),
    )
    expect(learnedConcepts(p)).toEqual([])
  })

  it('games without decisions still work (field is optional)', () => {
    expect(play(result()).concepts).toEqual({})
  })
})

describe('rank', () => {
  const learn = (n: number) =>
    play(result({ decisions: Array.from({ length: n }, (_, i) => ({ concept: `c${i}`, correct: true })) }))

  it('starts as Cadet and grows with concepts learned', () => {
    expect(getRank(createEmptyProgress()).name).toBe('Cadet')
    expect(getRank(learn(3)).name).toBe('Pilot')
    expect(getRank(learn(8)).name).toBe('Specialist')
    expect(nextRank(learn(8))?.name).toBe('Commander')
    expect(nextRank(learn(30))).toBeNull()
  })
})

describe('levels inside a game', () => {
  it('only level 1 is open at first; games never lock each other', () => {
    const p = createEmptyProgress()
    expect(isLevelUnlocked(p, 'spirit', 1)).toBe(true)
    expect(isLevelUnlocked(p, 'spirit', 2)).toBe(false)
    expect(isLevelUnlocked(p, 'any-new-game', 1)).toBe(true)
  })

  it('completing a level opens the next one of that game only', () => {
    const p = play(result())
    expect(isLevelUnlocked(p, 'spirit', 2)).toBe(true)
    expect(isLevelUnlocked(p, 'opportunity', 2)).toBe(false)
    expect(nextPlayableLevel(p, 'spirit', 3)).toBe(2)
  })

  it('suggests level 1 again when every level is done, for any level count', () => {
    const p = play(...[1, 2, 3, 4, 5, 6, 7].map((levelId) => result({ gameId: 'hubble-focus', levelId })))
    expect(nextPlayableLevel(p, 'hubble-focus', 7)).toBe(1)
  })
})

describe('migrateProgress', () => {
  it('migrates v1 progress keeping levels, scores and settings', () => {
    const v1 = {
      schemaVersion: 1,
      games: {
        opportunity: { levelsCompleted: [1, 2, 2], bestScore: { 1: 300, 2: 120 } },
        'lunar-signals': { levelsCompleted: [], bestScore: {} },
        spirit: { levelsCompleted: [], bestScore: {} },
      },
      memories: ['opportunity'],
      evidence: ['ev-blueberries'],
      settings: { volume: 0.2, reducedMotion: true, practice: false, lang: 'es' },
    }
    const p = migrateProgress(v1)
    expect(p.schemaVersion).toBe(2)
    expect(p.games.opportunity).toEqual({ levelsCompleted: [1, 2], bestScore: { 1: 300, 2: 120 } })
    expect(p.games['lunar-signals']).toBeUndefined()
    expect(p.concepts).toEqual({})
    expect(p.settings.volume).toBe(0.2)
    expect(p.settings.reducedMotion).toBe(true)
    expect(totalScore(p)).toBe(420)
  })

  it('falls back to empty progress on garbage or unknown versions', () => {
    expect(migrateProgress('nope').games).toEqual({})
    expect(migrateProgress({ schemaVersion: 99, games: { x: {} } }).games).toEqual({})
    expect(migrateProgress(null).concepts).toEqual({})
  })

  it('keeps v2 concepts and drops malformed ones', () => {
    const p = migrateProgress({
      schemaVersion: 2,
      games: {},
      concepts: { ok: { correct: 2, wrong: 0 }, bad: { correct: 'x' } },
    })
    expect(p.concepts).toEqual({ ok: { correct: 2, wrong: 0 } })
  })
})

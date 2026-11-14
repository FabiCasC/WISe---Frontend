import { describe, expect, it } from 'vitest'
import { applyResult, createEmptyProgress, totalScore } from './progress'
import type { GameResult } from './types'

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

describe('applyResult', () => {
  it('sella el recuerdo y registra el nivel al completar', () => {
    const next = applyResult(createEmptyProgress(), result())

    expect(next.memories).toEqual(['spirit'])
    expect(next.games.spirit.levelsCompleted).toEqual([1])
    expect(next.games.spirit.bestScore[1]).toBe(100)
    expect(next.evidence).toContain('ev-silica')
  })

  it('no sella nada si la partida se perdió', () => {
    const next = applyResult(createEmptyProgress(), result({ completed: false }))

    expect(next.memories).toEqual([])
    expect(next.games.spirit.levelsCompleted).toEqual([])
  })

  it('conserva la mejor puntuación, no la última', () => {
    let progress = applyResult(createEmptyProgress(), result({ score: 420 }))
    progress = applyResult(progress, result({ score: 180 }))

    expect(progress.games.spirit.bestScore[1]).toBe(420)
  })

  it('no duplica el recuerdo al repetir el mismo juego', () => {
    let progress = applyResult(createEmptyProgress(), result({ levelId: 1 }))
    progress = applyResult(progress, result({ levelId: 2 }))

    expect(progress.memories).toEqual(['spirit'])
    expect(progress.games.spirit.levelsCompleted).toEqual([1, 2])
  })

  it('suma la mejor puntuación de cada nivel de cada juego', () => {
    let progress = applyResult(createEmptyProgress(), result({ levelId: 1, score: 300 }))
    progress = applyResult(progress, result({ levelId: 2, score: 250 }))
    progress = applyResult(
      progress,
      result({ gameId: 'opportunity', levelId: 1, score: 150, evidenceIds: [] }),
    )

    expect(totalScore(progress)).toBe(700)
  })

  it('ignora un resultado de un juego desconocido sin romperse', () => {
    const base = createEmptyProgress()
    // @ts-expect-error se simula un módulo que envía un gameId inválido
    const next = applyResult(base, result({ gameId: 'inexistente' }))

    expect(next).toBe(base)
  })
})

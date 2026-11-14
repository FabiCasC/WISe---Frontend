import { describe, expect, it } from 'vitest'
import {
  applyResult,
  createEmptyProgress,
  getGeneralLevel,
  isLevelUnlocked,
  nextPlayableLevel,
  nextGeneralLevel,
  totalLevelsCompleted,
  totalScore,
} from './progress'
import type { GameId, GameResult, LevelId, Progress } from './types'

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

// ---------------------------------------------------------------------------
// Nivel general
// ---------------------------------------------------------------------------

function win(gameId: GameId, levelId: LevelId, score = 100): GameResult {
  return {
    gameId,
    levelId,
    score,
    durationMs: 60_000,
    completed: true,
    evidenceIds: [],
    firstAnswerCorrect: true,
  }
}

function play(...results: GameResult[]): Progress {
  return results.reduce(applyResult, createEmptyProgress())
}

const fullGame = (id: GameId) => [win(id, 1), win(id, 2), win(id, 3)]

describe('getGeneralLevel', () => {
  it('N1: al entrar sin haber jugado', () => {
    expect(getGeneralLevel(createEmptyProgress())).toBe(1)
  })

  it('N2: un nivel completado en cualquier juego', () => {
    expect(getGeneralLevel(play(win('lunar-signals', 2)))).toBe(2)
  })

  it('N3: dos niveles completados en total, aunque sean de juegos distintos', () => {
    expect(getGeneralLevel(play(win('spirit', 1), win('opportunity', 1)))).toBe(3)
  })

  it('se queda en N3 con varios niveles sueltos sin cerrar un juego', () => {
    const p = play(win('spirit', 1), win('spirit', 2), win('opportunity', 1), win('lunar-signals', 3))
    expect(totalLevelsCompleted(p)).toBe(4)
    expect(getGeneralLevel(p)).toBe(3)
  })

  it('N4: un juego completo', () => {
    expect(getGeneralLevel(play(...fullGame('spirit')))).toBe(4)
  })

  it('N5: dos juegos completos', () => {
    expect(getGeneralLevel(play(...fullGame('spirit'), ...fullGame('opportunity')))).toBe(5)
  })

  it('N6: los tres juegos completos, y no hay nivel siguiente', () => {
    const p = play(...fullGame('spirit'), ...fullGame('opportunity'), ...fullGame('lunar-signals'))
    expect(getGeneralLevel(p)).toBe(6)
    expect(nextGeneralLevel(p)).toBeNull()
  })

  it('perder una partida no sube el nivel', () => {
    const p = play({ ...win('spirit', 1), completed: false })
    expect(getGeneralLevel(p)).toBe(1)
  })

  it('repetir el mismo nivel no sube el nivel general', () => {
    const p = play(win('spirit', 1), win('spirit', 1), win('spirit', 1))
    expect(getGeneralLevel(p)).toBe(2)
  })

  it('tolera niveles duplicados guardados por versiones antiguas', () => {
    const p = createEmptyProgress()
    p.games.spirit.levelsCompleted = [1, 1, 1]
    expect(getGeneralLevel(p)).toBe(2)
  })

  it('indica el requisito del siguiente nivel', () => {
    expect(nextGeneralLevel(createEmptyProgress())?.level).toBe(2)
    expect(nextGeneralLevel(play(...fullGame('spirit')))?.unlocks).toMatch(/Reto especial/)
  })
})

describe('repetir un nivel', () => {
  it('actualiza el mejor puntaje y mantiene un solo sello', () => {
    const p = play(win('opportunity', 1, 120), win('opportunity', 1, 340), win('opportunity', 1, 90))
    expect(p.games.opportunity.bestScore[1]).toBe(340)
    expect(p.games.opportunity.levelsCompleted).toEqual([1])
    expect(p.memories).toEqual(['opportunity'])
    expect(totalScore(p)).toBe(340)
  })
})

describe('niveles bloqueados', () => {
  it('solo el nivel 1 está abierto al empezar', () => {
    const p = createEmptyProgress()
    expect(isLevelUnlocked(p, 'spirit', 1)).toBe(true)
    expect(isLevelUnlocked(p, 'spirit', 2)).toBe(false)
    expect(nextPlayableLevel(p, 'spirit')).toBe(1)
  })

  it('completar un nivel abre el siguiente solo en ese juego', () => {
    const p = play(win('spirit', 1))
    expect(isLevelUnlocked(p, 'spirit', 2)).toBe(true)
    expect(isLevelUnlocked(p, 'spirit', 3)).toBe(false)
    expect(isLevelUnlocked(p, 'opportunity', 2)).toBe(false)
    expect(nextPlayableLevel(p, 'spirit')).toBe(2)
  })

  it('con el juego completo se vuelve a sugerir el nivel 1', () => {
    expect(nextPlayableLevel(play(...fullGame('spirit')), 'spirit')).toBe(1)
  })
})

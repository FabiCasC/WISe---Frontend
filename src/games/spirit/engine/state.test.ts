import { describe, expect, it } from 'vitest'
import { FINISH } from './config'
import { GameModel, POWER } from './state'

const idle = { right: false, left: false, jump: false }
const right = { right: true, left: false, jump: false }

function playing(level: number) {
  const g = new GameModel(level)
  g.handleEnter()
  g.handleEnter()
  return g
}

/** Moves the rover until a condition holds (small steps, like real frames). */
function driveUntil(g: GameModel, cond: () => boolean, input = right, max = 4000) {
  for (let i = 0; i < max && g.phase === 'playing' && !cond(); i++) g.update(1 / 60, input)
}

describe('Spirit game model', () => {
  it('starts on the level selected in the portal and keeps it for a retry', () => {
    const game = new GameModel(3)
    game.newGame()
    expect(game.level).toBe(3)
    expect(game.phase).toBe('instructions')
  })

  it('practice mode has no energy or timer drain and does not award points', () => {
    const game = new GameModel(1, true)
    game.handleEnter()
    game.handleEnter()
    game.update(5, idle)
    expect(game.energy).toBe(100)
    expect(game.timeLeft).toBe(90)
    expect(game.score).toBe(0)
    expect(game.phase).toBe('playing')
  })

  it('level 1: driving straight into soft sand gets Spirit stuck', () => {
    const g = playing(1)
    driveUntil(g, () => false)
    expect(g.phase).toBe('lost')
    expect(g.lossReason).toMatch(/sand/i)
    expect(g.decisions).toContainEqual({ concept: 'arena-gasta-energia', correct: false })
  })

  it('level 1: sand slows the rover down', () => {
    const g = playing(1)
    driveUntil(g, () => !!g.onSand)
    const x = g.scroll
    g.update(0.1, right)
    expect(g.scroll - x).toBeLessThan(275 * 0.1 * 0.5)
  })

  it('level 2: staying on the ground uncovers the silica', () => {
    const g = playing(2)
    g.rocks = []
    driveUntil(g, () => g.scroll >= FINISH)
    expect(g.found.size).toBe(4)
    expect(g.phase).toBe('complete')
    expect(g.decisions.filter((d) => d.concept === 'silice-agua-caliente' && d.correct)).toHaveLength(4)
  })

  it('level 3: a north-facing slope gives the most power and wins the winter', () => {
    expect(POWER.north).toBeGreaterThan(POWER.flat)
    expect(POWER.flat).toBeGreaterThan(POWER.south)

    const g = playing(3)
    g.rocks = []
    driveUntil(g, () => g.ground === 'south')
    driveUntil(g, () => g.phase !== 'playing' || g.decisions.length > 0, idle)
    expect(g.decisions).toEqual([{ concept: 'inclinar-paneles-al-sol', correct: false }])
    expect(g.phase).toBe('playing')

    driveUntil(g, () => g.ground === 'north')
    g.update(1 / 60, right) // a little further onto the slope
    driveUntil(g, () => g.phase !== 'playing', idle)
    expect(g.phase).toBe('complete')
    expect(g.decisions[g.decisions.length - 1]).toEqual({ concept: 'inclinar-paneles-al-sol', correct: true })
  })
})

describe('Spirit level 1 is fair', () => {
  it('jumping each sand patch at the right moment gets through with no sand mistakes', () => {
    const g = playing(1)
    g.rocks = []
    for (let i = 0; i < 6000 && g.phase === 'playing'; i++) {
      // Jump when the next sand patch is just ahead of the rover's nose.
      const nose = g.scroll + 175 + 5 + 66
      const ahead = g.sand.some((z) => z.x - nose > 0 && z.x - nose < 12)
      g.update(1 / 60, { right: true, left: false, jump: ahead })
    }
    expect(g.phase).toBe('complete')
    expect(g.decisions.filter((d) => d.concept === 'arena-gasta-energia')).toEqual([
      { concept: 'arena-gasta-energia', correct: true },
      { concept: 'arena-gasta-energia', correct: true },
      { concept: 'arena-gasta-energia', correct: true },
    ])
  })
})

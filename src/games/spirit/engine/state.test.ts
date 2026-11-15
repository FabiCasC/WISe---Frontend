import { describe, expect, it } from 'vitest'
import { GameModel } from './state'

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
    game.update(5, { right: false, left: false, jump: false })

    expect(game.energy).toBe(100)
    expect(game.timeLeft).toBe(90)
    expect(game.score).toBe(0)
    expect(game.phase).toBe('playing')
  })
})

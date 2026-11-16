import { describe, expect, it } from 'vitest'
import { getGame, GAMES } from '../games'
import { getTutorial, TUTORIALS } from './index'

/**
 * Live games that do not have a Level 0 yet. When you add
 * src/content/tutorials/<id>.ts, delete the id from this list: the goal is an
 * empty list, and the test below keeps the others from being forgotten.
 */
const PENDING: string[] = [
  // These two ship their own practice inside the game (Ping / Capi), so the
  // portal's guide would be a second, repeated tutorial.
  'eagle-liftoff',
  'lunar-signals',
]

describe('Level 0 tutorials', () => {
  it('belong to live games, one file per game', () => {
    for (const [id, t] of Object.entries(TUTORIALS)) {
      expect(t.gameId, id).toBe(id)
      expect(getGame(id)?.status, `${id} is not a live game`).toBe('live')
    }
  })

  it.each(Object.keys(TUTORIALS))('%s explains the story, the controls and every part of the screen', (id) => {
    const t = getTutorial(id)!
    expect(t.story.length).toBeGreaterThan(60)
    expect(t.controls.length).toBeGreaterThan(0)
    for (const c of t.controls) {
      expect(c.keys.length).toBeGreaterThan(0)
      expect(c.does.length).toBeGreaterThan(8)
    }
    expect(t.parts.length).toBeGreaterThanOrEqual(3)
    for (const p of t.parts) {
      expect(p.name.length).toBeGreaterThan(1)
      expect(p.meaning.length).toBeGreaterThan(20)
    }
    expect(t.steps.length).toBeGreaterThanOrEqual(3)
    for (const st of t.steps) expect(st.text.length).toBeGreaterThan(20)
  })

  it('every live game has one, except the ones still pending', () => {
    const missing = GAMES.filter((g) => g.status === 'live' && !TUTORIALS[g.id]).map((g) => g.id)
    expect(missing.sort()).toEqual([...PENDING].sort())
  })
})

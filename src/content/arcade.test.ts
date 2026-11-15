import { describe, expect, it } from 'vitest'
import { ARCADE } from './arcade'
import { getGame } from './games'
import { SOURCES } from './sources'
import { conceptFor as apollo } from '../games/eagle-liftoff/rules'
import { conceptFor as rover } from '../games/lunar-rover/rules'
import { conceptFor as pathfinder } from '../games/pathfinder-bounce/rules'
import { conceptFor as sojourner } from '../games/sojourner-commands/rules'
import { conceptFor as phoenix } from '../games/phoenix-ice/rules'
import { conceptFor as ingenuity } from '../games/ingenuity-flight/rules'
import { conceptFor as lro } from '../games/lro-search/rules'
import { conceptFor as snake } from '../games/snake-express/rules'

/**
 * The seven abandoned-hardware games: every concept a game reports must be
 * declared in the catalog (the teacher dashboard shows its label), and every
 * card must cite sources that exist.
 */
const GAMES_CONCEPTS: Record<string, (level: 1 | 2 | 3) => string> = {
  'eagle-liftoff': apollo,
  'lunar-rover': rover,
  'pathfinder-bounce': pathfinder,
  'sojourner-commands': sojourner,
  'phoenix-ice': phoenix,
  'ingenuity-flight': ingenuity,
  'lro-search': lro,
  'snake-express': snake,
  'nasa-numbers': (level) => `nasa-numbers-${level}`,
}

describe('abandoned-hardware games are wired into the catalog', () => {
  for (const [id, conceptFor] of Object.entries(GAMES_CONCEPTS)) {
    it(id, () => {
      const game = getGame(id)
      expect(game?.status).toBe('live')
      expect(game?.levels).toBe(3)
      const declared = new Set(game!.concepts.map((c) => c.id))
      for (const level of [1, 2, 3] as const) expect(declared.has(conceptFor(level))).toBe(true)
      const card = ARCADE.find((a) => a.gameId === id)
      expect(card).toBeTruthy()
      expect(card!.levels.length).toBe(3)
      expect(card!.dramatization.length).toBeGreaterThan(40)
      expect(card!.sources?.length ?? 0).toBeGreaterThan(0)
      for (const s of card!.sources ?? []) expect(SOURCES[s], s).toBeTruthy()
    })
  }

  it('every source has an official NASA address and an access date', () => {
    for (const card of ARCADE) {
      for (const s of card.sources ?? []) {
        expect(SOURCES[s].url).toMatch(/^https:\/\/([a-z-]+\.)*(nasa\.gov)\//)
        expect(SOURCES[s].accessed).toBeTruthy()
      }
    }
  })
})

/**
 * The checks above only ran over the eight newest games, which is how six
 * older cards came to ship with no source at all while the team's own rule
 * in sources.ts says a card is not published without one. These run over
 * EVERY card, so the gap cannot reopen as more games are added.
 */
describe('every arcade card, old and new', () => {
  for (const card of ARCADE) {
    describe(card.gameId, () => {
      it('is a live game in the catalog', () => {
        const game = getGame(card.gameId)
        expect(game, card.gameId).toBeTruthy()
        expect(game!.status).toBe('live')
      })

      it('cites at least one source, and every source resolves', () => {
        expect(card.sources?.length ?? 0, card.gameId + ' cites no source').toBeGreaterThan(0)
        for (const s of card.sources ?? []) expect(SOURCES[s], s).toBeTruthy()
      })

      it('declares what it invents', () => {
        expect(card.dramatization.length).toBeGreaterThan(40)
      })

      it('describes one goal per level', () => {
        expect(card.levels.length).toBeGreaterThan(0)
        for (const l of card.levels) expect(l.goal.length).toBeGreaterThan(10)
      })
    })
  }
})

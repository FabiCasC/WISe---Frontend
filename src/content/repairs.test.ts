import { describe, expect, it } from 'vitest'
import { REPAIRS, correctOption, getRepair, wordCount } from './repairs'
import { getGame } from './games'
import { SOURCES } from './sources'

/**
 * The Repair Bay only works if everything in it is real: a real game, a real
 * concept the teacher dashboard knows, and a real NASA source the student can
 * open. These tests are what stop a plausible-sounding mission being invented.
 *
 * They also hold the reading budget. The bay is for children of about nine to
 * fourteen, working on their own, so every line they must read to act is kept
 * short. A paragraph creeping back in is a bug, and it fails here.
 */
describe('every repair mission is anchored to something real', () => {
  for (const m of REPAIRS) {
    describe(m.id, () => {
      it('points at a live game in the catalog', () => {
        const game = getGame(m.gameId)
        expect(game, m.gameId).toBeTruthy()
        expect(game!.status).toBe('live')
      })

      it('teaches a concept that game actually declares', () => {
        const declared = getGame(m.gameId)!.concepts.map((c) => c.id)
        expect(declared, m.id + ' -> ' + m.concept).toContain(m.concept)
      })

      it('cites a source that exists, is NASA, and was opened', () => {
        const s = SOURCES[m.evidence.sourceId]
        expect(s, m.evidence.sourceId).toBeTruthy()
        expect(s.url).toMatch(/^https:\/\/([a-z-]+\.)*nasa\.gov\//)
        expect(s.accessed).toBeTruthy()
      })

      it('hands the student a bench to run', () => {
        expect(m.bench.length).toBeGreaterThan(0)
      })

      it('has exactly one right answer', () => {
        const right = m.options.filter((o) => o.correct)
        expect(right.length, m.id).toBe(1)
        expect(correctOption(m).id).toBe(right[0]!.id)
      })

      it('offers a real choice, and every option answers back in one line', () => {
        expect(m.options.length).toBeGreaterThanOrEqual(3)
        for (const o of m.options) {
          expect(o.label.length, m.id + '/' + o.id).toBeGreaterThan(0)
          expect(wordCount(o.label), 'chip "' + o.label + '" is a sentence').toBeLessThanOrEqual(4)
          expect(wordCount(o.note), m.id + '/' + o.id + ' note').toBeLessThanOrEqual(16)
        }
      })

      it('has a repaired rule that actually differs from the broken one', () => {
        const broken = [...m.rule.before, m.rule.slot, ...m.rule.after].join(' | ')
        const fixed = [...m.ruleFixed.before, m.ruleFixed.slot, ...m.ruleFixed.after].join(' | ')
        expect(fixed, m.id).not.toBe(broken)
        expect(m.ruleFixed.slot).not.toBe(m.rule.slot)
      })

      it('says what the real repair changed', () => {
        expect(m.fixedIn.length).toBeGreaterThan(20)
      })
    })
  }
})

describe('the reading budget: a child works through this alone', () => {
  for (const m of REPAIRS) {
    describe(m.id, () => {
      it('asks its question in one short line', () => {
        expect(wordCount(m.ask), m.ask).toBeLessThanOrEqual(9)
      })

      it('states the title at a glance', () => {
        expect(wordCount(m.title), m.title).toBeLessThanOrEqual(6)
      })

      it('reports the observation in one short line', () => {
        expect(wordCount(m.observation), m.observation).toBeLessThanOrEqual(12)
      })

      it('names the contradiction in one short line', () => {
        expect(wordCount(m.gameSays), m.gameSays).toBeLessThanOrEqual(12)
      })

      it('keeps every block line short enough to read inside a block', () => {
        const lines = [
          ...m.rule.before,
          m.rule.slot,
          ...m.rule.after,
          ...m.ruleFixed.before,
          m.ruleFixed.slot,
          ...m.ruleFixed.after,
        ]
        for (const l of lines) expect(wordCount(l), l).toBeLessThanOrEqual(9)
      })

      it('keeps the NASA card to a few sentences, since it only confirms', () => {
        expect(wordCount(m.evidence.text), m.id).toBeLessThanOrEqual(45)
      })

      it('says what changed in one short line', () => {
        expect(wordCount(m.fixedIn), m.fixedIn).toBeLessThanOrEqual(14)
      })
    })
  }
})

describe('the set as a whole', () => {
  it('has unique ids', () => {
    const ids = REPAIRS.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every mission its own bench, so no two feel the same', () => {
    const benches = REPAIRS.map((r) => r.bench)
    expect(new Set(benches).size).toBe(benches.length)
  })

  it('covers more than one game, so the skill is not about one puzzle', () => {
    expect(new Set(REPAIRS.map((r) => r.gameId)).size).toBeGreaterThan(1)
  })

  it('finds a mission by id, and nothing by a made-up one', () => {
    expect(getRepair(REPAIRS[0]!.id)?.id).toBe(REPAIRS[0]!.id)
    expect(getRepair('no-such-mission')).toBeUndefined()
  })

  it('carries no emoji anywhere: this screen is read by children and by screen readers', () => {
    const emoji = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{FE0F}]/u
    for (const m of REPAIRS) {
      const text = [
        m.title,
        m.ask,
        m.observation,
        m.gameSays,
        m.evidence.text,
        m.fixedIn,
        m.rule.slot,
        ...m.rule.before,
        ...m.rule.after,
        ...m.ruleFixed.before,
        ...m.ruleFixed.after,
        ...m.options.flatMap((o) => [o.label, o.note]),
      ].join(' ')
      expect(emoji.test(text), m.id + ' contains an emoji or arrow glyph').toBe(false)
    }
  })
})

describe('wordCount', () => {
  it('counts words, not spaces', () => {
    expect(wordCount('one two three')).toBe(3)
    expect(wordCount('  padded   out  ')).toBe(2)
    expect(wordCount('')).toBe(0)
  })
})

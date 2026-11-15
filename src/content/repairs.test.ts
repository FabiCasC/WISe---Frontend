import { describe, expect, it } from 'vitest'
import { REPAIRS, correctOption, getRepair } from './repairs'
import { getGame } from './games'
import { SOURCES } from './sources'

/**
 * The Repair Bay only works if everything in it is real: a real game, a real
 * concept the teacher dashboard knows, and a real NASA source the student can
 * open. These tests are what stop a plausible-sounding mission being invented.
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
        const game = getGame(m.gameId)!
        const declared = game.concepts.map((c) => c.id)
        expect(declared, m.id + ' -> ' + m.concept).toContain(m.concept)
      })

      it('cites a source that exists, is NASA, and was opened', () => {
        const s = SOURCES[m.evidence.sourceId]
        expect(s, m.evidence.sourceId).toBeTruthy()
        expect(s.url).toMatch(/^https:\/\/([a-z-]+\.)*nasa\.gov\//)
        expect(s.accessed).toBeTruthy()
      })

      it('has exactly one right answer', () => {
        const right = m.options.filter((o) => o.correct)
        expect(right.length, m.id).toBe(1)
        expect(correctOption(m).id).toBe(right[0]!.id)
      })

      it('offers a real choice, and every option explains itself', () => {
        expect(m.options.length).toBeGreaterThanOrEqual(3)
        for (const o of m.options) {
          // A wrong option that is obviously silly teaches nothing: each one
          // has to be argued down with physics, not dismissed.
          expect(o.feedback.length, m.id + '/' + o.id).toBeGreaterThan(80)
          expect(o.label.length).toBeGreaterThan(0)
        }
      })

      it('says what the real repair changed', () => {
        expect(m.fixedIn.length).toBeGreaterThan(40)
        expect(m.symptom.length).toBeGreaterThan(40)
      })

      it('shows a rule with a slot to repair', () => {
        expect(m.rule.before.length).toBeGreaterThan(0)
        expect(m.rule.slot.length).toBeGreaterThan(0)
        expect(m.rule.after.length).toBeGreaterThan(0)
      })

      it('has a repaired rule that actually differs from the broken one', () => {
        expect(m.ruleFixed.before.length).toBeGreaterThan(0)
        expect(m.ruleFixed.slot.length).toBeGreaterThan(0)
        expect(m.ruleFixed.after.length).toBeGreaterThan(0)
        const broken = [...m.rule.before, m.rule.slot, ...m.rule.after].join(' | ')
        const fixed = [...m.ruleFixed.before, m.ruleFixed.slot, ...m.ruleFixed.after].join(' | ')
        expect(fixed, m.id).not.toBe(broken)
      })

      it('never leaves the repaired rule saying the broken thing', () => {
        // The slot the game shipped with must not survive into the repair:
        // this is what catches "IF the rover is taller THEN it sinks".
        expect(m.ruleFixed.slot).not.toBe(m.rule.slot)
      })
    })
  }
})

describe('the set as a whole', () => {
  it('has unique ids', () => {
    const ids = REPAIRS.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('covers more than one game, so the skill is not about one puzzle', () => {
    expect(new Set(REPAIRS.map((r) => r.gameId)).size).toBeGreaterThan(1)
  })

  it('finds a mission by id, and nothing by a made-up one', () => {
    expect(getRepair(REPAIRS[0]!.id)?.id).toBe(REPAIRS[0]!.id)
    expect(getRepair('no-such-mission')).toBeUndefined()
  })

  it('carries no emoji anywhere: this screen is read by children and by screen readers', () => {
    // Pictographs, dingbats, symbols and variation selectors.
    const emoji = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{FE0F}]/u
    for (const m of REPAIRS) {
      const text = [
        m.title,
        m.symptom,
        m.question,
        m.evidence.text,
        m.fixedIn,
        m.rule.slot,
        ...m.rule.before,
        ...m.rule.after,
        ...m.options.flatMap((o) => [o.label, o.feedback]),
      ].join(' ')
      expect(emoji.test(text), m.id + ' contains an emoji or arrow glyph').toBe(false)
    }
  })

  it('states the correct answer in plain words a child can act on', () => {
    for (const m of REPAIRS) {
      const right = correctOption(m)
      expect(right.feedback.toLowerCase(), m.id).toMatch(/correct/)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { LEVELS, sourcesOf, type LevelNumber } from './questions'
import {
  DIRECT_HIT_BONUS, MIN_POINTS, PASS_MARK, attemptsFor, judgeGuess, levelPassed,
  maxPointsPerQuestion, pointsFor, rankFor, shuffledOrder, type Question,
} from './rules'

const base: Question = {
  id: 't', clue: 'c', hint: 'h', answer: 15, min: 1, max: 20, tolerance: 0,
  answerText: '15', fact: 'f', source: { label: 'l', url: 'https://nasa.gov/x' },
}

describe('judgeGuess', () => {
  it('says higher / lower / correct', () => {
    expect(judgeGuess(base, 15).verdict).toBe('correct')
    expect(judgeGuess(base, 10).verdict).toBe('too-low')
    expect(judgeGuess(base, 19).verdict).toBe('too-high')
  })

  it('rejects guesses outside the range or not whole numbers', () => {
    expect(judgeGuess(base, 0).verdict).toBe('invalid')
    expect(judgeGuess(base, 21).verdict).toBe('invalid')
    expect(judgeGuess(base, 3.5).verdict).toBe('invalid')
    expect(judgeGuess(base, Number.NaN).verdict).toBe('invalid')
  })

  it('accepts a margin when tolerance is set, and tells if it was exact', () => {
    const q = { ...base, answer: 77, min: 1, max: 200, tolerance: 1 }
    expect(judgeGuess(q, 76)).toMatchObject({ verdict: 'correct', exact: false })
    expect(judgeGuess(q, 77)).toMatchObject({ verdict: 'correct', exact: true })
    expect(judgeGuess(q, 79).verdict).toBe('too-high')
  })

  it('reports how close a wrong guess is', () => {
    const q = { ...base, min: 1, max: 101, answer: 50 }
    expect(judgeGuess(q, 53).closeness).toBe('very-close')
    expect(judgeGuess(q, 60).closeness).toBe('warm')
    expect(judgeGuess(q, 100).closeness).toBe('far')
  })
})

describe('attempts and points', () => {
  it('grows with the range and shrinks with tolerance', () => {
    expect(attemptsFor({ min: 1, max: 20, tolerance: 0 })).toBe(6)
    expect(attemptsFor({ min: 1, max: 10, tolerance: 0 })).toBe(5)
    expect(attemptsFor({ min: 1, max: 200, tolerance: 5 })).toBeLessThan(
      attemptsFor({ min: 1, max: 200, tolerance: 0 }),
    )
  })

  it('pays more for fewer guesses, with a bonus for a direct hit', () => {
    expect(pointsFor(6, 1)).toBe(100 + DIRECT_HIT_BONUS)
    expect(pointsFor(6, 2)).toBeLessThan(pointsFor(6, 1))
    expect(pointsFor(6, 6)).toBeGreaterThanOrEqual(MIN_POINTS)
    expect(pointsFor(6, 3)).toBeGreaterThan(pointsFor(6, 4))
  })

  it('ranks by share of the maximum score', () => {
    expect(rankFor(5 * maxPointsPerQuestion, 5)).toBe('Mission Commander')
    expect(rankFor(0, 5)).toBe('Cadet')
    expect(rankFor(Math.round(0.5 * 5 * maxPointsPerQuestion), 5)).toBe('Astronaut')
  })

  it('needs PASS_MARK correct answers to pass', () => {
    expect(levelPassed(PASS_MARK - 1)).toBe(false)
    expect(levelPassed(PASS_MARK)).toBe(true)
  })
})

describe('shuffledOrder', () => {
  const items = [1, 2, 3, 4, 5]
  it('is deterministic for the same seed', () => {
    expect(shuffledOrder(items, 'seed-a')).toEqual(shuffledOrder(items, 'seed-a'))
  })
  it('keeps every item exactly once', () => {
    expect([...shuffledOrder(items, 'seed-b')].sort()).toEqual(items)
  })
  it('does not mutate the input', () => {
    const copy = [...items]
    shuffledOrder(items, 'seed-c')
    expect(items).toEqual(copy)
  })
})

/** Halving strategy: always guess the middle of what is still possible. */
function guessesNeeded(q: Question, answer: number): number {
  let lo = q.min
  let hi = q.max
  for (let n = 1; n <= 100; n++) {
    const guess = Math.floor((lo + hi) / 2)
    const r = judgeGuess({ ...q, answer }, guess)
    if (r.verdict === 'correct') return n
    if (r.verdict === 'too-high') hi = guess - q.tolerance - 1
    else lo = guess + q.tolerance + 1
    if (lo > hi) return Infinity
  }
  return Infinity
}

describe.each(([1, 2, 3] as LevelNumber[]).map((n) => [n, LEVELS[n]] as const))(
  'level %i content',
  (n, level) => {
    it('has exactly 5 questions with unique ids', () => {
      expect(level.questions).toHaveLength(5)
      expect(new Set(level.questions.map((q) => q.id)).size).toBe(5)
    })

    it('has complete, well-formed questions', () => {
      for (const q of level.questions) {
        expect(q.clue.length).toBeGreaterThan(10)
        expect(q.hint.length).toBeGreaterThan(5)
        expect(q.fact.length).toBeGreaterThan(20)
        expect(q.source.url.startsWith('https://')).toBe(true)
        expect(q.answer).toBeGreaterThanOrEqual(q.min)
        expect(q.answer).toBeLessThanOrEqual(q.max)
        expect(Number.isInteger(q.answer)).toBe(true)
        // The accepted window must not cover the whole range.
        expect(2 * q.tolerance + 1).toBeLessThan(q.max - q.min + 1)
      }
    })

    it('can always be won by halving the range within the attempts given', () => {
      for (const q of level.questions) {
        const allowed = attemptsFor(q)
        for (let a = q.min; a <= q.max; a++) {
          expect(guessesNeeded(q, a)).toBeLessThanOrEqual(allowed)
        }
      }
    })

    it('lists its sources without duplicates', () => {
      const urls = sourcesOf(n).map((s) => s.url)
      expect(new Set(urls).size).toBe(urls.length)
      expect(urls.length).toBeGreaterThan(0)
    })
  },
)

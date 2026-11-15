import { describe, expect, it } from 'vitest'
import { emptyRepairs, isSolved, markSolved } from './repairProgress'

describe('markSolved', () => {
  it('records a mission the first time', () => {
    const s = markSolved(emptyRepairs(), 'sand-vs-size', true)
    expect(s.solved).toEqual(['sand-vs-size'])
    expect(s.firstTry).toEqual(['sand-vs-size'])
  })

  it('records a mission solved after a wrong guess, without the clean mark', () => {
    const s = markSolved(emptyRepairs(), 'sand-vs-size', false)
    expect(s.solved).toEqual(['sand-vs-size'])
    expect(s.firstTry).toEqual([])
  })

  it('never lists the same mission twice', () => {
    let s = markSolved(emptyRepairs(), 'a', true)
    s = markSolved(s, 'a', true)
    expect(s.solved).toEqual(['a'])
    expect(s.firstTry).toEqual(['a'])
  })

  it('does not let a replay upgrade a mission that took a wrong guess', () => {
    let s = markSolved(emptyRepairs(), 'a', false)
    s = markSolved(s, 'a', true)
    expect(s.firstTry).toEqual([])
  })

  it('does not let a replay downgrade a clean solve', () => {
    let s = markSolved(emptyRepairs(), 'a', true)
    s = markSolved(s, 'a', false)
    expect(s.firstTry).toEqual(['a'])
  })

  it('keeps the order missions were solved in', () => {
    let s = markSolved(emptyRepairs(), 'a', true)
    s = markSolved(s, 'b', false)
    s = markSolved(s, 'c', true)
    expect(s.solved).toEqual(['a', 'b', 'c'])
    expect(s.firstTry).toEqual(['a', 'c'])
  })

  it('leaves the state it was given untouched', () => {
    const before = emptyRepairs()
    markSolved(before, 'a', true)
    expect(before).toEqual({ solved: [], firstTry: [] })
  })
})

describe('isSolved', () => {
  it('answers for solved and unsolved missions', () => {
    const s = markSolved(emptyRepairs(), 'a', true)
    expect(isSolved(s, 'a')).toBe(true)
    expect(isSolved(s, 'b')).toBe(false)
  })
})

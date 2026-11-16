import { describe, expect, it } from 'vitest'
import { createRng } from '../shared/rng'
import {
  ROUNDS, echoDistance, echoRounds, halvingProbes, huntPoints, huntRounds, judgeEcho, judgeInterval, newHunt,
  noiseRounds, overlap, probe, reading, stars,
} from './rules'

function playHunt(seed: string, strategy: (lo: number, hi: number, rng: () => number) => number) {
  const rounds = huntRounds(seed)
  const rng = createRng(seed + 'p')
  let found = 0
  for (const r of rounds) {
    const s = newHunt(r)
    while (!s.found && s.probes < r.allowed) {
      const res = probe(r, s, strategy(s.lo, s.hi, rng.next))
      if (res.verdict === 'invalid') break // out of range: the scan is refused, the round stalls
    }
    if (s.found) found += 1
  }
  return found
}

describe('Find the Beacon · level 1', () => {
  it('halving finds every beacon within the allowed scans', () => {
    for (let i = 0; i < 40; i++) {
      expect(playHunt('seed' + i, (lo, hi) => Math.floor((lo + hi) / 2))).toBe(ROUNDS)
    }
  })

  it('random scans that ignore the answers almost never win cleanly', () => {
    let clean = 0
    for (let i = 0; i < 200; i++) {
      if (playHunt('r' + i, (_lo, _hi, rnd) => 1 + Math.floor(rnd() * 64)) === ROUNDS) clean++
    }
    expect(clean).toBeLessThanOrEqual(2)
  })

  it('idling finds nothing: no scans, no beacon', () => {
    const r = huntRounds('idle')[0]
    const s = newHunt(r)
    expect(s.found).toBe(false)
    expect(huntPoints(r, s)).toBe(0)
  })

  it('the range only shrinks and a middle scan counts as a good split', () => {
    const r = { min: 1, max: 100, secret: 80, allowed: 8 }
    const s = newHunt(r)
    expect(probe(r, s, 50)).toMatchObject({ verdict: 'higher', goodSplit: true })
    expect([s.lo, s.hi]).toEqual([51, 100])
    expect(probe(r, s, 99)).toMatchObject({ verdict: 'lower', goodSplit: false })
    expect(probe(r, s, 10).verdict).toBe('invalid')
  })

  it('halvingProbes matches the log2 rule', () => {
    expect(halvingProbes(100)).toBe(7)
    expect(halvingProbes(1000)).toBe(10)
  })
})

describe('Find the Beacon · level 2', () => {
  it('an interval from overlapping readings holds the truth and is tight enough', () => {
    for (let i = 0; i < 100; i++) {
      const rng = createRng('n' + i)
      for (const n of noiseRounds('s' + i)) {
        const rs = [reading(n, rng), reading(n, rng), reading(n, rng)]
        const [lo, hi] = overlap(rs, n.margin)
        expect(judgeInterval(n, lo, hi).correct).toBe(true)
      }
    }
  })

  it('a single point misses, and a huge interval says nothing', () => {
    const n = noiseRounds('x')[0]
    expect(judgeInterval(n, n.truth + 1, n.truth + 1).correct).toBe(false)
    const wide = judgeInterval(n, 0, 1000)
    expect(wide.contains).toBe(true)
    expect(wide.correct).toBe(false)
  })
})

describe('Find the Beacon · level 3', () => {
  it('distance is speed x time / 2 and the right answer passes', () => {
    for (const e of echoRounds('e')) {
      const d = echoDistance(e.seconds)
      expect(d).toBeGreaterThan(340)
      expect(d).toBeLessThan(410)
      expect(judgeEcho(e, d).correct).toBe(true)
    }
  })

  it('doubling the answer is flagged as forgetting "there and back"', () => {
    const e = echoRounds('e')[0]
    const r = judgeEcho(e, echoDistance(e.seconds) * 2)
    expect(r.correct).toBe(false)
    expect(r.forgotHalf).toBe(true)
  })

  it('random guesses are almost never right', () => {
    const rng = createRng('rg')
    let ok = 0
    for (let i = 0; i < 500; i++) if (judgeEcho(echoRounds('e')[0], rng.range(0, 800)).correct) ok++
    expect(ok).toBeLessThan(20)
  })

  it('stars need the level to be passed first', () => {
    expect(stars(2, true, true)).toEqual({ concept: false, efficiency: false, speed: false })
    expect(stars(4, true, false)).toEqual({ concept: true, efficiency: true, speed: false })
  })
})

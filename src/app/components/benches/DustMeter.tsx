import { useEffect, useRef, useState } from 'react'
import { Bench, BenchButton, prefersStill } from './Bench'

/**
 * DUST METER — the bench for Gusev Maze.
 *
 * Dust piles up on the panels on its own, and the power bar falls with it.
 * The student then has two buttons: send a dust devil past, or crash.
 *
 * Under the rule the game shipped with, both do exactly the same thing, and
 * the bench says so out loud once they have tried both. That is the whole
 * bug: crashing was free cleaning, so the fastest way to finish the level
 * was to die on purpose and never chase a dust devil at all.
 */
export default function DustMeter({ onUsed }: { onUsed: () => void }) {
  /** 0 = clean panels, 1 = buried. */
  const [dust, setDust] = useState(0.15)
  const [tried, setTried] = useState<{ devil: boolean; crash: boolean }>({
    devil: false,
    crash: false,
  })
  const [last, setLast] = useState<'devil' | 'crash' | null>(null)
  const raf = useRef(0)

  // Dust keeps settling, the way it did on Spirit month after month.
  useEffect(() => {
    if (prefersStill()) return
    let prev = performance.now()
    const tick = (now: number) => {
      const dt = (now - prev) / 1000
      prev = now
      setDust((d) => Math.min(1, d + dt * 0.05))
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const act = (what: 'devil' | 'crash') => {
    // The rule as the game shipped it: BOTH of these wipe the panels clean.
    setDust(0)
    setLast(what)
    // Worked out here rather than inside the updater: calling onUsed from a
    // state updater runs it during React's render pass, which warns and can
    // update the parent mid-render.
    const next = { ...tried, [what]: true }
    setTried(next)
    if (next.devil && next.crash) onUsed()
  }

  const power = Math.round((1 - dust) * 100)
  const bothTried = tried.devil && tried.crash

  const result = bothTried
    ? 'Crashing cleaned the panels exactly like the dust devil.'
    : last === 'devil'
      ? 'The dust devil blew the dust away. Now try crashing.'
      : last === 'crash'
        ? 'Crashing cleaned them too. Is that right?'
        : null

  return (
    <Bench
      ask="Dust is covering the panels. What clears it?"
      result={result}
      controls={
        <>
          <BenchButton tone="go" onClick={() => act('devil')}>
            Send a dust devil
          </BenchButton>
          <BenchButton tone="plain" onClick={() => act('crash')}>
            Crash the rover
          </BenchButton>
          <span className="bench__readout">
            Power: <strong>{power}%</strong>
          </span>
        </>
      }
    >
      <svg
        viewBox="0 0 320 170"
        className="bench__svg"
        role="img"
        aria-label={'Solar panel with ' + Math.round(dust * 100) + ' percent dust. Power ' + power + ' percent.'}
      >
        <text x="20" y="26" className="bench__label">
          Solar panel
        </text>

        {/* The panel, with dust piling on top of it. */}
        <rect x="20" y="36" width="280" height="54" rx="4" className="bench__panel" />
        <rect x="20" y="36" width={280 * dust} height="54" rx="4" className="bench__dust" />
        <g className="bench__grid">
          {[1, 2, 3].map((i) => (
            <line key={i} x1={20 + i * 70} y1="36" x2={20 + i * 70} y2="90" />
          ))}
        </g>

        <text x="20" y="120" className="bench__label">
          Power left
        </text>
        <rect x="20" y="128" width="280" height="18" rx="9" className="bench__bar" />
        <rect
          x="20"
          y="128"
          width={280 * (1 - dust)}
          height="18"
          rx="9"
          className={'bench__barfill' + (power < 40 ? ' is-low' : '')}
        />
      </svg>
    </Bench>
  )
}

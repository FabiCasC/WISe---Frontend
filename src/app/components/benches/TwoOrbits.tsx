import { useEffect, useRef, useState } from 'react'
import { Bench, BenchButton, prefersStill } from './Bench'

/**
 * TWO ORBITS — the bench for Eagle Liftoff.
 *
 * Columbia goes round the Moon. The student puts Eagle either in the SAME
 * orbit or in a LOWER one, presses play, and watches the gap readout.
 *
 * Same orbit, same speed: the number does not move, however long they wait.
 * Lower orbit: the number falls, because a lower orbit is a faster one. The
 * rule the game shipped with praised a player sitting in the same orbit
 * twelve degrees behind, which is a gap that can never close.
 *
 * The angular speeds come from Kepler: a smaller radius means a shorter
 * period, so w scales as r^(-3/2). Nothing here is hand-waved.
 */

const R_HIGH = 62
const R_LOW = 44
/** Degrees per second for the outer orbit; the inner one follows Kepler. */
const W_HIGH = 26
const W_LOW = W_HIGH * Math.pow(R_HIGH / R_LOW, 1.5)

const CX = 160
const CY = 100

type Lane = 'same' | 'lower'

export default function TwoOrbits({ onUsed }: { onUsed: () => void }) {
  const [lane, setLane] = useState<Lane>('same')
  const [running, setRunning] = useState(false)
  /** Degrees Columbia is ahead of Eagle. Starts at the gap the game praised. */
  const [gap, setGap] = useState(12)
  const [columbia, setColumbia] = useState(0)
  const raf = useRef(0)
  const seen = useRef<{ same: boolean; lower: boolean }>({ same: false, lower: false })

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const stop = () => {
    cancelAnimationFrame(raf.current)
    setRunning(false)
  }

  const play = () => {
    if (running) return
    setRunning(true)
    if (prefersStill()) {
      // No motion: jump straight to what twelve seconds would have shown.
      setGap((g) => (lane === 'same' ? g : Math.max(0, g - 12)))
      setRunning(false)
      seen.current = { ...seen.current, [lane]: true }
      onUsed()
      return
    }
    let prev = performance.now()
    const tick = (now: number) => {
      const dt = (now - prev) / 1000
      prev = now
      setColumbia((c) => (c + W_HIGH * dt) % 360)
      // Eagle only gains on Columbia from the lower, faster orbit.
      if (lane === 'lower') setGap((g) => Math.max(0, g - (W_LOW - W_HIGH) * dt))
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    seen.current = { ...seen.current, [lane]: true }
    onUsed()
  }

  const choose = (l: Lane) => {
    stop()
    setLane(l)
    setGap(12)
  }

  const rEagle = lane === 'same' ? R_HIGH : R_LOW
  const aC = (columbia * Math.PI) / 180
  const aE = ((columbia - gap) * Math.PI) / 180

  const result =
    !seen.current.same && !seen.current.lower
      ? null
      : lane === 'same'
        ? seen.current.lower
          ? 'Same orbit, same speed: the gap never closes.'
          : 'The gap is not moving. Now try the lower orbit.'
        : gap < 0.5
          ? 'From the lower orbit Eagle caught up.'
          : 'The lower orbit is faster. The gap is closing.'

  return (
    <Bench
      ask="Put Eagle in an orbit and watch the gap."
      result={result}
      controls={
        <>
          <BenchButton tone="plain" pressed={lane === 'same'} onClick={() => choose('same')}>
            Same orbit
          </BenchButton>
          <BenchButton tone="plain" pressed={lane === 'lower'} onClick={() => choose('lower')}>
            Lower orbit
          </BenchButton>
          <BenchButton tone="go" onClick={running ? stop : play}>
            {running ? 'Stop' : 'Play'}
          </BenchButton>
          <span className="bench__readout">
            Gap: <strong>{gap.toFixed(1)}</strong> degrees
          </span>
        </>
      }
    >
      <svg
        viewBox="0 0 320 200"
        className="bench__svg"
        role="img"
        aria-label={result ?? 'Eagle and Columbia in orbit around the Moon.'}
      >
        <circle cx={CX} cy={CY} r="26" className="bench__moon" />
        <circle cx={CX} cy={CY} r={R_HIGH} className="bench__orbit" />
        <circle cx={CX} cy={CY} r={R_LOW} className={'bench__orbit' + (lane === 'lower' ? ' is-on' : '')} />

        <circle cx={CX + Math.cos(aC) * R_HIGH} cy={CY + Math.sin(aC) * R_HIGH} r="7" className="bench__columbia" />
        <circle cx={CX + Math.cos(aE) * rEagle} cy={CY + Math.sin(aE) * rEagle} r="6" className="bench__eagle" />

        <text x="16" y="24" className="bench__label">
          Columbia (outer)
        </text>
        <text x="16" y="40" className="bench__label">
          Eagle {lane === 'same' ? '(same orbit)' : '(lower, faster)'}
        </text>
      </svg>
    </Bench>
  )
}

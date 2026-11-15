import { useEffect, useRef, useState } from 'react'
import { Bench, BenchButton, prefersStill } from './Bench'

type Ground = 'sand' | 'gap'
type Phase = 'idle' | 'running' | 'done'

/**
 * SAND AND GAP — the bench for Sun and Shade.
 *
 * Two rovers, drawn to scale against each other, and two kinds of ground.
 * The student sends both across and watches.
 *
 * On soft sand the LIGHT rover is the one that stops, which is the opposite
 * of what the game used to say. At a low gap the TALL rover is the one that
 * stops, which is true and is what the repair swaps the rule to. Seeing both
 * is what makes the difference land: it is not about weight, it is about
 * what the ground does to each shape.
 */
export default function SandAndGap({ onUsed }: { onUsed: () => void }) {
  const [ground, setGround] = useState<Ground>('sand')
  const [phase, setPhase] = useState<Phase>('idle')
  /** 0..1 along the track. */
  const [t, setT] = useState(0)
  const raf = useRef(0)

  // Spirit stops part-way through sand; Curiosity stops at the gap.
  const spiritStops = ground === 'sand'
  const curiosityStops = ground === 'gap'
  const BLOCK_AT = 0.52

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const run = () => {
    if (phase === 'running') return
    cancelAnimationFrame(raf.current)
    setPhase('running')
    setT(0)
    if (prefersStill()) {
      setT(1)
      setPhase('done')
      onUsed()
      return
    }
    const started = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - started) / 2200)
      setT(p)
      if (p < 1) raf.current = requestAnimationFrame(step)
      else {
        setPhase('done')
        onUsed()
      }
    }
    raf.current = requestAnimationFrame(step)
  }

  const reset = (g: Ground) => {
    cancelAnimationFrame(raf.current)
    setGround(g)
    setPhase('idle')
    setT(0)
  }

  /** Where a rover is, given whether this ground stops it. */
  const pos = (stops: boolean) => (stops ? Math.min(t, BLOCK_AT) : t)

  const result =
    phase !== 'done'
      ? null
      : ground === 'sand'
        ? 'Spirit sank. Curiosity drove through.'
        : 'Curiosity is too tall. Spirit fits under.'

  return (
    <Bench
      ask="Send both rovers across. Which one stops?"
      result={result}
      controls={
        <>
          <BenchButton tone="plain" pressed={ground === 'sand'} onClick={() => reset('sand')}>
            Soft sand
          </BenchButton>
          <BenchButton tone="plain" pressed={ground === 'gap'} onClick={() => reset('gap')}>
            Low gap
          </BenchButton>
          <BenchButton tone="go" onClick={run}>
            {phase === 'done' ? 'Run again' : 'Send them'}
          </BenchButton>
        </>
      }
    >
      <svg viewBox="0 0 320 180" className="bench__svg" role="img" aria-label={result ?? 'Two rovers waiting at the start of a track.'}>
        <defs>
          <pattern id="sandHatch" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M0 6 L6 0" stroke="var(--bench-warn)" strokeWidth="1.5" opacity="0.5" />
          </pattern>
        </defs>

        {[0, 1].map((lane) => {
          const y = 52 + lane * 76
          const isSpirit = lane === 0
          const stops = isSpirit ? spiritStops : curiosityStops
          // Spirit is small, Curiosity is tall: the shapes carry the lesson.
          const w = isSpirit ? 26 : 40
          const h = isSpirit ? 16 : 30
          const x = 24 + pos(stops) * 212
          const blocked = phase === 'done' && stops
          return (
            <g key={lane}>
              <text x="12" y={y - 26} className="bench__label">
                {isSpirit ? 'Spirit 185 kg solar' : 'Curiosity 899 kg nuclear'}
              </text>
              <line x1="20" y1={y + 10} x2="300" y2={y + 10} className="bench__ground" />

              {ground === 'sand' ? (
                <rect x="140" y={y - 2} width="54" height="12" fill="url(#sandHatch)" />
              ) : (
                <rect
                  x="150"
                  y={y - 22}
                  width="34"
                  height={isSpirit ? 12 : 12}
                  className="bench__rock"
                />
              )}

              <g transform={`translate(${x} ${y + 10})`}>
                <rect
                  x={-w / 2}
                  y={-h}
                  width={w}
                  height={h}
                  rx="3"
                  className={'bench__rover' + (blocked ? ' is-stuck' : '')}
                />
                <circle cx={-w / 3} cy="0" r="4" className="bench__wheel" />
                <circle cx={w / 3} cy="0" r="4" className="bench__wheel" />
              </g>

              <text x="300" y={y + 2} textAnchor="end" className="bench__label">
                {phase === 'done' ? (stops ? 'STOPPED' : 'PASSED') : ''}
              </text>
            </g>
          )
        })}
      </svg>
    </Bench>
  )
}

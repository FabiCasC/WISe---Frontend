import { useState } from 'react'
import { Bench, BenchButton } from './Bench'

/**
 * THREE CIRCLES — the bench for Two Signals from the Moon.
 *
 * A seismometer measures how FAR a moonquake was, never which direction.
 * That single number draws a circle around the station, and the quake is
 * somewhere on it.
 *
 * So the student switches stations on one at a time and counts what is left:
 * one station leaves a whole circle, two leave exactly two crossings, three
 * leave one. Nobody has to say "two is not enough" — the picture says it,
 * and the counter puts a number on it.
 *
 * The geometry is real: the circles are centred on the three stations and
 * their radii are the true distances to the quake, so they genuinely meet
 * where the quake is.
 */

/** The quake, and three stations, in the SVG's own coordinates. */
const QUAKE = { x: 168, y: 96 }
const STATIONS = [
  { x: 72, y: 56, name: 'A' },
  { x: 250, y: 74, name: 'B' },
  { x: 140, y: 156, name: 'C' },
]

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

/**
 * Where two circles cross. Returns both points, or an empty list when they
 * do not meet. Standard circle-circle intersection.
 */
function crossings(
  a: { x: number; y: number; r: number },
  b: { x: number; y: number; r: number },
): { x: number; y: number }[] {
  const d = Math.hypot(b.x - a.x, b.y - a.y)
  if (d === 0 || d > a.r + b.r || d < Math.abs(a.r - b.r)) return []
  const k = (a.r * a.r - b.r * b.r + d * d) / (2 * d)
  const h2 = a.r * a.r - k * k
  if (h2 < 0) return []
  const h = Math.sqrt(h2)
  const mx = a.x + (k * (b.x - a.x)) / d
  const my = a.y + (k * (b.y - a.y)) / d
  const ox = (h * (b.y - a.y)) / d
  const oy = (h * (b.x - a.x)) / d
  return [
    { x: mx + ox, y: my - oy },
    { x: mx - ox, y: my + oy },
  ]
}

export default function ThreeCircles({ onUsed }: { onUsed: () => void }) {
  const [on, setOn] = useState(0)

  const circles = STATIONS.slice(0, on).map((s) => ({ ...s, r: dist(s, QUAKE) }))

  // With two stations the quake could be at either crossing. With three, only
  // the point all three agree on survives.
  const pair = circles.length >= 2 ? crossings(circles[0]!, circles[1]!) : []
  const candidates =
    circles.length >= 3
      ? pair.filter((p) => Math.abs(dist(p, circles[2]!) - circles[2]!.r) < 1.5)
      : pair

  const add = () => {
    const next = Math.min(3, on + 1)
    setOn(next)
    if (next >= 2) onUsed()
  }

  const result =
    on === 0
      ? null
      : on === 1
        ? 'One station: the quake is somewhere on this whole circle.'
        : on === 2
          ? 'Two stations: two places left. Which one?'
          : 'Three stations: only one place is left.'

  return (
    <Bench
      ask="Switch on stations. How many places are left?"
      result={result}
      controls={
        <>
          <BenchButton tone="go" onClick={add}>
            {on === 0 ? 'Switch on a station' : on < 3 ? 'Add another station' : 'All three are on'}
          </BenchButton>
          <BenchButton tone="plain" onClick={() => setOn(0)}>
            Start over
          </BenchButton>
          <span className="bench__readout">
            Possible places: <strong>{on === 0 ? '—' : on === 1 ? 'many' : candidates.length}</strong>
          </span>
        </>
      }
    >
      <svg
        viewBox="0 0 320 200"
        className="bench__svg"
        role="img"
        aria-label={result ?? 'A map of the Moon with three seismometer stations switched off.'}
      >
        <rect x="0" y="0" width="320" height="200" className="bench__map" />

        {circles.map((c) => (
          <circle key={c.name} cx={c.x} cy={c.y} r={c.r} className="bench__ring" />
        ))}

        {STATIONS.map((s, i) => (
          <g key={s.name}>
            <rect
              x={s.x - 6}
              y={s.y - 6}
              width="12"
              height="12"
              rx="2"
              className={'bench__station' + (i < on ? ' is-on' : '')}
            />
            <text x={s.x} y={s.y - 11} textAnchor="middle" className="bench__label">
              {s.name}
            </text>
          </g>
        ))}

        {on >= 2
          ? candidates.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="7" className="bench__candidate" />
            ))
          : null}

        {on >= 3 ? (
          <text x={QUAKE.x} y={QUAKE.y + 24} textAnchor="middle" className="bench__label">
            moonquake
          </text>
        ) : null}
      </svg>
    </Bench>
  )
}

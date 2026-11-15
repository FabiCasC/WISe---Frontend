import type { ReactNode } from 'react'

/**
 * The shell every test bench sits in.
 *
 * A bench is the part of a repair mission the student actually does. It owns
 * one question, one control strip and one picture, and it reports back the
 * moment it has been used, because nothing else on the mission unlocks until
 * the student has seen something with their own eyes.
 *
 * Deliberately plain: a heading, a stage, a row of buttons, one result line.
 * No icons carry meaning, every state is also a word.
 */
export function Bench({
  ask,
  children,
  controls,
  result,
}: {
  ask: string
  /** The picture: an SVG stage. */
  children: ReactNode
  controls: ReactNode
  /** One short line, once there is something to say. */
  result?: string | null
}) {
  return (
    <div className="bench">
      <p className="bench__ask">{ask}</p>
      <div className="bench__stage">{children}</div>
      <div className="bench__controls">{controls}</div>
      {result ? (
        <p className="bench__result" role="status">
          {result}
        </p>
      ) : (
        <p className="bench__hint">Try it and watch what happens.</p>
      )}
    </div>
  )
}

export function BenchButton({
  onClick,
  children,
  tone = 'plain',
  pressed,
}: {
  onClick: () => void
  children: ReactNode
  tone?: 'plain' | 'go'
  pressed?: boolean
}) {
  return (
    <button
      type="button"
      className={'bench__btn bench__btn--' + tone + (pressed ? ' is-on' : '')}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/** True when the viewer asked the system for less movement. */
export function prefersStill(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

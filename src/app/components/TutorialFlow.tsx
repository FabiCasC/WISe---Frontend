import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { GameEntry } from '../../content/games'
import type { Tutorial } from '../../content/tutorials'
import { IconBack, IconCheck, IconPlay } from './Art'

interface Props {
  game: GameEntry
  tutorial: Tutorial
  /** Goes on to the real Level 1 (and remembers the guide was seen). */
  onStart: () => void
  onExit: () => void
  /** The real game, running in practice mode: no score, nothing to lose. */
  renderPractice: () => ReactNode
}

const STEPS = ['What you will learn', 'How to play', 'What is on the screen'] as const

/**
 * LEVEL 0. First a short guide (what you will learn, the controls, what every
 * part of the screen means), then the real game in practice mode with a coach
 * bar. It is for the player: the science card stays the page for teachers.
 */
export default function TutorialFlow({ game, tutorial, onStart, onExit, renderPractice }: Props) {
  const [mode, setMode] = useState<'guide' | 'practice'>('guide')

  if (mode === 'practice') {
    return <Practice tutorial={tutorial} onStart={onStart} onGuide={() => setMode('guide')} game={game} renderPractice={renderPractice} />
  }
  return <Guide game={game} tutorial={tutorial} onStart={onStart} onExit={onExit} onTry={() => setMode('practice')} />
}

function Guide({
  game,
  tutorial,
  onStart,
  onExit,
  onTry,
}: {
  game: GameEntry
  tutorial: Tutorial
  onStart: () => void
  onExit: () => void
  onTry: () => void
}) {
  const [step, setStep] = useState(0)
  const heading = useRef<HTMLHeadingElement>(null)
  const last = step === STEPS.length - 1

  // Move focus to the new step so keyboard and screen-reader users follow along.
  useEffect(() => heading.current?.focus(), [step])

  const next = () => (last ? onTry() : setStep((s) => s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!(e.target instanceof HTMLButtonElement)) next()
      } else if (e.key === 'ArrowLeft') back()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  return (
    <div className="tut" role="dialog" aria-modal="true" aria-label={`${game.title}: level 0, how to play`}>
      <div className="tut__top">
        <button type="button" className="btn btn--quiet" onClick={onExit}>
          <IconBack /> Arcade
        </button>
        <span className="tut__kicker">Level 0 · How to play</span>
        <button type="button" className="btn btn--quiet" onClick={onStart}>
          Skip to level 1
        </button>
      </div>

      <div className="tut__card">
        <p className="tut__game">{game.title}</p>
        <ol className="tut__dots" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? 'is-on' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
              <span className="sr-only">{s}</span>
            </li>
          ))}
        </ol>
        <h1 className="tut__title" ref={heading} tabIndex={-1}>
          {STEPS[step]}
        </h1>

        {step === 0 && (
          <div className="tut__body">
            <p className="tut__story">{tutorial.story}</p>
            <p className="tut__label">By playing, you will find out that…</p>
            <ul className="tut__learn">
              {game.concepts.map((c) => (
                <li key={c.id}>
                  <IconCheck size={16} />
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 1 && (
          <div className="tut__body">
            <ul className="tut__controls">
              {tutorial.controls.map((c) => (
                <li key={c.does}>
                  <span className="tut__keys">
                    {c.keys.map((k) => (
                      <kbd key={k} className="key">
                        {k}
                      </kbd>
                    ))}
                  </span>
                  <span>
                    {c.does}
                    {c.touch && <small> · On a phone: {c.touch}</small>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 2 && (
          <div className="tut__body">
            <dl className="tut__parts">
              {tutorial.parts.map((p) => (
                <div key={p.name}>
                  <dt>{p.name}</dt>
                  <dd>{p.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="tut__actions">
          {step > 0 && (
            <button type="button" className="btn btn--quiet" onClick={back}>
              Back
            </button>
          )}
          <button type="button" className="btn btn--primary btn--lg" onClick={next}>
            {last ? (
              <>
                <IconPlay /> Try it, no score
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function Practice({
  game,
  tutorial,
  onStart,
  onGuide,
  renderPractice,
}: {
  game: GameEntry
  tutorial: Tutorial
  onStart: () => void
  onGuide: () => void
  renderPractice: () => ReactNode
}) {
  const steps = tutorial.steps
  const [i, setI] = useState(0)
  const [done, setDone] = useState(false)
  const last = i === steps.length - 1
  const step = steps[i]

  // Leaves a strip at the bottom of the screen for the coach bar.
  useEffect(() => {
    document.documentElement.classList.add('level0')
    return () => document.documentElement.classList.remove('level0')
  }, [])

  // A step with keys ticks itself off when the player does it, then the coach
  // moves on. Pressing the keys on the way is never blocked.
  useEffect(() => {
    setDone(false)
    if ((!step.keys?.length && !step.pointer) || last) return
    let timer = 0
    const finish = () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onPointer, true)
      setDone(true)
      timer = window.setTimeout(() => setI((n) => Math.min(n + 1, steps.length - 1)), 900)
    }
    const onKey = (e: KeyboardEvent) => {
      if (step.keys?.includes(e.code)) finish()
    }
    const onPointer = (e: PointerEvent) => {
      if (step.pointer && !(e.target as Element | null)?.closest?.('.coach, .mg__overlay')) finish()
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onPointer, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onPointer, true)
      window.clearTimeout(timer)
    }
  }, [i, step, last, steps.length])

  return (
    <>
      {renderPractice()}
      <aside className="coach" aria-label={`${game.title}: level 0 practice`}>
        <div className="coach__text" aria-live="polite">
          <b>
            Level 0 · Step {i + 1} of {steps.length}
          </b>
          <span className={done ? 'is-done' : ''}>
            {done && <IconCheck size={14} />} {step.text}
          </span>
        </div>
        <div className="coach__actions">
          <button type="button" className="btn btn--quiet btn--sm" onClick={onGuide}>
            Guide
          </button>
          {!last && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => setI((n) => n + 1)}>
              {done ? 'Next' : 'Skip step'}
            </button>
          )}
          <button type="button" className={`btn btn--sm ${last ? 'btn--primary' : 'btn--quiet'}`} onClick={onStart}>
            <IconPlay size={14} /> Start level 1
          </button>
        </div>
      </aside>
    </>
  )
}

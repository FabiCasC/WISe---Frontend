/**
 * DESIGN GAME - SIMULADOR
 * Ejecuta el GameSpecification usando el motor (GameEngine).
 * El simulador consume el estado REAL del editor, no una demo independiente.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { GameSpecification } from '../types'
import { GameEngine } from '../engine'
import { renderFrame } from '../renderer'
import { getState } from '../store'
import { IconArrow, IconPause, IconPlay, IconRestart, IconStop } from './Icons'

interface Props {
  spec: GameSpecification
}

type SimPhase = 'ready' | 'playing' | 'paused' | 'won' | 'lost'

export default function Simulator({ spec }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const rafRef = useRef<number | null>(null)
  const [phase, setPhase] = useState<SimPhase>('ready')
  const [score, setScore] = useState(0)
  const [lostReason, setLostReason] = useState('')

  // Crear/recargar el engine cuando cambia la spec del editor
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new GameEngine(spec)
    } else {
      const wasPlaying = getState().simulatorRunning
      engineRef.current.reload(spec)
      if (wasPlaying) {
        engineRef.current.start()
        setPhase('playing')
      } else {
        setPhase('ready')
      }
    }

    const off = engineRef.current.on((event) => {
      if (event.type === 'score_changed') setScore(event.value)
      else if (event.type === 'game_won') { setPhase('won'); setScore(event.score) }
      else if (event.type === 'game_lost') { setPhase('lost'); setLostReason(event.reason) }
      else if (event.type === 'sound') playSfx(event.sound)
    })

    return () => {
      off()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec])

  // Loop de renderizado
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx || !engineRef.current) return
      const { width, height } = canvas
      const runtime = engineRef.current.getRuntime()
      renderFrame(ctx, runtime, width, height)
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Escalar canvas al contenedor
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      const parent = canvas.parentElement
      if (!parent) return
      const { width } = parent.getBoundingClientRect()
      const aspect = spec.scene.size.width / spec.scene.size.height
      const h = width / aspect
      canvas.width = spec.scene.size.width
      canvas.height = spec.scene.size.height
      canvas.style.width = `${width}px`
      canvas.style.height = `${Math.round(h)}px`
    })
    observer.observe(canvas.parentElement ?? canvas)
    return () => observer.disconnect()
  }, [spec.scene.size])

  // Teclado
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }
      engineRef.current.keyDown(e.key)
    }
    const onUp = (e: KeyboardEvent) => {
      engineRef.current?.keyUp(e.key)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  // Movimiento continuo por tecla (60fps)
  useEffect(() => {
    if (phase !== 'playing') return
    const interval = setInterval(() => {
      engineRef.current?.updateMovementFromKeys()
    }, 16)
    return () => clearInterval(interval)
  }, [phase])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      engineRef.current?.destroy()
      engineRef.current = null
    }
  }, [])

  const handlePlay = useCallback(() => {
    if (!engineRef.current) return
    if (phase === 'paused') {
      engineRef.current.resume()
      setPhase('playing')
    } else {
      engineRef.current.stop()
      engineRef.current.reload(spec)
      engineRef.current.start()
      setScore(0)
      setPhase('playing')
    }
  }, [phase, spec])

  const handlePause = useCallback(() => {
    engineRef.current?.pause()
    setPhase('paused')
  }, [])

  const handleStop = useCallback(() => {
    engineRef.current?.stop()
    setPhase('ready')
    setScore(0)
  }, [])

  const handleRestart = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current?.reload(spec)
    engineRef.current?.start()
    setScore(0)
    setPhase('playing')
  }, [spec])

  return (
    <div className="dg-simulator">
      {/* Controls bar */}
      <div className="dg-simulator__bar">
        <span className="dg-simulator__title">Simulator</span>
        <div className="dg-simulator__controls">
          {phase === 'playing' ? (
            <button className="dg-sim-btn" onClick={handlePause} title="Pause">
              <IconPause label="Pause" />
            </button>
          ) : (
            <button className="dg-sim-btn dg-sim-btn--play" onClick={handlePlay} title="Run">
              <IconPlay label="Run" />
            </button>
          )}
          <button className="dg-sim-btn" onClick={handleStop} title="Stop" disabled={phase === 'ready'}>
            <IconStop label="Stop" />
          </button>
          <button className="dg-sim-btn" onClick={handleRestart} title="Restart">
            <IconRestart label="Restart" />
          </button>
        </div>
        {(phase === 'playing' || phase === 'paused') && (
          <span className="dg-simulator__score">Score {score}</span>
        )}
        <PhaseChip phase={phase} />
      </div>

      {/* Canvas */}
      <div className="dg-simulator__canvas-wrap">
        <canvas
          ref={canvasRef}
          className="dg-simulator__canvas"
          aria-label="Game simulator"
          role="img"
        />
        {phase === 'ready' && (
          <div className="dg-simulator__overlay">
            <button className="dg-sim-play-btn" onClick={handlePlay}>
              <IconPlay size={32} />
              <span>Run the game</span>
            </button>
          </div>
        )}
        {phase === 'paused' && (
          <div className="dg-simulator__overlay dg-simulator__overlay--dim">
            <button className="dg-sim-play-btn" onClick={handlePlay}>
              <IconPlay size={32} />
              <span>Carry on</span>
            </button>
          </div>
        )}
        {phase === 'lost' && (
          <div className="dg-simulator__overlay dg-simulator__overlay--lost">
            <div className="dg-sim-end">
              <h4 className="dg-sim-end__title">Game over</h4>
              {lostReason && <p className="dg-sim-end__reason">{lostReason}</p>}
              <button className="dg-btn dg-btn--primary dg-btn--sm" onClick={handleRestart}>
                Try again
              </button>
            </div>
          </div>
        )}
        {phase === 'won' && (
          <div className="dg-simulator__overlay dg-simulator__overlay--won">
            <div className="dg-sim-end">
              <h4 className="dg-sim-end__title">You win</h4>
              <p className="dg-sim-end__score">Score: {score}</p>
              <button className="dg-btn dg-btn--primary dg-btn--sm" onClick={handleRestart}>
                Play again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls táctiles */}
      <TouchControls phase={phase} />

      {/* Nota educativa */}
      <p className="dg-simulator__note">
        The simulator runs exactly the blocks you put together.
      </p>
    </div>
  )
}

function PhaseChip({ phase }: { phase: SimPhase }) {
  const labels: Record<SimPhase, { label: string; color: string }> = {
    ready:   { label: 'Ready',     color: '#7fd6a3' },
    playing: { label: 'Running',   color: '#4A90D9' },
    paused:  { label: 'Paused',    color: '#F1C40F' },
    won:     { label: 'You win',   color: '#7fd6a3' },
    lost:    { label: 'Game over', color: '#E74C3C' },
  }
  const { label, color } = labels[phase]
  return (
    <span className="dg-simulator__phase" style={{ color }}>
      {label}
    </span>
  )
}

function TouchControls({ phase }: { phase: SimPhase }) {
  if (phase !== 'playing') return null

  const fireKey = (key: string, type: 'down' | 'up') => {
    const engine = (window as unknown as { __dgEngine?: GameEngine }).__dgEngine
    if (!engine) return
    if (type === 'down') engine.keyDown(key)
    else engine.keyUp(key)
  }

  return (
    <div className="dg-touch-pad">
      <div className="dg-touch-pad__dpad">
        <button
          className="dg-touch-pad__btn dg-touch-pad__btn--up"
          onPointerDown={() => fireKey('ArrowUp', 'down')}
          onPointerUp={() => fireKey('ArrowUp', 'up')}
        >
          <IconArrow direction="up" label="Up" />
        </button>
        <button
          className="dg-touch-pad__btn dg-touch-pad__btn--left"
          onPointerDown={() => fireKey('ArrowLeft', 'down')}
          onPointerUp={() => fireKey('ArrowLeft', 'up')}
        >
          <IconArrow direction="left" label="Left" />
        </button>
        <button
          className="dg-touch-pad__btn dg-touch-pad__btn--right"
          onPointerDown={() => fireKey('ArrowRight', 'down')}
          onPointerUp={() => fireKey('ArrowRight', 'up')}
        >
          <IconArrow direction="right" label="Right" />
        </button>
        <button
          className="dg-touch-pad__btn dg-touch-pad__btn--down"
          onPointerDown={() => fireKey('ArrowDown', 'down')}
          onPointerUp={() => fireKey('ArrowDown', 'up')}
        >
          <IconArrow direction="down" label="Down" />
        </button>
      </div>
      <button
        className="dg-touch-pad__btn dg-touch-pad__btn--jump"
        onPointerDown={() => fireKey(' ', 'down')}
        onPointerUp={() => fireKey(' ', 'up')}
      >Jump</button>
    </div>
  )
}

function playSfx(sound: string): void {
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    if (sound === 'collect' || sound === 'beep') {
      o.frequency.setValueAtTime(880, ctx.currentTime)
      g.gain.setValueAtTime(0.1, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      o.start(); o.stop(ctx.currentTime + 0.15)
    } else if (sound === 'jump') {
      o.frequency.setValueAtTime(400, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12)
      g.gain.setValueAtTime(0.08, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
      o.start(); o.stop(ctx.currentTime + 0.12)
    } else if (sound === 'win') {
      o.frequency.setValueAtTime(600, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4)
      g.gain.setValueAtTime(0.12, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      o.start(); o.stop(ctx.currentTime + 0.4)
    } else if (sound === 'lose') {
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(400, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
      g.gain.setValueAtTime(0.1, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      o.start(); o.stop(ctx.currentTime + 0.3)
    }
  } catch {
    // audio no disponible
  }
}

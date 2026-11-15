/**
 * DESIGN GAME - SIMULADOR
 * Ejecuta el GameSpecification usando el motor (GameEngine).
 * Sin emojis; iconos SVG coherentes con el sistema de Órbita Arcade.
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

interface Props {
  spec: GameSpecification
}

type SimPhase = 'ready' | 'playing' | 'paused' | 'won' | 'lost'

/* -------------------------------------------------------------------------
   Iconos SVG
   ------------------------------------------------------------------------- */
const stroke = {
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function IconPlay()    { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5v15l13-7.5z" fill="currentColor" /></svg> }
function IconPause()   { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14M15 5v14" {...stroke} /></svg> }
function IconStop()    { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" /></svg> }
function IconRestart() { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 1 1.6 5.1M3 17v-5h5" {...stroke} /></svg> }
function IconUp()      { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" {...stroke} /></svg> }
function IconCheck()   { return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" {...stroke} strokeWidth={2.4} /></svg> }
function IconCross()   { return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...stroke} strokeWidth={2.4} /></svg> }
function IconStar()    { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z" {...stroke} /></svg> }

/* -------------------------------------------------------------------------
   Componente
   ------------------------------------------------------------------------- */

export default function Simulator({ spec }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const rafRef    = useRef<number | null>(null)
  const [phase, setPhase]           = useState<SimPhase>('ready')
  const [score, setScore]           = useState(0)
  const [lostReason, setLostReason] = useState('')

  // Crear / recargar engine cuando cambia el spec
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new GameEngine(spec)
    } else {
      const wasPlaying = phase === 'playing'
      engineRef.current.reload(spec)
      if (wasPlaying) { engineRef.current.start(); setPhase('playing') }
      else             { setPhase('ready') }
    }

    const off = engineRef.current.on((event) => {
      if      (event.type === 'score_changed') setScore(event.value)
      else if (event.type === 'game_won')  { setPhase('won');  setScore(event.score) }
      else if (event.type === 'game_lost') { setPhase('lost'); setLostReason(event.reason) }
      else if (event.type === 'sound')     playSfx(event.sound)
    })
    return () => { off() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec])

  // Loop de renderizado
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current
      const ctx    = canvas?.getContext('2d')
      if (!ctx || !engineRef.current) return
      renderFrame(ctx, engineRef.current.getRuntime(), canvas!.width, canvas!.height)
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
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
      canvas.width  = spec.scene.size.width
      canvas.height = spec.scene.size.height
      canvas.style.width  = `${width}px`
      canvas.style.height = `${Math.round(width / aspect)}px`
    })
    observer.observe(canvas.parentElement ?? canvas)
    return () => observer.disconnect()
  }, [spec.scene.size])

  // Teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
      engineRef.current?.keyDown(e.key)
    }
    const up = (e: KeyboardEvent) => { engineRef.current?.keyUp(e.key) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Movimiento continuo
  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(() => { engineRef.current?.updateMovementFromKeys() }, 16)
    return () => clearInterval(id)
  }, [phase])

  // Limpiar
  useEffect(() => () => { engineRef.current?.destroy(); engineRef.current = null }, [])

  const handlePlay = useCallback(() => {
    if (!engineRef.current) return
    if (phase === 'paused') { engineRef.current.resume(); setPhase('playing') }
    else { engineRef.current.stop(); engineRef.current.reload(spec); engineRef.current.start(); setScore(0); setPhase('playing') }
  }, [phase, spec])

  const handlePause   = useCallback(() => { engineRef.current?.pause();  setPhase('paused') }, [])
  const handleStop    = useCallback(() => { engineRef.current?.stop();   setPhase('ready'); setScore(0) }, [])
  const handleRestart = useCallback(() => {
    engineRef.current?.stop(); engineRef.current?.reload(spec); engineRef.current?.start()
    setScore(0); setPhase('playing')
  }, [spec])

  return (
    <div className="dg-simulator">
      {/* Barra de controles */}
      <div className="dg-simulator__bar">
        <span className="dg-simulator__title">Simulador</span>

        <div className="dg-simulator__controls">
          {phase === 'playing'
            ? <button className="dg-sim-btn" onClick={handlePause}  title="Pausar"><IconPause /></button>
            : <button className="dg-sim-btn dg-sim-btn--play" onClick={handlePlay} title="Ejecutar"><IconPlay /></button>
          }
          <button className="dg-sim-btn" onClick={handleStop}    title="Detener"   disabled={phase === 'ready'}><IconStop /></button>
          <button className="dg-sim-btn" onClick={handleRestart} title="Reiniciar"><IconRestart /></button>
        </div>

        {(phase === 'playing' || phase === 'paused') && (
          <span className="dg-simulator__score">
            <IconStar /> {score}
          </span>
        )}

        <PhaseChip phase={phase} />
      </div>

      {/* Canvas */}
      <div className="dg-simulator__canvas-wrap">
        <canvas
          ref={canvasRef}
          className="dg-simulator__canvas"
          aria-label="Simulador del videojuego"
          role="img"
        />

        {phase === 'ready' && (
          <div className="dg-simulator__overlay">
            <button className="dg-sim-play-btn" onClick={handlePlay}>
              <span className="dg-sim-play-btn__icon"><IconPlay /></span>
              Ejecutar juego
            </button>
          </div>
        )}

        {phase === 'paused' && (
          <div className="dg-simulator__overlay dg-simulator__overlay--dim">
            <button className="dg-sim-play-btn" onClick={handlePlay}>
              <span className="dg-sim-play-btn__icon"><IconPlay /></span>
              Continuar
            </button>
          </div>
        )}

        {phase === 'lost' && (
          <div className="dg-simulator__overlay dg-simulator__overlay--lost">
            <div className="dg-sim-end">
              <span className="dg-sim-end__icon dg-sim-end__icon--lost"><IconCross /></span>
              <h4 className="dg-sim-end__title">Game Over</h4>
              {lostReason && <p className="dg-sim-end__reason">{lostReason}</p>}
              <button className="dg-btn dg-btn--primary dg-btn--sm" onClick={handleRestart}>Reintentar</button>
            </div>
          </div>
        )}

        {phase === 'won' && (
          <div className="dg-simulator__overlay dg-simulator__overlay--won">
            <div className="dg-sim-end">
              <span className="dg-sim-end__icon dg-sim-end__icon--won"><IconCheck /></span>
              <h4 className="dg-sim-end__title">Ganaste</h4>
              <p className="dg-sim-end__score">Puntuación: {score}</p>
              <button className="dg-btn dg-btn--primary dg-btn--sm" onClick={handleRestart}>Jugar de nuevo</button>
            </div>
          </div>
        )}
      </div>

      {/* Controles táctiles */}
      <TouchControls phase={phase} engine={engineRef} />

      <p className="dg-simulator__note">
        El simulador ejecuta exactamente las instrucciones que programaste.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------
   Phase chip
   ------------------------------------------------------------------------- */

function PhaseChip({ phase }: { phase: SimPhase }) {
  const map: Record<SimPhase, { label: string; color: string }> = {
    ready:   { label: 'Listo',       color: 'var(--ok)' },
    playing: { label: 'Jugando',     color: '#4a90d9' },
    paused:  { label: 'Pausado',     color: 'var(--warn)' },
    won:     { label: 'Completado',  color: 'var(--ok)' },
    lost:    { label: 'Game Over',   color: '#e06c5a' },
  }
  const { label, color } = map[phase]
  return <span className="dg-simulator__phase" style={{ color }}>{label}</span>
}

/* -------------------------------------------------------------------------
   Controles táctiles
   ------------------------------------------------------------------------- */

function TouchControls({ phase, engine }: {
  phase: SimPhase
  engine: React.MutableRefObject<GameEngine | null>
}) {
  if (phase !== 'playing') return null

  const fire = (key: string, type: 'down' | 'up') => {
    if (type === 'down') engine.current?.keyDown(key)
    else                 engine.current?.keyUp(key)
  }

  return (
    <div className="dg-touch-pad" aria-hidden="true">
      <div className="dg-touch-pad__dpad">
        <button className="dg-touch-pad__btn dg-touch-pad__btn--up"
          onPointerDown={() => fire('ArrowUp',    'down')} onPointerUp={() => fire('ArrowUp',    'up')}>
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="dg-touch-pad__btn dg-touch-pad__btn--left"
          onPointerDown={() => fire('ArrowLeft',  'down')} onPointerUp={() => fire('ArrowLeft',  'up')}>
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 12H5M12 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="dg-touch-pad__btn dg-touch-pad__btn--right"
          onPointerDown={() => fire('ArrowRight', 'down')} onPointerUp={() => fire('ArrowRight', 'up')}>
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="dg-touch-pad__btn dg-touch-pad__btn--down"
          onPointerDown={() => fire('ArrowDown',  'down')} onPointerUp={() => fire('ArrowDown',  'up')}>
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 5v14M5 12l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <button
        className="dg-touch-pad__btn dg-touch-pad__btn--jump"
        onPointerDown={() => fire(' ', 'down')} onPointerUp={() => fire(' ', 'up')}
      >
        <IconUp /> Saltar
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------
   Sonido
   ------------------------------------------------------------------------- */

function playSfx(sound: string): void {
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
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
  } catch { /* audio no disponible */ }
}

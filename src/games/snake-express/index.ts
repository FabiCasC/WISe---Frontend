/**
 * LUNAR EXPRESS — Motor principal del juego
 * -------------------------------------------------------------------------
 * Snake educativo en superficie lunar. Canvas 2D puro, sin Phaser.
 * Usa los helpers compartidos: createStage, createLoop, createInput, createSfx.
 *
 * Fases:
 *  INTRO → DIFFICULTY → INSTRUCTIONS → READY → EXPLORATION → RETURN
 *  → SUCCESS | FAILED → RESULTS
 *
 * El motor separa simulación lógica (cuadrícula) de representación visual
 * (canvas). La simulación avanza en pasos discretos; el canvas interpola.
 */

import type { GameContext, GameController } from '../../shared/types'
import { createSfx } from '../shared/audio'
import { createLoop } from '../shared/loop'
import { createRng } from '../shared/rng'
import { DIFFICULTY_CONFIGS, GRID, WORLD, type Difficulty } from './config'
import { getEndGameFact, getSampleFlash, EDU_FACTS } from './education'
import {
  buildOccupied,
  calcRecoveryPct,
  calcScore,
  collidesWithObstacles,
  collidesWithWagon,
  findFreePosition,
  generateObstacles,
  isOpposite,
  isOutOfBounds,
  moveVec,
  seededRandom,
  vecEquals,
  type Direction,
  type GamePhase,
  type Obstacle,
  type Rocket,
  type Sample,
  type Vec2,
} from './rules'

// ---------------------------------------------------------------------------
// Pantalla HTML completa — no usa createStage porque el juego maneja sus
// propias pantallas de menú fuera del canvas
// ---------------------------------------------------------------------------

export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  const rng = createRng(ctx.seed)
  const sfx = createSfx(ctx.settings.volume)
  const reduced = ctx.settings.reducedMotion

  // ---- Estado global -------------------------------------------------------
  let phase: GamePhase = 'INTRO'
  let difficulty: Difficulty = 'easy'
  let previousPhase: GamePhase = 'INTRO'

  // ---- Estado de la partida ------------------------------------------------
  let head: Vec2 = { x: Math.floor(GRID.cols / 2), y: Math.floor(GRID.rows / 2) }
  let direction: Direction = 'right'
  let wagons: Vec2[] = []
  let wagonsToAdd = 0
  let obstacles: Obstacle[] = []
  let samples: Sample[] = []
  let rocket: Rocket | null = null
  let samplesCollected = 0
  let samplesDelivered = 0
  let explorationTimeLeft: number = WORLD.explorationTime
  // unused — interval is computed inline from cfg.moveIntervalMs
  let collisionFlashMs = 0
  let phaseTransitionMs = 0
  let phaseMessage = ''
  let endGameFact = EDU_FACTS[0]!
  let inputBuffer: Direction[] = []

  // ---- Historial de posiciones para seguimiento de vagones -----------------
  // Cada paso se guarda la posición de la cabeza; los vagones la siguen
  const posHistory: Vec2[] = []
  const HISTORY_SIZE = 400

  // ---- Partículas decorativas ----------------------------------------------
  interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; r: number; color: string }
  let particles: Particle[] = []

  // Estrellas de fondo
  const stars = Array.from({ length: 60 }, () => ({
    x: rng.range(0, WORLD.width),
    y: rng.range(0, WORLD.height * 0.6),
    r: rng.range(0.5, 2),
    twinkle: rng.range(0, Math.PI * 2),
  }))

  // ---- Configuración de dificultad activa ----------------------------------
  let cfg = DIFFICULTY_CONFIGS[difficulty]
  let rand = seededRandom(42)

  // ---- Acumulador de distancia para girar ruedas -------------------------
  // Cada step() incrementa en 1; las ruedas convierten eso en ángulo.
  let stepCount = 0

  // =========================================================================
  // DOM: contenedor del juego
  // =========================================================================

  const root = document.createElement('div')
  root.style.cssText = `
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 400px;
    background: #080c1a;
    overflow: hidden;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #e8eaf0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
  `
  container.appendChild(root)

  // Canvas de juego
  const canvasWrapper = document.createElement('div')
  canvasWrapper.style.cssText = `
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  `
  root.appendChild(canvasWrapper)

  const canvas = document.createElement('canvas')
  canvas.style.cssText = `
    display: block;
    image-rendering: pixelated;
    touch-action: none;
  `
  canvasWrapper.appendChild(canvas)
  const c = canvas.getContext('2d', { alpha: false })!

  // Capa de overlay para pantallas de menú
  const overlayEl = document.createElement('div')
  overlayEl.style.cssText = `
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(8,12,26,0.92);
    z-index: 10;
    padding: 16px;
    overflow-y: auto;
  `
  root.appendChild(overlayEl)

  // Flash de mensajes cortos
  const flashEl = document.createElement('div')
  flashEl.style.cssText = `
    position: absolute;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  `
  root.appendChild(flashEl)

  const activeFlashTimers: number[] = []
  function flash(text: string, tone: 'ok' | 'bad' | 'info' = 'ok') {
    const el = document.createElement('div')
    const color = tone === 'ok' ? '#4ade80' : tone === 'bad' ? '#f87171' : '#60a5fa'
    el.style.cssText = `
      background: rgba(0,0,0,0.75);
      color: ${color};
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid ${color}44;
      animation: flashPop 0.9s ease forwards;
      white-space: nowrap;
    `
    el.textContent = text
    flashEl.appendChild(el)
    const t = window.setTimeout(() => {
      el.remove()
      activeFlashTimers.splice(activeFlashTimers.indexOf(t), 1)
    }, 900)
    activeFlashTimers.push(t)
  }

  // Inject animation keyframe
  if (!document.getElementById('snake-express-styles')) {
    const style = document.createElement('style')
    style.id = 'snake-express-styles'
    style.textContent = `
      @keyframes flashPop {
        0%   { opacity: 0; transform: translateY(-8px) scale(0.9); }
        15%  { opacity: 1; transform: translateY(0) scale(1.05); }
        70%  { opacity: 1; transform: translateY(0) scale(1); }
        100% { opacity: 0; transform: translateY(-12px) scale(0.95); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes rocketThrust {
        0%,100% { transform: scaleY(1); }
        50%     { transform: scaleY(1.3); }
      }
      @keyframes pulse {
        0%,100% { opacity: 1; }
        50%     { opacity: 0.5; }
      }
      .le-card {
        background: linear-gradient(145deg, #0d1530 0%, #131c3a 100%);
        border: 1px solid rgba(99,179,237,0.3);
        border-radius: 16px;
        padding: 28px 32px;
        max-width: 480px;
        width: 100%;
        animation: fadeIn 0.3s ease;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(99,130,220,0.1);
      }
      .le-card h2 {
        margin: 0 0 8px;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: #c8d4f0;
      }
      .le-card .le-kicker {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #7ba3e8;
        margin: 0 0 16px;
      }
      .le-card p { margin: 0 0 16px; font-size: 14px; color: #9daac8; line-height: 1.6; }
      .le-card .le-fact {
        background: rgba(99,130,220,0.1);
        border-left: 3px solid #7ba3e8;
        padding: 10px 14px;
        border-radius: 0 8px 8px 0;
        font-size: 13px;
        color: #adc0e8;
        margin: 12px 0;
        line-height: 1.5;
      }
      .le-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px 22px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        font-family: inherit;
        letter-spacing: 0.02em;
      }
      .le-btn-primary {
        background: linear-gradient(135deg, #3b6fd4, #5b8de8);
        color: #fff;
        box-shadow: 0 4px 16px rgba(59,111,212,0.4);
      }
      .le-btn-primary:hover { background: linear-gradient(135deg, #4a7de0, #6a9cf0); transform: translateY(-1px); }
      .le-btn-secondary {
        background: rgba(99,130,220,0.15);
        color: #9daac8;
        border: 1px solid rgba(99,130,220,0.25);
      }
      .le-btn-secondary:hover { background: rgba(99,130,220,0.25); color: #c8d4f0; }
      .le-btn-danger {
        background: rgba(220,50,50,0.15);
        color: #f87171;
        border: 1px solid rgba(220,50,50,0.3);
      }
      .le-difficulty-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        margin: 16px 0;
      }
      .le-diff-card {
        background: rgba(99,130,220,0.08);
        border: 1px solid rgba(99,130,220,0.2);
        border-radius: 10px;
        padding: 14px 10px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }
      .le-diff-card:hover, .le-diff-card.selected {
        background: rgba(99,130,220,0.2);
        border-color: #7ba3e8;
        transform: translateY(-2px);
      }
      .le-diff-card.selected { border-color: #60a5fa; box-shadow: 0 0 12px rgba(96,165,250,0.3); }
      .le-diff-card .diff-name { font-size: 13px; font-weight: 700; color: #c8d4f0; margin-bottom: 4px; }
      .le-diff-card .diff-desc { font-size: 11px; color: #7a8aaa; margin-bottom: 8px; line-height: 1.4; }
      .le-diff-card .diff-dots { display: flex; justify-content: center; gap: 3px; margin-top: 6px; }
      .le-diff-card .diff-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(99,130,220,0.3); }
      .le-diff-card .diff-dot.on { background: #60a5fa; box-shadow: 0 0 4px #60a5fa; }
      .le-instructions-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 14px 0;
      }
      .le-instr-item {
        background: rgba(99,130,220,0.08);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 12px;
        color: #9daac8;
        display: flex;
        gap: 8px;
        align-items: flex-start;
      }
      .le-instr-icon { font-size: 18px; flex-shrink: 0; }
      .le-results-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(99,130,220,0.1);
        font-size: 14px;
      }
      .le-results-row:last-child { border-bottom: none; }
      .le-results-row .label { color: #7a8aaa; }
      .le-results-row .value { font-weight: 600; color: #c8d4f0; }
      .le-pct-bar {
        background: rgba(99,130,220,0.1);
        border-radius: 4px;
        height: 6px;
        margin-top: 8px;
        overflow: hidden;
      }
      .le-pct-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b6fd4, #4ade80);
        border-radius: 4px;
        transition: width 1s ease;
      }
      .le-action-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 20px;
        justify-content: center;
      }
      .le-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      .le-status-success { background: rgba(74,222,128,0.15); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
      .le-status-fail { background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
      @media (max-width: 480px) {
        .le-card { padding: 20px 18px; }
        .le-card h2 { font-size: 18px; }
        .le-difficulty-grid { grid-template-columns: 1fr; }
        .le-instructions-grid { grid-template-columns: 1fr; }
      }
    `
    document.head.appendChild(style)
  }

  // =========================================================================
  // Pantallas de UI (overlay)
  // =========================================================================

  function clearOverlay() {
    overlayEl.innerHTML = ''
    overlayEl.style.display = 'none'
  }

  function showOverlay(html: string) {
    overlayEl.style.display = 'flex'
    overlayEl.innerHTML = html
  }

  function btn(id: string, label: string, cls = 'le-btn-primary') {
    return `<button id="${id}" class="le-btn ${cls}">${label}</button>`
  }

  function bindBtn(id: string, handler: () => void) {
    const el = overlayEl.querySelector(`#${id}`)
    if (el) el.addEventListener('click', handler)
  }

  // ---- INTRO ---------------------------------------------------------------
  function showIntro() {
    phase = 'INTRO'
    showOverlay(`
      <div class="le-card" style="max-width:520px; text-align:center;">
        <div class="le-kicker">NASA Space Apps · Minijuego educativo</div>
        <h2 style="font-size:28px; color:#e8eaf0; margin-bottom:4px;">🌙 SNAKE EXPRESS</h2>
        <p style="font-size:15px; color:#7ba3e8; font-style:italic; margin-bottom:16px;">Explora. Recolecta. Regresa.</p>
        <div style="font-size:48px; margin:16px 0; filter: drop-shadow(0 0 12px rgba(99,165,250,0.6));">🚗</div>
        <p>Conduce el carrito snake de la NASA por la superficie de la Luna.
           Recolecta muestras científicas y regresa al cohete antes de que sea demasiado tarde.</p>
        <p style="font-size:12px; color:#5a6a8a; margin-bottom:20px;">
          Inspirado en las misiones Apollo y el Lunar Roving Vehicle (LRV)
        </p>
        <div style="display:flex; gap:10px; flex-direction:column; align-items:center;">
          ${btn('btn-play', '🚀 Iniciar misión')}
          <div style="display:flex;gap:8px;margin-top:4px;">
            ${btn('btn-instructions', 'Ver instrucciones', 'le-btn-secondary')}
            ${btn('btn-edu', '🔬 Datos NASA', 'le-btn-secondary')}
          </div>
        </div>
      </div>
    `)
    bindBtn('btn-play', showDifficulty)
    bindBtn('btn-instructions', showInstructions)
    bindBtn('btn-edu', showEducation)
  }

  // ---- DIFFICULTY ----------------------------------------------------------
  function showDifficulty() {
    phase = 'DIFFICULTY'
    const diffs: Array<{ id: Difficulty; dots: number }> = [
      { id: 'easy', dots: 1 },
      { id: 'medium', dots: 2 },
      { id: 'expert', dots: 3 },
    ]
    const diffCards = diffs.map(({ id, dots }) => {
      const c = DIFFICULTY_CONFIGS[id]
      const dotHtml = Array.from({ length: 3 }, (_, i) => `<div class="diff-dot ${i < dots ? 'on' : ''}"></div>`).join('')
      return `
        <div class="le-diff-card ${id === difficulty ? 'selected' : ''}" data-diff="${id}">
          <div class="diff-name">${c.label}</div>
          <div class="diff-desc">${c.description}</div>
          <div style="font-size:11px; color:#7a8aaa;">
            ${c.targetSamples} muestras<br>${c.obstacles} obstáculos
          </div>
          <div class="diff-dots">${dotHtml}</div>
        </div>
      `
    }).join('')

    showOverlay(`
      <div class="le-card">
        <div class="le-kicker">Configuración de misión</div>
        <h2>Selecciona la dificultad</h2>
        <p>Elige el nivel de dificultad de la misión. Tienes 60 segundos para recolectar muestras y luego debes regresar al cohete.</p>
        <div class="le-difficulty-grid">${diffCards}</div>
        <div class="le-action-row">
          ${btn('btn-start', '✓ Confirmar y jugar')}
          ${btn('btn-back', '← Volver', 'le-btn-secondary')}
        </div>
      </div>
    `)

    // Selección de dificultad
    overlayEl.querySelectorAll('.le-diff-card').forEach((el) => {
      el.addEventListener('click', () => {
        overlayEl.querySelectorAll('.le-diff-card').forEach((c) => c.classList.remove('selected'))
        el.classList.add('selected')
        difficulty = (el as HTMLElement).dataset.diff as Difficulty
      })
    })
    bindBtn('btn-start', () => {
      cfg = DIFFICULTY_CONFIGS[difficulty]
      showReady()
    })
    bindBtn('btn-back', showIntro)
  }

  // ---- INSTRUCTIONS --------------------------------------------------------
  function showInstructions() {
    previousPhase = phase
    phase = 'INSTRUCTIONS'
    showOverlay(`
      <div class="le-card" style="max-width:520px;">
        <div class="le-kicker">Cómo jugar</div>
        <h2>Instrucciones</h2>
        <div class="le-instructions-grid">
          <div class="le-instr-item">
            <span class="le-instr-icon">⌨️</span>
            <div><b style="color:#c8d4f0;">Controles</b><br>Flechas o WASD para conducir.<br>Controles táctiles en móvil.</div>
          </div>
          <div class="le-instr-item">
            <span class="le-instr-icon">🔬</span>
            <div><b style="color:#c8d4f0;">Muestras</b><br>Pasa sobre las esferas brillantes.<br>Cada una agrega un vagón.</div>
          </div>
          <div class="le-instr-item">
            <span class="le-instr-icon">⏱️</span>
            <div><b style="color:#c8d4f0;">Exploración</b><br>60 segundos para recolectar.<br>No choques con nada.</div>
          </div>
          <div class="le-instr-item">
            <span class="le-instr-icon">🚀</span>
            <div><b style="color:#c8d4f0;">Regreso</b><br>Al acabar el tiempo, lleva el carrito al cohete para entregar las muestras.</div>
          </div>
          <div class="le-instr-item">
            <span class="le-instr-icon">🪨</span>
            <div><b style="color:#c8d4f0;">Obstáculos</b><br>Evita rocas y cráteres.<br>Chocar termina la misión.</div>
          </div>
          <div class="le-instr-item">
            <span class="le-instr-icon">💥</span>
            <div><b style="color:#c8d4f0;">Colisión</b><br>Chocar con el escenario, obstáculos o tus propios vagones termina la misión.</div>
          </div>
        </div>
        <p style="font-size:12px; color:#5a6a8a; border-top:1px solid rgba(99,130,220,0.2); padding-top:12px; margin-top:4px;">
          Solo el carrito principal (cabeza) activa la entrega al llegar al cohete, no los vagones.
        </p>
        <div class="le-action-row">
          ${btn('btn-back-instr', '← Volver')}
        </div>
      </div>
    `)
    bindBtn('btn-back-instr', () => {
      if (previousPhase === 'INTRO') showIntro()
      else showDifficulty()
    })
  }

  // ---- EDUCATION -----------------------------------------------------------
  function showEducation() {
    const factsHtml = EDU_FACTS.slice(0, 6).map((f) => `
      <div style="border:1px solid rgba(99,130,220,0.2); border-radius:8px; padding:12px; margin-bottom:8px;">
        <div style="font-size:12px; font-weight:700; color:#7ba3e8; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:4px;">${f.category}</div>
        <div style="font-size:13px; font-weight:600; color:#c8d4f0; margin-bottom:4px;">${f.title}</div>
        <div style="font-size:12px; color:#7a8aaa; line-height:1.5;">${f.text}</div>
        ${f.intentionallyLeft !== undefined ? `<div style="font-size:11px; color:${f.intentionallyLeft ? '#4ade80' : '#f9a84d'}; margin-top:6px; font-style:italic;">${f.intentionallyLeft ? '✓ Diseñado para quedarse en la Luna' : '⟶ Quedó allí por necesidad operativa'}</div>` : ''}
      </div>
    `).join('')

    showOverlay(`
      <div class="le-card" style="max-width:520px; max-height:80vh; overflow-y:auto;">
        <div class="le-kicker">Contenido educativo NASA</div>
        <h2>🔬 Datos Snake</h2>
        <p>Equipos y descubrimientos reales de las misiones snake.</p>
        ${factsHtml}
        <div class="le-action-row">
          ${btn('btn-back-edu', '← Volver')}
        </div>
      </div>
    `)
    bindBtn('btn-back-edu', showIntro)
  }

  // ---- READY ---------------------------------------------------------------
  function showReady() {
    phase = 'READY'
    cfg = DIFFICULTY_CONFIGS[difficulty]
    clearOverlay()

    // Inicializar la partida
    initGame()

    showOverlay(`
      <div class="le-card" style="text-align:center; max-width:380px;">
        <div class="le-kicker">Misión ${cfg.label}</div>
        <h2>¡Prepárate!</h2>
        <div style="font-size:48px; margin:16px 0;">🌙</div>
        <p>Objetivo: recolecta <b style="color:#60a5fa">${cfg.targetSamples} muestras</b> en 60 segundos y regresa al cohete.</p>
        <p style="font-size:12px; color:#5a6a8a;">Usa las flechas del teclado o WASD para conducir.</p>
        ${btn('btn-launch', '🚀 ¡Lanzar misión!')}
      </div>
    `)
    bindBtn('btn-launch', startExploration)
  }

  // ---- RESULTS -------------------------------------------------------------
  function showResults(success: boolean) {
    const pct = calcRecoveryPct(samplesCollected, samplesDelivered)
    const score = calcScore({
      samplesCollected,
      samplesDelivered,
      difficulty,
      missionSuccess: success,
    })
    const fact = endGameFact

    const pctColor = pct >= 75 ? '#4ade80' : pct >= 50 ? '#f9a84d' : '#f87171'

    showOverlay(`
      <div class="le-card" style="max-width:440px;">
        <div class="le-kicker">Resultado de la misión</div>
        <h2>${success ? '✅ Misión completada' : '💥 Misión fallida'}</h2>
        <div class="le-status-badge ${success ? 'le-status-success' : 'le-status-fail'}">
          ${success ? '🏆 Muestras entregadas con éxito' : '☠️ El carrito fue destruido'}
        </div>

        <div style="margin:12px 0;">
          <div class="le-results-row">
            <span class="label">Dificultad</span>
            <span class="value">${cfg.label}</span>
          </div>
          <div class="le-results-row">
            <span class="label">Muestras recolectadas</span>
            <span class="value" style="color:#60a5fa;">${samplesCollected}</span>
          </div>
          <div class="le-results-row">
            <span class="label">Muestras entregadas</span>
            <span class="value" style="color:${success ? '#4ade80' : '#f87171'};">${samplesDelivered}</span>
          </div>
          <div class="le-results-row">
            <span class="label">Recuperación</span>
            <span class="value" style="color:${pctColor};">${pct}%</span>
          </div>
          <div class="le-pct-bar">
            <div class="le-pct-fill" id="pct-fill" style="width:0%"></div>
          </div>
          ${score > 0 ? `
          <div class="le-results-row" style="margin-top:8px; border-top:1px solid rgba(99,130,220,0.2); padding-top:8px;">
            <span class="label">Puntuación</span>
            <span class="value" style="color:#f9a84d; font-size:16px;">${score} pts</span>
          </div>` : ''}
        </div>

        <div class="le-fact">
          <div style="font-size:11px; font-weight:700; color:#7ba3e8; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:4px;">
            🔬 Dato real: ${fact.title}
          </div>
          ${fact.text}
        </div>

        <div class="le-action-row">
          ${btn('btn-retry', '🔄 Volver a jugar')}
          ${btn('btn-menu', '← Menú principal', 'le-btn-secondary')}
        </div>
      </div>
    `)

    // Animar barra de porcentaje
    requestAnimationFrame(() => {
      const fill = overlayEl.querySelector('#pct-fill') as HTMLElement | null
      if (fill) fill.style.width = pct + '%'
    })

    bindBtn('btn-retry', () => {
      showDifficulty()
    })
    bindBtn('btn-menu', showIntro)
  }

  // =========================================================================
  // Lógica del juego
  // =========================================================================

  function initGame() {
    head = { x: Math.floor(GRID.cols / 2), y: Math.floor(GRID.rows / 2) }
    direction = 'right'
    wagons = []
    wagonsToAdd = 0
    posHistory.length = 0
    posHistory.push({ ...head })

    samplesCollected = 0
    samplesDelivered = 0
    explorationTimeLeft = WORLD.explorationTime
    collisionFlashMs = 0
    phaseTransitionMs = 0
    particles = []
    inputBuffer = []
    rocket = null
    stepCount = 0

    // Usar semilla determinista derivada del seed del portal
    const seedNum = Math.abs([...ctx.seed].reduce((h, c) => Math.imul(h, 31) + c.charCodeAt(0) | 0, 0))
    rand = seededRandom(seedNum)

    obstacles = generateObstacles(cfg.obstacles, rand)
    samples = []
    spawnSample()
  }

  function spawnSample() {
    if (samplesCollected >= cfg.targetSamples) return
    const activeSamplePositions = samples.filter((s) => !s.taken).map((s) => s.pos)
    const occupied = buildOccupied(head, wagons, obstacles, activeSamplePositions)
    const pos = findFreePosition(rand, occupied)
    if (pos) {
      samples.push({ pos, phase: rng.range(0, Math.PI * 2), taken: false })
    }
  }

  function spawnRocket() {
    const activeSamplePositions = samples.filter((s) => !s.taken).map((s) => s.pos)
    const occupied = buildOccupied(head, wagons, obstacles, activeSamplePositions)
    const pos = findFreePosition(rand, occupied)
    if (pos) {
      rocket = { pos, thrusterPhase: 0 }
    }
  }

  function startExploration() {
    clearOverlay()
    phase = 'EXPLORATION'
    endGameFact = getEndGameFact()
    flash('¡Exploración iniciada!', 'info')
    sfx.sweep(440, 880, 300, 'triangle', 0.2)
    // Reiniciar HUD
    renderHUD()
  }

  function triggerReturn() {
    phase = 'RETURN'
    spawnRocket()
    phaseMessage = '¡Tiempo agotado! Regresa al cohete 🚀'
    phaseTransitionMs = 2500
    flash('¡Regresa al cohete!', 'info')
    // Sonido de aterrizaje del cohete: barrido grave + tono de motor
    sfx.sweep(80, 220, 700, 'sawtooth', 0.28)
    setTimeout(() => sfx.tone(140, 400, 'sine', 0.18), 300)
    setTimeout(() => sfx.sweep(220, 440, 500, 'triangle', 0.2), 700)
  }

  function triggerSuccess() {
    phase = 'SUCCESS'
    samplesDelivered = samplesCollected
    phaseTransitionMs = 1800

    // Partículas de celebración
    spawnCelebrationParticles()
    sfx.sweep(440, 880, 400, 'triangle', 0.25)
    sfx.tone(1046, 300, 'sine', 0.2)

    setTimeout(() => {
      showResults(true)
      reportComplete(true)
    }, 1800)
  }

  function triggerFailed(reason: string) {
    if (phase === 'FAILED') return
    phase = 'FAILED'
    samplesDelivered = 0
    collisionFlashMs = 400

    sfx.noise(300, 0.25)
    sfx.sweep(300, 80, 500, 'sawtooth', 0.2)
    flash('💥 ' + reason, 'bad')

    // Mostrar overlay de fallo inmediatamente sobre el canvas (sin salir de la pantalla)
    const pct = calcRecoveryPct(samplesCollected, samplesDelivered)
    const fact = endGameFact

    setTimeout(() => {
      showOverlay(`
        <div class="le-card" style="max-width:420px; text-align:center;">
          <div class="le-kicker">Resultado de la misión</div>
          <h2>💥 Misión fallida</h2>
          <div class="le-status-badge le-status-fail">☠️ ${reason}</div>

          <div style="margin:12px 0; text-align:left;">
            <div class="le-results-row">
              <span class="label">Dificultad</span>
              <span class="value">${cfg.label}</span>
            </div>
            <div class="le-results-row">
              <span class="label">Muestras recolectadas</span>
              <span class="value" style="color:#60a5fa;">${samplesCollected}</span>
            </div>
            <div class="le-results-row">
              <span class="label">Muestras entregadas</span>
              <span class="value" style="color:#f87171;">0</span>
            </div>
            <div class="le-results-row">
              <span class="label">Recuperación</span>
              <span class="value" style="color:#f87171;">${pct}%</span>
            </div>
          </div>

          <div class="le-fact">
            <div style="font-size:11px; font-weight:700; color:#7ba3e8; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:4px;">
              🔬 Dato real: ${fact.title}
            </div>
            ${fact.text}
          </div>

          <div class="le-action-row">
            ${btn('btn-retry-fail', '🔄 Reintentar')}
            ${btn('btn-menu-fail', '← Menú', 'le-btn-secondary')}
          </div>
        </div>
      `)
      bindBtn('btn-retry-fail', () => {
        cfg = DIFFICULTY_CONFIGS[difficulty]
        _completed = false
        initGame()
        clearOverlay()
        startExploration()
      })
      bindBtn('btn-menu-fail', () => {
        _completed = false
        showIntro()
      })
      reportComplete(false)
    }, 600)
  }

  let _completed = false
  function reportComplete(success: boolean) {
    if (_completed) return
    _completed = true
    const score = success
      ? calcScore({ samplesCollected, samplesDelivered, difficulty, missionSuccess: true })
      : 0
    ctx.onComplete({
      gameId: 'snake-express',
      levelId: ctx.levelId,
      score,
      durationMs: Math.round(performance.now()),
      completed: success,
      evidenceIds: success ? ['ev-lunar-samples', 'ev-lrv', 'ev-descent-stage'] : [],
      firstAnswerCorrect: success && samplesCollected >= cfg.targetSamples,
      decisions: [
        { concept: 'equipos-en-la-luna', correct: success },
        { concept: 'muestras-lunares', correct: samplesCollected > 0 },
      ],
    })
  }

  // ---- Movimiento ----------------------------------------------------------

  function step() {
    const nextHead = moveVec(head, direction)

    // Colisión con límites
    if (isOutOfBounds(nextHead)) {
      triggerFailed('Límite del escenario')
      return
    }

    // Colisión con obstáculos
    if (collidesWithObstacles(nextHead, obstacles)) {
      triggerFailed('Colisión con obstáculo')
      return
    }

    // Colisión con vagones propios (excepto si el tren está creciendo)
    // Ignorar la cola si no vamos a crecer (la cola se va a mover)
    const wagonsToCheck = wagonsToAdd > 0 ? wagons : wagons.slice(0, -1)
    if (collidesWithWagon(nextHead, wagonsToCheck)) {
      triggerFailed('Colisión con vagón propio')
      return
    }

    // Mover vagones: seguir historial de posiciones
    posHistory.unshift({ ...nextHead })
    if (posHistory.length > HISTORY_SIZE) posHistory.pop()

    // Crecer si hay vagones pendientes
    if (wagonsToAdd > 0) {
      wagonsToAdd--
      wagons.push({ ...head })
    } else if (wagons.length > 0) {
      // Los vagones siguen al anterior
      for (let i = wagons.length - 1; i > 0; i--) {
        wagons[i] = { ...wagons[i - 1]! }
      }
      wagons[0] = { ...head }
    }

    head = nextHead
    stepCount++  // para girar ruedas proporcional al movimiento real

    // ---- Recolección de muestras (solo en EXPLORATION) -------------------
    if (phase === 'EXPLORATION') {
      checkSamplePickup()
    }

    // ---- Entrega al cohete (solo en RETURN) ------------------------------
    if (phase === 'RETURN' && rocket && vecEquals(head, rocket.pos)) {
      triggerSuccess()
    }
  }

  function checkSamplePickup() {
    for (const sample of samples) {
      if (sample.taken) continue
      if (vecEquals(head, sample.pos)) {
        sample.taken = true
        samplesCollected++
        wagonsToAdd += cfg.wagonGrowth

        const flashText = getSampleFlash(samplesCollected)
        flash(flashText, 'ok')
        sfx.tone(660, 120, 'sine', 0.18)

        // Partículas de recolección
        spawnCollectParticles(sample.pos)

        // Generar nueva muestra si no se alcanzó el objetivo
        if (samplesCollected < cfg.targetSamples) {
          spawnSample()
        } else {
          flash('🎯 ¡Objetivo alcanzado!', 'info')
        }
        break
      }
    }
  }

  // =========================================================================
  // Partículas
  // =========================================================================

  function spawnCollectParticles(pos: Vec2) {
    if (reduced) return
    const cx = pos.x * WORLD.cell + WORLD.cell / 2
    const cy = pos.y * WORLD.cell + WORLD.cell / 2 + GRID.offsetY
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + rng.range(-0.3, 0.3)
      const speed = rng.range(40, 120)
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8, maxLife: 0.8,
        r: rng.range(2, 5),
        color: `hsl(${rng.range(200, 240)}, 80%, 70%)`,
      })
    }
  }

  function spawnCelebrationParticles() {
    if (reduced) return
    for (let i = 0; i < 40; i++) {
      const x = rng.range(WORLD.cell * 2, WORLD.width - WORLD.cell * 2)
      const y = rng.range(GRID.offsetY + WORLD.cell, WORLD.height - WORLD.cell)
      const angle = rng.range(-Math.PI, Math.PI)
      particles.push({
        x, y,
        vx: Math.cos(angle) * rng.range(30, 150),
        vy: Math.sin(angle) * rng.range(30, 150) - 60,
        life: 1.5, maxLife: 1.5,
        r: rng.range(3, 7),
        color: `hsl(${rng.range(50, 160)}, 90%, 65%)`,
      })
    }
  }

  // =========================================================================
  // Actualización del bucle
  // =========================================================================

  let frameTime = 0
  let hudDirty = true

  function update(dtMs: number) {
    if (phase !== 'EXPLORATION' && phase !== 'RETURN') return

    frameTime += dtMs

    // Animar muestras y cohete
    for (const s of samples) {
      if (!s.taken) s.phase += dtMs * 0.003
    }
    if (rocket) rocket.thrusterPhase += dtMs * 0.005

    // Actualizar partículas
    const dt = dtMs / 1000
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 80 * dt // gravedad leve
      if (p.life <= 0) particles.splice(i, 1)
    }

    // Temporizador de exploración
    if (phase === 'EXPLORATION') {
      explorationTimeLeft -= dtMs / 1000
      hudDirty = true
      if (explorationTimeLeft <= 0) {
        explorationTimeLeft = 0
        triggerReturn()
        return
      }
    }

    // Aviso de mensaje de fase
    if (phaseTransitionMs > 0) {
      phaseTransitionMs -= dtMs
    }

    // Movimiento discreto basado en intervalo
    const interval = cfg.moveIntervalMs
    while (frameTime >= interval) {
      frameTime -= interval
      if (phase === 'EXPLORATION' || phase === 'RETURN') {
        step()
      }
    }
  }

  // =========================================================================
  // HUD (actualizado solo cuando cambia algo)
  // =========================================================================

  let hudEl: HTMLElement | null = null

  function createHUD() {
    const existing = root.querySelector('#le-hud')
    if (existing) existing.remove()

    hudEl = document.createElement('div')
    hudEl.id = 'le-hud'
    hudEl.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0;
      height: ${GRID.offsetY}px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background: linear-gradient(180deg, rgba(8,12,26,0.95) 0%, rgba(8,12,26,0.8) 100%);
      border-bottom: 1px solid rgba(99,130,220,0.2);
      pointer-events: none;
      z-index: 5;
      gap: 8px;
      flex-wrap: wrap;
    `
    root.appendChild(hudEl)
    renderHUD()
  }

  function renderHUD() {
    if (!hudEl) return
    const timeLeft  = Math.max(0, Math.ceil(explorationTimeLeft))
    const timePct   = Math.max(0, explorationTimeLeft / WORLD.explorationTime)
    const timeColor = timeLeft <= 10 ? '#f87171' : timeLeft <= 20 ? '#f9a84d' : '#60a5fa'
    const timeBg    = timeLeft <= 10 ? 'rgba(248,80,80,0.18)' : timeLeft <= 20 ? 'rgba(249,168,77,0.15)' : 'rgba(96,165,250,0.12)'
    const isReturn  = phase === 'RETURN'
    const phaseColor = isReturn ? '#f9a84d' : '#60a5fa'
    const phaseBg    = isReturn ? 'rgba(249,168,77,0.15)' : 'rgba(96,165,250,0.12)'

    hudEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:800;letter-spacing:0.12em;color:#3b6fd4;text-transform:uppercase;text-shadow:0 0 8px rgba(59,111,212,0.5);">SNAKE EXPRESS</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">

        <!-- FASE -->
        <div style="background:${phaseBg};border:1px solid ${phaseColor}44;border-radius:20px;padding:4px 12px;display:flex;align-items:center;gap:5px;">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:${phaseColor};text-transform:uppercase;">${isReturn ? '🚀 REGRESO' : '🔭 EXPLORACIÓN'}</span>
        </div>

        <!-- TEMPORIZADOR -->
        ${!isReturn ? `
        <div style="background:${timeBg};border:1px solid ${timeColor}44;border-radius:20px;padding:4px 12px;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:70px;">
          <span style="font-size:16px;font-weight:800;color:${timeColor};font-variant-numeric:tabular-nums;line-height:1;text-shadow:0 0 10px ${timeColor}88;">${timeLeft}s</span>
          <div style="width:52px;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
            <div style="width:${Math.round(timePct*100)}%;height:100%;background:${timeColor};border-radius:2px;transition:width 0.5s;"></div>
          </div>
        </div>` : ''}

        <!-- MUESTRAS -->
        <div style="background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.3);border-radius:20px;padding:4px 12px;display:flex;align-items:center;gap:5px;">
          <span style="font-size:14px;">🔬</span>
          <span style="font-size:16px;font-weight:800;color:#60a5fa;text-shadow:0 0 8px rgba(96,165,250,0.5);">${samplesCollected}</span>
          <span style="font-size:12px;color:rgba(96,165,250,0.6);">/ ${cfg.targetSamples}</span>
        </div>

        <!-- VAGONES -->
        <div style="background:rgba(99,130,220,0.1);border:1px solid rgba(99,130,220,0.25);border-radius:20px;padding:4px 12px;display:flex;align-items:center;gap:5px;">
          <span style="font-size:14px;">🚗</span>
          <span style="font-size:15px;font-weight:700;color:#c8d4f0;">${wagons.length + 1}</span>
          <span style="font-size:11px;color:rgba(200,212,240,0.5);">vag.</span>
        </div>

        <!-- DIFICULTAD -->
        <div style="background:rgba(60,60,80,0.4);border:1px solid rgba(100,100,130,0.2);border-radius:20px;padding:4px 10px;">
          <span style="font-size:11px;font-weight:600;color:#7a8aaa;">${cfg.label}</span>
        </div>

      </div>
    `
    hudDirty = false
  }

  // =========================================================================
  // Renderizado del canvas
  // =========================================================================

  function resizeCanvas() {
    const box = canvasWrapper.getBoundingClientRect()
    if (box.width < 1 || box.height < 1) return
    const scaleX = box.width / WORLD.width
    const scaleY = box.height / WORLD.height
    const scale = Math.min(scaleX, scaleY, 1)

    const cssW = Math.floor(WORLD.width * scale)
    const cssH = Math.floor(WORLD.height * scale)
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    canvas.style.width = cssW + 'px'
    canvas.style.height = cssH + 'px'

    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr
      canvas.height = cssH * dpr
    }
    c.setTransform((cssW / WORLD.width) * dpr, 0, 0, (cssH / WORLD.height) * dpr, 0, 0)
  }

  const resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvasWrapper)
  resizeCanvas()

  function cellX(col: number) { return col * WORLD.cell }
  function cellY(row: number) { return row * WORLD.cell + GRID.offsetY }
  function cellCX(col: number) { return col * WORLD.cell + WORLD.cell / 2 }
  function cellCY(row: number) { return row * WORLD.cell + GRID.offsetY + WORLD.cell / 2 }

  function render(now: number) {
    const W = WORLD.width
    const H = WORLD.height
    const CS = WORLD.cell   // cell size alias

    // =========================================================================
    // FONDO: cielo nocturno lunar
    // =========================================================================
    const sky = c.createLinearGradient(0, 0, 0, GRID.offsetY + 20)
    sky.addColorStop(0, '#020409')
    sky.addColorStop(1, '#080f1e')
    c.fillStyle = sky
    c.fillRect(0, 0, W, GRID.offsetY + 20)

    // ---- Estrellas (solo en franja del HUD + 20 px de transición) ----------
    for (const s of stars) {
      const twinkle = reduced ? 0.75 : 0.5 + 0.5 * Math.sin(now * 0.0008 + s.twinkle)
      c.globalAlpha = twinkle * 0.85
      c.fillStyle = '#fff'
      c.beginPath()
      c.arc(s.x, s.y * (GRID.offsetY / WORLD.height), s.r, 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = 1

    // =========================================================================
    // SUPERFICIE LUNAR — 5 capas de profundidad
    // =========================================================================

    // Capa 1: cielo de fondo sobre la superficie (gradiente profundo)
    const bgSurf = c.createLinearGradient(0, GRID.offsetY, 0, H)
    bgSurf.addColorStop(0, '#0b0e1a')
    bgSurf.addColorStop(0.4, '#0f1220')
    bgSurf.addColorStop(1,   '#080b14')
    c.fillStyle = bgSurf
    c.fillRect(0, GRID.offsetY, W, H - GRID.offsetY)

    // Capa 2: montañas lejanas (silueta de baja frecuencia)
    c.fillStyle = 'rgba(18,22,40,0.9)'
    c.beginPath()
    c.moveTo(0, GRID.offsetY + 60)
    const mtnPts = [0,34,80,22,160,48,250,18,340,52,420,20,510,44,590,16,680,46,760,24,840,50,900,28,900, GRID.offsetY + 60]
    for (let i = 0; i < mtnPts.length; i += 2) {
      i === 0 ? c.moveTo(mtnPts[i]!, GRID.offsetY + mtnPts[i+1]!)
              : c.lineTo(mtnPts[i]!, GRID.offsetY + mtnPts[i+1]!)
    }
    c.lineTo(W, GRID.offsetY + 60)
    c.lineTo(0, GRID.offsetY + 60)
    c.closePath()
    c.fill()

    // Capa 3: suelo principal — regolito grisáceo con gradiente
    const regolith = c.createLinearGradient(0, GRID.offsetY + 55, 0, H)
    regolith.addColorStop(0,   '#292d3e')
    regolith.addColorStop(0.08,'#242736')
    regolith.addColorStop(0.3, '#1c1f2d')
    regolith.addColorStop(1,   '#13151f')
    c.fillStyle = regolith
    c.fillRect(0, GRID.offsetY + 55, W, H - GRID.offsetY - 55)

    // Capa 4: línea del horizonte con tono cálido (luz rasante)
    const horizon = c.createLinearGradient(0, GRID.offsetY + 48, 0, GRID.offsetY + 72)
    horizon.addColorStop(0, 'rgba(80,70,110,0.0)')
    horizon.addColorStop(0.4,'rgba(100,90,140,0.35)')
    horizon.addColorStop(1, 'rgba(80,70,110,0.0)')
    c.fillStyle = horizon
    c.fillRect(0, GRID.offsetY + 48, W, 24)

    // Capa 5: textura de polvo y cráteres pequeños de fondo (decorativa, estáticos)
    // — sólo pintamos los que caen en celdas vacías para no solapar obstáculos
    if (!reduced) {
      // Cráteres de fondo pequeños (precalcularíamos, pero como son derivados del
      // rand determinista los pintamos directamente con el mismo rand inicial)
      const bgRand = seededRandom(7777)
      for (let i = 0; i < 28; i++) {
        const bx = bgRand() * W
        const by = GRID.offsetY + 60 + bgRand() * (H - GRID.offsetY - 60)
        const br = 3 + bgRand() * 7
        c.save()
        c.globalAlpha = 0.18 + bgRand() * 0.12
        c.fillStyle = '#0a0c14'
        c.beginPath()
        c.ellipse(bx, by, br, br * 0.5, 0, 0, Math.PI * 2)
        c.fill()
        c.strokeStyle = 'rgba(60,65,90,0.4)'
        c.lineWidth = 0.8
        c.stroke()
        c.restore()
      }
      // Gravas sueltas
      const gravelRand = seededRandom(3333)
      for (let i = 0; i < 50; i++) {
        const gx = gravelRand() * W
        const gy = GRID.offsetY + 65 + gravelRand() * (H - GRID.offsetY - 65)
        c.globalAlpha = 0.12 + gravelRand() * 0.1
        c.fillStyle = '#3a3f52'
        c.beginPath()
        c.arc(gx, gy, 1 + gravelRand() * 2.5, 0, Math.PI * 2)
        c.fill()
      }
      c.globalAlpha = 1
    }

    // ---- Cuadrícula de referencia muy sutil --------------------------------
    c.strokeStyle = 'rgba(99,120,200,0.03)'
    c.lineWidth = 0.5
    for (let col = 0; col <= GRID.cols; col++) {
      c.beginPath(); c.moveTo(cellX(col), GRID.offsetY + 55); c.lineTo(cellX(col), H); c.stroke()
    }
    for (let row = 0; row <= GRID.rows; row++) {
      c.beginPath(); c.moveTo(0, cellY(row)); c.lineTo(W, cellY(row)); c.stroke()
    }

    // =========================================================================
    // OBSTÁCULOS
    // =========================================================================
    for (const o of obstacles) {
      const ox = cellX(o.pos.x)
      const oy = cellY(o.pos.y)

      if (o.kind === 'crater') {
        const cx2 = ox + CS / 2
        const cy2 = oy + CS * 0.6   // centrado bajo para parecer en el suelo
        const r   = CS * 0.44

        // Sombra exterior
        c.save()
        c.globalAlpha = 0.5
        c.fillStyle = 'rgba(0,0,0,0.6)'
        c.beginPath()
        c.ellipse(cx2 + 2, cy2 + 4, r + 3, (r + 3) * 0.45, 0, 0, Math.PI * 2)
        c.fill()
        c.restore()

        // Suelo interior oscuro
        c.fillStyle = '#07090f'
        c.beginPath()
        c.ellipse(cx2, cy2, r, r * 0.55, 0, 0, Math.PI * 2)
        c.fill()

        // Borde exterior (aro de impacto)
        const rimGrad = c.createRadialGradient(cx2, cy2, r * 0.6, cx2, cy2, r + 4)
        rimGrad.addColorStop(0, 'rgba(50,55,80,0)')
        rimGrad.addColorStop(0.7,'rgba(55,60,90,0.6)')
        rimGrad.addColorStop(1, 'rgba(40,45,65,0)')
        c.fillStyle = rimGrad
        c.beginPath()
        c.ellipse(cx2, cy2, r + 4, (r + 4) * 0.55, 0, 0, Math.PI * 2)
        c.fill()

        // Reflejo interior (luz rasante)
        c.save()
        c.globalAlpha = 0.22
        c.fillStyle = '#8090c0'
        c.beginPath()
        c.ellipse(cx2 - r * 0.3, cy2 - r * 0.2, r * 0.35, r * 0.15, -0.4, 0, Math.PI * 2)
        c.fill()
        c.restore()

      } else {
        // Roca — más voluminosa y con múltiples facetas
        c.save()
        // Sombra
        c.globalAlpha = 0.4
        c.fillStyle = 'rgba(0,0,0,0.5)'
        c.beginPath()
        c.ellipse(ox + CS * 0.5 + 3, oy + CS * 0.88, CS * 0.38, CS * 0.09, 0, 0, Math.PI * 2)
        c.fill()
        c.restore()

        // Cuerpo base (gris oscuro)
        c.fillStyle = '#3c4056'
        c.beginPath()
        c.moveTo(ox + CS * 0.08, oy + CS * 0.88)
        c.lineTo(ox + CS * 0.22, oy + CS * 0.35)
        c.lineTo(ox + CS * 0.42, oy + CS * 0.10)
        c.lineTo(ox + CS * 0.65, oy + CS * 0.08)
        c.lineTo(ox + CS * 0.85, oy + CS * 0.28)
        c.lineTo(ox + CS * 0.92, oy + CS * 0.62)
        c.lineTo(ox + CS * 0.80, oy + CS * 0.88)
        c.closePath()
        c.fill()

        // Cara iluminada (arriba-izquierda)
        c.fillStyle = '#52586e'
        c.beginPath()
        c.moveTo(ox + CS * 0.22, oy + CS * 0.35)
        c.lineTo(ox + CS * 0.42, oy + CS * 0.10)
        c.lineTo(ox + CS * 0.65, oy + CS * 0.08)
        c.lineTo(ox + CS * 0.50, oy + CS * 0.30)
        c.lineTo(ox + CS * 0.30, oy + CS * 0.42)
        c.closePath()
        c.fill()

        // Resalte especular
        c.fillStyle = 'rgba(220,230,255,0.12)'
        c.beginPath()
        c.moveTo(ox + CS * 0.42, oy + CS * 0.10)
        c.lineTo(ox + CS * 0.56, oy + CS * 0.06)
        c.lineTo(ox + CS * 0.46, oy + CS * 0.22)
        c.closePath()
        c.fill()

        // Borde
        c.strokeStyle = 'rgba(150,160,200,0.2)'
        c.lineWidth = 0.8
        c.stroke()
      }
    }

    // =========================================================================
    // MUESTRAS CIENTÍFICAS
    // =========================================================================
    for (const s of samples) {
      if (s.taken) continue
      const sx = cellCX(s.pos.x)
      const sy = cellCY(s.pos.y)
      const bob   = reduced ? 0 : Math.sin(s.phase) * 3.5
      const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(s.phase * 1.3)

      // Halo exterior pulsante
      const halo = c.createRadialGradient(sx, sy + bob, 0, sx, sy + bob, CS * 0.75)
      halo.addColorStop(0,   'rgba(96,165,250,0.30)')
      halo.addColorStop(0.6, 'rgba(96,165,250,0.10)')
      halo.addColorStop(1,   'rgba(96,165,250,0)')
      c.save()
      c.globalAlpha = pulse
      c.fillStyle = halo
      c.beginPath()
      c.arc(sx, sy + bob, CS * 0.75, 0, Math.PI * 2)
      c.fill()
      c.restore()

      // Núcleo de roca lunar (gradiente radial azul-celeste)
      const core = c.createRadialGradient(sx - CS*0.08, sy + bob - CS*0.08, 0, sx, sy + bob, CS * 0.34)
      core.addColorStop(0,   '#d4eeff')
      core.addColorStop(0.4, '#7ec8ff')
      core.addColorStop(0.75,'#3b82f6')
      core.addColorStop(1,   '#1e40af')
      c.fillStyle = core
      c.beginPath()
      c.arc(sx, sy + bob, CS * 0.33, 0, Math.PI * 2)
      c.fill()

      // Contorno tenue
      c.strokeStyle = 'rgba(147,197,253,0.6)'
      c.lineWidth = 1.2
      c.stroke()

      // Destello especular
      c.fillStyle = 'rgba(255,255,255,0.75)'
      c.beginPath()
      c.arc(sx - CS * 0.09, sy + bob - CS * 0.10, CS * 0.07, 0, Math.PI * 2)
      c.fill()

      // Sombra en el suelo
      c.save()
      c.globalAlpha = 0.25
      c.fillStyle = '#000'
      c.beginPath()
      c.ellipse(sx, sy + CS * 0.35, CS * 0.2, CS * 0.06, 0, 0, Math.PI * 2)
      c.fill()
      c.restore()
    }

    // =========================================================================
    // COHETE (fase RETURN)
    // =========================================================================
    if (rocket) {
      const rx  = cellCX(rocket.pos.x)
      const ry  = cellCY(rocket.pos.y)
      const t   = rocket.thrusterPhase
      const flk = reduced ? 0 : Math.sin(t * 11) * 0.9 + Math.sin(t * 7) * 0.6  // llama irregular

      // Resplandor de aterrizaje en el suelo
      const landGlow = c.createRadialGradient(rx, ry + CS * 0.6, 0, rx, ry + CS * 0.6, CS * 2.2)
      landGlow.addColorStop(0,   'rgba(255,160,40,0.28)')
      landGlow.addColorStop(0.5, 'rgba(255,100,20,0.10)')
      landGlow.addColorStop(1,   'rgba(255,80,20,0)')
      c.fillStyle = landGlow
      c.beginPath()
      c.arc(rx, ry + CS * 0.6, CS * 2.2, 0, Math.PI * 2)
      c.fill()

      // Pulso de indicador de destino (anillo)
      const pulsePhase = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(now * 0.003)
      c.save()
      c.globalAlpha = pulsePhase * 0.5
      c.strokeStyle = '#f9a84d'
      c.lineWidth = 2.5
      c.beginPath()
      c.arc(rx, ry, CS * (1.5 + pulsePhase * 0.3), 0, Math.PI * 2)
      c.stroke()
      c.restore()

      // Llamas del motor (3 flujos escalonados)
      const flameBase = ry + CS * 0.55
      for (let fi = 0; fi < 3; fi++) {
        const fw  = CS * (0.22 - fi * 0.04)
        const fh  = CS * (0.55 + fi * 0.12 + (reduced ? 0 : flk * 0.08))
        const fox = rx + (fi - 1) * CS * 0.14
        const col0 = fi === 0 ? '#fff9e0' : fi === 1 ? '#ffb830' : '#ff6a00'
        const col1 = fi === 0 ? '#ffcc44' : fi === 1 ? '#ff7800' : '#cc2200'
        const flameGrad = c.createLinearGradient(fox, flameBase, fox, flameBase + fh)
        flameGrad.addColorStop(0, col0)
        flameGrad.addColorStop(0.6, col1)
        flameGrad.addColorStop(1,   'rgba(200,0,0,0)')
        c.fillStyle = flameGrad
        c.beginPath()
        c.moveTo(fox - fw, flameBase)
        c.bezierCurveTo(fox - fw, flameBase + fh * 0.6, fox, flameBase + fh, fox, flameBase + fh)
        c.bezierCurveTo(fox, flameBase + fh, fox + fw, flameBase + fh * 0.6, fox + fw, flameBase)
        c.closePath()
        c.fill()
      }

      // Plataforma base del cohete
      c.fillStyle = '#8a9ab8'
      c.beginPath()
      c.moveTo(rx - CS * 0.52, ry + CS * 0.55)
      c.lineTo(rx + CS * 0.52, ry + CS * 0.55)
      c.lineTo(rx + CS * 0.42, ry + CS * 0.46)
      c.lineTo(rx - CS * 0.42, ry + CS * 0.46)
      c.closePath()
      c.fill()

      // Aletas (grandes, triangulares)
      c.fillStyle = '#c0c8da'
      // Aleta izquierda
      c.beginPath()
      c.moveTo(rx - CS * 0.30, ry + CS * 0.46)
      c.lineTo(rx - CS * 0.52, ry + CS * 0.56)
      c.lineTo(rx - CS * 0.30, ry + CS * 0.10)
      c.closePath()
      c.fill()
      // Aleta derecha
      c.beginPath()
      c.moveTo(rx + CS * 0.30, ry + CS * 0.46)
      c.lineTo(rx + CS * 0.52, ry + CS * 0.56)
      c.lineTo(rx + CS * 0.30, ry + CS * 0.10)
      c.closePath()
      c.fill()

      // Cuerpo cilíndrico
      const bodyGrad = c.createLinearGradient(rx - CS * 0.28, 0, rx + CS * 0.28, 0)
      bodyGrad.addColorStop(0,   '#9aaac8')
      bodyGrad.addColorStop(0.3, '#e8ecf8')
      bodyGrad.addColorStop(0.65,'#c8d0e4')
      bodyGrad.addColorStop(1,   '#7a88a0')
      c.fillStyle = bodyGrad
      c.beginPath()
      c.roundRect(rx - CS * 0.28, ry - CS * 0.5, CS * 0.56, CS * 1.0, [4, 4, 0, 0])
      c.fill()
      c.strokeStyle = 'rgba(200,210,240,0.3)'
      c.lineWidth = 1
      c.stroke()

      // Ojiva (punta)
      const noseGrad = c.createLinearGradient(rx - CS * 0.28, 0, rx + CS * 0.28, 0)
      noseGrad.addColorStop(0,   '#d04040')
      noseGrad.addColorStop(0.4, '#f06060')
      noseGrad.addColorStop(1,   '#a03030')
      c.fillStyle = noseGrad
      c.beginPath()
      c.moveTo(rx, ry - CS * 1.0)
      c.bezierCurveTo(rx - CS * 0.04, ry - CS * 0.76, rx - CS * 0.28, ry - CS * 0.62, rx - CS * 0.28, ry - CS * 0.5)
      c.lineTo(rx + CS * 0.28, ry - CS * 0.5)
      c.bezierCurveTo(rx + CS * 0.28, ry - CS * 0.62, rx + CS * 0.04, ry - CS * 0.76, rx, ry - CS * 1.0)
      c.closePath()
      c.fill()

      // Ventana circular
      c.fillStyle = '#1e3a5f'
      c.beginPath()
      c.arc(rx, ry - CS * 0.14, CS * 0.13, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = '#93c5fd'
      c.lineWidth = 1.5
      c.stroke()
      // Reflejo en ventana
      c.fillStyle = 'rgba(147,197,253,0.5)'
      c.beginPath()
      c.arc(rx - CS * 0.04, ry - CS * 0.19, CS * 0.05, 0, Math.PI * 2)
      c.fill()

      // Banda horizontal decorativa
      c.fillStyle = 'rgba(59,111,212,0.6)'
      c.fillRect(rx - CS * 0.28, ry + CS * 0.08, CS * 0.56, CS * 0.07)

      // Etiqueta BASE
      c.fillStyle = '#f9a84d'
      c.font = `bold ${Math.round(CS * 0.28)}px system-ui`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText('BASE', rx, ry + CS * 0.9)
      c.textBaseline = 'alphabetic'
    }

    // =========================================================================
    // CARRITO (vagones + cabeza)
    // =========================================================================
    const wheelAngle = (stepCount * Math.PI * 2) / 4   // una vuelta completa cada 4 pasos
    const WHEEL_R = CS * 0.19     // rueda notablemente más grande
    const WAGON_W = CS * 0.72
    const WAGON_H = CS * 0.46

    // Función para dibujar una rueda con detalle
    function drawWheel(wx: number, wy: number, angle: number, dim = false) {
      // Llanta exterior
      c.fillStyle = dim ? '#1a1c28' : '#1e2235'
      c.beginPath()
      c.arc(wx, wy, WHEEL_R, 0, Math.PI * 2)
      c.fill()

      // Banda de rodadura (anillo gris)
      c.strokeStyle = dim ? 'rgba(80,88,110,0.7)' : 'rgba(100,112,145,0.9)'
      c.lineWidth = WHEEL_R * 0.28
      c.beginPath()
      c.arc(wx, wy, WHEEL_R * 0.76, 0, Math.PI * 2)
      c.stroke()

      // Radios (3)
      c.strokeStyle = dim ? 'rgba(90,100,130,0.5)' : 'rgba(160,175,215,0.75)'
      c.lineWidth = 1.4
      for (let sp = 0; sp < 3; sp++) {
        const a = angle + (sp / 3) * Math.PI * 2
        c.beginPath()
        c.moveTo(wx + Math.cos(a) * WHEEL_R * 0.22, wy + Math.sin(a) * WHEEL_R * 0.22)
        c.lineTo(wx + Math.cos(a) * WHEEL_R * 0.70, wy + Math.sin(a) * WHEEL_R * 0.70)
        c.stroke()
      }

      // Buje central
      c.fillStyle = dim ? '#3a3e55' : '#5a6080'
      c.beginPath()
      c.arc(wx, wy, WHEEL_R * 0.22, 0, Math.PI * 2)
      c.fill()
    }

    // Vagones (de cola a cabeza para que la cabeza quede encima)
    for (let i = wagons.length - 1; i >= 0; i--) {
      const w  = wagons[i]!
      const wx = cellCX(w.x)
      const wy = cellCY(w.y)
      // Color: azul oscuro en la cola, más brillante cerca de la cabeza
      const t  = i / Math.max(1, wagons.length)
      const rr = Math.round(20 + t * 25)
      const gg = Math.round(70 + t * 40)
      const bb = Math.round(160 + t * 45)
      const bodyY = wy - WAGON_H * 0.5

      // Sombra del vagón
      c.fillStyle = 'rgba(0,0,0,0.3)'
      c.beginPath()
      c.ellipse(wx, wy + WAGON_H * 0.52, WAGON_W * 0.42, CS * 0.07, 0, 0, Math.PI * 2)
      c.fill()

      // Ruedas del vagón (antes del cuerpo para que queden detrás)
      const wAngle = reduced ? 0 : wheelAngle
      drawWheel(wx - WAGON_W * 0.3, wy + WAGON_H * 0.2, wAngle, true)
      drawWheel(wx + WAGON_W * 0.3, wy + WAGON_H * 0.2, wAngle, true)

      // Cuerpo del vagón
      c.fillStyle = `rgb(${rr},${gg},${bb})`
      c.beginPath()
      c.roundRect(wx - WAGON_W / 2, bodyY, WAGON_W, WAGON_H, 4)
      c.fill()
      c.strokeStyle = `rgba(${rr + 60},${gg + 60},${bb + 40},0.5)`
      c.lineWidth = 1
      c.stroke()

      // Contenedor de muestra (rectángulo interno)
      c.fillStyle = `rgba(${rr + 30},${gg + 30},${bb + 20},0.4)`
      c.beginPath()
      c.roundRect(wx - WAGON_W * 0.28, bodyY + WAGON_H * 0.2, WAGON_W * 0.56, WAGON_H * 0.5, 2)
      c.fill()

      // Número de vagón (pequeño)
      c.fillStyle = 'rgba(200,220,255,0.55)'
      c.font = `bold ${Math.round(CS * 0.2)}px system-ui`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText(String(wagons.length - i), wx, wy - WAGON_H * 0.05)
      c.textBaseline = 'alphabetic'
    }

    // ---- Cabeza del carrito ------------------------------------------------
    {
      const hx = cellCX(head.x)
      const hy = cellCY(head.y)
      const HEAD_W = CS * 0.80
      const HEAD_H = CS * 0.50
      const bodyTop = hy - HEAD_H * 0.45

      // Flash de colisión
      if (collisionFlashMs > 0) {
        c.fillStyle = `rgba(248,80,80,${Math.min(1, collisionFlashMs / 180) * 0.55})`
        c.beginPath()
        c.arc(hx, hy, CS * 0.85, 0, Math.PI * 2)
        c.fill()
        collisionFlashMs -= 16
      }

      // Sombra en el suelo
      c.fillStyle = 'rgba(0,0,0,0.35)'
      c.beginPath()
      c.ellipse(hx, hy + HEAD_H * 0.56, HEAD_W * 0.46, CS * 0.08, 0, 0, Math.PI * 2)
      c.fill()

      // Ruedas de la cabeza (notorias, delante del cuerpo)
      const hAngle = reduced ? 0 : wheelAngle
      drawWheel(hx - HEAD_W * 0.33, hy + HEAD_H * 0.18, hAngle)
      drawWheel(hx + HEAD_W * 0.33, hy + HEAD_H * 0.18, hAngle)

      // Chasis / bastidor inferior
      c.fillStyle = '#8a9ab2'
      c.beginPath()
      c.roundRect(hx - HEAD_W * 0.42, hy, HEAD_W * 0.84, HEAD_H * 0.22, 2)
      c.fill()

      // Panel solar (ancho, encima del cuerpo)
      const panelGrad = c.createLinearGradient(hx, bodyTop - CS * 0.17, hx, bodyTop)
      panelGrad.addColorStop(0, '#1a3fb5')
      panelGrad.addColorStop(0.5,'#2255d8')
      panelGrad.addColorStop(1, '#1a3fb5')
      c.fillStyle = panelGrad
      c.beginPath()
      c.roundRect(hx - HEAD_W * 0.46, bodyTop - CS * 0.17, HEAD_W * 0.92, CS * 0.17, 2)
      c.fill()
      // Separadores de celda solar
      c.strokeStyle = 'rgba(96,165,250,0.6)'
      c.lineWidth = 0.8
      for (let p = 1; p < 5; p++) {
        const px = hx - HEAD_W * 0.46 + (HEAD_W * 0.92 / 5) * p
        c.beginPath()
        c.moveTo(px, bodyTop - CS * 0.17)
        c.lineTo(px, bodyTop)
        c.stroke()
      }
      // Reflejo en el panel
      c.fillStyle = 'rgba(150,190,255,0.12)'
      c.beginPath()
      c.roundRect(hx - HEAD_W * 0.44, bodyTop - CS * 0.15, HEAD_W * 0.3, CS * 0.07, 1)
      c.fill()

      // Cuerpo principal (cabina)
      const bodyGrad = c.createLinearGradient(hx - HEAD_W * 0.42, 0, hx + HEAD_W * 0.42, 0)
      bodyGrad.addColorStop(0,   '#8a98b8')
      bodyGrad.addColorStop(0.3, '#d8dff0')
      bodyGrad.addColorStop(0.7, '#c0c8dc')
      bodyGrad.addColorStop(1,   '#8090a8')
      c.fillStyle = bodyGrad
      c.beginPath()
      c.roundRect(hx - HEAD_W * 0.42, bodyTop, HEAD_W * 0.84, HEAD_H * 0.72, 5)
      c.fill()
      c.strokeStyle = 'rgba(200,215,245,0.4)'
      c.lineWidth = 1
      c.stroke()

      // Cúpula / ventana delantera (orientada en dirección de movimiento)
      const domeR = CS * 0.165
      const domeX = direction === 'right' ? hx + HEAD_W * 0.12
                  : direction === 'left'  ? hx - HEAD_W * 0.12
                  : hx
      const domeY = bodyTop + HEAD_H * 0.08
      const domeGrad = c.createRadialGradient(domeX - domeR * 0.3, domeY - domeR * 0.3, 0, domeX, domeY, domeR)
      domeGrad.addColorStop(0, '#d0eeff')
      domeGrad.addColorStop(0.4,'#5baee8')
      domeGrad.addColorStop(1,  '#1a3a6a')
      c.fillStyle = domeGrad
      c.beginPath()
      c.arc(domeX, domeY, domeR, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = 'rgba(147,197,253,0.7)'
      c.lineWidth = 1.2
      c.stroke()
      // Reflejo
      c.fillStyle = 'rgba(255,255,255,0.55)'
      c.beginPath()
      c.arc(domeX - domeR * 0.3, domeY - domeR * 0.3, domeR * 0.28, 0, Math.PI * 2)
      c.fill()

      // Mástil de antena
      const antX = direction === 'left' ? hx - HEAD_W * 0.3 : hx + HEAD_W * 0.3
      c.strokeStyle = '#9daac8'
      c.lineWidth = 1.5
      c.beginPath()
      c.moveTo(antX, bodyTop)
      c.lineTo(antX, bodyTop - CS * 0.32)
      // Brazo horizontal
      c.moveTo(antX, bodyTop - CS * 0.26)
      c.lineTo(antX + CS * 0.1 * (direction === 'left' ? -1 : 1), bodyTop - CS * 0.32)
      c.stroke()
      // Bola de antena
      c.fillStyle = '#f9a84d'
      c.beginPath()
      c.arc(antX, bodyTop - CS * 0.32, CS * 0.055, 0, Math.PI * 2)
      c.fill()
    }

    // =========================================================================
    // PARTÍCULAS
    // =========================================================================
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife)
      c.globalAlpha = alpha
      c.fillStyle = p.color
      c.beginPath()
      c.arc(p.x, p.y, Math.max(0.1, p.r * alpha), 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = 1

    // =========================================================================
    // MENSAJE DE TRANSICIÓN DE FASE
    // =========================================================================
    if (phaseTransitionMs > 0 && phaseMessage) {
      const alpha = Math.min(1, phaseTransitionMs / 500)
      c.save()
      c.globalAlpha = alpha
      // Fondo difuminado
      c.fillStyle = 'rgba(4,8,20,0.72)'
      c.fillRect(0, H / 2 - 32, W, 64)
      // Líneas decorativas
      c.strokeStyle = 'rgba(249,168,77,0.4)'
      c.lineWidth = 1
      c.beginPath(); c.moveTo(0, H / 2 - 32); c.lineTo(W, H / 2 - 32); c.stroke()
      c.beginPath(); c.moveTo(0, H / 2 + 32); c.lineTo(W, H / 2 + 32); c.stroke()
      // Texto
      c.fillStyle = '#f9a84d'
      c.font = `bold ${Math.round(CS * 0.6)}px system-ui`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText(phaseMessage, W / 2, H / 2)
      c.textBaseline = 'alphabetic'
      c.restore()
    }

    // HUD (re-renderizar si está sucio)
    if (hudDirty) renderHUD()
  }

  // =========================================================================
  // Controles táctiles
  // =========================================================================

  const touchPad = document.createElement('div')
  touchPad.style.cssText = `
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: none;
    gap: 4px;
    z-index: 15;
    pointer-events: auto;
  `
  root.appendChild(touchPad)

  // Solo mostrar en dispositivos táctiles
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
  if (isTouchDevice) {
    touchPad.style.display = 'grid'
    touchPad.style.gridTemplateColumns = 'repeat(3, 44px)'
    touchPad.style.gridTemplateRows = 'repeat(3, 44px)'

    const dPad: Array<{ label: string; dir: Direction | null; row: number; col: number }> = [
      { label: '▲', dir: 'up', row: 1, col: 2 },
      { label: '◄', dir: 'left', row: 2, col: 1 },
      { label: '●', dir: null, row: 2, col: 2 },
      { label: '►', dir: 'right', row: 2, col: 3 },
      { label: '▼', dir: 'down', row: 3, col: 2 },
    ]

    for (const d of dPad) {
      const btn2 = document.createElement('button')
      btn2.textContent = d.label
      btn2.style.cssText = `
        grid-row: ${d.row};
        grid-column: ${d.col};
        background: rgba(99,130,220,0.2);
        border: 1px solid rgba(99,130,220,0.4);
        border-radius: 8px;
        color: #c8d4f0;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      `
      if (d.dir) {
          const dir = d.dir
          btn2.addEventListener('touchstart', (e) => {
            e.preventDefault()
            if (phase === 'EXPLORATION' || phase === 'RETURN') {
              if (!isOpposite(dir, direction)) {
                direction = dir
              }
            }
          }, { passive: false })
        }
      touchPad.appendChild(btn2)
    }
  }

  // =========================================================================
  // Input de teclado
  // =========================================================================

  // Capturamos keydown directamente (no a través de onPress) para aplicar
  // la dirección sin esperar al siguiente step(). Así el carrito responde
  // en el frame siguiente, no al cabo de hasta moveIntervalMs ms.
  const onKeyDownDir = (e: KeyboardEvent) => {
    if (e.repeat) return
    if (phase !== 'EXPLORATION' && phase !== 'RETURN') return
    let dir: Direction | null = null
    if (e.code === 'ArrowUp'    || e.code === 'KeyW') dir = 'up'
    else if (e.code === 'ArrowDown'  || e.code === 'KeyS') dir = 'down'
    else if (e.code === 'ArrowLeft'  || e.code === 'KeyA') dir = 'left'
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') dir = 'right'

    if (dir && !isOpposite(dir, direction)) {
      // Aplicar de inmediato y también guardar en buffer por si llega
      // otro giro antes de que step() se ejecute.
      direction = dir
      inputBuffer.length = 0   // descartar cualquier entrada previa obsoleta
    }
  }
  window.addEventListener('keydown', onKeyDownDir)

  // Tecla P para pausa; bloquear flechas para evitar scroll de página
  const onKeyDown = (e: KeyboardEvent) => {
    // Prevenir scroll en el navegador durante el juego
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.key)) {
      e.preventDefault()
    }
    if (e.code === 'KeyP' && (phase === 'EXPLORATION' || phase === 'RETURN')) {
      togglePause()
    }
  }
  window.addEventListener('keydown', onKeyDown)

  // Pausa al perder visibilidad
  const onVisibility = () => {
    if (document.hidden && (phase === 'EXPLORATION' || phase === 'RETURN')) {
      if (!loopPaused) togglePause()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  // =========================================================================
  // Pausa
  // =========================================================================

  let loopPaused = false
  let prePausePhase: GamePhase = 'EXPLORATION'

  function togglePause() {
    if (loopPaused) {
      loopPaused = false
      loop.resume()
      clearOverlay()
      phase = prePausePhase
    } else {
      loopPaused = true
      loop.pause()
      prePausePhase = phase
      phase = 'PAUSED'
      showOverlay(`
        <div class="le-card" style="text-align:center;max-width:320px;">
          <h2>⏸ Pausa</h2>
          <p>La misión está en espera.</p>
          <div style="display:flex;gap:10px;justify-content:center;">
            ${btn('btn-resume', '▶ Continuar')}
            ${btn('btn-quit-pause', '← Menú', 'le-btn-secondary')}
          </div>
        </div>
      `)
      bindBtn('btn-resume', togglePause)
      bindBtn('btn-quit-pause', () => {
        loopPaused = false
        loop.resume()
        showIntro()
      })
    }
  }

  // =========================================================================
  // Bucle principal
  // =========================================================================

  createHUD()
  hudEl!.style.display = 'none' // ocultar HUD hasta que empiece el juego

  const loop = createLoop((dtMs) => {
    update(dtMs)
    render(performance.now())
    if (hudEl && (phase === 'EXPLORATION' || phase === 'RETURN') && hudEl.style.display === 'none') {
      hudEl.style.display = 'flex'
    }
  })

  loop.start()
  showIntro()

  // =========================================================================
  // Contrato del portal: GameController
  // =========================================================================

  return {
    pause() {
      if (!loopPaused && (phase === 'EXPLORATION' || phase === 'RETURN')) {
        loopPaused = true
        loop.pause()
        prePausePhase = phase
        phase = 'PAUSED'
      }
    },
    resume() {
      if (loopPaused) {
        loopPaused = false
        loop.resume()
        phase = prePausePhase
        clearOverlay()
      }
    },
    destroy() {
      loop.stop()
      window.removeEventListener('keydown', onKeyDownDir)
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibility)
      sfx.destroy()
      resizeObserver.disconnect()
      for (const t of activeFlashTimers) window.clearTimeout(t)
      activeFlashTimers.length = 0
      root.remove()
      return Promise.resolve()
    },
  }
}

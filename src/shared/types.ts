/**
 * CONTRATO DE INTEGRACION - Orbita Arcade
 * -------------------------------------------------------------------------
 * Este archivo es el unico punto de acuerdo entre el portal (shell) y los
 * tres modulos de juego. Nadie lo modifica sin avisar al integrador (Kevin).
 *
 * Regla de oro del plan: las tres parejas implementan `mountGame` con esta
 * firma ANTES de anadir efectos, arte o sonido.
 */

export type GameId = 'opportunity' | 'lunar-signals' | 'spirit'
export type LevelId = 1 | 2 | 3
export type Lang = 'es' | 'en'

/** Ajustes globales que el portal entrega a cada juego. */
export interface GameSettings {
  /** 0..1 — volumen maestro. 0 equivale a silencio total. */
  volume: number
  /** true => sin parallax, sin animaciones decorativas, sin sacudidas. */
  reducedMotion: boolean
  /** Modo practica: sin reloj ni limite de movimientos. No puntua. */
  practice: boolean
  lang: Lang
}

/**
 * Resultado tipado de una partida. El portal lo procesa UNA SOLA VEZ por
 * partida; un reintento genera una partida nueva con su propio resultado.
 */
export interface GameResult {
  gameId: GameId
  levelId: LevelId
  /** Puntos del nivel. Entero >= 0. */
  score: number
  durationMs: number
  /** false cuando el jugador perdio o abandono. */
  completed: boolean
  /** Ids de evidencia cientifica desbloqueada (ver src/content/missions.ts). */
  evidenceIds: string[]
  /** Para la validacion educativa: acerto la decision al primer intento. */
  firstAnswerCorrect: boolean
}

/** Contexto que recibe el juego al montarse. */
export interface GameContext {
  gameId: GameId
  levelId: LevelId
  /** Semilla determinista: permite reproducir un fallo exacto. */
  seed: string
  settings: GameSettings
  /** Se invoca al terminar la partida (ganada o perdida). */
  onComplete: (result: GameResult) => void
  /** Se invoca cuando el juego pide volver al portal por su cuenta. */
  onExit: () => void
}

/** Controlador devuelto por mountGame. El portal lo usa para gobernar el ciclo de vida. */
export interface GameController {
  pause: () => void
  resume: () => void
  /**
   * Debe detener audio, timers y listeners, destruir la instancia de Phaser y
   * resolver SOLO cuando el canvas ya no existe en el DOM.
   * El portal espera esta promesa antes de montar otro juego.
   */
  destroy: () => Promise<void>
}

export type MountGame = (
  container: HTMLElement,
  context: GameContext,
) => Promise<GameController> | GameController

/** Firma del modulo que exporta cada carpeta src/games/<id>/index.ts */
export interface GameModule {
  mountGame: MountGame
}

// ---------------------------------------------------------------------------
// Progreso persistido
// ---------------------------------------------------------------------------

export const PROGRESS_SCHEMA_VERSION = 1

export interface GameProgress {
  /** Niveles completados, p.ej. [1, 2] */
  levelsCompleted: LevelId[]
  /** Mejor puntuacion por nivel. */
  bestScore: Partial<Record<LevelId, number>>
}

export interface Progress {
  schemaVersion: number
  games: Record<GameId, GameProgress>
  /** Recuerdos (fichas de mision) desbloqueados. El pasaporte cuenta esto. */
  memories: GameId[]
  /** Evidencias cientificas vistas. */
  evidence: string[]
  settings: GameSettings
  updatedAt: string
}

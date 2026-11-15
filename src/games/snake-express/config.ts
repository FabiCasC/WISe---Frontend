/**
 * SNAKE EXPRESS — Configuración centralizada
 * -------------------------------------------------------------------------
 * Todos los parámetros de balance viven aquí. Cambiar el juego no requiere
 * tocar el motor: solo ajustar estas constantes.
 */

export type Difficulty = 'easy' | 'medium' | 'expert'

export interface DifficultyConfig {
  label: string
  description: string
  targetSamples: number
  speedMultiplier: number
  obstacles: number
  /** Celdas de vagón que crece por muestra */
  wagonGrowth: number
  /** Intervalo base de movimiento en ms */
  moveIntervalMs: number
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Fácil',
    description: 'Perfecto para empezar la misión',
    targetSamples: 8,
    speedMultiplier: 1.0,
    obstacles: 3,
    wagonGrowth: 1,
    moveIntervalMs: 200,
  },
  medium: {
    label: 'Intermedio',
    description: 'Mayor desafío, más descubrimientos',
    targetSamples: 12,
    speedMultiplier: 1.2,
    obstacles: 6,
    wagonGrowth: 1,
    moveIntervalMs: 167,
  },
  expert: {
    label: 'Experto',
    description: 'Misión de alta complejidad',
    targetSamples: 16,
    speedMultiplier: 1.4,
    obstacles: 9,
    wagonGrowth: 1,
    moveIntervalMs: 143,
  },
}

/** Dimensiones del mundo lógico */
export const WORLD = {
  width: 900,
  height: 540,
  /** Tamaño de cada celda de la cuadrícula */
  cell: 36,
  /** Tiempo de exploración en segundos */
  explorationTime: 60,
  /** Margen del área de juego en celdas */
  hudHeight: 56,
} as const

/** Columnas y filas disponibles para el área de juego */
export const GRID = {
  cols: Math.floor(WORLD.width / WORLD.cell),                              // 25
  rows: Math.floor((WORLD.height - WORLD.hudHeight) / WORLD.cell),         // 13
  offsetY: WORLD.hudHeight,
} as const

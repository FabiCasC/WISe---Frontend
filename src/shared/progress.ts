import {
  PROGRESS_SCHEMA_VERSION,
  type GameId,
  type GameResult,
  type GameSettings,
  type LevelId,
  type Progress,
} from './types'

const STORAGE_KEY = 'orbita-arcade:progress'

export const DEFAULT_SETTINGS: GameSettings = {
  volume: 0.6,
  reducedMotion: false,
  practice: false,
  lang: 'es',
}

export const GAME_IDS: GameId[] = ['opportunity', 'lunar-signals', 'spirit']

export function createEmptyProgress(): Progress {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    games: {
      opportunity: { levelsCompleted: [], bestScore: {} },
      'lunar-signals': { levelsCompleted: [], bestScore: {} },
      spirit: { levelsCompleted: [], bestScore: {} },
    },
    memories: [],
    evidence: [],
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Lectura defensiva: si el JSON esta corrupto, el schema cambio o el
 * almacenamiento esta bloqueado (modo privado de Safari), se vuelve a un
 * progreso vacio. Nunca lanza: jugar debe seguir siendo posible.
 */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyProgress()
    const parsed = JSON.parse(raw) as Partial<Progress>
    if (parsed?.schemaVersion !== PROGRESS_SCHEMA_VERSION) return createEmptyProgress()
    const base = createEmptyProgress()
    return {
      ...base,
      ...parsed,
      games: { ...base.games, ...(parsed.games ?? {}) },
      memories: Array.isArray(parsed.memories) ? parsed.memories : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
    }
  } catch {
    return createEmptyProgress()
  }
}

/** Un guardado fallido jamas debe impedir jugar: devuelve false y sigue. */
export function saveProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }),
    )
    return true
  } catch {
    return false
  }
}

export function resetProgress(): Progress {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* almacenamiento bloqueado: seguimos en memoria */
  }
  return createEmptyProgress()
}

/** Aplica un GameResult al progreso. Funcion pura: facil de probar con Vitest. */
export function applyResult(progress: Progress, result: GameResult): Progress {
  const game = progress.games[result.gameId]
  if (!game) return progress

  const levelsCompleted: LevelId[] = result.completed
    ? Array.from(new Set([...game.levelsCompleted, result.levelId])).sort() as LevelId[]
    : game.levelsCompleted

  const previousBest = game.bestScore[result.levelId] ?? 0
  const bestScore = result.completed
    ? { ...game.bestScore, [result.levelId]: Math.max(previousBest, result.score) }
    : game.bestScore

  const memories =
    result.completed && !progress.memories.includes(result.gameId)
      ? [...progress.memories, result.gameId]
      : progress.memories

  const evidence = Array.from(new Set([...progress.evidence, ...result.evidenceIds]))

  return {
    ...progress,
    games: { ...progress.games, [result.gameId]: { levelsCompleted, bestScore } },
    memories,
    evidence,
  }
}

export function totalScore(progress: Progress): number {
  return GAME_IDS.reduce((sum, id) => {
    const scores = Object.values(progress.games[id]?.bestScore ?? {})
    return sum + scores.reduce((a: number, b) => a + (b ?? 0), 0)
  }, 0)
}

export function completedLevels(progress: Progress, gameId: GameId): number {
  return progress.games[gameId]?.levelsCompleted.length ?? 0
}

// ---------------------------------------------------------------------------
// Nivel general (1 a 6)
// ---------------------------------------------------------------------------

export type GeneralLevel = 1 | 2 | 3 | 4 | 5 | 6

export const MAX_GENERAL_LEVEL: GeneralLevel = 6

export interface GeneralLevelSpec {
  level: GeneralLevel
  /** Qué hay que lograr para llegar a este nivel. */
  requirement: string
  /** Qué se abre al alcanzarlo (vacío si nada). */
  unlocks: string
}

export const GENERAL_LEVELS: GeneralLevelSpec[] = [
  { level: 1, requirement: 'Entrar al portal', unlocks: '' },
  { level: 2, requirement: 'Completar 1 nivel de cualquier juego', unlocks: '' },
  { level: 3, requirement: 'Completar 2 niveles en total', unlocks: '' },
  {
    level: 4,
    requirement: 'Completar un juego entero (sus 3 niveles)',
    unlocks: 'Primer juego avanzado',
  },
  {
    level: 5,
    requirement: 'Completar dos juegos enteros',
    unlocks: 'Reto especial y más juegos avanzados',
  },
  {
    level: 6,
    requirement: 'Completar los tres juegos',
    unlocks: 'Misión final y realidad virtual (próximamente)',
  },
]

/** Niveles distintos completados en un juego (tolera duplicados del almacenamiento). */
function uniqueLevels(progress: Progress, gameId: GameId): number {
  return new Set(progress.games[gameId]?.levelsCompleted ?? []).size
}

/**
 * Nivel general del jugador. Función pura: solo mira QUÉ niveles están
 * completados, nunca cuántas veces se jugaron. Repetir un nivel no sube el
 * nivel general; solo puede mejorar su mejor puntuación.
 */
export function getGeneralLevel(progress: Progress): GeneralLevel {
  const perGame = GAME_IDS.map((id) => uniqueLevels(progress, id))
  const fullGames = perGame.filter((n) => n >= 3).length
  const levels = perGame.reduce((a, b) => a + b, 0)

  if (fullGames >= 3) return 6
  if (fullGames >= 2) return 5
  if (fullGames >= 1) return 4
  if (levels >= 2) return 3
  if (levels >= 1) return 2
  return 1
}

/** Niveles completados en total, sin repetidos (máximo 9). */
export function totalLevelsCompleted(progress: Progress): number {
  return GAME_IDS.reduce((sum, id) => sum + uniqueLevels(progress, id), 0)
}

/** Requisito del siguiente nivel general, o null si ya se alcanzó el 6. */
export function nextGeneralLevel(progress: Progress): GeneralLevelSpec | null {
  const level = getGeneralLevel(progress)
  return GENERAL_LEVELS.find((l) => l.level === level + 1) ?? null
}

/** Un nivel se abre cuando el anterior del mismo juego está completado. */
export function isLevelUnlocked(progress: Progress, gameId: GameId, levelId: LevelId): boolean {
  if (levelId === 1) return true
  return progress.games[gameId]?.levelsCompleted.includes((levelId - 1) as LevelId) ?? false
}

/** Primer nivel sin completar (o el 1 si ya están todos). Siempre está abierto. */
export function nextPlayableLevel(progress: Progress, gameId: GameId): LevelId {
  const done = progress.games[gameId]?.levelsCompleted ?? []
  return (([1, 2, 3] as LevelId[]).find((l) => !done.includes(l)) ?? 1) as LevelId
}

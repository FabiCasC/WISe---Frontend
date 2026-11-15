import {
  PROGRESS_SCHEMA_VERSION,
  type ConceptStat,
  type GameId,
  type GameProgress,
  type GameResult,
  type GameSettings,
  type LevelId,
  type Progress,
} from './types'

const STORAGE_KEY = 'orbita-arcade:progress'

/** Each account keeps its own progress; without one the old shared key is used. */
const keyFor = (accountId?: string) => (accountId ? `${STORAGE_KEY}:${accountId}` : STORAGE_KEY)

export const DEFAULT_SETTINGS: GameSettings = {
  volume: 0.6,
  reducedMotion: false,
  practice: false,
  lang: 'en',
}

const EMPTY_GAME: GameProgress = { levelsCompleted: [], bestScore: {} }

export function createEmptyProgress(): Progress {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    games: {},
    memories: [],
    evidence: [],
    concepts: {},
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: new Date().toISOString(),
  }
}

/** Progress of one game; a game never played reads as empty. */
export function gameProgress(progress: Progress, gameId: GameId): GameProgress {
  return progress.games[gameId] ?? EMPTY_GAME
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Builds a valid v2 progress from whatever was stored. v1 (three fixed
 * games, no concepts) migrates keeping levels, scores, evidence and
 * settings. Anything unreadable falls back to empty. Pure: easy to test.
 */
export function migrateProgress(raw: unknown): Progress {
  const base = createEmptyProgress()
  if (!isObject(raw)) return base
  const version = raw.schemaVersion
  if (version !== 1 && version !== PROGRESS_SCHEMA_VERSION) return base

  const games: Record<GameId, GameProgress> = {}
  if (isObject(raw.games)) {
    for (const [id, g] of Object.entries(raw.games)) {
      if (!isObject(g)) continue
      const levels = Array.isArray(g.levelsCompleted)
        ? [...new Set(g.levelsCompleted.filter((n): n is number => Number.isInteger(n) && n > 0))].sort((a, b) => a - b)
        : []
      const bestScore: Record<number, number> = {}
      if (isObject(g.bestScore)) {
        for (const [lvl, score] of Object.entries(g.bestScore)) {
          if (typeof score === 'number' && Number.isFinite(score)) bestScore[Number(lvl)] = score
        }
      }
      if (levels.length || Object.keys(bestScore).length) games[id] = { levelsCompleted: levels, bestScore }
    }
  }

  const concepts: Record<string, ConceptStat> = {}
  if (version === PROGRESS_SCHEMA_VERSION && isObject(raw.concepts)) {
    for (const [id, c] of Object.entries(raw.concepts)) {
      if (isObject(c) && typeof c.correct === 'number' && typeof c.wrong === 'number') {
        concepts[id] = { correct: c.correct, wrong: c.wrong }
      }
    }
  }

  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

  return {
    ...base,
    games,
    memories: strings(raw.memories),
    evidence: strings(raw.evidence),
    concepts,
    settings: { ...base.settings, ...(isObject(raw.settings) ? (raw.settings as Partial<GameSettings>) : {}), lang: 'en' },
  }
}

/**
 * Defensive read: corrupt JSON, an unknown schema or blocked storage
 * (Safari private mode) fall back to empty progress. It never throws:
 * playing must always be possible.
 */
export function loadProgress(accountId?: string): Progress {
  try {
    const raw = localStorage.getItem(keyFor(accountId))
    return raw ? migrateProgress(JSON.parse(raw)) : createEmptyProgress()
  } catch {
    return createEmptyProgress()
  }
}

/** A failed save must never stop the game: it returns false and moves on. */
export function saveProgress(progress: Progress, accountId?: string): boolean {
  try {
    localStorage.setItem(keyFor(accountId), JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }))
    return true
  } catch {
    return false
  }
}

export function resetProgress(accountId?: string): Progress {
  try {
    localStorage.removeItem(keyFor(accountId))
  } catch {
    /* blocked storage: keep going in memory */
  }
  return createEmptyProgress()
}

/** Applies a GameResult. Pure function: easy to test with Vitest. */
export function applyResult(progress: Progress, result: GameResult): Progress {
  if (typeof result.gameId !== 'string' || !result.gameId) return progress
  const game = gameProgress(progress, result.gameId)

  const levelsCompleted = result.completed
    ? [...new Set([...game.levelsCompleted, result.levelId])].sort((a, b) => a - b)
    : game.levelsCompleted

  const previousBest = game.bestScore[result.levelId] ?? 0
  const bestScore = result.completed
    ? { ...game.bestScore, [result.levelId]: Math.max(previousBest, result.score) }
    : game.bestScore

  const memories =
    result.completed && !progress.memories.includes(result.gameId)
      ? [...progress.memories, result.gameId]
      : progress.memories

  const evidence = [...new Set([...progress.evidence, ...result.evidenceIds])]

  // Decisions count even in a lost game: a wrong choice is exactly what the
  // teacher needs to see.
  const concepts = { ...progress.concepts }
  for (const d of result.decisions ?? []) {
    if (!d || typeof d.concept !== 'string') continue
    const prev = concepts[d.concept] ?? { correct: 0, wrong: 0 }
    concepts[d.concept] = d.correct ? { ...prev, correct: prev.correct + 1 } : { ...prev, wrong: prev.wrong + 1 }
  }

  return {
    ...progress,
    games: { ...progress.games, [result.gameId]: { levelsCompleted, bestScore } },
    memories,
    evidence,
    concepts,
  }
}

export function totalScore(progress: Progress): number {
  return Object.values(progress.games).reduce(
    (sum, g) => sum + Object.values(g.bestScore).reduce((a, b) => a + (b ?? 0), 0),
    0,
  )
}

export function completedLevels(progress: Progress, gameId: GameId): number {
  return gameProgress(progress, gameId).levelsCompleted.length
}

/** Distinct levels completed across all games. */
export function totalLevelsCompleted(progress: Progress): number {
  return Object.values(progress.games).reduce((n, g) => n + new Set(g.levelsCompleted).size, 0)
}

/** Games with at least one completed level. */
export function gamesPlayed(progress: Progress): number {
  return Object.values(progress.games).filter((g) => g.levelsCompleted.length > 0).length
}

// ---------------------------------------------------------------------------
// Concepts and rank
// ---------------------------------------------------------------------------

/** A concept counts as learned once it was applied right at least as often as wrong. */
export function isLearned(stat: ConceptStat | undefined): boolean {
  return !!stat && stat.correct > 0 && stat.correct >= stat.wrong
}

export function learnedConcepts(progress: Progress): string[] {
  return Object.entries(progress.concepts)
    .filter(([, s]) => isLearned(s))
    .map(([id]) => id)
}

export interface Rank {
  name: string
  /** Concepts needed to reach this rank. */
  min: number
}

/** Ranks grow with concepts learned, not with games unlocked. */
export const RANKS: Rank[] = [
  { name: 'Cadet', min: 0 },
  { name: 'Pilot', min: 3 },
  { name: 'Specialist', min: 8 },
  { name: 'Commander', min: 15 },
  { name: 'Flight Director', min: 25 },
]

export function getRank(progress: Progress): Rank {
  const n = learnedConcepts(progress).length
  return [...RANKS].reverse().find((r) => n >= r.min) ?? RANKS[0]
}

export function nextRank(progress: Progress): Rank | null {
  const n = learnedConcepts(progress).length
  return RANKS.find((r) => r.min > n) ?? null
}

// ---------------------------------------------------------------------------
// Levels inside one game (games never lock each other)
// ---------------------------------------------------------------------------

/** Inside a game, a level opens when the previous one is completed. */
export function isLevelUnlocked(progress: Progress, gameId: GameId, levelId: LevelId): boolean {
  if (levelId <= 1) return true
  return gameProgress(progress, gameId).levelsCompleted.includes(levelId - 1)
}

/** First level not completed yet (or 1 when all are done). Always open. */
export function nextPlayableLevel(progress: Progress, gameId: GameId, levelCount = 3): LevelId {
  const done = gameProgress(progress, gameId).levelsCompleted
  for (let l = 1; l <= levelCount; l++) if (!done.includes(l)) return l
  return 1
}

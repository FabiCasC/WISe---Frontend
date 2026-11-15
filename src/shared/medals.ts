/**
 * MEDALLAS
 * -------------------------------------------------------------------------
 * Se calculan siempre a partir del progreso (nunca se guardan): así no se
 * pueden perder ni desincronizar, y el mismo cálculo sirve para el perfil del
 * alumno y, más adelante, para que el profesor vea las de su clase.
 *
 * Premian aprender (conceptos, juegos completos), no solo puntuar, y también
 * crear (medallas de creador).
 */
import { getGame } from '../content/games'
import { gamesPlayed, learnedConcepts, totalScore } from './progress'
import type { Role } from './accounts'
import type { Progress } from './types'

export type MedalCategory = 'play' | 'concepts' | 'score' | 'creator' | 'teacher'

export interface MedalStats {
  totalScore: number
  gamesPlayed: number
  conceptsLearned: number
  /** Juegos con TODOS sus niveles completados. */
  gamesFinished: number
  gamesCreated: number
  classesCreated: number
}

export interface Medal {
  id: string
  name: string
  /** Qué hay que hacer para ganarla. */
  how: string
  category: MedalCategory
  earned: boolean
  value: number
  goal: number
}

export const CATEGORY_LABELS: Record<MedalCategory, string> = {
  play: 'Playing',
  concepts: 'Learning',
  score: 'Score',
  creator: 'Creator',
  teacher: 'Teaching',
}

/** Juegos jugables con todos los niveles completados. */
export function gamesFinished(games: Record<string, number[]>): number {
  return Object.entries(games).filter(([id, levels]) => {
    const g = getGame(id)
    if (!g || g.status !== 'live') return false
    const done = new Set(levels)
    for (let l = 1; l <= g.levels; l++) if (!done.has(l)) return false
    return true
  }).length
}

export function medalStatsFromProgress(
  progress: Progress,
  extras: { gamesCreated: number; classesCreated: number },
): MedalStats {
  const games: Record<string, number[]> = {}
  for (const [id, g] of Object.entries(progress.games)) games[id] = g.levelsCompleted
  return {
    totalScore: totalScore(progress),
    gamesPlayed: gamesPlayed(progress),
    conceptsLearned: learnedConcepts(progress).length,
    gamesFinished: gamesFinished(games),
    ...extras,
  }
}

interface Def {
  id: string
  name: string
  how: string
  category: MedalCategory
  goal: number
  stat: keyof MedalStats
  /** Solo para este rol. */
  role?: Role
}

const DEFS: Def[] = [
  { id: 'first-launch', name: 'First Launch', how: 'Play your first game', category: 'play', goal: 1, stat: 'gamesPlayed' },
  { id: 'explorer', name: 'Explorer', how: 'Play 5 different games', category: 'play', goal: 5, stat: 'gamesPlayed' },
  { id: 'fleet', name: 'Whole Fleet', how: 'Play 10 different games', category: 'play', goal: 10, stat: 'gamesPlayed' },
  { id: 'full-mission', name: 'Full Mission', how: 'Finish every level of one game', category: 'play', goal: 1, stat: 'gamesFinished' },
  { id: 'triple-crown', name: 'Triple Crown', how: 'Finish every level of 3 games', category: 'play', goal: 3, stat: 'gamesFinished' },

  { id: 'first-spark', name: 'First Spark', how: 'Learn your first concept', category: 'concepts', goal: 1, stat: 'conceptsLearned' },
  { id: 'flight-engineer', name: 'Flight Engineer', how: 'Learn 5 concepts', category: 'concepts', goal: 5, stat: 'conceptsLearned' },
  { id: 'mission-specialist', name: 'Mission Specialist', how: 'Learn 10 concepts', category: 'concepts', goal: 10, stat: 'conceptsLearned' },
  { id: 'flight-director', name: 'Flight Director', how: 'Learn 20 concepts', category: 'concepts', goal: 20, stat: 'conceptsLearned' },

  { id: 'rising-star', name: 'Rising Star', how: 'Reach 500 points', category: 'score', goal: 500, stat: 'totalScore' },
  { id: 'star-pilot', name: 'Star Pilot', how: 'Reach 2,000 points', category: 'score', goal: 2000, stat: 'totalScore' },
  { id: 'supernova', name: 'Supernova', how: 'Reach 5,000 points', category: 'score', goal: 5000, stat: 'totalScore' },

  { id: 'first-build', name: 'First Build', how: 'Create your first game in the Studio', category: 'creator', goal: 1, stat: 'gamesCreated' },
  { id: 'game-maker', name: 'Game Maker', how: 'Create 3 games', category: 'creator', goal: 3, stat: 'gamesCreated' },
  { id: 'studio-pro', name: 'Studio Pro', how: 'Create 10 games', category: 'creator', goal: 10, stat: 'gamesCreated' },

  { id: 'class-founder', name: 'Class Founder', how: 'Create your first class', category: 'teacher', goal: 1, stat: 'classesCreated', role: 'teacher' },
  { id: 'head-of-mission', name: 'Head of Mission', how: 'Create 3 classes', category: 'teacher', goal: 3, stat: 'classesCreated', role: 'teacher' },
]

/** Todas las medallas que puede ganar este rol, ganadas o no. */
export function computeMedals(stats: MedalStats, role: Role): Medal[] {
  return DEFS.filter((d) => !d.role || d.role === role).map((d) => {
    const value = stats[d.stat]
    return { id: d.id, name: d.name, how: d.how, category: d.category, earned: value >= d.goal, value: Math.min(value, d.goal), goal: d.goal }
  })
}

export const earnedMedals = (medals: Medal[]) => medals.filter((m) => m.earned)

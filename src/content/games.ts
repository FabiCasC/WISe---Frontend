import type { GameId, LevelId } from '../shared/types'
import { ARCADE_IDS, getArcade } from './arcade'
import { getMission } from './missions'

/**
 * Resolutor unico: el portal (GameHost, avisos, rutas) necesita el titulo y
 * el nivel de CUALQUIER juego sin preguntarse si es mision o minijuego.
 */
export interface GameMeta {
  gameId: GameId
  title: string
  kind: 'mission' | 'arcade'
  levelName: string
  levelGoal: string
  accent: string
}

export function isArcadeId(gameId: string): boolean {
  return (ARCADE_IDS as string[]).includes(gameId)
}

export function getGameMeta(gameId: GameId, levelId: LevelId): GameMeta | undefined {
  const mission = getMission(gameId)
  if (mission) {
    const level = mission.levels.find((l) => l.id === levelId)
    return {
      gameId,
      title: mission.title,
      kind: 'mission',
      levelName: level?.name ?? '',
      levelGoal: level?.goal ?? '',
      accent: mission.accent,
    }
  }

  const arcade = getArcade(gameId)
  if (arcade) {
    const level = arcade.levels.find((l) => l.id === levelId)
    return {
      gameId,
      title: arcade.title,
      kind: 'arcade',
      levelName: level?.name ?? '',
      levelGoal: level?.goal ?? '',
      accent: arcade.accent,
    }
  }

  return undefined
}

/** Titulo legible para avisos. Nunca lanza: si no existe, devuelve el id. */
export function getGameTitle(gameId: GameId): string {
  return getMission(gameId)?.title ?? getArcade(gameId)?.title ?? gameId
}

import type { GameContext, GameController } from '../../shared/types'
import { mountNumberQuest } from './scene'

/**
 * GAME 4 · NASA Number Mission.
 * Guess the number behind a NASA fact. 3 levels x 5 questions.
 * Pure rules live in rules.ts; all questions are data in questions.ts.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  return mountNumberQuest(container, ctx)
}

import type { GameContext, GameController } from '../../shared/types'
import { mountSignals } from './scene'

/**
 * GAME 2 · Two Signals from the Moon.
 * Replaces the scaffold: GameHost only needs this export.
 */
export function mountGame(container: HTMLElement, ctx: GameContext): GameController {
  return mountSignals(container, ctx)
}

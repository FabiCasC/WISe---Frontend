import type { Tutorial } from './types'

export type { Tutorial, TutorialControl, TutorialPart } from './types'

// Every sibling file is a game's tutorial (default export). Loaded eagerly:
// they are tiny text files and the portal needs them before opening a game.
const files = import.meta.glob<{ default: Tutorial }>(['./*.ts', '!./index.ts', '!./types.ts', '!./*.test.ts'], {
  eager: true,
})

export const TUTORIALS: Record<string, Tutorial> = Object.fromEntries(
  Object.values(files).map((m) => [m.default.gameId, m.default]),
)

export function getTutorial(gameId: string): Tutorial | undefined {
  return TUTORIALS[gameId]
}

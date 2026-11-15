/**
 * LEVEL 0 · tutorial content
 * -------------------------------------------------------------------------
 * One file per game in this folder (src/content/tutorials/<game-id>.ts) with
 * `export default { ... } satisfies Tutorial`. The registry in index.ts picks
 * every file up by itself, so adding a game never touches a shared file.
 *
 * Written for a 9-14 year old playing alone, with no teacher to explain it:
 * short sentences, the same words the game uses on screen. The science card
 * (content/arcade.ts) stays the page for teachers.
 *
 * "What you will learn" is NOT written here: it comes from the game's
 * concepts in content/games.ts, so it can never disagree with what the
 * teacher dashboard measures.
 */
export interface TutorialControl {
  /** Keycaps to show, e.g. ['←', '→'] or ['Space']. */
  keys: string[]
  /** What it does, starting with a verb. */
  does: string
  /** Phone version when it is not the same thing, e.g. "Tap Jump". */
  touch?: string
}

export interface TutorialPart {
  /** Exactly the word the game shows on screen (or the object's name). */
  name: string
  /** What it means and why the player should care. */
  meaning: string
}

export interface Tutorial {
  gameId: string
  /** Why this really happened, in 1-2 sentences. The hook. */
  story: string
  controls: TutorialControl[]
  /** What each part of the screen means. */
  parts: TutorialPart[]
  /** One thing to try during the practice round. */
  practice: string
}

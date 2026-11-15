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

export interface TutorialStep {
  /** What to do or notice right now, in one or two short sentences. */
  text: string
  /**
   * KeyboardEvent.code values (e.g. 'Space', 'ArrowUp', 'KeyW'). When the
   * player presses one, the step is ticked off and the coach moves on. Leave
   * it out for steps that only explain something: those use the Next button.
   * Touch players always have the Next button.
   */
  keys?: string[]
  /** Ticks the step when the player taps or clicks the game (not the coach bar). */
  pointer?: boolean
}

export interface Tutorial {
  gameId: string
  /** Why this really happened, in 1-2 sentences. The hook. */
  story: string
  controls: TutorialControl[]
  /** What each part of the screen means. */
  parts: TutorialPart[]
  /**
   * The practice round, step by step. The real game runs underneath in
   * practice mode and the coach bar walks the player through these: the first
   * step should be how to begin, and the last one should say they are ready.
   */
  steps: TutorialStep[]
}

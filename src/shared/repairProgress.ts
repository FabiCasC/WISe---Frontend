/**
 * What the Repair Bay remembers about a student.
 *
 * Deliberately small: which missions are repaired, and which were solved
 * without a wrong guess first. The second one is the interesting number for
 * a teacher, because getting it right after reading the NASA data is the
 * whole point, and getting it right immediately means they already knew.
 *
 * Storage follows the same shape as progress.ts: one key per account, so two
 * students on the same browser never see each other's work.
 */

export interface RepairProgress {
  /** Mission ids repaired, in the order they were solved. */
  solved: string[]
  /** Mission ids solved with no wrong choice beforehand. */
  firstTry: string[]
}

export const emptyRepairs = (): RepairProgress => ({ solved: [], firstTry: [] })

const BASE = 'orbita-arcade:repairs'
const keyFor = (accountId?: string) => (accountId ? BASE + ':' + accountId : BASE)

/** Pure: records a solved mission without ever duplicating it. */
export function markSolved(
  state: RepairProgress,
  id: string,
  wasFirstTry: boolean,
): RepairProgress {
  const solved = state.solved.includes(id) ? state.solved : [...state.solved, id]
  // A mission already solved keeps whatever it earned the first time: coming
  // back to re-read it must not downgrade an earlier clean solve, and must
  // not upgrade one that took a wrong guess.
  const already = state.solved.includes(id)
  const firstTry =
    !already && wasFirstTry && !state.firstTry.includes(id)
      ? [...state.firstTry, id]
      : state.firstTry
  return { solved, firstTry }
}

export const isSolved = (state: RepairProgress, id: string) => state.solved.includes(id)

export function loadRepairs(accountId?: string): RepairProgress {
  try {
    const raw = localStorage.getItem(keyFor(accountId))
    if (!raw) return emptyRepairs()
    const parsed = JSON.parse(raw) as Partial<RepairProgress>
    return {
      solved: Array.isArray(parsed.solved) ? parsed.solved.filter((s) => typeof s === 'string') : [],
      firstTry: Array.isArray(parsed.firstTry)
        ? parsed.firstTry.filter((s) => typeof s === 'string')
        : [],
    }
  } catch {
    // Private windows and blocked site data throw here. The bay still works,
    // it just forgets, which is better than a blank screen.
    return emptyRepairs()
  }
}

export function saveRepairs(state: RepairProgress, accountId?: string): boolean {
  try {
    localStorage.setItem(keyFor(accountId), JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

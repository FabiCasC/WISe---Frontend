/**
 * Which tutorials (Level 0) this account has already seen, so the portal only
 * opens one by itself the first time. Simulated accounts keep it in this
 * browser, like the rest of the progress.
 */
const key = (accountId: string) => `orbita-arcade:tutorials:${accountId}`

/** Adds a game id once. Pure: easy to test. */
export function withSeen(seen: readonly string[], gameId: string): string[] {
  return seen.includes(gameId) ? [...seen] : [...seen, gameId]
}

export function loadSeen(accountId: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key(accountId)) ?? '[]')
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function saveSeen(accountId: string, seen: readonly string[]): void {
  try {
    localStorage.setItem(key(accountId), JSON.stringify(seen))
  } catch {
    /* blocked storage: the tutorial just shows again next time */
  }
}

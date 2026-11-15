/**
 * LIGHT AND DARK, CHOSEN BY THE PERSON
 * -------------------------------------------------------------------------
 * Until now the portal had no switch at all: the sun button in the top bar
 * opens Settings, and the only thing deciding light or dark was the
 * operating system, through a `prefers-color-scheme` media query. A visitor
 * who wanted the other one had no way to ask for it.
 *
 * The scheme here is deliberate: the document ALWAYS carries an explicit
 * `data-theme`, even when the choice is "whatever the system says". That
 * costs one line at boot and buys two things:
 *
 *  - the stylesheet needs no media query and no duplicated token block, so
 *    there is exactly one place each colour is written down;
 *  - a theme can never be half-applied, which is how the game room ended up
 *    painting dark text on a dark panel earlier in this project.
 *
 * `Preference` is what the person asked for and is what gets stored.
 * `Theme` is what actually ends up on the document.
 */

export type Theme = 'dark' | 'light'
/** 'system' means: keep following the OS, including when it changes. */
export type Preference = Theme | 'system'

export const THEME_KEY = 'orbita-arcade:theme'

/** The portal is a dark product by design; that is the fallback everywhere. */
export const DEFAULT_THEME: Theme = 'dark'

export function isPreference(value: unknown): value is Preference {
  return value === 'dark' || value === 'light' || value === 'system'
}

/** What a stored value means, defaulting to following the system. */
export function readPreference(raw: string | null): Preference {
  return isPreference(raw) ? raw : 'system'
}

/** The theme a preference resolves to, given what the system currently says. */
export function resolveTheme(pref: Preference, systemPrefersLight: boolean): Theme {
  if (pref === 'dark' || pref === 'light') return pref
  return systemPrefersLight ? 'light' : DEFAULT_THEME
}

/**
 * What the toggle does. Two visible states, not three: a person pressing a
 * sun or a moon wants that theme now, and a hidden "system" state that
 * silently changes under them when the OS does is a worse experience than
 * one they chose themselves.
 */
export function nextPreference(current: Preference, systemPrefersLight: boolean): Theme {
  return resolveTheme(current, systemPrefersLight) === 'dark' ? 'light' : 'dark'
}

/** The label the button announces, which is the theme it will switch TO. */
export function toggleLabel(active: Theme): string {
  return active === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
}

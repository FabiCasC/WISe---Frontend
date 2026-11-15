import { useCallback, useEffect, useState } from 'react'
import {
  THEME_KEY,
  nextPreference,
  readPreference,
  resolveTheme,
  toggleLabel,
  type Preference,
  type Theme,
} from '../../shared/theme'

/**
 * The light / dark switch.
 *
 * It is its own button, beside Settings rather than inside it: changing the
 * theme is something a person does by looking at the screen and deciding it
 * is too bright, and making them open a panel to do that is a step too many.
 *
 * index.html has already written data-theme before the first paint, so this
 * component starts from whatever is really on the document instead of
 * guessing again and risking a flicker.
 */
const query = '(prefers-color-scheme: light)'

function systemPrefersLight(): boolean {
  try {
    return window.matchMedia(query).matches
  } catch {
    return false
  }
}

function storedPreference(): Preference {
  try {
    return readPreference(localStorage.getItem(THEME_KEY))
  } catch {
    // Private windows and blocked site data throw on read.
    return 'system'
  }
}

export default function ThemeToggle() {
  const [pref, setPref] = useState<Preference>(storedPreference)
  const [sysLight, setSysLight] = useState(systemPrefersLight)

  // Someone who never pressed the button is still following their OS, so a
  // change there has to reach the page while it is open.
  useEffect(() => {
    let mq: MediaQueryList
    try {
      mq = window.matchMedia(query)
    } catch {
      return
    }
    const onChange = (e: MediaQueryListEvent) => setSysLight(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const active: Theme = resolveTheme(pref, sysLight)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', active)
  }, [active])

  const toggle = useCallback(() => {
    setPref((current) => {
      const next = nextPreference(current, systemPrefersLight())
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        // Not being able to remember it is not a reason to refuse to do it.
      }
      return next
    })
  }, [])

  return (
    <button
      type="button"
      className="btn btn--quiet btn--icon"
      onClick={toggle}
      aria-label={toggleLabel(active)}
      title={toggleLabel(active)}
    >
      {active === 'dark' ? <IconSun /> : <IconMoon />}
    </button>
  )
}

/* Shown while dark is active: pressing it brings the light. */
function IconSun() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4.4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2.6v2.4M12 19v2.4M2.6 12h2.4M19 12h2.4" />
        <path d="M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3L17 7M7 17l-1.7 1.7" />
      </g>
    </svg>
  )
}

/* Shown while light is active. */
function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

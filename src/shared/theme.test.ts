import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME,
  isPreference,
  nextPreference,
  readPreference,
  resolveTheme,
  toggleLabel,
  type Preference,
} from './theme'

describe('readPreference', () => {
  it('accepts the three it knows', () => {
    expect(readPreference('dark')).toBe('dark')
    expect(readPreference('light')).toBe('light')
    expect(readPreference('system')).toBe('system')
  })

  it('falls back to following the system for anything else', () => {
    // Nothing stored yet, a value from an older build, or a corrupted key.
    expect(readPreference(null)).toBe('system')
    expect(readPreference('')).toBe('system')
    expect(readPreference('DARK')).toBe('system')
    expect(readPreference('{"theme":"dark"}')).toBe('system')
  })
})

describe('isPreference', () => {
  it('rejects anything that is not one of the three', () => {
    expect(isPreference('dark')).toBe(true)
    expect(isPreference('sepia')).toBe(false)
    expect(isPreference(null)).toBe(false)
    expect(isPreference(undefined)).toBe(false)
    expect(isPreference(0)).toBe(false)
  })
})

describe('resolveTheme', () => {
  it('honours an explicit choice whatever the system says', () => {
    expect(resolveTheme('dark', true)).toBe('dark')
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('light', false)).toBe('light')
  })

  it('follows the system when asked to', () => {
    expect(resolveTheme('system', true)).toBe('light')
    expect(resolveTheme('system', false)).toBe('dark')
  })

  it('defaults to dark, because that is what the portal is designed as', () => {
    expect(DEFAULT_THEME).toBe('dark')
    expect(resolveTheme('system', false)).toBe(DEFAULT_THEME)
  })
})

describe('nextPreference', () => {
  it('always lands on the opposite of what is on screen', () => {
    expect(nextPreference('dark', false)).toBe('light')
    expect(nextPreference('light', false)).toBe('dark')
  })

  it('turns a system preference into an explicit one', () => {
    // Pressing the button is a decision: after it, the OS no longer gets to
    // change the theme under the person without them asking.
    expect(nextPreference('system', false)).toBe('light')
    expect(nextPreference('system', true)).toBe('dark')
  })

  it('never returns system', () => {
    const prefs: Preference[] = ['dark', 'light', 'system']
    for (const p of prefs) {
      for (const sysLight of [true, false]) {
        expect(nextPreference(p, sysLight)).not.toBe('system')
      }
    }
  })

  it('is its own inverse: two presses come back to where you started', () => {
    for (const sysLight of [true, false]) {
      const once = nextPreference('system', sysLight)
      expect(nextPreference(nextPreference(once, sysLight), sysLight)).toBe(once)
    }
  })
})

describe('toggleLabel', () => {
  it('announces the theme the button will switch TO, not the current one', () => {
    expect(toggleLabel('dark')).toBe('Switch to light mode')
    expect(toggleLabel('light')).toBe('Switch to dark mode')
  })

  it('matches what pressing it actually does', () => {
    for (const sysLight of [true, false]) {
      const active = resolveTheme('system', sysLight)
      const after = nextPreference('system', sysLight)
      expect(toggleLabel(active).toLowerCase()).toContain(after)
    }
  })
})

/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'

/**
 * STUDIO HAS TWO RULES, AND THEY APPLY TO BOTH ROOMS.
 *
 * The first repair-bay test only policed its own content file, so the other
 * half of Studio kept shipping emoji and Spanish while the portal around it
 * is English. A rule that only covers the file you wrote is not a rule.
 *
 * This reads the whole Studio surface instead:
 *
 *  1. No emoji or pictographic glyphs. Children use this with screen readers
 *     and on school machines with patchy font coverage, where an emoji is a
 *     blank box. Shapes belong in SVG, where they scale and can be labelled.
 *  2. No Spanish in anything the student reads. The portal was translated to
 *     English; a room that answers in another language reads as broken.
 *
 * Both tests print the exact file and line, so fixing them is mechanical.
 *
 * The sources are pulled in with Vite's own raw loader rather than node:fs,
 * so this stays a plain browser-safe module and `tsc --noEmit` needs no
 * node typings to check it.
 */

const SOURCES: Record<string, string> = {
  ...import.meta.glob('../games/design-game/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('./components/benches/*.tsx', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('./components/RepairBay.tsx', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('./pages/Studio.tsx', { query: '?raw', import: 'default', eager: true }),
}

/** Test files police themselves; they are not what the student reads. */
const FILES = Object.entries(SOURCES).filter(([p]) => !p.endsWith('.test.ts'))

/** Pictographs, dingbats, arrows and the variation selector that follows them. */
const GLYPH =
  /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2460}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u

/**
 * Words that only appear in Spanish prose. Deliberately narrow: no accents
 * (the files may be written either way) and no words English also uses.
 */
const SPANISH =
  // `describe` and `variables` were in this list and should never have been:
  // both are ordinary English words, so the rule was forcing worse English on
  // the UI to keep itself green. "Variables" had to be relabelled "Data" and
  // "Describe your game" became a paraphrase. A rule that makes the product
  // worse in order to pass is broken, not strict.
  /\b(juego|videojuego|bloques|personaje|movimiento|sonido|guardar|crear|enviar|revisi[oó]n|borrador|simulador|buscar|ejemplos|puntuaci[oó]n|vidas|apariencia|sensores|operadores|esquiva|salta|recolecta|laberinto|plataformas|propio|instrucciones|a[ñn]adir|eliminar|siguiente|anterior|cargando)\b/i

/** Only strings the student can actually read: quoted literals and JSX text. */
function readableStrings(src: string): { line: number; text: string }[] {
  const found: { line: number; text: string }[] = []
  src.split('\n').forEach((raw, i) => {
    if (/^\s*\*/.test(raw)) return
    const line = raw.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
    for (const m of line.matchAll(/'([^'\\]{2,})'|"([^"\\]{2,})"|>([^<>{}\n]{3,})</g)) {
      const text = (m[1] ?? m[2] ?? m[3] ?? '').trim()
      if (text) found.push({ line: i + 1, text })
    }
  })
  return found
}

describe('the whole Studio surface, both rooms', () => {
  it('is actually looking at the files', () => {
    expect(FILES.length).toBeGreaterThan(10)
  })

  it('shows no emoji or pictographic glyphs anywhere', () => {
    const offenders: string[] = []
    for (const [file, src] of FILES) {
      src.split('\n').forEach((line, i) => {
        const hit = line.match(GLYPH)
        if (hit) offenders.push(`${file}:${i + 1}  ${hit[0]}  ${line.trim().slice(0, 70)}`)
      })
    }
    expect(offenders.join('\n'), `${offenders.length} glyphs left`).toBe('')
  })

  it('speaks to the student in English, like the rest of the portal', () => {
    const offenders: string[] = []
    for (const [file, src] of FILES) {
      for (const { line, text } of readableStrings(src)) {
        // Import paths, class names and ids are not prose.
        if (/^[./@]/.test(text) || /^[a-z0-9_-]+$/.test(text)) continue
        if (SPANISH.test(text)) offenders.push(`${file}:${line}  "${text.slice(0, 60)}"`)
      }
    }
    expect(offenders.join('\n'), `${offenders.length} Spanish strings left`).toBe('')
  })
})

import { describe, expect, it } from 'vitest'
import { crearRoca } from './roca'

const rng = () => 0.3

describe('roca · level 2 recap', () => {
  it('says the player read dust first even after grinding and reading again', () => {
    const r = crearRoca({ levelId: 2, libre: false, rng })
    r.elegir('A')
    r.usar('espectrometro')
    r.usar('rat')
    r.usar('espectrometro')
    expect(r.decisiones().map((d) => d.correct)).toEqual([false])
    const lines = r.resumen(r.completo()).join(' ')
    expect(lines).toMatch(/spot A while it was still covered in dust/)
    expect(lines).not.toMatch(/Grind first, then read/)
  })

  it('a clean order gets the clean recap and a correct decision', () => {
    const r = crearRoca({ levelId: 2, libre: false, rng })
    r.elegir('A')
    r.usar('rat')
    r.usar('espectrometro')
    expect(r.decisiones().map((d) => d.correct)).toEqual([true])
    expect(r.resumen(true).join(' ')).toMatch(/Grind first, then read/)
  })
})

describe('roca · level 3 report', () => {
  it('a failed final report names what was missing', () => {
    const r = crearRoca({ levelId: 3, libre: false, rng })
    r.elegir('A')
    r.usar('camara')
    expect(r.informe().ok).toBe(false)
    expect(r.decisiones()[r.decisiones().length - 1]).toMatchObject({ concept: 'varias-evidencias', correct: false })
    expect(r.resumen(false).join(' ')).toMatch(/Still missing: .*water/)
  })
})

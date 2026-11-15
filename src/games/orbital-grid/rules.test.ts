import { describe, expect, it } from 'vitest'
import {
  aiMove,
  bestMove,
  emptyBoard,
  findWinner,
  freeCells,
  isFull,
  matchPassed,
  tacticalMove,
  type Board,
  type Player,
} from './rules'

/** Generador fijo: las pruebas no pueden depender de la suerte. */
function seeded(seed = 7) {
  let a = seed
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296
    return a / 4294967296
  }
}

const B = (s: string): Board =>
  s
    .replace(/\s/g, '')
    .split('')
    .map((c) => (c === 'X' ? 1 : c === 'O' ? 2 : 0)) as Board

describe('deteccion de linea', () => {
  it('encuentra filas, columnas y diagonales', () => {
    expect(findWinner(B('XXX......'))?.player).toBe(1)
    expect(findWinner(B('O..O..O..'))?.player).toBe(2)
    expect(findWinner(B('X...X...X'))?.player).toBe(1)
    expect(findWinner(B('..X.X.X..'))?.player).toBe(1)
  })

  it('no inventa lineas en un tablero sin tres iguales', () => {
    expect(findWinner(emptyBoard())).toBeNull()
    expect(findWinner(B('XOXOXOOXO'))).toBeNull()
  })
})

describe('jugada tactica', () => {
  it('cierra la linea propia cuando puede ganar', () => {
    // X tiene 0 y 1; la casilla 2 gana.
    expect(tacticalMove(B('XX.OO....'), 1)).toBe(2)
  })

  it('bloquea al rival si no puede ganar antes', () => {
    // O amenaza en 0,1 y X no tiene ninguna linea a un paso: toca tapar el 2.
    expect(tacticalMove(B('OO.X...X.'), 1)).toBe(2)
  })

  it('prefiere ganar antes que bloquear', () => {
    // X cierra en 2; O cerraria en 3. Ganar va primero.
    expect(tacticalMove(B('XX..OO...'), 1)).toBe(2)
  })
})

describe('minimax', () => {
  it('toma la victoria inmediata', () => {
    expect(bestMove(B('XX.OO....'), 1, seeded())).toBe(2)
  })

  it('bloquea la derrota inmediata', () => {
    expect(bestMove(B('OO.X..X..'), 1, seeded())).toBe(2)
  })

  /**
   * La prueba que de verdad importa: un rival perfecto NUNCA debe perder,
   * juegue quien juegue y haga el humano lo que haga. Se recorren todas las
   * partidas posibles contra un oponente que prueba cada casilla libre.
   */
  it('nunca pierde contra ninguna linea de juego posible', () => {
    const rand = seeded(99)
    let losses = 0
    let games = 0

    // `ai` es el jugador perfecto; `human` prueba TODAS las respuestas.
    const walk = (board: Board, turn: Player, ai: Player) => {
      const win = findWinner(board)
      if (win) {
        games++
        if (win.player !== ai) losses++
        return
      }
      if (isFull(board)) {
        games++
        return
      }

      if (turn === ai) {
        const move = bestMove(board, ai, rand)
        board[move] = ai
        walk(board, turn === 1 ? 2 : 1, ai)
        board[move] = 0
        return
      }

      for (const i of freeCells(board)) {
        board[i] = turn
        walk(board, turn === 1 ? 2 : 1, ai)
        board[i] = 0
      }
    }

    // Empezando la maquina y empezando el humano.
    walk(emptyBoard(), 2, 2)
    walk(emptyBoard(), 1, 2)

    expect(games).toBeGreaterThan(100)
    expect(losses).toBe(0)
  })
})

describe('rival por nivel', () => {
  it('siempre devuelve una casilla libre', () => {
    const rand = seeded(3)
    for (const level of [1, 2, 3] as const) {
      const board = B('XO.X..O..')
      const move = aiMove(board, 2, level, rand)
      expect(board[move]).toBe(0)
    }
  })

  it('no juega cuando el tablero esta lleno', () => {
    expect(aiMove(B('XOXOXOOXO'), 2, 3, seeded())).toBe(-1)
  })

  it('el nivel 2 no deja pasar una victoria servida', () => {
    // O tiene 0 y 1 libres para cerrar en 2.
    expect(aiMove(B('OO.XX....'), 2, 2, seeded())).toBe(2)
  })
})

describe('objetivo de la partida', () => {
  it('en niveles 1 y 2 pide ganar dos rondas', () => {
    expect(matchPassed({ wins: 2, draws: 0, losses: 1, level: 1 })).toBe(true)
    expect(matchPassed({ wins: 1, draws: 2, losses: 0, level: 2 })).toBe(false)
  })

  it('en el nivel 3 basta con no perder', () => {
    // Contra un rival perfecto, empatar las tres es el techo real.
    expect(matchPassed({ wins: 0, draws: 3, losses: 0, level: 3 })).toBe(true)
    expect(matchPassed({ wins: 1, draws: 1, losses: 1, level: 3 })).toBe(false)
  })
})

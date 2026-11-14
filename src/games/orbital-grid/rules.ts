/**
 * TRES EN RAYA ORBITAL - reglas puras.
 * -------------------------------------------------------------------------
 * Tablero de 9 sectores. El jugador coloca antenas (1), el rival coloca
 * las suyas (2). Alinear tres = cobertura continua de ese sector del cielo.
 *
 * La IA es un minimax completo: en nivel 3 es literalmente imperfectible, y
 * eso es intencionado. Contra una red bien repartida lo mejor que se puede
 * hacer es empatar, que es justo la idea que el juego quiere dejar.
 */

/** 0 vacio, 1 jugador, 2 rival. */
export type Cell = 0 | 1 | 2
export type Board = Cell[]
export type Player = 1 | 2

export const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export function emptyBoard(): Board {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0]
}

export interface WinInfo {
  player: Player
  line: readonly [number, number, number]
}

export function findWinner(board: Board): WinInfo | null {
  for (const line of LINES) {
    const [a, b, c] = line
    const v = board[a]
    if (v !== 0 && v === board[b] && v === board[c]) {
      return { player: v as Player, line }
    }
  }
  return null
}

export function freeCells(board: Board): number[] {
  const out: number[] = []
  for (let i = 0; i < 9; i++) if (board[i] === 0) out.push(i)
  return out
}

export function isFull(board: Board): boolean {
  return board.every((c) => c !== 0)
}

export function other(p: Player): Player {
  return p === 1 ? 2 : 1
}

/**
 * Minimax con poda alfa-beta. Devuelve la puntuacion de la posicion para
 * `me`. Se resta la profundidad al ganar para que prefiera ganar PRONTO, y
 * se suma al perder para que estire la derrota: sin esto la maquina juega
 * de forma desconcertante aunque sea "correcta".
 */
export function minimax(
  board: Board,
  me: Player,
  turn: Player,
  depth: number,
  alpha: number,
  beta: number
): number {
  const win = findWinner(board)
  if (win) return win.player === me ? 10 - depth : depth - 10
  if (isFull(board)) return 0

  const cells = freeCells(board)

  if (turn === me) {
    let best = -Infinity
    for (const i of cells) {
      board[i] = turn
      const v = minimax(board, me, other(turn), depth + 1, alpha, beta)
      board[i] = 0
      if (v > best) best = v
      if (best > alpha) alpha = best
      if (alpha >= beta) break
    }
    return best
  }

  let best = Infinity
  for (const i of cells) {
    board[i] = turn
    const v = minimax(board, me, other(turn), depth + 1, alpha, beta)
    board[i] = 0
    if (v < best) best = v
    if (best < beta) beta = best
    if (alpha >= beta) break
  }
  return best
}

/** Jugada optima para `me`. Entre varias igual de buenas, elige una al azar. */
export function bestMove(board: Board, me: Player, rand: () => number): number {
  const cells = freeCells(board)
  if (cells.length === 0) return -1

  let best = -Infinity
  let picks: number[] = []

  for (const i of cells) {
    board[i] = me
    const v = minimax(board, me, other(me), 0, -Infinity, Infinity)
    board[i] = 0
    if (v > best) {
      best = v
      picks = [i]
    } else if (v === best) {
      picks.push(i)
    }
  }

  return picks[Math.floor(rand() * picks.length)]
}

/** Jugada que gana ya, o que impide que el rival gane en la siguiente. */
export function tacticalMove(board: Board, me: Player): number {
  const rival = other(me)
  for (const who of [me, rival]) {
    for (const i of freeCells(board)) {
      board[i] = who
      const win = findWinner(board)
      board[i] = 0
      if (win) return i
    }
  }
  return -1
}

export type Difficulty = 1 | 2 | 3

/**
 * Rival por nivel.
 *   1 - novato: casi siempre al azar, a veces ve la jugada obvia.
 *   2 - atento: nunca falla lo evidente, pero no calcula a fondo.
 *   3 - perfecto: minimax puro. No se le puede ganar; se le puede empatar.
 */
export function aiMove(board: Board, me: Player, level: Difficulty, rand: () => number): number {
  const cells = freeCells(board)
  if (cells.length === 0) return -1

  if (level === 3) return bestMove(board, me, rand)

  if (level === 2) {
    const tactical = tacticalMove(board, me)
    if (tactical >= 0) return tactical
    // Sin jugada forzada: el centro y las esquinas son mejores que los lados.
    if (board[4] === 0 && rand() < 0.8) return 4
    const corners = [0, 2, 6, 8].filter((i) => board[i] === 0)
    if (corners.length && rand() < 0.65) return corners[Math.floor(rand() * corners.length)]
    return cells[Math.floor(rand() * cells.length)]
  }

  // Nivel 1: solo a veces se da cuenta.
  if (rand() < 0.3) {
    const tactical = tacticalMove(board, me)
    if (tactical >= 0) return tactical
  }
  return cells[Math.floor(rand() * cells.length)]
}

export interface MatchScore {
  wins: number
  draws: number
  losses: number
  level: Difficulty
}

/** Objetivo de cada nivel. En el 3, empatar al rival perfecto ya es exito. */
export function matchPassed({ wins, losses, level }: MatchScore): boolean {
  if (level === 3) return losses === 0
  return wins >= 2
}

export function scoreMatch({ wins, draws, level }: MatchScore): number {
  return wins * 320 + draws * (level === 3 ? 180 : 70) + level * 60
}

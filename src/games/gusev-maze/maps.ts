/**
 * LABERINTO DE GUSEV - mapas.
 * -------------------------------------------------------------------------
 * Disenados a mano, nunca generados al azar: el plan exige que cada mapa
 * tenga una solucion comprobada. `maps.test.ts` verifica para los tres que
 * el borde sea solido, que exista salida y casa de remolinos, y sobre todo
 * que TODAS las muestras sean alcanzables desde la posicion inicial.
 *
 * Leyenda:
 *   #  pared
 *   .  muestra de suelo (hay que recogerlas todas)
 *   o  suelo brillante (muestra rara, vale mas)
 *   P  posicion inicial del rover
 *   G  casa de remolinos (sin muestra)
 *   ' ' pasillo sin muestra
 */

export type Tile = '#' | '.' | 'o' | 'P' | 'G' | ' '

export interface MazeTuning {
  map: string[]
  /** Remolinos en juego. */
  ghosts: number
  /** Velocidad del rover, casillas por segundo. */
  playerSpeed: number
  /** Velocidad de los remolinos. */
  ghostSpeed: number
  /** Segundos que dura el brillo tras una limpieza. */
  cleanSecs: number
  /** Segundos hasta que el polvo cubre del todo los paneles. */
  dustSecs: number
}

const L1 = [
  '#####################',
  '#.........#.........#',
  '#.###.###.#.###.###.#',
  '#o.......###.......o#',
  '#.###.#.......#.###.#',
  '#.....#.#####.#.....#',
  '#.###.#.#GGG#.#.###.#',
  '#.....#.......#.....#',
  '#.###.#.#####.#.###.#',
  '#o.......###.......o#',
  '#.###.###.#.###.###.#',
  '#.........P.........#',
  '#####################',
]

const L2 = [
  '#####################',
  '#....#....#....#....#',
  '#.##.#.##.#.##.#.##.#',
  '#o##...##...##...##o#',
  '#....#..#.#..#....#.#',
  '#.##.#.##.##.#.##...#',
  '#....#.#GGG#.#....#.#',
  '#.##...#####...##...#',
  '#.#..#.......#..#.#.#',
  '#o.#.###.#.###.#..o.#',
  '#.##...#...#...##.#.#',
  '#......#.P.#........#',
  '#####################',
]

const L3 = [
  '#####################',
  '#...#.....#.....#...#',
  '#.#.#.###.#.###.#.#.#',
  '#o#...#.....#...#..o#',
  '#.###.#.###.#.###.#.#',
  '#.....#.#GGG#.#.....#',
  '#.#####.#####.#####.#',
  '#.......#...#.......#',
  '#.#####.#.#.#.#####.#',
  '#o....#...#...#....o#',
  '#.###.#.#####.#.###.#',
  '#.....#...P...#.....#',
  '#####################',
]

export const MAZE_LEVELS: Record<1 | 2 | 3, MazeTuning> = {
  // Difficulty has to rise with the level: level 1 is the gentle one (two
  // devils, slow dust), level 3 the hardest (four devils, fast dust).
  1: { map: L1, ghosts: 2, playerSpeed: 5.6, ghostSpeed: 4.2, cleanSecs: 1.5, dustSecs: 40 },
  2: { map: L2, ghosts: 3, playerSpeed: 6, ghostSpeed: 5, cleanSecs: 1.5, dustSecs: 32 },
  3: { map: L3, ghosts: 4, playerSpeed: 6.4, ghostSpeed: 5.7, cleanSecs: 1.5, dustSecs: 26 },
}

export const MAZE_MAPS = [L1, L2, L3]

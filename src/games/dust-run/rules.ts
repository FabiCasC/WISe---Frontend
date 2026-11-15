/**
 * TORMENTA EN MERIDIANI - reglas puras.
 * -------------------------------------------------------------------------
 * Sin Phaser, sin DOM, sin canvas: todo lo que decide si una partida es
 * justa vive aqui y se prueba con Vitest.
 *
 * La mecanica nace de un hecho real: Opportunity era solar. Cuando la
 * tormenta de polvo de 2018 tapo el cielo, la energia dejo de entrar. Por eso
 * en el juego la energia baja SOLA y la unica forma de recuperarla es
 * atrapar los claros de luz.
 */

export type ObstacleKind = 'rock' | 'dune' | 'gust'

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface Obstacle extends Box {
  kind: ObstacleKind
}

export interface Pickup extends Box {
  taken: boolean
  /** Fase para la animacion de flotado. No afecta a la colision. */
  phase: number
}

export interface LevelTuning {
  /** Metros que hay que recorrer para completar el nivel. */
  targetDistance: number
  /** Energia perdida por segundo (el cielo se cierra). */
  drainPerSec: number
  /** Velocidad inicial del terreno, px/s. */
  baseSpeed: number
  /** Velocidad maxima, px/s. */
  maxSpeed: number
  /** Cuanto acelera por metro recorrido. */
  accelPerMeter: number
  /** Las rafagas altas (obligan a agacharse) solo aparecen desde el nivel 2. */
  gusts: boolean
  /** Probabilidad de que un hueco traiga un claro de luz. */
  pickupChance: number
}

export const WORLD = {
  width: 960,
  height: 420,
  /** Linea del suelo (parte alta del terreno). */
  groundY: 330,
  /** El rover corre siempre en esta X: la camara avanza, no el rover. */
  roverX: 140,
  roverW: 66,
  roverH: 52,
  roverDuckH: 30,
  gravity: 2600,
  jumpV: -880,
  /** Energia inicial y maxima. */
  maxEnergy: 100,
  /** Energia que cuesta un choque. Permite cuatro fallos, no tres. */
  crashCost: 28,
  /** Energia que devuelve un claro de luz. */
  pickupGain: 18,
  /** Pixeles que equivalen a un metro recorrido. */
  pxPerMeter: 11,
} as const

export const LEVELS: Record<1 | 2 | 3, LevelTuning> = {
  1: {
    targetDistance: 600,
    drainPerSec: 2.1,
    baseSpeed: 330,
    maxSpeed: 560,
    accelPerMeter: 0.22,
    gusts: false,
    pickupChance: 0.55,
  },
  2: {
    targetDistance: 1000,
    drainPerSec: 2.9,
    baseSpeed: 370,
    maxSpeed: 650,
    accelPerMeter: 0.26,
    gusts: true,
    pickupChance: 0.45,
  },
  3: {
    targetDistance: 1500,
    drainPerSec: 3.6,
    baseSpeed: 410,
    maxSpeed: 740,
    accelPerMeter: 0.3,
    gusts: true,
    pickupChance: 0.38,
  },
}

/**
 * Dust opacity tau over the run (real values). NASA: at tau 3 only about 5%
 * of direct sunlight reaches the surface (PIA22737), and on Opportunity's
 * last day tau was about 10.8 (PIA22930). Level 3 ends right there.
 */
export const TAU: Record<1 | 2 | 3, [number, number]> = {
  1: [0.5, 2],
  2: [1, 5],
  3: [3, 10.8],
}

export function tauAt(level: 1 | 2 | 3, progress: number): number {
  const [a, b] = TAU[level]
  const p = Math.min(1, Math.max(0, progress))
  return a + (b - a) * p
}

/** Fraction of direct sunlight that gets through: e^-tau (Beer-Lambert). */
export function directSunlight(tau: number): number {
  return Math.exp(-tau)
}

/** Darker sky, faster drain: the panels make less than the rover uses. */
export function drainFactor(tau: number): number {
  return 0.55 + 0.6 * (1 - directSunlight(tau))
}

/** Solapamiento de rectangulos (AABB). */
export function hits(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/** Caja de colision del rover segun si va agachado. Mas baja = pasa la rafaga. */
export function roverBox(y: number, ducking: boolean): Box {
  const h = ducking ? WORLD.roverDuckH : WORLD.roverH
  return {
    x: WORLD.roverX,
    // `y` es la base del rover; la caja crece hacia arriba.
    y: y - h,
    w: WORLD.roverW,
    h,
  }
}

export function speedAt(tuning: LevelTuning, meters: number): number {
  return Math.min(tuning.maxSpeed, tuning.baseSpeed + meters * tuning.accelPerMeter)
}

/**
 * Hueco minimo entre obstaculos para que SIEMPRE sean esquivables.
 * Se calcula con el tiempo real de un salto completo a la velocidad actual:
 * si el hueco fuese menor, existiria una pared imposible y el juego seria
 * injusto por diseno. Esto es una garantia, no un ajuste estetico.
 */
export function minGap(speed: number): number {
  const airtime = (2 * Math.abs(WORLD.jumpV)) / WORLD.gravity
  return speed * airtime * 1.15 + 90
}

export function createObstacle(kind: ObstacleKind, x: number): Obstacle {
  if (kind === 'rock') return { kind, x, y: WORLD.groundY - 40, w: 38, h: 40 }
  if (kind === 'dune') return { kind, x, y: WORLD.groundY - 30, w: 92, h: 30 }
  // Rafaga a la altura del mastil: alcanza al rover de pie (52 px) y deja
  // pasar al agachado (30 px). Las medidas estan atadas a roverH/roverDuckH
  // y `rules.test.ts` comprueba las dos condiciones.
  return { kind, x, y: WORLD.groundY - 68, w: 74, h: 34 }
}

/** Altura a la que flota un claro de luz: siempre alcanzable de un salto. */
export function createPickup(x: number, high: boolean): Pickup {
  return {
    x,
    y: high ? WORLD.groundY - 128 : WORLD.groundY - 92,
    w: 26,
    h: 26,
    taken: false,
    phase: 0,
  }
}

export interface RunScore {
  meters: number
  pickups: number
  energyLeft: number
  completed: boolean
}

/**
 * Puntuacion. Decide el plan: avanzar puntua, recoger luz puntua mas, y
 * terminar con energia de sobra da un extra. Asi premia jugar bien, no solo
 * sobrevivir.
 */
export function scoreRun({ meters, pickups, energyLeft, completed }: RunScore): number {
  const base = Math.floor(meters)
  const light = pickups * 45
  const spare = completed ? Math.floor(energyLeft) * 3 : 0
  const bonus = completed ? 250 : 0
  return base + light + spare + bonus
}

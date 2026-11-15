import { describe, expect, it } from 'vitest'
import {
  createObstacle,
  createPickup,
  hits,
  LEVELS,
  minGap,
  roverBox,
  scoreRun,
  speedAt,
  WORLD,
} from './rules'
import { directSunlight, drainFactor, tauAt } from './rules'

describe('colisiones', () => {
  it('detecta el solape y respeta el contacto justo en el borde', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 }
    expect(hits(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(true)
    // Tocarse sin invadir no es choque: si no, el salto perfecto fallaria.
    expect(hits(a, { x: 10, y: 0, w: 10, h: 10 })).toBe(false)
    expect(hits(a, { x: 20, y: 0, w: 10, h: 10 })).toBe(false)
  })
})

describe('caja del rover', () => {
  it('agachado ocupa menos alto y por eso pasa bajo una rafaga', () => {
    const standing = roverBox(WORLD.groundY, false)
    const ducking = roverBox(WORLD.groundY, true)
    expect(ducking.h).toBeLessThan(standing.h)

    const gust = createObstacle('gust', WORLD.roverX)
    expect(hits(standing, gust)).toBe(true)
    expect(hits(ducking, gust)).toBe(false)
  })

  it('saltar libra una roca, y quedarse en el suelo no', () => {
    const rock = createObstacle('rock', WORLD.roverX)
    expect(hits(roverBox(WORLD.groundY, false), rock)).toBe(true)
    // A media altura de salto el rover ya esta por encima de la roca.
    expect(hits(roverBox(WORLD.groundY - 110, false), rock)).toBe(false)
  })
})

describe('ritmo del nivel', () => {
  it('acelera con la distancia pero nunca pasa del tope', () => {
    const t = LEVELS[1]
    expect(speedAt(t, 0)).toBe(t.baseSpeed)
    expect(speedAt(t, 100)).toBeGreaterThan(t.baseSpeed)
    expect(speedAt(t, 100000)).toBe(t.maxSpeed)
  })

  it('sube la exigencia de nivel 1 a 3', () => {
    expect(LEVELS[1].targetDistance).toBeLessThan(LEVELS[3].targetDistance)
    expect(LEVELS[1].drainPerSec).toBeLessThan(LEVELS[3].drainPerSec)
    expect(LEVELS[1].gusts).toBe(false)
    expect(LEVELS[3].gusts).toBe(true)
  })
})

describe('el hueco entre obstaculos siempre es saltable', () => {
  /**
   * Garantia del diseno: a cualquier velocidad del juego, el hueco minimo
   * supera lo que el rover avanza durante un salto completo. Sin esto podria
   * generarse una pared imposible y el nivel seria injusto.
   */
  it('deja mas espacio del que recorre un salto entero', () => {
    const airtime = (2 * Math.abs(WORLD.jumpV)) / WORLD.gravity
    for (const level of [1, 2, 3] as const) {
      const t = LEVELS[level]
      for (const meters of [0, 250, 800, 5000]) {
        const speed = speedAt(t, meters)
        expect(minGap(speed)).toBeGreaterThan(speed * airtime)
      }
    }
  })

  it('un salto dura lo suficiente para cruzar la duna mas ancha', () => {
    const airtime = (2 * Math.abs(WORLD.jumpV)) / WORLD.gravity
    const dune = createObstacle('dune', 0)
    const topSpeed = Math.max(...[1, 2, 3].map((l) => LEVELS[l as 1 | 2 | 3].maxSpeed))
    expect(topSpeed * airtime).toBeGreaterThan(dune.w + WORLD.roverW)
  })
})

describe('claros de luz', () => {
  it('quedan siempre al alcance de un salto', () => {
    const peak = WORLD.groundY - (WORLD.jumpV * WORLD.jumpV) / (2 * WORLD.gravity)
    for (const high of [false, true]) {
      const pickup = createPickup(0, high)
      // La parte alta del rover en el punto mas alto del salto.
      expect(peak - WORLD.roverH).toBeLessThanOrEqual(pickup.y)
      expect(pickup.y + pickup.h).toBeGreaterThan(peak - WORLD.roverH)
    }
  })
})

describe('puntuacion', () => {
  it('premia terminar por encima de solo sobrevivir', () => {
    const finished = scoreRun({ meters: 600, pickups: 4, energyLeft: 40, completed: true })
    const died = scoreRun({ meters: 600, pickups: 4, energyLeft: 0, completed: false })
    expect(finished).toBeGreaterThan(died)
  })

  it('nunca devuelve una puntuacion negativa', () => {
    expect(scoreRun({ meters: 0, pickups: 0, energyLeft: 0, completed: false })).toBe(0)
  })
})

describe('dust opacity (tau)', () => {
  it('tau 3 lets through about 5% of direct sunlight', () => {
    expect(directSunlight(3)).toBeCloseTo(0.05, 2)
  })
  it('level 3 ends at the tau of Opportunity last day', () => {
    expect(tauAt(3, 1)).toBeCloseTo(10.8)
    expect(tauAt(1, 0)).toBe(0.5)
  })
  it('a darker sky drains energy faster', () => {
    expect(drainFactor(10.8)).toBeGreaterThan(drainFactor(0.5))
  })
})

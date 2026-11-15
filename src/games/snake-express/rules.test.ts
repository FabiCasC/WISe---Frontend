/**
 * SNAKE EXPRESS — Pruebas de las reglas puras
 */
import { describe, it, expect } from 'vitest'
import { GRID } from './config'
import {
  vecEquals,
  isOpposite,
  moveVec,
  isOutOfBounds,
  collidesWithObstacles,
  collidesWithWagon,
  generateObstacles,
  calcRecoveryPct,
  calcScore,
  seededRandom,
} from './rules'

describe('vecEquals', () => {
  it('devuelve true para posiciones iguales', () => {
    expect(vecEquals({ x: 3, y: 4 }, { x: 3, y: 4 })).toBe(true)
  })
  it('devuelve false para posiciones distintas', () => {
    expect(vecEquals({ x: 3, y: 4 }, { x: 3, y: 5 })).toBe(false)
  })
})

describe('isOpposite', () => {
  it('up y down son opuestos', () => expect(isOpposite('up', 'down')).toBe(true))
  it('left y right son opuestos', () => expect(isOpposite('left', 'right')).toBe(true))
  it('up y right no son opuestos', () => expect(isOpposite('up', 'right')).toBe(false))
})

describe('moveVec', () => {
  it('mueve hacia arriba', () => expect(moveVec({ x: 5, y: 5 }, 'up')).toEqual({ x: 5, y: 4 }))
  it('mueve hacia abajo', () => expect(moveVec({ x: 5, y: 5 }, 'down')).toEqual({ x: 5, y: 6 }))
  it('mueve a la izquierda', () => expect(moveVec({ x: 5, y: 5 }, 'left')).toEqual({ x: 4, y: 5 }))
  it('mueve a la derecha', () => expect(moveVec({ x: 5, y: 5 }, 'right')).toEqual({ x: 6, y: 5 }))
})

describe('isOutOfBounds', () => {
  it('detecta posición fuera por x negativo', () => expect(isOutOfBounds({ x: -1, y: 5 })).toBe(true))
  it('detecta posición fuera por y negativo', () => expect(isOutOfBounds({ x: 5, y: -1 })).toBe(true))
  it('no reporta fuera de límites en posición válida', () => expect(isOutOfBounds({ x: 5, y: 5 })).toBe(false))
})

describe('collidesWithObstacles', () => {
  const obstacles = [{ pos: { x: 2, y: 3 }, kind: 'rock' as const }]
  it('detecta colisión con roca', () => expect(collidesWithObstacles({ x: 2, y: 3 }, obstacles)).toBe(true))
  it('no detecta colisión donde no hay roca', () => expect(collidesWithObstacles({ x: 2, y: 4 }, obstacles)).toBe(false))
})

describe('collidesWithWagon', () => {
  const wagons = [{ x: 5, y: 5 }, { x: 5, y: 6 }]
  it('detecta colisión con vagón', () => expect(collidesWithWagon({ x: 5, y: 5 }, wagons)).toBe(true))
  it('no detecta colisión en celda vacía', () => expect(collidesWithWagon({ x: 5, y: 7 }, wagons)).toBe(false))
})

describe('generateObstacles', () => {
  it('genera la cantidad solicitada', () => {
    const rng = seededRandom(42)
    const obs = generateObstacles(6, rng)
    expect(obs.length).toBe(6)
  })

  it('no genera obstáculos en la zona de inicio', () => {
    const rng = seededRandom(99)
    const obs = generateObstacles(9, rng)
    const startX = Math.floor(GRID.cols / 2)
    const startY = Math.floor(GRID.rows / 2)
    for (const o of obs) {
      const dx = Math.abs(o.pos.x - startX)
      const dy = Math.abs(o.pos.y - startY)
      expect(dx > 3 || dy > 3).toBe(true)
    }
  })
})

describe('calcRecoveryPct', () => {
  it('devuelve 100% si todas las muestras se entregan', () => expect(calcRecoveryPct(8, 8)).toBe(100))
  it('devuelve 0% si no se recolectó nada', () => expect(calcRecoveryPct(0, 0)).toBe(0))
  it('no divide por cero cuando collected es 0', () => expect(calcRecoveryPct(0, 5)).toBe(0))
  it('calcula porcentaje parcial correctamente', () => expect(calcRecoveryPct(8, 4)).toBe(50))
})

describe('calcScore', () => {
  it('devuelve 0 en misión fallida', () => {
    expect(calcScore({ samplesCollected: 8, samplesDelivered: 0, difficulty: 'easy', missionSuccess: false })).toBe(0)
  })
  it('calcula puntos por muestras entregadas', () => {
    const score = calcScore({ samplesCollected: 8, samplesDelivered: 8, difficulty: 'easy', missionSuccess: true })
    expect(score).toBeGreaterThan(0)
  })
  it('da bonus por completar el objetivo', () => {
    const withBonus = calcScore({ samplesCollected: 8, samplesDelivered: 8, difficulty: 'easy', missionSuccess: true })
    const without = calcScore({ samplesCollected: 8, samplesDelivered: 5, difficulty: 'easy', missionSuccess: true })
    expect(withBonus).toBeGreaterThan(without)
  })
})

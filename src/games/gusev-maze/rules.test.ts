import { describe, expect, it } from 'vitest'
import { MAZE_LEVELS, type MazeTuning } from './maps'
import {
  chooseGhostDir,
  createMover,
  devilSpeed,
  driveFactor,
  dustAfterRespawn,
  moverPos,
  panelPower,
  parseMaze,
  roverSpeed,
  scoreMaze,
  stepMover,
  CLEAN_MIN_DUST,
  DRIVE_FLOOR,
  RESPAWN_DUST,
  SMART_CLEAN_DUST,
} from './rules'

/**
 * Reglas del LABERINTO DE GUSEV.
 * -------------------------------------------------------------------------
 * `maps.test.ts` comprueba que los mapas se puedan recorrer. Esto comprueba
 * que las REGLAS enseñen lo que el juego dice enseñar: que el polvo cueste,
 * que perseguir un remolino sea siempre posible, y que morir no sea un atajo
 * para saltarse la leccion.
 */

/** Laberinto minimo: un cuadrado con una pared central. */
const TINY = parseMaze(['#####', '#...#', '#.#.#', '#.P.#', '#####'])

/** (1,1) es un callejon sin salida: su unica salida es hacia la derecha. */
const DEAD_END = parseMaze(['#####', '#...#', '###.#', '#####'])

/** Rand determinista: el ruido de desempate no debe decidir los tests. */
const noRand = () => 0

describe('panelPower', () => {
  it('va de 100% a 0% y llega a cero justo donde muere el rover', () => {
    // Es el numero que lee el jugador. Si marcase 40% mientras el juego lo
    // mata por falta de energia, el HUD estaria mintiendo.
    expect(panelPower(0)).toBe(1)
    expect(panelPower(1)).toBe(0)
    expect(panelPower(0.5)).toBeCloseTo(0.5, 10)
  })

  it('acota valores fuera de rango y nunca sube con mas polvo', () => {
    expect(panelPower(-3)).toBe(1)
    expect(panelPower(4)).toBe(0)
    let prev = Infinity
    for (let d = 0; d <= 1.0001; d += 0.05) {
      const p = panelPower(d)
      expect(p).toBeLessThan(prev)
      expect(p).toBeGreaterThanOrEqual(0)
      prev = p
    }
  })
})

describe('driveFactor', () => {
  it('frena al rover pero nunca lo deja clavado', () => {
    // Un rover parado del todo no podria llegar al remolino que el propio
    // juego le esta pidiendo que busque.
    expect(driveFactor(0)).toBe(1)
    expect(driveFactor(1)).toBeCloseTo(DRIVE_FLOOR, 10)
    for (let d = 0; d <= 1.0001; d += 0.05) {
      expect(driveFactor(d)).toBeGreaterThanOrEqual(DRIVE_FLOOR)
      expect(driveFactor(d)).toBeLessThanOrEqual(1)
    }
  })

  it('es el unico sitio donde el polvo toca la velocidad', () => {
    const t = MAZE_LEVELS[1]
    expect(roverSpeed(t, 0.4)).toBeCloseTo(t.playerSpeed * driveFactor(0.4), 10)
  })
})

describe('scoreMaze', () => {
  const EMPTY = { pellets: 0, powers: 0, scattered: 0, livesLeft: 0, completed: false }

  it('no da puntos por no hacer nada', () => {
    expect(scoreMaze(EMPTY)).toBe(0)
  })

  it('paga cada cosa por su peso', () => {
    expect(scoreMaze({ ...EMPTY, pellets: 7 })).toBe(70)
    expect(scoreMaze({ ...EMPTY, powers: 3 })).toBe(150)
    expect(scoreMaze({ ...EMPTY, scattered: 2 })).toBe(400)
  })

  it('premia el evento de limpieza por encima de la muestra', () => {
    // El juego existe para enseñar los eventos de limpieza: provocarlos tiene
    // que rendir mas que recoger una muestra mas.
    expect(scoreMaze({ ...EMPTY, scattered: 1 })).toBeGreaterThan(
      scoreMaze({ ...EMPTY, pellets: 10 })
    )
  })

  it('solo da bonus de vidas si se termina el nivel', () => {
    expect(scoreMaze({ ...EMPTY, livesLeft: 3, completed: false })).toBe(0)
    expect(scoreMaze({ ...EMPTY, livesLeft: 3, completed: true })).toBe(750)
    expect(scoreMaze({ ...EMPTY, livesLeft: 0, completed: true })).toBe(300)
  })

  it('sube con cada vida que sobra', () => {
    const at = (livesLeft: number) => scoreMaze({ ...EMPTY, pellets: 50, livesLeft, completed: true })
    expect(at(0)).toBeLessThan(at(1))
    expect(at(1)).toBeLessThan(at(2))
  })
})

describe('stepMover', () => {
  it('no deja arrancar contra una pared', () => {
    // (2,3) tiene la pared central justo encima.
    const m = createMover(2, 3)
    m.want = 'up'
    expect(stepMover(TINY, m, 1, 1)).toBe(false)
    expect([m.x, m.y]).toEqual([2, 3])
    expect(m.dir).toBe('none')
  })

  it('avisa solo al asentarse en la casilla nueva', () => {
    const m = createMover(2, 3)
    m.want = 'left'
    expect(stepMover(TINY, m, 1, 0.5)).toBe(false)
    expect([m.x, m.y]).toEqual([2, 3])
    expect(moverPos(m).x).toBeCloseTo(1.5, 10)
    expect(stepMover(TINY, m, 1, 0.5)).toBe(true)
    expect([m.x, m.y]).toEqual([1, 3])
  })

  it('sigue recto por un pasillo sin que se lo pidan otra vez', () => {
    const m = createMover(1, 3)
    m.want = 'up'
    expect(stepMover(TINY, m, 1, 1)).toBe(true)
    expect([m.x, m.y]).toEqual([1, 2])
    // Ya apunta a (1,1): el jugador no tiene que repetir la tecla.
    expect(m.dir).toBe('up')
    expect([m.tx, m.ty]).toEqual([1, 1])
  })

  it('se para al chocar en vez de atravesar la pared', () => {
    const m = createMover(2, 3)
    m.want = 'right'
    expect(stepMover(TINY, m, 1, 1)).toBe(true)
    expect([m.x, m.y]).toEqual([3, 3])
    // A la derecha de (3,3) hay muro: se queda quieto, no se cuela.
    expect(m.dir).toBe('none')
    expect([m.tx, m.ty]).toEqual([3, 3])
    expect(stepMover(TINY, m, 1, 1)).toBe(false)
    expect([m.x, m.y]).toEqual([3, 3])
  })

  it('permite el giro en seco a mitad de pasillo', () => {
    // Sin esto, huir de un remolino de frente se siente bloqueado.
    const m = createMover(2, 3)
    m.want = 'right'
    stepMover(TINY, m, 1, 0.5)
    m.want = 'left'
    expect(stepMover(TINY, m, 1, 0.5)).toBe(true)
    expect([m.x, m.y]).toEqual([2, 3])
    expect(m.dir).toBe('left')
  })
})

describe('chooseGhostDir', () => {
  it('nunca se da la vuelta en mitad de un pasillo', () => {
    // Un remolino que se gira encima del rover seria imposible de leer.
    const m = createMover(1, 2)
    m.dir = 'up'
    expect(chooseGhostDir(TINY, m, { x: 1, y: 3 }, false, noRand)).toBe('up')
  })

  it('vuelve sobre sus pasos solo en un callejon sin salida', () => {
    const m = createMover(1, 1)
    m.dir = 'left'
    expect(chooseGhostDir(DEAD_END, m, { x: 3, y: 1 }, false, noRand)).toBe('right')
  })

  it('elige la salida que mas lo acerca a su objetivo', () => {
    const m = createMover(2, 1)
    expect(chooseGhostDir(TINY, m, { x: 3, y: 1 }, false, noRand)).toBe('right')
    expect(chooseGhostDir(TINY, m, { x: 1, y: 1 }, false, noRand)).toBe('left')
  })

  it('invierte el criterio cuando huye', () => {
    const m = createMover(2, 1)
    expect(chooseGhostDir(TINY, m, { x: 3, y: 1 }, true, noRand)).toBe('left')
  })

  it('devuelve siempre una direccion transitable', () => {
    const m = createMover(2, 1)
    for (let i = 0; i < 40; i++) {
      const dir = chooseGhostDir(TINY, m, { x: 1, y: 3 }, i % 2 === 0, Math.random)
      expect(['left', 'right']).toContain(dir)
    }
  })
})

/**
 * Casillas que el rover puede recorrer SIN cruzarse nunca con un remolino,
 * gastando `lives` vidas por paneles cubiertos. Reproduce el bucle real:
 * misma acumulacion de polvo y misma velocidad efectiva que `index.ts`.
 */
function cellsWithoutCleaning(t: MazeTuning, lives: number, respawn: (d: number) => number) {
  let dust = 0
  let cells = 0
  while (lives > 0) {
    dust += 1 / roverSpeed(t, dust) / t.dustSecs
    if (dust >= 1) {
      lives--
      dust = respawn(dust)
      continue
    }
    cells++
  }
  return cells
}

/** Lo que de verdad hace el juego al respawnear. */
const fixedRespawn = (d: number) => dustAfterRespawn(d)
/** El bug: morir equivalia a una limpieza perfecta y gratis. */
const buggyRespawn = () => 0

describe('morir no sustituye a un evento de limpieza', () => {
  it('conserva la mayor parte del polvo al perder una vida', () => {
    // Si volviese con dust = 0, morir SERIA el evento de limpieza, y el
    // jugador podria terminar el nivel sin saber para que sirve un remolino.
    expect(dustAfterRespawn(1)).toBe(RESPAWN_DUST)
    expect(dustAfterRespawn(1)).toBeGreaterThan(0.5)
    expect(dustAfterRespawn(1)).toBeLessThan(1)
  })

  it('no ensucia mas los paneles de lo que ya estaban', () => {
    expect(dustAfterRespawn(0.2)).toBe(0.2)
    expect(dustAfterRespawn(0)).toBe(0)
  })

  it('deja margen para llegar a un remolino tras revivir', () => {
    // El arreglo no puede convertirse en una espiral de muerte: hay que
    // conservar varios segundos de conduccion en cada nivel.
    for (const lvl of [1, 2, 3] as const) {
      const t = MAZE_LEVELS[lvl]
      const secsLeft = (1 - dustAfterRespawn(1)) * t.dustSecs
      expect(secsLeft).toBeGreaterThan(8)
    }
  })

  it('recorta a la mitad la estrategia de morir en vez de perseguir', () => {
    for (const lvl of [1, 2, 3] as const) {
      const t = MAZE_LEVELS[lvl]
      const fixed = cellsWithoutCleaning(t, 3, fixedRespawn)
      const buggy = cellsWithoutCleaning(t, 3, buggyRespawn)
      expect(fixed).toBeLessThan(buggy * 0.6)
    }
  })

  it('hace que UN evento de limpieza rinda mas que morir las tres veces', () => {
    // La leccion en numeros: una limpieza devuelve el deposito entero y no
    // cuesta nada; tres muertes devuelven menos y cuestan la partida.
    for (const lvl of [1, 2, 3] as const) {
      const t = MAZE_LEVELS[lvl]
      const oneTank = cellsWithoutCleaning(t, 1, fixedRespawn)
      const threeDeaths = cellsWithoutCleaning(t, 3, fixedRespawn)
      // Deposito inicial + una limpieza, sin perder ni una vida.
      expect(oneTank * 2).toBeGreaterThan(threeDeaths)
      // Y cada muerte rinde menos de medio deposito.
      expect((threeDeaths - oneTank) / 2).toBeLessThan(oneTank * 0.5)
    }
  })
})

describe('perseguir un remolino siempre es posible', () => {
  it('nunca deja al remolino mas rapido que el rover, con cualquier polvo', () => {
    // El defecto original: el rover bajaba a 0.4x con el polvo y el remolino
    // mantenia su velocidad, asi que a partir de dust ~0.63 el remolino era
    // mas rapido. Es decir, el juego se volvia imposible justo cuando pedia
    // perseguir uno. Se comparan las velocidades EFECTIVAS.
    for (const lvl of [1, 2, 3] as const) {
      const t = MAZE_LEVELS[lvl]
      for (let dust = 0; dust <= 1.0001; dust += 0.02) {
        expect(roverSpeed(t, dust)).toBeGreaterThan(devilSpeed(t, dust))
      }
    }
  })

  it('mantiene constante la ventaja del rover sobre el remolino', () => {
    // Al compartir driveFactor, la ventaja no depende del polvo: perseguir se
    // siente igual de justo con los paneles limpios que cubiertos.
    for (const lvl of [1, 2, 3] as const) {
      const t = MAZE_LEVELS[lvl]
      const clean = roverSpeed(t, 0) / devilSpeed(t, 0)
      const dirty = roverSpeed(t, 1) / devilSpeed(t, 1)
      expect(dirty).toBeCloseTo(clean, 10)
      expect(dirty).toBeGreaterThan(1.1)
    }
  })
})

describe('umbrales del evento de limpieza', () => {
  it('no gasta un remolino cuando no hay nada que limpiar', () => {
    // Rozar un remolino con los paneles limpios no puede consumirlo en
    // silencio: por debajo de este umbral el juego lo deja donde estaba.
    expect(CLEAN_MIN_DUST).toBeGreaterThan(0)
    expect(CLEAN_MIN_DUST).toBeLessThan(SMART_CLEAN_DUST)
  })

  it('solo cuenta como decision acertada si de verdad hacia falta', () => {
    expect(SMART_CLEAN_DUST).toBeGreaterThan(CLEAN_MIN_DUST)
    expect(SMART_CLEAN_DUST).toBeLessThan(1)
    // Y con ese polvo el HUD ya avisa de que queda poca energia.
    expect(panelPower(SMART_CLEAN_DUST)).toBeLessThan(0.7)
  })
})

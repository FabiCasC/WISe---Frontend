import type { ArcadeId, LevelId } from '../shared/types'

/**
 * SALA ARCADE — minijuegos cortos.
 * -------------------------------------------------------------------------
 * Cumplen el mismo contrato que las misiones (src/shared/types.ts) y guardan
 * progreso igual, pero NO cuentan para el nivel general: el nivel general
 * mide las tres misiones narrativas y nada mas.
 *
 * Regla heredada del plan: cada minijuego usa un hecho real como mecanica.
 * Nada de "vida en Marte"; lo que el juego inventa se declara en `dramatization`.
 */

export interface ArcadeLevel {
  id: LevelId
  name: string
  /** Objetivo visible en la UI, en una linea. */
  goal: string
}

export interface ArcadeCard {
  gameId: ArcadeId
  title: string
  kicker: string
  genre: string
  /** Hecho real que sostiene la mecanica. Se muestra al terminar la partida. */
  fact: string
  /** Lo que el juego inventa. Obligatorio. */
  dramatization: string
  learning: string
  accent: string
  durationMin: [number, number]
  levels: ArcadeLevel[]
  /** Evidencia que sella la partida, con el mismo formato que las misiones. */
  evidence: { id: string; label: string; meaning: string }[]
}

export const ARCADE: ArcadeCard[] = [
  {
    gameId: 'dust-run',
    title: 'Tormenta en Meridiani',
    kicker: 'Carrera sin fin · Opportunity',
    genre: 'Esquiva y energía',
    fact:
      'Opportunity funcionaba con paneles solares. En junio de 2018 una tormenta de polvo global tapó el cielo de Marte: sin luz no había energía, y el 10 de junio llegó su última señal.',
    dramatization:
      'El rover nunca corrió ni saltó: avanzaba a centímetros por segundo. La carrera y los saltos son recursos del juego para que se sienta la pérdida de luz.',
    learning: 'Sin luz solar no hay energía: por eso la tormenta apagó al rover.',
    accent: '#E68A68',
    durationMin: [1, 3],
    levels: [
      { id: 1, name: 'Cielo claro', goal: 'Recorrer 600 m sin quedarte sin energía' },
      { id: 2, name: 'Polvo en suspensión', goal: '1000 m · llegan ráfagas altas' },
      { id: 3, name: 'Noche a mediodía', goal: '1500 m · el cielo se cierra deprisa' },
    ],
    evidence: [
      {
        id: 'ev-dust-storm',
        label: 'Tormenta global de 2018',
        meaning:
          'El polvo en suspensión bloqueó la luz solar durante semanas y dejó sin energía a un rover que dependía de sus paneles.',
      },
    ],
  },
  {
    gameId: 'gusev-maze',
    title: 'Laberinto de Gusev',
    kicker: 'Recoge y escapa · Spirit',
    genre: 'Laberinto por turnos',
    fact:
      'En el cráter Gusev los remolinos de polvo (dust devils) pasaban junto a Spirit. Varias veces limpiaron sus paneles solares y le devolvieron energía: un fenómeno que el equipo llamó "eventos de limpieza".',
    dramatization:
      'Spirit no huía de nada ni recogía muestras moviéndose por un laberinto. El tablero, la persecución y las vidas son convenciones del juego.',
    learning: 'Un mismo fenómeno puede estorbar y ayudar según cuándo ocurra.',
    accent: '#F2A65A',
    durationMin: [2, 4],
    levels: [
      { id: 1, name: 'Terreno conocido', goal: 'Reunir todas las muestras · 2 remolinos' },
      { id: 2, name: 'Suelo blando', goal: 'Laberinto abierto · 3 remolinos más rápidos' },
      { id: 3, name: 'Última campaña', goal: 'Sin margen · 4 remolinos' },
    ],
    evidence: [
      {
        id: 'ev-dust-devil',
        label: 'Evento de limpieza',
        meaning:
          'Un remolino de polvo barrió los paneles de Spirit y su energía disponible subió de golpe.',
      },
    ],
  },
  {
    gameId: 'sun-shade',
    title: 'Sol y sombra',
    kicker: 'Cooperativo por parejas · dos fuentes de energía',
    genre: 'Plataformas en pareja',
    fact:
      'Opportunity y Spirit funcionaban con paneles solares: sin luz se apagaban. Curiosity y Perseverance llevan un generador nuclear (RTG) que produce electricidad a partir del calor de su combustible, así que trabajan de noche, en invierno y dentro de la sombra.',
    dramatization:
      'Ningún rover salta ni corre, y jamás trabajaron dos juntos en el mismo terreno. El salto, los charcos y las escotillas son recursos del juego para que se note en qué se diferencian.',
    learning: 'De dónde saca la energía un rover decide por dónde puede ir.',
    accent: '#F2A65A',
    durationMin: [3, 6],
    levels: [
      { id: 1, name: 'Cada uno por su lado', goal: 'Llevar los dos rovers a su escotilla' },
      { id: 2, name: 'Turno de sombra', goal: 'El nuclear abre la puerta del solar' },
      { id: 3, name: 'Relevo', goal: 'Cada uno abre la puerta del otro' },
    ],
    evidence: [
      {
        id: 'ev-rtg',
        label: 'Generador nuclear (RTG)',
        meaning:
          'Convierte en electricidad el calor de su combustible, así que no depende del Sol: por eso Curiosity sigue trabajando donde un rover solar se habría apagado.',
      },
    ],
  },
  {
    gameId: 'orbital-grid',
    title: 'Tres en raya orbital',
    kicker: 'Alinea tres estaciones · Red de Espacio Profundo',
    genre: 'Estrategia por turnos',
    fact:
      'Para hablar con una sonda lejana hace falta que una antena la tenga a la vista. La Red de Espacio Profundo tiene estaciones en California, España y Australia: separadas unos 120° para que siempre haya una apuntando.',
    dramatization:
      'Las antenas reales no se colocan en un tablero ni compiten entre sí. El tres en raya es solo la excusa para hablar de cobertura continua.',
    learning: 'Tres estaciones bien repartidas dan cobertura sin huecos.',
    accent: '#75CBD1',
    durationMin: [1, 3],
    levels: [
      { id: 1, name: 'Enlace de prueba', goal: 'Gana 2 de 3 rondas · rival novato' },
      { id: 2, name: 'Turno compartido', goal: 'Gana 2 de 3 rondas · rival atento' },
      { id: 3, name: 'Cobertura total', goal: 'No pierdas ninguna de 3 rondas · rival perfecto' },
    ],
    evidence: [
      {
        id: 'ev-dsn',
        label: 'Red de Espacio Profundo',
        meaning:
          'Tres complejos de antenas repartidos por el planeta mantienen el contacto con las sondas mientras la Tierra gira.',
      },
    ],
  },
]

export const ARCADE_IDS: ArcadeId[] = ARCADE.map((a) => a.gameId)

export function getArcade(gameId: string): ArcadeCard | undefined {
  return ARCADE.find((a) => a.gameId === gameId)
}

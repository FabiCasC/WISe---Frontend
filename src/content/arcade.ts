import type { LevelId } from '../shared/types'

/** Minijuegos de la sala arcade (también están en content/games.ts). */
export type ArcadeId =
  | 'dust-run'
  | 'gusev-maze'
  | 'orbital-grid'
  | 'sun-shade'
  | 'apollo11-descent'

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
  /** Ids in content/sources.ts that back the fact (official NASA pages). */
  sources?: string[]
}

export const ARCADE: ArcadeCard[] = [
  {
    gameId: 'dust-run',
    title: 'Storm over Meridiani',
    kicker: 'Endless run · Opportunity',
    genre: 'Dodge and power',
    fact:
      'Opportunity ran on solar panels. In June 2018 a planet-wide dust storm darkened the sky: the dust opacity τ climbed to about 10.8, almost no sunlight got through, and its last signal came on June 10.',
    dramatization:
      'The rover never ran or jumped: it moved a few centimeters per second. Running and jumping are game tricks so you can feel the light fading.',
    learning: 'No sunlight, no power: the more dust in the sky (higher τ), the less a solar rover can charge.',
    accent: '#E68A68',
    durationMin: [1, 3],
    levels: [
      { id: 1, name: 'Clear sky', goal: 'Drive 600 m before you run out of power · τ 0.5 → 2' },
      { id: 2, name: 'Dust in the air', goal: '1000 m · high gusts arrive · τ 1 → 5' },
      { id: 3, name: 'Night at noon', goal: '1500 m · τ 3 → 10.8, the real storm' },
    ],
    evidence: [
      {
        id: 'ev-dust-storm',
        label: '2018 global dust storm',
        meaning:
          'Dust in the air blocked sunlight for weeks and left a rover that depended on its panels without power.',
      },
    ],
  },
  {
    gameId: 'gusev-maze',
    title: 'Gusev Maze',
    kicker: 'Collect and clean · Spirit',
    genre: 'Maze',
    fact:
      'In Gusev crater, dust settled on Spirit\'s solar panels and cut its power. Passing dust devils sometimes blew the dust away and its power jumped back up: the team called these "cleaning events".',
    dramatization:
      'Spirit did not drive around a maze. The board and the extra rovers are game rules; the dust on the panels and the cleaning winds are real.',
    learning: 'Dust devils, which look like a danger, actually cleaned the rovers\' panels.',
    accent: '#F2A65A',
    durationMin: [2, 4],
    levels: [
      { id: 1, name: 'Known ground', goal: 'Collect every sample · 2 dust devils' },
      { id: 2, name: 'Dusty season', goal: 'Dust settles faster · 3 dust devils' },
      { id: 3, name: 'Last campaign', goal: 'Very fast dust · plan your route to the devils' },
    ],
    evidence: [
      {
        id: 'ev-dust-devil',
        label: 'Cleaning event',
        meaning: 'A dust devil swept Spirit\'s panels and its available power went up at once.',
      },
    ],
  },
  {
    gameId: 'sun-shade',
    title: 'Sun and Shade',
    kicker: 'Two-player co-op · two power sources',
    genre: 'Co-op platformer',
    fact:
      'Spirit and Opportunity ran on solar panels: without light they stopped. Curiosity and Perseverance carry a nuclear generator (RTG) that turns the heat of decaying plutonium-238 into electricity, so they work at night, in winter and in the shade. Curiosity is also much heavier: 899 kg, about five times Spirit.',
    dramatization:
      'Rovers do not jump, and two never worked side by side. Jumping, soft-sand pits and hatches are game tricks to show how the two power sources differ.',
    learning: 'Where a rover gets its power decides where it can go.',
    accent: '#F2A65A',
    durationMin: [3, 6],
    levels: [
      { id: 1, name: 'Each on its own side', goal: 'Bring both rovers to their hatch' },
      { id: 2, name: 'Shadow shift', goal: 'The nuclear rover opens the solar rover\'s door' },
      { id: 3, name: 'Relay', goal: 'Each opens the other\'s door' },
    ],
    evidence: [
      {
        id: 'ev-rtg',
        label: 'Nuclear generator (RTG)',
        meaning:
          'It turns the heat of its fuel into electricity, so it does not depend on the Sun: that is why Curiosity keeps working where a solar rover would have stopped.',
      },
    ],
  },
  {
    gameId: 'orbital-grid',
    title: 'Keep the Link',
    kicker: 'Place antennas · Deep Space Network',
    genre: 'Strategy and simulation',
    fact:
      'To talk to a far probe, an antenna must have it above its horizon, and the Earth turns once a day. NASA\'s Deep Space Network has three sites, Goldstone (California), Madrid (Spain) and Canberra (Australia), placed around the world so one of them can always see the probe.',
    dramatization:
      'The probe direction is fixed and the horizon is simplified to an 80° view on each side. Real antennas also track the probe and need it to be high enough in the sky.',
    learning: 'Because the Earth turns, you need three antennas spread around the world to never lose a probe.',
    accent: '#75CBD1',
    durationMin: [2, 4],
    levels: [
      { id: 1, name: 'One dish is not enough', goal: '2 dishes · contact 85% of the day' },
      { id: 2, name: 'No blackouts', goal: '3 dishes · contact 100% of the day' },
      { id: 3, name: 'Pick real places', goal: '3 real sites · zero blackouts' },
    ],
    evidence: [
      {
        id: 'ev-dsn',
        label: 'Deep Space Network',
        meaning: 'Three antenna complexes spread around the planet keep in touch with probes while the Earth turns.',
      },
    ],
  },
  {
    gameId: 'apollo11-descent',
    title: 'Land the Eagle',
    kicker: 'Lunar landing · Apollo lunar module',
    genre: 'Landing physics',
    fact:
      'The Moon pulls with 1.62 m/s², about one sixth of Earth’s 9.80 m/s². The Apollo lunar module had two stages: the descent stage, with the landing rocket and four legs, was the launch pad for the ascent stage and was left behind on the Moon. On Apollo 11, Neil Armstrong saw the computer taking Eagle into a boulder-strewn area, flew past it and landed on smoother ground. The low-fuel light had come on at about 100 feet (30 m).',
    dramatization:
      'The real landing burn lasted about 12.6 minutes and the engine could throttle up and down. Here the engine is only on or off, the side jets are simplified, fuel is counted in seconds of burn, and the safe limits (2 m/s down, 1 m/s sideways) are game numbers. The lander is drawn a little bigger than life; only the 9.4 m leg span is real.',
    learning: 'Low gravity lets a small engine land you, but only if you stop sliding and pick flat ground.',
    accent: '#F3B54A',
    durationMin: [1, 3],
    levels: [
      { id: 1, name: 'One-sixth gravity', goal: 'Touch down slower than 2 m/s with a few seconds of fuel' },
      { id: 2, name: 'Stop the drift', goal: 'Cancel an 8 m/s sideways slide before touchdown' },
      { id: 3, name: 'Fly past the boulders', goal: 'Find the smooth ground and land there' },
    ],
    evidence: [
      {
        id: 'ev-lm-descent-stage',
        label: 'Lunar module descent stage',
        meaning:
          'The bottom half of each Apollo lunar module stayed on the Moon as a launch pad. Six of them are still there, from Apollo 11, 12, 14, 15, 16 and 17.',
      },
    ],
    sources: ['nssdc-moon-facts', 'nssdc-apollo11-lm', 'nasa-apollo11-landing', 'nssdc-apollo17-lm'],
  },
]

export const ARCADE_IDS: ArcadeId[] = ARCADE.map((a) => a.gameId)

export function getArcade(gameId: string): ArcadeCard | undefined {
  return ARCADE.find((a) => a.gameId === gameId)
}

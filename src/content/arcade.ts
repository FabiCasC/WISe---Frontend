import type { LevelId } from '../shared/types'

/** Minijuegos de la sala arcade (también están en content/games.ts). */
export type ArcadeId =
  | 'dust-run'
  | 'gusev-maze'
  | 'orbital-grid'
  | 'sun-shade'
  | 'apollo11-descent'
  | 'lunar-rover'
  | 'pathfinder-bounce'
  | 'sojourner-commands'

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
  {
    gameId: 'lunar-rover',
    title: 'Moon Buggy Run',
    kicker: 'Drive and return · Lunar Roving Vehicle',
    genre: 'Top-down driving',
    fact:
      'Three Lunar Roving Vehicles were driven on the Moon, on Apollo 15, 16 and 17, and all three were left there. Each ran on two 36-volt batteries that could not be recharged. A navigation computer kept track of the direction and distance back to the lunar module. The farthest the rovers got from their lunar module was 5.0 km, 4.5 km and 7.6 km.',
    dramatization:
      'Time is sped up and the map is small. The battery is counted in metres of driving, and the size of the walk-back circle is a game number: Apollo planners did keep drives close enough for the crew to walk back if the rover failed, but their real limits changed during each moonwalk. Station names on level 1 come from Apollo 15; their places on the map are invented.',
    learning: 'An explorer with a battery that never recharges must plan the route and always know the way home.',
    accent: '#9FD0FF',
    durationMin: [2, 4],
    levels: [
      { id: 1, name: 'No charger on the Moon', goal: '3 samples and back with a battery that never recharges' },
      { id: 2, name: 'Walking distance', goal: 'Never leave the walk-back circle' },
      { id: 3, name: 'Find the way home', goal: 'Hills hide the LM: follow the navigation arrow' },
    ],
    evidence: [
      {
        id: 'ev-lrv',
        label: 'Lunar Roving Vehicle',
        meaning: 'Three electric rovers carried astronauts across the Moon in 1971 and 1972. They are still parked at the Apollo 15, 16 and 17 sites.',
      },
    ],
    sources: ['nssdc-lrv', 'nssdc-apollo15-alsep', 'nasa-apollo15-hadley'],
  },
  {
    gameId: 'pathfinder-bounce',
    title: 'Pathfinder Bounce',
    kicker: 'Entry, descent and landing · Mars Pathfinder',
    genre: 'Mission-control timing',
    fact:
      'On 4 July 1997 Mars Pathfinder hit the Martian air at about 7300 m/s. Its heat shield slowed it to 400 m/s, then a 12.5 m parachute slowed it to about 70 m/s. Airbags inflated about 10 s before landing, three rockets fired at 98 m and the tether was cut 21.5 m above the ground. Wrapped in airbags it hit at about 18 m/s and bounced at least 15 times. The lander is still in Ares Vallis.',
    dramatization:
      'The clock is sped up high in the sky and slowed down near the ground, and the falling physics is simplified. The tear limit of the parachute (600 m/s), the airbag limit (26 m/s) and the rocket push are game numbers. In 1997 the computer, not a person, triggered every step: nobody on Earth could react in time.',
    learning: 'Landing on Mars needs teamwork between a heat shield, a parachute, rockets and airbags, because its air is thin.',
    accent: '#E68A68',
    durationMin: [1, 3],
    levels: [
      { id: 1, name: 'Let the heat shield work', goal: 'Open the parachute below 600 m/s' },
      { id: 2, name: 'Thin air', goal: 'Fire the braking rockets at about 100 m' },
      { id: 3, name: 'Bounce to a stop', goal: 'Parachute, airbags, rockets and cut the cord' },
    ],
    evidence: [
      {
        id: 'ev-pathfinder-airbags',
        label: 'Airbag landing',
        meaning: 'Pathfinder was the first spacecraft to land inside airbags. It bounced like a giant beach ball and then rolled to a stop.',
      },
    ],
    sources: ['nssdc-pathfinder', 'nasa-pathfinder', 'nssdc-mars-facts'],
  },
  {
    gameId: 'sojourner-commands',
    title: 'Sojourner’s Plan',
    kicker: 'Program the rover · Sojourner',
    genre: 'Programming puzzle',
    fact:
      'Sojourner, the first rover on Mars (1997), was driven by an operator on Earth using pictures from the rover and the Pathfinder lander. Radio signals took 10 to 15 minutes to arrive, so it carried a hazard-avoidance system. All its messages went through the lander. Its APXS, which measured what rocks are made of, was on an arm at the back. Barnacle Bill was the first rock it measured and Yogi the second.',
    dramatization:
      'The terrain is a grid of 1 m squares, one plan per sol, at most 12 commands per plan, and the number of sols are game rules. The rock names are real but their places on the grid are simplified. The hidden rocks on level 3 are invented.',
    learning: 'When a robot is minutes of radio away, you plan ahead and the robot must be smart enough to stop by itself.',
    accent: '#F2A65A',
    durationMin: [2, 5],
    levels: [
      { id: 1, name: 'Ten minutes away', goal: 'Reach Barnacle Bill in 2 sols with planned moves' },
      { id: 2, name: 'Back up to Yogi', goal: 'Measure Yogi with the APXS on the back' },
      { id: 3, name: 'The rover stops itself', goal: 'Measure Wedge past rocks the lander cannot see' },
    ],
    evidence: [
      {
        id: 'ev-sojourner',
        label: 'Sojourner rover',
        meaning: 'The first wheeled robot on Mars: 10.5 kg, six wheels, driven from Earth with plans sent minutes ahead.',
      },
    ],
    sources: ['nssdc-sojourner', 'pia00629-yogi', 'pia00906-wedge', 'nasa-pathfinder'],
  },
]

export const ARCADE_IDS: ArcadeId[] = ARCADE.map((a) => a.gameId)

export function getArcade(gameId: string): ArcadeCard | undefined {
  return ARCADE.find((a) => a.gameId === gameId)
}

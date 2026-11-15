import type { LevelId } from '../shared/types'

/** Minijuegos de la sala arcade (también están en content/games.ts). */
export type ArcadeId =
  | 'dust-run'
  | 'gusev-maze'
  | 'orbital-grid'
  | 'sun-shade'
  | 'dart-impact'
  | 'artemis-landing'

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
    gameId: 'dart-impact',
    title: 'DART Impact',
    kicker: 'Planetary defence · Didymos',
    genre: 'Timing and momentum',
    fact:
      'On 26 September 2022 NASA flew DART, a 570 kg spacecraft, into Dimorphos at 6.1 km/s. The moonlet was not pushed aside: it was slowed by a few millimetres per second, which dropped it into a tighter orbit and cut its 11.9-hour period by about 32 minutes. The debris thrown off the surface flew away and pushed back, multiplying the effect roughly 3.6 times.',
    dramatization:
      'The timing is theatre. The real approach took ten months and the final hour was flown by the spacecraft on its own; here the orbit is sped up to a few seconds so one run fits in a minute. Levels 1 and 2 are rehearsals against a bigger, slower target and hand you spare impactors: the real mission had exactly one.',
    learning: 'A small, fast impact changes an asteroid’s speed — and only a head-on hit slows it down.',
    accent: '#C9A227',
    durationMin: [1, 3],
    levels: [
      { id: 1, name: 'Navigation rehearsal', goal: 'Cut the orbit by 12 min · 3 impactors' },
      { id: 2, name: 'Dress rehearsal', goal: 'Cut the orbit by 22 min · 2 impactors' },
      { id: 3, name: '26 September 2022', goal: 'Cut the orbit by 30 min · one shot only' },
    ],
    evidence: [
      {
        id: 'ev-dimorphos-32min',
        label: 'A 32-minute cut',
        meaning:
          'Telescopes on Earth measured Dimorphos’ orbit before and after the impact. The 32-minute change proved that a spacecraft can move an asteroid, and that we can measure by how much.',
      },
      {
        id: 'ev-ejecta-beta',
        label: 'The ejecta plume',
        meaning:
          'Rock blasted off the surface carried momentum away from the asteroid, pushing it about 3.6 times harder than the spacecraft alone could have. How much a target throws off decides how well deflection works.',
      },
    ],
  },
  {
    gameId: 'artemis-landing',
    title: 'Artemis Landing',
    kicker: 'Powered descent · the Moon',
    genre: 'Fuel and nerve',
    fact:
      'The Moon has no atmosphere, so a parachute does nothing: every lunar landing has to be flown down on engine thrust alone. Gravity there is 1.62 m/s², a sixth of Earth’s, but it never stops pulling, so hovering burns fuel while buying no descent at all. Apollo 11 touched down with about 25 seconds of fuel left after Neil Armstrong flew past a boulder field to reach smooth ground.',
    dramatization:
      'A real descent takes about twelve minutes and is flown mostly by computer, with the crew taking over near the end. Here it is one short fall, in two dimensions, with a single engine and side thrusters. The fuel loads are picked so each level is tight but landable, not copied from a flight plan.',
    learning: 'With no air to brake against, the engine is the only brake — and fuel is just time in disguise.',
    accent: '#9BB8D3',
    durationMin: [1, 3],
    levels: [
      { id: 1, name: 'Equatorial practice', goal: 'Land under 3 m/s on a wide pad · 520 kg' },
      { id: 2, name: 'South pole approach', goal: 'Narrower pad, faster arrival · 430 kg' },
      { id: 3, name: 'Twenty-five seconds', goal: 'Smallest pad, under 2.2 m/s · 420 kg' },
    ],
    evidence: [
      {
        id: 'ev-no-atmosphere-landing',
        label: 'No air, no parachute',
        meaning:
          'Mars landers can use parachutes because Mars has a thin atmosphere. The Moon has none at all, so everything that lands there must carry the fuel to stop itself.',
      },
      {
        id: 'ev-apollo11-fuel',
        label: 'Twenty-five seconds left',
        meaning:
          'Apollo 11 landed with roughly 25 seconds of hovering fuel remaining. Fuel on a descent is not a reserve, it is a clock: every second spent deciding is a second you cannot spend landing.',
      },
    ],
  },
]

export const ARCADE_IDS: ArcadeId[] = ARCADE.map((a) => a.gameId)

export function getArcade(gameId: string): ArcadeCard | undefined {
  return ARCADE.find((a) => a.gameId === gameId)
}

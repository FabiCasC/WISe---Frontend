import type { LevelId } from '../shared/types'

/** Minijuegos de la sala arcade (también están en content/games.ts). */
export type ArcadeId =
  | 'dust-run'
  | 'gusev-maze'
  | 'orbital-grid'
  | 'sun-shade'
  | 'eagle-liftoff'
  | 'snake-express'
  | 'lunar-rover'
  | 'pathfinder-bounce'
  | 'sojourner-commands'
  | 'phoenix-ice'
  | 'ingenuity-flight'
  | 'lro-search'
  | 'dart-impact'
  | 'artemis-landing'
  | 'nasa-numbers'

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
    gameId: 'snake-express',
    title: 'Lunar Express',
    kicker: 'Moonwalk · Apollo samples and experiments',
    genre: 'Snake-style moonwalk',
    fact:
      'The Moon has two kinds of ground. The bright highlands are older crust that survived giant impacts; the dark maria are seas of lava that cooled between 4.2 and 1.2 billion years ago. Apollo crews brought back rocks from both (Apollo 11 alone collected 21.55 kg) and left science packages on purpose: Apollo\'s seismometers sent data until 1977.',
    dramatization:
      'Astronauts did not walk in a line dragging their samples, and the oxygen times, the map and the rule of how far from the lunar module to set down a package are game numbers. The two rock colours are simplified: real samples come in many shades.',
    learning: 'You can read the Moon\'s history from its rocks, and some hardware was left behind on purpose to keep doing science.',
    accent: '#C8CEDA',
    durationMin: [2, 4],
    levels: [
      { id: 1, name: 'Sea of Tranquility', goal: 'Bring back 5 dark basalt rocks from the lava plain' },
      { id: 2, name: 'The highlands', goal: 'Bring back 5 bright rocks of the oldest crust' },
      { id: 3, name: 'Leave science behind', goal: 'Set down 3 packages away from the LM and bring 3 rocks' },
    ],
    evidence: [
      {
        id: 'ev-alsep',
        label: 'Science packages left on the Moon',
        meaning: 'Apollo crews set up experiments that stayed on the Moon and kept sending data to Earth for years after they left.',
      },
    ],
    sources: ['nasa-moon-composition', 'nssdc-apollo11-lm', 'nssdc-apollo15-alsep', 'nssdc-alsep-apollo12'],
  },
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
    gameId: 'eagle-liftoff',
    title: 'Eagle Liftoff',
    kicker: 'Launch and rendezvous · Apollo 11 lunar module',
    genre: 'Orbital chase',
    fact:
      'Eagle\'s ascent engine fired for 435 seconds and put it in an orbit of 11 by 55 miles, lower than Columbia\'s, about 69 miles up. A lower orbit is faster, so Eagle caught up and docked about three and a half hours later. The descent stage stayed on the Moon as the launch pad and is still there at Tranquility Base.',
    dramatization:
      'Time is sped up hugely and the orbits are drawn much bigger than the Moon. Each burn jumps straight to the next circular orbit (a real change of orbit takes two burns and half a lap), and the launch window, burns and time limits are game numbers.',
    learning: 'To catch a spacecraft ahead of you, you drop to a lower, faster orbit and then climb back up.',
    accent: '#F3B54A',
    durationMin: [1, 3],
    levels: [
      { id: 1, name: 'Launch window', goal: 'Lift off when Columbia is a little ahead' },
      { id: 2, name: 'Lower is faster', goal: 'Catch Columbia from 50° behind with 3 burns' },
      { id: 3, name: 'Full rendezvous', goal: 'Time the launch, then catch up and dock' },
    ],
    evidence: [
      {
        id: 'ev-lm-descent-stage',
        label: 'Lunar module descent stage',
        meaning:
          'The bottom half of each Apollo lunar module was the launch pad for the top half, and it stayed on the Moon. Six are still there, from Apollo 11, 12, 14, 15, 16 and 17.',
      },
    ],
    sources: ['nasa-apollo11-overview', 'nssdc-apollo11-lm', 'nssdc-apollo17-lm'],
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
  {
    gameId: 'phoenix-ice',
    title: 'Phoenix Ice Dig',
    kicker: 'Dig and observe · Phoenix lander',
    genre: 'Time-lapse science',
    fact:
      'Phoenix landed in the Martian arctic on 25 May 2008 and dug 12 trenches with its robotic arm. Three bright clumps in one trench vanished in four days: water ice turning straight into gas. Its first oven sample showed no water, most likely because it sat in the open for days. As summer ended there was less sunlight, heaters were switched off one by one, and the last signal came on 2 November 2008. In winter carbon dioxide frost covered the lander and most likely broke a solar panel.',
    dramatization:
      'The salt chunks that look like ice are a game invention (Phoenix did find salts such as perchlorate mixed in the soil). Ice depths, arm actions per sol, the number of ovens per level (Phoenix had 8) and the "2 sols" freshness rule are game numbers.',
    learning: 'Watching how something changes over time can tell you what it is, and a solar lander lives only as long as the sunlight lasts.',
    accent: '#9FD8FF',
    durationMin: [2, 4],
    levels: [
      { id: 1, name: 'Bright chunks', goal: 'Watch the chunks for a few sols and label ice and salt' },
      { id: 2, name: 'A fresh sample', goal: 'Find water with fresh ice before the ovens run out' },
      { id: 3, name: 'Before the winter', goal: '3 water readings while the sunlight fades' },
    ],
    evidence: [
      {
        id: 'ev-phoenix-ice',
        label: 'Ice that vanished',
        meaning: 'Bright clumps in the Dodo-Goldilocks trench disappeared in four days, showing they were water ice turning into gas.',
      },
    ],
    sources: ['nasa-phoenix', 'nasa-phoenix-history', 'nssdc-phoenix', 'pia12338-phoenix-winter'],
  },
  {
    gameId: 'ingenuity-flight',
    title: 'Ingenuity: Fly in Thin Air',
    kicker: 'Rotor flight · Ingenuity Mars Helicopter',
    genre: 'Flight control',
    fact:
      'Ingenuity, a 1.8 kg helicopter, made the first powered, controlled flight on another planet on 19 April 2021, in air less than 1% as dense as Earth’s. For its first flight the blades spun up to 2,537 rpm. Its solar panel charged enough energy for about one 90-second flight per Martian day. After 72 flights, on 18 January 2024 a rotor blade was damaged at landing: over steep, featureless sand ripples its navigation camera had too little texture to track. It still stands on Mars.',
    dramatization:
      'The lift model (lift grows with air density × rpm²) is simplified and tuned so hovering on Mars needs about 2,400 rpm; the Earth lift-off speed shown is what this same model gives, not a measured number. Spin-up is faster than the real 12 s, the battery is counted in seconds of hover, and the drift over sand is a game version of the navigation problem.',
    learning: 'Flying needs air to push on: the thinner the air, the faster the blades must spin, and the more the flight depends on battery and good navigation.',
    accent: '#C9CCD4',
    durationMin: [1, 3],
    levels: [
      { id: 1, name: 'Spin faster', goal: 'Lift off, hover above 3 m, land softly' },
      { id: 2, name: 'One flight per sol', goal: 'Take a photo and reach the new base in 90 s' },
      { id: 3, name: 'Featureless sand', goal: 'Land on pebbly ground, never on the ripples' },
    ],
    evidence: [
      {
        id: 'ev-ingenuity',
        label: 'First flight on another planet',
        meaning: 'Ingenuity proved that a helicopter can fly in Mars’s thin air. It made 72 flights and scouted ahead for Perseverance.',
      },
    ],
    sources: ['nasa-ingenuity', 'nasa-ingenuity-first-flight', 'nasa-ingenuity-ends', 'nasa-ingenuity-investigation', 'nasa-ingenuity-cold'],
  },
  {
    gameId: 'lro-search',
    title: 'Seen from Orbit',
    kicker: 'Search orbital pictures · Lunar Reconnaissance Orbiter',
    genre: 'Search and compare',
    fact:
      'Since 2009 NASA’s Lunar Reconnaissance Orbiter has photographed the Apollo landing sites. Its pictures show the lunar module descent stages, the ALSEP experiments and the astronauts’ footpaths: at Apollo 14 a well-worn path joins the lander to the ALSEP about 180 m away. When LRO passed over Apollo 11 again with the Sun 28° higher, shadows were smaller and faint brightness differences stood out. Compared with a 1967 photo, LRO’s image of Apollo 12 shows the lander, Surveyor 3 and the astronauts’ tracks.',
    dramatization:
      'The pictures are drawn by the game, not real LRO images: positions are invented and distances are shrunk to fit (the ALSEP trail and Surveyor 3 are closer than in reality). Sizes of the lander and boulders are realistic, and shadows follow the real rule: length = height ÷ tan(Sun angle). The 1967 Sun angle is a game choice.',
    learning: 'From orbit, light is a tool: low Sun shows height, high Sun shows brightness, and comparing photos needs the same light.',
    accent: '#C6A8FF',
    durationMin: [1, 3],
    levels: [
      { id: 1, name: 'Long shadows', goal: 'Choose the right Sun and find the descent stage' },
      { id: 2, name: 'Footpaths', goal: 'Follow the astronauts’ trail to the ALSEP' },
      { id: 3, name: 'Before and after', goal: 'Find 3 new things; ignore shadows that moved' },
    ],
    evidence: [
      {
        id: 'ev-lro-apollo',
        label: 'Apollo sites from orbit',
        meaning: 'Decades later, an orbiter can still see the landers, experiments and footprints left on the Moon.',
      },
    ],
    sources: ['nasa-lro', 'pia12889-lro-apollo14', 'pia12897-fra-mauro', 'pia12909-apollo11-second-look', 'nasa-lro-apollo12'],
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
    gameId: 'nasa-numbers',
    title: 'NASA Number Mission',
    kicker: 'Number puzzle · Apollo 15 and the Moon',
    genre: 'Number puzzle',
    fact:
      'Apollo 15 landed on the Moon on 30 July 1971 and left a science station that was shut down on 30 September 1977. It also left a laser retroreflector with 300 corner cubes that needs no power and is still used today. A laser pulse takes about 2.5 seconds to go from Earth to the Moon and back, and the Moon is about 384,400 km away on average.',
    dramatization:
      'The guessing game, the attempts, the hints and the points are game rules. Some answers are rounded or accepted within a margin to keep play simple; the mission log after each question shows NASA’s exact value. The order of the questions is shuffled for each run.',
    learning: 'The numbers behind a mission are measured, and you can narrow down any number by halving the range.',
    accent: '#6DE2F2',
    durationMin: [3, 5],
    levels: [
      { id: 1, name: 'Launch Pad', goal: '5 questions about Apollo 15 · reach 3 correct' },
      { id: 2, name: 'Mission Control', goal: '5 years and measurements · reach 3 correct' },
      { id: 3, name: 'Deep Space', goal: '5 connected numbers about the Moon · reach 3 correct' },
    ],
    evidence: [
      {
        id: 'ev-apollo15-log',
        label: 'Apollo 15 logbook',
        meaning: 'Dates, counts and measurements from the Apollo 15 mission, as recorded by NASA.',
      },
      {
        id: 'ev-moon-numbers',
        label: 'Moon numbers',
        meaning: 'The Moon’s distance, orbit and laser echo time are measured values, not estimates by eye.',
      },
    ],
   sources: ['nssdc-apollo15-alsep', 'nssdc-moon-facts', 'jpl-apollo-reflectors', 'jpl-llr-2020'],
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

import type { GameId, LevelId } from '../shared/types'

export type Body = 'luna' | 'marte'

export interface LevelSpec {
  id: LevelId
  name: string
  goal: string
  /** Scientific idea the level should make clear. */
  idea: string
}

export interface Evidence {
  id: string
  label: string
  /** What the evidence ACTUALLY proves. Revised wording: no mention of "life". */
  meaning: string
}

export interface MissionCard {
  gameId: GameId
  /** Title of the game in the portal. */
  title: string
  /** Short subtitle below the title. */
  kicker: string
  body: Body
  bodyLabel: string
  /** Real protagonist hardware. */
  hardware: string
  genre: string
  /** First-person phrase. ALWAYS marked as dramatization in the UI. */
  voice: string
  /** What the player learns. One sentence. */
  learning: string
  /** Responsible pair according to the plan. */
  crew: string
  durationMin: [number, number]
  accent: string
  levels: LevelSpec[]
  evidence: Evidence[]
  dossier: {
    arrival: string
    lastContact: string
    missionEnd: string
    purpose: string
    finding: string
    /** What the game invents. Mandatory per the plan. */
    dramatization: string
    /** Frequent misconceptions this dossier corrects. */
    notTrue: string[]
  }
  sourceIds: string[]
  /** Optional art. If the file does not exist, the portal draws the CSS fallback. */
  art: string
}

export const MISSIONS: MissionCard[] = [
  {
    gameId: 'opportunity',
    title: 'Opportunity Echoes',
    kicker: 'Match three · Meridiani Planum',
    body: 'marte',
    bodyLabel: 'Mars',
    hardware: 'Opportunity rover (MER-B)',
    genre: 'Observation puzzle',
    voice: 'My journey is over, but my observations still tell a story.',
    learning: 'Connect instrument, evidence and ancient water.',
    crew: 'Scientific Computing 1 · Software Engineering',
    durationMin: [2, 4],
    accent: '#E68A68',
    levels: [
      {
        id: 1,
        name: 'Observe',
        goal: '12 moves · collect 6 cameras',
        idea: 'Look before you conclude.',
      },
      {
        id: 2,
        name: 'Investigate',
        goal: '16 moves · 6 RAT and 6 spectrometers',
        idea: 'The dark spheres are mineral concretions, not living things.',
      },
      {
        id: 3,
        name: 'Interpret',
        goal: '18 moves · 6 cameras, 6 spectrometers and 6 energy',
        idea: 'Hematite and gypsum point to ancient water, not to confirmed life.',
      },
    ],
    evidence: [
      {
        id: 'ev-blueberries',
        label: 'Hematite spherules',
        meaning: 'Mineral concretions that form when water flows through the rocks.',
      },
      {
        id: 'ev-gypsum',
        label: 'Gypsum vein',
        meaning: 'A mineral left by liquid water that flowed through a crack.',
      },
    ],
    dossier: {
      arrival: 'Landed in Meridiani Planum on January 25, 2004.',
      lastContact: 'Last signal on June 10, 2018, during a global dust storm.',
      missionEnd: 'NASA declared the mission complete on February 13, 2019.',
      purpose: 'Search the rocks for signs of past watery environments on Mars.',
      finding:
        'Hematite-rich concretions and gypsum veins: minerals that need liquid water to form.',
      dramatization:
        'The rover does not talk or keep memories. The first-person voice and the tile board are storytelling devices of the game.',
      notTrue: [
        'It found no life and no evidence of life.',
        'It is no longer transmitting: it sits still on Mars.',
        'Matching tiles on the board does not identify real minerals.',
      ],
    },
    sourceIds: ['mer-opportunity'],
    art: 'assets/missions/opportunity.webp',
  },
  {
    gameId: 'lunar-signals',
    title: 'Two Signals from the Moon',
    kicker: 'Co-op puzzle · Hadley-Apennine',
    body: 'luna',
    bodyLabel: 'Moon',
    hardware: 'Apollo 15 seismometer and laser retroreflector',
    genre: 'Turn-based puzzle',
    voice: 'Two different signals came from here. One went quiet; the other still answers.',
    learning: 'Tell recorded vibrations apart from laser measurement.',
    crew: 'Scientific Computing 2 · Systems Engineering',
    durationMin: [3, 4],
    accent: '#C8CEDA',
    levels: [
      {
        id: 1,
        name: 'Listen',
        goal: 'A holds a plate · B reaches the seismic record',
        idea: 'Vibrations are recorded as data; it is not sound traveling through a vacuum.',
      },
      {
        id: 2,
        name: 'Return the light',
        goal: 'B turns two mirrors · the beam returns to its source',
        idea: 'A retroreflector sends light back where it came from. It is passive.',
      },
      {
        id: 3,
        name: 'Read the legacy',
        goal: 'Combine plate and beam · archive each record',
        idea: 'Seismic waves and light pulses measure different things.',
      },
    ],
    evidence: [
      {
        id: 'ev-seismic',
        label: 'Seismic record',
        meaning: 'Vibrations measured at the surface let scientists study the inside of the Moon.',
      },
      {
        id: 'ev-retro',
        label: 'Returned pulse',
        meaning:
          'The round-trip time of a laser pulse gives the Earth–Moon distance with great precision.',
      },
    ],
    dossier: {
      arrival: 'Apollo 15 landed at Hadley-Apennine on July 30, 1971.',
      lastContact:
        'The ALSEP stations, including the seismometer, were switched off by command from Earth on September 30, 1977.',
      missionEnd:
        'The laser retroreflector never switched off: it is passive and is still used for measurements today.',
      purpose:
        'Record vibrations of the lunar ground and act as a mirror for laser pulses sent from Earth.',
      finding:
        'Two very different ways to study the Moon: listening to its interior and measuring its distance.',
      dramatization:
        'The signal avatars, gates and platforms are fiction. The goal is never to repair the equipment.',
      notTrue: [
        'The retroreflector has no battery and does not transmit: it only returns the light it receives.',
        'The Apollo 15 seismometer stopped sending data in 1977.',
        'The findings of the whole seismic network are not the work of a single station.',
      ],
    },
    sourceIds: ['apollo-15', 'alsep-pds', 'lunar-laser'],
    art: 'assets/missions/lunar-signals.webp',
  },
  {
    gameId: 'spirit',
    title: 'Spirit’s Last Route',
    kicker: 'Three real moments · Gusev crater',
    body: 'marte',
    bodyLabel: 'Mars',
    hardware: 'Spirit rover (MER-A)',
    genre: 'Exploration and energy',
    voice: 'One wheel stopped turning. Dragging it, I found something I was not looking for.',
    learning: 'Avoid soft sand, read clues of hot water in the ground, and tilt the panels toward the winter Sun.',
    crew: 'Kevin · Statistical Engineering',
    durationMin: [2, 4],
    accent: '#F2A65A',
    levels: [
      {
        id: 1,
        name: 'Soft sand',
        goal: 'Reach the finish without getting stuck · 90 s',
        idea: 'Soft sand drains power and can trap a rover: it ended Spirit\'s driving in 2009.',
      },
      {
        id: 2,
        name: 'The broken wheel',
        goal: 'Uncover 3 patches of bright soil · 120 s',
        idea: 'Dragging the broken wheel uncovered silica: a clue to hot springs or steam vents.',
      },
      {
        id: 3,
        name: 'Winter on a slope',
        goal: 'Park on the slope that gives the most power · 80 s',
        idea: 'South of the equator the winter Sun is low in the north: a north-facing slope tilts the panels toward it.',
      },
    ],
    evidence: [
      {
        id: 'ev-silica',
        label: 'Silica-rich soil',
        meaning: 'It is linked to processes where hot water changes the rock.',
      },
      {
        id: 'ev-track',
        label: 'Track of the stuck wheel',
        meaning: 'A mechanical failure uncovered buried material and opened a new line of research.',
      },
    ],
    dossier: {
      arrival: 'Landed in Gusev crater on January 4, 2004.',
      lastContact: 'Last communication on March 22, 2010.',
      missionEnd:
        'It got stuck in soft soil in 2009; the mission was declared over on May 25, 2011.',
      purpose: 'Search Gusev for rocks changed by water in the Martian past.',
      finding:
        'Dragging its broken wheel, it uncovered soil very rich in silica, a clue to hot water.',
      dramatization:
        'The jumps, the timer and the energy units are game conventions. They do not reproduce its real speed or a historical route.',
      notTrue: [
        'No one is going to reactivate it, clean it or bring it back.',
        'Spirit could not jump: it drove around obstacles, very slowly.',
        'Silica is not proof of life.',
      ],
    },
    sourceIds: ['mer-spirit'],
    art: 'assets/missions/spirit.webp',
  },
  {
    gameId: 'nasa-numbers',
    title: 'NASA Number Mission',
    kicker: 'Number puzzle · Apollo 15 and the Moon',
    body: 'luna',
    bodyLabel: 'Moon',
    hardware: 'Apollo 15 mission and the Moon\'s laser retroreflectors',
    genre: 'Number puzzle',
    voice: 'Every number in the logbook is a clue. Can you find the right one?',
    learning: 'Real numbers from NASA missions: guess, narrow down, and learn the story behind each one.',
    crew: 'TBD',
    durationMin: [3, 5],
    accent: '#6DE2F2',
    levels: [
      {
        id: 1,
        name: 'Launch Pad',
        goal: '5 questions about Apollo 15 · reach 3 correct',
        idea: 'Halving the range each time finds any number in a few tries.',
      },
      {
        id: 2,
        name: 'Mission Control',
        goal: '5 years and measurements · reach 3 correct',
        idea: 'Measurements come with a margin of error.',
      },
      {
        id: 3,
        name: 'Deep Space',
        goal: '5 connected numbers about the Moon · reach 3 correct',
        idea: 'Distance, the speed of light, and the echo time are linked.',
      },
    ],
    evidence: [
      {
        id: 'ev-apollo15-log',
        label: 'Apollo 15 logbook',
        meaning: 'Dates, counts, and measurements from the Apollo 15 mission, as recorded by NASA.',
      },
      {
        id: 'ev-moon-numbers',
        label: 'Moon numbers',
        meaning: 'The Moon\'s distance, orbit, and laser echo time are measured values, not estimates by eye.',
      },
    ],
    dossier: {
      arrival: 'Apollo 15 landed at Hadley–Apennine on July 30, 1971.',
      lastContact:
        'The ALSEP stations, including the seismometer, were shut down on September 30, 1977.',
      missionEnd:
        'The laser retroreflectors need no power and are still used to measure the Earth–Moon distance.',
      purpose: 'Explore the Moon, collect samples, and leave instruments that kept working after the crew left.',
      finding: 'Numbers measured on and around the Moon, from rock samples to a laser echo of about 2.5 seconds.',
      dramatization:
        'The guessing game, the attempts, and the points are inventions of this game. The numbers in the mission logs come from NASA pages.',
      notTrue: [
        'Guessing a number is not how scientists measure: they measure, and they report a margin of error.',
        'The retroreflector has no battery and does not transmit: it only returns the light it receives.',
        'Some answers are rounded for play; the mission log shows the exact NASA value.',
      ],
    },
    sourceIds: ['nssdca-apollo15-lm', 'nssdca-moon-facts', 'jpl-apollo-reflectors', 'jpl-llr-2020'],
    art: 'assets/missions/nasa-numbers.webp',
  },
]

export function getMission(gameId: GameId): MissionCard | undefined {
  return MISSIONS.find((m) => m.gameId === gameId)
}
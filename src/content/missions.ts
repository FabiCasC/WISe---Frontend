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
    title: "Opportunity's Echoes",
    kicker: 'Connect three pieces · Meridiani Planum',
    body: 'marte',
    bodyLabel: 'Mars',
    hardware: 'Rover Opportunity (MER-B)',
    genre: 'Observation puzzle',
    voice: 'My journey ended, but my observations continue to tell a story.',
    learning: 'Relate instrument, evidence, and ancient water.',
    crew: 'Scientific Computing 1 · Software Engineering',
    durationMin: [2, 4],
    accent: '#E68A68',
    levels: [
      {
        id: 1,
        name: 'Observe',
        goal: '12 moves · gather 6 cameras',
        idea: 'Observe before concluding.',
      },
      {
        id: 2,
        name: 'Investigate',
        goal: '16 moves · 6 RAT and 6 spectrometers',
        idea: 'Dark spheres are mineral concretions, not organisms.',
      },
      {
        id: 3,
        name: 'Interpret',
        goal: '18 moves · 6 cameras, 6 spectrometers, and 6 energies',
        idea: 'Hematite and gypsum point to ancient water, not confirmed life.',
      },
    ],
    evidence: [
      {
        id: 'ev-blueberries',
        label: 'Hematite spheres',
        meaning: 'Mineral concretions formed by water circulating among rocks.',
      },
      {
        id: 'ev-gypsum',
        label: 'Gypsum vein',
        meaning: 'Mineral deposited by liquid water that flowed through a fracture.',
      },
    ],
    dossier: {
      arrival: 'Landed in Meridiani Planum on January 25, 2004.',
      lastContact: 'Last signal on June 10, 2018, during a global dust storm.',
      missionEnd: 'NASA declared the mission concluded on February 13, 2019.',
      purpose: 'Search rocks for signs of past aqueous environments on Mars.',
      finding:
        'Hematite-rich concretions and gypsum veins: minerals that require liquid water to form.',
      dramatization:
        'The rover does not speak or keep memories. The first-person voice and piece board are narrative devices of the game.',
      notTrue: [
        'Found no life or evidence of life.',
        'Does not transmit anymore: remains motionless on Mars.',
        'Combining pieces on the board does not actually identify real minerals.',
      ],
    },
    sourceIds: ['mer-opportunity'],
    art: 'assets/missions/opportunity.webp',
  },
  {
    gameId: 'lunar-signals',
    title: 'Two Signals from the Moon',
    kicker: 'Cooperative puzzle · Hadley-Apennine',
    body: 'luna',
    bodyLabel: 'Moon',
    hardware: 'Apollo 15 seismometer and laser retroreflector',
    genre: 'Turn-based puzzle',
    voice: 'Two distinct signals came from here. One went silent; the other still responds.',
    learning: 'Distinguish recorded vibrations from laser measurements.',
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
        name: 'Return Light',
        goal: 'B rotates two mirrors · the beam returns to its origin',
        idea: 'A retroreflector returns light back to where it came from. It is passive.',
      },
      {
        id: 3,
        name: 'Read the Legacy',
        goal: 'Combine plate and beam · archive each record',
        idea: 'Seismic waves and light pulses measure different things.',
      },
    ],
    evidence: [
      {
        id: 'ev-seismic',
        label: 'Seismic record',
        meaning: 'Surface vibrations allow scientists to study the Moon interior.',
      },
      {
        id: 'ev-retro',
        label: 'Returned pulse',
        meaning:
          'The round-trip time of a laser gives the Earth-Moon distance with extreme precision.',
      },
    ],
    dossier: {
      arrival: 'Apollo 15 landed at Hadley-Apennine on July 30, 1971.',
      lastContact:
        'The ALSEP stations, including the seismometer, were shut down by command from Earth on September 30, 1977.',
      missionEnd:
        'The laser retroreflector did not shut down: it is passive and still used in modern measurements.',
      purpose:
        'Record lunar ground vibrations and serve as a mirror for laser pulses sent from Earth.',
      finding:
        'Two very different ways to study the Moon: listening to its interior and measuring its distance.',
      dramatization:
        'Signal avatars, gates, and platforms are fiction. The objective is never to repair equipment.',
      notTrue: [
        'The retroreflector has no battery and does not transmit: it only returns the light it receives.',
        'The Apollo 15 seismometer stopped sending data in 1977.',
        'The findings of the entire seismic network are not the work of a single station.',
      ],
    },
    sourceIds: ['apollo-15', 'alsep-pds', 'lunar-laser'],
    art: 'assets/missions/lunar-signals.webp',
  },
  {
    gameId: 'spirit',
    title: "Spirit's Final Route",
    kicker: 'Time-trial exploration · Gusev Crater',
    body: 'marte',
    bodyLabel: 'Mars',
    hardware: 'Rover Spirit (MER-A)',
    genre: 'Exploration and energy',
    voice: 'A wheel stopped turning. Dragging it, I discovered something unexpected.',
    learning: 'Choose a safe route and read past clues in the soil.',
    crew: 'Kevin · Statistical Engineering',
    durationMin: [2, 4],
    accent: '#F2A65A',
    levels: [
      {
        id: 1,
        name: 'Choose Path',
        goal: 'Reach archive · 1 observation · 90 s',
        idea: 'The shortest route may have the most difficult terrain.',
      },
      {
        id: 2,
        name: 'Look at the Soil',
        goal: '2 observations · 120 s · light soil zone',
        idea: 'A wheel malfunction exposed material worth investigating.',
      },
      {
        id: 3,
        name: 'Prioritize Evidence',
        goal: '3 observations · safe detour · 150 s',
        idea: 'Silica was a clue to water processes, not proof of life.',
      },
    ],
    evidence: [
      {
        id: 'ev-silica',
        label: 'Silica-rich soil',
        meaning: 'Associated with processes where hot water alters rock.',
      },
      {
        id: 'ev-track',
        label: 'Stuck wheel track',
        meaning: 'A mechanical failure uncovered buried material and opened a line of investigation.',
      },
    ],
    dossier: {
      arrival: 'Landed in Gusev Crater on January 4, 2004.',
      lastContact: 'Last communication on March 22, 2010.',
      missionEnd:
        'Became immobilized in soft soil in 2009; the mission was declared ended on May 25, 2011.',
      purpose: 'Search Gusev for rocks altered by water in Mars past.',
      finding:
        'Dragging the broken wheel exposed silica-rich soil, a clue to hot water.',
      dramatization:
        'The race, timer, and energy units are game conventions. They do not replicate its actual speed or a real historical route.',
      notTrue: [
        'No one is going to reactivate, clean, or bring it back.',
        'The race rival is a programmed path, not another real vehicle.',
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
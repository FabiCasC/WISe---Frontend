/**
 * REPAIR BAY — the Studio's first room.
 * -------------------------------------------------------------------------
 * Every mission here is a bug that was really in this project, found by a
 * real audit and fixed by a real commit. Nothing is invented for teaching.
 *
 * HOW A MISSION WORKS, and why it is built this way:
 *
 * A child of nine does not read sixty words about Spirit and then press a
 * button. So the mission does not explain the science: it hands over a test
 * bench and lets them run it. They drag, they press, they watch. The answer
 * arrives through their eyes before any sentence claims it.
 *
 * Only then do they see what the game's rule says, notice it disagrees with
 * what they just watched, and change it. The NASA card comes last, to
 * confirm what they already saw — never as homework to get through first.
 *
 * Every line below is therefore kept short on purpose, and repairs.test.ts
 * enforces that with a word budget. If a sentence needs more room, the bench
 * is not showing enough.
 *
 * Rule for adding a mission: it must be a bug this repository actually had.
 * `fixedIn` says what changed. If you cannot point at the change, it does
 * not belong here.
 */

/** Which interactive bench a mission hands the student. */
export type BenchId = 'sand-and-gap' | 'dust-meter' | 'three-circles' | 'two-orbits'

export interface RepairOption {
  id: string
  /** A chip, not a sentence. Four words at most. */
  label: string
  correct: boolean
  /** One short line, shown after choosing. */
  note: string
}

export interface RepairMission {
  id: string
  /** The game this bug lived in (an id from content/games.ts). */
  gameId: string
  /** Short enough to read at a glance. */
  title: string
  /** The question the bench answers. One line. */
  ask: string
  /** The experiment the student runs. */
  bench: BenchId
  /** What they will have seen. Shown only after the bench has been used. */
  observation: string
  /** What the broken game claims instead. This is the contradiction. */
  gameSays: string
  /** The broken rule, as blocks. `slot` is the piece under repair. */
  rule: { before: string[]; slot: string; after: string[] }
  /**
   * The same rule once repaired. Kept whole rather than swapping the slot
   * alone, because a repair often changes the lines around it too: in Sun
   * and Shade "IF the rover is taller THEN it sinks" would be nonsense.
   */
  ruleFixed: { before: string[]; slot: string; after: string[] }
  options: RepairOption[]
  /** The NASA card. Confirms the experiment; never gates it. */
  evidence: { text: string; sourceId: string }
  /** A concept id declared in content/games.ts. */
  concept: string
  /** What the real repair changed, named plainly. */
  fixedIn: string
}

export const REPAIRS: RepairMission[] = [
  {
    id: 'sand-vs-size',
    gameId: 'sun-shade',
    title: 'The rover that sank',
    ask: 'Which rover gets stuck in soft sand?',
    bench: 'sand-and-gap',
    observation: 'The light rover sinks. The heavy one drives through.',
    gameSays: 'This game sinks the heavy rover instead.',
    rule: {
      before: ['WHEN the nuclear rover touches soft sand', 'IF the rover is'],
      slot: 'heavier',
      after: ['THEN it sinks and the level is lost'],
    },
    ruleFixed: {
      before: ['WHEN the nuclear rover reaches a low gap', 'IF the rover is'],
      slot: 'taller than the gap',
      after: ['THEN it cannot pass, and the solar rover goes'],
    },
    options: [
      {
        id: 'heavier',
        label: 'heavier',
        correct: false,
        note: 'You just watched the light one sink. Weight is not what stops it.',
      },
      {
        id: 'taller',
        label: 'taller',
        correct: true,
        note: 'Yes. The nuclear rover is big, and a big rover only goes where it fits.',
      },
      {
        id: 'faster',
        label: 'faster',
        correct: false,
        note: 'Both rovers crawl. Neither was ever stopped by going too fast.',
      },
    ],
    evidence: {
      text:
        'Spirit weighed 185 kg and got stuck for good in soft soil in 2009. Curiosity weighs 899 kg and never has. What sinks a rover is how its weight spreads over its wheels, not how much it weighs.',
      sourceId: 'nasa-msl-curiosity',
    },
    concept: 'solar-vs-nuclear',
    fixedIn: 'The sand became a low gap. Size stops the big rover now.',
  },

  {
    id: 'death-cleans-panels',
    gameId: 'gusev-maze',
    title: 'Dying cleaned the panels',
    ask: 'What actually cleans a rover’s solar panels?',
    bench: 'dust-meter',
    observation: 'Only the dust devil clears the panels. Crashing should not.',
    gameSays: 'In this game, crashing cleaned them too.',
    rule: {
      before: ['WHEN a dust devil catches the rover', 'lose one life'],
      slot: 'set dust to zero',
      after: ['send it back to the start'],
    },
    ruleFixed: {
      before: ['WHEN a dust devil catches the rover', 'lose one life'],
      slot: 'keep the dust on the panels',
      after: ['send it back to the start'],
    },
    options: [
      {
        id: 'keep-zero',
        label: 'set dust to zero',
        correct: true,
        note: 'Yes. Crashing was doing the dust devil’s job for free.',
      },
      {
        id: 'lose-life',
        label: 'lose one life',
        correct: false,
        note: 'Losing a life is fair. The free gift was on another line.',
      },
      {
        id: 'send-back',
        label: 'send it back',
        correct: false,
        note: 'Going back to the start is normal in a maze.',
      },
    ],
    evidence: {
      text:
        'Dust settled on Spirit’s panels and cut its power. Nothing on board could wipe them. Passing dust devils blew the dust away, and the power jumped back. The team called these cleaning events.',
      sourceId: 'mer-spirit',
    },
    concept: 'remolinos-limpian-paneles',
    fixedIn: 'Dust now stays on the panels after a crash.',
  },

  {
    id: 'two-stations',
    gameId: 'lunar-signals',
    title: 'Two stations are not enough',
    ask: 'How many stations pin down a moonquake?',
    bench: 'three-circles',
    observation: 'Two circles cross at two places. Three pick one.',
    gameSays: 'This game accepted one place after two stations.',
    rule: {
      before: ['WHEN two stations have reported', 'the student marks'],
      slot: 'one place',
      after: ['THEN accept the answer'],
    },
    ruleFixed: {
      before: ['WHEN two stations have reported', 'the student marks'],
      slot: 'both crossing places',
      after: ['THEN ask for a third station'],
    },
    options: [
      {
        id: 'one',
        label: 'one place',
        correct: false,
        note: 'You saw two crossings. Picking one of them is a guess.',
      },
      {
        id: 'two',
        label: 'both crossing places',
        correct: true,
        note: 'Yes. Two stations leave two candidates, and saying so is the honest answer.',
      },
      {
        id: 'anywhere',
        label: 'anywhere inside',
        correct: false,
        note: 'Each station gives a firm distance, so the quake sits on the circle.',
      },
    ],
    evidence: {
      text:
        'A station measures how far away a quake was, not which way. That draws a circle around it. Two circles cross twice, so a third is needed. The Apollo seismometers were left as a network for this.',
      sourceId: 'nssdc-alsep-apollo12',
    },
    concept: 'datos-insuficientes',
    fixedIn: 'The student now marks both crossings instead of guessing one.',
  },

  {
    id: 'praised-into-a-corner',
    gameId: 'eagle-liftoff',
    title: 'Praised for a move that loses',
    ask: 'Can you catch a ship from the same orbit?',
    bench: 'two-orbits',
    observation: 'Same orbit, same speed: the gap never closes.',
    gameSays: 'This game said “well done” 12 degrees behind.',
    rule: {
      before: ['WHEN Eagle climbs into Columbia’s orbit', 'IF the gap is smaller than'],
      slot: '12 degrees',
      after: ['THEN tell the player it went well'],
    },
    ruleFixed: {
      before: ['WHEN Eagle climbs into Columbia’s orbit', 'IF the gap is smaller than'],
      slot: '4 degrees',
      after: ['THEN tell the player it went well'],
    },
    options: [
      {
        id: 'four',
        label: '4 degrees',
        correct: true,
        note: 'Yes. That is the distance docking really needs.',
      },
      {
        id: 'ninety',
        label: '90 degrees',
        correct: false,
        note: 'Wider is worse. More places the game calls good while the gap is frozen.',
      },
      {
        id: 'remove',
        label: 'say nothing',
        correct: false,
        note: 'Better than a lie, but the player is still left guessing.',
      },
    ],
    evidence: {
      text:
        'Two ships in the same orbit fly at the same speed, so the gap between them stops changing. To catch up you drop lower, where you go faster, and climb back once you are close.',
      sourceId: 'nasa-apollo11-overview',
    },
    concept: 'orbita-baja-mas-rapida',
    fixedIn: 'The praise now matches the distance docking needs.',
  },
]

export function getRepair(id: string): RepairMission | undefined {
  return REPAIRS.find((r) => r.id === id)
}

/** The one right answer for a mission. Every mission has exactly one. */
export function correctOption(mission: RepairMission): RepairOption {
  return mission.options.find((o) => o.correct)!
}

/** Words in a string, for the reading budget the tests enforce. */
export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

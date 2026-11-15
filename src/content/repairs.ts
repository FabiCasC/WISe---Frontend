/**
 * REPAIR BAY — the Studio's first room.
 * -------------------------------------------------------------------------
 * Every mission here is a bug that was really in this project, found by a
 * real audit and fixed by a real commit. Nothing is invented for teaching.
 *
 * The idea: the student stops being a player and becomes the programmer.
 * They read one rule of a game written as blocks, compare it against a
 * NASA source, find the mistake and choose the repair. The science is what
 * settles the argument, so looking at the data is the only way to be sure.
 *
 * Rule for adding a mission: it must be a bug this repository actually had.
 * `fixedIn` says what changed. If you cannot point at the change, it does
 * not belong here.
 */

export interface RepairOption {
  id: string
  /** How the block would read if this value went in the slot. */
  label: string
  correct: boolean
  /** Shown after choosing. Explains the physics either way. */
  feedback: string
}

export interface RepairMission {
  id: string
  /** The game this bug lived in (an id from content/games.ts). */
  gameId: string
  title: string
  /** What a player of that game saw, in one line. */
  symptom: string
  /** The broken rule, as blocks. `slot` is the piece under repair. */
  rule: { before: string[]; slot: string; after: string[] }
  /**
   * The same rule once it is repaired. Kept whole rather than swapping the
   * slot alone, because a repair often changes the lines around it too: in
   * Sun and Shade "IF the rover is taller THEN it sinks" would be nonsense.
   */
  ruleFixed: { before: string[]; slot: string; after: string[] }
  /** The question put to the student. */
  question: string
  /** The NASA fact that decides it, and where it comes from. */
  evidence: { text: string; sourceId: string }
  options: RepairOption[]
  /** A concept id declared in content/games.ts. */
  concept: string
  /** What the real repair changed, named plainly. */
  fixedIn: string
}

export const REPAIRS: RepairMission[] = [
  {
    id: 'sand-vs-size',
    gameId: 'sun-shade',
    title: 'The rover that sank for the wrong reason',
    symptom:
      'The nuclear rover stopped at a sand patch and the game explained: "Soft sand: the heavy nuclear rover sank (899 kg vs 185 kg)".',
    rule: {
      before: ['WHEN the nuclear rover touches soft sand', 'IF the rover is'],
      slot: 'heavier',
      after: ['THEN it sinks and the level is lost'],
    },
    ruleFixed: {
      before: ['WHEN the nuclear rover reaches a low gap', 'IF the rover is'],
      slot: 'taller than the gap',
      after: ['THEN it cannot pass, and the solar rover has to go instead'],
    },
    question: 'The game blames the rover’s weight. Check it against the record first.',
    evidence: {
      text:
        'Spirit weighed 185 kg and ran on solar panels. In 2009 it became permanently trapped in soft soil at a place the team named Troy, and its mission ended there. Curiosity weighs 899 kg, carries a nuclear generator, and has never been permanently trapped. NASA gives Curiosity as 10 feet long and 7 feet tall without its arm, against 1.6 m long and 1.5 m tall for Spirit.',
      sourceId: 'nasa-msl-curiosity',
    },
    options: [
      {
        id: 'heavier',
        label: 'heavier',
        correct: false,
        feedback:
          'This is what the game said, and it is backwards. The light rover is the one that got stuck. What sinks a rover is ground pressure — its weight spread over the area of its wheels — not how much it weighs on its own.',
      },
      {
        id: 'taller',
        label: 'taller',
        correct: true,
        feedback:
          'Correct. Carrying a nuclear generator makes a rover big, and a big rover only goes where it fits. The repair swapped the sand for a low gap: the nuclear rover is now stopped by its size, which is true, instead of by its weight, which was not.',
      },
      {
        id: 'faster',
        label: 'faster',
        correct: false,
        feedback:
          'Speed is not what stops either rover. Both crawl at a few centimetres per second, and neither Spirit nor Curiosity was ever stopped by going too fast.',
      },
    ],
    concept: 'solar-vs-nuclear',
    fixedIn:
      'The sand strip became a low rock overhang, and the message now reads "Low gap: the RTG rover is too big to fit".',
  },

  {
    id: 'death-cleans-panels',
    gameId: 'gusev-maze',
    title: 'Dying cleaned the solar panels',
    symptom:
      'Dust covered the panels and the rover slowed down. Getting caught sent it back to the start — with the panels spotless. Players finished the level by dying on purpose.',
    rule: {
      before: ['WHEN a dust devil catches the rover', 'lose one life', 'send it back to the start'],
      slot: 'set dust to zero',
      after: ['continue the level'],
    },
    ruleFixed: {
      before: ['WHEN a dust devil catches the rover', 'lose one life', 'send it back to the start'],
      slot: 'keep the dust on the panels',
      after: ['continue the level'],
    },
    question: 'Something in this rule hands the player the lesson for free. Which line?',
    evidence: {
      text:
        'Dust settling on Spirit’s solar panels cut its power month after month. Nothing on board could clean them. What cleaned them was luck: passing dust devils blew the dust away, and the power jumped back up. The team called these cleaning events, and they are the reason Spirit lasted far beyond its planned 90 days.',
      sourceId: 'mer-spirit',
    },
    options: [
      {
        id: 'keep-zero',
        label: 'set dust to zero',
        correct: true,
        feedback:
          'Correct. Crashing was doing the dust devil’s job. Nothing on the real rover could wipe its own panels, so a crash must not either. The repair carries the dust across the respawn, and chasing a dust devil is now the only way to get the power back.',
      },
      {
        id: 'lose-life',
        label: 'lose one life',
        correct: false,
        feedback:
          'Losing a life is a fair punishment and not the problem. The trouble is what the game quietly gave back at the same moment.',
      },
      {
        id: 'send-back',
        label: 'send it back to the start',
        correct: false,
        feedback:
          'Moving the rover back is normal for a maze game. The free gift was hidden in a different line.',
      },
    ],
    concept: 'remolinos-limpian-paneles',
    fixedIn:
      'Respawning now keeps most of the dust instead of wiping it, so a crash can no longer replace a cleaning event.',
  },

  {
    id: 'two-stations',
    gameId: 'lunar-signals',
    title: 'Two stations, and the game said "good enough"',
    symptom:
      'With only two seismometers reporting, the game accepted a single point on the map as the place where the moonquake happened.',
    rule: {
      before: ['WHEN two stations have reported', 'the student marks'],
      slot: 'one place',
      after: ['THEN accept the answer'],
    },
    ruleFixed: {
      before: ['WHEN two stations have reported', 'the student marks'],
      slot: 'both places where the circles cross',
      after: ['THEN accept the answer', 'and ask for a third station to choose between them'],
    },
    question: 'Two circles are drawn on the map. Where can the moonquake be?',
    evidence: {
      text:
        'Each station only measures how far away the quake was, not which direction it came from. That distance draws a circle around the station. Two circles cross at two points, so two stations always leave two candidates. A third circle is what picks one of them. The Apollo seismometers were left in a network for exactly this reason.',
      sourceId: 'nssdc-alsep-apollo12',
    },
    options: [
      {
        id: 'one',
        label: 'one place',
        correct: false,
        feedback:
          'This is what the game accepted, and it skips a step. Two circles do not meet at one point unless they only touch. In general they cross twice.',
      },
      {
        id: 'two',
        label: 'both places where the circles cross',
        correct: true,
        feedback:
          'Correct. Two stations narrow the quake down to two candidates and no further. Marking both is how you say "the data is not enough yet" — which is a real scientific answer, not a failure.',
      },
      {
        id: 'anywhere',
        label: 'anywhere inside the circles',
        correct: false,
        feedback:
          'Not anywhere. Each station gives a firm distance, so the quake sits on the circle itself, not loose inside it. The information is sharper than that.',
      },
    ],
    concept: 'datos-insuficientes',
    fixedIn:
      'Level 3 used to be two buttons where one was always right. Now the student marks both crossing points, so the action itself states that two stations are not enough.',
  },

  {
    id: 'praised-into-a-corner',
    gameId: 'eagle-liftoff',
    title: 'The game said "well done" for a move that could not win',
    symptom:
      'Eagle climbed to Columbia’s orbit and the game answered "Climbing back to Columbia’s orbit right behind it." Then the gap stopped closing and the mission timed out, every time.',
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
    question: 'Docking needs the gap under 4 degrees. Why is praising 12 worse than saying nothing?',
    evidence: {
      text:
        'Two spacecraft in the same orbit travel at the same speed, so the distance between them stops changing. To catch up you must drop to a lower orbit, which is faster, and climb back once you are close. Apollo 11’s Eagle rose into an orbit below Columbia and took about three and a half hours to catch it and dock.',
      sourceId: 'nasa-apollo11-overview',
    },
    options: [
      {
        id: 'four',
        label: '4 degrees, the same as docking needs',
        correct: true,
        feedback:
          'Correct. Once Eagle is in the same orbit the gap freezes, so arriving 12 degrees behind means it can never close. Praising that move teaches the opposite of orbital mechanics, and the false success was also being written into the teacher’s report.',
      },
      {
        id: 'ninety',
        label: '90 degrees, so it is easier',
        correct: false,
        feedback:
          'A wider band makes it worse, not easier. Every extra degree is another position the game calls good while the player sits in the same orbit watching a gap that will not move.',
      },
      {
        id: 'remove',
        label: 'remove the message entirely',
        correct: false,
        feedback:
          'Silence is better than a lie, but it still leaves the player guessing. The repair kept the message and tied it to the distance docking actually needs.',
      },
    ],
    concept: 'orbita-baja-mas-rapida',
    fixedIn:
      'The praise band now matches the docking distance, and being stranded ends the run with a reason instead of a silent timeout.',
  },
]

export function getRepair(id: string): RepairMission | undefined {
  return REPAIRS.find((r) => r.id === id)
}

/** The one right answer for a mission. Every mission has exactly one. */
export function correctOption(mission: RepairMission): RepairOption {
  return mission.options.find((o) => o.correct)!
}

import type { Question, Source } from './rules'

/**
 * Question bank. Every answer was checked against the NASA page in `source`
 * (opened 2026-11-14). Facts are written in our own words.
 *
 * To change difficulty, edit min/max/tolerance: attempts are derived from them.
 * Rule for new questions: ONE verifiable answer, no opinions
 * ("the most famous Apollo" is NOT a valid question).
 */

const APOLLO_15: Source = {
  label: 'NASA NSSDCA: Apollo 15 Lunar Module / ALSEP',
  url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C',
}
const MOON_FACTS: Source = {
  label: 'NASA NSSDCA: Moon Fact Sheet',
  url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
}
const JPL_REFLECTORS: Source = {
  label: 'NASA JPL: The Apollo Experiment That Keeps on Giving',
  url: 'https://www.jpl.nasa.gov/news/the-apollo-experiment-that-keeps-on-giving/',
}
const JPL_LLR: Source = {
  label: 'NASA JPL: Lunar Laser Range Model 2020',
  url: 'https://ssd.jpl.nasa.gov/ftp/eph/planets/ioms/LLR_Model_2020_DR.pdf',
}

export interface LevelContent {
  name: string
  intro: string
  /** Shown when the level ends. */
  tip: string
  questions: Question[]
}

export type LevelNumber = 1 | 2 | 3

export const LEVELS: Record<LevelNumber, LevelContent> = {
  1: {
    name: 'Launch Pad',
    intro: 'Warm-up with Apollo 15. Every question has a limited number of tries, so use “higher” and “lower” wisely.',
    tip: 'Strategy: guess the middle of the range each time. You can always find the number in a handful of tries.',
    questions: [
      {
        id: 'l1-rover',
        clue: 'Which Apollo mission was the first to drive a Lunar Roving Vehicle on the Moon?',
        hint: 'It landed in 1971 and carried David Scott and James Irwin.',
        answer: 15, min: 1, max: 20, tolerance: 0,
        answerText: 'Apollo 15',
        fact: 'Apollo 15 was the first time a rover of this type was used on the Moon. The crew drove it within about 5 km of the lunar module, and it worked very well on the lunar terrain.',
        source: APOLLO_15,
      },
      {
        id: 'l1-evas',
        clue: 'How many moonwalks (EVAs) did the Apollo 15 astronauts make?',
        hint: 'They also did a short “stand-up” look around from the hatch, which does not count.',
        answer: 3, min: 1, max: 10, tolerance: 0,
        answerText: '3 moonwalks',
        fact: 'Scott and Irwin made three moonwalks totaling 18 hours and 35 minutes. Before the first one, Scott also spent 33 minutes looking around from the upper hatch.',
        source: APOLLO_15,
      },
      {
        id: 'l1-landing-order',
        clue: 'The Apollo 15 lunar module “Falcon” was which crewed vehicle to land on the Moon? Type the number (1st, 2nd, 3rd…).',
        hint: 'Apollo 11, Apollo 12 and Apollo 14 landed before it.',
        answer: 4, min: 1, max: 10, tolerance: 0,
        answerText: 'the 4th',
        fact: 'Falcon was the fourth crewed vehicle to land on the Moon. It carried Commander David Scott and lunar module pilot James Irwin.',
        source: APOLLO_15,
      },
      {
        id: 'l1-instruments',
        clue: 'How many scientific instruments made up the Apollo 15 surface science package (ALSEP) left on the Moon?',
        hint: 'They included a seismometer, a magnetometer and a heat flow experiment.',
        answer: 7, min: 1, max: 15, tolerance: 0,
        answerText: '7 instruments',
        fact: 'The ALSEP had seven instruments around a central station: a passive seismometer, a magnetometer, a solar wind spectrometer, an ion detector, an ion gauge, a dust detector and a heat flow experiment.',
        source: APOLLO_15,
      },
      {
        id: 'l1-walkers',
        clue: 'The two Apollo 15 moonwalkers were the 7th and which-number people to walk on the Moon?',
        hint: 'They walked one after the other, so the numbers are consecutive.',
        answer: 8, min: 1, max: 20, tolerance: 0,
        answerText: 'the 8th',
        fact: 'David Scott and James Irwin were the seventh and eighth people to walk on the Moon.',
        source: APOLLO_15,
      },
    ],
  },
  2: {
    name: 'Mission Control',
    intro: 'Years and measurements from Apollo 15. Some answers are accepted if you land very close, like real measurements.',
    tip: 'Real scientists also accept a margin of error: a measurement is rarely exact to the last digit.',
    questions: [
      {
        id: 'l2-landing-year',
        clue: 'In what year did Apollo 15 land on the Moon?',
        hint: 'It was in the early 1970s, between Apollo 14 and Apollo 16.',
        answer: 1971, min: 1950, max: 2000, tolerance: 0,
        answerText: '1971',
        fact: 'Falcon landed on 30 July 1971 in the Mare Imbrium region, at the foot of the Apennine mountains.',
        source: APOLLO_15,
      },
      {
        id: 'l2-shutdown-year',
        clue: 'In what year were the Apollo 15 science stations shut down for good?',
        hint: 'A few years after the last Apollo landing, in 1972.',
        answer: 1977, min: 1960, max: 2000, tolerance: 0,
        answerText: '1977',
        fact: 'The ALSEP central station was switched on on 31 July 1971 and was shut down, along with the other ALSEP stations, on 30 September 1977.',
        source: APOLLO_15,
      },
      {
        id: 'l2-samples',
        clue: 'About how many kilograms of rock and soil did the Apollo 15 crew collect? (Within 1 kg counts.)',
        hint: 'Roughly the weight of a heavy adult.',
        answer: 77, min: 1, max: 200, tolerance: 1,
        answerText: 'about 77 kg (77.31 kg)',
        fact: 'During their three moonwalks Scott and Irwin collected 77.31 kg of rock and soil samples.',
        source: APOLLO_15,
      },
      {
        id: 'l2-distance',
        clue: 'About how many kilometers did the Apollo 15 crew cover in the rover during their moonwalks? (Within 1 km counts.)',
        hint: 'The three drives were roughly 10, 12 and 5 km long.',
        answer: 28, min: 1, max: 100, tolerance: 1,
        answerText: 'about 28 km (27.9 km)',
        fact: 'The three drives added up to 27.9 km, always within about 5 km of the lunar module.',
        source: APOLLO_15,
      },
      {
        id: 'l2-power',
        clue: 'About how many watts of electricity did the nuclear generator (RTG) of the Apollo 15 science station produce? (Within 5 W counts.)',
        hint: 'Less than a classic 100 W light bulb.',
        answer: 70, min: 1, max: 200, tolerance: 5,
        answerText: 'about 70 watts',
        fact: 'The generator turned the heat of plutonium-238 into about 70 watts at the start, and about 63.5 watts after one year.',
        source: APOLLO_15,
      },
    ],
  },
  3: {
    name: 'Deep Space',
    intro: 'Big numbers about the Moon. Use what you learn along the way: several of these answers are connected.',
    tip: 'Distance, the speed of light and the echo time are linked: twice the distance divided by the speed gives the round trip.',
    questions: [
      {
        id: 'l3-distance',
        clue: 'On average, how many thousands of kilometers away is the Moon? (Answer in thousands of km; within 5 counts.)',
        hint: 'A laser pulse needs about 2.5 seconds to go to the Moon and back.',
        answer: 384, min: 100, max: 1000, tolerance: 5,
        answerText: 'about 384,000 km',
        fact: 'NASA lists the Moon’s average orbital distance as about 384,400 km. Laser measurements show it drifts away about 3.8 cm every year.',
        source: MOON_FACTS,
      },
      {
        id: 'l3-light-speed',
        clue: 'How fast does light travel? Answer in thousands of kilometers per second (within 2 counts).',
        hint: 'It crosses the Earth–Moon gap in about a second and a quarter.',
        answer: 300, min: 100, max: 500, tolerance: 2,
        answerText: 'about 300,000 km/s',
        fact: 'Light travels at 299,792.458 km/s. Scientists use that speed to turn the travel time of a laser pulse into a distance.',
        source: JPL_LLR,
      },
      {
        id: 'l3-echo',
        clue: 'A laser pulse goes from Earth to the Moon and back. About how long is the round trip, in tenths of a second? (For example, 10 means 1.0 s; within 2 counts.)',
        hint: 'Use your last answers: twice the distance divided by the speed of light.',
        answer: 25, min: 10, max: 50, tolerance: 2,
        answerText: 'about 2.5 seconds',
        fact: 'The round trip takes about 2.5 seconds and varies from roughly 2.3 to 2.7 seconds as the Moon moves along its orbit.',
        source: JPL_LLR,
      },
      {
        id: 'l3-orbit',
        clue: 'How many days does the Moon take to orbit the Earth once? (Rounded to a whole number.)',
        hint: 'It is a little less than a calendar month.',
        answer: 27, min: 1, max: 100, tolerance: 0,
        answerText: '27 days (27.32)',
        fact: 'NASA’s Moon fact sheet gives an orbital (revolution) period of 27.3217 days.',
        source: MOON_FACTS,
      },
      {
        id: 'l3-cubes',
        clue: 'How many corner-cube prisms are in the Apollo 15 laser retroreflector, the mirror array that still returns laser pulses?',
        hint: 'The Apollo 11 and 14 arrays have 100 each; Apollo 15 has three times as many.',
        answer: 300, min: 1, max: 500, tolerance: 0,
        answerText: '300 corner cubes',
        fact: 'The Apollo 11 and 14 arrays have 100 corner cubes each, and the Apollo 15 array has 300. They need no power, which is why scientists can still bounce lasers off them.',
        source: JPL_REFLECTORS,
      },
    ],
  },
}

/** Unique sources, for the end-of-level “learn more” list. */
export function sourcesOf(level: LevelNumber): Source[] {
  const seen = new Map<string, Source>()
  for (const q of LEVELS[level].questions) seen.set(q.source.url, q.source)
  return [...seen.values()]
}

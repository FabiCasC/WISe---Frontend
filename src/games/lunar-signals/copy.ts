/**
 * Game 2 texts ("Two signals from the Moon").
 *
 * ⚠️ PENDING VALIDATION by Editing/Statistics before release:
 *  - That the Apollo 15 retroreflector still returns laser pulses today
 *    (source to be located and opened).
 *  - Seismometer: NSSDCA, "Apollo 15 Lunar Module / ALSEP"
 *    https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C
 *    (passive seismometer; ALSEP stations turned off on September 30, 1977).
 *  - Also pending: accredited photo of what Apollo 15 left behind for the info card.
 *  - The idea that the Moon "rings like a bell" is NOT included until
 *    a source is found.
 *
 * Note: these warnings are for the TEAM. Nothing here hands the student a
 * "data pending verification" disclaimer; what the game invents is declared
 * in the mission dossier (src/content/missions.ts), where the player reads it.
 */
export const FICHA_SOURCE_URL = 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C'

export const COPY = {
  intro: {
    1: {
      title: 'The Echo of Light',
      text:
        'You are the operator on Earth. Fire the laser, time the echo, and work out how far away ' +
        'the Moon is. You will not see it: the only thing you have is the stopwatch.',
    },
    2: {
      title: 'Moonquakes',
      text:
        'A moonquake occurred. Each station measured the delay between two waves. ' +
        'With that delay, draw a circle: the quake is at some point along it.',
    },
    3: {
      title: 'No Hints',
      text: 'A new quake and a station with no signal. Measure with what you have and decide what can be known.',
    },
  },
  l1: {
    idle: 'Press "Fire Laser". The journey is shown in slow motion; the timer tracks real time.',
    flying: 'The pulse travels to the Moon and back...',
    // The Moon is hidden once the echo is measured: the only route to the answer
    // is the arithmetic, so the message states the two numbers it needs.
    measured: (s: string, c: string) =>
      `Measured echo: ${s} s for the round trip. Light travels ${c} km every second. ` +
      'The Moon is now out of sight: compute the distance and set the marker there.',
    hint: (c: string) => `Remember: the pulse went there AND back. d = ${c} km/s × t ÷ 2.`,
    // Direction only. Telling the player the echo their marker would produce
    // would do the physics for them and turn the slider into a converging dial.
    tooShort: (real: string) =>
      `Too close to Earth. From there the echo would come back in less than ${real} s.`,
    tooLong: (real: string) =>
      `Too far out. From there the echo would take more than ${real} s to come back.`,
    ok: 'It matches. Light takes more than a second to reach the Moon.',
    conclusion: (km: string) =>
      `Using a stopwatch and an echo, you measured the distance to the Moon: about ${km} km. ` +
      'Light travels there and back in just over two seconds.',
  },
  l2: {
    start: 'Start with station A: read its delay and set the radius of the circle.',
    small: 'That circle is too small for this station\'s delay.',
    big: 'That circle is too large for this station\'s delay.',
    noCross: (other: string) => `Does not intersect with station ${other}\'s circle. Check the radius.`,
    one: 'With a single station, the quake could be anywhere on the circle. Move on to the next one.',
    two: 'With two stations, there are two possible points. A third is needed to decide.',
    conclusion:
      'With three stations, only one point remains. That is why scientists needed multiple stations ' +
      'to figure out where a quake happened.',
  },
  l3: {
    start: 'Measure with the stations that are working. There are no hints here.',
    mismatch: 'That radius does not match this station\'s signal.',
    // There is no "it is not enough" button any more: the player SHOWS that two
    // stations are not enough by marking every point the data still allows.
    ready:
      'You have measured with everything that works. Now mark EVERY place on the map where this ' +
      'quake could be, and then submit your marks.',
    marksHint: 'Tap the map to drop a mark. "Clear Marks" starts over.',
    needMarks: 'Submit at least one mark first.',
    incomplete:
      'The marks you placed all fit, but they are not all of them. Where else do these two circles ' +
      'cross? If more than one place fits, the data does not single one out.',
    wrongMarks:
      'At least one mark is not where both circles cross. A possible epicentre has to match every ' +
      'station you measured.',
    conclusion:
      'You marked both points, and both of them fit. With two stations the quake could be in either ' +
      'place and there is no way to choose: you showed that another signal is needed.',
  },
  attemptsLeft: (n: number) => (n === 1 ? '1 attempt left.' : `${n} attempts left.`),
  failed:
    'Out of attempts. Guessing until the game says "yes" is not measuring: run the level again and ' +
    'work the numbers out before you commit.',
  ficha: {
    title: 'What Apollo 15 Left Behind',
    text:
      'The retroreflector still returns laser pulses today; it is passive, with no battery. ' +
      'The seismometer recorded lunar ground vibrations until the ALSEP stations were turned off ' +
      'on September 30, 1977.',
    link: 'View NASA Source',
  },
  seal: 'Seal the Memory',
  sealFailed: 'Close the Log',
} as const

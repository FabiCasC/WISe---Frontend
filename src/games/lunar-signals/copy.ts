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
 */
export const FICHA_SOURCE_URL = 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C'

export const COPY = {
  intro: {
    1: {
      title: 'The Echo of Light',
      text:
        'You are the operator on Earth. Fire the laser, see how long it takes for the echo to return, ' +
        'and place the marker where light would take exactly that amount of time.',
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
    measured: (s: string) => `Measured echo: ${s} s. Now move the marker until its echo matches.`,
    tooShort: (mine: string, real: string) =>
      `Your marker would produce an echo of ${mine} s, but the measured one was ${real} s. Light would take less time: go farther out.`,
    tooLong: (mine: string, real: string) =>
      `Your marker would produce an echo of ${mine} s, but the measured one was ${real} s. Light would take more time: go closer in.`,
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
    ready: 'You have measured with everything that works. Tap the map to mark the quake or state that it is not enough.',
    pickHint: 'Tap the map to mark where you think the quake happened.',
    wrongPlace: 'With these stations, this point might not be the only one. Are you sure?',
    conclusion:
      'With two stations, the quake could be in two different places, and there is no way to choose. ' +
      'You figured out on your own that another signal is needed.',
  },
  ficha: {
    title: 'What Apollo 15 Left Behind',
    text:
      'The retroreflector still returns laser pulses today; it is passive, with no battery. ' +
      'The seismometer recorded lunar ground vibrations until the ALSEP stations were turned off ' +
      'on September 30, 1977.',
    link: 'View NASA Source',
    pending: 'Data pending comparison with the official source.',
  },
  seal: 'Seal the Memory',
} as const
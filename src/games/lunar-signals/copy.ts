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
    recap: (echo: string, c: string, km: string) => [
      `Your stopwatch read ${echo} s for the round trip. Light went there AND back, so the Moon is half of ${c} km/s × ${echo} s: about ${km} km.`,
      'The laser bounced off the retroreflector Apollo 15 left on the Moon, a mirror that returns light the way it came.',
    ],
  },
  l2: {
    start: 'Start with station A: read its delay and set the radius of the circle.',
    small: 'That circle is too small for this station\'s delay.',
    big: 'That circle is too large for this station\'s delay.',
    noCross: (other: string) => `Does not intersect with station ${other}\'s circle. Check the radius.`,
    one: 'With a single station, the quake could be anywhere on the circle. Move on to the next one.',
    two: 'With two stations, there are two possible points. A third is needed to decide.',
    recap: (radii: number[]) => [
      `You drew ${radii.length} circles, with radii ${radii.join(', ')} map units. One circle leaves the whole circle possible, two cross in two places, three meet in one point.`,
      'That is why scientists needed several seismometers to find where a moonquake happened.',
    ],
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
    recap: (stations: string[], marks: number) => [
      `You measured with stations ${stations.join(' and ')} and placed ${marks} mark${marks === 1 ? '' : 's'}: both places where their circles cross.`,
      'Both fit, so with two stations the quake could be in either place. Saying "this is not enough" is the right answer; a third signal is needed.',
    ],
  },
  // ── Mission briefing + Level 0 (practice). Plain words for 9-year-olds. ──
  briefing: {
    title: 'Mission Briefing',
    ping: 'Hi, I\'m Ping, your robot guide! Apollo 15 astronauts left instruments on the Moon in 1971. Want a quick practice round to learn how to use them?',
    cards: [
      { icon: '⚡', text: 'Light is the fastest thing there is. In ONE second it could zoom around the Earth more than 7 times!' },
      { icon: '🔦', text: 'Power 1, the laser stopwatch: bounce a laser off the retroreflector (a mirror Apollo 15 left on the Moon), time the echo, and find out how far away it is.' },
      { icon: '📡', text: 'Power 2, moonquake ears: seismometers (they feel ground shaking) in three stations listen to the same moonquake, and together they find where it happened.' },
    ],
    start: 'Start Practice',
  },
  l0: {
    head: {
      title: 'Level 0 · Practice Run',
      text: 'Learn your two powers with Ping. Nothing here counts for your score, so try everything!',
    },
    stepOf: (n: number, total: number) => `Practice ${n} of ${total}`,
    next: 'Next',
    finish: 'Start Level 1',
    skip: 'Skip practice',
    sound: {
      intro:
        'First, a trick you already know: ECHOES! If you shout at a cliff, your voice bounces back. ' +
        'Press Shout and watch the stopwatch.',
      shout: 'Shout!',
      note: 'A pretend cliff, just for practice.',
      landed:
        'The echo came back after 3 seconds. Sound travels about 340 m every second... ' +
        'but your shout went there AND came back!',
      task: 'Move the cliff marker to where the cliff must be, then test it: your shout is replayed from there.',
      unit: 'm',
      target: 3,
      ok: 'Yes! Your marker gives an echo of 3 s. The sound went 1,020 m in total, there AND back, so the cliff is half of that: 510 m. Distance = speed × time ÷ 2.',
      near: (s: string) => `From there the echo would come back in ${s} s, but you heard 3 s. Move the marker farther.`,
      far: (s: string) => `From there the echo would take ${s} s, but you heard 3 s. Move the marker closer.`,
    },
    light: {
      intro:
        'Now the same trick with LIGHT. Light is MUCH faster than sound: almost 300,000 km every second! ' +
        'Fire the practice laser at a pretend Moon.',
      fire: 'Fire Practice Laser',
      note: 'A pretend Moon, just for practice.',
      landed: 'The echo took 1 second. In that second the light flew almost 300,000 km, there AND back.',
      task: 'Move the pretend-Moon marker to where it must be, then test it: the practice laser is replayed from there.',
      unit: 'km',
      target: 1,
      ok: 'Yes! Your marker gives an echo of 1 s. The light flew about 300,000 km in total, there AND back, so the Moon marker is at half: about 150,000 km.',
      near: (s: string) => `From there the echo would come back in ${s} s, but you measured 1 s. Move the marker farther.`,
      far: (s: string) => `From there the echo would take ${s} s, but you measured 1 s. Move the marker closer.`,
    },
    waves: {
      intro:
        'Now your other power: MOONQUAKES. A quake sends out two waves: a speedy P wave and a slower S wave. ' +
        'Think of a runner and a walker who leave at the same time. Press the button!',
      button: 'Make a quake!',
      aria: 'A quake and two stations, one near and one far',
      near: 'Near station',
      far: 'Far station',
      quake: 'Quake',
      pArrived: 'P wave: here!',
      sArrived: 'S wave: here!',
      gap: (s: string) => `Gap: ${s} s`,
      landed:
        'See the gaps? The runner (P) arrives first and the walker (S) arrives later. ' +
        'The farther away the quake, the BIGGER the gap.',
      task: 'Move the quake with the slider, then press the button. Goal: make the station on the RIGHT wait less between the two waves than the one on the left.',
      win: 'Yes! The quake was closer to the right station, so the slow S wave had little time to fall behind. A small gap means a near quake; a big gap means a far one.',
      lose: 'Not yet: the right station still waited longer, so the quake was farther from it. Move the quake closer to the right station and try again.',
    },
    circles: {
      intro:
        'A station knows HOW FAR the quake was, but not WHICH WAY. So it draws a circle: the quake is somewhere on it. ' +
        'Press the button to draw the circle for Station A.',
      aria: 'Map with three stations and their circles',
      button: (id: string) => `Draw circle: Station ${id}`,
      done: 'All circles drawn',
      one: 'One circle! The quake could be anywhere on it. We need more stations.',
      two: 'Two circles cross in TWO places. The quake is at one of them, but which one?',
      three: 'Three circles meet at only ONE spot. Found it! That is why scientists use three stations.',
      ready: 'Now you know why scientists use three stations. You are ready for the real mission, detective!',
    },
  },
  // Names that pop up for a moment when a player touches an object.
  names: {
    ping: 'Ping, your guide',
    you: 'You',
    cliff: 'The cliff',
    shout: 'Your shout',
    earth: 'Earth',
    moon: 'The Moon',
    practiceMoon: 'Practice Moon',
    pulse: 'Laser pulse',
    practicePulse: 'Practice laser',
    beam: 'Laser beam',
    stopwatch: 'Stopwatch',
    marker: 'Distance marker',
    station: (id: string, working: boolean) => (working ? `Station ${id}` : `Station ${id} (no signal)`),
    graph: 'Vibration graph',
    spot: 'Possible quake spot',
    quakeSpot: 'Where the quake happened',
    mark: 'Your mark',
    epicenter: 'The quake',
  },
  attemptsLeft: (n: number) => (n === 1 ? '1 attempt left.' : `${n} attempts left.`),
  failed:
    'Out of attempts. Guessing until the game says "yes" is not measuring: run the level again and ' +
    'work the numbers out before you commit.',
  seal: 'Seal the Memory',
  sealFailed: 'Close the Log',
} as const

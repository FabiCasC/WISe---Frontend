import type { Tutorial } from './types'

export default {
  gameId: 'lro-search',
  story:
    'Decades after the last Apollo crew left, NASA’s Lunar Reconnaissance Orbiter flew over the landing sites and photographed the lander stages, experiments and even footpaths still on the ground. The Sun’s angle decides what you can see: shadows give things away.',
  controls: [
    { keys: ['1', '2'], does: 'Choose an orbit pass: each one has the Sun at a different height', touch: 'Tap the pass button' },
    { keys: ['Tap'], does: 'Tap the thing you are looking for in the picture', touch: 'Tap on the picture' },
    { keys: ['←', '↑', '↓', '→', 'Space'], does: 'Or move the cross with the arrows and press Space' },
    { keys: ['B'], does: 'Level 3: hold it to see the old 1967 photo', touch: 'Hold the button' },
  ],
  parts: [
    { name: 'Sun height', meaning: 'How high the Sun is in that pass. A low Sun makes long shadows, so tall things stand out. A high Sun makes short shadows and shows differences in brightness, like footpaths.' },
    { name: 'Passes', meaning: 'How many orbit passes you have. Each pass is one picture, so choose well.' },
    { name: 'Looking for', meaning: 'What you must find now: a lander stage, an experiment, a footpath…' },
    { name: 'Found', meaning: 'How many you have found out of the total.' },
    { name: 'The 1967 photo (level 3)', meaning: 'Hold B to compare with an old photo. Things that were already there are not new, and shadows that only moved are not new either.' },
  ],
  steps: [
    { text: 'Press Start. Choose a pass: press 1 or 2 (or tap one). Each has the Sun at a different height.', keys: ['Digit1', 'Digit2'], pointer: true },
    { text: 'Look at the picture. A low Sun throws long shadows, so tall things like the lander show up.', pointer: true },
    { text: 'Tap what you are looking for, or move the cross with the arrows and press Space.', keys: ['Space'], pointer: true },
    { text: 'If you cannot see it, try the other pass: a high Sun shows brightness differences instead, like footpaths.' },
    { text: 'In level 3, hold B to compare with a 1967 photo and find only what is new. Ready?' },
  ],
} satisfies Tutorial

import type { Tutorial } from '../../content/tutorials/types'

export default {
  gameId: 'lro-search',
  story:
    'Long after the Apollo astronauts went home, a NASA space camera called LRO flew over the Moon and took photos. Its pictures still show landers, tools and even footprints! Shadows help LRO spot them.',
  controls: [
    { keys: ['1', '2'], does: 'Pick the time of the photo: morning or noon', touch: 'Tap a photo button' },
    { keys: ['Tap'], does: 'Tap anything in the picture to see its name', touch: 'Tap the picture' },
    { keys: ['←', '↑', '↓', '→', 'Space'], does: 'Or move the cross with the arrows and press Space' },
    { keys: ['B'], does: 'Level 3: hold it to see the old 1967 photo', touch: 'Hold the button' },
  ],
  parts: [
    { name: 'Sun', meaning: 'How high the Sun is. A low Sun makes long shadows, so tall things stand out. A high Sun makes tiny shadows and shows dark footprints.' },
    { name: 'Photos', meaning: 'How many different photo times you have tried. You can switch between them any time!' },
    { name: 'Looking for', meaning: 'The thing you must find now: a lander, a science station, footprints…' },
    { name: 'Found', meaning: 'How many things you have found out of the total. Stars show how well you did.' },
    { name: 'Hearts', meaning: 'Real levels only: each wrong tap costs one heart. Keep them to earn more stars!' },
  ],
  steps: [
    { text: 'Press Start, then pick a photo time: press 1 or 2, or tap a button. Try both!', keys: ['Digit1', 'Digit2'], pointer: true },
    { text: 'A LOW Sun makes LONG shadows. Tall things, like a lander, stick out!' },
    { text: 'Tap the lunar module. Tap other things too: every object tells you its name!', keys: ['Space'], pointer: true },
    { text: 'Cannot see it? Switch photos with the buttons. A high Sun makes shadows tiny.' },
    { text: 'You did it! Now you are ready to explore the real levels. Let’s go!' },
  ],
} satisfies Tutorial

import type { Tutorial } from './types'

export default {
  gameId: 'dart-impact',
  story:
    'In 2022 NASA’s DART spacecraft hit a small asteroid, Dimorphos, on purpose to see if a crash could change its path. It worked: Dimorphos’s orbit around its big neighbour Didymos got shorter, by about 32 minutes.',
  controls: [
    { keys: ['Space'], does: 'Release the impactor from the spacecraft. Pick your moment: Dimorphos keeps moving', touch: 'Tap the screen' },
    { keys: ['↑', '↓'], does: 'Steer the impactor up and down once it is flying (also W and S). Fuel for steering is limited', touch: 'Hold Up or Down' },
  ],
  parts: [
    { name: 'Impactors', meaning: 'How many spacecraft you have left. The real mission had only one.' },
    { name: 'Cut needed', meaning: 'How many minutes you must take off the time Dimorphos needs to go around Didymos.' },
    { name: 'Orbit cut', meaning: 'How many minutes you actually took off with your hit.' },
    { name: 'Divert fuel', meaning: 'Fuel to steer. Steering is limited, so line up early.' },
    { name: 'The arrow on Dimorphos', meaning: 'Shows which way it is moving. It turns green when it is coming toward you. A head-on hit slows it down; a hit from the side does not.' },
  ],
  practice: 'Watch the arrow on Dimorphos, press Space to release, then steer ↑ ↓ to meet it.',
} satisfies Tutorial

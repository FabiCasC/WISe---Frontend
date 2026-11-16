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
    { name: 'Impactor', meaning: 'The spacecraft that crashes on purpose into the asteroid. Here you throw it.' },
    { name: 'Dimorphos', meaning: 'The small moon of the asteroid that DART hit.' },
    { name: 'Orbital period', meaning: 'How long the little moon takes to go once around the asteroid. A good hit makes it shorter.' },
    { name: 'Head-on hit', meaning: 'A crash against the movement. Only that part of the hit slows the moon down; a sideways hit does almost nothing.' },
    { name: 'Ejecta', meaning: 'The dust and rocks thrown out by the crash. They push back and add to the kick.' },
    { name: 'Words with a dotted line', meaning: 'Tap any underlined word to read what it means. The ? button shows all of them.' },
  ],
  steps: [
    { text: 'Press Begin. Look at the arrow on Dimorphos: it shows which way the moonlet is moving.', keys: ['Space', 'Enter'] },
    { text: 'Press Space to release the impactor.', keys: ['Space', 'Enter'] },
    { text: 'Steer it with ↑ and ↓. You have limited Divert fuel, so do not wiggle.', keys: ['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'] },
    { text: 'See what happens: a head-on hit slows Dimorphos and shortens its orbit (Orbit cut). A hit from the side does not.' },
    { text: 'The real levels need a bigger cut and give you fewer impactors. Ready?' },
  ],
} satisfies Tutorial

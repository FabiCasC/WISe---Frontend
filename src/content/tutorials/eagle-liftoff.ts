import type { Tutorial } from './types'

export default {
  gameId: 'eagle-liftoff',
  story:
    'When Apollo 11 left the Moon, only the top half of the lunar module, Eagle, lifted off. The bottom half stayed behind as its launch pad, and is still there. Eagle then had to find Columbia, the ship waiting in orbit, and dock with it. The trick is that a lower orbit is a faster one.',
  controls: [
    { keys: ['Space'], does: 'Launch from the Moon (levels 1 and 3)', touch: 'Tap Launch' },
    { keys: ['↓', 'S'], does: 'Burn backward: drop to a lower, faster orbit', touch: 'Tap the left button' },
    { keys: ['↑', 'W'], does: 'Burn forward: climb to a higher, slower orbit', touch: 'Tap the right button' },
  ],
  parts: [
    { name: 'The Moon and the descent stage', meaning: 'The gold block on the Moon is the descent stage. It stays as the launch pad.' },
    { name: 'Columbia', meaning: 'The blue ship, moving on the blue orbit. You have to catch up with it.' },
    { name: 'Eagle', meaning: 'The gold ship. You are Eagle.' },
    { name: 'Columbia is… ahead / behind', meaning: 'How many degrees of orbit separate you. To dock you need to be within a few degrees on Columbia’s own orbit.' },
    { name: 'Speed · Eagle vs Columbia', meaning: 'Both speeds in degrees per second. Green means you are faster than Columbia, so you are catching up.' },
    { name: 'Burns left', meaning: 'Each burn moves you one orbit up or down. You only have a few.' },
  ],
  steps: [
    { text: 'Press Start. Look at the orbits: the lower the ring, the faster you go around.', keys: ['Space', 'Enter'], pointer: true },
    { text: 'If you are on the ground, press Space to launch. Level 2 starts you already in orbit.', keys: ['Space'] },
    { text: 'Columbia is AHEAD of you. Press ↓ to burn backward and drop to a lower orbit. Watch your speed turn green.', keys: ['ArrowDown', 'KeyS'] },
    { text: 'You are now faster and closing in. When you are right behind Columbia, press ↑ to climb back onto its orbit.', keys: ['ArrowUp', 'KeyW'] },
    { text: 'To catch something ahead, go lower and wait, then climb. In the real levels you have limited burns and time. Ready?' },
  ],
} satisfies Tutorial
